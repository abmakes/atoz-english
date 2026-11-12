import { z } from 'zod'

export const WORKSHEET_ACTIVITIES = ['gap', 'question', 'rewrite', 'matching', 'practice'] as const

export type WorksheetActivity = (typeof WORKSHEET_ACTIVITIES)[number]

export interface PracticeSource {
  id?: string
  question: string
  answers: string[]
  correctAnswer: string
  imageUrl?: string | null
}

export interface PracticeDraft {
  activity: WorksheetActivity
  line: string
  choices: string[]
  questionId?: string
  imageUrl?: string | null
  correctAnswer: string
  reason: string
  sourceQuestion: string
}

const QUESTION_START =
  /^(who|what|where|when|why|how|which|whose|am|is|are|was|were|do|does|did|can|could|will|would|shall|should|have|has|had)\b/i

/**
 * A student sentence starts with a capital and ends with a stop, or a question mark.
 * The words themselves change. This is not a CSS transform.
 */
export function finishWorksheetSentence(raw: string): string {
  const trimmed = raw.replace(/[ \t]{2,}/g, ' ').trim()
  if (!trimmed) return ''
  const end = trimmed.match(/[.?!]+$/)?.[0] ?? ''
  const core = (end ? trimmed.slice(0, -end.length) : trimmed).trim()
  if (!core) return trimmed
  const body = /^[a-z]/.test(core) ? core[0].toUpperCase() + core.slice(1) : core
  if (/^(Do not|Don't|Does not|Doesn't)\b/.test(body)) return `${body}.`
  const question = end.includes('?') || QUESTION_START.test(body)
  return question ? `${body}?` : `${body}.`
}

export function isWorksheetActivity(value: string | undefined): value is WorksheetActivity {
  return WORKSHEET_ACTIVITIES.some((activity) => activity === value)
}

const practiceItemSchema = z.object({
  activity: z.enum(WORKSHEET_ACTIVITIES),
  line: z.string().min(1).max(500),
  choices: z.array(z.string().max(120)).max(4).optional(),
  questionId: z.string().optional(),
  reason: z.string().max(200).optional(),
})

export function parseWorksheetPractice(raw: string): z.infer<typeof practiceItemSchema>[] | null {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start < 0 || end <= start) return null
  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1))
    const items = z.array(practiceItemSchema).parse(parsed).slice(0, 8)
    if (items.length < 6) return null
    const kinds = new Set(items.map((item) => item.activity))
    if (kinds.size < 3) return null
    return items
  } catch {
    return null
  }
}

type Family =
  | 'there-is'
  | 'was-were'
  | 'present-continuous'
  | 'present-simple'
  | 'going-to'
  | 'comparatives'
  | 'modals'
  | 'conditionals'

const TAG_FAMILY: Record<string, Family> = {
  'there is / there are': 'there-is',
  'past simple': 'was-were',
  'past continuous': 'was-were',
  'present continuous': 'present-continuous',
  'present simple': 'present-simple',
  'future with going to': 'going-to',
  'comparatives & superlatives': 'comparatives',
  'must / have to / should': 'modals',
  'first conditional': 'conditionals',
}

const FAMILY_LABEL: Record<Family, string> = {
  'there-is': 'There is / There are',
  'was-were': 'was / were',
  'present-continuous': 'present continuous',
  'present-simple': 'present simple',
  'going-to': 'going to',
  comparatives: 'comparatives',
  modals: 'must, have to and should',
  conditionals: 'if and unless',
}

function plainAnswer(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith('{')) return ''
  return trimmed
}

function usable(answers: readonly string[]): string[] {
  return answers.map((answer) => answer.trim()).filter(Boolean).slice(0, 4)
}

function phraseAfterBlank(question: string): string {
  const match = question.match(/_{2,}\s+(.+)$/)
  return match?.[1]?.replace(/[.?!]+$/, '').trim() ?? ''
}

function bareNoun(phrase: string): string {
  return phrase
    .replace(/\s+(in|on|at|under|behind)\s+.+$/i, '')
    .replace(/^(a|an|the|some|any|two|three|four|\d+)\s+/i, '')
    .trim()
}

function inferFamily(text: string): Family | null {
  if (/\bthere (is|are)\b|\bare there\b/i.test(text)) return 'there-is'
  if (/\bgoing to\b/i.test(text)) return 'going-to'
  if (/\bwas\b|\bwere\b/i.test(text)) return 'was-were'
  if (/\bunless\b|\bif\b[^.]{0,80}\bwill\b/i.test(text)) return 'conditionals'
  if (/\bmust\b|\bshould\b|\bhave to\b|\bmustn't\b/i.test(text)) return 'modals'
  if (/\bthan\b|\bmore\b|\bthe most\b/i.test(text)) return 'comparatives'
  if (/\b(am|is|are)\b/.test(text) && /\w+ing\b/.test(text)) return 'present-continuous'
  return null
}

export function decideWorksheetGrammar(input: {
  grammar?: string[]
  title?: string
  description?: string
  questions: PracticeSource[]
}): { family: Family; label: string } {
  for (const tag of input.grammar ?? []) {
    const family = TAG_FAMILY[tag.trim().toLowerCase()]
    if (family) return { family, label: FAMILY_LABEL[family] }
  }
  const corpus = [
    input.title ?? '',
    input.description ?? '',
    ...input.questions.flatMap((question) => [
      question.question,
      plainAnswer(question.correctAnswer),
      ...question.answers,
    ]),
  ].join(' ')
  const inferred = inferFamily(corpus)
  if (inferred) return { family: inferred, label: FAMILY_LABEL[inferred] }
  const ing = input.questions.some((question) => /ing$/i.test(plainAnswer(question.correctAnswer)))
  const family = ing ? 'present-continuous' : 'present-simple'
  return { family, label: FAMILY_LABEL[family] }
}

interface Scene {
  id?: string
  subject: string
  auxiliary: string
  verb: string
  rest: string
  imageUrl?: string | null
  choices: string[]
  sourceQuestion: string
}

function continuousScenes(questions: PracticeSource[]): Scene[] {
  const scenes: Scene[] = []
  for (const question of questions) {
    const match = question.question.match(/^(.*?)\b(am|is|are)\b\s+_{2,}\s*(.*)$/i)
    const verb = plainAnswer(question.correctAnswer)
    if (!match || !verb) continue
    scenes.push({
      id: question.id,
      subject: match[1].trim() || 'she',
      auxiliary: match[2].toLowerCase(),
      verb,
      rest: match[3].replace(/[.?!]+$/, '').trim() || 'it',
      imageUrl: question.imageUrl,
      choices: usable(question.answers),
      sourceQuestion: question.question,
    })
  }
  if (scenes.length > 0) return scenes
  return [
    {
      subject: 'she',
      auxiliary: 'is',
      verb: 'reading',
      rest: 'a book',
      choices: ['reading', 'read', 'reads', 'read'],
      sourceQuestion: 'she is ___ a book',
    },
  ]
}

function plainVerb(scene: Scene): string {
  const other = scene.choices.filter((choice) => choice.toLowerCase() !== scene.verb.toLowerCase())
  const third = other.find((choice) => /s$/i.test(choice) && !/ing$/i.test(choice))
  if (/^(he|she|it)$/i.test(scene.subject) && third) return third
  return other.find((choice) => !/ing$/i.test(choice)) ?? scene.verb.replace(/ing$/i, '')
}

function stemOf(verb: string): string {
  const bare = verb.replace(/ing$/i, '')
  if (bare.length > 2 && bare.endsWith(bare[bare.length - 1]) && /[bcdfgklmnprstz]/i.test(bare[bare.length - 1])) {
    return bare.slice(0, -1)
  }
  return bare
}

function draft(
  activity: WorksheetActivity,
  line: string,
  reason: string,
  extra: Partial<PracticeDraft> = {}
): PracticeDraft {
  return {
    activity,
    line,
    choices: extra.choices ?? [],
    questionId: extra.questionId,
    imageUrl: extra.imageUrl,
    correctAnswer: extra.correctAnswer ?? '',
    reason,
    sourceQuestion: extra.sourceQuestion ?? reason,
  }
}

function thereDrafts(questions: PracticeSource[], label: string): PracticeDraft[] {
  const phrases = questions.map((question) => phraseAfterBlank(question.question)).filter(Boolean)
  const singular = phrases.find((phrase) => /^(a|an)\s/i.test(phrase)) ?? 'a giraffe'
  const pluralPhrase = phrases.find((phrase) => /^(two|three|some|any|\d+)\s/i.test(phrase)) ?? 'two snakes'
  const many = bareNoun(pluralPhrase) || 'snakes'
  const oneNoun = bareNoun(singular) || 'giraffe'
  const pictured = questions.find((question) => question.imageUrl && phraseAfterBlank(question.question))
  const reason = (kind: string) => `${kind} for ${label}.`
  return [
    draft('gap', `There ______ ${singular}`, reason('Gap'), {
      choices: ['is', 'are', 'was', 'were'],
      correctAnswer: 'is',
      imageUrl: pictured?.imageUrl,
      questionId: pictured?.id,
      sourceQuestion: pictured?.question ?? singular,
    }),
    draft('question', `Are there any ${/s$/i.test(oneNoun) ? oneNoun : `${oneNoun}s`}`, reason('Question'), {
      sourceQuestion: pictured?.question ?? singular,
    }),
    draft('question', `How many ${many} are there`, reason('Question'), {
      sourceQuestion: pluralPhrase,
    }),
    draft('gap', `There ______ ${pluralPhrase}`, reason('Gap'), {
      choices: ['are', 'is', 'was', 'were'],
      correctAnswer: 'are',
      sourceQuestion: pluralPhrase,
    }),
    draft('rewrite', `Rewrite this as a question: There is ${singular}`, reason('Rewrite'), {
      sourceQuestion: singular,
    }),
    draft('matching', 'Match there is and there are', reason('Matching'), {
      choices: ['there is — one', 'there are — more than one'],
      sourceQuestion: label,
    }),
    draft('practice', 'Write one question that starts with Are there', reason('Short practice'), {
      sourceQuestion: label,
    }),
    draft('question', 'What is there in the picture', reason('Question'), {
      imageUrl: pictured?.imageUrl,
      questionId: pictured?.id,
      sourceQuestion: pictured?.question ?? label,
    }),
  ]
}

function wasWereDrafts(label: string): PracticeDraft[] {
  const reason = (kind: string) => `${kind} for ${label}.`
  return [
    draft('gap', 'They ______ at the hospital three days ago', reason('Gap'), {
      choices: ['were', 'was', 'are', 'is'],
      correctAnswer: 'were',
    }),
    draft('gap', 'She ______ at home for dinner last Wednesday', reason('Gap'), {
      choices: ['was', 'were', 'is', 'are'],
      correctAnswer: 'was',
    }),
    draft('question', 'Was it a good film', reason('Question')),
    draft('question', 'Were they at school this morning', reason('Question')),
    draft('rewrite', 'Rewrite this in the past: She is at home', reason('Rewrite')),
    draft('matching', 'Match was and were to the subject', reason('Matching'), {
      choices: ['was — I, he, she', 'were — you, we, they'],
    }),
    draft('practice', 'Write one sentence about yesterday', reason('Short practice')),
    draft('gap', 'We ______ in Brazil last summer', reason('Gap'), {
      choices: ['were', 'was', 'are', 'is'],
      correctAnswer: 'were',
    }),
  ]
}

function continuousDrafts(questions: PracticeSource[], label: string): PracticeDraft[] {
  const scenes = continuousScenes(questions)
  const a = scenes[0]
  const b = scenes[1] ?? scenes[0]
  const c = scenes[Math.min(2, scenes.length - 1)]
  const pairs = scenes.slice(0, 4).map((scene) => `${stemOf(scene.verb)} — ${scene.verb}`)
  const reason = (kind: string) => `${kind} for ${label}.`
  const ask = (scene: Scene) =>
    scene.auxiliary === 'are' ? 'Are' : scene.auxiliary === 'am' ? 'Am' : 'Is'
  return [
    draft('gap', `${a.subject} ${a.auxiliary} ______ ${a.rest}`, reason('Gap'), {
      choices: a.choices,
      correctAnswer: a.verb,
      imageUrl: a.imageUrl,
      questionId: a.id,
      sourceQuestion: a.sourceQuestion,
    }),
    draft('question', `${ask(a)} ${a.subject} ${a.verb} ${a.rest}`, reason('Question'), {
      imageUrl: a.imageUrl,
      questionId: a.id,
      sourceQuestion: a.sourceQuestion,
    }),
    draft('rewrite', `Rewrite this in the present continuous: ${a.subject} ${plainVerb(a)} ${a.rest}`, reason('Rewrite'), {
      sourceQuestion: a.sourceQuestion,
    }),
    draft('matching', 'Match each verb to its -ing form', reason('Matching'), {
      choices: pairs.slice(0, 4),
      sourceQuestion: label,
    }),
    draft('practice', `Write one sentence about what ${a.subject} is doing now`, reason('Short practice'), {
      sourceQuestion: a.sourceQuestion,
    }),
    draft('gap', `${b.subject} ${b.auxiliary} ______ ${b.rest}`, reason('Gap'), {
      choices: b.choices,
      correctAnswer: b.verb,
      imageUrl: b.imageUrl,
      questionId: b.id,
      sourceQuestion: b.sourceQuestion,
    }),
    draft('question', `What ${b.auxiliary === 'are' ? 'are' : 'is'} ${b.subject} doing`, reason('Question'), {
      sourceQuestion: b.sourceQuestion,
    }),
    draft('gap', `${c.subject} ${c.auxiliary} ______ ${c.rest}`, reason('Gap'), {
      choices: c.choices,
      correctAnswer: c.verb,
      imageUrl: c.imageUrl,
      questionId: c.id,
      sourceQuestion: c.sourceQuestion,
    }),
  ]
}

function simpleDrafts(questions: PracticeSource[], label: string): PracticeDraft[] {
  const verb = plainAnswer(questions[0]?.correctAnswer ?? '') || 'eats'
  const choices = usable(questions[0]?.answers ?? []) 
  const options = choices.length >= 2 ? choices : ['eats', 'eat', 'eating', 'ate']
  const reason = (kind: string) => `${kind} for ${label}.`
  return [
    draft('gap', 'She ______ an apple every day', reason('Gap'), {
      choices: options,
      correctAnswer: options.includes(verb) ? verb : options[0],
      imageUrl: questions[0]?.imageUrl,
      questionId: questions[0]?.id,
      sourceQuestion: questions[0]?.question ?? label,
    }),
    draft('question', 'Does she eat an apple every day', reason('Question')),
    draft('rewrite', 'Rewrite this in the present simple: She is eating an apple', reason('Rewrite')),
    draft('matching', 'Match the subject to the verb', reason('Matching'), {
      choices: ['I — eat', 'she — eats', 'they — eat', 'he — eats'],
    }),
    draft('practice', 'Write one sentence about what you do every day', reason('Short practice')),
    draft('gap', 'He ______ to school every morning', reason('Gap'), {
      choices: ['goes', 'go', 'going', 'went'],
      correctAnswer: 'goes',
    }),
    draft('question', 'Do they play football on Fridays', reason('Question')),
    draft('rewrite', 'Rewrite this as a question: She eats an apple', reason('Rewrite')),
  ]
}

function goingToDrafts(label: string): PracticeDraft[] {
  const reason = (kind: string) => `${kind} for ${label}.`
  return [
    draft('gap', 'I ______ learn to bake bread', reason('Gap'), {
      choices: ['am going to', 'is going to', 'are going to', 'go'],
      correctAnswer: 'am going to',
    }),
    draft('gap', 'They ______ meet their music teacher on Wednesday', reason('Gap'), {
      choices: ['are going to', 'is going to', 'am going to', 'going'],
      correctAnswer: 'are going to',
    }),
    draft('question', 'Are you going to tidy the desk', reason('Question')),
    draft('rewrite', 'Rewrite this with going to: I learn to bake bread', reason('Rewrite')),
    draft('matching', 'Match the subject to going to', reason('Matching'), {
      choices: ['I — am going to', 'she — is going to', 'they — are going to'],
    }),
    draft('practice', 'Write three plans. Begin with First, Then and After that', reason('Short practice')),
    draft('question', 'What are you going to do after school', reason('Question')),
    draft('gap', 'Sara ______ see the dentist on Tuesday at 3 p.m.', reason('Gap'), {
      choices: ['is going to', 'are going to', 'am going to', 'sees'],
      correctAnswer: 'is going to',
    }),
  ]
}

function comparativeDrafts(label: string): PracticeDraft[] {
  const reason = (kind: string) => `${kind} for ${label}.`
  return [
    draft('gap', 'This bicycle is ______ than that scooter', reason('Gap'), {
      choices: ['cheaper', 'cheap', 'cheapest', 'more cheap'],
      correctAnswer: 'cheaper',
    }),
    draft('gap', 'Today is the ______ day of the year so far', reason('Gap'), {
      choices: ['hottest', 'hot', 'hotter', 'more hot'],
      correctAnswer: 'hottest',
    }),
    draft('question', 'Which chair is more comfortable', reason('Question')),
    draft('rewrite', 'Rewrite this with a comparative: The schoolbag is heavy', reason('Rewrite')),
    draft('matching', 'Match the adjective to its comparative', reason('Matching'), {
      choices: ['cheap — cheaper', 'heavy — heavier', 'quiet — quieter', 'hot — hotter'],
    }),
    draft('practice', 'Write one sentence that compares two things', reason('Short practice')),
    draft('gap', 'The blue chair is as ______ as the green chair', reason('Gap'), {
      choices: ['comfortable', 'more comfortable', 'comfortabler', 'most comfortable'],
      correctAnswer: 'comfortable',
    }),
    draft('question', 'Is this puzzle more difficult than the last one', reason('Question')),
  ]
}

function modalDrafts(label: string): PracticeDraft[] {
  const reason = (kind: string) => `${kind} for ${label}.`
  return [
    draft('gap', 'A library sign says no eating. You ______ eat there', reason('Gap'), {
      choices: ['must not', 'do not have to', 'should', 'can'],
      correctAnswer: 'must not',
    }),
    draft('question', 'Should you save a copy of your homework', reason('Question')),
    draft('rewrite', 'Rewrite this with must not: It is forbidden to run beside the pool', reason('Rewrite')),
    draft('matching', 'Match the modal to its meaning', reason('Matching'), {
      choices: ['must not — forbidden', 'do not have to — optional', 'should — advice', 'have to — a rule'],
    }),
    draft('practice', 'Write one school rule with must or must not', reason('Short practice')),
    draft('gap', 'In the lab you ______ wear safety glasses', reason('Gap'), {
      choices: ['must', 'do not have to', 'ought', 'must not'],
      correctAnswer: 'must',
    }),
    draft('question', 'Do you have to buy your own brushes for art club', reason('Question')),
    draft('rewrite', 'Rewrite this with should: It is a good idea to take a break', reason('Rewrite')),
  ]
}

function conditionalDrafts(label: string): PracticeDraft[] {
  const reason = (kind: string) => `${kind} for ${label}.`
  return [
    draft('gap', 'If Leo ______ enough money, he will buy a keyboard', reason('Gap'), {
      choices: ['saves', 'save', 'will save', 'saved'],
      correctAnswer: 'saves',
    }),
    draft('gap', 'Unless Ava ______, she will miss the bus', reason('Gap'), {
      choices: ['hurries', 'hurry', 'will hurry', 'hurried'],
      correctAnswer: 'hurries',
    }),
    draft('question', 'What will Leo buy if he saves enough money', reason('Question')),
    draft('rewrite', 'Rewrite this with unless: If you do not water the plant, it will die', reason('Rewrite')),
    draft('matching', 'Match the word to the result', reason('Matching'), {
      choices: ['if — he will buy it', 'unless — she will miss it'],
    }),
    draft('practice', 'Write one sentence with if', reason('Short practice')),
    draft('question', 'Will you use another computer if this one stops', reason('Question')),
    draft('rewrite', 'Rewrite this with if: You will not use the tablet if you do not charge it', reason('Rewrite')),
  ]
}

export function grammarPracticeDrafts(input: {
  grammar?: string[]
  title?: string
  description?: string
  questions: PracticeSource[]
}): PracticeDraft[] {
  const decided = decideWorksheetGrammar(input)
  switch (decided.family) {
    case 'there-is':
      return thereDrafts(input.questions, decided.label)
    case 'was-were':
      return wasWereDrafts(decided.label)
    case 'present-continuous':
      return continuousDrafts(input.questions, decided.label)
    case 'going-to':
      return goingToDrafts(decided.label)
    case 'comparatives':
      return comparativeDrafts(decided.label)
    case 'modals':
      return modalDrafts(decided.label)
    case 'conditionals':
      return conditionalDrafts(decided.label)
    default:
      return simpleDrafts(input.questions, decided.label)
  }
}

export function worksheetPracticePrompt(input: {
  grammar?: string[]
  title?: string
  description?: string
  questions: PracticeSource[]
}): string {
  const decided = decideWorksheetGrammar(input)
  return `You write a printed grammar worksheet for English learners. It is grammar practice, not a copy of the picture quiz.

Read the unit grammar, the title, and the quiz questions. The structure to practise is ${decided.label}. Use the quiz words and pictures. Do not print the same question again.

Write 8 activities. Mix these kinds, because this structure supports them: gap, question, rewrite, matching, practice.
A gap keeps the missing word as ______.
A question asks something the student can answer.
A rewrite gives a sentence to change.
Matching gives short pairs in choices, such as "was — I, he, she".
Practice asks for one or two sentences of the student's own.

Every sentence starts with a capital letter and ends with a full stop. A question ends with a question mark. Always.

Return only a JSON array of 8 objects:
{"activity":"gap","line":"There ______ a dog.","choices":["is","are","was","were"],"questionId":"optional source id","reason":"short reason"}
choices has at most 4 strings. Omit choices when there is nothing to circle.

Unit grammar: ${(input.grammar ?? []).join(', ') || decided.label}
Title: ${input.title ?? ''}
Description: ${input.description ?? ''}
Questions:
${JSON.stringify(
  input.questions.map((question) => ({
    id: question.id ?? '',
    question: question.question,
    answers: question.answers,
    correctAnswer: question.correctAnswer,
    imageUrl: question.imageUrl ?? null,
  }))
)}`
}

export function finishDraft(draft: PracticeDraft): PracticeDraft {
  return {
    ...draft,
    line: finishWorksheetSentence(draft.line),
    choices: draft.choices.map((choice) => choice.trim()).filter(Boolean).slice(0, 4),
  }
}
