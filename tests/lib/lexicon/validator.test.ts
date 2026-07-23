import { describe, expect, it } from 'vitest'
import { resolveLexicon } from '@/lib/lexicon/resolver'
import { auditLanguage, auditQuestions } from '@/lib/lexicon/validator'

describe('language audit', () => {
  it('accepts cumulative words within the target level', () => {
    const audit = auditQuestions(
      [
        {
          question: 'The dog is good',
          answers: ['good', 'bad', 'big', 'small'],
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

  it('flags words absent from the open lexicon', () => {
    const audit = auditLanguage(['A flibbertigibbet appears'], 'B1')

    expect(audit.valid).toBe(false)
    expect(audit.issues.some((issue) => issue.word === 'flibbertigibbet')).toBe(true)
  })
})
