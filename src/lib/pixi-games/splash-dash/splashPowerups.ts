/** Splash Dash floating pickup power-ups (setup + runtime). */

export type SplashPowerupId = 'radioactive' | 'immunity'

export type SplashPowerupIntervalSeconds = 30 | 60 | 120

export interface SplashPowerupsConfig {
  /** Master switch — when false, no pickups spawn. */
  enabled: boolean
  /** Seconds between pickup spawns (and delay before first spawn). */
  intervalSeconds: SplashPowerupIntervalSeconds
  radioactive: boolean
  immunity: boolean
}

export const DEFAULT_SPLASH_POWERUPS: SplashPowerupsConfig = {
  enabled: true,
  intervalSeconds: 120,
  radioactive: true,
  immunity: true,
}

export const SPLASH_POWERUP_INTERVAL_OPTIONS: SplashPowerupIntervalSeconds[] = [30, 60, 120]

export const SPLASH_POWERUP_DEFINITIONS: Array<{
  id: SplashPowerupId
  label: string
}> = [
  { id: 'radioactive', label: 'Radioactive' },
  { id: 'immunity', label: 'Immunity' },
]

export function formatSplashIntervalLabel(seconds: SplashPowerupIntervalSeconds): string {
  if (seconds === 30) return '30s'
  if (seconds === 60) return '1m'
  return '2m'
}

export function getEnabledSplashPickupTypes(
  config: SplashPowerupsConfig
): SplashPowerupId[] {
  if (!config.enabled) return []
  const types: SplashPowerupId[] = []
  if (config.radioactive) types.push('radioactive')
  if (config.immunity) types.push('immunity')
  return types
}
