import { QuestionType } from '@/types/question_types'
import type { QuestionData } from '@/types'

/**
 * Pure parsing + answer-checking helpers for Word Play rounds.
 * Kept free of PixiJS imports so they are unit-testable in Vitest.
 *
 * Data contract (same fields the creation forms and /api/questions write):
 * - SORTING:  `answers` holds the words/chunks; `correctAnswer` is a JSON
 *   `string[]` with the correct order.
 * - MATCHING: `answers` is a flat even-length array of pair items;
 *   `correctAnswer` is JSON `[{ left, right }]`.
 */

export interface WordTileData {
  /** Stable id unique within the round (safe with duplicate words). */
  id: string
  text: string
}

export interface SortingRound {
  kind: 'sorting'
  questionId: string
  prompt: string
  imageUrl?: string | null
  /** Draggable word tiles, shuffled (never identical to the correct order). */
  tiles: WordTileData[]
  /** Correct word texts in order; one drop slot per entry. */
  correctOrder: string[]
}

export interface MatchingPairData {
  left: string
  right: string
}

export interface MatchingRound {
  kind: 'matching'
  questionId: string
  prompt: string
  imageUrl?: string | null
  /** Fixed anchor items shown next to the drop slots. */
  leftItems: WordTileData[]
  /** Draggable right-side tiles, shuffled. */
  rightTiles: WordTileData[]
  correctPairs: MatchingPairData[]
}

export type WordPlayRound = SortingRound | MatchingRound

type Rng = () => number

/** Fisher–Yates shuffle (non-mutating). */
export function shuffleArray<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Shuffles and, when possible, guarantees the result differs from the input
 * order so a sorting round never starts pre-solved.
 */
export function shuffleAvoidingOriginalOrder<T>(
  items: readonly T[],
  rng: Rng = Math.random,
  maxAttempts = 10
): T[] {
  if (items.length < 2) return [...items]
  const allEqual = items.every((item) => item === items[0])
  if (allEqual) return [...items]

  let shuffled = shuffleArray(items, rng)
  let attempts = 0
  while (attempts < maxAttempts && shuffled.every((item, i) => item === items[i])) {
    shuffled = shuffleArray(items, rng)
    attempts++
  }
  if (shuffled.every((item, i) => item === items[i])) {
    // Deterministic fallback: rotate by one.
    shuffled = [...items.slice(1), items[0]]
  }
  return shuffled
}

function parseJsonStringArray(raw: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    if (!parsed.every((item) => typeof item === 'string')) return null
    return parsed as string[]
  } catch {
    return null
  }
}

function parseJsonPairArray(raw: string): MatchingPairData[] | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const pairs: MatchingPairData[] = []
    for (const item of parsed) {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof (item as MatchingPairData).left !== 'string' ||
        typeof (item as MatchingPairData).right !== 'string'
      ) {
        return null
      }
      pairs.push({
        left: (item as MatchingPairData).left,
        right: (item as MatchingPairData).right,
      })
    }
    return pairs
  } catch {
    return null
  }
}

function cleanStrings(values: readonly (string | null | undefined)[]): string[] {
  return values
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
}

function makeTiles(questionId: string, texts: readonly string[], prefix: string): WordTileData[] {
  return texts.map((text, i) => ({ id: `${questionId}-${prefix}-${i}`, text }))
}

export function parseSortingRound(
  question: QuestionData,
  rng: Rng = Math.random
): SortingRound | null {
  const fromCorrectAnswer = parseJsonStringArray(question.correctAnswer ?? '')
  const correctOrder = cleanStrings(fromCorrectAnswer ?? question.answers ?? [])
  if (correctOrder.length < 2) return null

  const shuffledTexts = shuffleAvoidingOriginalOrder(correctOrder, rng)
  return {
    kind: 'sorting',
    questionId: question.id,
    prompt: question.question,
    imageUrl: question.imageUrl ?? null,
    tiles: makeTiles(question.id, shuffledTexts, 'tile'),
    correctOrder,
  }
}

export function parseMatchingRound(
  question: QuestionData,
  rng: Rng = Math.random
): MatchingRound | null {
  let pairs = parseJsonPairArray(question.correctAnswer ?? '')

  if (!pairs) {
    // Fallback: derive consecutive pairs from the flat answers array.
    const flat = cleanStrings(question.answers ?? [])
    if (flat.length < 4 || flat.length % 2 !== 0) return null
    pairs = []
    for (let i = 0; i < flat.length; i += 2) {
      pairs.push({ left: flat[i], right: flat[i + 1] })
    }
  }

  pairs = pairs
    .map((p) => ({ left: p.left.trim(), right: p.right.trim() }))
    .filter((p) => p.left.length > 0 && p.right.length > 0)
  if (pairs.length < 2) return null

  const rightTexts = pairs.map((p) => p.right)
  const shuffledRight = shuffleAvoidingOriginalOrder(rightTexts, rng)

  return {
    kind: 'matching',
    questionId: question.id,
    prompt: question.question,
    imageUrl: question.imageUrl ?? null,
    leftItems: makeTiles(question.id, pairs.map((p) => p.left), 'left'),
    rightTiles: makeTiles(question.id, shuffledRight, 'right'),
    correctPairs: pairs,
  }
}

/**
 * Parses a question into a playable Word Play round, or null when the
 * question type/data cannot be played.
 */
export function parseWordPlayQuestion(
  question: QuestionData,
  rng: Rng = Math.random
): WordPlayRound | null {
  if (question.type === QuestionType.SORTING) {
    return parseSortingRound(question, rng)
  }
  if (question.type === QuestionType.MATCHING) {
    return parseMatchingRound(question, rng)
  }
  return null
}

/** True when the placed word texts exactly match the correct order. */
export function isSortingArrangementCorrect(
  placedTexts: readonly (string | null)[],
  correctOrder: readonly string[]
): boolean {
  if (placedTexts.length !== correctOrder.length) return false
  return correctOrder.every((text, i) => placedTexts[i] === text)
}

/**
 * True when every left item has been matched with a valid right item.
 * Handles duplicate texts by consuming pairs as they are matched.
 */
export function isMatchingArrangementCorrect(
  assignments: readonly { leftText: string; rightText: string | null }[],
  correctPairs: readonly MatchingPairData[]
): boolean {
  if (assignments.length !== correctPairs.length) return false
  const remaining = [...correctPairs]
  for (const assignment of assignments) {
    if (assignment.rightText === null) return false
    const index = remaining.findIndex(
      (p) => p.left === assignment.leftText && p.right === assignment.rightText
    )
    if (index === -1) return false
    remaining.splice(index, 1)
  }
  return true
}
