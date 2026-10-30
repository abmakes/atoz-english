import { describe, it, expect } from 'vitest'
import {
  BASE_PLATFORMS,
  MID_PLATFORMS,
  TOP_PLATFORMS,
  buildCliffLayout,
  buildPath,
  clampStepIndex,
  getSummitWaypoint,
} from '@/lib/pixi-games/ninja-climb/mountainPath'

const baseOpts = {
  totalSteps: 12,
  screenWidth: 1280,
}

describe('buildPath', () => {
  it('returns empty for totalSteps < 1', () => {
    expect(buildPath({ ...baseOpts, totalSteps: 0 })).toEqual([])
  })

  it('returns totalSteps waypoints', () => {
    const path = buildPath(baseOpts)
    expect(path).toHaveLength(12)
    expect(path.map((w) => w.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })

  it('Y strictly decreases (climbing up)', () => {
    const path = buildPath(baseOpts)
    for (let i = 1; i < path.length; i++) {
      expect(path[i].y).toBeLessThan(path[i - 1].y)
    }
  })

  it('starts on the base lawn and ends on the summit', () => {
    const layout = buildCliffLayout(baseOpts)
    const path = layout.waypoints
    const center = baseOpts.screenWidth / 2
    const base = layout.tiles.find((tile) => tile.kind === 'base')
    const top = layout.tiles.find((tile) => tile.kind === 'top')
    expect(base).toBeTruthy()
    expect(top).toBeTruthy()
    expect(path[0].x).toBeCloseTo(center + (BASE_PLATFORMS[0].nx - 0.5) * base!.width, 4)
    expect(path[0].y).toBeCloseTo(base!.bottomY - (1 - BASE_PLATFORMS[0].ny) * base!.height, 4)
    const summitPad = TOP_PLATFORMS[TOP_PLATFORMS.length - 1]
    expect(path[path.length - 1].x).toBeCloseTo(center + (summitPad.nx - 0.5) * top!.width, 4)
    expect(getSummitWaypoint(path)?.index).toBe(11)
  })

  it('repeats the mid.png left-right zigzag on matching tiles', () => {
    const layout = buildCliffLayout({ totalSteps: 9, screenWidth: 1280 })
    const mids = layout.tiles.filter((tile) => tile.kind === 'mid')
    expect(mids).toHaveLength(1)
    const mid = mids[0]
    const center = 1280 / 2
    // base (3) then the four mid pads
    const midSteps = layout.waypoints.slice(3, 7)
    expect(midSteps).toHaveLength(MID_PLATFORMS.length)
    midSteps.forEach((wp, i) => {
      const pad = MID_PLATFORMS[i]
      expect(wp.x).toBeCloseTo(center + (pad.nx - 0.5) * mid.width, 4)
      expect(wp.y).toBeCloseTo(mid.bottomY - (1 - pad.ny) * mid.height, 4)
      expect(wp.dir).toBe(pad.dir)
    })
    expect(midSteps[0].x).toBeLessThan(center)
    expect(midSteps[1].x).toBeGreaterThan(center)
    expect(midSteps[2].x).toBeLessThan(center)
    expect(midSteps[3].x).toBeGreaterThan(center)
  })

  it('stacks a second mid tile on the same horizontal anchors', () => {
    const layout = buildCliffLayout({ totalSteps: 13, screenWidth: 1280 })
    const [first, second] = layout.tiles.filter((tile) => tile.kind === 'mid')
    expect(second.bottomY).toBeLessThan(first.bottomY)
    const center = 1280 / 2
    const firstPad = layout.waypoints[BASE_PLATFORMS.length]
    const secondPad = layout.waypoints[BASE_PLATFORMS.length + MID_PLATFORMS.length]
    expect(firstPad.x).toBeCloseTo(center + (MID_PLATFORMS[0].nx - 0.5) * first.width, 4)
    expect(secondPad.x).toBeCloseTo(firstPad.x, 4)
    expect(secondPad.y).toBeLessThan(firstPad.y)
  })
})

describe('clampStepIndex', () => {
  it('clamps into range', () => {
    expect(clampStepIndex(-1, 10)).toBe(0)
    expect(clampStepIndex(0, 10)).toBe(0)
    expect(clampStepIndex(9, 10)).toBe(9)
    expect(clampStepIndex(99, 10)).toBe(9)
    expect(clampStepIndex(3.7, 10)).toBe(3)
  })
})
