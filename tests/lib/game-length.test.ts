import { describe, expect, it } from 'vitest'
import {
  formatPlayTime,
  ninjaSummitForLength,
  ninjaTurnsForLength,
  tugTurnsForLength,
} from '@/lib/game-length'
import { computeSummitPoints } from '@/lib/pixi-games/ninja-climb/managers/NinjaClimbRaceManager'

describe('game length', () => {
  it('keeps the regular Ninja Climb summit at the current default', () => {
    expect(ninjaSummitForLength(15, 'regular')).toBe(computeSummitPoints(15))
    expect(ninjaSummitForLength(15, 'short')).toBe(600)
    expect(ninjaSummitForLength(15, 'long')).toBe(2400)
    expect(ninjaSummitForLength(3, 'short')).toBe(240)
  })

  it('schedules whole climb cycles and a longer tug match by default', () => {
    expect(ninjaTurnsForLength(15, 2, 'short')).toBe(30)
    expect(ninjaTurnsForLength(15, 2, 'regular')).toBe(60)
    expect(ninjaTurnsForLength(15, 2, 'long')).toBe(120)
    expect(tugTurnsForLength(15, 2, 'short')).toBe(15)
    expect(tugTurnsForLength(15, 2, 'regular')).toBe(30)
    expect(tugTurnsForLength(15, 2, 'long')).toBe(60)
  })

  it('turns the question timer into a classroom estimate', () => {
    expect(formatPlayTime(60, 15)).toBe('About 15 minutes')
    expect(formatPlayTime(30, 15)).toBe('About 8 minutes')
    expect(formatPlayTime(4, 15)).toBe('About 1 minute')
    expect(formatPlayTime(2, 10)).toBe('Under a minute')
  })
})
