/** Switchback waypoint trail for Ninja Climb (pure math, no Pixi). */

export interface Waypoint {
  index: number
  x: number
  y: number
  section: number
  /** Travel direction within this section: 1 = left→right, -1 = right→left. */
  dir: 1 | -1
}

export interface BuildPathOptions {
  totalSteps: number
  screenWidth: number
  stepHeight: number
  stepsPerSection: number
  margin: number
  worldBottomY: number
}

/**
 * Build a switchback trail: each section of `stepsPerSection` ascends across
 * the screen, then the next section reverses direction.
 *
 * Y decreases as the trail climbs (world coords: larger Y is lower on screen).
 */
export function buildPath(opts: BuildPathOptions): Waypoint[] {
  const {
    totalSteps,
    screenWidth,
    stepHeight,
    stepsPerSection,
    margin,
    worldBottomY,
  } = opts

  if (totalSteps < 1) return []

  const usableWidth = Math.max(1, screenWidth - margin * 2)
  const stepsInSection = Math.max(1, stepsPerSection)
  const waypoints: Waypoint[] = []

  for (let i = 0; i < totalSteps; i++) {
    const section = Math.floor(i / stepsInSection)
    const indexInSection = i % stepsInSection
    const dir: 1 | -1 = section % 2 === 0 ? 1 : -1

    // Even sections: left → right. Odd sections: right → left.
    const t =
      stepsInSection === 1 ? 0 : indexInSection / (stepsInSection - 1)
    const x =
      dir === 1
        ? margin + t * usableWidth
        : margin + (1 - t) * usableWidth

    const y = worldBottomY - i * stepHeight

    waypoints.push({ index: i, x, y, section, dir })
  }

  return waypoints
}

/** Summit is always the last waypoint. */
export function getSummitWaypoint(path: Waypoint[]): Waypoint | null {
  return path.length > 0 ? path[path.length - 1] : null
}

/**
 * Clamp a step index into the path range.
 */
export function clampStepIndex(stepIndex: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0
  return Math.max(0, Math.min(totalSteps - 1, Math.floor(stepIndex)))
}
