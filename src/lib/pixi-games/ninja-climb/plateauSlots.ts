/**
 * Plateau occupancy layout for Ninja Climb.
 * Pure math — places 1–4 characters on a ledge without ambiguous overlap.
 */

export interface OccupantPlacement {
  /** Horizontal offset from waypoint centre. */
  dx: number
  /** Vertical offset (negative = uphill / behind). */
  dy: number
  /** Relative scale (1 = full size at front). */
  scale: number
  /** Higher draws in front. */
  zIndex: number
  /** Idle stance variant index. */
  poseVariant: 0 | 1
  /** Idle animation phase offset in ms. */
  phaseOffsetMs: number
}

/**
 * Layout occupants on a plateau.
 *
 * - 1: centred
 * - 2: side by side with clear air between (`±0.62 * charWidth`)
 * - 3–4: magazine-rack fan (tighter pitch, stepped back, shrinking scale)
 *
 * Slots are ordered by stable team index (caller assigns index → team).
 */
export function layoutOccupants(
  count: number,
  charWidth: number
): OccupantPlacement[] {
  const n = Math.max(0, Math.floor(count))
  if (n === 0) return []
  const w = Math.max(1, charWidth)

  if (n === 1) {
    return [
      {
        dx: 0,
        dy: 0,
        scale: 1,
        zIndex: 1,
        poseVariant: 0,
        phaseOffsetMs: 0,
      },
    ]
  }

  if (n === 2) {
    const half = 0.62 * w
    return [
      {
        dx: -half,
        dy: 0,
        scale: 1,
        zIndex: 2,
        poseVariant: 0,
        phaseOffsetMs: 0,
      },
      {
        dx: half,
        dy: 0,
        scale: 1,
        zIndex: 1,
        poseVariant: 1,
        phaseOffsetMs: 140,
      },
    ]
  }

  // Magazine rack for 3–4
  const pitch = 0.46 * w
  const halfSpan = ((n - 1) * pitch) / 2
  const placements: OccupantPlacement[] = []

  for (let i = 0; i < n; i++) {
    placements.push({
      dx: -halfSpan + i * pitch,
      dy: -i * 0.06 * w,
      scale: 1 - i * 0.05,
      zIndex: n - i,
      poseVariant: (i % 2) as 0 | 1,
      phaseOffsetMs: i * 140,
    })
  }

  return placements
}

/** Approximate horizontal span of a layout (edge-to-edge centres + char width). */
export function layoutSpanWidth(
  placements: OccupantPlacement[],
  charWidth: number
): number {
  if (placements.length === 0) return 0
  if (placements.length === 1) return charWidth
  const minDx = Math.min(...placements.map((p) => p.dx))
  const maxDx = Math.max(...placements.map((p) => p.dx))
  return maxDx - minDx + charWidth
}
