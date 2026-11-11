import {
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

const SWIM_TITLES: Record<GrammarFocus, string> = {
  'present-simple': 'Present simple',
  'present-continuous': 'Present continuous',
  'wh-question': 'WH questions',
  'be-present': 'am, is, are, or isn\'t',
  'be-past': 'was, were, wasn\'t, or weren\'t',
  'has-have': 'has or have',
  'past-simple-regular': 'Past simple, regular',
  'past-simple-irregular': 'Past simple, irregular',
}

const SWIM_HINTS: Record<GrammarFocus, string> = {
  'present-simple': 'Match the person to the verb, then any object.',
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

function slotForms(slot: WordSlot): readonly [string, string, string, string] {
  if (!slot.options) {
    throw new Error(`"${slot.correct}" has no choices`)
  }
  return slot.options
}

function clueFor(prompt: SentencePrompt, index: number): string {
  const words = prompt.slots.map((slot, slotIndex) => (slotIndex === index ? '___' : slot.correct))
  return `${words.join(' ')}${prompt.punctuation}`
}

function biteFrom(prompt: SentencePrompt, index: number, kind: BiteKind): BiteQuestion {
  const slot = slotAt(prompt, index)
  const decoys = slotForms(slot).filter((option) => option !== slot.correct)
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
    title: SWIM_TITLES[prompt.focus],
    hint: SWIM_HINTS[prompt.focus],
    sentences,
    decoys: decoysFor(candidates, sentences),
  }
}

function mixRound(focus: GrammarFocus, scenes: readonly SwimFrame[], index: number): SwimFrame {
  const sentences = combinePool(scenes)
  if (sentences.length < 3) throw new Error(`${focus} round ${index} needs at least three sentences`)
  return {
    id: `${focus}-swim-${index}`,
    focus,
    title: SWIM_TITLES[focus],
    hint: SWIM_HINTS[focus],
    sentences,
    decoys: decoysFor(
      scenes.flatMap((scene) => scene.decoys),
      sentences
    ),
  }
}

type SubjectPool = {
  agreements: Set<string>
  lexicals: Set<string>
  bare: Set<string>
}

/** Any subject can take any agreeing verb and any object from the round. */
function combinePool(scenes: readonly SwimFrame[]): string[][] {
  const subjects = new Map<string, SubjectPool>()
  const objects = new Set<string>()
  for (const scene of scenes) {
    if (scene.sentences.length === 0) continue
    const tails = scene.sentences.map((sentence) => sentence.slice(1))
    const width = tails[0]?.length ?? 0
    const last = tails[0]?.[width - 1]
    const sharesObject = width > 1 && tails.every((tail) => tail[tail.length - 1] === last)
    const stemLength = sharesObject ? width - 1 : width
    const differs = Array.from({ length: stemLength }, (_, slot) => new Set(tails.map((tail) => tail[slot])).size > 1)
    for (const sentence of scene.sentences) {
      const pool = subjects.get(sentence[0]) ?? { agreements: new Set(), lexicals: new Set(), bare: new Set() }
      subjects.set(sentence[0], pool)
      const stem = sharesObject ? sentence.slice(1, -1) : sentence.slice(1)
      const agreement = stem.filter((_, slot) => differs[slot]).join('\u0001')
      const lexical = stem.filter((_, slot) => !differs[slot]).join('\u0001')
      if (sharesObject && last) {
        objects.add(last)
        pool.agreements.add(agreement)
        pool.lexicals.add(lexical)
      } else {
        pool.bare.add([...stem].join('\u0001'))
      }
    }
  }
  const sentences: string[][] = []
  const seen = new Set<string>()
  for (const [starter, pool] of subjects) {
    const lexicals = pool.lexicals.size > 0 ? pool.lexicals : new Set([''])
    for (const agreement of pool.agreements) {
      for (const lexical of lexicals) {
        for (const object of objects) {
          const words = [starter, ...agreement.split('\u0001'), ...lexical.split('\u0001'), object].filter((word) => word.length > 0)
          const key = words.join('\u0001')
          if (seen.has(key)) continue
          seen.add(key)
          sentences.push(words)
        }
      }
    }
    for (const bare of pool.bare) {
      const words = [starter, ...bare.split('\u0001')].filter((word) => word.length > 0)
      const key = words.join('\u0001')
      if (seen.has(key)) continue
      seen.add(key)
      sentences.push(words)
    }
  }
  return sentences
}

function presentSimpleFrame(prompt: SentencePrompt): SwimFrame {
  const subject = slotAt(prompt, 0).correct
  const verb = slotAt(prompt, 1)
  const [correct, other, ...rest] = slotForms(verb)
  const sheHe = subject === 'They' ? other : correct
  const they = subject === 'They' ? correct : other
  if (sheHe === they) throw new Error(`${prompt.id} lost person agreement`)
  return frame(prompt, peopleSentences(sheHe, they, prompt.slots[2]?.correct), rest)
}

function continuousFrame(prompt: SentencePrompt): SwimFrame {
  const ing = slotAt(prompt, 2).correct
  const verbDecoys = slotForms(slotAt(prompt, 2)).filter((option) => option !== ing)
  const auxDecoys = slotForms(slotAt(prompt, 1)).filter((option) => !['is', 'are', 'am'].includes(option))
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
    slotForms(verb).filter((option) => option !== correct)
  )
}

function haveFrame(prompt: SentencePrompt): SwimFrame {
  const subject = slotAt(prompt, 0).correct
  const verb = slotAt(prompt, 1)
  const verbForms = slotForms(verb)
  const has = subject === 'They' ? verbForms[1] : verb.correct
  const have = subject === 'They' ? verb.correct : verbForms[1]
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
    ...slotForms(slotAt(prompt, 1)),
    ...slotForms(slotAt(prompt, 2)).filter((option) => option !== adjective),
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
  const verbDecoys = slotForms(verb).filter((option) => option !== verb.correct)
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
