import { describe, it, expect } from 'vitest'
import { QuestionType } from '@/types/question_types'
import {
  SPLASH_DASH_MAX_ANSWER_LENGTH,
  NINJA_CLIMB_MAX_ANSWER_LENGTH,
  getEligibleGameModes,
  getSplashDashBlockReason,
  getNinjaClimbBlockReason,
  hasAnswersTooLongForSplashDash,
  hasAnswersTooLongForNinjaClimb,
  isSplashDashEligible,
  isNinjaClimbEligible,
} from '@/lib/game-mode-eligibility'

const shortMc = {
  type: QuestionType.MULTIPLE_CHOICE,
  answers: ['Yes', 'No', 'Maybe', 'Sure'],
}

describe('isSplashDashEligible', () => {
  it('accepts short multiple-choice quizzes', () => {
    expect(
      isSplashDashEligible({
        quizType: QuestionType.MULTIPLE_CHOICE,
        questions: [shortMc, { ...shortMc, answers: ['A', 'B'] }],
      })
    ).toBe(true)
  })

  it('rejects quizzes with long answers', () => {
    const long = 'x'.repeat(SPLASH_DASH_MAX_ANSWER_LENGTH + 1)
    expect(
      isSplashDashEligible({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [long, 'No'] }],
      })
    ).toBe(false)
  })

  it('rejects wrong answer counts', () => {
    expect(
      isSplashDashEligible({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: ['Only'] }],
      })
    ).toBe(false)
    expect(
      isSplashDashEligible({
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            answers: ['A', 'B', 'C', 'D', 'E'],
          },
        ],
      })
    ).toBe(false)
  })

  it('rejects empty quizzes', () => {
    expect(isSplashDashEligible({ questions: [] })).toBe(false)
  })
})

describe('isNinjaClimbEligible', () => {
  it('accepts short multiple-choice quizzes', () => {
    expect(isNinjaClimbEligible({ questions: [shortMc] })).toBe(true)
  })

  it('rejects quizzes with answers longer than 48 chars', () => {
    const long = 'x'.repeat(NINJA_CLIMB_MAX_ANSWER_LENGTH + 1)
    expect(
      isNinjaClimbEligible({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [long, 'No'] }],
      })
    ).toBe(false)
  })

  it('allows answers longer than Splash Dash but within Ninja Climb limit', () => {
    const mid = 'x'.repeat(SPLASH_DASH_MAX_ANSWER_LENGTH + 1)
    expect(mid.length).toBeLessThanOrEqual(NINJA_CLIMB_MAX_ANSWER_LENGTH)
    expect(
      isNinjaClimbEligible({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [mid, 'No'] }],
      })
    ).toBe(true)
    expect(
      isSplashDashEligible({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [mid, 'No'] }],
      })
    ).toBe(false)
  })
})

describe('getEligibleGameModes', () => {
  it('includes Team Quiz, Splash Dash, and Ninja Climb when eligible', () => {
    expect(getEligibleGameModes({ questions: [shortMc] })).toEqual([
      'multiple-choice',
      'splash-dash',
      'ninja-climb',
    ])
  })

  it('only includes Team Quiz when ineligible for race modes', () => {
    const long = 'x'.repeat(NINJA_CLIMB_MAX_ANSWER_LENGTH + 1)
    expect(
      getEligibleGameModes({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [long, 'B'] }],
      })
    ).toEqual(['multiple-choice'])
  })
})

describe('getSplashDashBlockReason / hasAnswersTooLongForSplashDash', () => {
  it('reports long answers', () => {
    const long = 'x'.repeat(SPLASH_DASH_MAX_ANSWER_LENGTH + 1)
    const quiz = {
      questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [long, 'B'] }],
    }
    expect(getSplashDashBlockReason(quiz)).toContain('too long')
    expect(hasAnswersTooLongForSplashDash(quiz.questions)).toBe(true)
  })

  it('hides length warning for short answers', () => {
    expect(hasAnswersTooLongForSplashDash([shortMc])).toBe(false)
    expect(getSplashDashBlockReason({ questions: [shortMc] })).toBeNull()
  })
})

describe('getNinjaClimbBlockReason / hasAnswersTooLongForNinjaClimb', () => {
  it('reports long answers', () => {
    const long = 'x'.repeat(NINJA_CLIMB_MAX_ANSWER_LENGTH + 1)
    const quiz = {
      questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [long, 'B'] }],
    }
    expect(getNinjaClimbBlockReason(quiz)).toContain('too long')
    expect(hasAnswersTooLongForNinjaClimb(quiz.questions)).toBe(true)
  })

  it('returns null for eligible quizzes', () => {
    expect(getNinjaClimbBlockReason({ questions: [shortMc] })).toBeNull()
  })
})
