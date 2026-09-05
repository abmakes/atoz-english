import { describe, it, expect } from 'vitest'
import { QuestionType } from '@/types/question_types'
import {
  SPLASH_DASH_MAX_ANSWER_LENGTH,
  getEligibleGameModes,
  getQuizRoom3dBlockReason,
  getSplashDashBlockReason,
  hasAnswersTooLongForSplashDash,
  isQuizRoom3dEligible,
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
  it('includes Team Quiz, Splash Dash, and 3D Quiz Room when eligible', () => {
    expect(getEligibleGameModes({ questions: [shortMc] })).toEqual([
      'multiple-choice',
      'splash-dash',
      'quiz-room-3d',
    ])
  })

  it('keeps 3D Quiz Room when Splash Dash answers are too long', () => {
    const long = 'x'.repeat(SPLASH_DASH_MAX_ANSWER_LENGTH + 1)
    expect(
      getEligibleGameModes({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [long, 'B'] }],
      })
    ).toEqual(['multiple-choice', 'quiz-room-3d'])
  })
})

describe('isQuizRoom3dEligible / getQuizRoom3dBlockReason', () => {
  it('accepts standard multiple-choice quizzes', () => {
    expect(isQuizRoom3dEligible({ questions: [shortMc] })).toBe(true)
    expect(getQuizRoom3dBlockReason({ questions: [shortMc] })).toBeNull()
  })

  it('rejects wrong answer counts and missing correct answers', () => {
    expect(
      isQuizRoom3dEligible({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: ['Only'] }],
      })
    ).toBe(false)
    expect(
      getQuizRoom3dBlockReason({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: ['Only'] }],
      })
    ).toContain('2–4 answers')
    expect(
      getQuizRoom3dBlockReason({
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            answers: ['A', 'B'],
            correctAnswer: 'C',
          },
        ],
      })
    ).toContain('correct answer')
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
