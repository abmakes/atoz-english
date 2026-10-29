import { describe, it, expect } from 'vitest'
import {
  layoutOccupants,
  layoutSpanWidth,
} from '@/lib/pixi-games/ninja-climb/plateauSlots'

const CHAR = 72

function boundingBox(dx: number, charWidth: number) {
  return { left: dx - charWidth / 2, right: dx + charWidth / 2 }
}

describe('layoutOccupants', () => {
  it('returns empty for count 0', () => {
    expect(layoutOccupants(0, CHAR)).toEqual([])
  })

  it('centres a single occupant', () => {
    const [a] = layoutOccupants(1, CHAR)
    expect(a.dx).toBe(0)
    expect(a.dy).toBe(0)
    expect(a.scale).toBe(1)
    expect(a.poseVariant).toBe(0)
  })

  it('places two occupants symmetrically without intersecting boxes', () => {
    const [a, b] = layoutOccupants(2, CHAR)
    expect(a.dx).toBeCloseTo(-0.62 * CHAR)
    expect(b.dx).toBeCloseTo(0.62 * CHAR)
    expect(a.dx).toBeCloseTo(-b.dx)

    const boxA = boundingBox(a.dx, CHAR)
    const boxB = boundingBox(b.dx, CHAR)
    // Clear air between: A's right edge left of B's left edge
    expect(boxA.right).toBeLessThan(boxB.left)

    expect(a.poseVariant).toBe(0)
    expect(b.poseVariant).toBe(1)
    expect(a.phaseOffsetMs).not.toBe(b.phaseOffsetMs)
  })

  it('fans three and four in a magazine rack within plateau width', () => {
    for (const n of [3, 4]) {
      const placements = layoutOccupants(n, CHAR)
      expect(placements).toHaveLength(n)

      const span = layoutSpanWidth(placements, CHAR)
      expect(span).toBeLessThanOrEqual(2.9 * CHAR + 0.01)

      // Strictly decreasing zIndex (front first)
      for (let i = 1; i < placements.length; i++) {
        expect(placements[i].zIndex).toBeLessThan(placements[i - 1].zIndex)
      }

      // Monotonic dy (further back = more negative / uphill)
      for (let i = 1; i < placements.length; i++) {
        expect(placements[i].dy).toBeLessThanOrEqual(placements[i - 1].dy)
      }

      // Alternating pose variants
      placements.forEach((p, i) => {
        expect(p.poseVariant).toBe((i % 2) as 0 | 1)
      })

      // Distinct phase offsets
      const phases = new Set(placements.map((p) => p.phaseOffsetMs))
      expect(phases.size).toBe(n)
    }
  })
})
