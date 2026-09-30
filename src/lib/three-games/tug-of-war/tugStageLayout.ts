/**
 * Pure layout math for the painted Tug of War stage. The arena plate is a
 * 16:9 painting mapped to a 16×9 world-unit plane at z = 0; the camera always
 * "covers" the viewport with that plate so painted ground and 3D actors stay
 * aligned at any aspect ratio.
 */

export const TUG_STAGE_WIDTH = 16
export const TUG_STAGE_HEIGHT = 9
export const TUG_STAGE_ASPECT = TUG_STAGE_WIDTH / TUG_STAGE_HEIGHT
export const TUG_CAMERA_DISTANCE = 20

/** Feet baseline of the ninja row, measured on `arena-backdrop.webp`. */
export const TUG_FEET_Y = 1.81

/** Body-centre |x| of each team's ninjas, front (nearest the flag) to back. */
export const TUG_NINJA_SLOT_X = [3.3, 4.75, 6.2] as const

/** Width the six ninjas need before the row starts to compress. */
export const TUG_LAYOUT_WIDTH = 15.4

/** Rope-centre travel at |offset| = 1; each team's win line sits here. */
export const TUG_ROPE_TRAVEL = 1.6

/** Share of any vertical crop taken from the bottom of the plate. */
const BOTTOM_CROP_SHARE = 0.35
const MIN_SPRITE_SCALE = 0.72

/**
 * Canvas conventions shared by every ninja pose image. Replacement art must
 * keep the same canvas, feet anchor, and rope height.
 */
export const TUG_NINJA_SPRITE = {
  canvasWidthPx: 700,
  canvasHeightPx: 640,
  anchorXPx: 350,
  baselineYPx: 627,
  ropeYPx: 367,
  /** Distance from the anchor where the painted rope has fully faded out. */
  ropeFadeOuterPx: 318,
  worldUnitsPerPx: 0.00352,
} as const

/** `rope-strip.webp`: six rope twists cropped from the pull pose. */
export const TUG_ROPE_STRIP = { widthPx: 186, heightPx: 38 } as const

export interface TugStageView {
  fovDeg: number
  cameraY: number
  visibleWidth: number
  visibleHeight: number
  /** Multiplier for ninja x positions and rope travel on narrow screens. */
  layoutScaleX: number
  /** Multiplier for ninja sprite size on narrow screens. */
  spriteScale: number
}

export function computeTugStageView(aspect: number): TugStageView {
  const safeAspect =
    Number.isFinite(aspect) && aspect > 0 ? aspect : TUG_STAGE_ASPECT
  const visibleWidth =
    safeAspect >= TUG_STAGE_ASPECT
      ? TUG_STAGE_WIDTH
      : TUG_STAGE_HEIGHT * safeAspect
  const visibleHeight =
    safeAspect >= TUG_STAGE_ASPECT
      ? TUG_STAGE_WIDTH / safeAspect
      : TUG_STAGE_HEIGHT
  const bottom = (TUG_STAGE_HEIGHT - visibleHeight) * BOTTOM_CROP_SHARE
  const layoutScaleX = Math.min(1, visibleWidth / TUG_LAYOUT_WIDTH)
  return {
    fovDeg:
      (2 * Math.atan(visibleHeight / 2 / TUG_CAMERA_DISTANCE) * 180) / Math.PI,
    cameraY: bottom + visibleHeight / 2,
    visibleWidth,
    visibleHeight,
    layoutScaleX,
    spriteScale: Math.max(MIN_SPRITE_SCALE, layoutScaleX),
  }
}

export function tugNinjaPx(px: number, spriteScale: number): number {
  return px * TUG_NINJA_SPRITE.worldUnitsPerPx * spriteScale
}

export function tugRopeHeightAboveFeet(spriteScale: number): number {
  return tugNinjaPx(
    TUG_NINJA_SPRITE.baselineYPx - TUG_NINJA_SPRITE.ropeYPx,
    spriteScale
  )
}

export function tugRopeThickness(spriteScale: number): number {
  return tugNinjaPx(TUG_ROPE_STRIP.heightPx, spriteScale)
}

export function tugSlotX(
  side: 'blue' | 'red',
  slot: number,
  layoutScaleX: number
): number {
  const x = TUG_NINJA_SLOT_X[Math.max(0, Math.min(2, slot))] * layoutScaleX
  return side === 'blue' ? -x : x
}

export interface TugRopePoint {
  x: number
  y: number
}

/**
 * Rope centre-line in rope-local space (x = 0 is the flag). Taut: straight at
 * hand height with a slight middle sag and tails that drop to the dirt behind
 * the back ninjas. Slack blends everything down onto the ground.
 */
export function sampleTugRope(options: {
  spriteScale: number
  layoutScaleX: number
  slack: number
  step?: number
}): TugRopePoint[] {
  const { spriteScale, layoutScaleX } = options
  const slack = Math.max(0, Math.min(1, options.slack))
  const step = options.step ?? 0.06
  const tautY = TUG_FEET_Y + tugRopeHeightAboveFeet(spriteScale)
  const groundY = TUG_FEET_Y + tugRopeThickness(spriteScale) * 0.35
  const paintedReach = tugNinjaPx(TUG_NINJA_SPRITE.ropeFadeOuterPx, spriteScale)
  const inner = Math.max(
    0.4,
    TUG_NINJA_SLOT_X[0] * layoutScaleX - paintedReach
  )
  const dropStart = TUG_NINJA_SLOT_X[2] * layoutScaleX + paintedReach
  const dropLength = 1.3 * spriteScale
  const end = dropStart + dropLength + 3.2
  const sag = 0.05 * spriteScale

  const points: TugRopePoint[] = []
  const count = Math.ceil((2 * end) / step)
  for (let i = 0; i <= count; i++) {
    const x = -end + (2 * end * i) / count
    const ax = Math.abs(x)
    let taut = tautY
    if (ax < inner) {
      const t = ax / inner
      taut = tautY - sag * (1 - t * t)
    } else if (ax > dropStart) {
      const t = Math.min(1, (ax - dropStart) / dropLength)
      const eased = t * t * (3 - 2 * t)
      taut = tautY + (groundY - tautY) * eased
    }
    const relaxed = groundY + 0.025 * spriteScale * Math.sin(x * 1.7)
    const eased = slack * slack * (3 - 2 * slack)
    points.push({ x, y: taut + (relaxed - taut) * eased })
  }
  return points
}
