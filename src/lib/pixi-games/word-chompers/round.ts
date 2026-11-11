export const BITE_ROUNDS = 10
export const BITE_ROUND_MS = 14000
export const SWIM_ROUNDS = 5
export const SWIM_ROUND_MS = 60_000
export const STUN_MS = 2000
/** After the last copy of a word is eaten, the pair waits this long. */
export const WORD_RETURN_MS = 2000
export const HINT_MS = 10_000
export const ROTATION_SPEED = (Math.PI * 2) / 2.67

export type SwimMatch = 'prefix' | 'complete' | 'reject'
export type SwimKind = 'person' | 'aux' | 'verb' | 'object' | 'decoy'
export type SwimInput = 'touch' | 'keyboard'
export type TableEdge = 'bottom' | 'top' | 'left' | 'right'

export interface SwimTokenSpec {
  text: string
  kind: SwimKind
  family: string
}

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

export const KEY_BY_EDGE: Record<TableEdge, string> = {
  bottom: 'Space',
  left: 'ShiftLeft',
  right: 'Digit6',
  top: 'CapsLock',
}

export const KEY_LABEL: Record<string, string> = {
  Space: 'SPACE',
  ShiftLeft: 'SHIFT',
  Digit6: '6',
  CapsLock: 'CAPS',
}

export function keysForPlayers(count: number): Partial<Record<TableEdge, string>> {
  if (count <= 2) return { bottom: KEY_BY_EDGE.bottom, top: KEY_BY_EDGE.top }
  if (count === 3) return { bottom: KEY_BY_EDGE.bottom, right: KEY_BY_EDGE.right, top: KEY_BY_EDGE.top }
  return { ...KEY_BY_EDGE }
}

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

const AUX_GROUPS = [
  ['am', 'is', 'are', "isn't", "aren't", 'am not'],
  ['was', 'were', "wasn't", "weren't"],
  ['has', 'have'],
]

function familyKey(word: string): string {
  const lower = word.toLowerCase()
  for (const group of AUX_GROUPS) {
    if (group.includes(lower)) return `aux:${group[0]}`
  }
  if (lower.endsWith('ing')) return lower
  if (lower.endsWith('ies') && lower.length > 5) return `${lower.slice(0, -3)}y`
  if (/(?:[cs]h|[sxz]|o)es$/.test(lower) && lower.length > 4) return lower.slice(0, -2)
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 3) return lower.slice(0, -1)
  return lower
}

function groupedVerbs(words: readonly string[]): { aux: string[]; lexical: string[][] } {
  const aux: string[] = []
  const families = new Map<string, string[]>()
  for (const word of words) {
    const key = familyKey(word)
    if (key.startsWith('aux:')) {
      if (!aux.includes(word)) aux.push(word)
      continue
    }
    const family = families.get(key) ?? []
    if (!family.includes(word)) family.push(word)
    families.set(key, family)
  }
  return { aux, lexical: [...families.values()] }
}

function personWords(sentences: readonly (readonly string[])[]): string[] {
  const people: string[] = []
  const add = (word: string | undefined) => {
    if (!word || people.includes(word)) return
    if (PERSONS.has(word.toLowerCase()) || people.length === 0) people.push(word)
  }
  for (const sentence of sentences) add(sentence[0])
  for (const word of sentences.flat()) {
    if (PERSONS.has(word.toLowerCase()) && !people.includes(word)) people.push(word)
  }
  return people
}

function copiesOf(words: readonly string[], copies: number, kind: SwimKind): SwimTokenSpec[] {
  return words.flatMap((text) =>
    Array.from({ length: copies }, () => ({ text, kind, family: familyKey(text) }))
  )
}

function spec(text: string, kind: SwimKind): SwimTokenSpec {
  return { text, kind, family: familyKey(text) }
}

/**
 * Every person stays on screen with the verb form that agrees with them.
 * Only extra lexical verbs (eating, riding) wait in reserve.
 */
export function swimRoster(
  sentences: readonly (readonly string[])[],
  vocab: readonly string[],
  players: number,
  random: () => number = Math.random
): { active: SwimTokenSpec[]; reserve: SwimTokenSpec[] } {
  const copies = Math.max(1, players - 1)
  const people = personWords(sentences)
  const { aux, lexical } = groupedVerbs(verbWords(sentences))
  const shownLexical = lexical.slice(0, 2).flat()
  const laterLexical = lexical.slice(2).flat()
  const held = new Set([...people, ...aux, ...lexical.flat()])
  const legal = new Set(sentences.flat())
  const rest = vocab.filter((word) => !held.has(word))
  const objects = shuffle(
    rest.filter((word) => legal.has(word)),
    random
  )
  const decoys = shuffle(
    rest.filter((word) => !legal.has(word)),
    random
  )
  const active = [
    ...copiesOf(people, copies, 'person'),
    ...copiesOf(aux, copies, 'aux'),
    ...copiesOf(shownLexical, copies, 'verb'),
    ...objects.slice(0, 4).map((text) => spec(text, 'object')),
    ...decoys.slice(0, 2).map((text) => spec(text, 'decoy')),
  ]
  const reserve = [
    ...copiesOf(laterLexical, copies, 'verb'),
    ...objects.slice(4).map((text) => spec(text, 'object')),
  ]
  return { active, reserve }
}

export function swimStock(
  sentences: readonly (readonly string[])[],
  vocab: readonly string[],
  players: number,
  random: () => number = Math.random
): string[] {
  const { active, reserve } = swimRoster(sentences, vocab, players, random)
  return [...active, ...reserve].map((item) => item.text)
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

export function rejectReason(
  sentences: readonly (readonly string[])[],
  sequence: readonly string[],
  word: string,
  focus?: string
): string {
  const roles = buildSlots(sentences, focus)
  const role = roles[sequence.length]
  if (role === 'verb') return 'verb'
  if (role === 'person' || role === 'word') return 'person'
  if (role === 'object') return 'object'
  return 'not this word'
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
