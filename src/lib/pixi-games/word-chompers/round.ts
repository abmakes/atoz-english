export const BITE_ROUNDS = 10
export const BITE_ROUND_MS = 14000
export const SWIM_ROUNDS = 5
export const SWIM_ROUND_MS = 60_000
export const STUN_MS = 2000

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
