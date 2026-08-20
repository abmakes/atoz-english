import { describe, expect, it } from 'vitest'
import { GRAMMAR_PROFILES, profilesForTags } from '@/lib/lexicon/grammar-profiles'
import { GRAMMAR_TAGS } from '@/lib/taxonomy/quiz-taxonomy'

describe('grammar profiles', () => {
  it('covers every discovery grammar tag', () => {
    const profileTags = new Set(GRAMMAR_PROFILES.map((profile) => profile.tag))
    expect([...GRAMMAR_TAGS].sort()).toEqual([...profileTags].sort())
  })

  it('resolves legacy Prepositions onto the split place/time/movement profiles', () => {
    const profiles = profilesForTags(['Prepositions'])
    expect(profiles.map((profile) => profile.tag)).toEqual([
      'Prepositions of Place',
      'Prepositions of Time',
      'Prepositions of Movement',
    ])
  })

  it('returns no profiles for unknown or word-class labels', () => {
    expect(profilesForTags(['Nouns', 'Not A Real Tag'])).toEqual([])
  })
})
