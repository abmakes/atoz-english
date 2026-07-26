/**
 * Pure math / phase helpers for RopeProjectile (no Pixi dependency).
 */

export type RopePhase = 'idle' | 'extending' | 'holding' | 'retracting' | 'done'

export interface Vec2 {
  x: number
  y: number
}

export interface RopeTiming {
  extendDurationMs: number
  holdDurationMs: number
  retractDurationMs: number
}

export interface RopeSample {
  tip: Vec2
  /** Normalized progress along A→B for the tip (1 at B, 0 at A). */
  u: number
  length: number
  /** Radians; tip faces travel / along the rope toward B while extending. */
  rotation: number
  phase: RopePhase
}

export function lerpVec(a: Vec2, b: Vec2, t: number): Vec2 {
  const u = Math.max(0, Math.min(1, t))
  return {
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
  }
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.hypot(dx, dy)
}

export function angleToward(from: Vec2, to: Vec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

/** Smoothstep-ish ease out for extend (fast start, soft land). */
export function easeOutQuad(t: number): number {
  const u = Math.max(0, Math.min(1, t))
  return 1 - (1 - u) * (1 - u)
}

/** Ease in for retract (soft start, snap home). */
export function easeInQuad(t: number): number {
  const u = Math.max(0, Math.min(1, t))
  return u * u
}

/**
 * Map elapsed ms into phase + raw 0–1 within that phase.
 */
export function timingToPhase(
  elapsedMs: number,
  timing: RopeTiming
): { phase: RopePhase; phaseT: number; totalDone: boolean } {
  const extend = Math.max(1, timing.extendDurationMs)
  const hold = Math.max(0, timing.holdDurationMs)
  const retract = Math.max(1, timing.retractDurationMs)
  const t = Math.max(0, elapsedMs)

  if (t < extend) {
    return { phase: 'extending', phaseT: t / extend, totalDone: false }
  }
  if (t < extend + hold) {
    return {
      phase: 'holding',
      phaseT: hold <= 0 ? 1 : (t - extend) / hold,
      totalDone: false,
    }
  }
  if (t < extend + hold + retract) {
    return {
      phase: 'retracting',
      phaseT: (t - extend - hold) / retract,
      totalDone: false,
    }
  }
  return { phase: 'done', phaseT: 1, totalDone: true }
}

/**
 * Sample tip/body for a frame.
 * - extending: tip lerps A→B with easeOut; u 0→1
 * - holding: tip at B; u = 1
 * - retracting: tip lerps B→A with easeIn on (1 - phaseT); u 1→0
 *   When pullTargetDuringRetract, caller should pass live B as the tip
 *   (victim position) and A as caster — then tip = B, length = |B-A|.
 */
export function sampleRope(options: {
  phase: RopePhase
  phaseT: number
  pointA: Vec2
  pointB: Vec2
  /** When retracting with an attached victim, tip stays on B. */
  tipFollowsB?: boolean
  easeExtend?: (t: number) => number
  easeRetract?: (t: number) => number
}): RopeSample {
  const {
    phase,
    phaseT,
    pointA,
    pointB,
    tipFollowsB = false,
    easeExtend = easeOutQuad,
    easeRetract = easeInQuad,
  } = options

  let u = 0
  let tip: Vec2
  let rotation: number

  if (phase === 'idle') {
    tip = { ...pointA }
    u = 0
    rotation = angleToward(pointA, pointB)
  } else if (phase === 'extending') {
    u = easeExtend(phaseT)
    tip = lerpVec(pointA, pointB, u)
    rotation = angleToward(pointA, tip)
  } else if (phase === 'holding') {
    u = 1
    tip = { ...pointB }
    rotation = angleToward(pointA, pointB)
  } else if (phase === 'retracting') {
    if (tipFollowsB) {
      u = distance(pointA, pointB) > 0.001 ? 1 : 0
      tip = { ...pointB }
      rotation = angleToward(pointB, pointA)
    } else {
      // phaseT 0→1 means progress of retract; tip goes B→A
      const retractU = easeRetract(phaseT)
      u = 1 - retractU
      tip = lerpVec(pointB, pointA, retractU)
      rotation = angleToward(tip, pointA)
    }
  } else {
    // done
    tip = { ...pointA }
    u = 0
    rotation = angleToward(pointA, pointB)
  }

  return {
    tip,
    u,
    length: distance(pointA, tip),
    rotation,
    phase,
  }
}

export function totalRopeDurationMs(timing: RopeTiming): number {
  return (
    Math.max(1, timing.extendDurationMs) +
    Math.max(0, timing.holdDurationMs) +
    Math.max(1, timing.retractDurationMs)
  )
}
