import { z } from 'zod'
import { levelGuidance } from '@/lib/ai/quiz-generation'
import { resolveLexicon } from '@/lib/lexicon/resolver'
import { levelLabelFromId, type CefrLevelId } from '@/lib/taxonomy/quiz-taxonomy'
import {
  EXERCISE_TITLE,
  exerciseInstruction,
  finishChoiceLabel,
  finishWorksheetSentence,
  labelWorksheetSections,
  planWorksheetLayout,
  suggestWorksheetSections,
  worksheetScaffold,
  type PracticeDraft,
  type PracticeSource,
} from '@/lib/lesson/worksheet-practice'

type Section = 'choice' | 'gap' | 'rewrite' | 'circle'
type Counts = Record<Section, number>

export interface WorksheetSolverNote {
  skipped: boolean
  disagreements: { number: number; line: string; expected: string; got: string }[]
  ambiguous: number[]
  error?: string
}

export interface WorksheetRunReport {
  status: 'ok' | 'failed'
  rejected: { reason: string; line: string }[]
  solver: WorksheetSolverNote
  error: string
}

interface GenerateInput {
  level: CefrLevelId
  grammar?: string[]
  title?: string
  description?: string
  /** Pasted page or notes. Not fetched from a URL. */
  sourceText?: string
  questions: PracticeSource[]
  generate: (prompt: string) => Promise<string>
  scope?: 'set' | 'item'
  sections?: Array<'choice' | 'gap' | 'circle' | 'rewrite'>
  /** A short second call answers the sheet the way a student would. */
  solve?: boolean
  onReport?: (report: WorksheetRunReport) => void | Promise<void>
}

interface Rejection {
  reason: string
  line: string
}

const pictureSchema = z.object({
  pictureId: z.string().nullish(),
  question: z.string().min(3).max(200),
  answers: z.array(z.string().min(1).max(80)).min(2).max(4),
  correctAnswer: z.string().min(1).max(80),
})

const gapSchema = z.object({
  sentence: z.string().min(3).max(200),
  answer: z.string().min(1).max(40),
  base: z.string().max(40).nullish(),
})

const sentenceSchema = z.object({
  words: z.array(z.string().min(1).max(40)).max(12).nullish(),
  answer: z.string().min(3).max(160),
})

const circleSchema = z.object({
  sentence: z.string().min(3).max(200),
  options: z.array(z.string().min(1).max(40)).min(2).max(4),
  answer: z.string().min(1).max(40),
})

/** The student cannot be marked right or wrong on their own life or opinion. */
const SUBJECTIVE = /\b(your|yours|favou?rite|you think|you like|you prefer|you find|in your opinion|would you rather)\b/i
/** Without a picture, these point at something the student cannot see. */
const NEEDS_PICTURE = /\b(this|that|these|those|picture|photo|the red one|the blue one|the green one)\b/i
const LOWER_START = new Set([
  'the', 'a', 'an', 'she', 'he', 'they', 'we', 'it', 'there', 'this', 'that', 'these', 'those',
  'my', 'his', 'her', 'our', 'their', 'your', 'you', 'is', 'are', 'was', 'were', 'do', 'does',
  'did', 'can', 'what', 'where', 'who', 'which', 'how', 'when', 'why', 'if', 'unless', 'some',
])

/**
 * Same Gemini text call as the create form (/api/ai/generate-questions), with a
 * worksheet prompt. A quiz item relies on its four options being on screen; a
 * worksheet line has to stand alone on paper and have one answer a teacher can mark.
 */
export async function generateWorksheet(input: GenerateInput): Promise<PracticeDraft[]> {
  const pictures = quizPictureDrafts(input.questions)
  try {
    if (input.scope === 'item') {
      const source = input.questions[0]
      const section = sectionForLine(source?.question ?? '')
      const counts: Counts = { choice: 0, gap: 0, rewrite: 0, circle: 0 }
      counts[section] = 1
      const note = source ? `Write one new item instead of: "${source.question.trim()}". Keep the same picture if it has one.` : ''
      const written = await writePage(input, counts, note)
      return present(written.drafts, input, written.rejected)
    }
    const sections = input.sections ?? suggestWorksheetSections(pictures.length, input.grammar)
    const kept = sections.includes('choice') ? pictures.slice(0, 6) : []
    const plan = planWorksheetLayout(input.level, {
      choices: kept.length,
      gap: sections.includes('gap'),
      circle: sections.includes('circle'),
      rewrite: sections.includes('rewrite'),
    })
    const counts: Counts = {
      choice: 0,
      gap: sections.includes('gap') ? plan.gaps : 0,
      circle: sections.includes('circle') ? plan.circles : 0,
      rewrite: sections.includes('rewrite') ? plan.sentences : 0,
    }
    if (counts.gap + counts.circle + counts.rewrite === 0) {
      return present(kept, input, [])
    }
    const written = await writePage(input, counts, input.description ?? '')
    return present([...kept, ...written.drafts], input, written.rejected)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The worksheet could not be written.'
    await input.onReport?.({
      status: 'failed',
      rejected: [],
      solver: { skipped: true, disagreements: [], ambiguous: [] },
      error: message,
    })
    throw error
  }
}

function sectionForLine(line: string): Section {
  if (/\([^)]+\/[^)]+\)/.test(line)) return 'circle'
  if (/_{2,}/.test(line)) return 'gap'
  if (line.includes(' / ')) return 'rewrite'
  return 'choice'
}

async function writePage(input: GenerateInput, counts: Counts, note: string): Promise<{ drafts: PracticeDraft[]; rejected: Rejection[] }> {
  let feedback = ''
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const raw = await input.generate(worksheetPrompt(input, counts, [note, feedback].filter(Boolean).join('\n')))
    const { drafts, rejected, short } = arrangePage(raw, input, counts)
    if (rejected.length > 0) {
      reportWorksheetGeneration({ reason: 'rejected-items', attempt, lines: rejected })
    }
    if (short.length === 0) return { drafts, rejected }
    feedback = [
      'Your last draft could not be used. Write new items instead of these:',
      ...rejected.slice(0, 12).map((item) => `- ${item.reason}: "${item.line}"`),
      ...short.map((gap) => `- ${gap}`),
    ]
      .join('\n')
      .slice(0, 1500)
    if (attempt === 2) {
      const quoted = rejected
        .slice(0, 4)
        .map((item) => `"${item.line}" (${item.reason})`)
        .join('; ')
      throw new Error(`The AI worksheet was not usable: ${short.join(' ')}${quoted ? ` Rejected: ${quoted}` : ''}`)
    }
  }
  throw new Error('The AI returned an invalid question format.')
}

function present(drafts: PracticeDraft[], input: GenerateInput, rejected: Rejection[]): Promise<PracticeDraft[]> {
  return finishPage(drafts, input, rejected)
}

function sourceLine(source: PracticeSource): string {
  const answer = source.correctAnswer.trim()
  if (!answer || answer.startsWith('[') || answer.startsWith('{')) return source.question.trim()
  return /_{2,}/.test(source.question)
    ? source.question.replace(/_{2,}/, answer).trim()
    : `${source.question.trim()} (${answer})`
}

export function worksheetPrompt(input: Omit<GenerateInput, 'generate'>, counts: Counts, feedback: string): string {
  const scaffold = worksheetScaffold(input.level)
  const grammar = (input.grammar ?? []).join(', ') || 'the language in the quiz'
  const selection = resolveLexicon({ level: input.level, tags: input.grammar ?? [], limit: 60 })
  const pictures = input.questions
    .filter((source) => source.imageUrl && source.id)
    .slice(0, 12)
    .map((source) => ({ id: source.id, shows: sourceLine(source) }))
  const quizLines = input.questions.slice(0, 12).map(sourceLine)

  const sections: string[] = []
  if (counts.choice > 0) {
    sections.push(`"pictures": ${counts.choice + 1} multiple-choice questions.
- Pictures the student can see (id and what each picture shows): ${JSON.stringify(pictures)}
- Give each question the pictureId of the picture it asks about. The picture must decide the answer. Use each picture once if you can.
- ${pictures.length > 0 ? 'When you run out of pictures, set pictureId to null.' : 'There are no pictures, so set pictureId to null.'} A question with no picture must be answered from facts every child knows, such as "Which is bigger, an elephant or a mouse?".
- Three short answers, up to five words each. Exactly one is correct. The question ends with ?.`)
  }
  if (counts.gap > 0) {
    sections.push(`"gaps": ${counts.gap + 2} sentences with one ______ for one missing word or short phrase.
- "answer" is what goes in the gap. "base" is its dictionary form (big for bigger, go for went, be for was).
- The sentence holds a clue so only the answer fits, such as "An elephant is ______ than a mouse." Never "He is the ______ student", where any word fits.
- Every answer is different.`)
  }
  if (counts.circle > 0) {
    sections.push(`"circles": ${counts.circle + 2} sentences with one word that shows the language point.
- "options" has three words and "answer" is the one correct option.
- The sentence makes the other options wrong, such as {"sentence":"There ______ a dog.","options":["is","are","am"],"answer":"is"}.
- Do not leave the answer open, as in "He is the ______ student".`)
  }
  if (counts.rewrite > 0) {
    sections.push(
      scaffold.sentences === 'jumbled'
        ? `"sentences": ${counts.rewrite + 2} correct sentences that use the language point, four to eight words each. The worksheet mixes up the words for the student to put back in order. Give only "answer".`
        : `"sentences": ${counts.rewrite + 2} correct sentences that use the language point. Also give "words": two to four key words or short phrases in dictionary form and in sentence order, which the student turns into the sentence. Example: {"words":["an elephant","big","a mouse"],"answer":"An elephant is bigger than a mouse."}`
    )
  }

  return `You write one printed grammar worksheet for young learners of English, in the style of Cambridge Starters, Movers and Flyers. A student works alone with a pencil. The teacher marks it with an answer key, so every item has exactly one correct answer.

Language point: ${grammar}
Level: ${levelLabelFromId(input.level)} (${input.level}). ${levelGuidance(input.level)}
Quiz title: ${input.title || 'Untitled'}
Quiz description: ${input.description || 'None'}
Quiz lines, with the answer filled in: ${JSON.stringify(quizLines)}
Text the teacher pasted: ${(input.sourceText ?? '').replace(/\s+/g, ' ').trim().slice(0, 2000) || 'None'}
Words the class knows: ${selection.words.slice(0, 60).join(', ') || 'Use simple everyday words.'}
Useful patterns: ${selection.grammarPatterns.join('; ') || 'Short sentences at this level.'}

Rules for every item:
- The student can answer from what is printed: the picture, the words on the line, or facts every child knows.
- Never ask about the student's own things, friends, feelings, opinions or favourites. Do not use "your", "you think" or "favourite".
- Do not say "this", "that", "the red one" or "the blue one" unless the picture shows it.
- Every sentence starts with a capital letter and ends with a full stop or a question mark.
- Do not repeat an item. Keep each item under 14 words. Age-appropriate content only.

Write these sections:
${sections.join('\n\n')}
${feedback ? `\n${feedback}\n` : ''}
Return only one JSON object with these keys: ${JSON.stringify(exampleKeys(counts))}`
}

function exampleKeys(counts: Counts): Record<string, unknown> {
  const example: Record<string, unknown> = {}
  if (counts.choice > 0) {
    example.pictures = [{ pictureId: 'q1', question: 'What is the boy kicking?', answers: ['A ball', 'A cat', 'A book'], correctAnswer: 'A ball' }]
  }
  if (counts.gap > 0) example.gaps = [{ sentence: 'An elephant is ______ than a mouse.', answer: 'bigger', base: 'big' }]
  if (counts.circle > 0) example.circles = [{ sentence: 'There ______ a dog.', options: ['is', 'are', 'am'], answer: 'is' }]
  if (counts.rewrite > 0) example.sentences = [{ answer: 'The bus is faster than the bike.' }]
  return example
}

function readObject(raw: string): Record<string, unknown> {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) throw new SyntaxError('The AI returned an invalid question format.')
  try {
    const parsed: unknown = JSON.parse(raw.slice(start, end + 1))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    return parsed as Record<string, unknown>
  } catch {
    throw new SyntaxError('The AI returned an invalid question format.')
  }
}

/** The model sometimes returns "She helps him." instead of {"answer":"She helps him."}. */
function sentenceEntry(entry: unknown): unknown {
  if (typeof entry === 'string') return { answer: entry.trim() }
  return entry
}

/** Two to four words the student is given. Extra tokens such as "+" are dropped. */
function cueWords(answer: string, given: string[]): string[] {
  const token = (word: string) => word.replace(/^[^\w]+|[^\w]+$/g, '').trim()
  const skip = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'and', 'what', 'it'])
  const useful = (words: string[]) => words.map(token).filter((word) => word.length > 0 && !skip.has(word.toLowerCase()))
  const fromModel = useful(given)
  const fromAnswer = useful(answer.replace(/[.?!]/g, '').split(/\s+/))
  const picked = (fromModel.length >= 2 ? fromModel : fromAnswer).slice(0, 4)
  if (picked.length >= 2) return picked
  return answer.replace(/[.?!]/g, '').split(/\s+/).map(token).filter(Boolean).slice(0, 4)
}

function listOf<T>(value: unknown, schema: z.ZodType<T>, rejected: Rejection[]): T[] {
  if (!Array.isArray(value)) return []
  const items: T[] = []
  for (const entry of value) {
    const parsed = schema.safeParse(entry)
    if (parsed.success) items.push(parsed.data)
    else rejected.push({ reason: 'bad-shape', line: JSON.stringify(entry).slice(0, 160) })
  }
  return items
}

function arrangePage(
  raw: string,
  input: GenerateInput,
  counts: Counts
): { drafts: PracticeDraft[]; rejected: Rejection[]; short: string[] } {
  const scaffold = worksheetScaffold(input.level)
  const page = readObject(raw)
  const rejected: Rejection[] = []
  const seen = new Set<string>()
  const fresh = (line: string) => {
    const key = line.toLowerCase().replace(/[^a-z]/g, '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }

  const pictured = new Map(
    input.questions.filter((source) => source.id && source.imageUrl).map((source) => [source.id as string, source])
  )
  const choices: PracticeDraft[] = []
  for (const item of listOf(page.pictures, pictureSchema, rejected)) {
    const line = finishWorksheetSentence(item.question)
    const picture = item.pictureId ? pictured.get(item.pictureId) : undefined
    const answers = uniqueAnswers(item.answers, item.correctAnswer)
    if (!line.endsWith('?')) rejected.push({ reason: 'sentence-instead-of-question', line })
    else if (SUBJECTIVE.test(line)) rejected.push({ reason: 'subjective', line })
    else if (!picture && NEEDS_PICTURE.test(line)) rejected.push({ reason: 'needs-picture', line })
    else if (answers.length < 2) rejected.push({ reason: 'duplicate-answers', line })
    else if (!fresh(line)) rejected.push({ reason: 'duplicate', line })
    else {
      const turn = (choices.length + 1) % answers.length
      choices.push(draft('choice', line, scaffold, {
        choices: [...answers.slice(turn), ...answers.slice(0, turn)].map(finishChoiceLabel),
        correctAnswer: finishChoiceLabel(answers[0]),
        imageUrl: picture?.imageUrl,
        questionId: picture?.id,
        sourceQuestion: item.question,
      }))
    }
  }
  choices.sort((a, b) => Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl)))

  const gaps: PracticeDraft[] = []
  const bankWords = new Set<string>()
  for (const item of listOf(page.gaps, gapSchema, rejected)) {
    const answer = item.answer.trim().replace(/[.?!]+$/, '')
    const base = item.base?.trim() || ''
    const blanked = /_{2,}/.test(item.sentence) ? item.sentence : blankAnswer(item.sentence, answer)
    const blanks = blanked.match(/_{2,}/g)?.length ?? 0
    let line = finishWorksheetSentence(blanked.replace(/_{2,}/g, '______'))
    const bank = scaffold.bank === 'exact' ? answer : base || answer
    if (blanks !== 1) rejected.push({ reason: 'gap-needs-one-blank', line })
    else if (scaffold.bank === 'none' && !base) rejected.push({ reason: 'gap-without-base-word', line })
    else if (SUBJECTIVE.test(`${line} ${answer}`)) rejected.push({ reason: 'subjective', line })
    else if (bankWords.has(bank.toLowerCase()) && scaffold.bank === 'exact') {
      rejected.push({ reason: 'repeated-gap-answer', line })
    } else if (!fresh(line)) rejected.push({ reason: 'duplicate', line })
    else {
      if (scaffold.bank === 'none') line = line.replace('______', `______ (${base})`)
      bankWords.add(bank.toLowerCase())
      gaps.push(draft('gap', line, scaffold, {
        correctAnswer: answer,
        bank: scaffold.bank === 'none' ? undefined : bank,
        sourceQuestion: item.sentence,
      }))
    }
  }

  const circles: PracticeDraft[] = []
  for (const item of listOf(page.circles, circleSchema, rejected)) {
    const options = uniqueAnswers(item.options, item.answer).map(finishChoiceLabel)
    const answer = finishChoiceLabel(item.answer)
    const line = circleLine(item.sentence, options, answer)
    if (!line) rejected.push({ reason: 'circle-needs-one-word', line: item.sentence })
    else if (SUBJECTIVE.test(line)) rejected.push({ reason: 'subjective', line })
    else if (!options.includes(answer)) rejected.push({ reason: 'circle-answer-missing', line })
    else if (!fresh(line)) rejected.push({ reason: 'duplicate', line })
    else {
      circles.push(draft('circle', line, scaffold, { choices: options, correctAnswer: answer, sourceQuestion: item.sentence }))
    }
  }

  const sentences: PracticeDraft[] = []
  const sentenceEntries = Array.isArray(page.sentences) ? page.sentences.map(sentenceEntry) : page.sentences
  for (const item of listOf(sentenceEntries, sentenceSchema, rejected)) {
    const answer = finishWorksheetSentence(item.answer)
    const wordCount = answer.split(/\s+/).length
    const cues = cueWords(answer, item.words ?? [])
    if (!fresh(answer)) {
      rejected.push({ reason: 'duplicate', line: answer })
    } else if (scaffold.sentences === 'jumbled') {
      if (wordCount < 3 || wordCount > 12) rejected.push({ reason: 'jumble-length', line: answer })
      else {
        const line = jumbleSentence(answer, sentences.length + 1)
        sentences.push(draft('rewrite', line, scaffold, { correctAnswer: answer, sourceQuestion: line }))
      }
    } else if (cues.length < 2) {
      rejected.push({ reason: 'sentence-without-cue-words', line: answer })
    } else {
      const line = cues.join(' / ')
      sentences.push(draft('rewrite', line, scaffold, { correctAnswer: answer, sourceQuestion: line }))
    }
  }

  const short: string[] = []
  if (choices.length < counts.choice) short.push(`Only ${choices.length} of ${counts.choice} picture questions were usable.`)
  if (gaps.length < counts.gap) short.push(`Only ${gaps.length} of ${counts.gap} gap sentences were usable.`)
  if (circles.length < counts.circle) short.push(`Only ${circles.length} of ${counts.circle} circle items were usable.`)
  if (sentences.length < counts.rewrite) short.push(`Only ${sentences.length} of ${counts.rewrite} sentences were usable.`)
  return {
    drafts: [
      ...choices.slice(0, counts.choice),
      ...gaps.slice(0, counts.gap),
      ...circles.slice(0, counts.circle),
      ...sentences.slice(0, counts.rewrite),
    ],
    rejected,
    short,
  }
}

function draft(
  activity: Section,
  line: string,
  scaffold: ReturnType<typeof worksheetScaffold>,
  extra: Partial<PracticeDraft>
): PracticeDraft {
  return {
    activity,
    line,
    choices: extra.choices ?? [],
    correctAnswer: extra.correctAnswer ?? '',
    reason: 'Written by the worksheet generator.',
    sourceQuestion: extra.sourceQuestion ?? line,
    exercise: EXERCISE_TITLE[activity],
    instruction: exerciseInstruction(activity, scaffold),
    imageUrl: extra.imageUrl,
    questionId: extra.questionId,
    bank: extra.bank,
  }
}

function uniqueAnswers(answers: string[], correct: string): string[] {
  const seen = new Set<string>()
  const match = answers.find((answer) => answer.trim().toLowerCase() === correct.trim().toLowerCase())
  return [match ?? correct, ...answers]
    .map((answer) => answer.trim())
    .filter((answer) => {
      const key = answer.toLowerCase().replace(/[.?!]+$/, '')
      if (!answer || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 4)
}

function blankAnswer(sentence: string, answer: string): string {
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!escaped) return sentence
  return sentence.replace(new RegExp(`\\b${escaped}\\b`, 'i'), '______')
}

/** Mixed-up words separated by slashes; the order is fixed by the seed so a reprint matches. */
export function jumbleSentence(sentence: string, seed: number): string {
  const words = sentence.replace(/[.?!]+$/, '').trim().split(/\s+/).filter(Boolean)
  if (words[0] && LOWER_START.has(words[0].toLowerCase())) words[0] = words[0].toLowerCase()
  const order = words.map((_, index) => index)
  let state = (seed * 7919) % 233280
  for (let index = order.length - 1; index > 0; index -= 1) {
    state = (state * 9301 + 49297) % 233280
    const swap = state % (index + 1)
    ;[order[index], order[swap]] = [order[swap], order[index]]
  }
  if (order.every((value, index) => value === index)) order.push(order.shift() as number)
  const mark = sentence.trim().endsWith('?') ? '?' : '.'
  return `${order.map((index) => words[index]).join(' / ')} / ${mark}`
}

/**
 * One JSON line per problem, tagged so it can be found in the server logs and
 * fixed without the teacher reproducing it.
 */
function reportWorksheetGeneration(entry: { reason: string; attempt: number; lines: Rejection[] }) {
  console.error(JSON.stringify({ source: 'worksheet-generation', ...entry }))
}

function realPicture(url: string | null | undefined): url is string {
  if (!url?.trim()) return false
  const path = url.split('?')[0]?.split('#')[0] ?? ''
  return !path.endsWith('/placeholder.webp') && !path.endsWith('/placeholder.png')
}

function quizPictureDrafts(questions: PracticeSource[]): PracticeDraft[] {
  const scaffold = worksheetScaffold(undefined)
  return questions
    .filter((question) => realPicture(question.imageUrl))
    .slice(0, 6)
    .map((question) => {
      const answers = uniqueAnswers(question.answers, question.correctAnswer).map(finishChoiceLabel)
      const correct = finishChoiceLabel(question.correctAnswer)
      return {
        activity: 'choice' as const,
        line: finishWorksheetSentence(question.question.replace(/_{2,}/g, '______')),
        choices: answers,
        correctAnswer: answers.find((answer) => answer.toLowerCase() === correct.toLowerCase()) ?? correct,
        reason: 'Kept with the picture you chose.',
        sourceQuestion: question.question,
        exercise: EXERCISE_TITLE.choice,
        instruction: exerciseInstruction('choice', scaffold),
        imageUrl: question.imageUrl,
        questionId: question.id,
      }
    })
}

function circleLine(sentence: string, options: string[], answer: string): string {
  const box = `(${options.join(' / ')})`
  const blanked = /_{2,}/.test(sentence) ? sentence : blankAnswer(sentence, answer)
  if (!/_{2,}/.test(blanked)) return ''
  return finishWorksheetSentence(blanked.replace(/_{2,}/, box))
}

async function finishPage(drafts: PracticeDraft[], input: GenerateInput, rejected: Rejection[]): Promise<PracticeDraft[]> {
  const withExamples = markExamples(drafts)
  const solver = input.solve
    ? await runSolver(withExamples, input.generate)
    : { skipped: true, disagreements: [], ambiguous: [] as number[] }
  const ambiguous = new Set(solver.ambiguous)
  const warned = withExamples.map((draft, index) => {
    const number = index + 1
    const hit = solver.disagreements.find((item) => item.number === number)
    if (hit) return { ...draft, warning: `A student-style check answered "${hit.got}" instead of "${hit.expected}".` }
    if (ambiguous.has(number)) return { ...draft, warning: 'A student-style check found more than one possible answer.' }
    return draft
  })
  await input.onReport?.({ status: 'ok', rejected, solver, error: '' })
  console.error(JSON.stringify({ source: 'worksheet-generation', status: 'ok', rejected: rejected.length, disagreements: solver.disagreements.length }))
  return labelWorksheetSections(warned)
}

function markExamples(drafts: PracticeDraft[]): PracticeDraft[] {
  const seen = new Set<string>()
  return drafts.map((draft) => {
    if (seen.has(draft.activity)) return draft
    seen.add(draft.activity)
    return { ...draft, example: true }
  })
}

/** The check sees the printed lines and no answer key. Picture rows are skipped: the teacher chose those. */
export function solverPrompt(drafts: PracticeDraft[]): string {
  const bank = [...new Set(drafts.map((draft) => draft.bank).filter((word): word is string => Boolean(word)))]
  const lines = drafts.flatMap((draft, index) => {
    if (draft.example || (draft.activity === 'choice' && draft.imageUrl)) return []
    const task =
      draft.activity === 'gap'
        ? `Write the missing word: ${draft.line}`
        : draft.activity === 'rewrite'
          ? `Write the sentence: ${draft.line}`
          : draft.activity === 'circle'
            ? `Choose the correct word: ${draft.line}`
            : `Choose one answer: ${draft.line} Options: ${draft.choices.join(' | ')}`
    return [`${index + 1}. ${task}`]
  })
  return `You are a student doing this worksheet. You cannot see the answer key or any picture. Answer each numbered item. If more than one answer could be right, put that number in "ambiguous" and still give your best answer.
Word box: ${bank.join(', ') || 'none'}
${lines.join('\n')}
Return only JSON, like {"answers":{"2":"bigger"},"ambiguous":[4]}`
}

async function runSolver(drafts: PracticeDraft[], generate: (prompt: string) => Promise<string>): Promise<WorksheetSolverNote> {
  try {
    const parsed = readSolver(await generate(solverPrompt(drafts)))
    const disagreements: WorksheetSolverNote['disagreements'] = []
    drafts.forEach((draft, index) => {
      if (draft.example || (draft.activity === 'choice' && draft.imageUrl)) return
      const number = index + 1
      const got = parsed.answers[String(number)] ?? ''
      if (!got || parsed.ambiguous.includes(number)) return
      if (!sameAnswer(draft.correctAnswer, got)) {
        disagreements.push({ number, line: draft.line, expected: draft.correctAnswer, got })
      }
    })
    return { skipped: false, disagreements, ambiguous: parsed.ambiguous }
  } catch (error) {
    return {
      skipped: false,
      disagreements: [],
      ambiguous: [],
      error: error instanceof Error ? error.message : 'The check could not read the sheet.',
    }
  }
}

function readSolver(raw: string): { answers: Record<string, string>; ambiguous: number[] } {
  const page = readObject(raw)
  const answers: Record<string, string> = {}
  if (page.answers && typeof page.answers === 'object' && !Array.isArray(page.answers)) {
    for (const [key, value] of Object.entries(page.answers as Record<string, unknown>)) answers[key] = String(value ?? '')
  }
  const ambiguous = Array.isArray(page.ambiguous) ? page.ambiguous.map(Number).filter((number) => number > 0) : []
  return { answers, ambiguous }
}

function sameAnswer(expected: string, got: string): boolean {
  const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
  const answer = norm(expected)
  const given = norm(got)
  if (!answer || !given) return false
  if (answer === given) return true
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`).test(given)
}
