/**
 * Ninja Climb camera.
 *
 * Prefer a zoomed-out frame that keeps every climber in the play window.
 * When even the widest zoom cannot hold them, center the active climber and
 * report the rivals left outside so the scene can point at them.
 */

export interface ClimberPoint {
  x: number
  y: number
  stepIndex: number
  active: boolean
}

export interface OffscreenRival {
  /** Rival step minus the active climber's step. Positive means higher up. */
  stepDelta: number
  /** -1 = higher on the mountain (smaller world Y), 1 = lower. */
  direction: -1 | 1
}

export interface ClimbCameraFrame {
  x: number
  y: number
  zoom: number
  offscreen: OffscreenRival[]
}

/** Overview zoom when the climbers are close. Lower than 1 so the cliff reads wider. */
export const CLIMB_MAX_ZOOM = 0.7

/** Widest view. Past this, follow the active climber instead of shrinking everyone. */
export const CLIMB_MIN_ZOOM = 0.34

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function bodyY(climber: ClimberPoint, ninjaSize: number): number {
  return climber.y - ninjaSize * 0.45
}

export function frameClimbers(
  climbers: ClimberPoint[],
  playHeight: number,
  ninjaSize: number
): ClimbCameraFrame {
  if (climbers.length === 0 || playHeight <= 0) {
    return { x: 0, y: 0, zoom: CLIMB_MAX_ZOOM, offscreen: [] }
  }

  const size = Math.max(1, ninjaSize)
  const active = climbers.find((climber) => climber.active) ?? climbers[0]
  const headY = Math.min(...climbers.map((climber) => climber.y - size))
  const feetY = Math.max(...climbers.map((climber) => climber.y))
  const span = Math.max(size, feetY - headY)
  const padding = size * 0.85
  const fitZoom = playHeight / (span + padding)
  const bothFit = climbers.length < 2 || fitZoom >= CLIMB_MIN_ZOOM

  if (bothFit) {
    const zoom = clamp(fitZoom, CLIMB_MIN_ZOOM, CLIMB_MAX_ZOOM)
    const count = climbers.length
    return {
      x: climbers.reduce((sum, climber) => sum + climber.x, 0) / count,
      y: climbers.reduce((sum, climber) => sum + bodyY(climber, size), 0) / count,
      zoom,
      offscreen: [],
    }
  }

  const zoom = CLIMB_MAX_ZOOM
  const halfReach = playHeight / 2 / zoom
  const activeBody = bodyY(active, size)
  const offscreen: OffscreenRival[] = []
  for (const rival of climbers) {
    if (rival === active) continue
    const dy = bodyY(rival, size) - activeBody
    if (Math.abs(dy) <= halfReach - size * 0.35) continue
    offscreen.push({
      stepDelta: rival.stepIndex - active.stepIndex,
      direction: dy < 0 ? -1 : 1,
    })
  }

  return {
    x: active.x,
    y: activeBody,
    zoom,
    offscreen,
  }
}
