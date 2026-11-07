export const BITE_ROUNDS = 10
export const BITE_ROUND_MS = 14000
export const SWIM_ROUNDS = 5
export const SWIM_ROUND_MS = 60_000
export const STUN_MS = 2000
/** After the last copy of a word is eaten, one new copy waits this long. */
export const WORD_RETURN_MS = 2000

export type SwimMatch = 'prefix' | 'complete' | 'reject'

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = current
  }
  return copy
}

export function takeRoundQueue<T>(items: readonly T[], count: number, random?: () => number): T[] {
  return shuffle(items, random).slice(0, count)
}

const PERSONS = new Set(['she', 'he', 'they', 'i'])

function verbWords(sentences: readonly (readonly string[])[]): string[] {
  const verbs: string[] = []
  const add = (word: string | undefined) => {
    if (!word || PERSONS.has(word.toLowerCase())) return
    if (!verbs.includes(word)) verbs.push(word)
  }
  for (const sentence of sentences) {
    if (sentence.length < 2) continue
    if (sentence.length === 2) {
      add(sentence[1])
      continue
    }
    for (let index = 1; index < sentence.length - 1; index += 1) add(sentence[index])
    const beforeLast = sentence[sentence.length - 2]
    if (beforeLast && PERSONS.has(beforeLast.toLowerCase())) add(sentence[sentence.length - 1])
  }
  return verbs
}

/**
 * Words drifting in a swim round.
 * Each person word, and each verb, appears once for every player except one.
 * Three players therefore start with two of every verb. Objects and a few decoys appear once.
 */
export function swimStock(
  sentences: readonly (readonly string[])[],
  vocab: readonly string[],
  players: number,
  random: () => number = Math.random
): string[] {
  const copies = Math.max(1, players - 1)
  const required: string[] = []
  const add = (word: string | undefined) => {
    if (!word || required.includes(word)) return
    required.push(word)
  }
  for (const sentence of sentences) add(sentence[0])
  for (const word of sentences.flat()) {
    if (PERSONS.has(word.toLowerCase())) add(word)
  }
  const verbs = verbWords(sentences)
  const stock: string[] = []
  for (const word of required) {
    for (let copy = 0; copy < copies; copy += 1) stock.push(word)
  }
  for (const word of verbs) {
    for (let copy = 0; copy < copies; copy += 1) stock.push(word)
  }
  const held = new Set([...required, ...verbs])
  const legal = new Set(sentences.flat())
  const rest = vocab.filter((word) => !held.has(word))
  const useful = shuffle(
    rest.filter((word) => legal.has(word)),
    random
  )
  const decoys = shuffle(
    rest.filter((word) => !legal.has(word)),
    random
  )
  stock.push(...useful.slice(0, 8), ...decoys.slice(0, 3))
  return stock
}

/** Empty slots in the sentence the player is building. Same order as the pool. */
export function buildSlots(sentences: readonly (readonly string[])[], focus?: string): string[] {
  const length = Math.max(0, ...sentences.map((sentence) => sentence.length))
  return Array.from({ length }, (_, index) => {
    if (index === 0) return focus === 'wh-question' ? 'word' : 'person'
    if (index === length - 1 && length > 2) return 'object'
    return 'verb'
  })
}

/** A swim bite is legal when the words so far start a real sentence, or finish one. */
export function swimMatch(sentences: readonly (readonly string[])[], sequence: readonly string[]): SwimMatch {
  if (sequence.length === 0) return 'prefix'
  let prefix = false
  for (const sentence of sentences) {
    if (sentence.length < sequence.length) continue
    const matches = sequence.every((word, index) => sentence[index] === word)
    if (!matches) continue
    if (sentence.length === sequence.length) return 'complete'
    prefix = true
  }
  return prefix ? 'prefix' : 'reject'
}
