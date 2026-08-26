import { describe, it, expect } from 'vitest'
import { QuestionType } from '@/types/question_types'
import type { QuestionData } from '@/types'
import {
  parseWordPlayQuestion,
  parseSortingRound,
  parseMatchingRound,
  shuffleAvoidingOriginalOrder,
  isSortingArrangementCorrect,
  isMatchingArrangementCorrect,
} from '@/lib/pixi-games/word-play/wordPlayQuestion'

function makeQuestion(overrides: Partial<QuestionData>): QuestionData {
  return {
    id: 'q1',
    question: 'Arrange the words',
    answers: [],
    correctAnswer: '',
    type: QuestionType.SORTING,
    ...overrides,
  }
}

describe('parseSortingRound', () => {
  it('parses correct order from JSON correctAnswer and shuffles tiles', () => {
    const question = makeQuestion({
      answers: ['dog', 'the', 'runs'],
      correctAnswer: JSON.stringify(['the', 'dog', 'runs']),
    })
    const round = parseSortingRound(question)
    expect(round).not.toBeNull()
    expect(round!.kind).toBe('sorting')
    expect(round!.correctOrder).toEqual(['the', 'dog', 'runs'])
    expect(round!.tiles).toHaveLength(3)
    // Same words, any order
    expect(round!.tiles.map((t) => t.text).sort()).toEqual(['dog', 'runs', 'the'])
    // Tile ids are unique (duplicate-word safe)
    expect(new Set(round!.tiles.map((t) => t.id)).size).toBe(3)
  })

  it('falls back to the answers array when correctAnswer is not JSON', () => {
    const question = makeQuestion({
      answers: ['I', 'like', 'books'],
      correctAnswer: 'not-json',
    })
    const round = parseSortingRound(question)
    expect(round).not.toBeNull()
    expect(round!.correctOrder).toEqual(['I', 'like', 'books'])
  })

  it('returns null when fewer than two words are available', () => {
    const question = makeQuestion({
      answers: ['solo'],
      correctAnswer: JSON.stringify(['solo']),
    })
    expect(parseSortingRound(question)).toBeNull()
  })
})

describe('parseMatchingRound', () => {
  it('parses pairs from JSON correctAnswer and shuffles the right column', () => {
    const pairs = [
      { left: 'cat', right: 'gato' },
      { left: 'dog', right: 'perro' },
      { left: 'bird', right: 'pájaro' },
    ]
    const question = makeQuestion({
      type: QuestionType.MATCHING,
      answers: pairs.flatMap((p) => [p.left, p.right]),
      correctAnswer: JSON.stringify(pairs),
    })
    const round = parseMatchingRound(question)
    expect(round).not.toBeNull()
    expect(round!.kind).toBe('matching')
    expect(round!.correctPairs).toEqual(pairs)
    expect(round!.leftItems.map((i) => i.text)).toEqual(['cat', 'dog', 'bird'])
    expect(round!.rightTiles.map((t) => t.text).sort()).toEqual(
      ['gato', 'perro', 'pájaro'].sort()
    )
  })

  it('derives consecutive pairs from answers when correctAnswer JSON is invalid', () => {
    const question = makeQuestion({
      type: QuestionType.MATCHING,
      answers: ['hot', 'cold', 'big', 'small'],
      correctAnswer: 'broken{json',
    })
    const round = parseMatchingRound(question)
    expect(round).not.toBeNull()
    expect(round!.correctPairs).toEqual([
      { left: 'hot', right: 'cold' },
      { left: 'big', right: 'small' },
    ])
  })

  it('returns null for odd or too-small answer arrays without valid JSON', () => {
    const oddQuestion = makeQuestion({
      type: QuestionType.MATCHING,
      answers: ['a', 'b', 'c'],
      correctAnswer: 'nope',
    })
    expect(parseMatchingRound(oddQuestion)).toBeNull()

    const tinyQuestion = makeQuestion({
      type: QuestionType.MATCHING,
      answers: ['a', 'b'],
      correctAnswer: 'nope',
    })
    expect(parseMatchingRound(tinyQuestion)).toBeNull()
  })
})

describe('parseWordPlayQuestion', () => {
  it('dispatches on question type and rejects unsupported types', () => {
    const sorting = makeQuestion({
      answers: ['a', 'b'],
      correctAnswer: JSON.stringify(['a', 'b']),
    })
    expect(parseWordPlayQuestion(sorting)?.kind).toBe('sorting')

    const mc = makeQuestion({
      type: QuestionType.MULTIPLE_CHOICE,
      answers: ['a', 'b'],
      correctAnswer: 'a',
    })
    expect(parseWordPlayQuestion(mc)).toBeNull()
  })
})

describe('shuffleAvoidingOriginalOrder', () => {
  it('never returns the original order for distinguishable items', () => {
    const items = ['a', 'b', 'c', 'd']
    for (let i = 0; i < 25; i++) {
      const shuffled = shuffleAvoidingOriginalOrder(items)
      expect(shuffled.sort()).toEqual([...items].sort())
    }
    // With a rigged RNG that always produces the identity shuffle,
    // the rotation fallback still avoids the original order.
    const identityRng = () => 0.9999
    const shuffled = shuffleAvoidingOriginalOrder(items, identityRng)
    expect(shuffled).not.toEqual(items)
  })

  it('passes through arrays that cannot be reordered', () => {
    expect(shuffleAvoidingOriginalOrder(['x'])).toEqual(['x'])
    expect(shuffleAvoidingOriginalOrder(['x', 'x'])).toEqual(['x', 'x'])
  })
})

describe('isSortingArrangementCorrect', () => {
  it('accepts the exact order and rejects wrong or incomplete ones', () => {
    const order = ['the', 'dog', 'runs']
    expect(isSortingArrangementCorrect(['the', 'dog', 'runs'], order)).toBe(true)
    expect(isSortingArrangementCorrect(['dog', 'the', 'runs'], order)).toBe(false)
    expect(isSortingArrangementCorrect(['the', null, 'runs'], order)).toBe(false)
    expect(isSortingArrangementCorrect(['the', 'dog'], order)).toBe(false)
  })

  it('handles duplicate words by position', () => {
    const order = ['the', 'cat', 'and', 'the', 'dog']
    expect(isSortingArrangementCorrect(['the', 'cat', 'and', 'the', 'dog'], order)).toBe(true)
  })
})

describe('isMatchingArrangementCorrect', () => {
  const pairs = [
    { left: 'hot', right: 'cold' },
    { left: 'big', right: 'small' },
  ]

  it('accepts complete correct assignments', () => {
    expect(
      isMatchingArrangementCorrect(
        [
          { leftText: 'hot', rightText: 'cold' },
          { leftText: 'big', rightText: 'small' },
        ],
        pairs
      )
    ).toBe(true)
  })

  it('rejects swapped or missing assignments', () => {
    expect(
      isMatchingArrangementCorrect(
        [
          { leftText: 'hot', rightText: 'small' },
          { leftText: 'big', rightText: 'cold' },
        ],
        pairs
      )
    ).toBe(false)
    expect(
      isMatchingArrangementCorrect(
        [
          { leftText: 'hot', rightText: 'cold' },
          { leftText: 'big', rightText: null },
        ],
        pairs
      )
    ).toBe(false)
  })

  it('consumes duplicate pairs so one right item cannot satisfy two lefts', () => {
    const dupPairs = [
      { left: 'a', right: 'x' },
      { left: 'a', right: 'y' },
    ]
    expect(
      isMatchingArrangementCorrect(
        [
          { leftText: 'a', rightText: 'x' },
          { leftText: 'a', rightText: 'y' },
        ],
        dupPairs
      )
    ).toBe(true)
    expect(
      isMatchingArrangementCorrect(
        [
          { leftText: 'a', rightText: 'x' },
          { leftText: 'a', rightText: 'x' },
        ],
        dupPairs
      )
    ).toBe(false)
  })
})
