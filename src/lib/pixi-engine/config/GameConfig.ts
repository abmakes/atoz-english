export {};

// TODO: Define these interfaces in detail in subtask 3.2
export interface TeamConfig {
  id: string | number;
  name: string;
  color?: string; // Changed to string
  players?: { id: string | number; name: string }[]; // Optional player details within a team
  initialLives?: number;
  maxPlayers?: number; // Max players if team-based
  startingResources?: ResourceMap; // e.g., { score: 0, lives: 3 }
}

// Base Resource Map (Example)
export type ResourceMap = Record<string, number>;

/** Base configuration for any game mode. */
export interface BaseGameModeConfig {
  /** Unique identifier for the game mode type. */
  type: string; 
  /** Display name for the game mode. */
  name: string; 
}

/** Example: Configuration for a score-based game mode. */
export interface ScoreModeConfig extends BaseGameModeConfig {
  type: 'score';
  targetScore?: number; // Optional score to reach for winning
  timeLimitSeconds?: number; // Optional time limit
}

/** Example: Configuration for a lives-based game mode. */
export interface LivesModeConfig extends BaseGameModeConfig {
  type: 'lives';
  initialLives: number;
  maxLives?: number;
}

// Union type for different game modes
export type GameModeConfig = ScoreModeConfig | LivesModeConfig; // Add other modes here

/** Defines a single game rule, potentially loaded from JSON. */
export interface RuleDefinition {
  id: string;
  description?: string;
  triggerEvent: string; // Event name from EventTypes that triggers this rule
  conditions: ConditionDefinition[]; // Conditions to meet for the rule to apply
  actions: ActionDefinition[]; // Actions to take if conditions are met
  priority?: number; // For ordering rule execution
  enabled?: boolean;
}

/** Defines a condition for a rule. */
export interface ConditionDefinition {
  type: 'compareState' | 'checkPowerup' | 'timerCheck' // etc.
  property: string; // e.g., 'gameState.currentPhase', 'scoring.teamScore[teamId]'
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: unknown; // Value to compare against (use type guards/checks when evaluating)
}

/** Defines an action for a rule. */
export interface ActionDefinition {
  type: 'changePhase' | 'modifyScore' | 'startTimer' | 'activatePowerup'; // etc.
  params: Record<string, unknown>; // Parameters for the action (use type assertions/checks)
}

/** Configuration for game rules. */
export interface RuleConfig {
  /** Array of rule definitions to apply. */
  rules: RuleDefinition[];
  /** Optional path to load rules from JSON. */
  rulesPath?: string; 
}

/** Mapping for a single player action. */
export interface ActionMapping {
  keyboard?: string; // e.g., 'KeyW', 'ArrowUp'
  gamepadButton?: number; // Gamepad button index
  gamepadAxis?: { index: number; threshold: number; direction: 'positive' | 'negative' };
  touchArea?: string; // Identifier for a touch region
}

/** Configuration for player controls. */
export interface ControlsConfig {
  /** Mapping from standard player actions (e.g., 'UP', 'DOWN', 'ACTION_A') to input sources. */
  actionMap: Record<string, ActionMapping>;
  /** Configuration per player/input device. */
  playerMappings: PlayerControlMapping[]; 
  /** Deadzone for analog sticks (0 to 1). */
  gamepadDeadzone?: number;
}

/** Defines control mapping for a specific player slot. */
export interface PlayerControlMapping {
  playerId: string | number; // Identifier for the player
  deviceType: 'keyboard' | 'gamepad' | 'touch' | 'auto'; // Preferred device
  deviceIndex?: number; // e.g., Gamepad index
}

/** Definition for a single asset to be loaded. */
export interface AssetDefinition {
  /** Unique alias/key for the asset. */
  key: string; 
  /** Source URL or path for the asset. */
  src: string; 
  /** Optional data associated with the asset (e.g., frame size for spritesheet). Use type assertions when accessing. */
  data?: Record<string, unknown>; 
}

/** Defines a bundle of assets. */
export interface AssetBundle {
  name: string;
  assets: AssetDefinition[];
}

/** Configuration specifying required assets. */
export interface AssetConfig {
  /** Base path for asset URLs. */
  basePath?: string; 
  /** Bundles of assets to load. */
  bundles: AssetBundle[]; 
  /** Optional: List of specific fonts to ensure are loaded. */
  requiredFonts?: string[]; 
}

/** Configuration for a single type of power-up. */
export interface PowerupDefinition {
  id: string; // Unique ID for the power-up type
  name: string; // Display name
  description?: string;
  durationSeconds?: number;
  effectType: string; // Identifier for the associated PowerUpEffect class/logic
  /** Parameters for the effect. Use type assertions when accessing. */
  effectParams?: Record<string, unknown>; 
  assetKey?: string; // Key for the visual representation (icon)
}

/** Configuration related to power-ups. */
export interface PowerupConfig {
  /** List of power-up types available in the game. */
  availablePowerups: PowerupDefinition[]; 
  /** How power-ups might spawn or be awarded (config depends on game). Use type assertions when accessing. */
  spawnMechanic?: Record<string, unknown>; 
}

/**
 * Defines the overall configuration structure for launching
 * and running a specific game instance within the PixiEngine.
 */
export interface GameConfig {
  /** The unique identifier for the quiz/content being used. */
  quizId: string;

  /** The unique slug identifying the specific game type (e.g., 'multiple-choice'). */
  gameSlug: string;

  /** Configuration for teams and players involved. */
  teams: TeamConfig[];

  /** Configuration defining the game mode and its specific settings. */
  gameMode: GameModeConfig;

  /** Configuration for game rules, win conditions, scoring modifiers. */
  rules: RuleConfig;

  /** Configuration for input controls and player mappings. */
  controls: ControlsConfig;

  /** Configuration specifying required assets (textures, sounds, etc.). */
  assets: AssetConfig;

  /** Configuration related to available power-ups and their behavior. */
  powerups: PowerupConfig;

  /** The time limit in seconds for each question based on intensity setting. */
  intensityTimeLimit: number;
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

export const DEFAULT_POWERUP_CONFIG: PowerupConfig = {
  availablePowerups: [],
};

export const DEFAULT_RULE_CONFIG: RuleConfig = {
  rules: [],
};

export const DEFAULT_GAME_CONFIG: Omit<GameConfig, 'teams' | 'gameMode' | 'quizId' | 'gameSlug'> = {
  rules: DEFAULT_RULE_CONFIG,
  controls: DEFAULT_CONTROLS_CONFIG,
  assets: DEFAULT_ASSET_CONFIG,
  powerups: DEFAULT_POWERUP_CONFIG,
  intensityTimeLimit: 30, // Default to 30 seconds if not provided
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
function validatePowerupConfig(_config: PowerupConfig): string[] { return []; }

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
    const fullConfig: GameConfig = {
        ...DEFAULT_GAME_CONFIG,
        // Directly assign required fields
        quizId: partialConfig.quizId,
        gameSlug: partialConfig.gameSlug,
        teams: partialConfig.teams,
        gameMode: partialConfig.gameMode,
        // Merge optional overrides
        rules: partialConfig.rules ?? DEFAULT_GAME_CONFIG.rules,
        controls: partialConfig.controls ?? DEFAULT_GAME_CONFIG.controls,
        assets: partialConfig.assets ?? DEFAULT_GAME_CONFIG.assets,
        powerups: partialConfig.powerups ?? DEFAULT_GAME_CONFIG.powerups,
        intensityTimeLimit: partialConfig.intensityTimeLimit ?? DEFAULT_GAME_CONFIG.intensityTimeLimit,
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
