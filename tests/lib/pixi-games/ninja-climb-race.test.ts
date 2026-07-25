import { describe, it, expect } from 'vitest'
import {
  NinjaClimbRaceManager,
  computeCorrectGain,
  computeSummitPoints,
} from '@/lib/pixi-games/ninja-climb/managers/NinjaClimbRaceManager'

function makeRace(overrides?: {
  charges?: Array<'teleport' | 'rope' | 'smoke'>
  questionsPerTeam?: number
  shortcutsEnabled?: boolean
  rng?: () => number
}) {
  return new NinjaClimbRaceManager({
    teamIds: ['blue', 'red'],
    startingCharges: overrides?.charges ?? ['teleport', 'rope', 'smoke'],
    questionsPerTeam: overrides?.questionsPerTeam ?? 5,
    shortcutsEnabled: overrides?.shortcutsEnabled,
    rng: overrides?.rng,
  })
}

describe('computeSummitPoints / computeCorrectGain', () => {
  it('uses max(400, questions * 80)', () => {
    expect(computeSummitPoints(1)).toBe(400)
    expect(computeSummitPoints(6)).toBe(480)
  })

  it('returns flat 60 for basic mode', () => {
    expect(
      computeCorrectGain({
        boosted: false,
        remainingTimeMs: 10000,
        questionDurationMs: 15000,
      })
    ).toBe(60)
  })

  it('scales 50–100 for boosted mode', () => {
    expect(
      computeCorrectGain({
        boosted: true,
        remainingTimeMs: 15000,
        questionDurationMs: 15000,
      })
    ).toBe(100)
    expect(
      computeCorrectGain({
        boosted: true,
        remainingTimeMs: 0,
        questionDurationMs: 15000,
      })
    ).toBe(50)
  })
})

describe('NinjaClimbRaceManager gain pipeline', () => {
  it('applies a plain gain', () => {
    const race = makeRace()
    const result = race.applyGain('blue', 60)
    expect(result.applied).toBe(60)
    expect(result.newScore).toBe(60)
    expect(race.getScore('blue')).toBe(60)
  })

  it('applies rope boost then smoke debuff in order', () => {
    const race = makeRace()
    race.applyPowerup('blue', 'rope')
    // Opponent gets smoke from blue? Smoke targets opponent — apply from red onto blue
    race.applyPowerup('red', 'smoke')
    // blue has rope boost; blue also has smoke from red
    const result = race.applyGain('blue', 100)
    // 100 * 1.5 = 150, then * 0.7 = 105
    expect(result.afterBoost).toBe(150)
    expect(result.afterSmoke).toBe(105)
    expect(result.applied).toBe(105)
  })

  it('clamps gain at opponent barrier and shatters it', () => {
    const race = makeRace()
    // Red teleports ahead and places barrier at 120
    race.applyPowerup('red', 'teleport')
    expect(race.getScore('red')).toBe(120)
    expect(race.getTeamState('red')?.barrierHeight).toBe(120)

    // Blue is at 90, tries to gain 100 → clamped to 30, barrier shatters
    race.applyGain('blue', 90) // set blue to 90 via two gains... easier setScore
    race.setScore('blue', 90)
    const result = race.applyGain('blue', 100)
    expect(result.barrierClamped).toBe(true)
    expect(result.barrierShattered).toBe(true)
    expect(result.applied).toBe(30)
    expect(result.newScore).toBe(120)
    expect(race.getTeamState('red')?.barrierHeight).toBeNull()
  })

  it('rope pulls opponent back 50', () => {
    const race = makeRace()
    race.setScore('red', 80)
    const result = race.applyPowerup('blue', 'rope')
    expect(result.ok).toBe(true)
    expect(result.targetScoreDelta).toBe(-50)
    expect(race.getScore('red')).toBe(30)
    expect(race.getTeamState('blue')?.ropeBoostRemaining).toBe(3)
  })

  it('consumes a power-up charge', () => {
    const race = makeRace({ charges: ['teleport'] })
    expect(race.canPlayPowerup('blue', 'teleport')).toBe(true)
    race.applyPowerup('blue', 'teleport')
    expect(race.canPlayPowerup('blue', 'teleport')).toBe(false)
    expect(race.applyPowerup('blue', 'teleport').ok).toBe(false)
  })
})

describe('NinjaClimbRaceManager shortcuts', () => {
  it('detects crossed nodes and rolls ladder when rng is low', () => {
    const race = makeRace({
      questionsPerTeam: 5, // summit 400
      rng: () => 0.1, // always ladder
    })
    // First forest node at 0.25 * 400 = 100
    race.setScore('blue', 120)
    const node = race.findCrossedShortcut('blue', 50, 120)
    expect(node?.id).toBe('node-forest-1')
    const roll = race.rollShortcut('blue', node!)
    expect(roll.outcome).toBe('ladder')
    expect(roll.delta).toBe(90)
    expect(race.getScore('blue')).toBe(210)
  })

  it('skip marks node consumed without changing score', () => {
    const race = makeRace()
    race.setScore('blue', 120)
    const node = race.findCrossedShortcut('blue', 50, 120)
    expect(node).not.toBeNull()
    race.skipShortcut('blue', node!.id)
    expect(race.findCrossedShortcut('blue', 50, 120)).toBeNull()
    expect(race.getScore('blue')).toBe(120)
  })

  it('detects summit', () => {
    const race = makeRace({ questionsPerTeam: 5 })
    expect(race.getSummitPoints()).toBe(400)
    race.setScore('blue', 400)
    expect(race.hasReachedSummit('blue')).toBe(true)
    expect(race.anyTeamAtSummit()).toBe('blue')
  })
})
