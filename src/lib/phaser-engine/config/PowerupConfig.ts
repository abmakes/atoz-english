/** 
 * Defines a specific type of power-up available in the game. 
 */
export interface PowerupDefinition {
  /** Unique identifier for this type of power-up (e.g., 'double_points', 'shield'). */
  id: string;
  /** User-friendly display name for the power-up. */
  name: string;
  /** Optional description of the power-up's effect. */
  description?: string;
  /** Optional duration in seconds for timed power-ups. If undefined, the power-up may be permanent or event-triggered. */
  durationSeconds?: number;
  /** A string identifying the logic or effect associated with this power-up (implementation specific). */
  effectType: string;
  /** Optional parameters specific to the power-up's effect (e.g., { multiplier: 2 } for double points). */
  effectParams?: Record<string, unknown>; 
  /** Optional key/alias of the asset used for the power-up's visual representation (e.g., icon). */
  assetKey?: string;
}

/** 
 * Configuration container for all power-up related settings. 
 */
export interface PowerupConfig {
  /** An array defining all types of power-ups that can appear in the game. */
  availablePowerups: PowerupDefinition[]; 
  /** Optional configuration defining how power-ups are introduced into the game (e.g., spawn timing, locations, award conditions). */
  spawnMechanic?: Record<string, unknown>; 
  /** Optional flag to indicate if power-ups should be used in this game session. Defaults to false. */
  powerupsEnabled?: boolean;
}

/**
 * Defines the specific power-ups available for the standard score-based game modes.
 * TODO: Consider organizing these further if different game modes or features
 * require vastly different sets of power-ups.
 */
export const STANDARD_SCORE_MODE_POWERUPS: PowerupDefinition[] = [
    {
        id: 'double_points',
        name: 'Double Points',
        description: 'Doubles points earned for this question.',
        // No durationSeconds - lasts until manually deactivated
        effectType: 'score_multiplier',
        effectParams: { multiplier: 2 },
        assetKey: 'double-points-icon' // Placeholder asset key
    },
    {
        id: 'time_extension',
        name: 'Time Extension',
        description: 'Adds extra time to the question timer.',
        durationSeconds: 10,
        effectType: 'timer_modifier',
        effectParams: { amount: 5 }, // Adds 5 seconds
        assetKey: 'time-extension-icon' // Placeholder asset key
    },
    {
        id: 'fifty_fifty',
        name: '50/50',
        description: 'Removes half of the incorrect answer options.',
        durationSeconds: 10,
        effectType: 'answer_modifier',
        assetKey: 'fifty-fifty-icon' // Placeholder asset key
    },
    {
        id: 'comeback',
        name: 'Comeback',
        description: 'Gives bonus points for teams that are behind.',
        effectType: 'score_boost',
        durationSeconds: 30,
        effectParams: { multiplier: 1.5, minPointsBehind: 20 },
        assetKey: 'comeback-icon' // Placeholder asset key
    }
];

/**
 * Default configuration for power-ups, typically overridden during game setup.
 */
export const DEFAULT_POWERUP_CONFIG: PowerupConfig = {
  availablePowerups: [],
  powerupsEnabled: false,
};

// Re-export types if needed elsewhere, though importing from GameConfig is often cleaner
// export type { PowerupDefinition, PowerupConfig };
