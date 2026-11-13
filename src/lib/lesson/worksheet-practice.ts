export const WORKSHEET_ACTIVITIES = ['gap', 'question', 'choice', 'rewrite', 'circle', 'matching', 'practice'] as const

/** Easiest first. Letters are assigned again once the page knows which sections it has. */
export const EXERCISE_TITLE = {
  choice: 'A. Look and circle the answer.',
  gap: 'B. Complete the sentences.',
  circle: 'B. Circle the correct word.',
  rewrite: 'C. Write the sentences.',
  question: 'C. Answer the questions.',
} as const

export const EXERCISE_ORDER: Record<string, number> = { choice: 0, gap: 1, circle: 2, rewrite: 3, question: 3 }

const SECTION_NAME: Record<string, string> = {
  choice: 'Look and circle the answer.',
  gap: 'Complete the sentences.',
  circle: 'Circle the correct word.',
  rewrite: 'Write the sentences.',
  question: 'Answer the questions.',
}

/** A, B, C from the sections that are actually on the page. */
export function labelWorksheetSections<T extends { activity: string; exercise?: string }>(items: T[]): T[] {
  const letters = ['A', 'B', 'C', 'D']
  const title = new Map<string, string>()
  for (const item of items) {
    if (title.has(item.activity) || !(item.activity in SECTION_NAME)) continue
    title.set(item.activity, `${letters[title.size] ?? 'D'}. ${SECTION_NAME[item.activity]}`)
  }
  return items.map((item) => ({ ...item, exercise: title.get(item.activity) ?? item.exercise }))
}

/**
 * Scaffolding follows the Cambridge young learner bands. Starters and Movers
 * get the exact words in a box and mixed-up sentences. Flyers get base forms
 * to change. B1 gets the base form beside the gap and no box.
 */
export type WordBank = 'exact' | 'base' | 'none'

export function worksheetScaffold(level: string | undefined): {
  bank: WordBank
  sentences: 'jumbled' | 'cues'
} {
  if (level === 'A2') return { bank: 'base', sentences: 'cues' }
  if (level === 'B1') return { bank: 'none', sentences: 'cues' }
  return { bank: 'exact', sentences: 'jumbled' }
}

export function exerciseInstruction(activity: string, scaffold = worksheetScaffold(undefined)): string {
  if (activity === 'choice') return 'Look at the picture and read the question.'
  if (activity === 'gap') {
    if (scaffold.bank === 'exact') return 'Choose a word from the box and write it on the line.'
    if (scaffold.bank === 'base') return 'Use a word from the box. Change it to the correct form.'
    return 'Write the word in brackets in the correct form.'
  }
  if (activity === 'rewrite') {
    return scaffold.sentences === 'jumbled'
      ? 'Put the words in order to make a sentence. The first one is an example.'
      : 'Use the words to write a full sentence. The first one is an example.'
  }
  if (activity === 'circle') return 'Circle the correct word. The first one is an example.'
  if (activity === 'question') return 'Write the answer on the line.'
  return ''
}

/**
 * Picture questions stay with the quiz, because the teacher already chose the
 * photo. A sheet with no photos uses a word box, circling the word, and sentences.
 */
export function suggestWorksheetSections(
  pictureCount: number,
  grammar: string[] = []
): Array<'choice' | 'gap' | 'circle' | 'rewrite'> {
  const text = grammar.join(' ')
  if (pictureCount > 0) return ['choice', 'gap', 'rewrite']
  if (/comparative|superlative|adjective/i.test(text)) return ['gap', 'rewrite']
  return ['gap', 'circle', 'rewrite']
}

/**
 * One printed A4 page, in millimetres. The row sizes match the print stylesheet:
 * a write-in or gap line is 5.54mm, a picture choice is 14.8mm, and the gap
 * between rows is 1.3mm. Chrome around the three exercises and the word bank
 * box were measured in print.
 */
const WORKSHEET_PAGE_MM = 277
const WORKSHEET_PAGE_SAFETY_MM = 2
const WORKSHEET_CHROME_MM = 54.4
const WORKSHEET_BANK_MM = 8.42
const WORKSHEET_ROW_MM = { sentence: 5.54, gap: 5.54, choice: 14.8 } as const
const WORKSHEET_ROW_GAP_MM = 1.3

function exerciseBlockMm(count: number, rowMm: number): number {
  if (count <= 0) return 0
  return count * rowMm + (count - 1) * WORKSHEET_ROW_GAP_MM
}

export interface WorksheetPlan {
  choices: number
  gaps: number
  circles: number
  sentences: number
}

export function worksheetSheetMm(counts: WorksheetPlan, wordBank = true): number {
  return (
    WORKSHEET_CHROME_MM +
    (wordBank && counts.gaps > 0 ? WORKSHEET_BANK_MM : 0) +
    exerciseBlockMm(counts.choices, WORKSHEET_ROW_MM.choice) +
    exerciseBlockMm(counts.gaps, WORKSHEET_ROW_MM.gap) +
    exerciseBlockMm(counts.circles, WORKSHEET_ROW_MM.gap) +
    exerciseBlockMm(counts.sentences, WORKSHEET_ROW_MM.sentence)
  )
}

export interface WorksheetLayoutOptions {
  /** Quiz photos the teacher already matched. Zero on a sheet with no pictures. */
  choices?: number
  gap?: boolean
  circle?: boolean
  rewrite?: boolean
}

/**
 * With no options, six picture rows and eight gaps stay fixed and the sentence
 * exercise takes the rest. With options, each requested section gets as many
 * rows as still fit on the page.
 */
export function planWorksheetLayout(
  level?: string,
  options?: WorksheetLayoutOptions
): WorksheetPlan & { heightMm: number } {
  const wordBank = worksheetScaffold(level).bank !== 'none'
  const budget = WORKSHEET_PAGE_MM - WORKSHEET_PAGE_SAFETY_MM
  if (!options) {
    for (const gaps of [8, 7, 6, 5]) {
      for (let sentences = 10; sentences >= 5; sentences -= 1) {
        const counts = { choices: 6, gaps, circles: 0, sentences }
        const heightMm = worksheetSheetMm(counts, wordBank)
        if (heightMm <= budget) return { ...counts, heightMm }
      }
    }
    const counts = { choices: 6, gaps: 5, circles: 0, sentences: 5 }
    return { ...counts, heightMm: worksheetSheetMm(counts, wordBank) }
  }
  const choices = Math.min(6, Math.max(0, options.choices ?? 0))
  const gapChoices = options.gap === false ? [0] : [8, 7, 6, 5, 4]
  const circleChoices = options.circle ? [6, 5, 4] : [0]
  const sentenceChoices = options.rewrite === false ? [0] : [10, 9, 8, 7, 6, 5, 4]
  let best = { choices, gaps: gapChoices[gapChoices.length - 1], circles: 0, sentences: 0, heightMm: 0 }
  for (const gaps of gapChoices) {
    for (const circles of circleChoices) {
      for (const sentences of sentenceChoices) {
        const counts = { choices, gaps, circles, sentences }
        const heightMm = worksheetSheetMm(counts, wordBank && gaps > 0)
        const rows = gaps + circles + sentences
        const bestRows = best.gaps + best.circles + best.sentences
        if (heightMm <= budget && rows >= bestRows) best = { ...counts, heightMm }
      }
    }
  }
  if (best.heightMm === 0) best.heightMm = worksheetSheetMm(best, wordBank && best.gaps > 0)
  return best
}

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
  instruction?: string
  /** The word this gap puts in the word bank: the answer, or its base form. */
  bank?: string
  /** The first row of a section, with the answer shown. */
  example?: boolean
  /** Set when the student-style check disagreed with the answer key. */
  warning?: string
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
  if (trimmed.includes(' / ')) return trimmed
  const end = trimmed.match(/[.?!]+$/)?.[0] ?? ''
  const core = (end ? trimmed.slice(0, -end.length) : trimmed).trim()
  if (!core) return trimmed
  const body = /^[a-z]/.test(core) ? core[0].toUpperCase() + core.slice(1) : core
  if (/^(Do not|Don't|Does not|Doesn't)\b/.test(body)) return `${body}.`
  const question = end.includes('?') || QUESTION_START.test(body)
  return question ? `${body}?` : `${body}.`
}

/** A short choice keeps its capital and no full stop. A long choice is a sentence. */
export function finishChoiceLabel(raw: string): string {
  const trimmed = raw.replace(/[ \t]{2,}/g, ' ').trim()
  if (!trimmed) return ''
  if (trimmed.split(/\s+/).length > 5 || /[.?!]$/.test(trimmed)) return finishWorksheetSentence(trimmed)
  return /^[a-z]/.test(trimmed) ? trimmed[0].toUpperCase() + trimmed.slice(1) : trimmed
}

export function isWorksheetActivity(value: string | undefined): value is WorksheetActivity {
  return WORKSHEET_ACTIVITIES.some((activity) => activity === value)
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
  const plan = planWorksheetLayout()
  questionsLines.push('What is there in the picture', 'What is not in the picture')
  while (questionsLines.length < plan.sentences) {
    questionsLines.push(questionsLines[questionsLines.length % questionsLines.length])
  }
  const extras = ['a giraffe', 'two snakes', 'a bear', 'a lion', 'some milk', 'a cat']
  const gapPhrases = [...list]
  for (const extra of extras) {
    if (gapPhrases.length >= plan.gaps) break
    if (!gapPhrases.includes(extra)) gapPhrases.push(extra)
  }
  while (gapPhrases.length < plan.gaps) gapPhrases.push(list[gapPhrases.length % list.length])
  const labels = [...new Set(list.map(capPhrase))]
  while (labels.length < 4) labels.push(['A giraffe', 'Two snakes', 'A bear', 'Some water'][labels.length] ?? 'A lion')
  const pictured = questions.filter((question) => question.imageUrl)
  const pictures = pictured.length > 0 ? pictured : questions
  return [
    ...questionsLines.slice(0, plan.sentences).map((line) => exerciseDraft('question', line)),
    ...Array.from({ length: plan.gaps }, (_, index) => {
      const phrase = gapPhrases[index % gapPhrases.length]
      const correct = /^(a|an|some|any)\s/i.test(phrase) ? 'is' : 'are'
      return exerciseDraft('gap', `There ______ ${phrase}`, {
        choices: ['is', 'are', 'was', 'were'],
        correctAnswer: correct,
      })
    }),
    ...Array.from({ length: plan.choices }, (_, index) => {
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
  const plan = planWorksheetLayout()
  const take = <T,>(items: T[], count: number): T[] =>
    Array.from({ length: count }, (_, index) => items[index % items.length])
  return [
    ...take(familyQuestions, plan.sentences).map((line) => exerciseDraft('question', line)),
    ...take(familyGaps, plan.gaps).map((gap) =>
      exerciseDraft('gap', gap.line, { choices: gap.choices, correctAnswer: gap.correct })
    ),
    ...take(familyChoices, plan.choices).map((item, index) => {
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
        { line: 'The children ______ quiet in the library', correct: 'were', choices: ['were', 'was', 'are', 'is'] },
        { line: 'Jane ______ late for school yesterday', correct: 'was', choices: ['was', 'were', 'is', 'are'] },
        { line: 'You ______ tired after the match', correct: 'were', choices: ['were', 'was', 'are', 'is'] },
      ],
      [
        { line: 'Which sentence is correct', choices: ['They were at the park.', 'They was at the park.', 'She were at home.', 'He were happy.'], correct: 'They were at the park.' },
        { line: 'Which sentence is correct', choices: ['She was at home.', 'She were at home.', 'They was at home.', 'I were at home.'], correct: 'She was at home.' },
        { line: 'Which sentence is correct', choices: ['We were at school.', 'We was at school.', 'She were at school.', 'He were at school.'], correct: 'We were at school.' },
        { line: 'Which sentence is correct', choices: ['He was tired.', 'He were tired.', 'They was tired.', 'I were tired.'], correct: 'He was tired.' },
        { line: 'Which sentence is correct', choices: ['There was a dog.', 'There were a dog.', 'There was two dogs.', 'There is a dog yesterday.'], correct: 'There was a dog.' },
        { line: 'Which sentence is correct', choices: ['I was happy.', 'I were happy.', 'They was happy.', 'She were happy.'], correct: 'I was happy.' },
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
    const plan = planWorksheetLayout()
    while (questionsLines.length < plan.sentences) questionsLines.push(questionsLines[questionsLines.length % Math.max(questionsLines.length, 1)] ?? 'What is she doing')
    return [
      ...questionsLines.slice(0, plan.sentences).map((line) => exerciseDraft('question', line)),
      ...Array.from({ length: plan.gaps }, (_, index) => {
        const scene = scenes[index % scenes.length]
        return exerciseDraft('gap', `${scene.subject} ${scene.auxiliary} ______ ${scene.rest}`, {
          choices: scene.choices.length > 0 ? scene.choices : [scene.verb, 'go', 'goes', 'went'],
          correctAnswer: scene.verb,
          sourceQuestion: scene.sourceQuestion,
        })
      }),
      ...Array.from({ length: plan.choices }, (_, index) => {
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
        { line: 'She ______ her homework after school', correct: 'does', choices: ['does', 'do', 'doing', 'did'] },
        { line: 'We ______ English on Mondays', correct: 'study', choices: ['study', 'studies', 'studying', 'studied'] },
        { line: 'The cat ______ milk every morning', correct: 'drinks', choices: ['drinks', 'drink', 'drinking', 'drank'] },
      ],
      choices: [
        { line: 'Which sentence is correct', choices: ['She eats an apple.', 'She eat an apple.', 'She eating an apple.', 'She ate an apple every day.'], correct: 'She eats an apple.' },
        { line: 'Which sentence is correct', choices: ['He goes to school.', 'He go to school.', 'He going to school.', 'He gone to school.'], correct: 'He goes to school.' },
        { line: 'Which sentence is correct', choices: ['They play football.', 'They plays football.', 'They playing football.', 'They played every day now.'], correct: 'They play football.' },
        { line: 'Which sentence is correct', choices: ['I eat fruit.', 'I eats fruit.', 'I eating fruit.', 'I eaten fruit.'], correct: 'I eat fruit.' },
        { line: 'Which sentence is correct', choices: ['The dog runs.', 'The dog run.', 'The dog running.', 'The dog runned.'], correct: 'The dog runs.' },
        { line: 'Which sentence is correct', choices: ['She does her homework.', 'She do her homework.', 'She doing her homework.', 'She did her homework every day now.'], correct: 'She does her homework.' },
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
        { line: 'You ______ tidy your desk after dinner', correct: 'are going to', choices: ['are going to', 'is going to', 'am going to', 'tidy'] },
        { line: 'She ______ bake a cake on Saturday', correct: 'is going to', choices: ['is going to', 'are going to', 'am going to', 'bakes'] },
        { line: 'They ______ play football after school', correct: 'are going to', choices: ['are going to', 'is going to', 'am going to', 'play'] },
      ],
      choices: [
        { line: 'Which sentence is correct', choices: ['She is going to read.', 'She are going to read.', 'She going to read.', 'She go to read.'], correct: 'She is going to read.' },
        { line: 'Which sentence is correct', choices: ['They are going to play.', 'They is going to play.', 'They going to play.', 'They plays tomorrow.'], correct: 'They are going to play.' },
        { line: 'Which sentence is correct', choices: ['I am going to cook.', 'I is going to cook.', 'I are going to cook.', 'I going to cook.'], correct: 'I am going to cook.' },
        { line: 'Which sentence is correct', choices: ['He is going to ride.', 'He are going to ride.', 'He going to ride.', 'He ride tomorrow.'], correct: 'He is going to ride.' },
        { line: 'Which sentence is correct', choices: ['We are going to swim.', 'We is going to swim.', 'We going to swim.', 'We swims tomorrow.'], correct: 'We are going to swim.' },
        { line: 'Which sentence is correct', choices: ['You are going to tidy.', 'You is going to tidy.', 'You going to tidy.', 'You am going to tidy.'], correct: 'You are going to tidy.' },
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
        { line: 'The scooter is ______ than the bicycle', correct: 'faster', choices: ['faster', 'fast', 'fastest', 'more fast'] },
        { line: 'This room is the ______ room in the house', correct: 'quietest', choices: ['quietest', 'quiet', 'quieter', 'more quiet'] },
        { line: 'Her bag is ______ than his bag', correct: 'bigger', choices: ['bigger', 'big', 'biggest', 'more big'] },
      ],
      choices: [
        { line: 'Which sentence is correct', choices: ['The bicycle is cheaper.', 'The bicycle is cheap than the scooter.', 'The bicycle is cheapest than the scooter.', 'The bicycle is more cheap.'], correct: 'The bicycle is cheaper.' },
        { line: 'Which sentence is correct', choices: ['The bag is heavier.', 'The bag is heavy than the old one.', 'The bag is heaviest than the old one.', 'The bag is more heavy.'], correct: 'The bag is heavier.' },
        { line: 'Which sentence is correct', choices: ['Today is the hottest day.', 'Today is the hotter day.', 'Today is hottest than yesterday.', 'Today is more hot day.'], correct: 'Today is the hottest day.' },
        { line: 'Which sentence is correct', choices: ['This puzzle is more difficult.', 'This puzzle is difficulter.', 'This puzzle is difficult than that.', 'This puzzle is most difficult than that.'], correct: 'This puzzle is more difficult.' },
        { line: 'Which sentence is correct', choices: ['The chair is as comfortable as that one.', 'The chair is as comfortabler as that one.', 'The chair is as more comfortable.', 'The chair is comfortable than as that one.'], correct: 'The chair is as comfortable as that one.' },
        { line: 'Which sentence is correct', choices: ['The scooter is faster.', 'The scooter is fast than the bicycle.', 'The scooter is fastest than the bicycle.', 'The scooter is more fast.'], correct: 'The scooter is faster.' },
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
        { line: 'You ______ check the bike brakes', correct: 'should', choices: ['should', 'must not', 'do not have to', 'ought'] },
        { line: 'Pupils ______ run beside the pool', correct: 'must not', choices: ['must not', 'should', 'do not have to', 'can'] },
        { line: 'You ______ bring paper to art club', correct: 'do not have to', choices: ['do not have to', 'must not', 'must', 'should not'] },
      ],
      choices: [
        { line: 'Which sentence is correct', choices: ['You must not run.', 'You do not have to run here.', 'You should run beside the pool.', 'You must run here.'], correct: 'You must not run.' },
        { line: 'Which sentence is correct', choices: ['You must wear glasses.', 'You must not wear glasses in the lab.', 'You do not have to see in the lab.', 'You should not wear glasses.'], correct: 'You must wear glasses.' },
        { line: 'Which sentence is correct', choices: ['You should take a break.', 'You must not take a break.', 'You do not have to be tired.', 'You must be tired.'], correct: 'You should take a break.' },
        { line: 'Which sentence is correct', choices: ['You do not have to buy brushes.', 'You must not use brushes.', 'You must buy brushes.', 'You should not paint.'], correct: 'You do not have to buy brushes.' },
        { line: 'Which sentence is correct', choices: ['Pupils have to wear ID cards.', 'Pupils must not wear ID cards.', 'Pupils do not have to come to school.', 'Pupils should lose their cards.'], correct: 'Pupils have to wear ID cards.' },
        { line: 'Which sentence is correct', choices: ['You should check the brakes.', 'You must not check the brakes.', 'You do not have to stop.', 'You should ignore the brakes.'], correct: 'You should check the brakes.' },
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
        { line: 'If she ______, she will catch the bus', correct: 'hurries', choices: ['hurries', 'hurry', 'will hurry', 'hurried'] },
        { line: 'He ______ a keyboard if he saves enough money', correct: 'will buy', choices: ['will buy', 'buys', 'buy', 'buying'] },
        { line: 'If the computer ______, we will use another one', correct: 'stops', choices: ['stops', 'stop', 'will stop', 'stopping'] },
      ],
      choices: [
        { line: 'Which sentence is correct', choices: ['If he saves money, he will buy it.', 'If he will save money, he buys it.', 'If he saves money, he buy it.', 'Unless he saves money, he will buy it.'], correct: 'If he saves money, he will buy it.' },
        { line: 'Which sentence is correct', choices: ['Unless she hurries, she will miss the bus.', 'Unless she will hurry, she misses the bus.', 'If she hurries, she will miss the bus.', 'Unless she hurry, she misses.'], correct: 'Unless she hurries, she will miss the bus.' },
        { line: 'Which sentence is correct', choices: ['If you charge it, you can use it.', 'If you will charge it, you use it.', 'Unless you charge it, you can use it.', 'If you charging it, you use it.'], correct: 'If you charge it, you can use it.' },
        { line: 'Which sentence is correct', choices: ['We will use another computer if this one stops.', 'We use another computer if this one will stop.', 'If this one stops, we using another.', 'Unless this one stops, we will not have a computer ever.'], correct: 'We will use another computer if this one stops.' },
        { line: 'Which sentence is correct', choices: ['If you do not water it, it will die.', 'If you will not water it, it dies.', 'Unless you water it, it will grow.', 'If you not water it, it die.'], correct: 'If you do not water it, it will die.' },
        { line: 'Which sentence is correct', choices: ['If she hurries, she will catch the bus.', 'If she will hurry, she catches the bus.', 'If she hurry, she will catch the bus.', 'Unless she hurries, she will catch the bus.'], correct: 'If she hurries, she will catch the bus.' },
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
  return exercisesFor(decided.family, input.questions).sort(
    (a, b) => (EXERCISE_ORDER[a.activity] ?? 9) - (EXERCISE_ORDER[b.activity] ?? 9)
  )
}

export function finishDraft(draft: PracticeDraft): PracticeDraft {
  return {
    ...draft,
    line: finishWorksheetSentence(draft.line),
    choices: draft.choices.map((choice) => choice.trim()).filter(Boolean).slice(0, 4),
  }
}
