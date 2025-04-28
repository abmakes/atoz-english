/**
 * Defines the standard event types and their associated payload interfaces
 * used throughout the PixiJS engine EventBus.
 */

// --- Core Engine Events ---

export const ENGINE_EVENTS = {
  INITIALIZED: 'engine:initialized',
  STARTED: 'engine:started',
  STOPPED: 'engine:stopped',
  BEFORE_UPDATE: 'engine:beforeUpdate', // Fired before update loop
  UPDATE: 'engine:update',         // Fired during update loop
  AFTER_UPDATE: 'engine:afterUpdate',   // Fired after update loop
  BEFORE_RENDER: 'engine:beforeRender', // Fired before rendering
  RENDER: 'engine:render',         // Fired during rendering
  AFTER_RENDER: 'engine:afterRender',   // Fired after rendering
  RESIZED: 'engine:resized',
  ERROR: 'engine:error',
  ENGINE_READY_FOR_GAME: 'engine:readyForGame',
} as const;

export interface EngineResizedPayload {
  width: number;
  height: number;
}

export interface EngineErrorPayload {
  error: Error;
  context?: string;
}

export interface EngineUpdatePayload {
  deltaTime: number; // Time since last frame in seconds
  elapsedMS: number; // Total elapsed time in milliseconds
  deltaMS: number;   // Delta time in milliseconds
}

// --- Game State Events ---

export const GAME_STATE_EVENTS = {
  PHASE_CHANGED: 'gameState:phaseChanged',
  ACTIVE_TEAM_CHANGED: 'gameState:activeTeamChanged',
  GAME_STARTING: 'gameState:gameStarting', // Before game init
  GAME_STARTED: 'gameState:gameStarted', // After game init
  GAME_PAUSED: 'gameState:gamePaused',
  GAME_RESUMED: 'gameState:gameResumed',
  GAME_ENDING: 'gameState:gameEnding',   // Before game cleanup
  GAME_ENDED: 'gameState:gameEnded',     // After game cleanup
  GAME_RESET: 'gameState:gameReset',
} as const;

export interface GameStatePhaseChangedPayload {
  previousPhase: string; // Consider using an enum for phases
  currentPhase: string;
}

export interface GameStateActiveTeamChangedPayload {
  previousTeamId?: string | number;
  currentTeamId: string | number;
}

// --- Scoring Events ---

export const SCORING_EVENTS = {
  SCORE_UPDATED: 'scoring:scoreUpdated',
  LIFE_LOST: 'scoring:lifeLost',
  TEAM_ELIMINATED: 'scoring:teamEliminated',
  HIGH_SCORE_BEATEN: 'scoring:highScoreBeaten',
} as const;

export interface ScoringScoreUpdatedPayload {
  teamId: string | number;
  previousScore: number;
  currentScore: number;
  delta: number;
}

export interface ScoringLifeLostPayload {
  teamId: string | number;
  remainingLives: number;
}

export interface ScoringTeamEliminatedPayload {
  teamId: string | number;
}

// --- Timer Events ---

export const TIMER_EVENTS = {
  TIMER_STARTED: 'timer:started',
  TIMER_TICK: 'timer:tick',
  TIMER_PAUSED: 'timer:paused',
  TIMER_RESUMED: 'timer:resumed',
  TIMER_STOPPED: 'timer:stopped',
  TIMER_COMPLETED: 'timer:completed',
  TIMER_MODIFIED: 'timer:modified', // e.g., time added/removed
} as const;

export interface TimerEventPayload {
  timerId: string;
  remaining?: number;
  elapsed?: number;
  duration?: number;
}

// --- Controls Events ---

export const CONTROLS_EVENTS = {
  PLAYER_ACTION: 'controls:playerAction',
  CONTROL_MAPPING_CHANGED: 'controls:mappingChanged',
  DEVICE_CONNECTED: 'controls:deviceConnected',
  DEVICE_DISCONNECTED: 'controls:deviceDisconnected',
} as const;

export interface ControlsPlayerActionPayload {
  /** The identifier of the action being performed (e.g., 'UP', 'ACTION_A'). */
  action: string;
  /**
   * The value associated with the action.
   * - For binary actions (pressed/released), this is a boolean (true for pressed, false for released).
   * - For analog actions (like joystick axes, though not yet implemented), this could be a number.
   */
  value: boolean | number;
  /** The identifier of the player performing the action (e.g., 'player1'). */
  playerId: string;
  /** The type of device that triggered the action. */
  device: 'keyboard' | 'pointer' | 'gamepad' | 'unknown'; // Added pointer/gamepad
  /** Optional position data, relevant for pointer events. */
  position?: { x: number; y: number }; // Added position
}

// --- Asset Events ---

export const ASSET_EVENTS = {
  LOAD_PROGRESS: 'assets:loadProgress',
  LOAD_COMPLETE: 'assets:loadComplete',
  LOAD_ERROR: 'assets:loadError',
  CACHE_CLEARED: 'assets:cacheCleared',
} as const;

export interface AssetLoadProgressPayload {
  progress: number; // 0-1
  file?: string;
  totalFiles?: number;
}

export interface AssetLoadErrorPayload {
  url: string;
  error: Error;
}

// --- PowerUp Events ---

export const POWERUP_EVENTS = {
  ACTIVATED: 'powerup:activated',
  DEACTIVATED: 'powerup:deactivated',
  EXPIRED: 'powerup:expired',
} as const;

export interface PowerUpEventPayload {
  powerUpId: string;
  type: string;
  targetId: string | number;
  duration?: number;
}

// --- Transition Events ---

export const TRANSITION_EVENTS = {
  START: 'transition:start',
  END: 'transition:end',
  POWERUP_SELECTED: 'transition:powerupSelected',
} as const;

export interface TransitionStartPayload {
  type: 'loading' | 'turn' | 'powerup' | 'custom';
  message?: string;
  duration?: number; // Match TransitionScreenConfig
  triggerPowerupRoll?: boolean;
}

export interface TransitionEndPayload {
  type: 'loading' | 'turn' | 'powerup' | 'custom';
}

export interface TransitionPowerupSelectedPayload {
  /** The ID of the power-up type that was randomly selected */
  selectedPowerupId: string;
  /** The type of transition during which the selection occurred */
  transitionType: TransitionStartPayload['type'];
}

// --- Game Specific Events ---

/** Payload for when an answer is selected or time runs out */
export interface AnswerSelectedPayload {
  /** The ID of the question that was answered */
    questionId: string;
  /** The ID of the option selected by the user, or null if timed out */
  selectedOptionId: string | null;
  /** Whether the selected option was correct */
    isCorrect: boolean;
  /** The ID of the team that selected the answer */
  teamId?: string | number;
  /** Optional: Time remaining in milliseconds when the answer was selected */
  remainingTimeMs?: number;
  /** Optional: Score multiplier active when the answer was selected (e.g., from power-up) */
  scoreMultiplier?: number;
}

// Add other game-specific payloads here...

export const GAME_EVENTS = {
    ANSWER_SELECTED: 'game:answerSelected',
    // Add other common game actions here (e.g., ITEM_COLLECTED, LEVEL_START)
} as const;

// Add this definition alongside other event constants (e.g., ENGINE_EVENTS)
export const SETTINGS_EVENTS = {
  SET_GLOBAL_VOLUME: 'settings:setGlobalVolume',
  SET_MUSIC_MUTED: 'settings:setMusicMuted',
  SET_SFX_MUTED: 'settings:setSfxMuted',
} as const;

/**
 * A type map defining the payload structure for each event type.
 * This is used for type-safe event handling with the EventBus.
 * Example: bus.on<EngineEvents['RESIZED']>(ENGINE_EVENTS.RESIZED, (payload) => { payload.width... });
 */
export interface EngineEvents {
  [ENGINE_EVENTS.INITIALIZED]: () => void;
  [ENGINE_EVENTS.STARTED]: () => void;
  [ENGINE_EVENTS.STOPPED]: () => void;
  [ENGINE_EVENTS.BEFORE_UPDATE]: (payload: EngineUpdatePayload) => void;
  [ENGINE_EVENTS.UPDATE]: (payload: EngineUpdatePayload) => void;
  [ENGINE_EVENTS.AFTER_UPDATE]: (payload: EngineUpdatePayload) => void;
  [ENGINE_EVENTS.BEFORE_RENDER]: () => void;
  [ENGINE_EVENTS.RENDER]: () => void;
  [ENGINE_EVENTS.AFTER_RENDER]: () => void;
  [ENGINE_EVENTS.RESIZED]: (payload: EngineResizedPayload) => void;
  [ENGINE_EVENTS.ERROR]: (payload: EngineErrorPayload) => void;
  [ENGINE_EVENTS.ENGINE_READY_FOR_GAME]: () => void;

  [GAME_STATE_EVENTS.PHASE_CHANGED]: (payload: GameStatePhaseChangedPayload) => void;
  [GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED]: (payload: GameStateActiveTeamChangedPayload) => void;
  [GAME_STATE_EVENTS.GAME_STARTING]: () => void;
  [GAME_STATE_EVENTS.GAME_STARTED]: () => void;
  [GAME_STATE_EVENTS.GAME_PAUSED]: () => void;
  [GAME_STATE_EVENTS.GAME_RESUMED]: () => void;
  [GAME_STATE_EVENTS.GAME_ENDING]: () => void;
  [GAME_STATE_EVENTS.GAME_ENDED]: () => void;
  [GAME_STATE_EVENTS.GAME_RESET]: () => void;

  [SCORING_EVENTS.SCORE_UPDATED]: (payload: ScoringScoreUpdatedPayload) => void;
  [SCORING_EVENTS.LIFE_LOST]: (payload: ScoringLifeLostPayload) => void;
  [SCORING_EVENTS.TEAM_ELIMINATED]: (payload: ScoringTeamEliminatedPayload) => void;
  [SCORING_EVENTS.HIGH_SCORE_BEATEN]: (payload: ScoringScoreUpdatedPayload) => void;

  [TIMER_EVENTS.TIMER_STARTED]: (payload: TimerEventPayload) => void;
  [TIMER_EVENTS.TIMER_TICK]: (payload: TimerEventPayload) => void;
  [TIMER_EVENTS.TIMER_PAUSED]: (payload: TimerEventPayload) => void;
  [TIMER_EVENTS.TIMER_RESUMED]: (payload: TimerEventPayload) => void;
  [TIMER_EVENTS.TIMER_STOPPED]: (payload: TimerEventPayload) => void;
  [TIMER_EVENTS.TIMER_COMPLETED]: (payload: TimerEventPayload) => void;
  [TIMER_EVENTS.TIMER_MODIFIED]: (payload: TimerEventPayload) => void;

  [CONTROLS_EVENTS.PLAYER_ACTION]: (payload: ControlsPlayerActionPayload) => void;
  [CONTROLS_EVENTS.CONTROL_MAPPING_CHANGED]: () => void;
  [CONTROLS_EVENTS.DEVICE_CONNECTED]: (payload: { deviceId: string }) => void;
  [CONTROLS_EVENTS.DEVICE_DISCONNECTED]: (payload: { deviceId: string }) => void;

  [ASSET_EVENTS.LOAD_PROGRESS]: (payload: AssetLoadProgressPayload) => void;
  [ASSET_EVENTS.LOAD_COMPLETE]: () => void;
  [ASSET_EVENTS.LOAD_ERROR]: (payload: AssetLoadErrorPayload) => void;
  [ASSET_EVENTS.CACHE_CLEARED]: () => void;

  [POWERUP_EVENTS.ACTIVATED]: (payload: PowerUpEventPayload) => void;
  [POWERUP_EVENTS.DEACTIVATED]: (payload: PowerUpEventPayload) => void;
  [POWERUP_EVENTS.EXPIRED]: (payload: PowerUpEventPayload) => void;

  // Add Transition Events
  [TRANSITION_EVENTS.START]: (payload: TransitionStartPayload) => void;
  [TRANSITION_EVENTS.END]: (payload: TransitionEndPayload) => void;
  [TRANSITION_EVENTS.POWERUP_SELECTED]: (payload: TransitionPowerupSelectedPayload) => void;

  // Add Game Specific Events
  [GAME_EVENTS.ANSWER_SELECTED]: (payload: AnswerSelectedPayload) => void;
  // Add other game events here...

  // Add Settings Events
  [SETTINGS_EVENTS.SET_GLOBAL_VOLUME]: (volume: number) => void;
  [SETTINGS_EVENTS.SET_MUSIC_MUTED]: (muted: boolean) => void;
  [SETTINGS_EVENTS.SET_SFX_MUTED]: (muted: boolean) => void;
} 