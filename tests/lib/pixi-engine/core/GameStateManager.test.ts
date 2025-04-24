import { GameStateManager, GamePhase } from '@/lib/pixi-engine/core/GameStateManager';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { GAME_STATE_EVENTS } from '@/lib/pixi-engine/core/EventTypes';
import { GameConfig, TeamConfig, DEFAULT_GAME_CONFIG, DEFAULT_SCORE_MODE_CONFIG, DEFAULT_RULE_CONFIG, DEFAULT_CONTROLS_CONFIG, DEFAULT_ASSET_CONFIG, DEFAULT_POWERUP_CONFIG } from '@/lib/pixi-engine/config/GameConfig';

// Mocks
jest.mock('@/lib/pixi-engine/core/EventBus');

const MockedEventBus = EventBus as jest.MockedClass<typeof EventBus>;

// Helper function to create a basic GameConfig
const createMockGameConfig = (teams: TeamConfig[] = []): GameConfig => ({
    teams: teams,
    quizId: 'mockQuiz',
    gameSlug: 'mock-game',
    gameMode: { type: 'score', name: 'Score Mode', ...DEFAULT_SCORE_MODE_CONFIG }, // Example, adjust as needed
    rules: DEFAULT_RULE_CONFIG,
    controls: DEFAULT_CONTROLS_CONFIG,
    assets: DEFAULT_ASSET_CONFIG,
    powerups: DEFAULT_POWERUP_CONFIG,
    intensityTimeLimit: DEFAULT_GAME_CONFIG.intensityTimeLimit,
});

describe('GameStateManager', () => {
    let gameStateManager: GameStateManager;
    let mockEventBusInstance: jest.Mocked<EventBus>;
    let mockTeams: TeamConfig[];

    beforeEach(() => {
        MockedEventBus.mockClear();
        mockEventBusInstance = new MockedEventBus() as jest.Mocked<EventBus>;
        gameStateManager = new GameStateManager(mockEventBusInstance);

        mockTeams = [
            { id: 'team1', name: 'Team 1', startingResources: { score: 0 }, players: [{ id: 'p1', name: 'Player 1' }] },
            { id: 'team2', name: 'Team 2', startingResources: { score: 0 }, players: [{ id: 'p2', name: 'Player 2' }] },
        ];
    });

    // --- Initialization ---
    it('should initialize with LOADING phase by default', () => {
        expect(gameStateManager.getCurrentPhase()).toBe(GamePhase.LOADING);
    });

    it('should initialize correctly with game config and teams', () => {
        const config = createMockGameConfig(mockTeams);
        gameStateManager.init(config);

        expect(gameStateManager.getCurrentPhase()).toBe(GamePhase.SETUP);
        expect(gameStateManager.getTeams()).toEqual(mockTeams);
        expect(gameStateManager.getActiveTeamId()).toBe(mockTeams[0].id);
        expect(mockEventBusInstance.emit).toHaveBeenCalledWith(GAME_STATE_EVENTS.PHASE_CHANGED, {
            currentPhase: GamePhase.SETUP,
            previousPhase: GamePhase.LOADING // Assuming default initial state is LOADING
        });
    });

    it('should initialize with no active team if config has no teams', () => {
        const config = createMockGameConfig([]);
        gameStateManager.init(config);

        expect(gameStateManager.getCurrentPhase()).toBe(GamePhase.SETUP);
        expect(gameStateManager.getTeams()).toEqual([]);
        expect(gameStateManager.getActiveTeamId()).toBeNull();
    });


    // --- Phase Management ---
    it('should set a new phase and emit event', () => {
        gameStateManager.init(createMockGameConfig()); // Start in SETUP
        const result = gameStateManager.setPhase(GamePhase.PLAYING);

        expect(result).toBe(true);
        expect(gameStateManager.getCurrentPhase()).toBe(GamePhase.PLAYING);
        expect(mockEventBusInstance.emit).toHaveBeenCalledWith(GAME_STATE_EVENTS.PHASE_CHANGED, {
            currentPhase: GamePhase.PLAYING,
            previousPhase: GamePhase.SETUP
        });
        expect(mockEventBusInstance.emit).toHaveBeenCalledTimes(2); // Once in init, once here
    });

    it('should not change phase or emit event if setting the same phase', () => {
        gameStateManager.init(createMockGameConfig()); // Start in SETUP
        mockEventBusInstance.emit.mockClear(); // Clear init call

        const result = gameStateManager.setPhase(GamePhase.SETUP);

        expect(result).toBe(false);
        expect(gameStateManager.getCurrentPhase()).toBe(GamePhase.SETUP);
        expect(mockEventBusInstance.emit).not.toHaveBeenCalled();
    });

    it('should allow valid transitions (assuming isValidTransition returns true)', () => {
        gameStateManager.init(createMockGameConfig()); // SETUP
        // Spy on the private method. Using `@ts-expect-error` is preferred for targeting specific errors.
        // @ts-expect-error - TS doesn't know about private method 'isValidTransition' for spying
        const isValidSpy: jest.SpyInstance = jest.spyOn(gameStateManager, 'isValidTransition');
        isValidSpy.mockReturnValue(true);

        const result = gameStateManager.setPhase(GamePhase.GAME_OVER);

        expect(result).toBe(true);
        expect(gameStateManager.getCurrentPhase()).toBe(GamePhase.GAME_OVER);
        expect(isValidSpy).toHaveBeenCalledWith(GamePhase.SETUP, GamePhase.GAME_OVER);
        expect(mockEventBusInstance.emit).toHaveBeenCalledWith(GAME_STATE_EVENTS.PHASE_CHANGED, expect.any(Object));
        isValidSpy.mockRestore();
    });

    it('should prevent invalid transitions and not emit event', () => {
        gameStateManager.init(createMockGameConfig()); // SETUP
        // @ts-expect-error - TS doesn't know about private method 'isValidTransition' for spying
        const isValidSpy: jest.SpyInstance = jest.spyOn(gameStateManager, 'isValidTransition');
        isValidSpy.mockReturnValue(false); // Force invalid transition
        mockEventBusInstance.emit.mockClear(); // Clear init call

        const result = gameStateManager.setPhase(GamePhase.GAME_OVER);

        expect(result).toBe(false);
        expect(gameStateManager.getCurrentPhase()).toBe(GamePhase.SETUP); // Should remain unchanged
        expect(isValidSpy).toHaveBeenCalledWith(GamePhase.SETUP, GamePhase.GAME_OVER);
        expect(mockEventBusInstance.emit).not.toHaveBeenCalled();
        isValidSpy.mockRestore();
    });

     it('should force phase change even if transition is invalid', () => {
        gameStateManager.init(createMockGameConfig()); // SETUP
        // @ts-expect-error - TS doesn't know about private method 'isValidTransition' for spying
        const isValidSpy: jest.SpyInstance = jest.spyOn(gameStateManager, 'isValidTransition');
        isValidSpy.mockReturnValue(false); // Force invalid transition
        mockEventBusInstance.emit.mockClear(); // Clear init call

        const result = gameStateManager.setPhase(GamePhase.GAME_OVER, true); // Force = true

        expect(result).toBe(true);
        expect(gameStateManager.getCurrentPhase()).toBe(GamePhase.GAME_OVER); // Phase changed
        expect(isValidSpy).not.toHaveBeenCalled(); // Validation should be skipped
        expect(mockEventBusInstance.emit).toHaveBeenCalledWith(GAME_STATE_EVENTS.PHASE_CHANGED, {
            currentPhase: GamePhase.GAME_OVER,
            previousPhase: GamePhase.SETUP
        });
        isValidSpy.mockRestore();
    });

    it('isPhase should return true for the current phase', () => {
        gameStateManager.init(createMockGameConfig()); // SETUP
        expect(gameStateManager.isPhase(GamePhase.SETUP)).toBe(true);
        gameStateManager.setPhase(GamePhase.PLAYING);
        expect(gameStateManager.isPhase(GamePhase.PLAYING)).toBe(true);
    });

    it('isPhase should return false for other phases', () => {
        gameStateManager.init(createMockGameConfig()); // SETUP
        expect(gameStateManager.isPhase(GamePhase.PLAYING)).toBe(false);
        expect(gameStateManager.isPhase(GamePhase.GAME_OVER)).toBe(false);
    });

    it('isPhase should work with an array of phases', () => {
        gameStateManager.init(createMockGameConfig()); // SETUP
        expect(gameStateManager.isPhase([GamePhase.SETUP, GamePhase.LOADING])).toBe(true);
        expect(gameStateManager.isPhase([GamePhase.PLAYING, GamePhase.PAUSED])).toBe(false);
        gameStateManager.setPhase(GamePhase.PAUSED);
        expect(gameStateManager.isPhase([GamePhase.PLAYING, GamePhase.PAUSED])).toBe(true);
    });

    // --- Team Management ---
    it('should set the active team and emit event', () => {
        gameStateManager.init(createMockGameConfig(mockTeams)); // team1 active
        mockEventBusInstance.emit.mockClear(); // Clear init PHASE_CHANGED event

        gameStateManager.setActiveTeam('team2');

        expect(gameStateManager.getActiveTeamId()).toBe('team2');
        expect(mockEventBusInstance.emit).toHaveBeenCalledWith(GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED, {
            currentTeamId: 'team2',
            previousTeamId: 'team1'
        });
        expect(mockEventBusInstance.emit).toHaveBeenCalledTimes(1);
    });

    it('should set active team to null and emit event', () => {
        gameStateManager.init(createMockGameConfig(mockTeams)); // team1 active
        mockEventBusInstance.emit.mockClear();

        gameStateManager.setActiveTeam(null);

        expect(gameStateManager.getActiveTeamId()).toBeNull();
        expect(mockEventBusInstance.emit).toHaveBeenCalledWith(GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED, {
             currentTeamId: '', // Ensure fallback works
             previousTeamId: 'team1'
        });
    });

    it('should not change active team or emit event if setting the same team ID', () => {
        gameStateManager.init(createMockGameConfig(mockTeams)); // team1 active
        mockEventBusInstance.emit.mockClear();

        gameStateManager.setActiveTeam('team1');

        expect(gameStateManager.getActiveTeamId()).toBe('team1');
        expect(mockEventBusInstance.emit).not.toHaveBeenCalled();
    });

    it('should not change active team or emit event if setting a non-existent team ID', () => {
        gameStateManager.init(createMockGameConfig(mockTeams)); // team1 active
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(); // Suppress console output
        mockEventBusInstance.emit.mockClear();

        gameStateManager.setActiveTeam('nonexistent_team');

        expect(gameStateManager.getActiveTeamId()).toBe('team1'); // Should remain unchanged
        expect(mockEventBusInstance.emit).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
    });

    it('getActiveTeam should return the correct team config', () => {
        gameStateManager.init(createMockGameConfig(mockTeams)); // team1 active
        expect(gameStateManager.getActiveTeam()).toEqual(mockTeams[0]);

        gameStateManager.setActiveTeam('team2');
        expect(gameStateManager.getActiveTeam()).toEqual(mockTeams[1]);
    });

    it('getActiveTeam should return null if no team is active', () => {
        gameStateManager.init(createMockGameConfig(mockTeams));
        gameStateManager.setActiveTeam(null);
        expect(gameStateManager.getActiveTeam()).toBeNull();
    });

     it('getActiveTeam should return null if initialized with no teams', () => {
        gameStateManager.init(createMockGameConfig([]));
        expect(gameStateManager.getActiveTeam()).toBeNull();
    });

    it('getTeams should return a copy of the teams array', () => {
        const config = createMockGameConfig(mockTeams);
        gameStateManager.init(config);
        const teams = gameStateManager.getTeams();
        expect(teams).toEqual(mockTeams);
        expect(teams).not.toBe(mockTeams); // Ensure it's a copy

        // Modify the returned array and check original is unaffected
        teams.push({ id: 'team3', name: 'Team 3', startingResources: { score: 0 }, players: [] });
        expect(gameStateManager.getTeams().length).toBe(mockTeams.length);
    });


    // --- Destruction ---
    it('should reset state on destroy', () => {
        gameStateManager.init(createMockGameConfig(mockTeams));
        gameStateManager.setPhase(GamePhase.PLAYING);
        gameStateManager.setActiveTeam('team2');

        gameStateManager.destroy();

        expect(gameStateManager.getCurrentPhase()).toBe(GamePhase.CLEANUP);
        expect(gameStateManager.getActiveTeamId()).toBeNull();
        expect(gameStateManager.getTeams()).toEqual([]);
        // Note: This test doesn't check if EventBus listeners are removed,
        // as that depends on EventBus implementation or specific listener management.
    });
}); 