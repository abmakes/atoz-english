import { describe, expect, it } from 'vitest'
import { GRAMMAR_FOCUSES, promptsForFocus } from '@/lib/pixi-games/sentence-builder/content'
import { biteQuestions, swimFrames, swimVocabulary } from '@/lib/pixi-games/word-chompers/content'
import { shuffle, swimMatch, takeRoundQueue } from '@/lib/pixi-games/word-chompers/round'

function roundWith(focus: Parameters<typeof swimFrames>[0], sentence: readonly string[]) {
  const found = swimFrames(focus).find((frame) =>
    frame.sentences.some((row) => row.length === sentence.length && row.every((word, index) => word === sentence[index]))
  )
  if (!found) throw new Error(`Missing swim sentence ${sentence.join(' ')}`)
  return found
}

describe('word chomper grammar', () => {
  it('turns each sentence into a verb-form blank and a pronoun blank', () => {
    for (const focus of GRAMMAR_FOCUSES) {
      const pronouns = biteQuestions(focus, 'pronoun')
      const verbs = biteQuestions(focus, 'verb')
      expect(pronouns).toHaveLength(promptsForFocus(focus).length)
      expect(verbs.length).toBeGreaterThanOrEqual(promptsForFocus(focus).length)
      for (const question of [...pronouns, ...verbs]) {
        expect(question.clue).toContain('___')
        expect(question.decoys).toHaveLength(3)
        expect(question.decoys).not.toContain(question.answer)
        expect(question.example).toContain(question.answer)
        expect(question.clue.endsWith(question.example.endsWith('?') ? '?' : '.')).toBe(true)
      }
    }
  })

  it('asks for the verb form, and for the subject pronoun', () => {
    const verb = biteQuestions('present-simple', 'verb').find((item) => item.id.startsWith('maya-apple'))
    const pronoun = biteQuestions('present-simple', 'pronoun').find((item) => item.id.startsWith('maya-apple'))
    expect(verb).toMatchObject({
      clue: 'She ___ an apple.',
      answer: 'eats',
      decoys: ['eat', 'eating', 'ate'],
      example: 'She eats an apple.',
    })
    expect(pronoun).toMatchObject({
      clue: '___ eats an apple.',
      answer: 'She',
      decoys: ['Her', 'Hers', 'Shes'],
    })

    const aux = biteQuestions('present-continuous', 'verb').find((item) => item.clue === 'She ___ eating an apple.')
    const ing = biteQuestions('present-continuous', 'verb').find((item) => item.clue === 'She is ___ an apple.')
    expect(aux?.answer).toBe('is')
    expect(ing?.answer).toBe('eating')

    const question = biteQuestions('wh-question', 'pronoun').find((item) => item.id.startsWith('maya-apple'))
    expect(question).toMatchObject({ clue: 'What is ___ eating?', answer: 'she' })
  })

  it('puts four different sentences in each swim round', () => {
    const apple = roundWith('present-simple', ['She', 'eats', 'an apple'])
    expect(apple.sentences).toEqual([
      ['She', 'eats', 'an apple'],
      ['He', 'rides', 'a bike'],
      ['They', 'read', 'a book'],
      ['I', 'cook', 'some soup'],
    ])
    const soccer = roundWith('present-simple', ['She', 'plays', 'soccer'])
    expect(soccer).not.toBe(apple)
    expect(soccer.sentences).toHaveLength(4)

    expect(roundWith('present-continuous', ['She', 'is', 'eating', 'an apple']).sentences.length).toBeGreaterThan(1)
    expect(roundWith('has-have', ['She', 'has', 'an apple']).sentences.length).toBeGreaterThan(1)
    expect(roundWith('be-past', ['She', "wasn't", 'sad']).sentences.length).toBeGreaterThan(1)
    expect(roundWith('wh-question', ['What', 'is', 'she', 'eating']).sentences.length).toBeGreaterThan(1)

    for (const focus of GRAMMAR_FOCUSES) {
      const frames = swimFrames(focus)
      expect(frames).toHaveLength(5)
      for (const frame of frames) {
        expect(frame.sentences.length).toBeGreaterThanOrEqual(3)
        expect(frame.sentences.length).toBeLessThanOrEqual(4)
        const tails = new Set(frame.sentences.map((sentence) => sentence.slice(1).join(' ')))
        expect(tails.size).toBe(frame.sentences.length)
        const used = new Set(frame.sentences.flat())
        expect(frame.decoys.length).toBeGreaterThanOrEqual(2)
        for (const decoy of frame.decoys) expect(used.has(decoy)).toBe(false)
        for (const sentence of frame.sentences) {
          const longer = frame.sentences.find(
            (other) => other.length > sentence.length && sentence.every((word, index) => other[index] === word)
          )
          expect(longer).toBeUndefined()
        }
        expect(swimVocabulary(frame).length).toBeGreaterThan(frame.sentences[0].length)
      }
    }
  })
})

describe('word chomper round rules', () => {
  const apple = [
    ['She', 'eats', 'an apple'],
    ['They', 'eat', 'an apple'],
  ]

  it('accepts a sentence as it is built and when it is finished', () => {
    expect(swimMatch(apple, [])).toBe('prefix')
    expect(swimMatch(apple, ['She'])).toBe('prefix')
    expect(swimMatch(apple, ['She', 'eats'])).toBe('prefix')
    expect(swimMatch(apple, ['She', 'eats', 'an apple'])).toBe('complete')
    expect(swimMatch(apple, ['They', 'eat', 'an apple'])).toBe('complete')
  })

  it('rejects a verb that belongs to the other person', () => {
    expect(swimMatch(apple, ['She', 'eat'])).toBe('reject')
    expect(swimMatch(apple, ['They', 'eats'])).toBe('reject')
    expect(swimMatch(apple, ['She', 'eats', 'soccer'])).toBe('reject')
  })

  it('deals a short shuffled queue and keeps every item from the source', () => {
    const random = () => 0
    expect(shuffle([1, 2, 3, 4], random)).toEqual([2, 3, 4, 1])
    expect(takeRoundQueue(['a', 'b', 'c', 'd', 'e'], 3, random)).toEqual(['b', 'c', 'd'])
    expect(takeRoundQueue(['only'], 5, random)).toEqual(['only'])
    expect(shuffle([], random)).toEqual([])
  })
})
