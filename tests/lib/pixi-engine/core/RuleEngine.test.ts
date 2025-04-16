import { RuleEngine } from '@/lib/pixi-engine/core/RuleEngine';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GameConfig, RuleConfig, RuleDefinition, ConditionDefinition, ActionDefinition, TeamConfig, GameModeConfig } from '@/lib/pixi-engine/config/GameConfig';
import { TimerManager, TimerStatus, TimerType } from '@/lib/pixi-engine/game/TimerManager';
import { GameStateManager, GamePhase } from '@/lib/pixi-engine/core/GameStateManager';
import { ScoringManager } from '@/lib/pixi-engine/game/ScoringManager';
import { PowerUpManager } from '@/lib/pixi-engine/game/PowerUpManager';
import { StorageManager } from '@/lib/pixi-engine/core/StorageManager';
import { GAME_STATE_EVENTS, SCORING_EVENTS, TIMER_EVENTS } from '@/lib/pixi-engine/core/EventTypes';

// --- Mocks ---
jest.mock('@/lib/pixi-engine/core/EventBus');
jest.mock('@/lib/pixi-engine/game/TimerManager');
jest.mock('@/lib/pixi-engine/core/GameStateManager');
jest.mock('@/lib/pixi-engine/game/ScoringManager');
jest.mock('@/lib/pixi-engine/game/PowerUpManager');
jest.mock('@/lib/pixi-engine/core/StorageManager');

const MockedEventBus = EventBus as jest.MockedClass<typeof EventBus>;
const MockedTimerManager = TimerManager as jest.MockedClass<typeof TimerManager>;
const MockedGameStateManager = GameStateManager as jest.MockedClass<typeof GameStateManager>;
const MockedScoringManager = ScoringManager as jest.MockedClass<typeof ScoringManager>;
const MockedPowerUpManager = PowerUpManager as jest.MockedClass<typeof PowerUpManager>;
const MockedStorageManager = StorageManager as jest.MockedClass<typeof StorageManager>;

// --- Helper Data ---
type ListenerMap = { [key: string]: jest.Mock };

const createMockRule = (overrides: Partial<RuleDefinition> = {}): RuleDefinition => ({
    id: `rule-${Math.random().toString(36).substring(7)}`,
    triggerEvent: GAME_STATE_EVENTS.PHASE_CHANGED, // Default trigger
    conditions: [],
    actions: [],
    priority: 0,
    enabled: true,
    ...overrides,
});

const createMockGameConfig = (rules: RuleDefinition[] = []): GameConfig => ({
    quizId: 'test-quiz',
    gameSlug: 'test-game',
    teams: [] as TeamConfig[], // Keep empty or mock as needed
    gameMode: { type: 'score', name: 'Test Mode' } as GameModeConfig, // Mock simply
    rules: { rules },
    controls: { actionMap: {}, playerMappings: [] }, // Mock simply
    assets: { bundles: [] }, // Mock simply
    powerups: { availablePowerups: [] }, // Mock simply
    intensityTimeLimit: 30,
});

// --- Test Suite ---
describe('RuleEngine', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let ruleEngine: RuleEngine;
    let mockEventBusInstance: jest.Mocked<EventBus>;
    let mockTimerManagerInstance: jest.Mocked<TimerManager>;
    let mockGameStateManagerInstance: jest.Mocked<GameStateManager>;
    let mockScoringManagerInstance: jest.Mocked<ScoringManager>;
    let mockPowerUpManagerInstance: jest.Mocked<PowerUpManager>;
    let mockStorageManagerInstance: jest.Mocked<StorageManager>;
    let capturedListeners: ListenerMap;
    let mockConfig: GameConfig;
    let uniqueEventTriggers: Set<string>;

    // Helper to instantiate RuleEngine with current mocks (moved outside beforeEach)
    const instantiateRuleEngine = (config = mockConfig) => {
        // Clear previous listeners before re-instantiating if necessary
        mockEventBusInstance.on.mockClear();
        uniqueEventTriggers.clear();
        capturedListeners = {};

        ruleEngine = new RuleEngine(mockEventBusInstance, config, {
            timerManager: mockTimerManagerInstance,
            gameStateManager: mockGameStateManagerInstance,
            scoringManager: mockScoringManagerInstance,
            powerUpManager: mockPowerUpManagerInstance,
        });
    };

    beforeEach(() => {
        // Reset mocks
        MockedEventBus.mockClear();
        MockedTimerManager.mockClear();
        MockedGameStateManager.mockClear();
        MockedScoringManager.mockClear();
        MockedPowerUpManager.mockClear();
        MockedStorageManager.mockClear();

        // Create mock instances
        mockEventBusInstance = new MockedEventBus() as jest.Mocked<EventBus>;
        mockStorageManagerInstance = new MockedStorageManager() as jest.Mocked<StorageManager>;
        mockTimerManagerInstance = new MockedTimerManager(mockEventBusInstance, mockStorageManagerInstance) as jest.Mocked<TimerManager>;
        mockGameStateManagerInstance = new MockedGameStateManager(mockEventBusInstance) as jest.Mocked<GameStateManager>;
        mockScoringManagerInstance = new MockedScoringManager(mockEventBusInstance, mockStorageManagerInstance) as jest.Mocked<ScoringManager>;
        mockConfig = createMockGameConfig([]); // Create mockConfig before PowerUpManager needs it
        mockPowerUpManagerInstance = new MockedPowerUpManager(mockEventBusInstance, mockConfig) as jest.Mocked<PowerUpManager>;

        // Capture listeners registered on the mock EventBus
        capturedListeners = {};
        uniqueEventTriggers = new Set();
        // @ts-expect-error - Suppressing complex type mismatch for mock implementation
        mockEventBusInstance.on = jest.fn((eventName: string, listener: jest.Mock) => {
            uniqueEventTriggers.add(eventName);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            capturedListeners[eventName] = listener as any;
            return mockEventBusInstance;
        });
        mockEventBusInstance.off = jest.fn();

        // Default instantiation
        instantiateRuleEngine(); // Call the helper defined outside
    });

    // --- Initialization Tests ---
    it('should load and sort rules by priority on initialization', () => {
        const rule1 = createMockRule({ id: 'rule1', priority: 10 });
        const rule2 = createMockRule({ id: 'rule2', priority: 5 });
        const rule3 = createMockRule({ id: 'rule3', priority: 15 });
        const config = createMockGameConfig([rule1, rule2, rule3]);

        // Re-instantiate with specific config
        const newRuleEngine = new RuleEngine(mockEventBusInstance, config, { timerManager: mockTimerManagerInstance });

        // Access private 'rules' for verification (common in testing)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadedRules = (newRuleEngine as any).rules;
        expect(loadedRules).toHaveLength(3);
        expect(loadedRules[0].id).toBe('rule3'); // Highest priority first
        expect(loadedRules[1].id).toBe('rule1');
        expect(loadedRules[2].id).toBe('rule2');
    });

    it('should register listeners for unique trigger events', () => {
        const rule1 = createMockRule({ triggerEvent: GAME_STATE_EVENTS.PHASE_CHANGED });
        const rule2 = createMockRule({ triggerEvent: TIMER_EVENTS.TIMER_COMPLETED });
        const rule3 = createMockRule({ triggerEvent: GAME_STATE_EVENTS.PHASE_CHANGED }); // Duplicate trigger
        const rule4 = createMockRule({ triggerEvent: SCORING_EVENTS.SCORE_UPDATED });
        const config = createMockGameConfig([rule1, rule2, rule3, rule4]);

        // Re-instantiate with specific config
        new RuleEngine(mockEventBusInstance, config, { timerManager: mockTimerManagerInstance });

        expect(mockEventBusInstance.on).toHaveBeenCalledTimes(3); // Only 3 unique events
        expect(mockEventBusInstance.on).toHaveBeenCalledWith(GAME_STATE_EVENTS.PHASE_CHANGED, expect.any(Function));
        expect(mockEventBusInstance.on).toHaveBeenCalledWith(TIMER_EVENTS.TIMER_COMPLETED, expect.any(Function));
        expect(mockEventBusInstance.on).toHaveBeenCalledWith(SCORING_EVENTS.SCORE_UPDATED, expect.any(Function));

        // Verify captured listeners exist
        expect(capturedListeners[GAME_STATE_EVENTS.PHASE_CHANGED]).toBeDefined();
        expect(capturedListeners[TIMER_EVENTS.TIMER_COMPLETED]).toBeDefined();
        expect(capturedListeners[SCORING_EVENTS.SCORE_UPDATED]).toBeDefined();
    });

    // --- Event Handling & Basic Processing ---
    it('should call processRule for rules matching the triggered event', () => {
        const matchingRule = createMockRule({ id: 'match', triggerEvent: GAME_STATE_EVENTS.PHASE_CHANGED });
        const nonMatchingRule = createMockRule({ id: 'nomatch', triggerEvent: TIMER_EVENTS.TIMER_COMPLETED });
        const config = createMockGameConfig([matchingRule, nonMatchingRule]);
        const eventName = GAME_STATE_EVENTS.PHASE_CHANGED;
        const eventPayload = { currentPhase: GamePhase.PLAYING, previousPhase: GamePhase.READY };

        // Re-instantiate
        const newRuleEngine = new RuleEngine(mockEventBusInstance, config, { timerManager: mockTimerManagerInstance });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processRuleSpy = jest.spyOn(newRuleEngine as any, 'processRule');

        // Simulate event trigger by calling the captured listener
        const listener = capturedListeners[eventName];
        expect(listener).toBeDefined();
        listener(eventPayload);

        expect(processRuleSpy).toHaveBeenCalledTimes(1);
        expect(processRuleSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'match' }), eventPayload);
    });

    it('should not process rules if the engine is disabled', () => {
        const rule = createMockRule({ triggerEvent: GAME_STATE_EVENTS.PHASE_CHANGED });
        const config = createMockGameConfig([rule]);
        const eventName = GAME_STATE_EVENTS.PHASE_CHANGED;
        const eventPayload = { currentPhase: GamePhase.PLAYING, previousPhase: GamePhase.READY };

        // Re-instantiate
        const newRuleEngine = new RuleEngine(mockEventBusInstance, config, { timerManager: mockTimerManagerInstance });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processRuleSpy = jest.spyOn(newRuleEngine as any, 'processRule');

        newRuleEngine.setEnabled(false);
        const listener = capturedListeners[eventName];
        listener(eventPayload);

        expect(processRuleSpy).not.toHaveBeenCalled();
    });

    it('should not process a rule if the rule itself is disabled', () => {
        const disabledRule = createMockRule({ triggerEvent: GAME_STATE_EVENTS.PHASE_CHANGED, enabled: false });
        const config = createMockGameConfig([disabledRule]);
        const eventName = GAME_STATE_EVENTS.PHASE_CHANGED;
        const eventPayload = { currentPhase: GamePhase.PLAYING, previousPhase: GamePhase.READY };

        // Re-instantiate
        const newRuleEngine = new RuleEngine(mockEventBusInstance, config, { timerManager: mockTimerManagerInstance });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processRuleSpy = jest.spyOn(newRuleEngine as any, 'processRule');

        const listener = capturedListeners[eventName];
        listener(eventPayload);

        expect(processRuleSpy).not.toHaveBeenCalled();
    });

    // --- Condition Evaluation (Basic Examples) ---
    it('should execute actions if conditions are met (compareState from event)', () => {
        const condition: ConditionDefinition = {
            type: 'compareState',
            property: 'currentPhase', // Property expected in the event payload
            operator: 'eq',
            value: GamePhase.PLAYING
        };
        const action: ActionDefinition = {
            type: 'changePhase', // Action to execute
            params: { newPhase: GamePhase.ROUND_OVER }
        };
        const rule = createMockRule({ triggerEvent: GAME_STATE_EVENTS.PHASE_CHANGED, conditions: [condition], actions: [action] });
        const config = createMockGameConfig([rule]);
        const eventName = GAME_STATE_EVENTS.PHASE_CHANGED;
        const eventPayload = { currentPhase: GamePhase.PLAYING, previousPhase: GamePhase.READY }; // Payload matches condition

        // Re-instantiate
        const newRuleEngine = new RuleEngine(mockEventBusInstance, config, {
             timerManager: mockTimerManagerInstance,
             gameStateManager: mockGameStateManagerInstance // Need this manager for the action
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeActionsSpy = jest.spyOn(newRuleEngine as any, 'executeActions');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evaluateCondSpy = jest.spyOn(newRuleEngine as any, 'evaluateConditions');

        const listener = capturedListeners[eventName];
        listener(eventPayload);

        expect(evaluateCondSpy).toHaveReturnedWith(true);
        expect(executeActionsSpy).toHaveBeenCalledTimes(1);
        expect(executeActionsSpy).toHaveBeenCalledWith([action], { eventPayload });
    });

    it('should NOT execute actions if conditions are NOT met (compareState from event)', () => {
        const condition: ConditionDefinition = {
            type: 'compareState',
            property: 'currentPhase',
            operator: 'eq',
            value: GamePhase.PLAYING
        };
        const rule = createMockRule({ triggerEvent: GAME_STATE_EVENTS.PHASE_CHANGED, conditions: [condition], actions: [{ type: 'changePhase', params: {} }] });
        const config = createMockGameConfig([rule]);
        const eventName = GAME_STATE_EVENTS.PHASE_CHANGED;
        // Payload DOES NOT match condition
        const eventPayload = { currentPhase: GamePhase.PAUSED, previousPhase: GamePhase.PLAYING };

        // Re-instantiate
        const newRuleEngine = new RuleEngine(mockEventBusInstance, config, { timerManager: mockTimerManagerInstance });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeActionsSpy = jest.spyOn(newRuleEngine as any, 'executeActions');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evaluateCondSpy = jest.spyOn(newRuleEngine as any, 'evaluateConditions');

        const listener = capturedListeners[eventName];
        listener(eventPayload);

        expect(evaluateCondSpy).toHaveReturnedWith(false);
        expect(executeActionsSpy).not.toHaveBeenCalled();
    });

    it('should execute actions if timerCheck condition is met', () => {
        const timerId = 'gameTimer';
        const condition: ConditionDefinition = {
            type: 'timerCheck',
            property: timerId,
            operator: 'eq',
            value: 'running' // Check if timer is running
        };
         const action: ActionDefinition = { type: 'modifyScore', params: { amount: 10, teamId: 'team1' } };
        const rule = createMockRule({ triggerEvent: TIMER_EVENTS.TIMER_TICK, conditions: [condition], actions: [action] });
        const config = createMockGameConfig([rule]);
        const eventName = TIMER_EVENTS.TIMER_TICK;
        const eventPayload = { timerId: timerId, elapsed: 500 };

        mockTimerManagerInstance.getTimer.mockReturnValue({
            id: timerId,
            duration: 10000,
            type: TimerType.COUNTDOWN,
            status: TimerStatus.RUNNING,
            elapsed: 500,
            speedMultiplier: 1,
            startTime: Date.now(),
            // @ts-expect-error - Type requires number, but null is valid runtime state
            pauseTime: null,
            // @ts-expect-error - Type requires number | null, but undefined is valid runtime state
            rafId: undefined,
        });

        instantiateRuleEngine(config); // Re-instantiate AFTER setting up mocks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeActionsSpy = jest.spyOn(ruleEngine as any, 'executeActions');

        const listener = capturedListeners[eventName];
        listener(eventPayload);

        expect(mockTimerManagerInstance.getTimer).toHaveBeenCalledWith(timerId);
        expect(executeActionsSpy).toHaveBeenCalledTimes(1);
    });

    it('should evaluate checkPowerup condition correctly (active)', () => {
        const powerupId = 'double_points';
        const targetId = 'team1';
        const condition: ConditionDefinition = {
            type: 'checkPowerup',
            property: powerupId,
            operator: 'eq', // Check if active
            value: targetId
        };
        const rule = createMockRule({ triggerEvent: SCORING_EVENTS.SCORE_UPDATED, conditions: [condition], actions: [] });
        const config = createMockGameConfig([rule]);
        const eventName = SCORING_EVENTS.SCORE_UPDATED;
        const eventPayload = { teamId: targetId, currentScore: 100 };

        // Mock PowerUpManager to return true (power-up is active)
        mockPowerUpManagerInstance.isPowerUpActiveForTarget.mockReturnValue(true);

        instantiateRuleEngine(config);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evaluateCondSpy = jest.spyOn(ruleEngine as any, 'evaluateConditions');

        const listener = capturedListeners[eventName];
        listener(eventPayload);

        expect(mockPowerUpManagerInstance.isPowerUpActiveForTarget).toHaveBeenCalledWith(powerupId, targetId);
        expect(evaluateCondSpy).toHaveReturnedWith(true);
    });

    it('should evaluate checkPowerup condition correctly (inactive)', () => {
        const powerupId = 'shield';
        const targetId = 'team2';
        const condition: ConditionDefinition = {
            type: 'checkPowerup',
            property: powerupId,
            operator: 'ne', // Check if NOT active
            value: targetId
        };
        const rule = createMockRule({ triggerEvent: SCORING_EVENTS.SCORE_UPDATED, conditions: [condition], actions: [] });
        const config = createMockGameConfig([rule]);
        const eventName = SCORING_EVENTS.SCORE_UPDATED;
        const eventPayload = { teamId: targetId, currentScore: 50 };

        // Mock PowerUpManager to return false (power-up is inactive)
        mockPowerUpManagerInstance.isPowerUpActiveForTarget.mockReturnValue(false);

        instantiateRuleEngine(config);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evaluateCondSpy = jest.spyOn(ruleEngine as any, 'evaluateConditions');

        const listener = capturedListeners[eventName];
        listener(eventPayload);

        expect(mockPowerUpManagerInstance.isPowerUpActiveForTarget).toHaveBeenCalledWith(powerupId, targetId);
        expect(evaluateCondSpy).toHaveReturnedWith(true); // Condition (is NOT active) should pass
    });

    // --- Action Execution Tests ---
    it('should call GameStateManager.setPhase for changePhase action', () => {
        const targetPhase = GamePhase.GAME_OVER;
        const action: ActionDefinition = { type: 'changePhase', params: { newPhase: targetPhase } };
        const rule = createMockRule({ actions: [action] }); // No conditions, should always run
        const config = createMockGameConfig([rule]);
        const eventName = GAME_STATE_EVENTS.PHASE_CHANGED;
        const eventPayload = { currentPhase: GamePhase.PLAYING };

        instantiateRuleEngine(config);
        const listener = capturedListeners[eventName];
        listener(eventPayload);

        expect(mockGameStateManagerInstance.setPhase).toHaveBeenCalledTimes(1);
        expect(mockGameStateManagerInstance.setPhase).toHaveBeenCalledWith(targetPhase, undefined); // Check params
    });

    it('should call ScoringManager.addScore for modifyScore action (positive amount)', () => {
        const teamId = 'team1';
        const amount = 50;
        const action: ActionDefinition = { type: 'modifyScore', params: { amount: amount, teamId: teamId } };
        const rule = createMockRule({ actions: [action] });
        const config = createMockGameConfig([rule]);
        const eventName = GAME_STATE_EVENTS.PHASE_CHANGED;
        const eventPayload = {};

        instantiateRuleEngine(config);
        const listener = capturedListeners[eventName];
        listener(eventPayload);

        expect(mockScoringManagerInstance.addScore).toHaveBeenCalledTimes(1);
        expect(mockScoringManagerInstance.addScore).toHaveBeenCalledWith(teamId, amount);
        expect(mockScoringManagerInstance.subtractScore).not.toHaveBeenCalled();
        expect(mockScoringManagerInstance.setScore).not.toHaveBeenCalled();
    });

     it('should call ScoringManager.subtractScore for modifyScore action (negative amount)', () => {
        const teamId = 'team2';
        const amount = -25;
        const action: ActionDefinition = { type: 'modifyScore', params: { amount: amount, teamId: teamId } };
        const rule = createMockRule({ actions: [action] });
        const config = createMockGameConfig([rule]);
        const eventName = GAME_STATE_EVENTS.PHASE_CHANGED;
        const eventPayload = {};

        instantiateRuleEngine(config);
        const listener = capturedListeners[eventName];
        listener(eventPayload);

        expect(mockScoringManagerInstance.subtractScore).toHaveBeenCalledTimes(1);
        expect(mockScoringManagerInstance.subtractScore).toHaveBeenCalledWith(teamId, Math.abs(amount)); // Expect positive value passed
        expect(mockScoringManagerInstance.addScore).not.toHaveBeenCalled();
        expect(mockScoringManagerInstance.setScore).not.toHaveBeenCalled();
    });

    it('should call TimerManager.startTimer for startTimer action', () => {
        const timerId = 'actionTimer';
        const duration = 5000;
        const action: ActionDefinition = { type: 'startTimer', params: { timerId: timerId, duration: duration } };
        const rule = createMockRule({ actions: [action] });
        const config = createMockGameConfig([rule]);
        const eventName = GAME_STATE_EVENTS.PHASE_CHANGED;
        const eventPayload = {};

        instantiateRuleEngine(config);
        const listener = capturedListeners[eventName];
        listener(eventPayload);

        expect(mockTimerManagerInstance.createTimer).toHaveBeenCalledTimes(1);
        expect(mockTimerManagerInstance.createTimer).toHaveBeenCalledWith(timerId, duration, undefined, undefined);
        expect(mockTimerManagerInstance.startTimer).toHaveBeenCalledTimes(1);
        expect(mockTimerManagerInstance.startTimer).toHaveBeenCalledWith(timerId);
    });

    // TODO: Add tests for other actions (pauseTimer, resetTimer, activatePowerup, etc.)

    // --- Destruction Test ---
    it('should unregister listeners on destroy', () => {
        const rule1 = createMockRule({ triggerEvent: GAME_STATE_EVENTS.PHASE_CHANGED });
        const rule2 = createMockRule({ triggerEvent: TIMER_EVENTS.TIMER_COMPLETED });
        const config = createMockGameConfig([rule1, rule2]);

        instantiateRuleEngine(config);
        const initialListeners = { ...capturedListeners }; // Copy listeners captured during init
        const initialEventNames = Array.from(uniqueEventTriggers);

        expect(initialEventNames).toHaveLength(2);

        ruleEngine.destroy(); // Call the destroy method

        expect(mockEventBusInstance.off).toHaveBeenCalledTimes(initialEventNames.length);
        for (const eventName of initialEventNames) {
            expect(mockEventBusInstance.off).toHaveBeenCalledWith(eventName, initialListeners[eventName]);
        }
    });
}); 