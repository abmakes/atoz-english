import { describe, expect, it } from 'vitest'
import { GRAMMAR_FOCUSES, promptsForFocus } from '@/lib/pixi-games/sentence-builder/content'
import { biteQuestions, swimFrames, swimVocabulary } from '@/lib/pixi-games/word-chompers/content'
import {
  buildSlots,
  keysForPlayers,
  rejectReason,
  shuffle,
  swimMatch,
  swimRoster,
  swimStock,
  takeRoundQueue,
} from '@/lib/pixi-games/word-chompers/round'

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

  it('lets any agreeing verb take any object in the round', () => {
    const apple = roundWith('present-simple', ['She', 'eats', 'an apple'])
    expect(apple.sentences).toContainEqual(['She', 'eats', 'an apple'])
    expect(apple.sentences).toContainEqual(['She', 'eats', 'some soup'])
    expect(apple.sentences).toContainEqual(['He', 'rides', 'a book'])
    expect(apple.sentences).toContainEqual(['They', 'read', 'an apple'])
    expect(apple.sentences).toContainEqual(['I', 'cook', 'a bike'])
    expect(apple.sentences).not.toContainEqual(['She', 'read', 'some soup'])
    expect(apple.sentences).not.toContainEqual(['They', 'eats', 'an apple'])
    expect(swimMatch(apple.sentences, ['She', 'eats'])).toBe('prefix')
    expect(swimMatch(apple.sentences, ['She', 'eats', 'some soup'])).toBe('complete')
    expect(swimMatch(apple.sentences, ['She', 'cook'])).toBe('reject')
    expect(buildSlots(apple.sentences, apple.focus)).toEqual(['person', 'verb', 'object'])
    expect(rejectReason(apple.sentences, ['She'], 'cook', apple.focus)).toBe('verb')
    expect(rejectReason(apple.sentences, ['She', 'eats'], 'soccer', apple.focus)).toBe('object')
    const people = ['She', 'He', 'They', 'I']
    const stock = swimStock(apple.sentences, swimVocabulary(apple), 2, () => 0.2)
    for (const person of people) expect(stock.filter((word) => word === person)).toHaveLength(1)
    expect(stock.some((word) => !people.includes(word))).toBe(true)
    const trio = swimStock(apple.sentences, swimVocabulary(apple), 3, () => 0.2)
    for (const person of people) expect(trio.filter((word) => word === person)).toHaveLength(2)
    expect(trio.filter((word) => word === 'eats')).toHaveLength(2)
    expect(trio.filter((word) => word === 'eat')).toHaveLength(2)
    const shown = swimRoster(apple.sentences, swimVocabulary(apple), 3, () => 0.2)
    const shownFamilies = new Set(shown.active.filter((item) => item.kind === 'verb').map((item) => item.family))
    expect(shownFamilies.size).toBeLessThanOrEqual(2)
    if (shown.active.some((item) => item.text === 'eats')) {
      expect(shown.active.some((item) => item.text === 'eat')).toBe(true)
    }
    expect(shown.reserve.some((item) => item.kind === 'verb')).toBe(true)

    const continuous = roundWith('present-continuous', ['She', 'is', 'eating', 'an apple'])
    const continuousRoster = swimRoster(continuous.sentences, swimVocabulary(continuous), 3, () => 0.2)
    const continuousActive = continuousRoster.active.map((item) => item.text)
    expect(continuousActive).toEqual(expect.arrayContaining(['I', 'They', 'am', 'are', 'is']))
    expect(continuousRoster.active.filter((item) => item.text === 'am')).toHaveLength(2)
    expect(continuousRoster.active.filter((item) => item.text === 'are')).toHaveLength(2)
    expect(continuousRoster.active.filter((item) => item.text === 'is')).toHaveLength(2)
    const shownIng = [...new Set(continuousRoster.active.filter((item) => item.kind === 'verb').map((item) => item.text))]
    expect(shownIng.length).toBeLessThanOrEqual(2)
    const quad = swimStock(apple.sentences, swimVocabulary(apple), 4, () => 0.2)
    for (const person of people) expect(quad.filter((word) => word === person)).toHaveLength(3)
    expect(apple.title.includes('/')).toBe(false)
    expect(keysForPlayers(2)).toEqual({ bottom: 'Space', top: 'CapsLock' })
    expect(keysForPlayers(3)).toMatchObject({ bottom: 'Space', right: 'Digit6', top: 'CapsLock' })
    expect(keysForPlayers(4)).toMatchObject({ left: 'ShiftLeft' })

    const soccer = roundWith('present-simple', ['She', 'plays', 'soccer'])
    expect(soccer).not.toBe(apple)
    expect(soccer.sentences.length).toBeGreaterThan(4)

    expect(roundWith('present-continuous', ['She', 'is', 'eating', 'an apple']).sentences).toContainEqual([
      'She',
      'is',
      'eating',
      'an apple',
    ])
    expect(roundWith('has-have', ['She', 'has', 'an apple']).sentences.length).toBeGreaterThan(1)
    expect(roundWith('be-past', ['She', "wasn't", 'sad']).sentences.length).toBeGreaterThan(1)
    expect(roundWith('wh-question', ['What', 'is', 'she', 'eating']).sentences.length).toBeGreaterThan(1)

    for (const focus of GRAMMAR_FOCUSES) {
      const frames = swimFrames(focus)
      expect(frames).toHaveLength(5)
      for (const frame of frames) {
        expect(frame.sentences.length).toBeGreaterThanOrEqual(3)
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
