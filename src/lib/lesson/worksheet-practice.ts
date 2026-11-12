import { z } from 'zod'

export const WORKSHEET_ACTIVITIES = ['gap', 'question', 'choice', 'rewrite', 'matching', 'practice'] as const

export const EXERCISE_TITLE = {
  question: 'A. Answer the questions.',
  gap: 'B. Complete the sentences.',
  choice: 'C. Circle the answer.',
} as const

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
  exercise?: string
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
  exercise: z.string().max(80).optional(),
})

export function parseWorksheetPractice(raw: string): z.infer<typeof practiceItemSchema>[] | null {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start < 0 || end <= start) return null
  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1))
    const items = z.array(practiceItemSchema).parse(parsed)
    const count = (activity: WorksheetActivity) => items.filter((item) => item.activity === activity).length
    if (count('question') < 5 || count('question') > 10) return null
    if (count('gap') < 5 || count('gap') > 10) return null
    if (count('choice') < 5 || count('choice') > 10) return null
    const order: Record<string, number> = { question: 0, gap: 1, choice: 2 }
    return items
      .filter((item) => item.activity === 'question' || item.activity === 'gap' || item.activity === 'choice')
      .sort((a, b) => (order[a.activity] ?? 9) - (order[b.activity] ?? 9))
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
    exercise: extra.exercise,
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

function pluralNoun(phrase: string): string {
  const noun = bareNoun(phrase)
  if (!noun) return 'animals'
  if (/s$/i.test(noun) || /^(children|people|sheep|water|milk)$/i.test(noun)) return noun
  return `${noun}s`
}

function capPhrase(phrase: string): string {
  const trimmed = phrase.trim()
  if (!trimmed) return trimmed
  return trimmed[0].toUpperCase() + trimmed.slice(1)
}

function exerciseDraft(
  activity: 'question' | 'gap' | 'choice',
  line: string,
  extra: Partial<PracticeDraft> = {}
): PracticeDraft {
  return draft(activity, line, EXERCISE_TITLE[activity], {
    ...extra,
    exercise: EXERCISE_TITLE[activity],
    sourceQuestion: extra.sourceQuestion ?? EXERCISE_TITLE[activity],
  })
}

function thereExercises(questions: PracticeSource[]): PracticeDraft[] {
  const phrases = questions.map((question) => phraseAfterBlank(question.question)).filter(Boolean)
  const list = phrases.length > 0 ? phrases : ['a giraffe', 'two snakes', 'a bear', 'some water']
  const questionsLines: string[] = []
  for (const phrase of list) {
    if (/^(a|an)\s/i.test(phrase)) {
      questionsLines.push(`Is there ${phrase}`)
      questionsLines.push(`Are there any ${pluralNoun(phrase)}`)
    } else if (/^(some|any)\s/i.test(phrase)) {
      questionsLines.push(`Is there ${phrase}`)
      questionsLines.push(`How much ${bareNoun(phrase)} is there`)
    } else {
      questionsLines.push(`Are there ${phrase}`)
      questionsLines.push(`How many ${pluralNoun(phrase)} are there`)
    }
  }
  questionsLines.push('What is there in the picture', 'What is not in the picture')
  while (questionsLines.length < 10) {
    questionsLines.push(questionsLines[questionsLines.length % questionsLines.length])
  }
  const extras = ['a giraffe', 'two snakes', 'a bear', 'a lion', 'some milk']
  const gapPhrases = [...list]
  for (const extra of extras) {
    if (gapPhrases.length >= 5) break
    if (!gapPhrases.includes(extra)) gapPhrases.push(extra)
  }
  while (gapPhrases.length < 5) gapPhrases.push(list[gapPhrases.length % list.length])
  const labels = [...new Set(list.map(capPhrase))]
  while (labels.length < 4) labels.push(['A giraffe', 'Two snakes', 'A bear', 'Some water'][labels.length] ?? 'A lion')
  const pictured = questions.filter((question) => question.imageUrl)
  const pictures = pictured.length > 0 ? pictured : questions
  return [
    ...questionsLines.slice(0, 10).map((line) => exerciseDraft('question', line)),
    ...Array.from({ length: 5 }, (_, index) => {
      const phrase = gapPhrases[index % gapPhrases.length]
      const correct = /^(a|an|some|any)\s/i.test(phrase) ? 'is' : 'are'
      return exerciseDraft('gap', `There ______ ${phrase}`, {
        choices: ['is', 'are', 'was', 'were'],
        correctAnswer: correct,
      })
    }),
    ...Array.from({ length: 5 }, (_, index) => {
      const source = pictures[index % Math.max(pictures.length, 1)]
      const phrase = phraseAfterBlank(source?.question ?? '') || list[index % list.length]
      const correct = capPhrase(phrase)
      const choices = [correct, ...labels.filter((label) => label !== correct)].slice(0, 4)
      return exerciseDraft('choice', 'What is there in this picture', {
        choices,
        correctAnswer: correct,
        imageUrl: source?.imageUrl,
        questionId: source?.id,
        sourceQuestion: source?.question ?? correct,
      })
    }),
  ]
}

function bankExercises(
  familyQuestions: string[],
  familyGaps: Array<{ line: string; correct: string; choices: string[] }>,
  familyChoices: Array<{ line: string; choices: string[]; correct: string }>,
  questions: PracticeSource[]
): PracticeDraft[] {
  return [
    ...familyQuestions.slice(0, 10).map((line) => exerciseDraft('question', line)),
    ...familyGaps.slice(0, 5).map((gap) =>
      exerciseDraft('gap', gap.line, { choices: gap.choices, correctAnswer: gap.correct })
    ),
    ...familyChoices.slice(0, 5).map((item, index) => {
      const pictured = questions.filter((question) => question.imageUrl)
      const source = pictured[index % Math.max(pictured.length, 1)]
      return exerciseDraft('choice', item.line, {
        choices: item.choices,
        correctAnswer: item.correct,
        imageUrl: source?.imageUrl,
        questionId: source?.id,
        sourceQuestion: source?.question ?? item.line,
      })
    }),
  ]
}

function exercisesFor(family: Family, questions: PracticeSource[]): PracticeDraft[] {
  if (family === 'there-is') return thereExercises(questions)
  if (family === 'was-were') {
    return bankExercises(
      [
        'Were they at the hospital',
        'Was she at home',
        'Was it a good film',
        'Were you at school this morning',
        'Was he in Brazil last summer',
        'Were we late for school',
        'Was there a good film on TV',
        'Were the children quiet',
        'Was Jane late for school',
        'Were they tired on Friday',
      ],
      [
        { line: 'They ______ at the hospital three days ago', correct: 'were', choices: ['were', 'was', 'are', 'is'] },
        { line: 'She ______ at home for dinner last Wednesday', correct: 'was', choices: ['was', 'were', 'is', 'are'] },
        { line: 'We ______ in Brazil last summer', correct: 'were', choices: ['were', 'was', 'are', 'is'] },
        { line: 'I ______ happy when I heard the news', correct: 'was', choices: ['was', 'were', 'am', 'are'] },
        { line: 'There ______ a good film on TV yesterday', correct: 'was', choices: ['was', 'were', 'is', 'are'] },
      ],
      [
        { line: 'Which sentence is correct', choices: ['They were at the park.', 'They was at the park.', 'She were at home.', 'He were happy.'], correct: 'They were at the park.' },
        { line: 'Which sentence is correct', choices: ['She was at home.', 'She were at home.', 'They was at home.', 'I were at home.'], correct: 'She was at home.' },
        { line: 'Which sentence is correct', choices: ['We were at school.', 'We was at school.', 'She were at school.', 'He were at school.'], correct: 'We were at school.' },
        { line: 'Which sentence is correct', choices: ['He was tired.', 'He were tired.', 'They was tired.', 'I were tired.'], correct: 'He was tired.' },
        { line: 'Which sentence is correct', choices: ['There was a dog.', 'There were a dog.', 'There was two dogs.', 'There is a dog yesterday.'], correct: 'There was a dog.' },
      ],
      questions
    )
  }
  if (family === 'present-continuous') {
    const scenes = continuousScenes(questions)
    const questionsLines = scenes.flatMap((scene) => {
      const ask = scene.auxiliary === 'are' ? 'Are' : scene.auxiliary === 'am' ? 'Am' : 'Is'
      return [
        `${ask} ${scene.subject} ${scene.verb} ${scene.rest}`,
        `What ${scene.auxiliary === 'are' ? 'are' : 'is'} ${scene.subject} doing`,
      ]
    })
    while (questionsLines.length < 10) questionsLines.push(questionsLines[questionsLines.length % Math.max(questionsLines.length, 1)] ?? 'What is she doing')
    return [
      ...questionsLines.slice(0, 10).map((line) => exerciseDraft('question', line)),
      ...Array.from({ length: 5 }, (_, index) => {
        const scene = scenes[index % scenes.length]
        return exerciseDraft('gap', `${scene.subject} ${scene.auxiliary} ______ ${scene.rest}`, {
          choices: scene.choices.length > 0 ? scene.choices : [scene.verb, 'go', 'goes', 'went'],
          correctAnswer: scene.verb,
          sourceQuestion: scene.sourceQuestion,
        })
      }),
      ...Array.from({ length: 5 }, (_, index) => {
        const scene = scenes[index % scenes.length]
        const correct = `${scene.subject} is ${scene.verb} ${scene.rest}`.replace(/^./, (letter) => letter.toUpperCase())
        return exerciseDraft('choice', 'Which sentence is correct', {
          choices: [correct, `${capPhrase(scene.subject)} ${scene.verb} ${scene.rest}.`, `Is ${scene.subject} ${scene.verb}?`, `${capPhrase(scene.subject)} go ${scene.rest}.`],
          correctAnswer: correct,
          imageUrl: scene.imageUrl,
          questionId: scene.id,
          sourceQuestion: scene.sourceQuestion,
        })
      }),
    ]
  }
  const fallback: Record<Exclude<Family, 'there-is' | 'was-were' | 'present-continuous'>, { questions: string[]; gaps: Array<{ line: string; correct: string; choices: string[] }>; choices: Array<{ line: string; choices: string[]; correct: string }> }> = {
    'present-simple': {
      questions: ['Does she eat an apple every day', 'Do they play football on Fridays', 'Does he go to school every morning', 'What does she eat', 'Where do they play', 'Does he walk to school', 'Do you eat fruit every day', 'What do they do on Fridays', 'Does she like apples', 'Who eats an apple every day'],
      gaps: [
        { line: 'She ______ an apple every day', correct: 'eats', choices: ['eats', 'eat', 'eating', 'ate'] },
        { line: 'He ______ to school every morning', correct: 'goes', choices: ['goes', 'go', 'going', 'went'] },
        { line: 'They ______ football on Fridays', correct: 'play', choices: ['play', 'plays', 'playing', 'played'] },
        { line: 'I ______ fruit every day', correct: 'eat', choices: ['eat', 'eats', 'eating', 'ate'] },
        { line: 'The dog ______ in the park', correct: 'runs', choices: ['runs', 'run', 'running', 'ran'] },
      ],
      choices: [
        { line: 'Which sentence is correct', choices: ['She eats an apple.', 'She eat an apple.', 'She eating an apple.', 'She ate an apple every day.'], correct: 'She eats an apple.' },
        { line: 'Which sentence is correct', choices: ['He goes to school.', 'He go to school.', 'He going to school.', 'He gone to school.'], correct: 'He goes to school.' },
        { line: 'Which sentence is correct', choices: ['They play football.', 'They plays football.', 'They playing football.', 'They played every day now.'], correct: 'They play football.' },
        { line: 'Which sentence is correct', choices: ['I eat fruit.', 'I eats fruit.', 'I eating fruit.', 'I eaten fruit.'], correct: 'I eat fruit.' },
        { line: 'Which sentence is correct', choices: ['The dog runs.', 'The dog run.', 'The dog running.', 'The dog runned.'], correct: 'The dog runs.' },
      ],
    },
    'going-to': {
      questions: ['Are you going to tidy the desk', 'What are you going to do after school', 'Is Sara going to see the dentist', 'Are they going to meet the teacher', 'Am I going to learn to bake', 'Who is going to tidy the desk', 'When are they going to meet', 'Is he going to practise the guitar', 'Are we going to finish the poster', 'What is she going to bake'],
      gaps: [
        { line: 'I ______ learn to bake bread', correct: 'am going to', choices: ['am going to', 'is going to', 'are going to', 'go'] },
        { line: 'They ______ meet their teacher on Wednesday', correct: 'are going to', choices: ['are going to', 'is going to', 'am going to', 'going'] },
        { line: 'Sara ______ see the dentist on Tuesday', correct: 'is going to', choices: ['is going to', 'are going to', 'am going to', 'sees'] },
        { line: 'We ______ finish the poster first', correct: 'are going to', choices: ['are going to', 'is going to', 'am going to', 'finish'] },
        { line: 'He ______ practise the guitar after that', correct: 'is going to', choices: ['is going to', 'are going to', 'am going to', 'practise'] },
      ],
      choices: [
        { line: 'Which sentence is correct', choices: ['She is going to read.', 'She are going to read.', 'She going to read.', 'She go to read.'], correct: 'She is going to read.' },
        { line: 'Which sentence is correct', choices: ['They are going to play.', 'They is going to play.', 'They going to play.', 'They plays tomorrow.'], correct: 'They are going to play.' },
        { line: 'Which sentence is correct', choices: ['I am going to cook.', 'I is going to cook.', 'I are going to cook.', 'I going to cook.'], correct: 'I am going to cook.' },
        { line: 'Which sentence is correct', choices: ['He is going to ride.', 'He are going to ride.', 'He going to ride.', 'He ride tomorrow.'], correct: 'He is going to ride.' },
        { line: 'Which sentence is correct', choices: ['We are going to swim.', 'We is going to swim.', 'We going to swim.', 'We swims tomorrow.'], correct: 'We are going to swim.' },
      ],
    },
    comparatives: {
      questions: ['Which bicycle is cheaper', 'Is the schoolbag heavier', 'Which room is the quietest', 'Is this puzzle more difficult', 'Which day is the hottest', 'Is the blue chair as comfortable as the green chair', 'Which bag is heavier', 'Is the scooter cheaper than the bicycle', 'Which chair is more comfortable', 'Is today hotter than yesterday'],
      gaps: [
        { line: 'This bicycle is ______ than that scooter', correct: 'cheaper', choices: ['cheaper', 'cheap', 'cheapest', 'more cheap'] },
        { line: 'My schoolbag is ______ than my old one', correct: 'heavier', choices: ['heavier', 'heavy', 'heaviest', 'more heavy'] },
        { line: 'Today is the ______ day of the year', correct: 'hottest', choices: ['hottest', 'hot', 'hotter', 'more hot'] },
        { line: 'This puzzle is ______ than the last one', correct: 'more difficult', choices: ['more difficult', 'difficulter', 'difficult', 'most difficult'] },
        { line: 'The blue chair is as ______ as the green chair', correct: 'comfortable', choices: ['comfortable', 'more comfortable', 'comfortabler', 'most comfortable'] },
      ],
      choices: [
        { line: 'Which sentence is correct', choices: ['The bicycle is cheaper.', 'The bicycle is cheap than the scooter.', 'The bicycle is cheapest than the scooter.', 'The bicycle is more cheap.'], correct: 'The bicycle is cheaper.' },
        { line: 'Which sentence is correct', choices: ['The bag is heavier.', 'The bag is heavy than the old one.', 'The bag is heaviest than the old one.', 'The bag is more heavy.'], correct: 'The bag is heavier.' },
        { line: 'Which sentence is correct', choices: ['Today is the hottest day.', 'Today is the hotter day.', 'Today is hottest than yesterday.', 'Today is more hot day.'], correct: 'Today is the hottest day.' },
        { line: 'Which sentence is correct', choices: ['This puzzle is more difficult.', 'This puzzle is difficulter.', 'This puzzle is difficult than that.', 'This puzzle is most difficult than that.'], correct: 'This puzzle is more difficult.' },
        { line: 'Which sentence is correct', choices: ['The chair is as comfortable as that one.', 'The chair is as comfortabler as that one.', 'The chair is as more comfortable.', 'The chair is comfortable than as that one.'], correct: 'The chair is as comfortable as that one.' },
      ],
    },
    modals: {
      questions: ['Must you eat in the library', 'Should you save a copy of your homework', 'Do you have to buy your own brushes', 'Must you wear safety glasses', 'Should you take a break', 'Do you have to bring paper to art club', 'What must you not do beside the pool', 'Should you check the bike brakes', 'Must pupils wear their ID cards', 'Do you have to eat in the library'],
      gaps: [
        { line: 'You ______ eat in the library', correct: 'must not', choices: ['must not', 'do not have to', 'should', 'can'] },
        { line: 'In the lab you ______ wear safety glasses', correct: 'must', choices: ['must', 'do not have to', 'ought', 'must not'] },
        { line: 'You look tired. You ______ take a break', correct: 'should', choices: ['should', 'must not', 'do not have to', 'ought'] },
        { line: 'The art club lends brushes. You ______ buy your own', correct: 'do not have to', choices: ['do not have to', 'must not', 'must', 'should not'] },
        { line: 'Pupils ______ wear their ID cards', correct: 'have to', choices: ['have to', 'must not', 'do not have to', 'ought'] },
      ],
      choices: [
        { line: 'Which sentence is correct', choices: ['You must not run.', 'You do not have to run here.', 'You should run beside the pool.', 'You must run here.'], correct: 'You must not run.' },
        { line: 'Which sentence is correct', choices: ['You must wear glasses.', 'You must not wear glasses in the lab.', 'You do not have to see in the lab.', 'You should not wear glasses.'], correct: 'You must wear glasses.' },
        { line: 'Which sentence is correct', choices: ['You should take a break.', 'You must not take a break.', 'You do not have to be tired.', 'You must be tired.'], correct: 'You should take a break.' },
        { line: 'Which sentence is correct', choices: ['You do not have to buy brushes.', 'You must not use brushes.', 'You must buy brushes.', 'You should not paint.'], correct: 'You do not have to buy brushes.' },
        { line: 'Which sentence is correct', choices: ['Pupils have to wear ID cards.', 'Pupils must not wear ID cards.', 'Pupils do not have to come to school.', 'Pupils should lose their cards.'], correct: 'Pupils have to wear ID cards.' },
      ],
    },
    conditionals: {
      questions: ['What will Leo buy if he saves enough money', 'Will you use another computer if this one stops', 'What will happen if you do not charge the tablet', 'Will Ava miss the bus if she does not hurry', 'What will happen if you do not water the plant', 'Will he buy a keyboard if he saves money', 'What will you do if the computer stops', 'Will the plant die if you do not water it', 'What happens unless Ava hurries', 'Will you use the tablet if you charge it'],
      gaps: [
        { line: 'If Leo ______ enough money, he will buy a keyboard', correct: 'saves', choices: ['saves', 'save', 'will save', 'saved'] },
        { line: 'Unless Ava ______, she will miss the bus', correct: 'hurries', choices: ['hurries', 'hurry', 'will hurry', 'hurried'] },
        { line: 'If you ______ the tablet, you will not be able to use it', correct: 'do not charge', choices: ['do not charge', 'charges', 'will charge', 'charging'] },
        { line: 'We ______ another computer if this one stops', correct: 'will use', choices: ['will use', 'use', 'uses', 'using'] },
        { line: 'If you do not water the plant, it ______', correct: 'will die', choices: ['will die', 'dies', 'die', 'dying'] },
      ],
      choices: [
        { line: 'Which sentence is correct', choices: ['If he saves money, he will buy it.', 'If he will save money, he buys it.', 'If he saves money, he buy it.', 'Unless he saves money, he will buy it.'], correct: 'If he saves money, he will buy it.' },
        { line: 'Which sentence is correct', choices: ['Unless she hurries, she will miss the bus.', 'Unless she will hurry, she misses the bus.', 'If she hurries, she will miss the bus.', 'Unless she hurry, she misses.'], correct: 'Unless she hurries, she will miss the bus.' },
        { line: 'Which sentence is correct', choices: ['If you charge it, you can use it.', 'If you will charge it, you use it.', 'Unless you charge it, you can use it.', 'If you charging it, you use it.'], correct: 'If you charge it, you can use it.' },
        { line: 'Which sentence is correct', choices: ['We will use another computer if this one stops.', 'We use another computer if this one will stop.', 'If this one stops, we using another.', 'Unless this one stops, we will not have a computer ever.'], correct: 'We will use another computer if this one stops.' },
        { line: 'Which sentence is correct', choices: ['If you do not water it, it will die.', 'If you will not water it, it dies.', 'Unless you water it, it will grow.', 'If you not water it, it die.'], correct: 'If you do not water it, it will die.' },
      ],
    },
  }
  const bank = fallback[family]
  return bankExercises(bank.questions, bank.gaps, bank.choices, questions)
}

export function grammarPracticeDrafts(input: {
  grammar?: string[]
  title?: string
  description?: string
  questions: PracticeSource[]
}): PracticeDraft[] {
  const decided = decideWorksheetGrammar(input)
  return exercisesFor(decided.family, input.questions)
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

Break the worksheet into three exercises. Each exercise is one activity, with 5 to 10 items.
1. activity "question": 10 questions. No choices. The student writes the answer on a blank line.
2. activity "gap": 5 sentences with the missing word written as ______.
3. activity "choice": 5 multiple-choice questions. Each has 2 to 4 choices and a questionId for its picture.

Every sentence starts with a capital letter and ends with a full stop. A question ends with a question mark. Always.

Return only a JSON array of those 20 objects, questions first, then gaps, then choices:
{"activity":"question","line":"Are there any dogs?","exercise":"A. Answer the questions."}
{"activity":"gap","line":"There ______ a dog.","choices":["is","are"],"exercise":"B. Complete the sentences."}
{"activity":"choice","line":"Which sentence is correct?","choices":["There is a dog.","There are a dog."],"exercise":"C. Circle the answer."}

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
