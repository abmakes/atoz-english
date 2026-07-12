import { describe, it, expect } from 'vitest'
import { questionBaseSchema, quizSettingsSchema, csvRowSchema } from '@/lib/schemas'
import { QuestionType } from '@/types/question_types'

describe('questionBaseSchema', () => {
  it('accepts a valid multiple-choice question', () => {
    const result = questionBaseSchema.safeParse({
      question: 'What color is the sky?',
      answers: ['Blue', 'Green', 'Red', 'Yellow'],
      correctAnswer: 'Blue',
      type: QuestionType.MULTIPLE_CHOICE,
    })

    expect(result.success).toBe(true)
  })

  it('rejects a question with fewer than two answers', () => {
    const result = questionBaseSchema.safeParse({
      question: 'Only one answer?',
      answers: ['Alone'],
      correctAnswer: 'Alone',
    })

    expect(result.success).toBe(false)
  })

  it('rejects empty question text', () => {
    const result = questionBaseSchema.safeParse({
      question: '',
      answers: ['A', 'B'],
      correctAnswer: 'A',
    })

    expect(result.success).toBe(false)
  })
})

describe('quizSettingsSchema', () => {
  it('accepts partial settings', () => {
    const result = quizSettingsSchema.safeParse({
      theme: 'default',
      music: true,
      timeLimit: 'fifteen',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid timeLimit values', () => {
    const result = quizSettingsSchema.safeParse({
      timeLimit: 'thirty',
    })

    expect(result.success).toBe(false)
  })
})

describe('csvRowSchema', () => {
  it('accepts a valid CSV row', () => {
    const result = csvRowSchema.safeParse({
      question: 'Capital of France?',
      answer1: 'Paris',
      answer2: 'London',
      answer3: 'Berlin',
      answer4: 'Madrid',
      correctAnswer: 'Paris',
    })

    expect(result.success).toBe(true)
  })
})
