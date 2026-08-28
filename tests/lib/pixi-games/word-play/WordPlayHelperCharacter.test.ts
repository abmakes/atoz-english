import { describe, expect, it } from 'vitest'
import { calculateCarryPoint } from '@/lib/pixi-games/word-play/ui/WordPlayHelperCharacter'

describe('calculateCarryPoint', () => {
  it('starts and ends exactly at the tile and slot positions', () => {
    expect(calculateCarryPoint(10, 20, 210, 120, 0)).toEqual({ x: 10, y: 20 })
    const end = calculateCarryPoint(10, 20, 210, 120, 1)
    expect(end.x).toBeCloseTo(210)
    expect(end.y).toBeCloseTo(120)
  })

  it('lifts the carried tile along a playful arc', () => {
    const midpoint = calculateCarryPoint(0, 100, 200, 100, 0.5)
    expect(midpoint.x).toBeCloseTo(100)
    expect(midpoint.y).toBeLessThan(70)
  })

  it('supports vertical carries without drifting horizontally', () => {
    const point = calculateCarryPoint(80, 300, 80, 100, 0.35)
    expect(point.x).toBe(80)
    expect(point.y).toBeLessThan(300)
  })
})
