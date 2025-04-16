import { ScoringManager } from '@/lib/pixi-engine/game/ScoringManager';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { StorageManager } from '@/lib/pixi-engine/core/StorageManager';
import { SCORING_EVENTS, ScoringScoreUpdatedPayload, ScoringLifeLostPayload } from '@/lib/pixi-engine/core/EventTypes';

// Mocks
jest.mock('@/lib/pixi-engine/core/EventBus');
jest.mock('@/lib/pixi-engine/core/StorageManager');

const MockedEventBus = EventBus as jest.MockedClass<typeof EventBus>; // Get mocked constructor
const MockedStorageManager = StorageManager as jest.MockedClass<typeof StorageManager>;

describe('ScoringManager', () => {
  let scoringManager: ScoringManager;
  let mockEventBusInstance: jest.Mocked<EventBus>;
  let mockStorageManagerInstance: jest.Mocked<StorageManager>;

  // Simulate storage for the mock
  let mockStorage: Record<string, unknown> = {};

  beforeEach(() => {
    // Clear mocks and storage before each test
    MockedEventBus.mockClear();
    MockedStorageManager.mockClear();
    mockStorage = {};

    // Create mock instances
    mockEventBusInstance = new MockedEventBus() as jest.Mocked<EventBus>;
    mockStorageManagerInstance = new MockedStorageManager() as jest.Mocked<StorageManager>;

    // Implement mock StorageManager behavior
    mockStorageManagerInstance.get = jest.fn((key: string): unknown | null => {
      return mockStorage[key] ?? null;
    });
    mockStorageManagerInstance.set = jest.fn((key: string, value: unknown) => {
      mockStorage[key] = value;
    });
    mockStorageManagerInstance.remove = jest.fn((key: string) => {
        delete mockStorage[key];
    });
    // Mock isStorageAvailable to be true for tests
    mockStorageManagerInstance.isStorageAvailable = jest.fn(() => true);

    // Instantiate ScoringManager with mock dependencies
    scoringManager = new ScoringManager(mockEventBusInstance, mockStorageManagerInstance);
  });

  // --- Score Tests ---

  it('should initialize scores and lives from storage (if available)', () => {
    mockStorage = {
      'scoring/scores': { team1: 50, team2: 30 },
      'scoring/lives': { team1: 3, team2: 1 },
    };
    // Re-initialize with pre-populated mock storage
    scoringManager = new ScoringManager(mockEventBusInstance, mockStorageManagerInstance);

    expect(scoringManager.getScore('team1')).toBe(50);
    expect(scoringManager.getScore('team2')).toBe(30);
    expect(scoringManager.getLives('team1')).toBe(3);
    expect(scoringManager.getLives('team2')).toBe(1);
    expect(mockStorageManagerInstance.get).toHaveBeenCalledWith('scoring/scores');
    expect(mockStorageManagerInstance.get).toHaveBeenCalledWith('scoring/lives');
  });

  it('should add score correctly and emit event', () => {
    const teamId = 'teamA';
    const initialScore = scoringManager.getScore(teamId);
    const pointsToAdd = 10;
    const newScore = scoringManager.addScore(teamId, pointsToAdd);

    expect(newScore).toBe(initialScore + pointsToAdd);
    expect(scoringManager.getScore(teamId)).toBe(newScore);
    expect(mockStorageManagerInstance.set).toHaveBeenCalledWith('scoring/scores', { [teamId]: newScore });
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(
        SCORING_EVENTS.SCORE_UPDATED,
        expect.objectContaining({ teamId: teamId, currentScore: newScore })
    );
    const scoreUpdateCall = mockEventBusInstance.emit.mock.calls.find(call => call[0] === SCORING_EVENTS.SCORE_UPDATED);
    expect(scoreUpdateCall).toBeDefined();
    const emittedPayload = scoreUpdateCall![1] as ScoringScoreUpdatedPayload;
    expect(emittedPayload.teamId).toBe(teamId);
    expect(emittedPayload.currentScore).toBe(newScore);
  });

   it('should not add negative score', () => {
    const teamId = 'teamA';
    const initialScore = scoringManager.getScore(teamId);
    const newScore = scoringManager.addScore(teamId, -5);

    expect(newScore).toBe(initialScore);
    expect(scoringManager.getScore(teamId)).toBe(initialScore);
    expect(mockStorageManagerInstance.set).not.toHaveBeenCalled();
    expect(mockEventBusInstance.emit).not.toHaveBeenCalled();
  });

  it('should subtract score correctly and emit event', () => {
    const teamId = 'teamB';
    scoringManager.addScore(teamId, 50); // Set initial score
    mockEventBusInstance.emit.mockClear(); // Clear emit mock after setup
    mockStorageManagerInstance.set.mockClear();

    const pointsToSubtract = 20;
    const newScore = scoringManager.subtractScore(teamId, pointsToSubtract);

    expect(newScore).toBe(30);
    expect(scoringManager.getScore(teamId)).toBe(30);
    expect(mockStorageManagerInstance.set).toHaveBeenCalledWith('scoring/scores', { [teamId]: 30 });
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(
        SCORING_EVENTS.SCORE_UPDATED,
        expect.objectContaining({ teamId: teamId, currentScore: 30 })
    );
    const scoreUpdateCall = mockEventBusInstance.emit.mock.calls.find(call => call[0] === SCORING_EVENTS.SCORE_UPDATED);
    expect(scoreUpdateCall).toBeDefined();
    const emittedPayload = scoreUpdateCall![1] as ScoringScoreUpdatedPayload;
    expect(emittedPayload.teamId).toBe(teamId);
    expect(emittedPayload.currentScore).toBe(30);
  });

  it('should not subtract negative score', () => {
    const teamId = 'teamB';
    scoringManager.addScore(teamId, 50);
    const initialScore = scoringManager.getScore(teamId);
    mockEventBusInstance.emit.mockClear();
    mockStorageManagerInstance.set.mockClear();

    const newScore = scoringManager.subtractScore(teamId, -10);

    expect(newScore).toBe(initialScore);
    expect(scoringManager.getScore(teamId)).toBe(initialScore);
    expect(mockStorageManagerInstance.set).not.toHaveBeenCalled();
    expect(mockEventBusInstance.emit).not.toHaveBeenCalled();
  });

  it('should prevent score from going below zero', () => {
    const teamId = 'teamC';
    scoringManager.addScore(teamId, 10);
    mockEventBusInstance.emit.mockClear();
    mockStorageManagerInstance.set.mockClear();

    const newScore = scoringManager.subtractScore(teamId, 25);

    expect(newScore).toBe(0);
    expect(scoringManager.getScore(teamId)).toBe(0);
    expect(mockStorageManagerInstance.set).toHaveBeenCalledWith('scoring/scores', { [teamId]: 0 });
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(SCORING_EVENTS.SCORE_UPDATED, { scores: expect.any(Map) });
  });

  it('should reset score for a team', () => {
    const teamId = 'teamD';
    scoringManager.addScore(teamId, 100);
    mockEventBusInstance.emit.mockClear();
    mockStorageManagerInstance.set.mockClear();

    scoringManager.resetScore(teamId);
    expect(scoringManager.getScore(teamId)).toBe(0);
    expect(mockStorageManagerInstance.set).toHaveBeenCalledWith('scoring/scores', { [teamId]: 0 });
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(
        SCORING_EVENTS.SCORE_UPDATED,
        expect.objectContaining({ teamId: teamId, currentScore: 0 })
    );
  });

  it('should reset all scores and lives', () => {
    scoringManager.addScore('teamE', 50);
    scoringManager.addScore('teamF', 60);
    scoringManager.setLives('teamE', 3);
    scoringManager.setLives('teamF', 2);
    mockEventBusInstance.emit.mockClear();
    mockStorageManagerInstance.set.mockClear();

    scoringManager.resetAll();

    expect(scoringManager.getAllScores().size).toBe(0);
    expect(scoringManager.getAllLives().size).toBe(0);
    expect(mockStorageManagerInstance.set).toHaveBeenCalledWith('scoring/scores', {});
    expect(mockStorageManagerInstance.set).toHaveBeenCalledWith('scoring/lives', {});
    // Should emit both score and lives updates
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(
        SCORING_EVENTS.SCORE_UPDATED,
        expect.any(Object)
    );
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(
        SCORING_EVENTS.LIFE_LOST,
        expect.any(Object)
    );

    // Payload checks might need adjustment based on actual events emitted by resetAll
  });

  // --- Lives Tests ---

  it('should set lives correctly and emit event', () => {
    const teamId = 'teamLife1';
    scoringManager.setLives(teamId, 3);
    expect(scoringManager.getLives(teamId)).toBe(3);
    expect(mockStorageManagerInstance.set).toHaveBeenCalledWith('scoring/lives', { [teamId]: 3 });
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(
        SCORING_EVENTS.LIFE_LOST,
        expect.objectContaining({ teamId: teamId, remainingLives: 3 })
     );
    const lifeLostCall = mockEventBusInstance.emit.mock.calls.find(call => call[0] === SCORING_EVENTS.LIFE_LOST);
    expect(lifeLostCall).toBeDefined();
    const emittedPayload = lifeLostCall![1] as ScoringLifeLostPayload;
    expect(emittedPayload.teamId).toBe(teamId);
    expect(emittedPayload.remainingLives).toBe(3);
  });

  it('should not set negative lives', () => {
    const teamId = 'teamLife1';
    scoringManager.setLives(teamId, -2);
    expect(scoringManager.getLives(teamId)).toBe(0);
    expect(mockStorageManagerInstance.set).toHaveBeenCalledWith('scoring/lives', { [teamId]: 0 });
    expect(mockEventBusInstance.emit).toHaveBeenCalled();
  });

  it('should add lives correctly', () => {
    const teamId = 'teamLife2';
    scoringManager.setLives(teamId, 2);
    mockEventBusInstance.emit.mockClear();
    mockStorageManagerInstance.set.mockClear();

    scoringManager.addLives(teamId, 3);
    expect(scoringManager.getLives(teamId)).toBe(5);
    expect(mockStorageManagerInstance.set).toHaveBeenCalledWith('scoring/lives', { [teamId]: 5 });
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(
        SCORING_EVENTS.LIFE_LOST,
        expect.objectContaining({ teamId: teamId, remainingLives: 5 })
     );
  });

  it('should not add negative lives count', () => {
    const teamId = 'teamLife2';
    scoringManager.setLives(teamId, 2);
    mockEventBusInstance.emit.mockClear();
    mockStorageManagerInstance.set.mockClear();

    scoringManager.addLives(teamId, -1);
    expect(scoringManager.getLives(teamId)).toBe(2); // Should remain unchanged
    expect(mockStorageManagerInstance.set).not.toHaveBeenCalled();
    expect(mockEventBusInstance.emit).not.toHaveBeenCalled();
  });

  it('should remove lives correctly', () => {
    const teamId = 'teamLife3';
    scoringManager.setLives(teamId, 5);
    mockEventBusInstance.emit.mockClear();
    mockStorageManagerInstance.set.mockClear();

    scoringManager.removeLives(teamId, 2);
    expect(scoringManager.getLives(teamId)).toBe(3);
    expect(mockStorageManagerInstance.set).toHaveBeenCalledWith('scoring/lives', { [teamId]: 3 });
    expect(mockEventBusInstance.emit).toHaveBeenCalledWith(
        SCORING_EVENTS.LIFE_LOST,
        expect.objectContaining({ teamId: teamId, remainingLives: 3 })
     );
  });

  it('should not remove negative lives count', () => {
     const teamId = 'teamLife3';
    scoringManager.setLives(teamId, 5);
    mockEventBusInstance.emit.mockClear();
    mockStorageManagerInstance.set.mockClear();

    scoringManager.removeLives(teamId, -2);
    expect(scoringManager.getLives(teamId)).toBe(5); // Should remain unchanged
    expect(mockStorageManagerInstance.set).not.toHaveBeenCalled();
    expect(mockEventBusInstance.emit).not.toHaveBeenCalled();
  });

  it('should prevent lives from going below zero when removing', () => {
    const teamId = 'teamLife4';
    scoringManager.setLives(teamId, 1);
    mockEventBusInstance.emit.mockClear();
    mockStorageManagerInstance.set.mockClear();

    scoringManager.removeLives(teamId, 3);
    expect(scoringManager.getLives(teamId)).toBe(0);
    expect(mockStorageManagerInstance.set).toHaveBeenCalledWith('scoring/lives', { [teamId]: 0 });
    expect(mockEventBusInstance.emit).toHaveBeenCalled();
  });

  it('should correctly report game over for a specific team', () => {
    scoringManager.setLives('teamLife5', 1);
    scoringManager.setLives('teamLife6', 3);

    expect(scoringManager.isGameOver('teamLife5')).toBe(false);
    scoringManager.removeLives('teamLife5', 1);
    expect(scoringManager.isGameOver('teamLife5')).toBe(true);
    expect(scoringManager.isGameOver('teamLife6')).toBe(false);
  });

  it('should correctly report game over if any team has zero lives', () => {
    scoringManager.setLives('teamLife7', 1);
    scoringManager.setLives('teamLife8', 3);

    expect(scoringManager.isGameOver()).toBe(false);
    scoringManager.removeLives('teamLife7', 1);
    expect(scoringManager.isGameOver()).toBe(true);
  });

  it('should correctly report not game over if all teams have lives', () => {
    scoringManager.setLives('teamLife9', 1);
    scoringManager.setLives('teamLife10', 3);
    expect(scoringManager.isGameOver()).toBe(false);
  });

}); 