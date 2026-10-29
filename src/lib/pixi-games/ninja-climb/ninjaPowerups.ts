/** Ninja Climb starting power-ups (setup + runtime). */

export type NinjaPowerupId = 'teleport' | 'rope' | 'smoke'

export interface NinjaPowerupsConfig {
  /** Master switch — when false, no power-ups are granted. */
  enabled: boolean
  teleport: boolean
  rope: boolean
  smoke: boolean
  /** Snakes-and-ladders shortcut nodes on the mountain. */
  shortcuts: boolean
}

export const DEFAULT_NINJA_POWERUPS: NinjaPowerupsConfig = {
  enabled: true,
  teleport: true,
  rope: true,
  smoke: true,
  shortcuts: true,
}

export const NINJA_POWERUP_DEFINITIONS: Array<{
  id: NinjaPowerupId
  label: string
  description: string
  hotkey: string
}> = [
  {
    id: 'teleport',
    label: 'Shadow Teleport',
    description: 'Jump +120 and drop a barrier behind you.',
    hotkey: 'Z',
  },
  {
    id: 'rope',
    label: 'Kunai Rope',
    description: 'Pull opponent −50; +50% on your next 3 scores.',
    hotkey: 'X',
  },
  {
    id: 'smoke',
    label: 'Smoke Bomb',
    description: 'Opponent scores −30% for their next 2 answers.',
    hotkey: 'C',
  },
]

export function getEnabledNinjaPowerupIds(config: NinjaPowerupsConfig): NinjaPowerupId[] {
  if (!config.enabled) return []
  const ids: NinjaPowerupId[] = []
  if (config.teleport) ids.push('teleport')
  if (config.rope) ids.push('rope')
  if (config.smoke) ids.push('smoke')
  return ids
}
