import { describe, expect, it } from 'vitest'
import {
  TUG_BASE_PULL,
  TUG_OFFSET_LERP_PER_SEC,
  TUG_ROUNDS_TO_WIN,
  TUG_SPEED_BONUS,
  TUG_TIMEOUT_PULL_FACTOR,
  TUG_WRONG_PULL_FACTOR,
  applyPull,
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

describe('tugOfWarLogic pull math', () => {
  it('awards base plus a speed bonus for a fast correct answer', () => {
    expect(
      computePullImpulse({
        isCorrect: true,
        timedOut: false,
        remainingTimeMs: 8000,
        durationMs: 8000,
      })
    ).toEqual({
      magnitude: TUG_BASE_PULL + TUG_SPEED_BONUS,
      towardActiveTeam: true,
    })
    expect(
      computePullImpulse({
        isCorrect: true,
        timedOut: false,
        remainingTimeMs: 0,
        durationMs: 8000,
      }).magnitude
    ).toBeCloseTo(TUG_BASE_PULL)
  })

  it('gives the opponent 50% of the base pull on a wrong answer', () => {
    expect(
      computePullImpulse({
        isCorrect: false,
        timedOut: false,
        remainingTimeMs: 4000,
        durationMs: 8000,
      })
    ).toEqual({
      magnitude: TUG_BASE_PULL * TUG_WRONG_PULL_FACTOR,
      towardActiveTeam: false,
    })
  })

  it('gives the opponent 25% of the base pull on timeout', () => {
    expect(
      computePullImpulse({
        isCorrect: false,
        timedOut: true,
        remainingTimeMs: 0,
        durationMs: 8000,
      })
    ).toEqual({
      magnitude: TUG_BASE_PULL * TUG_TIMEOUT_PULL_FACTOR,
      towardActiveTeam: false,
    })
  })

  it('pulls blue left and red right on a correct answer', () => {
    const impulse = computePullImpulse({
      isCorrect: true,
      timedOut: false,
      remainingTimeMs: 0,
      durationMs: 1000,
    })
    expect(pullSignForTeam(0)).toBe(-1)
    expect(pullSignForTeam(1)).toBe(1)
    expect(signedPullDelta(0, impulse)).toBeCloseTo(-TUG_BASE_PULL)
    expect(signedPullDelta(1, impulse)).toBeCloseTo(TUG_BASE_PULL)
  })
})

describe('tugOfWarLogic round / match state', () => {
  it('starts centered and awards a round when the marker crosses a threshold', () => {
    let state = createTugMatchState()
    const fullPull = { magnitude: 1, towardActiveTeam: true as const }
    const first = applyPull(state, 0, fullPull)
    expect(first.roundWinner).toBe('blue')
    expect(first.state.blueRoundWins).toBe(1)
    expect(first.matchWinner).toBeNull()
    expect(first.state.phase).toBe('roundOver')

    state = resetRound(first.state)
    expect(state.offset).toBe(0)
    expect(state.roundNumber).toBe(2)
    expect(state.phase).toBe('playing')

    const second = applyPull(state, 0, fullPull)
    expect(second.roundWinner).toBe('blue')
    expect(second.matchWinner).toBe('blue')
    expect(second.state.blueRoundWins).toBe(TUG_ROUNDS_TO_WIN)
    expect(second.state.phase).toBe('matchOver')
  })

  it('clamps offset to the round threshold', () => {
    expect(clampTugOffset(-4)).toBe(-1)
    expect(clampTugOffset(4)).toBe(1)
  })

  it('breaks a questions-exhausted tie using the current rope advantage', () => {
    const tied = {
      ...createTugMatchState(),
      blueRoundWins: 1,
      redRoundWins: 1,
      offset: -0.4,
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
        offset: 0.9,
      })
    ).toEqual({ winner: 'blue', reason: 'rounds' })
    expect(winnerFromRounds(tied)).toBeNull()
  })

  it('lerps the displayed offset and throttles HUD emits', () => {
    const stepped = stepDisplayedOffset(0, 0.85, 1000)
    expect(stepped).toBeCloseTo(TUG_OFFSET_LERP_PER_SEC)
    expect(stepDisplayedOffset(0.84, 0.85, 1000)).toBeCloseTo(0.85)
    expect(shouldEmitOffset(0, 0.009)).toBe(false)
    expect(shouldEmitOffset(0, 0.01)).toBe(true)
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
})
