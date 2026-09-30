import { describe, expect, it } from 'vitest'
import {
  TUG_CAMERA_DISTANCE,
  TUG_FEET_Y,
  TUG_STAGE_HEIGHT,
  TUG_STAGE_WIDTH,
  computeTugStageView,
  sampleTugRope,
  tugRopeHeightAboveFeet,
  tugSlotX,
  type TugRopePoint,
} from '@/lib/three-games/tug-of-war/tugStageLayout'

function nearest(points: TugRopePoint[], x: number): TugRopePoint {
  return points.reduce((best, point) =>
    Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best
  )
}

describe('computeTugStageView', () => {
  it('shows the whole painted plate at 16:9', () => {
    const view = computeTugStageView(16 / 9)
    expect(view.visibleWidth).toBeCloseTo(TUG_STAGE_WIDTH)
    expect(view.visibleHeight).toBeCloseTo(TUG_STAGE_HEIGHT)
    expect(view.cameraY).toBeCloseTo(TUG_STAGE_HEIGHT / 2)
    expect(view.layoutScaleX).toBe(1)
    expect(view.spriteScale).toBe(1)
  })

  it.each([21 / 9, 2, 16 / 10, 4 / 3, 1, 9 / 16])(
    'fills a %f viewport without showing past the plate edges',
    (aspect) => {
      const view = computeTugStageView(aspect)
      const epsilon = 1e-9
      expect(view.visibleWidth / view.visibleHeight).toBeCloseTo(aspect)
      expect(view.visibleWidth).toBeLessThanOrEqual(TUG_STAGE_WIDTH + epsilon)
      expect(view.cameraY - view.visibleHeight / 2).toBeGreaterThanOrEqual(-epsilon)
      expect(view.cameraY + view.visibleHeight / 2).toBeLessThanOrEqual(
        TUG_STAGE_HEIGHT + epsilon
      )
      const heightAtPlate =
        2 * TUG_CAMERA_DISTANCE * Math.tan((view.fovDeg * Math.PI) / 360)
      expect(heightAtPlate).toBeCloseTo(view.visibleHeight)
    }
  )

  it('compresses the ninja row on narrow screens but keeps sprites readable', () => {
    const tablet = computeTugStageView(4 / 3)
    expect(tablet.layoutScaleX).toBeLessThan(1)
    expect(tablet.spriteScale).toBe(tablet.layoutScaleX)

    const portrait = computeTugStageView(9 / 16)
    expect(portrait.spriteScale).toBeCloseTo(0.72)
    expect(portrait.layoutScaleX).toBeLessThan(portrait.spriteScale)
  })

  it('falls back to 16:9 for unusable aspects', () => {
    expect(computeTugStageView(Number.NaN)).toEqual(computeTugStageView(16 / 9))
    expect(computeTugStageView(0)).toEqual(computeTugStageView(16 / 9))
  })
})

describe('tugSlotX', () => {
  it('mirrors the teams around the flag, front slot nearest the centre', () => {
    expect(tugSlotX('blue', 1, 0.8)).toBeCloseTo(-tugSlotX('red', 1, 0.8))
    expect(tugSlotX('red', 0, 1)).toBeLessThan(tugSlotX('red', 2, 1))
    expect(tugSlotX('blue', 0, 1)).toBeGreaterThan(tugSlotX('blue', 2, 1))
  })
})

describe('sampleTugRope', () => {
  const handY = TUG_FEET_Y + tugRopeHeightAboveFeet(1)

  it('holds a taut rope at hand height with a slight middle sag and dropped tails', () => {
    const taut = sampleTugRope({ spriteScale: 1, layoutScaleX: 1, slack: 0 })
    expect(nearest(taut, 4.75).y).toBeCloseTo(handY)
    const sag = handY - nearest(taut, 0).y
    expect(sag).toBeGreaterThan(0)
    expect(sag).toBeLessThan(0.06)
    expect(taut[0].y).toBeLessThan(handY - 0.5)
    expect(taut[taut.length - 1].y).toBeLessThan(handY - 0.5)
  })

  it('lays a slack rope on the dirt', () => {
    const slack = sampleTugRope({ spriteScale: 1, layoutScaleX: 1, slack: 1 })
    for (const point of slack) {
      expect(point.y).toBeLessThan(TUG_FEET_Y + 0.1)
    }
  })

  it('samples left to right and mirrors a taut rope around the flag', () => {
    const points = sampleTugRope({ spriteScale: 0.8, layoutScaleX: 0.8, slack: 0 })
    for (let i = 1; i < points.length; i++) {
      expect(points[i].x).toBeGreaterThan(points[i - 1].x)
    }
    const last = points.length - 1
    for (let i = 0; i <= last; i++) {
      expect(points[i].x).toBeCloseTo(-points[last - i].x)
      expect(points[i].y).toBeCloseTo(points[last - i].y)
    }
  })
})
