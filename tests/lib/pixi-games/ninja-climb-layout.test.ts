import { describe, it, expect } from 'vitest'
import { NinjaClimbLayoutManager } from '@/lib/pixi-games/ninja-climb/managers/NinjaClimbLayoutManager'

describe('NinjaClimbLayoutManager HUD sizes', () => {
  it('uses enlarged clouds, timer, and question image at the 1200×700 base', () => {
    const layout = new NinjaClimbLayoutManager(1200, 700)
    const p = layout.getLayoutParams()
    expect(p.cloudWidth).toBeGreaterThanOrEqual(260)
    expect(p.cloudHeight).toBeGreaterThanOrEqual(140)
    expect(p.timerRadius).toBeGreaterThanOrEqual(50)
    expect(p.timerNavClearance).toBeGreaterThanOrEqual(80)
    expect(p.questionImageMaxWidth).toBeGreaterThanOrEqual(150)
    expect(p.questionImageMaxHeight).toBeGreaterThanOrEqual(140)
    expect(p.questionImageGap).toBeGreaterThanOrEqual(28)
  })

  it('keeps the timer below the nav cluster', () => {
    const layout = new NinjaClimbLayoutManager(1200, 700)
    const p = layout.getLayoutParams()
    const timerTop = p.timerNavClearance
    expect(timerTop).toBeGreaterThan(40)
    expect(timerTop + p.timerRadius * 2).toBeLessThan(p.skyBandHeight + p.timerRadius)
  })
})
