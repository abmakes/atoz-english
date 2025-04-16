import { EventBus } from './EventBus';
import { GameConfig, TeamConfig } from '../config/GameConfig';
import { GAME_STATE_EVENTS } from './EventTypes';

/**
 * Defines the possible phases of a game.
 */
export enum GamePhase {
    LOADING = 'loading',
    SETUP = 'setup',          // Initial setup, team selection, config
    READY = 'ready',          // Ready to start playing (e.g., countdown)
    PLAYING = 'playing',      // Main gameplay loop
    PAUSED = 'paused',        // Game is paused
    ROUND_OVER = 'round_over', // End of a round/level
    GAME_OVER = 'game_over',    // Final game end state
    RESULTS = 'results',      // Displaying scores/results
    CLEANUP = 'cleanup',      // Cleaning up resources
}

// Define event types related to game state changes
export interface GameStateEvents {
    phaseChanged: (newPhase: GamePhase, oldPhase: GamePhase) => void;
    activeTeamChanged: (newTeamId: string | number | null, oldTeamId: string | number | null) => void;
    // Add other state-related events as needed
}

/**
 * Manages the overall game state, including phases and active player/team.
 */
export class GameStateManager {
    private currentPhase: GamePhase = GamePhase.LOADING;
    private activeTeamId: string | number | null = null;
    private teams: TeamConfig[] = [];
    // TODO: Consider adding phase-specific data storage if needed
    // private phaseData: Record<string, unknown> = {};

    constructor(private eventBus: EventBus) {}

    /**
     * Initializes the GameStateManager based on the provided game configuration.
     * @param config - The game configuration.
     */
    public init(config: GameConfig): void {
        console.log('Initializing GameStateManager...');
        this.teams = [...config.teams]; // Store a copy
        // Set initial phase (e.g., SETUP or based on config)
        // Determine initial active team if applicable (e.g., first team)
        this.activeTeamId = this.teams.length > 0 ? this.teams[0].id : null;
        this.setPhase(GamePhase.SETUP); // Default starting phase after init
        console.log('GameStateManager initialized. Teams:', this.teams.length, 'Initial Phase:', this.currentPhase);
    }

    /**
     * Transitions the game to a new phase.
     * Emits a 'phaseChanged' event if the phase actually changes.
     * @param newPhase - The phase to transition to.
     * @param force - If true, bypasses validation (use with caution).
     */
    public setPhase(newPhase: GamePhase, force = false): boolean {
        const oldPhase = this.currentPhase;
        if (newPhase === oldPhase) {
            return false; // No change
        }

        if (!force && !this.isValidTransition(oldPhase, newPhase)) {
            console.warn(`GameStateManager: Invalid phase transition from ${oldPhase} to ${newPhase}`);
            return false;
        }

        console.log(`GameStateManager: Phase changing ${oldPhase} -> ${newPhase}`);
        this.currentPhase = newPhase;
        // Reset or manage phase-specific data here if needed
        // this.phaseData = {};
        this.eventBus.emit(GAME_STATE_EVENTS.PHASE_CHANGED, {
            currentPhase: newPhase,
            previousPhase: oldPhase
        });
        return true;
    }

    /**
     * Checks if a phase transition is valid based on predefined rules.
     * TODO: Define more robust transition logic as needed.
     * @param from - The current phase.
     * @param to - The target phase.
     * @returns True if the transition is valid, false otherwise.
     */
    private isValidTransition(from: GamePhase, to: GamePhase): boolean {
        // Basic example: Prevent jumping directly from Playing to Setup, etc.
        // Allow any transition for now, implement specific rules later.
        console.log(`GameStateManager: Validating transition ${from} -> ${to}`);
        // Example rule:
        // if (from === GamePhase.PLAYING && to === GamePhase.SETUP) return false;
        return true;
    }

    /**
     * Gets the current game phase.
     * @returns The current GamePhase.
     */
    public getCurrentPhase(): GamePhase {
        return this.currentPhase;
    }

    /**
     * Checks if the game is currently in one of the specified phases.
     * @param phases - A phase or array of phases to check against.
     * @returns True if the current phase is one of the specified phases.
     */
    public isPhase(phases: GamePhase | GamePhase[]): boolean {
        if (Array.isArray(phases)) {
            return phases.includes(this.currentPhase);
        }
        return this.currentPhase === phases;
    }

    /**
     * Sets the currently active team.
     * Emits an 'activeTeamChanged' event if the active team changes.
     * @param teamId - The ID of the team to set as active, or null if none.
     */
    public setActiveTeam(teamId: string | number | null): void {
        const oldTeamId = this.activeTeamId;
        if (teamId === oldTeamId) {
            return; // No change
        }

        // Validate that the teamId exists in the configured teams (if not null)
        if (teamId !== null && !this.teams.some(team => team.id === teamId)) {
            console.warn(`GameStateManager: Attempted to set active team to non-existent ID: ${teamId}`);
            return;
        }

        console.log(`GameStateManager: Active team changing ${oldTeamId} -> ${teamId}`);
        this.activeTeamId = teamId;
        this.eventBus.emit(GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED, {
            currentTeamId: teamId ?? '',  // Use empty string as fallback
            previousTeamId: oldTeamId ?? undefined
        });
    }

    /**
     * Gets the ID of the currently active team.
     * @returns The active team ID or null.
     */
    public getActiveTeamId(): string | number | null {
        return this.activeTeamId;
    }

    /**
     * Gets the full configuration object for the active team.
     * @returns The TeamConfig of the active team, or null if no team is active.
     */
    public getActiveTeam(): TeamConfig | null {
        if (this.activeTeamId === null) {
            return null;
        }
        return this.teams.find(team => team.id === this.activeTeamId) || null;
    }

    /**
     * Gets the list of all configured teams.
     * @returns An array of TeamConfig objects.
     */
    public getTeams(): TeamConfig[] {
        return [...this.teams]; // Return a copy to prevent mutation
    }

    /**
     * Cleans up the GameStateManager.
     * Currently resets basic state, might clear listeners in EventBus if needed.
     */
    public destroy(): void {
        console.log('Destroying GameStateManager...');
        this.currentPhase = GamePhase.CLEANUP;
        this.activeTeamId = null;
        this.teams = [];
        // Consider removing specific listeners if the EventBus isn't cleared globally
        // this.eventBus.off(...);
    }

    // TODO: Add methods for phase-specific data if implemented
    // public setPhaseData(key: string, value: unknown): void { ... }
    // public getPhaseData<T>(key: string): T | undefined { ... }
}
