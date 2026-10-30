import { describe, expect, it } from 'vitest'
import {
  TUG_DOUBLE_STEP_MULTIPLIER,
  TUG_OFFSET_LERP_PER_SEC,
  TUG_ROUND_THRESHOLD,
  TUG_ROUNDS_TO_WIN,
  TUG_STEP,
  TUG_STREAK_FOR_DOUBLE,
  applyPull,
  applyTugAnswer,
  canReplayHudQuestion,
  clampTugOffset,
  computePullImpulse,
  createTugAnswerPayload,
  createTugMatchState,
  isTugOfWarQuestionEligible,
  pullSignForTeam,
  resetRound,
  resolveMatchOnQuestionsExhausted,
  resolveTugQuestionImageUrl,
  shouldEmitOffset,
  signedPullDelta,
  stepDisplayedOffset,
  stepsForCorrectStreak,
  teamHasSuperSaiyanGlow,
  tugNormalizedOffset,
  winnerFromRounds,
} from '@/lib/three-games/tug-of-war/tugOfWarLogic'
import { QuestionType } from '@/types/question_types'
import type { QuestionData } from '@/types'

const mc: QuestionData = {
  id: 'q1',
  question: 'What animal is this?',
  answers: ['Cat', 'Dog', 'Rabbit', 'Horse'],
  correctAnswer: 'Dog',
  type: QuestionType.MULTIPLE_CHOICE,
}

function applyCorrect(state: ReturnType<typeof createTugMatchState>, teamIndex: number) {
  return applyTugAnswer(state, teamIndex, { isCorrect: true })
}

function winRoundFromCenter(
  state: ReturnType<typeof createTugMatchState>,
  teamIndex: number
) {
  const first = applyCorrect(state, teamIndex)
  expect(first.roundWinner).toBeNull()
  return applyCorrect(first.state, teamIndex)
}

describe('tugOfWarLogic pull math', () => {
  it('awards one step toward the active team for a correct answer', () => {
    const blue = applyCorrect(createTugMatchState(), 0)
    expect(blue.state.offset).toBe(-TUG_STEP)
    expect(blue.roundWinner).toBeNull()
    expect(
      computePullImpulse({
        isCorrect: true,
        timedOut: false,
        streak: 0,
      })
    ).toEqual({
      magnitude: TUG_STEP,
      towardActiveTeam: true,
    })
    expect(
      computePullImpulse({
        isCorrect: true,
        streak: TUG_STREAK_FOR_DOUBLE - 1,
      }).magnitude
    ).toBe(TUG_STEP)
  })

  it('does not move the rope on a wrong answer or timeout', () => {
    expect(
      computePullImpulse({
        isCorrect: false,
        timedOut: false,
      })
    ).toEqual({
      magnitude: 0,
      towardActiveTeam: true,
    })
    expect(
      computePullImpulse({
        isCorrect: true,
        timedOut: true,
      })
    ).toEqual({
      magnitude: 0,
      towardActiveTeam: true,
    })

    const leading = applyCorrect(createTugMatchState(), 0)
    expect(leading.state.offset).toBe(-TUG_STEP)
    const miss = applyTugAnswer(leading.state, 0, { isCorrect: false })
    expect(miss.state.offset).toBe(-TUG_STEP)
    expect(miss.roundWinner).toBeNull()
    const timeout = applyTugAnswer(leading.state, 1, {
      isCorrect: false,
      timedOut: true,
    })
    expect(timeout.state.offset).toBe(-TUG_STEP)
    expect(timeout.roundWinner).toBeNull()

    const bothMiss = applyTugAnswer(
      applyTugAnswer(createTugMatchState(), 0, { isCorrect: false }).state,
      1,
      { isCorrect: false }
    )
    expect(bothMiss.state.offset).toBe(0)
  })

  it('pulls blue left and red right on a correct answer', () => {
    const impulse = computePullImpulse({ isCorrect: true, streak: 0 })
    expect(pullSignForTeam(0)).toBe(-1)
    expect(pullSignForTeam(1)).toBe(1)
    expect(signedPullDelta(0, impulse)).toBeCloseTo(-TUG_STEP)
    expect(signedPullDelta(1, impulse)).toBeCloseTo(TUG_STEP)
  })

  it('doubles the next correct after three in a row', () => {
    const steps = [0, 1, 2, 3].map((streak) => stepsForCorrectStreak(streak))
    expect(steps).toEqual([
      TUG_STEP,
      TUG_STEP,
      TUG_STEP,
      TUG_STEP * TUG_DOUBLE_STEP_MULTIPLIER,
    ])
    expect(
      computePullImpulse({
        isCorrect: true,
        streak: TUG_STREAK_FOR_DOUBLE,
      }).magnitude
    ).toBe(2)
    expect(stepsForCorrectStreak(TUG_STREAK_FOR_DOUBLE + 1)).toBe(TUG_STEP)
  })
})

describe('tugOfWarLogic round / match state', () => {
  it('awards a round at a lead of two steps and resets the rope', () => {
    const first = applyCorrect(createTugMatchState(), 0)
    expect(first.roundWinner).toBeNull()
    expect(first.state.offset).toBe(-1)
    expect(first.state.blueStreak).toBe(1)

    const second = applyCorrect(first.state, 0)
    expect(second.roundWinner).toBe('blue')
    expect(second.state.blueRoundWins).toBe(1)
    expect(second.matchWinner).toBeNull()
    expect(second.state.phase).toBe('roundOver')
    expect(second.state.offset).toBe(-TUG_ROUND_THRESHOLD)

    const nextRound = resetRound(second.state)
    expect(nextRound.offset).toBe(0)
    expect(nextRound.roundNumber).toBe(2)
    expect(nextRound.phase).toBe('playing')
  })

  it('ends the match at three round wins, not two', () => {
    const first = winRoundFromCenter(createTugMatchState(), 0)
    expect(first.matchWinner).toBeNull()
    expect(first.state.blueRoundWins).toBe(1)

    const second = winRoundFromCenter(resetRound(first.state), 0)
    expect(second.roundWinner).toBe('blue')
    expect(second.matchWinner).toBeNull()
    expect(second.state.blueRoundWins).toBe(2)
    expect(second.state.phase).toBe('roundOver')
    expect(winnerFromRounds(second.state)).toBeNull()

    const third = winRoundFromCenter(resetRound(second.state), 0)
    expect(third.roundWinner).toBe('blue')
    expect(third.matchWinner).toBe('blue')
    expect(third.state.blueRoundWins).toBe(TUG_ROUNDS_TO_WIN)
    expect(third.state.phase).toBe('matchOver')
  })

  it('never awards a round when teams alternate correct answers at one step each', () => {
    let state = createTugMatchState()
    for (let i = 0; i < TUG_STREAK_FOR_DOUBLE; i++) {
      const blue = applyCorrect(state, 0)
      expect(blue.roundWinner).toBeNull()
      expect(blue.state.offset).toBe(-TUG_STEP)
      const red = applyCorrect(blue.state, 1)
      expect(red.roundWinner).toBeNull()
      expect(red.state.offset).toBe(0)
      state = red.state
    }
    expect(state.blueRoundWins).toBe(0)
    expect(state.redRoundWins).toBe(0)
  })

  it('lets a streak double win the round when both teams keep answering correctly', () => {
    let state = createTugMatchState()
    for (let i = 0; i < TUG_STREAK_FOR_DOUBLE; i++) {
      const blue = applyCorrect(state, 0)
      expect(blue.roundWinner).toBeNull()
      const red = applyCorrect(blue.state, 1)
      expect(red.roundWinner).toBeNull()
      state = red.state
    }
    expect(state.offset).toBe(0)
    expect(state.blueStreak).toBe(TUG_STREAK_FOR_DOUBLE)
    expect(state.redStreak).toBe(TUG_STREAK_FOR_DOUBLE)

    const doubled = applyCorrect(state, 0)
    expect(doubled.roundWinner).toBe('blue')
    expect(doubled.state.offset).toBe(-TUG_ROUND_THRESHOLD)
  })

  it('breaks a streak on a miss without awarding the opponent a step', () => {
    const leading = applyCorrect(createTugMatchState(), 0)
    expect(leading.state.blueStreak).toBe(1)
    const miss = applyTugAnswer(leading.state, 0, { isCorrect: false })
    expect(miss.state.blueStreak).toBe(0)
    expect(miss.state.offset).toBe(-TUG_STEP)
    expect(miss.roundWinner).toBeNull()
  })

  it('clamps offset to the two-step lead', () => {
    expect(clampTugOffset(-4)).toBe(-TUG_ROUND_THRESHOLD)
    expect(clampTugOffset(4)).toBe(TUG_ROUND_THRESHOLD)
    expect(tugNormalizedOffset(-TUG_ROUND_THRESHOLD)).toBe(-1)
    expect(tugNormalizedOffset(TUG_ROUND_THRESHOLD)).toBe(1)
  })

  it('breaks a questions-exhausted tie using the current rope advantage', () => {
    const tied = {
      ...createTugMatchState(),
      blueRoundWins: 1,
      redRoundWins: 1,
      offset: -1,
    }
    expect(resolveMatchOnQuestionsExhausted(tied)).toEqual({
      winner: 'blue',
      reason: 'questions',
    })
    expect(
      resolveMatchOnQuestionsExhausted({ ...tied, offset: 0 })
    ).toEqual({ winner: null, reason: 'draw' })
    expect(
      resolveMatchOnQuestionsExhausted({
        ...tied,
        blueRoundWins: 1,
        redRoundWins: 0,
        offset: 2,
      })
    ).toEqual({ winner: 'blue', reason: 'rounds' })
    expect(winnerFromRounds(tied)).toBeNull()
  })

  it('lerps the displayed offset and throttles HUD emits', () => {
    const stepped = stepDisplayedOffset(0, TUG_OFFSET_LERP_PER_SEC + 1, 1000)
    expect(stepped).toBeCloseTo(TUG_OFFSET_LERP_PER_SEC)
    expect(stepDisplayedOffset(1.84, 2, 1000)).toBeCloseTo(2)
    expect(shouldEmitOffset(0, 0.009)).toBe(false)
    expect(shouldEmitOffset(0, 0.01)).toBe(true)
  })

  it('glows for an armed streak double or an active classroom buff', () => {
    expect(
      teamHasSuperSaiyanGlow({ streak: 0, hasActivePowerUp: false })
    ).toBe(false)
    expect(
      teamHasSuperSaiyanGlow({
        streak: TUG_STREAK_FOR_DOUBLE,
        hasActivePowerUp: false,
      })
    ).toBe(true)
    expect(
      teamHasSuperSaiyanGlow({
        streak: TUG_STREAK_FOR_DOUBLE + 1,
        hasActivePowerUp: false,
      })
    ).toBe(false)
    expect(
      teamHasSuperSaiyanGlow({ streak: 0, hasActivePowerUp: true })
    ).toBe(true)
  })

  it('still accepts a raw two-step impulse as a round win', () => {
    const fullPull = { magnitude: TUG_ROUND_THRESHOLD, towardActiveTeam: true as const }
    const first = applyPull(createTugMatchState(), 0, fullPull)
    expect(first.roundWinner).toBe('blue')
  })
})

describe('tugOfWarLogic payloads and eligibility', () => {
  it('accepts 2–4 option multiple-choice questions with a present correct answer', () => {
    expect(isTugOfWarQuestionEligible(mc)).toBe(true)
    expect(isTugOfWarQuestionEligible({ ...mc, answers: ['A'] })).toBe(false)
    expect(
      isTugOfWarQuestionEligible({ ...mc, type: QuestionType.SORTING })
    ).toBe(false)
    expect(isTugOfWarQuestionEligible({ ...mc, correctAnswer: 'Z' })).toBe(
      false
    )
  })

  it('builds AnswerSelectedPayload for a correct pick, wrong pick, and timeout', () => {
    expect(createTugAnswerPayload(mc, 1, 't1', 4200)).toEqual({
      questionId: 'q1',
      selectedOptionId: 'q1-answer-1',
      isCorrect: true,
      teamId: 't1',
      remainingTimeMs: 4200,
      scoreMultiplier: 1,
    })
    expect(createTugAnswerPayload(mc, 0, 't2', 100).isCorrect).toBe(false)
    expect(createTugAnswerPayload(mc, null, 't1', 0)).toMatchObject({
      selectedOptionId: null,
      isCorrect: false,
      remainingTimeMs: 0,
    })
  })

  it('skips placeholder question images', () => {
    expect(resolveTugQuestionImageUrl(' https://cdn.example/dog.jpg ')).toBe(
      'https://cdn.example/dog.jpg'
    )
    expect(resolveTugQuestionImageUrl('/images/placeholder.webp')).toBeNull()
    expect(resolveTugQuestionImageUrl('')).toBeNull()
  })

  it('replays a live question for a late HUD, but never after lock or end', () => {
    const question = { questionId: 'q1' }
    expect(
      canReplayHudQuestion({
        ended: false,
        disposed: false,
        answerLocked: false,
        lastHudQuestion: question,
      })
    ).toBe(true)
    expect(
      canReplayHudQuestion({
        ended: false,
        disposed: false,
        answerLocked: false,
        lastHudQuestion: null,
      })
    ).toBe(false)
    expect(
      canReplayHudQuestion({
        ended: false,
        disposed: false,
        answerLocked: true,
        lastHudQuestion: question,
      })
    ).toBe(false)
    expect(
      canReplayHudQuestion({
        ended: true,
        disposed: false,
        answerLocked: false,
        lastHudQuestion: question,
      })
    ).toBe(false)
  })
})
