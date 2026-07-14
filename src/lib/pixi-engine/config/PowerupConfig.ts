/**
 * Defines a specific type of power-up / power-down available in the game.
 *
 * Add new entries to STANDARD_SCORE_MODE_POWERUPS and (if selectable in setup)
 * PowerupsData + GameContainer mapping — the spin wheel and effect registry
 * read from this catalog.
 */
export type PowerPolarity = 'buff' | 'debuff';

export interface PowerupDefinition {
  /** Unique identifier (e.g. 'double_points', 'faster_clock'). */
  id: string;
  /** User-friendly display name. */
  name: string;
  /** Optional description of the effect. */
  description?: string;
  /** Timed duration in seconds. Omit for one-shot / until consumed. */
  durationSeconds?: number;
  /** Effect handler key used by game logic. */
  effectType: string;
  /** Parameters for the effect handler. */
  effectParams?: Record<string, unknown>;
  /** Optional icon asset key. */
  assetKey?: string;
  /** Helpful buff vs hindering power-down. */
  polarity: PowerPolarity;
  /**
   * Key on PowerupsData / setup toggles (camelCase).
   * Omit for internal-only definitions that are never toggled in setup.
   */
  setupKey?: string;
  /**
   * Copies placed on the dynamic spin wheel at match start.
   * Comeback uses 0 — it is injected only when a team is far enough behind.
   */
  initialWheelCopies?: number;
  /**
   * Minimum points behind the leader required before this can appear on the wheel.
   * Used by comeback (and any future catch-up powers).
   */
  minPointsBehind?: number;
}

/**
 * Configuration container for all power-up related settings.
 */
export interface PowerupConfig {
  availablePowerups: PowerupDefinition[];
  spawnMechanic?: Record<string, unknown>;
  powerupsEnabled?: boolean;
}

/**
 * Catalog of Score Attack spin-wheel powers.
 * Swap, add, or disable entries here — setup UI and wheel pool derive from this list.
 */
export const STANDARD_SCORE_MODE_POWERUPS: PowerupDefinition[] = [
  {
    id: 'double_points',
    name: 'Double Points',
    description: 'Doubles points earned for this question.',
    effectType: 'score_multiplier',
    effectParams: { multiplier: 2 },
    assetKey: 'double-points-icon',
    polarity: 'buff',
    setupKey: 'doublePoints',
    initialWheelCopies: 2,
  },
  {
    id: 'time_extension',
    name: 'Time Extension',
    description: 'Adds extra time to the question timer.',
    durationSeconds: 10,
    effectType: 'timer_modifier',
    effectParams: { amount: 5 },
    assetKey: 'time-extension-icon',
    polarity: 'buff',
    setupKey: 'timeExtension',
    initialWheelCopies: 2,
  },
  {
    id: 'fifty_fifty',
    name: '50/50',
    description: 'Removes half of the incorrect answer options.',
    durationSeconds: 10,
    effectType: 'answer_modifier',
    assetKey: 'fifty-fifty-icon',
    polarity: 'buff',
    setupKey: 'fiftyFifty',
    initialWheelCopies: 2,
  },
  {
    id: 'comeback',
    name: 'Comeback',
    description: 'For 60 seconds, earn 50% extra points each turn. Only available when behind by more than 100 points.',
    effectType: 'score_boost',
    durationSeconds: 60,
    effectParams: { multiplier: 1.5, minPointsBehind: 100 },
    assetKey: 'comeback-icon',
    polarity: 'buff',
    setupKey: 'comeback',
    initialWheelCopies: 0,
    minPointsBehind: 100,
  },
  {
    id: 'faster_clock',
    name: 'Faster Clock',
    description: 'Your question timer runs out 20% faster.',
    effectType: 'timer_speedup',
    effectParams: { durationFactor: 0.8 },
    assetKey: 'faster-clock-icon',
    polarity: 'debuff',
    setupKey: 'fasterClock',
    initialWheelCopies: 0,
  },
  {
    id: 'blurred_vision',
    name: 'Blurred Vision',
    description: 'Answers start blurred and clear over 10 seconds.',
    effectType: 'vision_blur',
    effectParams: { clearDurationMs: 10000 },
    assetKey: 'blurred-vision-icon',
    polarity: 'debuff',
    setupKey: 'blurredVision',
    initialWheelCopies: 0,
  },
];

export const DEFAULT_POWERUP_CONFIG: PowerupConfig = {
  availablePowerups: [],
  powerupsEnabled: false,
};

/** Setup-toggle labels for the game setup panel (derived from catalog). */
export function getScoreModeSetupPowerOptions(): Array<{
  setupKey: string;
  id: string;
  name: string;
  polarity: PowerPolarity;
}> {
  return STANDARD_SCORE_MODE_POWERUPS.filter((p) => p.setupKey).map((p) => ({
    setupKey: p.setupKey!,
    id: p.id,
    name: p.name,
    polarity: p.polarity,
  }));
}

/** Resolve a PowerupsData-style toggle map into catalog definitions. */
export function filterPowerupsBySetupToggles(
  toggles: Record<string, boolean>
): PowerupDefinition[] {
  return STANDARD_SCORE_MODE_POWERUPS.filter((powerup) => {
    if (!powerup.setupKey) return false;
    return Boolean(toggles[powerup.setupKey]);
  });
}
