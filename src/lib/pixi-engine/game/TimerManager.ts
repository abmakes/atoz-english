import { EventBus } from '../core/EventBus';
import { TIMER_EVENTS, TimerEventPayload } from '../core/EventTypes';
import { StorageManager } from '../core/StorageManager';

export enum TimerType {
  COUNTDOWN = 'countdown',
  COUNTUP = 'countup',
}

export enum TimerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export interface TimerInstance {
  id: string;
  type: TimerType;
  status: TimerStatus;
  duration: number;       // Target duration (relevant for countdown)
  startTime: number;      // Timestamp when the timer last started/resumed
  pauseTime: number;      // Timestamp when the timer was paused
  elapsed: number;        // Total elapsed time in ms while running
  rafId: number | null;   // ID for requestAnimationFrame
  speedMultiplier: number; // Added for speed control
}

// Type for the completion callback
type TimerCompletionCallback = (timer: Readonly<TimerInstance>) => void;

/**
 * Manages timers (countdown/countup), persists state, and emits events.
 */
export class TimerManager {
  private timers: Map<string, TimerInstance> = new Map();
  // Added for completion callbacks
  private completionCallbacks: Map<string, Array<TimerCompletionCallback>> = new Map();
  private readonly STORAGE_KEY = 'timer/timers';
  private isTicking: boolean = false; // Flag to manage the global tick loop

  constructor(
    private eventBus: EventBus,
    private storageManager: StorageManager
  ) {
    this._loadTimers();
    // Check if any loaded timers were running and need restarting
    this.timers.forEach(timer => {
      if (timer.status === TimerStatus.RUNNING) {
        // Treat as paused on load, requires explicit resume
        timer.status = TimerStatus.PAUSED;
        console.warn(`TimerManager: Loaded timer '${timer.id}' was running. Set to PAUSED.`);
      }
      // Always clear rafId on load
      timer.rafId = null;
      // Initialize speedMultiplier if loading from older state
      timer.speedMultiplier = timer.speedMultiplier ?? 1;
    });
    this._saveTimers(); // Save potentially modified statuses
  }

  // --- Public Timer Creation ---

  public createTimer(
      id: string,
      duration: number = 0,
      type: TimerType = TimerType.COUNTDOWN,
      speedMultiplier: number = 1 // Add optional speed multiplier on creation
  ): TimerInstance {
      if (this.timers.has(id)) {
          console.warn(`TimerManager: Timer with id '${id}' already exists. Overwriting.`);
          this.removeTimer(id); // Remove completely including callbacks before creating new
      }
      if (type === TimerType.COUNTDOWN && duration <= 0) {
          throw new Error('TimerManager: Countdown timers require a positive duration.');
      }

      const newTimer: TimerInstance = {
          id,
          type,
          duration,
          status: TimerStatus.IDLE,
          startTime: 0,
          pauseTime: 0,
          elapsed: 0,
          rafId: null,
          speedMultiplier: Math.max(0, speedMultiplier) // Ensure non-negative multiplier
      };
      this.timers.set(id, newTimer);
      this._saveTimers();
      this.eventBus.emit(TIMER_EVENTS.TIMER_STARTED, { timerId: id, duration: newTimer.duration });
      return { ...newTimer }; // Return a copy
  }

  // --- Persistence ---

  private _loadTimers(): void {
    try {
      const savedTimersData = this.storageManager.get<Record<string, Omit<TimerInstance, 'rafId'>>>(this.STORAGE_KEY);
      if (savedTimersData && typeof savedTimersData === 'object') {
        const loadedTimers = new Map<string, TimerInstance>();
        Object.entries(savedTimersData).forEach(([key, savedTimer]) => {
            const timerId = key;
            // Basic validation
            if (typeof savedTimer?.elapsed !== 'number' || typeof savedTimer?.duration !== 'number') {
              console.warn(`TimerManager: Invalid timer data found for key ${key} during load. Skipping.`);
              return;
            }
            loadedTimers.set(timerId, {
                ...(savedTimer as Omit<TimerInstance, 'rafId'>),
                id: timerId,
                rafId: null,
                // Ensure loaded running timers are set to paused
                status: savedTimer.status === TimerStatus.RUNNING ? TimerStatus.PAUSED : (savedTimer.status || TimerStatus.IDLE),
                startTime: savedTimer.startTime || 0,
                pauseTime: savedTimer.pauseTime || 0,
                elapsed: savedTimer.elapsed || 0,
                type: savedTimer.type || TimerType.COUNTDOWN,
                duration: savedTimer.duration || 0,
                speedMultiplier: savedTimer.speedMultiplier ?? 1, // Load speed or default to 1
            });
        });
        this.timers = loadedTimers;
        console.debug(`TimerManager: Loaded ${this.timers.size} timers.`);
      } else {
        this.timers = new Map();
      }
    } catch (error) {
      console.error("TimerManager: Failed to load timers from storage.", error);
      this.timers = new Map();
    }
  }

  private _saveTimers(): void {
    try {
      const timersToSave: Record<string, Omit<TimerInstance, 'rafId'>> = {};
      this.timers.forEach((timer, id) => {
          // Create a copy of the timer object excluding rafId
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { rafId, ...rest } = timer; // Keep rafId in destructuring but ignore it
          timersToSave[id] = rest; // Save only the rest of the properties
      });
      this.storageManager.set(this.STORAGE_KEY, timersToSave);
    } catch (error) {
      console.error("TimerManager: Failed to save timers to storage.", error);
    }
  }

  // --- Helper Method ---
  private _getTimerOrFail(id: string): TimerInstance {
    const timer = this.timers.get(id);
    if (!timer) {
        throw new Error(`TimerManager: Timer with id '${id}' not found.`);
    }
    return timer;
  }

  // --- Ticking Logic (Implementation) ---
  private _tick(): void {
    if (!this.isTicking) return;

    const now = Date.now();
    let hasRunningTimers = false;

    this.timers.forEach((timer) => {
        if (timer.status !== TimerStatus.RUNNING) return;

        hasRunningTimers = true;
        const deltaTime = now - timer.startTime;
        timer.elapsed += deltaTime * timer.speedMultiplier;
        timer.startTime = now;

        // Emit update event (can be throttled if needed)
        const payload: TimerEventPayload = {
            timerId: timer.id,
            elapsed: timer.elapsed,
            remaining: timer.type === TimerType.COUNTDOWN ? Math.max(0, timer.duration - timer.elapsed) : undefined,
            duration: timer.duration
        };
        this.eventBus.emit(TIMER_EVENTS.TIMER_TICK, payload);

        // Check for completion
        if (timer.type === TimerType.COUNTDOWN && timer.elapsed >= timer.duration) {
            timer.status = TimerStatus.COMPLETED;
            timer.elapsed = timer.duration;
            timer.rafId = null;
            this.eventBus.emit(TIMER_EVENTS.TIMER_COMPLETED, { timerId: timer.id, duration: timer.duration, elapsed: timer.elapsed });
            console.debug(`TimerManager: Timer '${timer.id}' completed.`);

            // Execute completion callbacks
            this._executeCallbacks(timer.id);
        }
    });

    this._saveTimers(); // Save state potentially every frame (consider debouncing/throttling later if performance issue)

    if (hasRunningTimers) {
        // Schedule the next tick
        requestAnimationFrame(this._tick.bind(this));
    } else {
        // No running timers, stop the global loop
        this.isTicking = false;
        console.debug("TimerManager: No running timers, stopping global tick.");
    }
  }

  private _startGlobalTick(): void {
    if (!this.isTicking) {
        this.isTicking = true;
        console.debug("TimerManager: Starting global tick.");
        // Set initial startTime for all newly started timers before the first tick
        const now = Date.now();
        this.timers.forEach(timer => {
          if(timer.status === TimerStatus.RUNNING && timer.startTime === 0) {
             timer.startTime = now;
          }
        });
        requestAnimationFrame(this._tick.bind(this));
    }
  }

  private _stopGlobalTick(): void {
    // The tick loop stops itself when no timers are running
    // This method is more for forceful external stops if needed
    this.isTicking = false;
    console.debug("TimerManager: Forcefully stopping global tick requested.");
  }

  // Execute and clear callbacks for a given timer ID
  private _executeCallbacks(id: string): void {
    const callbacks = this.completionCallbacks.get(id);
    const timer = this.timers.get(id); // Get the final state
    if (callbacks && timer) {
      console.debug(`TimerManager: Executing ${callbacks.length} completion callbacks for timer '${id}'.`);
      // Pass a readonly copy of the timer state to callbacks
      const timerState = { ...timer };
      callbacks.forEach(callback => {
        try {
          callback(timerState);
        } catch (error) {
          console.error(`TimerManager: Error in completion callback for timer '${id}':`, error);
        }
      });
      // Clear callbacks after execution
      this.completionCallbacks.delete(id);
    }
  }

  // --- Control Methods (Implementation) ---
  public startTimer(id: string): void {
      const timer = this._getTimerOrFail(id);
      if (timer.status === TimerStatus.RUNNING) return; // Already running
      if (timer.status === TimerStatus.COMPLETED) {
          console.warn(`TimerManager: Timer '${id}' is already completed. Reset before starting.`);
          return;
      }

      timer.startTime = Date.now();
      timer.status = TimerStatus.RUNNING;
      timer.pauseTime = 0; // Clear pause time
      this._saveTimers();
      this._startGlobalTick(); // Ensure the global tick loop is running
      this.eventBus.emit(TIMER_EVENTS.TIMER_STARTED, { timerId: id, duration: timer.duration });
      console.debug(`TimerManager: Started timer '${id}'.`);
  }

  public pauseTimer(id: string): void {
      const timer = this._getTimerOrFail(id);
      if (timer.status !== TimerStatus.RUNNING) return; // Can only pause running timers

      timer.status = TimerStatus.PAUSED;
      timer.pauseTime = Date.now(); // Record pause time
      // Elapsed time is updated implicitly in _tick just before pausing effectively
      // No need to explicitly cancel RAF here, _tick loop will ignore paused timers
      this._saveTimers();
      this.eventBus.emit(TIMER_EVENTS.TIMER_PAUSED, { timerId: id });
      console.debug(`TimerManager: Paused timer '${id}'.`);
  }

  public resumeTimer(id: string): void {
      const timer = this._getTimerOrFail(id);
      if (timer.status !== TimerStatus.PAUSED) return; // Can only resume paused timers

      // Adjust start time to effectively ignore the paused duration
      timer.startTime = Date.now(); // Reset start time for delta calculations in _tick
      timer.pauseTime = 0; // Clear pause time
      timer.status = TimerStatus.RUNNING;
      this._saveTimers();
      this._startGlobalTick(); // Ensure the global tick loop is running
      this.eventBus.emit(TIMER_EVENTS.TIMER_RESUMED, { timerId: id });
      console.debug(`TimerManager: Resumed timer '${id}'.`);
  }

  public resetTimer(id: string): void {
      const timer = this._getTimerOrFail(id);
      const wasRunning = timer.status === TimerStatus.RUNNING;
      timer.status = TimerStatus.IDLE;
      timer.elapsed = 0;
      timer.startTime = 0;
      timer.pauseTime = 0;
      // No need to explicitly cancel RAF here, _tick loop ignores non-running timers
      this._saveTimers();
      // Emit stopped event only if it was actually running before reset
      if (wasRunning) {
          this.eventBus.emit(TIMER_EVENTS.TIMER_STOPPED, { timerId: id });
      }
      console.debug(`TimerManager: Reset timer '${id}'.`);
  }

  public removeTimer(id: string): void {
      if (this.timers.has(id)) {
          const timer = this._getTimerOrFail(id); // Get timer before deleting
          const wasRunning = timer.status === TimerStatus.RUNNING;
          this.timers.delete(id);
          // Also remove any completion callbacks associated with this timer
          this.completionCallbacks.delete(id);
          this._saveTimers();
          // Emit stopped if it was running, otherwise just removed might be sufficient?
          // Let's emit STOPPED for consistency if it was running.
          if (wasRunning) {
              this.eventBus.emit(TIMER_EVENTS.TIMER_STOPPED, { timerId: id });
          }
          // Add a specific TIMER_REMOVED event? Or is STOPPED enough?
          // Let's assume STOPPED is sufficient for now.
          console.debug(`TimerManager: Removed timer '${id}'.`);
      } else {
          console.warn(`TimerManager: Cannot remove non-existent timer '${id}'.`);
      }
  }

  public stopAllTimers(): void {
      this.timers.forEach(timer => {
          if (timer.status === TimerStatus.RUNNING || timer.status === TimerStatus.PAUSED) {
              this.resetTimer(timer.id); // Resetting effectively stops them
          }
          // Clear callbacks for all timers when stopping all
          this.completionCallbacks.delete(timer.id);
      });
      this._stopGlobalTick(); // Ensure the loop stops if it hasn't already
      console.debug("TimerManager: Stopped and cleared callbacks for all timers.");
  }

  public pauseAll(): void {
      let pausedCount = 0;
      this.timers.forEach(timer => {
          if (timer.status === TimerStatus.RUNNING) {
              this.pauseTimer(timer.id);
              pausedCount++;
          }
      });
      console.debug(`TimerManager: Paused ${pausedCount} running timers.`);
  }

  public resumeAll(): void {
      let resumedCount = 0;
      this.timers.forEach(timer => {
          if (timer.status === TimerStatus.PAUSED) {
              this.resumeTimer(timer.id);
              resumedCount++;
          }
      });
      console.debug(`TimerManager: Resumed ${resumedCount} paused timers.`);
  }

  public setTimerSpeed(id: string, multiplier: number): void {
      const timer = this._getTimerOrFail(id);
      // Ensure multiplier is non-negative
      timer.speedMultiplier = Math.max(0, multiplier);
      this._saveTimers(); // Persist the new speed
      this.eventBus.emit(TIMER_EVENTS.TIMER_MODIFIED, { timerId: id }); // Emit generic modified event
      console.debug(`TimerManager: Set speed for timer '${id}' to ${timer.speedMultiplier}.`);
  }

  // --- Completion Callbacks ---

  public onTimerComplete(id: string, callback: TimerCompletionCallback): void {
      const timer = this.timers.get(id);
      if (!timer) {
          console.warn(`TimerManager: Cannot set completion callback for non-existent timer '${id}'.`);
          return;
      }
      // Do not add callback if timer is already completed
      if (timer.status === TimerStatus.COMPLETED) {
          console.warn(`TimerManager: Timer '${id}' already completed. Cannot add completion callback.`);
          return;
      }

      if (!this.completionCallbacks.has(id)) {
          this.completionCallbacks.set(id, []);
      }
      this.completionCallbacks.get(id)!.push(callback);
      console.debug(`TimerManager: Added completion callback for timer '${id}'.`);
  }

  public offTimerComplete(id: string, callback?: TimerCompletionCallback): void {
      if (!this.completionCallbacks.has(id)) {
          return; // No callbacks registered for this ID
      }

      if (!callback) {
          // Remove all callbacks for this timer ID
          this.completionCallbacks.delete(id);
          console.debug(`TimerManager: Removed all completion callbacks for timer '${id}'.`);
      } else {
          // Remove a specific callback
          const callbacks = this.completionCallbacks.get(id)!;
          const index = callbacks.indexOf(callback);
          if (index !== -1) {
              callbacks.splice(index, 1);
              console.debug(`TimerManager: Removed specific completion callback for timer '${id}'.`);
              // If no callbacks remain, remove the map entry
              if (callbacks.length === 0) {
                  this.completionCallbacks.delete(id);
              }
          } else {
              console.warn(`TimerManager: Specific callback not found for timer '${id}'.`);
          }
      }
  }

  // --- Status Methods (Implementation) ---
  public getElapsedTime(id: string): number {
      const timer = this.getTimer(id);
      if (!timer) return 0;

      // If running, calculate current elapsed time including the latest delta
      if (timer.status === TimerStatus.RUNNING) {
          return timer.elapsed + (Date.now() - timer.startTime);
      }
      // If paused or completed or idle, return the stored elapsed time
      return timer.elapsed;
  }

  public getTimeRemaining(id: string): number {
      const timer = this.getTimer(id);
      if (!timer || timer.type !== TimerType.COUNTDOWN) return 0;

      const elapsed = this.getElapsedTime(id);
      return Math.max(0, timer.duration - elapsed);
  }

  public isRunning(id: string): boolean {
      const timer = this.getTimer(id);
      return timer?.status === TimerStatus.RUNNING;
  }

  public getTimer(id: string): TimerInstance | undefined {
      const timer = this.timers.get(id);
      return timer ? { ...timer } : undefined; // Return a copy
  }

  public getAllTimers(): TimerInstance[] {
      // Return copies of all timers
      return Array.from(this.timers.values()).map(timer => ({ ...timer }));
  }

  // --- Static Utility Methods ---

  /**
   * Formats a duration in milliseconds into a string (MM:SS.sss).
   * @param milliseconds The duration in milliseconds.
   * @returns A formatted time string.
   */
  public static formatTime(milliseconds: number): string {
    if (milliseconds < 0) milliseconds = 0;

    const totalSeconds = Math.floor(milliseconds / 1000);
    const ms = Math.floor(milliseconds % 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    // Add hours if needed:
    // const hours = Math.floor(minutes / 60);
    // const displayMinutes = minutes % 60;

    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    const sss = String(ms).padStart(3, '0');

    // return `${hh}:${mm}:${ss}.${sss}`; // With hours
    return `${mm}:${ss}.${sss}`;
  }
}
