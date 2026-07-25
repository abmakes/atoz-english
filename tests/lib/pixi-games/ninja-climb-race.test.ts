import { describe, it, expect } from 'vitest'
import {
  NinjaClimbRaceManager,
  computeCorrectGain,
  computeSummitPoints,
  POINTS_PER_STEP,
  scoreToStepIndex,
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

describe('scoreToStepIndex', () => {
  const summit = 400

  it('maps score boundaries to steps', () => {
    expect(scoreToStepIndex(0, summit)).toBe(0)
    expect(scoreToStepIndex(39, summit)).toBe(0)
    expect(scoreToStepIndex(40, summit)).toBe(1)
    expect(scoreToStepIndex(79, summit)).toBe(1)
    expect(scoreToStepIndex(80, summit)).toBe(2)
  })

  it('clamps to last step', () => {
    const last = Math.ceil(summit / POINTS_PER_STEP) - 1
    expect(scoreToStepIndex(summit, summit)).toBe(last)
    expect(scoreToStepIndex(summit + 500, summit)).toBe(last)
    expect(scoreToStepIndex(-10, summit)).toBe(0)
  })

  it('matches race manager instance helper', () => {
    const race = makeRace({ questionsPerTeam: 5 })
    expect(race.scoreToStepIndex(120)).toBe(scoreToStepIndex(120, 400))
    expect(race.getTotalSteps()).toBe(10)
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
    race.applyPowerup('red', 'smoke')
    const result = race.applyGain('blue', 100)
    // 100 * 1.5 = 150, then * 0.7 = 105
    expect(result.afterBoost).toBe(150)
    expect(result.afterSmoke).toBe(105)
    expect(result.applied).toBe(105)
  })

  it('zero gain does not burn rope or smoke charges', () => {
    const race = makeRace()
    race.applyPowerup('blue', 'rope')
    race.applyPowerup('red', 'smoke')
    expect(race.getTeamState('blue')?.ropeBoostRemaining).toBe(3)
    expect(race.getTeamState('blue')?.smokeDebuffRemaining).toBe(2)

    const result = race.applyGain('blue', 0)
    expect(result.applied).toBe(0)
    expect(race.getTeamState('blue')?.ropeBoostRemaining).toBe(3)
    expect(race.getTeamState('blue')?.smokeDebuffRemaining).toBe(2)
  })

  it('clamps gain at opponent barrier step and shatters it', () => {
    const race = makeRace()
    // Red teleports +120 → step 3, barrier at step 3 (= 120 pts)
    race.applyPowerup('red', 'teleport')
    expect(race.getScore('red')).toBe(120)
    expect(race.getTeamState('red')?.barrierStep).toBe(3)
    expect(race.getBarrierStep()).toBe(3)

    race.setScore('blue', 90)
    const result = race.applyGain('blue', 100)
    expect(result.barrierClamped).toBe(true)
    expect(result.barrierShattered).toBe(true)
    expect(result.applied).toBe(30)
    expect(result.newScore).toBe(120)
    expect(race.getTeamState('red')?.barrierStep).toBeNull()
    expect(race.getBarrierStep()).toBeNull()
  })

  it('does not clamp a team already at or above the barrier', () => {
    const race = makeRace()
    race.applyPowerup('red', 'teleport') // barrier at step 3 / 120
    race.setScore('blue', 120)
    const result = race.applyGain('blue', 60)
    expect(result.barrierClamped).toBe(false)
    expect(result.barrierShattered).toBe(false)
    expect(result.applied).toBe(60)
    expect(result.newScore).toBe(180)
    expect(race.getTeamState('red')?.barrierStep).toBe(3)
  })

  it('teleport and ladder gains respect barriers', () => {
    const race = makeRace({
      questionsPerTeam: 5,
      rng: () => 0.1, // ladder
    })
    race.applyPowerup('red', 'teleport') // barrier at 120
    race.setScore('blue', 100)

    // Blue teleport would try +120 → clamped to barrier
    const tp = race.applyPowerup('blue', 'teleport')
    expect(tp.ok).toBe(true)
    expect(tp.actorScoreDelta).toBe(20)
    expect(race.getScore('blue')).toBe(120)
    // Blue's teleport shattered red's barrier and placed blue's own
    expect(race.getTeamState('red')?.barrierStep).toBeNull()
    expect(race.getTeamState('blue')?.barrierStep).toBe(3)
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
    // First forest node at ~0.25 * 9 ≈ step 2 → score crossing from below
    race.setScore('blue', 120)
    const node = race.findCrossedShortcut('blue', 50, 120)
    expect(node?.id).toBe('node-forest-1')
    const roll = race.rollShortcut('blue', node!)
    expect(roll.outcome).toBe('ladder')
    expect(roll.delta).toBe(90)
    expect(race.getScore('blue')).toBe(210)
  })

  it('ladder gain is clamped by barrier', () => {
    const race = makeRace({
      questionsPerTeam: 5,
      rng: () => 0.1,
    })
    race.applyPowerup('red', 'teleport') // barrier 120
    race.setScore('blue', 100)
    // Cross forest node and take ladder +90 → would go to 190, clamped to 120
    const node = race.findCrossedShortcut('blue', 50, 100)
    // May or may not cross depending on step indices — force roll on forest node
    const forest = race.getNodes().find((n) => n.id === 'node-forest-1')!
    const roll = race.rollShortcut('blue', forest)
    expect(roll.outcome).toBe('ladder')
    expect(roll.newScore).toBe(120)
    expect(roll.delta).toBe(20)
    expect(race.getTeamState('red')?.barrierStep).toBeNull()
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
