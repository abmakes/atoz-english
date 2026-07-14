import { describe, it, expect } from 'vitest'
import { QuestionType } from '@/types/question_types'
import {
  SPLASH_DASH_MAX_ANSWER_LENGTH,
  getEligibleGameModes,
  getSplashDashBlockReason,
  hasAnswersTooLongForSplashDash,
  isSplashDashEligible,
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

describe('getEligibleGameModes', () => {
  it('always includes Score Attack and Splash Dash when eligible', () => {
    expect(getEligibleGameModes({ questions: [shortMc] })).toEqual([
      'multiple-choice',
      'splash-dash',
    ])
  })

  it('only includes Score Attack when ineligible', () => {
    const long = 'x'.repeat(SPLASH_DASH_MAX_ANSWER_LENGTH + 1)
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
