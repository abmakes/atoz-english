import { describe, expect, it } from 'vitest'
import { calculatePowerupWheelLayout } from '@/lib/pixi-engine/ui/PowerupSpinWheel'

describe('calculatePowerupWheelLayout', () => {
  it('keeps a readable minimum wheel size in portrait and allows side cropping', () => {
    const layout = calculatePowerupWheelLayout(384, 830)
    expect(layout.isPortrait).toBe(true)
    expect(layout.radius).toBeGreaterThanOrEqual(220)
    expect(layout.radius * 2).toBeGreaterThan(384)
    expect(layout.centerX).toBe(192)
    expect(layout.centerY).toBeGreaterThan(layout.radius)
  })

  it('fits the full wheel on landscape screens', () => {
    const layout = calculatePowerupWheelLayout(880, 407)
    expect(layout.isPortrait).toBe(false)
    expect(layout.radius * 2).toBeLessThan(407)
  })

  it('remains vertically bounded on very short portrait screens', () => {
    const layout = calculatePowerupWheelLayout(320, 568)
    expect(layout.centerY + layout.radius).toBeLessThanOrEqual(568 - 24)
  })
})
