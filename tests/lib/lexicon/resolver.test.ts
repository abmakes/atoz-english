import { describe, expect, it } from 'vitest'
import { entriesForForm, resolveLexicon } from '@/lib/lexicon/resolver'

describe('resolveLexicon', () => {
  it('retrieves level-appropriate topic nouns', () => {
    const result = resolveLexicon({
      level: 'A2',
      tags: ['Food & Drink', 'Nouns'],
      limit: 40,
    })

    expect(result.entries.length).toBeGreaterThan(8)
    expect(result.entries.every((entry) => entry.topics.includes('Food & Drink'))).toBe(true)
    expect(result.entries.every((entry) => entry.partsOfSpeech.includes('noun'))).toBe(true)
    expect(result.words).toContain('food')
  })

  it('can restrict results to words introduced at the target band', () => {
    const result = resolveLexicon({
      level: 'A2',
      tags: [],
      introducedAtLevelOnly: true,
      limit: 100,
    })

    expect(result.entries.length).toBeGreaterThan(0)
    expect(result.entries.every((entry) => entry.introducedAt === 'A2')).toBe(true)
  })

  it('returns an empty selection for an unsupported sparse combination', () => {
    const result = resolveLexicon({
      level: 'PRE_A1',
      tags: ['Stories & Fantasy', 'Adverbs'],
    })

    expect(result.words).toEqual([])
  })
})

describe('morphology curation', () => {
  it('keeps reviewed irregular forms', () => {
    expect(entriesForForm('went').some((entry) => entry.lemma === 'go')).toBe(true)
    expect(entriesForForm('children').some((entry) => entry.lemma === 'child')).toBe(true)
  })

  it('removes known overgenerated teaching forms', () => {
    expect(entriesForForm('goodest')).toEqual([])
    expect(entriesForForm('childs')).toEqual([])
    expect(entriesForForm('goin')).toEqual([])
  })
})
