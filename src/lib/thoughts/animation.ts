import { thoughtManifest } from '@/lib/thoughts/catalog'

/** Levels under this (after smoothing) hold the closed mouth frame. */
export const SILENCE_THRESHOLD = 0.08

const SMOOTHING = 0.35

export function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * Ease toward the raw level and remember that eased value in `state`.
 * `level` snaps to 0 under the silence threshold so a quiet room does not
 * leave the mouth half open, without forgetting the ease for the next sample.
 */
export function stepAmplitude(
  state: number,
  raw: number
): { state: number; level: number } {
  const sample = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0
  const previous = Number.isFinite(state) ? state : 0
  const next = Math.min(1, Math.max(0, previous + (sample - previous) * SMOOTHING))
  return {
    state: next,
    level: next < SILENCE_THRESHOLD ? 0 : next,
  }
}

/** Manifest rule: round(clamp(amplitude) * 4), with silence and NaN on frame 0. */
export function mouthFrameIndex(amplitude: number, frameCount = thoughtManifest.animation.mouth.frames): number {
  const last = Math.max(0, frameCount - 1)
  const safe = Number.isFinite(amplitude) ? Math.max(0, Math.min(1, amplitude)) : 0
  if (safe <= 0) return 0
  return Math.round(safe * last)
}

/**
 * Rest on frame 0, then play the manifest blink (frames 1, 2, 3, 0).
 * Each instance id gets its own phase. Reduced motion stays open.
 */
export function blinkFrame(
  nowMs: number,
  instanceId: string,
  reducedMotion: boolean
): number {
  if (reducedMotion) return 0
  const { sequence, transitionMs, idleRangeMs } = thoughtManifest.animation.eyes
  const frames = sequence.slice(1)
  const hash = hashString(instanceId || 'eye')
  const [idleMin, idleMax] = idleRangeMs
  const span = Math.max(1, idleMax - idleMin)
  const idle = idleMin + (hash % (span + 1))
  const blinkTotal = transitionMs.reduce((sum, ms) => sum + ms, 0)
  const cycle = idle + blinkTotal
  const t = ((nowMs + (hash % cycle)) % cycle + cycle) % cycle
  if (t < idle) return 0
  let cursor = idle
  for (let i = 0; i < transitionMs.length; i++) {
    cursor += transitionMs[i]
    if (t < cursor) return frames[i] ?? 0
  }
  return 0
}

export function idleBobPx(nowMs: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0
  return Math.sin(nowMs / 900) * 3
}
