export {};

import { AudioConfig } from '../core/AudioManager';
import { type PowerupConfig, DEFAULT_POWERUP_CONFIG } from './PowerupConfig';

/**
 * Configuration for a single team participating in the game.
 */
export interface TeamConfig {
  /** Unique identifier for the team (can be string or number). */
  id: string | number;
  /** Display name of the team. */
  name: string;
  /** Optional color representation for the team (e.g., hex string like '#FF0000'). */
  color?: string;
  /** Optional list of players belonging to this team. */
  players?: { id: string | number; name: string }[];
  /** Optional initial number of lives if the game mode supports it. */
  initialLives?: number;
  /** Optional maximum number of players allowed on this team. */
  maxPlayers?: number;
  /** Initial resources for the team, like score or lives. Keys are resource names, values are numbers. */
  startingResources?: ResourceMap;
}

/** 
 * A generic map for storing named numerical resources (e.g., score, lives, coins).
 * Key: Resource name (string)
 * Value: Resource amount (number)
 */
export type ResourceMap = Record<string, number>;

/** Base configuration common to all game modes. */
export interface BaseGameModeConfig {
  /** A string identifying the type of game mode (e.g., 'score', 'lives', 'timeAttack'). */
  type: string; 
  /** The user-friendly display name for the game mode. */
  name: string; 
}

/** Configuration specific to score-based game modes. */
export interface ScoreModeConfig extends BaseGameModeConfig {
  type: 'score';
  /** Optional score target a team needs to reach to potentially win. */
  targetScore?: number;
  /** Optional overall time limit for the game in seconds. */
  timeLimitSeconds?: number;
}

/** Configuration specific to lives-based game modes. */
export interface LivesModeConfig extends BaseGameModeConfig {
  type: 'lives';
  /** The number of lives each team starts with. */
  initialLives: number;
  /** Optional maximum number of lives a team can have. */
  maxLives?: number;
}

/** 
 * Union type representing the configuration for the specific game mode being played.
 * Extend this union with new game mode config interfaces as needed.
 */
export type GameModeConfig = ScoreModeConfig | LivesModeConfig;

/** 
 * Defines a single game rule processed by the RuleEngine. 
 * Rules are triggered by events and execute actions if conditions are met.
 */
export interface RuleDefinition {
  /** Unique identifier for this rule. */
  id: string;
  /** Optional description of what the rule does. */
  description?: string;
  /** The name of the event (from EventTypes) that triggers this rule evaluation. */
  triggerEvent: string;
  /** An array of conditions that must all evaluate to true for the actions to run. */
  conditions: ConditionDefinition[];
  /** An array of actions to execute sequentially if all conditions are met. */
  actions: ActionDefinition[];
  /** Optional number determining the order of rule execution (higher priority runs first). Defaults to 0. */
  priority?: number;
  /** Whether this rule is currently active. Defaults to true. */
  enabled?: boolean;
}

/** 
 * Defines a condition within a RuleDefinition. 
 * Compares a value from the game state or event payload against an expected value.
 */
export interface ConditionDefinition {
  /** The type of check to perform (e.g., compare a game state value, check timer status, check powerup). */
  type: 'compareState' | 'checkPowerup' | 'timerCheck'; // Add more as needed
  /** The property to check. Can be a path (e.g., 'gameState.currentPhase') or an ID (e.g., a timer ID). */
  property: string;
  /** The comparison operator to use. */
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  /** The expected value to compare the property against. Type should match the property being checked. */
  value: unknown;
}

/** 
 * Defines an action to be executed by the RuleEngine if a rule's conditions are met. 
 */
export interface ActionDefinition {
  /** The type of action to perform (e.g., change game phase, modify score, start a timer). */
  type: 'changePhase' | 'modifyScore' | 'startTimer' | 'activatePowerup' | 'playSound'; // Add more as needed
  /** A map of parameters required by the action type (e.g., { newPhase: 'playing' }, { amount: 10, teamId: 'team1' }). */
  params: Record<string, unknown>;
}

/** 
 * Configuration container for all game rules. 
 */
export interface RuleConfig {
  /** An array of RuleDefinition objects defining the game's logic. */
  rules: RuleDefinition[];
  /** Optional: A path to a JSON file from which to load rule definitions. */
  rulesPath?: string; 
}

/** 
 * Defines the mapping for a single input source (keyboard key, gamepad button/axis, touch area)
 * to a game action.
 */
export interface ActionMapping {
  /** Keyboard key code (e.g., 'KeyW', 'ArrowUp', 'Space'). */
  keyboard?: string;
  /** Gamepad button index (refer to standard gamepad mapping). */
  gamepadButton?: number;
  /** Gamepad axis configuration. */
  gamepadAxis?: {
    /** The index of the axis (e.g., 0 for left stick X, 1 for left stick Y). */
    index: number;
    /** The threshold the axis value must exceed (0 to 1). */
    threshold: number;
    /** The direction on the axis ('positive' or 'negative'). */
    direction: 'positive' | 'negative';
  };
  /** Identifier for a specific touch-sensitive area on the screen. */
  touchArea?: string;
}

/** 
 * Configuration for player input controls handled by the ControlsManager. 
 */
export interface ControlsConfig {
  /** 
   * A map defining which physical inputs trigger logical game actions.
   * Keys are logical action names (e.g., 'MOVE_UP', 'JUMP', 'CONFIRM').
   * Values are ActionMapping objects specifying the physical inputs.
   */
  actionMap: Record<string, ActionMapping>;
  /** Configuration specifying which player controls which input device. */
  playerMappings: PlayerControlMapping[]; 
  /** The deadzone for gamepad analog sticks (0 to 1), below which input is ignored. Defaults typically around 0.25. */
  gamepadDeadzone?: number;
}

/** 
 * Defines how a specific player is mapped to an input device. 
 */
export interface PlayerControlMapping {
  /** The unique identifier for the player this mapping applies to. */
  playerId: string | number;
  /** The type of input device this player uses ('auto' usually defaults to keyboard or first available gamepad). */
  deviceType: 'keyboard' | 'gamepad' | 'touch' | 'auto';
  /** Optional index for the device (e.g., which gamepad: 0, 1, etc.). */
  deviceIndex?: number;
}

/** 
 * Defines a single asset (e.g., image, sound, spritesheet) to be loaded. 
 */
export interface AssetDefinition {
  /** A unique alias or key used to reference this asset after loading. */
  key: string; 
  /** The source URL or path relative to the basePath where the asset file can be found. */
  src: string; 
  /** Optional: Additional data associated with the asset, such as frame dimensions for a spritesheet or atlas data. */
  data?: Record<string, unknown>; 
}

/** 
 * Defines a named collection (bundle) of assets that can be loaded together. 
 */
export interface AssetBundle {
  /** The name of the asset bundle, used for loading (e.g., 'common', 'level1'). */
  name: string;
  /** An array of AssetDefinition objects included in this bundle. */
  assets: AssetDefinition[];
}

/** 
 * Configuration for game assets managed by the AssetLoader or PixiJS Assets. 
 */
export interface AssetConfig {
  /** An optional base path prefixed to all asset source URLs. */
  basePath?: string; 
  /** An array of AssetBundle definitions for the game. */
  bundles: AssetBundle[]; 
  /** Optional: A list of font family names that should be explicitly loaded or verified. */
  requiredFonts?: string[]; 
}

/**
 * Audio configuration for the game
 */
export interface AudioConfiguration {
  /** Base path for audio assets */
  basePath?: string;
  /** Default volume for all sounds (0.0 to 1.0) */
  defaultVolume?: number;
  /** Whether to start muted */
  startMuted?: boolean;
  /** List of sounds to register */
  sounds: AudioConfig[];
}

/**
 * Configuration for how questions are handled
 */
export interface QuestionHandlingConfig {
  /** How questions are distributed: 'sharedPool' (all teams answer from the same pool) or 'perTeam' (questions divided equally). */
  distributionMode: 'sharedPool' | 'perTeam';
  /** Whether to randomize the order of questions before starting. */
  randomizeOrder: boolean;
  /** 
   * If distributionMode is 'perTeam', determines if the total number of questions asked should be 
   * truncated to ensure equal turns (e.g., 10 questions, 3 teams -> 9 questions total). 
   * If false, all questions are used, and some teams might get one less turn (in perTeam mode).
   */
  truncateForFairness?: boolean; 
}

/**
 * Defines the overall configuration structure for launching
 * and running a specific game instance within the PixiEngine.
 * This object aggregates all specific configurations needed by the various engine managers.
 */
export interface GameConfig {
  /** 
   * The unique identifier for the specific quiz, level, or content set being used.
   * Used for loading appropriate questions, scenarios, etc.
   */
  quizId: string;

  /** 
   * A unique slug identifying the type of game being played (e.g., 'multiple-choice', 'platformer').
   * Used by the engine to potentially load the correct BaseGame implementation.
   */
  gameSlug: string;

  /** An array configuring the teams (and optionally players) participating in the game. */
  teams: TeamConfig[];

  /** Configuration defining the specific game mode (e.g., score-based, lives-based) and its parameters. */
  gameMode: GameModeConfig;

  /** Configuration for game rules, defining event triggers, conditions, and actions for game logic. */
  rules: RuleConfig;

  /** Configuration for mapping player inputs (keyboard, gamepad, touch) to game actions. */
  controls: ControlsConfig;

  /** Configuration specifying all required game assets (images, sounds, fonts, etc.) organized into bundles. */
  assets: AssetConfig;

  /** Configuration defining available power-ups and potentially how they spawn or are awarded. */
  powerups: PowerupConfig;

  /** 
   * A setting typically used in quiz games to control the time limit for each question,
   * often derived from a user-selected intensity level (e.g., easy=60s, medium=30s, hard=15s).
   * Expressed in seconds. 
   */
  intensityTimeLimit: number;

  /** Audio configuration */
  audio?: AudioConfiguration;
  
  /** Optional: Initial mute state for music when the game starts. Overrides stored settings. */
  initialMusicMuted?: boolean;
  /** Optional: Initial mute state for SFX when the game starts. Overrides stored settings. */
  initialSfxMuted?: boolean;

  /** Optional question handling configuration */
  questionHandling?: QuestionHandlingConfig;
}

// --- Default Configurations ---

export const DEFAULT_TEAM_CONFIG: Omit<TeamConfig, 'id'> = {
  name: 'Team',
  color: '#FFFFFF', // Keep as string
  startingResources: { score: 0 },
};

export const DEFAULT_SCORE_MODE_CONFIG: Omit<ScoreModeConfig, 'type' | 'name'> = {
  timeLimitSeconds: 60, // Default to 1 minute
};

export const DEFAULT_LIVES_MODE_CONFIG: Omit<LivesModeConfig, 'type' | 'name' | 'initialLives'> = {
  maxLives: 5,
};

export const DEFAULT_CONTROLS_CONFIG: ControlsConfig = {
  actionMap: { // Example default mapping
    UP: { keyboard: 'ArrowUp' },
    DOWN: { keyboard: 'ArrowDown' },
    LEFT: { keyboard: 'ArrowLeft' },
    RIGHT: { keyboard: 'ArrowRight' },
    ACTION_A: { keyboard: 'KeyZ', gamepadButton: 0 },
    ACTION_B: { keyboard: 'KeyX', gamepadButton: 1 },
  },
  playerMappings: [], // Must be configured per game
  gamepadDeadzone: 0.25,
};

export const DEFAULT_ASSET_CONFIG: AssetConfig = {
  bundles: [],
};

export const DEFAULT_RULE_CONFIG: RuleConfig = {
  rules: [],
};

export const DEFAULT_QUESTION_HANDLING_CONFIG: QuestionHandlingConfig = {
  distributionMode: 'perTeam', // Default to turn-based
  randomizeOrder: true,       // Default to shuffling
  truncateForFairness: true, // Default to ensuring equal turns
};

export const DEFAULT_GAME_CONFIG: Omit<GameConfig, 'teams' | 'gameMode' | 'quizId' | 'gameSlug'> = {
  rules: DEFAULT_RULE_CONFIG,
  controls: DEFAULT_CONTROLS_CONFIG,
  assets: DEFAULT_ASSET_CONFIG,
  powerups: DEFAULT_POWERUP_CONFIG,
  intensityTimeLimit: 30, // Default to 30 seconds if not provided
  questionHandling: DEFAULT_QUESTION_HANDLING_CONFIG,
};

// --- Type Guards ---

export function isScoreModeConfig(config: GameModeConfig): config is ScoreModeConfig {
  return config.type === 'score';
}

export function isLivesModeConfig(config: GameModeConfig): config is LivesModeConfig {
  return config.type === 'lives';
}

// Add type guards for other potentially ambiguous config types if needed

// --- Validation Functions ---

function validateTeamConfig(team: TeamConfig, index: number): string[] {
  const errors: string[] = [];
  // Check if id exists and is string or number
  if (team.id === undefined || team.id === null || (typeof team.id !== 'string' && typeof team.id !== 'number') || String(team.id).trim() === '') {
    errors.push(`Team ${index}: Invalid or missing id.`);
  }
  if (!team.name || typeof team.name !== 'string') errors.push(`Team ${index} (${team.id ?? 'N/A'}): Invalid or missing name.`);
  // Validate color string format
  if (team.color !== undefined && (typeof team.color !== 'string' || !/^#[0-9A-F]{6}$/i.test(team.color))) {
      errors.push(`Team ${index} (${team.id ?? 'N/A'}): Invalid color format (must be #RRGGBB hex string).`);
  }
  // Add more validation as needed (resources, etc.)
  return errors;
}

function validateGameModeConfig(config: GameModeConfig): string[] {
  const errors: string[] = [];
  if (!config || typeof config.type !== 'string') return ['Invalid or missing gameMode.type'];
  
  const configType = config.type; // Store type before narrowing

  if (configType === 'score') {
    const scoreConfig = config as ScoreModeConfig;
    if (scoreConfig.targetScore !== undefined && typeof scoreConfig.targetScore !== 'number') errors.push('GameMode (score): targetScore must be a number.');
    if (scoreConfig.timeLimitSeconds !== undefined && typeof scoreConfig.timeLimitSeconds !== 'number') errors.push('GameMode (score): timeLimitSeconds must be a number.');
  } else if (configType === 'lives') {
    const livesConfig = config as LivesModeConfig;
    if (typeof livesConfig.initialLives !== 'number' || livesConfig.initialLives <= 0) errors.push('GameMode (lives): initialLives must be a positive number.');
    if (livesConfig.maxLives !== undefined && typeof livesConfig.maxLives !== 'number') errors.push('GameMode (lives): maxLives must be a number.');
  } else {
    // Log the actual type received before it was narrowed to never
    errors.push(`GameMode: Unknown type '${configType}'.`); 
  }
  return errors;
}

// Mark unused parameters with underscores
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateRuleConfig(_config: RuleConfig): string[] { return []; }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateControlsConfig(_config: ControlsConfig): string[] { return []; }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateAssetConfig(_config: AssetConfig): string[] { return []; }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validatePowerupConfig(_config: PowerupConfig): string[] { 
  // Validation for powerupsEnabled could be added here if needed (e.g., must be boolean)
  // For now, as it's optional, no explicit validation is strictly required.
  return []; 
}

// <<< ADDED: Validation for Question Handling Config >>>
function validateQuestionHandlingConfig(config?: QuestionHandlingConfig): string[] {
  if (!config) return []; // Optional, so okay if missing
  const errors: string[] = [];
  if (!['sharedPool', 'perTeam'].includes(config.distributionMode)) {
    errors.push('QuestionHandling: Invalid distributionMode.');
  }
  if (typeof config.randomizeOrder !== 'boolean') {
    errors.push('QuestionHandling: randomizeOrder must be a boolean.');
  }
  if (config.truncateForFairness !== undefined && typeof config.truncateForFairness !== 'boolean') {
    errors.push('QuestionHandling: truncateForFairness must be a boolean if provided.');
  }
  return errors;
}
// <<< END ADDED >>>

/**
 * Validates a complete GameConfig object.
 * Checks required fields and calls sub-validators.
 * @param config - The GameConfig object to validate.
 * @returns An array of error strings. An empty array indicates a valid config.
 */
export function validateGameConfig(config: GameConfig): string[] {
  let errors: string[] = [];

  if (!config) return ['GameConfig is null or undefined.'];

  // Validate Teams
  if (!Array.isArray(config.teams) || config.teams.length === 0) {
    errors.push('GameConfig.teams must be a non-empty array.');
  } else {
    config.teams.forEach((team, index) => {
      errors = errors.concat(validateTeamConfig(team, index));
    });
    // Check for duplicate team IDs
    const teamIds = config.teams.map(t => t.id);
    if (new Set(teamIds).size !== teamIds.length) {
      errors.push('GameConfig.teams contains duplicate IDs.');
    }
  }

  // Validate GameMode
  errors = errors.concat(validateGameModeConfig(config.gameMode));

  // Validate other sections
  if (!config.rules) errors.push('GameConfig.rules is missing.');
  else errors = errors.concat(validateRuleConfig(config.rules));

  if (!config.controls) errors.push('GameConfig.controls is missing.');
  else errors = errors.concat(validateControlsConfig(config.controls));

  if (!config.assets) errors.push('GameConfig.assets is missing.');
  else errors = errors.concat(validateAssetConfig(config.assets));

  if (!config.powerups) errors.push('GameConfig.powerups is missing.');
  else errors = errors.concat(validatePowerupConfig(config.powerups));
  
  // <<< ADDED: Validate questionHandling >>>
  errors = errors.concat(validateQuestionHandlingConfig(config.questionHandling));
  // <<< END ADDED >>>
  
  return errors;
}

/**
 * Creates a complete GameConfig object by merging partial configuration
 * with defaults, ensuring required fields (teams, gameMode, quizId, gameSlug) are present.
 *
 * @param partialConfig - An object containing the required `teams`, `gameMode`, `quizId`, `gameSlug`,
 *                        and any other partial overrides for the GameConfig.
 * @returns A complete GameConfig object.
 * @throws Throws an error if validation fails on the resulting config.
 */
export function createGameConfig(
    // Require quizId and gameSlug directly
    partialConfig: Pick<GameConfig, 'teams' | 'gameMode' | 'quizId' | 'gameSlug'>
                    & Partial<Omit<GameConfig, 'teams' | 'gameMode' | 'quizId' | 'gameSlug'>>
): GameConfig {
    // Merge default powerup config first, then partial config
    const defaultPowerupConf = DEFAULT_POWERUP_CONFIG;
    // Use partialConfig.powerups directly for checking the enabled flag
    const mergedPowerups: PowerupConfig = {
        ...defaultPowerupConf,
        ...(partialConfig.powerups ?? {}), // Spread the partial config itself
        // Ensure powerupsEnabled from partial config takes precedence
        powerupsEnabled: partialConfig.powerups?.powerupsEnabled // Use optional chaining
                         ?? defaultPowerupConf.powerupsEnabled // Fallback to default if partial or its enabled flag is undefined
    };

    const fullConfig: GameConfig = {
        ...DEFAULT_GAME_CONFIG,
        // Directly assign required fields
        quizId: partialConfig.quizId,
        gameSlug: partialConfig.gameSlug,
        teams: partialConfig.teams,
        gameMode: partialConfig.gameMode,
        // Merge optional overrides, using the merged powerups config
        rules: partialConfig.rules ?? DEFAULT_GAME_CONFIG.rules,
        controls: partialConfig.controls ?? DEFAULT_GAME_CONFIG.controls,
        assets: partialConfig.assets ?? DEFAULT_GAME_CONFIG.assets,
        powerups: mergedPowerups, // Use the merged powerup config
        intensityTimeLimit: partialConfig.intensityTimeLimit ?? DEFAULT_GAME_CONFIG.intensityTimeLimit,
        audio: partialConfig.audio ?? DEFAULT_GAME_CONFIG.audio,
        // <<< ADDED: Merge questionHandling config >>>
        questionHandling: { 
            ...DEFAULT_QUESTION_HANDLING_CONFIG, 
            ...(partialConfig.questionHandling ?? {}) 
        },
        // <<< END ADDED >>>
        initialMusicMuted: partialConfig.initialMusicMuted,
        initialSfxMuted: partialConfig.initialSfxMuted,
    };

    // Validate the final configuration
    const errors = validateGameConfig(fullConfig);
    if (errors.length > 0) {
        throw new Error(`Invalid GameConfig:\n- ${errors.join('\n- ')}`);
    }

    return fullConfig;
}

/**
 * Checks if a GameConfig object is valid.
 * @param config - The GameConfig object to validate.
 * @returns True if the config is valid, false otherwise.
 */
export function isValidGameConfig(config: GameConfig): boolean {
  const errors = validateGameConfig(config);
  if (errors.length > 0) {
    console.error('Invalid GameConfig:', errors);
    return false;
  }
  return true;
}
