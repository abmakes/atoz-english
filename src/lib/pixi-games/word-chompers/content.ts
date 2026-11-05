import {
  GRAMMAR_LABELS,
  promptsForFocus,
  type GrammarFocus,
  type SentencePrompt,
  type WordSlot,
} from '@/lib/pixi-games/sentence-builder/content'

export type ChomperMode = 'bite' | 'swim'
export type BiteKind = 'verb' | 'pronoun'
export type PlayerCount = 2 | 3 | 4

export interface BiteQuestion {
  id: string
  focus: GrammarFocus
  kind: BiteKind
  clue: string
  answer: string
  decoys: string[]
  example: string
}

export interface SwimFrame {
  id: string
  focus: GrammarFocus
  title: string
  hint: string
  sentences: string[][]
  decoys: string[]
}

const VERB_SLOTS: Record<GrammarFocus, readonly number[]> = {
  'present-simple': [1],
  'present-continuous': [1, 2],
  'wh-question': [1, 3],
  'be-present': [1],
  'be-past': [1],
  'has-have': [1],
  'past-simple-regular': [1],
  'past-simple-irregular': [1],
}

const SWIM_HINTS: Record<GrammarFocus, string> = {
  'present-simple': 'Match the person to the verb.',
  'present-continuous': 'Use am, is, or are, then the -ing verb.',
  'wh-question': 'Build the question in order.',
  'be-present': 'Choose am, is, are, or the negative.',
  'be-past': 'Choose was, were, or the negative.',
  'has-have': 'has for she and he. have for they and I.',
  'past-simple-regular': 'The past verb stays the same for every person.',
  'past-simple-irregular': 'The past verb stays the same for every person.',
}

const PRESENT_BE: Record<string, { she: string; they: string; i: string }> = {
  is: { she: 'is', they: 'are', i: 'am' },
  are: { she: 'is', they: 'are', i: 'am' },
  am: { she: 'is', they: 'are', i: 'am' },
  "isn't": { she: "isn't", they: "aren't", i: 'am not' },
  "aren't": { she: "isn't", they: "aren't", i: 'am not' },
}

const PAST_BE: Record<string, { she: string; they: string; i: string }> = {
  was: { she: 'was', they: 'were', i: 'was' },
  were: { she: 'was', they: 'were', i: 'was' },
  "wasn't": { she: "wasn't", they: "weren't", i: "wasn't" },
  "weren't": { she: "wasn't", they: "weren't", i: "wasn't" },
}

function slotAt(prompt: SentencePrompt, index: number): WordSlot {
  const slot = prompt.slots[index]
  if (!slot) throw new Error(`${prompt.id} is missing word slot ${index}`)
  return slot
}

function clueFor(prompt: SentencePrompt, index: number): string {
  const words = prompt.slots.map((slot, slotIndex) => (slotIndex === index ? '___' : slot.correct))
  return `${words.join(' ')}${prompt.punctuation}`
}

function biteFrom(prompt: SentencePrompt, index: number, kind: BiteKind): BiteQuestion {
  const slot = slotAt(prompt, index)
  const decoys = slot.options.filter((option) => option !== slot.correct)
  if (decoys.length !== 3) {
    throw new Error(`${prompt.id} slot ${index} needs three distractors`)
  }
  return {
    id: `${prompt.id}-${kind}-${index}`,
    focus: prompt.focus,
    kind,
    clue: clueFor(prompt, index),
    answer: slot.correct,
    decoys,
    example: prompt.answer,
  }
}

export function biteQuestions(focus: GrammarFocus, kind: BiteKind): BiteQuestion[] {
  return promptsForFocus(focus).map((prompt) => {
    const index = kind === 'pronoun' ? (prompt.focus === 'wh-question' ? 2 : 0) : VERB_SLOTS[focus][0]
    return biteFrom(prompt, index, kind)
  }).concat(
    kind === 'verb'
      ? promptsForFocus(focus).flatMap((prompt) =>
          VERB_SLOTS[focus].slice(1).map((index) => biteFrom(prompt, index, kind))
        )
      : []
  )
}

function peopleSentences(sheHe: string, they: string, object?: string): string[][] {
  const rows = [
    ['She', sheHe],
    ['He', sheHe],
    ['They', they],
    ['I', they],
  ]
  return object ? rows.map((row) => [...row, object]) : rows
}

function decoysFor(candidates: readonly string[], sentences: readonly (readonly string[])[]): string[] {
  const used = new Set(sentences.flat())
  const unique: string[] = []
  for (const word of [...candidates, 'be', 'been', 'being']) {
    if (!word || used.has(word) || unique.includes(word)) continue
    unique.push(word)
    if (unique.length === 4) break
  }
  if (unique.length < 2) {
    throw new Error('A swim round needs at least two extra words')
  }
  return unique
}

function frame(
  prompt: SentencePrompt,
  sentences: string[][],
  candidates: readonly string[]
): SwimFrame {
  const lengths = new Set(sentences.map((sentence) => sentence.length))
  if (lengths.size !== 1) throw new Error(`${prompt.id} swim sentences changed length`)
  return {
    id: `${prompt.id}-swim`,
    focus: prompt.focus,
    title: GRAMMAR_LABELS[prompt.focus],
    hint: SWIM_HINTS[prompt.focus],
    sentences,
    decoys: decoysFor(candidates, sentences),
  }
}

function isPrefix(shorter: readonly string[], longer: readonly string[]): boolean {
  return shorter.length < longer.length && shorter.every((word, index) => longer[index] === word)
}

function conflicts(candidate: readonly string[], chosen: readonly (readonly string[])[]): boolean {
  return chosen.some(
    (sentence) =>
      sentence.join('\u0001') === candidate.join('\u0001') ||
      isPrefix(candidate, sentence) ||
      isPrefix(sentence, candidate)
  )
}

function tailOf(sentence: readonly string[]): string {
  return sentence.slice(1).join('\u0001')
}

/** One sentence from each picture, with a new starter and a different verb phrase. */
function chooseSentence(options: readonly string[][], chosen: readonly (readonly string[])[], preference: number): string[] | null {
  const ordered = [...options.slice(preference), ...options.slice(0, preference)]
  const fresh = ordered.find(
    (sentence) =>
      !chosen.some((other) => other[0] === sentence[0] || tailOf(other) === tailOf(sentence)) &&
      !conflicts(sentence, chosen)
  )
  if (fresh) return fresh
  const differentTail = ordered.find(
    (sentence) => !chosen.some((other) => tailOf(other) === tailOf(sentence)) && !conflicts(sentence, chosen)
  )
  if (differentTail) return differentTail
  return ordered.find((sentence) => !conflicts(sentence, chosen)) ?? null
}

function mixRound(focus: GrammarFocus, scenes: readonly SwimFrame[], index: number): SwimFrame {
  const sentences: string[][] = []
  scenes.forEach((scene, sceneIndex) => {
    const sentence = chooseSentence(scene.sentences, sentences, sceneIndex % scene.sentences.length)
    if (sentence) sentences.push(sentence)
  })
  if (sentences.length < 3) throw new Error(`${focus} round ${index} needs at least three sentences`)
  return {
    id: `${focus}-swim-${index}`,
    focus,
    title: GRAMMAR_LABELS[focus],
    hint: SWIM_HINTS[focus],
    sentences,
    decoys: decoysFor(
      scenes.flatMap((scene) => scene.decoys),
      sentences
    ),
  }
}

function presentSimpleFrame(prompt: SentencePrompt): SwimFrame {
  const subject = slotAt(prompt, 0).correct
  const verb = slotAt(prompt, 1)
  const [correct, other, ...rest] = verb.options
  const sheHe = subject === 'They' ? other : correct
  const they = subject === 'They' ? correct : other
  if (sheHe === they) throw new Error(`${prompt.id} lost person agreement`)
  return frame(prompt, peopleSentences(sheHe, they, prompt.slots[2]?.correct), rest)
}

function continuousFrame(prompt: SentencePrompt): SwimFrame {
  const ing = slotAt(prompt, 2).correct
  const verbDecoys = slotAt(prompt, 2).options.filter((option) => option !== ing)
  const auxDecoys = slotAt(prompt, 1).options.filter((option) => !['is', 'are', 'am'].includes(option))
  const rows = [
    ['She', 'is', ing],
    ['He', 'is', ing],
    ['They', 'are', ing],
    ['I', 'am', ing],
  ]
  const object = prompt.slots[3]?.correct
  return frame(
    prompt,
    object ? rows.map((row) => [...row, object]) : rows,
    [...verbDecoys, ...auxDecoys]
  )
}

function pastFrame(prompt: SentencePrompt): SwimFrame {
  const verb = slotAt(prompt, 1)
  const correct = verb.correct
  return frame(
    prompt,
    peopleSentences(correct, correct, prompt.slots[2]?.correct),
    verb.options.filter((option) => option !== correct)
  )
}

function haveFrame(prompt: SentencePrompt): SwimFrame {
  const subject = slotAt(prompt, 0).correct
  const verb = slotAt(prompt, 1)
  const has = subject === 'They' ? verb.options[1] : verb.correct
  const have = subject === 'They' ? verb.correct : verb.options[1]
  if (has === have) throw new Error(`${prompt.id} lost has/have agreement`)
  return frame(prompt, peopleSentences(has, have, slotAt(prompt, 2).correct), ['having', 'haves'])
}

function beFrame(prompt: SentencePrompt, when: 'present' | 'past'): SwimFrame {
  const aux = slotAt(prompt, 1).correct
  const adjective = slotAt(prompt, 2).correct
  const table = when === 'present' ? PRESENT_BE : PAST_BE
  const forms = table[aux]
  if (!forms) throw new Error(`${prompt.id} has no ${when} be map for ${aux}`)
  const sentences = [
    ['She', forms.she, adjective],
    ['He', forms.she, adjective],
    ['They', forms.they, adjective],
    ['I', forms.i, adjective],
  ]
  const extras = [
    ...slotAt(prompt, 1).options,
    ...slotAt(prompt, 2).options.filter((option) => option !== adjective),
  ]
  return frame(prompt, sentences, extras)
}

function questionFrame(prompt: SentencePrompt): SwimFrame {
  const wh = slotAt(prompt, 0).correct
  const verb = slotAt(prompt, 3)
  const sentences = [
    [wh, 'is', 'she', verb.correct],
    [wh, 'is', 'he', verb.correct],
    [wh, 'are', 'they', verb.correct],
  ]
  const verbDecoys = verb.options.filter((option) => option !== verb.correct)
  return frame(prompt, sentences, [
    verbDecoys[0],
    'her',
    verbDecoys[1],
    'him',
    verbDecoys[2],
    'them',
  ].filter((word): word is string => Boolean(word)))
}

function sceneFrame(prompt: SentencePrompt): SwimFrame {
  switch (prompt.focus) {
    case 'present-simple':
      return presentSimpleFrame(prompt)
    case 'present-continuous':
      return continuousFrame(prompt)
    case 'wh-question':
      return questionFrame(prompt)
    case 'be-present':
      return beFrame(prompt, 'present')
    case 'be-past':
      return beFrame(prompt, 'past')
    case 'has-have':
      return haveFrame(prompt)
    case 'past-simple-regular':
    case 'past-simple-irregular':
      return pastFrame(prompt)
    default: {
      const unreachable: never = prompt.focus
      return unreachable
    }
  }
}

const SENTENCES_PER_ROUND = 4

export function swimFrames(focus: GrammarFocus): SwimFrame[] {
  const scenes = promptsForFocus(focus).map(sceneFrame)
  const rounds: SwimFrame[] = []
  for (let index = 0; index < scenes.length; index += SENTENCES_PER_ROUND) {
    rounds.push(mixRound(focus, scenes.slice(index, index + SENTENCES_PER_ROUND), rounds.length))
  }
  return rounds
}

export function swimVocabulary(frame: SwimFrame): string[] {
  const words: string[] = []
  for (const word of [...frame.sentences.flat(), ...frame.decoys]) {
    if (!words.includes(word)) words.push(word)
  }
  return words
}
