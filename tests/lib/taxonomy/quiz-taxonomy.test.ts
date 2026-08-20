import { describe, expect, it } from 'vitest'
import {
  discoveryTagMatches,
  isKnownQuizTag,
  normalizeDiscoveryTags,
  resolveGrammarTags,
  resolveTopicTags,
  summarizeGenerationBrief,
  syncLevelIntoTags,
} from '@/lib/taxonomy/quiz-taxonomy'

describe('quiz taxonomy aliases', () => {
  it('maps legacy topic labels onto discovery tags', () => {
    expect(resolveTopicTags(['Clothes & Body Parts'])).toEqual(
      expect.arrayContaining(['Clothes', 'Body Parts'])
    )
  })

  it('maps legacy grammar and word-class labels without polluting discovery', () => {
    expect(resolveGrammarTags(['Nouns & Articles'])).toEqual([
      'Countable & Uncountable',
      'Articles (A/An/The)',
    ])
    expect(resolveGrammarTags(['Nouns'])).toEqual([])
    expect(isKnownQuizTag('Nouns')).toBe(false)
    expect(isKnownQuizTag('Present Simple')).toBe(true)
    expect(isKnownQuizTag('Future Simple (Will)')).toBe(true)
    expect(isKnownQuizTag('Prepositions')).toBe(false)
  })

  it('expands the generic Prepositions label onto place/time/movement tags', () => {
    expect(resolveGrammarTags(['Prepositions'])).toEqual([
      'Prepositions of Place',
      'Prepositions of Time',
      'Prepositions of Movement',
    ])
    expect(
      discoveryTagMatches(['Prepositions'], 'Prepositions of Place')
    ).toBe(true)
    expect(
      discoveryTagMatches(['Prepositions of Time'], 'Prepositions')
    ).toBe(true)
  })

  it('normalizes legacy labels for editing and browse filtering', () => {
    expect(normalizeDiscoveryTags(['Clothes & Body Parts', 'A2'])).toEqual(
      expect.arrayContaining(['Clothes', 'Body Parts', 'A2'])
    )
    expect(
      discoveryTagMatches(['Clothes & Body Parts'], 'Clothes')
    ).toBe(true)
    expect(
      discoveryTagMatches(['Stories & Fairy Tales'], 'Stories & Fantasy')
    ).toBe(true)
  })

  it('keeps a single synchronized level label in tags', () => {
    expect(syncLevelIntoTags(['A2', 'Animals', 'Pre-A1'], 'A1')).toEqual([
      'A1',
      'Animals',
    ])
  })

  it('summarizes a generation brief in plain language', () => {
    const summary = summarizeGenerationBrief({
      level: 'A1',
      topics: ['Daily Routines'],
      grammarFocus: ['Present Simple'],
      sentenceForms: ['Affirmative', 'Negative'],
      questionStyles: ['Fill the gap'],
      numberOfQuestions: 8,
    })

    expect(summary).toContain('Create 8 A1 questions about Daily Routines')
    expect(summary).toContain('Present Simple')
  })
})
