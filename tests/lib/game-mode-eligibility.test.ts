import { describe, it, expect } from 'vitest'
import { QuestionType } from '@/types/question_types'
import {
  SPLASH_DASH_MAX_ANSWER_LENGTH,
  WORD_PLAY_MAX_SORTING_ITEMS,
  WORD_PLAY_MAX_MATCHING_PAIRS,
  getEligibleGameModes,
  getSplashDashBlockReason,
  getWordPlayBlockReason,
  hasAnswersTooLongForSplashDash,
  isSplashDashEligible,
  isWordPlayEligible,
} from '@/lib/game-mode-eligibility'

const shortMc = {
  type: QuestionType.MULTIPLE_CHOICE,
  answers: ['Yes', 'No', 'Maybe', 'Sure'],
}

const sortingQuestion = {
  type: QuestionType.SORTING,
  answers: ['The', 'dog', 'runs'],
}

const matchingQuestion = {
  type: QuestionType.MATCHING,
  answers: ['hot', 'cold', 'big', 'small'],
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
  it('always includes Team Quiz and Splash Dash when eligible', () => {
    expect(getEligibleGameModes({ questions: [shortMc] })).toEqual([
      'multiple-choice',
      'splash-dash',
    ])
  })

  it('only includes Team Quiz when ineligible', () => {
    const long = 'x'.repeat(SPLASH_DASH_MAX_ANSWER_LENGTH + 1)
    expect(
      getEligibleGameModes({
        questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [long, 'B'] }],
      })
    ).toEqual(['multiple-choice'])
  })
})

describe('isWordPlayEligible', () => {
  it('accepts quizzes made of sorting and matching questions', () => {
    expect(
      isWordPlayEligible({ questions: [sortingQuestion, matchingQuestion] })
    ).toBe(true)
  })

  it('rejects quizzes containing other question types', () => {
    expect(isWordPlayEligible({ questions: [sortingQuestion, shortMc] })).toBe(false)
  })

  it('rejects board-unfriendly item counts', () => {
    const tooManyWords = {
      type: QuestionType.SORTING,
      answers: Array.from({ length: WORD_PLAY_MAX_SORTING_ITEMS + 1 }, (_, i) => `w${i}`),
    }
    expect(isWordPlayEligible({ questions: [tooManyWords] })).toBe(false)

    const tooManyPairs = {
      type: QuestionType.MATCHING,
      answers: Array.from(
        { length: (WORD_PLAY_MAX_MATCHING_PAIRS + 1) * 2 },
        (_, i) => `p${i}`
      ),
    }
    expect(isWordPlayEligible({ questions: [tooManyPairs] })).toBe(false)

    const oddMatching = {
      type: QuestionType.MATCHING,
      answers: ['a', 'b', 'c'],
    }
    expect(isWordPlayEligible({ questions: [oddMatching] })).toBe(false)
  })

  it('rejects empty quizzes', () => {
    expect(isWordPlayEligible({ questions: [] })).toBe(false)
  })

  it('is included in getEligibleGameModes when eligible', () => {
    expect(getEligibleGameModes({ questions: [sortingQuestion] })).toEqual([
      'multiple-choice',
      'word-play',
    ])
  })
})

describe('getWordPlayBlockReason', () => {
  it('reports unsupported question types', () => {
    expect(getWordPlayBlockReason({ questions: [shortMc] })).toContain(
      'word order (sorting) and matching'
    )
  })

  it('reports empty quizzes', () => {
    expect(getWordPlayBlockReason({ questions: [] })).toContain('no questions')
  })

  it('is null when eligible', () => {
    expect(getWordPlayBlockReason({ questions: [matchingQuestion] })).toBeNull()
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
