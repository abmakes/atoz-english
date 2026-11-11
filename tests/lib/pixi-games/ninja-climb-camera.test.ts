import { describe, expect, it } from 'vitest'
import {
  CLIMB_MAX_ZOOM,
  frameClimbers,
  type ClimberPoint,
} from '@/lib/pixi-games/ninja-climb/cameraFrame'

const playHeight = 480
const ninjaSize = 128

function climber(partial: Partial<ClimberPoint> & Pick<ClimberPoint, 'y' | 'stepIndex'>): ClimberPoint {
  return {
    x: 400,
    active: false,
    ...partial,
  }
}

describe('frameClimbers', () => {
  it('zooms out to the overview and keeps close climbers together', () => {
    const frame = frameClimbers(
      [
        climber({ y: 1000, stepIndex: 1, active: true }),
        climber({ y: 1040, stepIndex: 2, x: 520 }),
      ],
      playHeight,
      ninjaSize
    )
    expect(frame.zoom).toBe(CLIMB_MAX_ZOOM)
    expect(frame.offscreen).toEqual([])
    expect(frame.x).toBe(460)
    expect(frame.y).toBeCloseTo(962.4)
  })

  it('centers the active climber and points at a rival the window cannot hold', () => {
    const frame = frameClimbers(
      [
        climber({ y: 2000, stepIndex: 2, active: true, x: 300 }),
        climber({ y: 400, stepIndex: 12, x: 700 }),
      ],
      playHeight,
      ninjaSize
    )
    expect(frame.zoom).toBe(CLIMB_MAX_ZOOM)
    expect(frame.x).toBe(300)
    expect(frame.y).toBeCloseTo(2000 - ninjaSize * 0.45)
    expect(frame.offscreen).toEqual([{ stepDelta: 10, direction: -1 }])
  })

  it('does not invent a rival marker for one climber', () => {
    const frame = frameClimbers(
      [climber({ y: 800, stepIndex: 0, active: true })],
      playHeight,
      ninjaSize
    )
    expect(frame.offscreen).toEqual([])
    expect(frame.zoom).toBe(CLIMB_MAX_ZOOM)
  })
})