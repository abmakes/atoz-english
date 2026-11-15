import { describe, expect, it } from 'vitest'
import { QuestionType } from '@/types/question_types'
import { computeQuizPlayability, parseQuizPlayability } from '@/lib/quiz-playability'

const shortMc = {
  type: QuestionType.MULTIPLE_CHOICE,
  answers: ['Yes', 'No', 'Maybe'],
  correctAnswer: 'Yes',
}

describe('computeQuizPlayability', () => {
  it('marks classroom modes eligible for a short multiple-choice quiz', () => {
    const playability = computeQuizPlayability({
      quizType: QuestionType.MULTIPLE_CHOICE,
      questions: [shortMc],
    })

    expect(playability.splashDash).toEqual({ eligible: true, reason: null })
    expect(playability.ninjaClimb).toEqual({ eligible: true, reason: null })
    expect(playability.tugOfWar).toEqual({ eligible: true, reason: null })
  })

  it('stores the Splash Dash length reason without loading extra fields', () => {
    const long = 'x'.repeat(41)
    const playability = computeQuizPlayability({
      questions: [{ type: QuestionType.MULTIPLE_CHOICE, answers: [long, 'No'], correctAnswer: 'No' }],
    })

    expect(playability.splashDash.eligible).toBe(false)
    expect(playability.splashDash.reason).toMatch(/too long for Splash Dash/)
    expect(playability.ninjaClimb.eligible).toBe(true)
  })

  it('treats an empty quiz as blocked on every extra mode', () => {
    const playability = computeQuizPlayability({ questions: [] })
    expect(playability.splashDash).toEqual({
      eligible: false,
      reason: 'This quiz has no questions yet.',
    })
    expect(playability.ninjaClimb.eligible).toBe(false)
    expect(playability.tugOfWar.eligible).toBe(false)
  })
})

describe('parseQuizPlayability', () => {
  it('accepts a stored summary object', () => {
    const stored = computeQuizPlayability({ questions: [shortMc] })
    expect(parseQuizPlayability(stored)).toEqual(stored)
  })

  it('returns null for broken JSON so the row can be recomputed', () => {
    expect(parseQuizPlayability(null)).toBeNull()
    expect(parseQuizPlayability('nope')).toBeNull()
    expect(parseQuizPlayability({ splashDash: { eligible: true } })).toBeNull()
  })
})
