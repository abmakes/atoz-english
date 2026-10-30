export const VOICE_EFFECTS = ['original', 'robot', 'tiny-alien', 'giant'] as const

export type VoiceEffect = (typeof VOICE_EFFECTS)[number]

export const VOICE_LABELS: Record<VoiceEffect, string> = {
  original: 'Original',
  robot: 'Robot',
  'tiny-alien': 'Tiny Alien',
  giant: 'Giant',
}

/** Playback rate applied to the original recording. Robot stays at 1. */
export function playbackRateFor(effect: VoiceEffect): number {
  if (effect === 'tiny-alien') return 1.55
  if (effect === 'giant') return 0.68
  return 1
}

export function resolveVoiceEffect(
  effect: VoiceEffect,
  allowFunnyVoices: boolean
): VoiceEffect {
  if (!allowFunnyVoices && effect !== 'original') return 'original'
  return effect
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
