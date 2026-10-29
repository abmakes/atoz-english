import { describe, it, expect } from 'vitest'
import {
  buildPath,
  clampStepIndex,
  getSummitWaypoint,
} from '@/lib/pixi-games/ninja-climb/mountainPath'

const baseOpts = {
  totalSteps: 12,
  screenWidth: 1280,
  stepHeight: 80,
  stepsPerSection: 4,
  margin: 120,
  worldBottomY: 2000,
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

  it('keeps X inside margins', () => {
    const path = buildPath(baseOpts)
    for (const wp of path) {
      expect(wp.x).toBeGreaterThanOrEqual(baseOpts.margin)
      expect(wp.x).toBeLessThanOrEqual(baseOpts.screenWidth - baseOpts.margin)
    }
  })

  it('alternates direction per section', () => {
    const path = buildPath(baseOpts)
    // Section 0 (indices 0-3): dir 1
    expect(path.slice(0, 4).every((w) => w.dir === 1 && w.section === 0)).toBe(true)
    // Section 1 (indices 4-7): dir -1
    expect(path.slice(4, 8).every((w) => w.dir === -1 && w.section === 1)).toBe(true)
    // Section 2 (indices 8-11): dir 1
    expect(path.slice(8, 12).every((w) => w.dir === 1 && w.section === 2)).toBe(true)
  })

  it('summit is the last waypoint', () => {
    const path = buildPath(baseOpts)
    const summit = getSummitWaypoint(path)
    expect(summit).toEqual(path[path.length - 1])
    expect(summit?.index).toBe(11)
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
