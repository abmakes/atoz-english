import { TimerManager, TimerStatus, TimerType, TimerInstance } from '@/lib/pixi-engine/game/TimerManager';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { StorageManager } from '@/lib/pixi-engine/core/StorageManager';
import { TIMER_EVENTS, TimerEventPayload } from '@/lib/pixi-engine/core/EventTypes';

// Mocks
jest.mock('@/lib/pixi-engine/core/EventBus');
jest.mock('@/lib/pixi-engine/core/StorageManager');

const MockedEventBus = EventBus as jest.MockedClass<typeof EventBus>;
const MockedStorageManager = StorageManager as jest.MockedClass<typeof StorageManager>;

describe('TimerManager', () => {
  let timerManager: TimerManager;
  let mockEventBusInstance: jest.Mocked<EventBus>;
  let mockStorageManagerInstance: jest.Mocked<StorageManager>;
  let mockStorage: Record<string, unknown> = {};

  beforeEach(() => {
    // Enable Jest fake timers
    jest.useFakeTimers();

    MockedEventBus.mockClear();
    MockedStorageManager.mockClear();
    mockStorage = {};

    mockEventBusInstance = new MockedEventBus() as jest.Mocked<EventBus>;
    mockStorageManagerInstance = new MockedStorageManager() as jest.Mocked<StorageManager>;

    // Mock StorageManager behavior
    mockStorageManagerInstance.get = jest.fn((key: string): unknown | null => mockStorage[key] ?? null);
    mockStorageManagerInstance.set = jest.fn((key: string, value: unknown) => { mockStorage[key] = value; });
    mockStorageManagerInstance.remove = jest.fn((key: string) => { delete mockStorage[key]; });
    mockStorageManagerInstance.isStorageAvailable = jest.fn(() => true);

    // Instantiate TimerManager AFTER mocks are set up
    timerManager = new TimerManager(mockEventBusInstance, mockStorageManagerInstance);
  });

  afterEach(() => {
    // Disable fake timers after each test
    jest.useRealTimers();
  });

  // --- Creation and Basic State ---
  it('should create a timer with default values', () => {
    const timer = timerManager.createTimer('timer1', 10000);
    expect(timer).toEqual(expect.objectContaining({
      id: 'timer1',
      duration: 10000,
      type: TimerType.COUNTDOWN,
      status: TimerStatus.IDLE,
      elapsed: 0,
      speedMultiplier: 1,
    }));
    expect(timerManager.getTimer('timer1')).toBeDefined();
    // TIMER_STARTED event is emitted by startTimer, not createTimer
    expect(mockEventBusInstance.emit).not.toHaveBeenCalledWith(TIMER_EVENTS.TIMER_STARTED, expect.anything());
  });

  it('should overwrite an existing timer if created with the same ID', () => {
    // Create the first timer (assignment removed)
    timerManager.createTimer('timer1', 10000);
    // Create the second timer with the same ID
    const timer2 = timerManager.createTimer('timer1', 5000, TimerType.COUNTUP);
    expect(timer2.duration).toBe(5000);
    expect(timer2.type).toBe(TimerType.COUNTUP);
    expect(timerManager.getAllTimers().length).toBe(1); // Should only be one timer with this ID
  });

  it('should throw error if creating countdown timer with zero or negative duration', () => {
      expect(() => timerManager.createTimer('timerError', 0, TimerType.COUNTDOWN)).toThrow();
      expect(() => timerManager.createTimer('timerError2', -100, TimerType.COUNTDOWN)).toThrow();
  });

  // --- Control Methods ---
  it('should start a timer', () => {
    timerManager.createTimer('timerStart', 5000);
    timerManager.startTimer('timerStart');
    const timer = timerManager.getTimer('timerStart');

    expect(timer?.status).toBe(TimerStatus.RUNNING);
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(TIMER_EVENTS.TIMER_STARTED, { timerId: 'timerStart' });
    // Check if tick loop has been initiated (indirectly)
    expect(jest.getTimerCount()).toBeGreaterThan(0); // RAF should be scheduled
  });

  it('should pause a running timer', () => {
    timerManager.createTimer('timerPause', 5000);
    timerManager.startTimer('timerPause');
    jest.advanceTimersByTime(1000); // Advance time
    timerManager.pauseTimer('timerPause');
    const timer = timerManager.getTimer('timerPause');

    expect(timer?.status).toBe(TimerStatus.PAUSED);
    expect(timer?.elapsed).toBeCloseTo(1000, -2); // Check elapsed time
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(TIMER_EVENTS.TIMER_PAUSED, { timerId: 'timerPause' });
    // Tick loop should effectively stop for this timer
  });

  it('should resume a paused timer', () => {
    timerManager.createTimer('timerResume', 5000);
    timerManager.startTimer('timerResume');
    jest.advanceTimersByTime(1000);
    timerManager.pauseTimer('timerResume');
    const elapsedBeforeResume = timerManager.getElapsedTime('timerResume');

    timerManager.resumeTimer('timerResume');
    const timer = timerManager.getTimer('timerResume');
    expect(timer?.status).toBe(TimerStatus.RUNNING);
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(TIMER_EVENTS.TIMER_RESUMED, { timerId: 'timerResume' });

    jest.advanceTimersByTime(500);
    expect(timerManager.getElapsedTime('timerResume')).toBeCloseTo(elapsedBeforeResume + 500, -2);
  });

  it('should reset a timer', () => {
    timerManager.createTimer('timerReset', 5000);
    timerManager.startTimer('timerReset');
    jest.advanceTimersByTime(1000);
    timerManager.resetTimer('timerReset');
    const timer = timerManager.getTimer('timerReset');

    expect(timer?.status).toBe(TimerStatus.IDLE);
    expect(timer?.elapsed).toBe(0);
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(TIMER_EVENTS.TIMER_STOPPED, { timerId: 'timerReset' });
  });

  it('should remove a timer', () => {
    timerManager.createTimer('timerRemove', 5000);
    timerManager.startTimer('timerRemove');
    const callback = jest.fn();
    timerManager.onTimerComplete('timerRemove', callback);

    timerManager.removeTimer('timerRemove');
    expect(timerManager.getTimer('timerRemove')).toBeUndefined();
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(TIMER_EVENTS.TIMER_STOPPED, { timerId: 'timerRemove' });
    // Check if callbacks are removed (indirectly by testing completion)
    // Need a way to check internal callback map or test lack of callback execution after removal
  });

  // --- Ticking and Completion ---
  it('should update elapsed time while running', () => {
    timerManager.createTimer('timerTick', 5000);
    timerManager.startTimer('timerTick');
    jest.advanceTimersByTime(1000);
    expect(timerManager.getElapsedTime('timerTick')).toBeCloseTo(1000, -2);
    jest.advanceTimersByTime(1500);
    expect(timerManager.getElapsedTime('timerTick')).toBeCloseTo(2500, -2);
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(TIMER_EVENTS.TIMER_TICK, expect.any(Object));
  });

  it('should complete a countdown timer and emit event', () => {
    const duration = 3000;
    timerManager.createTimer('timerComplete', duration);
    timerManager.startTimer('timerComplete');
    jest.advanceTimersByTime(duration + 100); // Advance past duration
    const timer = timerManager.getTimer('timerComplete');

    expect(timer?.status).toBe(TimerStatus.COMPLETED);
    expect(timer?.elapsed).toBeCloseTo(duration, -2); // Should clamp to duration
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(TIMER_EVENTS.TIMER_COMPLETED, expect.objectContaining({ timerId: 'timerComplete' }));
  });

  // --- Status Methods ---
  it('should correctly report if a timer is running', () => {
    timerManager.createTimer('timerIsRunning', 1000);
    expect(timerManager.isRunning('timerIsRunning')).toBe(false);
    timerManager.startTimer('timerIsRunning');
    expect(timerManager.isRunning('timerIsRunning')).toBe(true);
    timerManager.pauseTimer('timerIsRunning');
    expect(timerManager.isRunning('timerIsRunning')).toBe(false);
    timerManager.resumeTimer('timerIsRunning');
    expect(timerManager.isRunning('timerIsRunning')).toBe(true);
    jest.advanceTimersByTime(1100);
    expect(timerManager.isRunning('timerIsRunning')).toBe(false); // Completed
  });

  it('should get the correct time remaining for countdown timers', () => {
    timerManager.createTimer('timerRemaining', 5000);
    timerManager.startTimer('timerRemaining');
    jest.advanceTimersByTime(1500);
    expect(timerManager.getTimeRemaining('timerRemaining')).toBeCloseTo(3500, -2);
    timerManager.pauseTimer('timerRemaining');
    expect(timerManager.getTimeRemaining('timerRemaining')).toBeCloseTo(3500, -2);
    jest.advanceTimersByTime(5000); // Time passes while paused
    expect(timerManager.getTimeRemaining('timerRemaining')).toBeCloseTo(3500, -2);
    timerManager.resumeTimer('timerRemaining');
    jest.advanceTimersByTime(4000); // Advance past completion
    expect(timerManager.getTimeRemaining('timerRemaining')).toBe(0);
  });

  // --- Advanced Features ---

  it('should set timer speed and affect elapsed time', () => {
    timerManager.createTimer('timerSpeed', 10000);
    timerManager.setTimerSpeed('timerSpeed', 2); // Double speed
    timerManager.startTimer('timerSpeed');
    jest.advanceTimersByTime(1000); // 1 real second passes
    // Elapsed time should be ~2000ms due to speed multiplier
    expect(timerManager.getElapsedTime('timerSpeed')).toBeCloseTo(2000, -2);
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(TIMER_EVENTS.TIMER_MODIFIED, { timerId: 'timerSpeed' });

    timerManager.setTimerSpeed('timerSpeed', 0.5); // Half speed
    jest.advanceTimersByTime(1000); // 1 more real second passes
     // Should have added ~500ms (1000 * 0.5) to the previous ~2000ms
    expect(timerManager.getElapsedTime('timerSpeed')).toBeCloseTo(2500, -2);
  });

  it('should call completion callbacks when timer completes', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    timerManager.createTimer('timerCallback', 2000);
    timerManager.onTimerComplete('timerCallback', callback1);
    timerManager.onTimerComplete('timerCallback', callback2);

    timerManager.startTimer('timerCallback');
    jest.advanceTimersByTime(1000);
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1500); // Advance past completion
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    // Check payload passed to callback
    expect(callback1).toHaveBeenCalledWith(expect.objectContaining({ id: 'timerCallback', status: TimerStatus.COMPLETED }));

    // Callbacks should be cleared after execution
    timerManager.resetTimer('timerCallback');
    timerManager.startTimer('timerCallback');
    jest.advanceTimersByTime(2500);
    expect(callback1).toHaveBeenCalledTimes(1); // Should not be called again
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should remove specific completion callback', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    timerManager.createTimer('timerRemoveCb', 2000);
    timerManager.onTimerComplete('timerRemoveCb', callback1);
    timerManager.onTimerComplete('timerRemoveCb', callback2);
    timerManager.offTimerComplete('timerRemoveCb', callback1);

    timerManager.startTimer('timerRemoveCb');
    jest.advanceTimersByTime(2500);
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should remove all completion callbacks for a timer', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    timerManager.createTimer('timerRemoveAllCb', 2000);
    timerManager.onTimerComplete('timerRemoveAllCb', callback1);
    timerManager.onTimerComplete('timerRemoveAllCb', callback2);
    timerManager.offTimerComplete('timerRemoveAllCb'); // No callback specified

    timerManager.startTimer('timerRemoveAllCb');
    jest.advanceTimersByTime(2500);
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });

  it('should pause all running timers', () => {
      timerManager.createTimer('pauseAll1', 1000);
      timerManager.createTimer('pauseAll2', 1000);
      timerManager.createTimer('pauseAll3', 1000);
      timerManager.startTimer('pauseAll1');
      timerManager.startTimer('pauseAll2');
      // pauseAll3 remains IDLE

      timerManager.pauseAll();

      expect(timerManager.getTimer('pauseAll1')?.status).toBe(TimerStatus.PAUSED);
      expect(timerManager.getTimer('pauseAll2')?.status).toBe(TimerStatus.PAUSED);
      expect(timerManager.getTimer('pauseAll3')?.status).toBe(TimerStatus.IDLE);
  });

  it('should resume all paused timers', () => {
      timerManager.createTimer('resumeAll1', 1000);
      timerManager.createTimer('resumeAll2', 1000);
      timerManager.createTimer('resumeAll3', 1000);
      timerManager.startTimer('resumeAll1');
      timerManager.startTimer('resumeAll2');
      timerManager.pauseTimer('resumeAll1');
      // resumeAll2 remains RUNNING
      // resumeAll3 remains IDLE

      timerManager.resumeAll();

      expect(timerManager.getTimer('resumeAll1')?.status).toBe(TimerStatus.RUNNING);
      expect(timerManager.getTimer('resumeAll2')?.status).toBe(TimerStatus.RUNNING); // Should still be running
      expect(timerManager.getTimer('resumeAll3')?.status).toBe(TimerStatus.IDLE);
  });

  it('should format time correctly using static method', () => {
      expect(TimerManager.formatTime(0)).toBe('00:00.000');
      expect(TimerManager.formatTime(543)).toBe('00:00.543');
      expect(TimerManager.formatTime(12345)).toBe('00:12.345');
      expect(TimerManager.formatTime(67890)).toBe('01:07.890');
      expect(TimerManager.formatTime(3600000)).toBe('60:00.000'); // 1 hour
  });

}); 