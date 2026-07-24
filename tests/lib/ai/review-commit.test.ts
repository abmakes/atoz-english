import { describe, expect, it } from 'vitest'
import {
  commitReviewedQuestions,
  isEmptyQuestionStub,
  mergeApprovedQuestions,
  stripReviewSessionFields,
} from '@/lib/ai/review-commit'
import type { ReviewableQuestion } from '@/components/management_ui/AIQuestionReviewPanel'
import type { Question } from '@/components/management_ui/QuizEditor'
import { QuestionType } from '@/types/question_types'

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    question: 'Where is the cat?',
    answers: ['home', 'run', 'blue', 'two'],
    correctAnswer: 'home',
    imageUrl: '/images/cat.webp',
    imageFile: null,
    imageMetadata: {
      pixabayId: 1,
      pixabayUser: 'teacher',
      tags: ['cat'],
      searchTerm: 'cat',
      width: 640,
      height: 360,
    },
    type: QuestionType.MULTIPLE_CHOICE,
    ...overrides,
  }
}

function makeReviewItem(
  overrides: Partial<ReviewableQuestion> = {}
): ReviewableQuestion {
  return {
    ...makeQuestion(),
    imageKeyword: 'cat',
    languageWarnings: [{ word: 'flibbertigibbet', reason: 'unknown' }],
    keptWords: ['flibbertigibbet'],
    status: 'approved',
    ...overrides,
  }
}

describe('AI review commit helpers', () => {
  it('detects an empty seeded stub', () => {
    expect(
      isEmptyQuestionStub(
        makeQuestion({
          question: '',
          answers: ['', '', '', ''],
          correctAnswer: '',
          imageUrl: '/images/placeholder.webp',
        })
      )
    ).toBe(true)
    expect(isEmptyQuestionStub(makeQuestion())).toBe(false)
  })

  it('replaces an empty stub instead of appending', () => {
    const stub = makeQuestion({
      question: '',
      answers: ['', '', '', ''],
      correctAnswer: '',
    })
    const approved = [makeQuestion({ question: 'New question?' })]
    expect(mergeApprovedQuestions([stub], approved)).toEqual(approved)
  })

  it('appends when real questions already exist', () => {
    const existing = [makeQuestion({ question: 'Old question?' })]
    const approved = [makeQuestion({ question: 'New question?' })]
    expect(mergeApprovedQuestions(existing, approved)).toHaveLength(2)
  })

  it('strips session-only audit fields before entering the quiz', () => {
    const stripped = stripReviewSessionFields([makeReviewItem()])
    expect(stripped[0]).not.toHaveProperty('languageWarnings')
    expect(stripped[0]).not.toHaveProperty('keptWords')
    expect(stripped[0]).not.toHaveProperty('status')
    expect(stripped[0]).not.toHaveProperty('imageKeyword')
    expect(stripped[0].imageUrl).toBe('/images/cat.webp')
    expect(stripped[0].imageMetadata?.searchTerm).toBe('cat')
  })

  it('commits approved items with synced discovery tags and edit view', () => {
    const result = commitReviewedQuestions({
      existingQuestions: [],
      approvedReviewItems: [makeReviewItem()],
      brief: {
        level: 'A1',
        topics: ['Animals'],
        grammarFocus: ['Present Simple'],
        teacherNotes: 'Animals',
        modelSentence: '',
        sentenceForms: ['Affirmative'],
        questionStyles: ['Vocabulary meaning'],
        vocabularyFocus: 'Nouns',
        numberOfQuestions: 1,
        quizTitle: 'Animals',
        quizDescription: 'Practice',
      },
    })

    expect(result.contentView).toBe('create')
    expect(result.tags).toEqual(
      expect.arrayContaining(['A1', 'Animals', 'Present Simple'])
    )
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].question).toBe('Where is the cat?')
  })
})
