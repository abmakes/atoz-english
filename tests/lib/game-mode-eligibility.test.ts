import { describe, it, expect } from 'vitest'
import { QuestionType } from '@/types/question_types'
import {
  SPLASH_DASH_MAX_ANSWER_LENGTH,
  NINJA_CLIMB_MAX_ANSWER_LENGTH,
  getEligibleGameModes,
  getQuizRoom3dBlockReason,
  getSplashDashBlockReason,
  getNinjaClimbBlockReason,
  getTugOfWar3dBlockReason,
  hasAnswersTooLongForSplashDash,
  hasAnswersTooLongForNinjaClimb,
  isNinjaClimbEligible,
  isQuizRoom3dEligible,
  isSplashDashEligible,
  isTugOfWar3dEligible,
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
  it('includes Team Quiz, Splash Dash, Ninja Climb, and 3D modes when eligible', () => {
    expect(getEligibleGameModes({ questions: [shortMc] })).toEqual([
      'multiple-choice',
      'splash-dash',
      'ninja-climb',
      'quiz-room-3d',
      'tug-of-war-3d',
    ])
  })

  it('keeps Ninja Climb and 3D modes when Splash Dash answers are too long', () => {
    const long = 'x'.repeat(SPLASH_DASH_MAX_ANSWER_LENGTH + 1)
    expect(
      getEligibleGameModes({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [long, 'B'] }],
      })
    ).toEqual(['multiple-choice', 'ninja-climb', 'quiz-room-3d', 'tug-of-war-3d'])
  })

  it('only includes Team Quiz and 3D modes when Ninja Climb answers are too long', () => {
    const long = 'x'.repeat(NINJA_CLIMB_MAX_ANSWER_LENGTH + 1)
    expect(
      getEligibleGameModes({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [long, 'B'] }],
      })
    ).toEqual(['multiple-choice', 'quiz-room-3d', 'tug-of-war-3d'])
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

describe('isTugOfWar3dEligible / getTugOfWar3dBlockReason', () => {
  it('matches 3D Quiz Room eligibility', () => {
    expect(isTugOfWar3dEligible({ questions: [shortMc] })).toBe(true)
    expect(getTugOfWar3dBlockReason({ questions: [shortMc] })).toBeNull()
    expect(
      getTugOfWar3dBlockReason({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: ['Only'] }],
      })
    ).toContain('2–4 answers')
  })
})
