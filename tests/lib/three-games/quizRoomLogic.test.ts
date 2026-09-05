import { describe, expect, it } from 'vitest'
import {
  createQuizRoomAnswerPayload,
  isQuizRoomQuestionEligible,
  resolveQuizRoomImageUrl,
  uniqueQuizRoomImageUrls,
} from '@/lib/three-games/quiz-room/quizRoomLogic'
import { QuestionType } from '@/types/question_types'
import type { QuestionData } from '@/types'

const mc: QuestionData = {
  id: 'q1',
  question: 'Pick one',
  answers: ['A', 'B', 'C'],
  correctAnswer: 'B',
  type: QuestionType.MULTIPLE_CHOICE,
}

describe('quizRoomLogic', () => {
  it('accepts 2–4 option multiple-choice questions with a present correct answer', () => {
    expect(isQuizRoomQuestionEligible(mc)).toBe(true)
    expect(
      isQuizRoomQuestionEligible({ ...mc, answers: ['A'] })
    ).toBe(false)
    expect(
      isQuizRoomQuestionEligible({
        ...mc,
        type: QuestionType.SORTING,
      })
    ).toBe(false)
    expect(
      isQuizRoomQuestionEligible({ ...mc, correctAnswer: 'Z' })
    ).toBe(false)
  })

  it('builds AnswerSelectedPayload for a correct pick, wrong pick, and timeout', () => {
    expect(createQuizRoomAnswerPayload(mc, 1, 'team-a', 4200)).toEqual({
      questionId: 'q1',
      selectedOptionId: 'q1-answer-1',
      isCorrect: true,
      teamId: 'team-a',
      remainingTimeMs: 4200,
      scoreMultiplier: 1,
    })
    expect(createQuizRoomAnswerPayload(mc, 0, 'team-b', 100).isCorrect).toBe(
      false
    )
    expect(createQuizRoomAnswerPayload(mc, null, 'team-a', 0)).toMatchObject({
      selectedOptionId: null,
      isCorrect: false,
      remainingTimeMs: 0,
    })
  })

  it('resolves real question image URLs and skips placeholders', () => {
    expect(resolveQuizRoomImageUrl('  https://cdn.example/cat.jpg ')).toBe(
      'https://cdn.example/cat.jpg'
    )
    expect(resolveQuizRoomImageUrl('/images/placeholder.webp')).toBeNull()
    expect(resolveQuizRoomImageUrl('')).toBeNull()
    expect(resolveQuizRoomImageUrl(undefined)).toBeNull()
    expect(
      uniqueQuizRoomImageUrls([
        { ...mc, imageUrl: '/images/placeholder.webp' },
        { ...mc, id: 'q2', imageUrl: '/photos/a.jpg' },
        { ...mc, id: 'q3', imageUrl: '/photos/a.jpg' },
      ])
    ).toEqual(['/photos/a.jpg'])
  })
})
