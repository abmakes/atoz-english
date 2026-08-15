import { describe, expect, it } from 'vitest'
import { resolveLexicon } from '@/lib/lexicon/resolver'
import {
  auditLanguage,
  auditQuestion,
  auditQuestions,
} from '@/lib/lexicon/validator'

describe('language audit', () => {
  it('accepts cumulative words within the target level', () => {
    const audit = auditQuestions(
      [
        {
          question: 'The dog is good',
          answers: ['good', 'bad', 'big', 'small'],
          correctAnswer: 'good',
        },
      ],
      'A1'
    )

    expect(audit.valid).toBe(true)
    expect(audit.issues).toEqual([])
  })

  it('flags words introduced above the target level', () => {
    const a2Only = resolveLexicon({
      level: 'A2',
      tags: [],
      introducedAtLevelOnly: true,
      limit: 1,
    }).words[0]

    const audit = auditLanguage([`the ${a2Only}`], 'PRE_A1')

    expect(audit.valid).toBe(false)
    expect(audit.issues).toContainEqual({
      word: a2Only,
      reason: 'above-level',
      detectedLevel: 'A2',
    })
  })

  it('levels harder inflected forms separately from their base lemma', () => {
    expect(auditLanguage(['go'], 'PRE_A1').valid).toBe(true)

    const audit = auditLanguage(['gone'], 'PRE_A1')
    expect(audit.valid).toBe(false)
    expect(audit.issues[0]).toMatchObject({
      word: 'gone',
      reason: 'above-level',
      detectedLevel: 'A2',
    })
    expect(audit.issues[0]?.suggestion).toBeTruthy()
  })

  it('flags words absent from the open lexicon', () => {
    const audit = auditLanguage(['A flibbertigibbet appears'], 'B1')

    expect(audit.valid).toBe(false)
    expect(audit.issues.some((issue) => issue.word === 'flibbertigibbet')).toBe(
      true
    )
  })

  it('ignores unknown words that appear only in distractors', () => {
    const audit = auditQuestion(
      {
        question: 'I eat an apple',
        answers: ['eat', 'flibbertigibbet', 'run', 'puting'],
        correctAnswer: 'eat',
      },
      'A1'
    )

    expect(audit.valid).toBe(true)
    expect(audit.issues).toEqual([])
  })

  it('still flags unknown words in the stem or correct answer', () => {
    const stemAudit = auditQuestion(
      {
        question: 'A flibbertigibbet appears',
        answers: ['yes', 'no', 'maybe', 'ok'],
        correctAnswer: 'yes',
      },
      'B1'
    )
    expect(stemAudit.valid).toBe(false)
    expect(
      stemAudit.issues.some((issue) => issue.word === 'flibbertigibbet')
    ).toBe(true)

    const correctAudit = auditQuestion(
      {
        question: 'Choose the word',
        answers: ['cat', 'flibbertigibbet', 'dog', 'bird'],
        correctAnswer: 'flibbertigibbet',
      },
      'B1'
    )
    expect(correctAudit.valid).toBe(false)
    expect(
      correctAudit.issues.some((issue) => issue.word === 'flibbertigibbet')
    ).toBe(true)
  })
})
