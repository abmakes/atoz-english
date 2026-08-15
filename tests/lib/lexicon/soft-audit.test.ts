import { describe, expect, it } from 'vitest'
import { auditLanguage, filterIgnoredIssues } from '@/lib/lexicon/validator'
import { resolveLexicon } from '@/lib/lexicon/resolver'

describe('soft language audit', () => {
  it('flags above-level words with optional suggestions', () => {
    const a2Only = resolveLexicon({
      level: 'A2',
      tags: [],
      introducedAtLevelOnly: true,
      limit: 1,
    }).words[0]

    const audit = auditLanguage([`the ${a2Only}`], 'PRE_A1')

    expect(audit.valid).toBe(false)
    expect(audit.issues[0]?.word).toBe(a2Only)
    // Suggestions are optional — present when a simpler form exists.
    expect(audit.issues[0]).toHaveProperty('suggestion')
  })

  it('allows teachers to keep textbook words in the review session', () => {
    const audit = auditLanguage(['A flibbertigibbet appears'], 'B1')
    const filtered = filterIgnoredIssues(audit, ['flibbertigibbet'])

    expect(audit.valid).toBe(false)
    expect(filtered.valid).toBe(true)
    expect(filtered.issues).toEqual([])
  })

  it('suggests a simpler form when a harder inflection is above level', () => {
    const audit = auditLanguage(['gone'], 'PRE_A1')
    expect(audit.valid).toBe(false)
    expect(audit.issues[0]?.suggestion).toBeTruthy()
  })
})
