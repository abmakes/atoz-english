/**
 * Event type definitions for the Phaser engine.
 * Provides type-safe event communication throughout the game system.
 */

// Base event interface for all engine events
export interface EngineEvents {
  // Engine lifecycle events
  'engine:initialized': () => void;
  'engine:destroyed': () => void;
  'engine:resized': (payload: { width: number; height: number }) => void;
  'engine:ready': () => void;
  'engine:readyForGame': () => void;
  'engine:fpsUpdated': (payload: { fps: number; targetFPS: number }) => void;
  'engine:beforeFixedUpdate': (payload: { deltaTime: number }) => void;
  'engine:afterFixedUpdate': (payload: { deltaTime: number }) => void;
  'engine:gameSpeedChanged': (payload: { speed: number; previousSpeed: number }) => void;

  // Game state events
  'game:started': () => void;
  'game:paused': () => void;
  'game:resumed': () => void;
  'game:ended': (payload: { scores: Array<{ playerName: string; score: number }>; winner: string }) => void;
  'game:over': (payload: { finalScore: number; clickCount: number }) => void;
  'game:phaseChanged': (payload: { phase: string; previousPhase: string }) => void;
  'game:activeTeamChanged': (payload: { teamId: string; previousTeamId: string }) => void;

  // Timer events
  'timer:created': (payload: { timerId: string; duration: number }) => void;
  'timer:started': (payload: { timerId: string }) => void;
  'timer:paused': (payload: { timerId: string }) => void;
  'timer:resumed': (payload: { timerId: string }) => void;
  'timer:completed': (payload: { timerId: string; duration: number; elapsed: number }) => void;
  'timer:stopped': (payload: { timerId: string }) => void;
  'timer:removed': (payload: { timerId: string }) => void;
  'timer:modified': (payload: { timerId: string }) => void;
  'timer:tick': (payload: { timerId: string; elapsed: number; remaining?: number; duration: number }) => void;

  // Scoring events
  'score:added': (payload: { teamId: string | number; points: number; newTotal: number }) => void;
  'score:subtracted': (payload: { teamId: string | number; points: number; newTotal: number }) => void;
  'score:reset': (payload: { teamId: string | number }) => void;
  'score:updated': (payload: { teamId: string | number; newTotal: number }) => void;
  'score:lifeLost': (payload: { teamId: string | number; remainingLives: number }) => void;
  'score:teamEliminated': (payload: { teamId: string | number }) => void;

  // Power-up events
  'powerup:activated': (payload: { typeId: string; targetId: string | number; instanceId: string }) => void;
  'powerup:deactivated': (payload: { typeId: string; targetId: string | number; instanceId: string }) => void;
  'powerup:expired': (payload: { typeId: string; targetId: string | number; instanceId: string }) => void;

  // Question/Answer events
  'question:loaded': (payload: { questionId: string; question: string }) => void;
  'question:displayed': (payload: { questionId: string }) => void;
  'answer:selected': (payload: { 
    questionId: string; 
    selectedOptionId: string | null; 
    isCorrect: boolean; 
    teamId: string | number; 
    remainingTimeMs: number;
    scoreMultiplier?: number;
  }) => void;
  'question:timeout': (payload: { questionId: string; teamId: string | number }) => void;

  // Audio events
  'audio:loaded': (payload: { soundId: string }) => void;
  'audio:played': (payload: { soundId: string }) => void;
  'audio:stopped': (payload: { soundId: string }) => void;
  'audio:volumeChanged': (payload: { soundId: string; volume: number }) => void;

  // Asset loading events
  'asset:loaded': (payload: { assetKey: string; assetType: string }) => void;
  'asset:failed': (payload: { assetKey: string; error: string }) => void;
  'asset:progress': (payload: { loaded: number; total: number; percentage: number }) => void;

  // Input events
  'input:keydown': (payload: { key: string; code: string }) => void;
  'input:keyup': (payload: { key: string; code: string }) => void;
  'input:pointerdown': (payload: { x: number; y: number; button: number }) => void;
  'input:pointerup': (payload: { x: number; y: number; button: number }) => void;
  'input:pointermove': (payload: { x: number; y: number }) => void;

  // Controls events
  'controls:playerAction': (payload: ControlsPlayerActionPayload) => void;
  'controls:actionStarted': (payload: { action: string; playerId: string | number }) => void;
  'controls:actionEnded': (payload: { action: string; playerId: string | number }) => void;

  // Transition events
  'transition:started': (payload: { type: string; message: string }) => void;
  'transition:ended': (payload: { type: string }) => void;
  'transition:powerupSelected': (payload: { powerupId: string; targetId: string | number }) => void;

  // Settings events
  'settings:updated': () => void;
  'settings:setGlobalVolume': (volume: number) => void;
  'settings:setMusicMuted': (muted: boolean) => void;
  'settings:setSfxMuted': (muted: boolean) => void;

  // Test events
  'test:incrementScore': () => void;
  'test:changeMessage': (newMessage: string) => void;
}

// Event constants for easy reference
export const ENGINE_EVENTS = {
  INITIALIZED: 'engine:initialized' as const,
  DESTROYED: 'engine:destroyed' as const,
  RESIZED: 'engine:resized' as const,
  READY: 'engine:ready' as const,
  ENGINE_READY_FOR_GAME: 'engine:readyForGame' as const,
  FPS_UPDATED: 'engine:fpsUpdated' as const,
  BEFORE_FIXED_UPDATE: 'engine:beforeFixedUpdate' as const,
  AFTER_FIXED_UPDATE: 'engine:afterFixedUpdate' as const,
  GAME_SPEED_CHANGED: 'engine:gameSpeedChanged' as const,
} as const;

export const GAME_EVENTS = {
  STARTED: 'game:started' as const,
  PAUSED: 'game:paused' as const,
  RESUMED: 'game:resumed' as const,
  ENDED: 'game:ended' as const,
  PHASE_CHANGED: 'game:phaseChanged' as const,
  ANSWER_SELECTED: 'answer:selected' as const,
} as const;

export const TIMER_EVENTS = {
  CREATED: 'timer:created' as const,
  STARTED: 'timer:started' as const,
  PAUSED: 'timer:paused' as const,
  RESUMED: 'timer:resumed' as const,
  COMPLETED: 'timer:completed' as const,
  TIMER_COMPLETED: 'timer:completed' as const,
  STOPPED: 'timer:stopped' as const,
  TIMER_STOPPED: 'timer:stopped' as const,
  REMOVED: 'timer:removed' as const,
  MODIFIED: 'timer:modified' as const,
  TIMER_MODIFIED: 'timer:modified' as const,
  TIMER_TICK: 'timer:tick' as const,
} as const;

export const GAME_STATE_EVENTS = {
  GAME_PAUSED: 'game:paused' as const,
  GAME_RESUMED: 'game:resumed' as const,
  GAME_ENDED: 'game:ended' as const,
  PHASE_CHANGED: 'game:phaseChanged' as const,
  ACTIVE_TEAM_CHANGED: 'game:activeTeamChanged' as const,
} as const;

export const SCORING_EVENTS = {
  ADDED: 'score:added' as const,
  SUBTRACTED: 'score:subtracted' as const,
  RESET: 'score:reset' as const,
  SCORE_UPDATED: 'score:updated' as const,
  LIFE_LOST: 'score:lifeLost' as const,
  TEAM_ELIMINATED: 'score:teamEliminated' as const,
} as const;

export const POWERUP_EVENTS = {
  ACTIVATED: 'powerup:activated' as const,
  DEACTIVATED: 'powerup:deactivated' as const,
  EXPIRED: 'powerup:expired' as const,
} as const;

export const QUESTION_EVENTS = {
  LOADED: 'question:loaded' as const,
  DISPLAYED: 'question:displayed' as const,
  ANSWER_SELECTED: 'answer:selected' as const,
  TIMEOUT: 'question:timeout' as const,
} as const;

export const AUDIO_EVENTS = {
  LOADED: 'audio:loaded' as const,
  PLAYED: 'audio:played' as const,
  STOPPED: 'audio:stopped' as const,
  VOLUME_CHANGED: 'audio:volumeChanged' as const,
} as const;

export const ASSET_EVENTS = {
  LOADED: 'asset:loaded' as const,
  FAILED: 'asset:failed' as const,
  PROGRESS: 'asset:progress' as const,
} as const;

export const INPUT_EVENTS = {
  KEYDOWN: 'input:keydown' as const,
  KEYUP: 'input:keyup' as const,
  POINTERDOWN: 'input:pointerdown' as const,
  POINTERUP: 'input:pointerup' as const,
  POINTERMOVE: 'input:pointermove' as const,
} as const;

export const CONTROLS_EVENTS = {
  PLAYER_ACTION: 'controls:playerAction' as const,
  ACTION_STARTED: 'controls:actionStarted' as const,
  ACTION_ENDED: 'controls:actionEnded' as const,
} as const;

export const TRANSITION_EVENTS = {
  STARTED: 'transition:started' as const,
  ENDED: 'transition:ended' as const,
  END: 'transition:ended' as const,
  POWERUP_SELECTED: 'transition:powerupSelected' as const,
} as const;

export const SETTINGS_EVENTS = {
  UPDATED: 'settings:updated' as const,
  SET_GLOBAL_VOLUME: 'settings:setGlobalVolume' as const,
  SET_MUSIC_MUTED: 'settings:setMusicMuted' as const,
  SET_SFX_MUTED: 'settings:setSfxMuted' as const,
} as const;

export interface EngineResizedPayload {
  width: number;
  height: number;
}

export interface ControlsPlayerActionPayload {
  action: string;
  value: boolean; // Pressed state (true/false)
  playerId: string | number;
  device: 'keyboard' | 'pointer' | 'unknown';
  position?: { x: number; y: number }; // Optional position for pointer events
}

export interface TimerEventPayload {
  timerId: string;
  elapsed: number;
  remaining?: number;
  duration: number;
}

export interface TransitionPowerupSelectedPayload {
  powerupId: string;
  targetId: string | number;
}

export interface PowerUpEventPayload {
  typeId: string;
  targetId: string | number;
  instanceId: string;
}

export interface ScoringScoreUpdatedPayload {
  teamId: string | number;
  newTotal: number;
}

export interface ScoringLifeLostPayload {
  teamId: string | number;
  remainingLives: number;
}

export interface ScoringTeamEliminatedPayload {
  teamId: string | number;
}