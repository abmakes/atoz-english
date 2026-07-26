import { describe, it, expect } from 'vitest'
import {
  NinjaClimbRaceManager,
  computeCorrectGain,
  computeSummitPoints,
  MIN_SUMMIT_POINTS,
  POINTS_PER_STEP,
  scoreToStepIndex,
  DEFAULT_SHORTCUT_NODES,
} from '@/lib/pixi-games/ninja-climb/managers/NinjaClimbRaceManager'

function makeRace(overrides?: {
  charges?: Array<'teleport' | 'rope' | 'smoke'>
  questionsPerTeam?: number
  shortcutsEnabled?: boolean
  rng?: () => number
}) {
  return new NinjaClimbRaceManager({
    teamIds: ['blue', 'red'],
    startingCharges: overrides?.charges ?? [],
    questionsPerTeam: overrides?.questionsPerTeam ?? 5,
    shortcutsEnabled: overrides?.shortcutsEnabled,
    rng: overrides?.rng,
  })
}

describe('computeSummitPoints / computeCorrectGain', () => {
  it('uses max(560, questions * 80)', () => {
    expect(MIN_SUMMIT_POINTS).toBe(560)
    expect(computeSummitPoints(1)).toBe(560)
    expect(computeSummitPoints(6)).toBe(560)
    expect(computeSummitPoints(8)).toBe(640)
  })

  it('applies a time bonus in basic mode (50–75)', () => {
    expect(
      computeCorrectGain({
        boosted: false,
        remainingTimeMs: 15000,
        questionDurationMs: 15000,
      })
    ).toBe(75)
    expect(
      computeCorrectGain({
        boosted: false,
        remainingTimeMs: 0,
        questionDurationMs: 15000,
      })
    ).toBe(50)
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

describe('scoreToStepIndex', () => {
  const summit = 560

  it('maps score boundaries to steps', () => {
    expect(scoreToStepIndex(0, summit)).toBe(0)
    expect(scoreToStepIndex(39, summit)).toBe(0)
    expect(scoreToStepIndex(40, summit)).toBe(1)
  })

  it('clamps to last step', () => {
    const last = Math.ceil(summit / POINTS_PER_STEP) - 1
    expect(scoreToStepIndex(summit, summit)).toBe(last)
    expect(scoreToStepIndex(summit + 500, summit)).toBe(last)
  })

  it('matches race manager instance helper', () => {
    const race = makeRace({ questionsPerTeam: 5 })
    expect(race.getSummitPoints()).toBe(560)
    expect(race.scoreToStepIndex(120)).toBe(scoreToStepIndex(120, 560))
  })
})

describe('power-up earning', () => {
  it('starts with zero charges by default', () => {
    const race = makeRace()
    expect(race.canPlayPowerup('blue', 'teleport')).toBe(false)
    expect(race.canPlayPowerup('blue', 'rope')).toBe(false)
    expect(race.getCharges('blue')).toEqual({ teleport: 0, rope: 0, smoke: 0 })
  })

  it('grants a random power every 2 correct answers', () => {
    let i = 0
    const pool = ['teleport', 'rope', 'smoke'] as const
    const race = makeRace({
      rng: () => {
        // Always pick index 0 from pool (teleport) when Math.floor(rng * 3)
        return 0
      },
    })
    expect(race.registerCorrectAnswer('blue', pool)).toBeNull()
    expect(race.getTeamState('blue')?.correctAnswers).toBe(1)
    expect(race.registerCorrectAnswer('blue', pool)).toBe('teleport')
    expect(race.getCharges('blue').teleport).toBe(1)
    expect(race.registerCorrectAnswer('blue', pool)).toBeNull()
    expect(race.registerCorrectAnswer('blue', pool)).toBe('teleport')
    expect(race.getCharges('blue').teleport).toBe(2)
    void i
  })
})

describe('NinjaClimbRaceManager gain pipeline', () => {
  it('applies a plain gain', () => {
    const race = makeRace()
    const result = race.applyGain('blue', 60)
    expect(result.applied).toBe(60)
    expect(race.getScore('blue')).toBe(60)
  })

  it('applies rope boost then smoke debuff in order', () => {
    const race = makeRace({ charges: ['rope', 'smoke'] })
    race.applyPowerup('blue', 'rope')
    race.applyPowerup('red', 'smoke')
    const result = race.applyGain('blue', 100)
    expect(result.afterBoost).toBe(150)
    expect(result.afterSmoke).toBe(105)
    expect(result.applied).toBe(105)
  })

  it('zero gain does not burn rope or smoke charges', () => {
    const race = makeRace({ charges: ['rope', 'smoke'] })
    race.applyPowerup('blue', 'rope')
    race.applyPowerup('red', 'smoke')
    expect(race.getTeamState('blue')?.ropeBoostRemaining).toBe(3)
    const result = race.applyGain('blue', 0)
    expect(result.applied).toBe(0)
    expect(race.getTeamState('blue')?.ropeBoostRemaining).toBe(3)
    expect(race.getTeamState('blue')?.smokeDebuffRemaining).toBe(2)
  })

  it('clamps gain at opponent barrier step and shatters it', () => {
    const race = makeRace({ charges: ['teleport'] })
    race.applyPowerup('red', 'teleport')
    expect(race.getScore('red')).toBe(120)
    expect(race.getTeamState('red')?.barrierStep).toBe(3)

    race.setScore('blue', 90)
    const result = race.applyGain('blue', 100)
    expect(result.barrierClamped).toBe(true)
    expect(result.applied).toBe(30)
    expect(result.newScore).toBe(120)
    expect(race.getTeamState('red')?.barrierStep).toBeNull()
  })

  it('rope pulls opponent back 50', () => {
    const race = makeRace({ charges: ['rope'] })
    race.setScore('red', 80)
    const result = race.applyPowerup('blue', 'rope')
    expect(result.ok).toBe(true)
    expect(result.targetScoreDelta).toBe(-50)
    expect(race.getScore('red')).toBe(30)
  })
})

describe('NinjaClimbRaceManager shortcuts', () => {
  it('ships two high-risk nodes (snake more likely)', () => {
    expect(DEFAULT_SHORTCUT_NODES).toHaveLength(2)
    for (const node of DEFAULT_SHORTCUT_NODES) {
      expect(node.ladderChance).toBeLessThan(0.5)
    }
  })

  it('detects crossed nodes and rolls snake when rng is high', () => {
    const race = makeRace({
      questionsPerTeam: 5,
      rng: () => 0.9, // above ladderChance → snake
    })
    // Forest at ~0.4 * 13 ≈ step 5 → need to cross into step 5 (score ≥ 200)
    race.setScore('blue', 220)
    const node = race.findCrossedShortcut('blue', 100, 220)
    expect(node?.id).toBe('node-forest-1')
    const roll = race.rollShortcut('blue', node!)
    expect(roll.outcome).toBe('snake')
    expect(roll.delta).toBe(-50)
    expect(race.getScore('blue')).toBe(170)
  })

  it('ladder is less likely than before (35% forest)', () => {
    expect(DEFAULT_SHORTCUT_NODES[0].ladderChance).toBe(0.35)
    expect(DEFAULT_SHORTCUT_NODES[1].ladderChance).toBe(0.3)
  })

  it('skip marks node consumed without changing score', () => {
    const race = makeRace()
    race.setScore('blue', 220)
    const node = race.findCrossedShortcut('blue', 100, 220)
    expect(node).not.toBeNull()
    race.skipShortcut('blue', node!.id)
    expect(race.findCrossedShortcut('blue', 100, 220)).toBeNull()
  })

  it('detects summit at 560', () => {
    const race = makeRace({ questionsPerTeam: 5 })
    expect(race.getSummitPoints()).toBe(560)
    race.setScore('blue', 560)
    expect(race.hasReachedSummit('blue')).toBe(true)
  })
})
