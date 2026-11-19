export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swap]
    copy[swap] = current
  }
  return copy
}

/** Next challenge cycle should not open on the question that just finished. */
export function reshuffleAvoiding(
  ids: readonly string[],
  avoidId: string | null,
  random: () => number = Math.random
): string[] {
  const next = shuffle(ids, random)
  if (avoidId && next.length > 1 && next[0] === avoidId) {
    const swap = 1 + Math.floor(random() * (next.length - 1))
    const first = next[0]
    next[0] = next[swap]
    next[swap] = first
  }
  return next
}

export function readQueue(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}
