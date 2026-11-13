import { z } from 'zod'
import { levelGuidance } from '@/lib/ai/quiz-generation'
import { resolveLexicon } from '@/lib/lexicon/resolver'
import { levelLabelFromId, type CefrLevelId } from '@/lib/taxonomy/quiz-taxonomy'
import {
  EXERCISE_TITLE,
  exerciseInstruction,
  finishWorksheetSentence,
  planWorksheetLayout,
  worksheetScaffold,
  type PracticeDraft,
  type PracticeSource,
} from '@/lib/lesson/worksheet-practice'

type Section = 'choice' | 'gap' | 'rewrite'
type Counts = Record<Section, number>

interface GenerateInput {
  level: CefrLevelId
  grammar?: string[]
  title?: string
  description?: string
  questions: PracticeSource[]
  generate: (prompt: string) => Promise<string>
  scope?: 'set' | 'item'
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
  words: z.array(z.string().min(1).max(40)).max(6).nullish(),
  answer: z.string().min(3).max(160),
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
  if (input.scope === 'item') {
    const source = input.questions[0]
    const section = sectionForLine(source?.question ?? '')
    const counts: Counts = { choice: 0, gap: 0, rewrite: 0 }
    counts[section] = 1
    const note = source ? `Write a new item instead of: "${source.question.trim()}".` : ''
    return writePage(input, counts, note)
  }
  const plan = planWorksheetLayout(input.level)
  return writePage(input, { choice: plan.choices, gap: plan.gaps, rewrite: plan.sentences }, '')
}

function sectionForLine(line: string): Section {
  if (/_{2,}/.test(line)) return 'gap'
  if (line.includes(' / ')) return 'rewrite'
  return 'choice'
}

async function writePage(input: GenerateInput, counts: Counts, note: string): Promise<PracticeDraft[]> {
  let feedback = ''
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const raw = await input.generate(worksheetPrompt(input, counts, [note, feedback].filter(Boolean).join('\n')))
    const { drafts, rejected, short } = arrangePage(raw, input, counts)
    if (rejected.length > 0) {
      reportWorksheetGeneration({ reason: 'rejected-items', attempt, lines: rejected })
    }
    if (short.length === 0) return drafts
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
Return only one JSON object with the keys for the sections above:
{"pictures":[{"pictureId":"q1","question":"What is the boy kicking?","answers":["A ball","A cat","A book"],"correctAnswer":"A ball"}],"gaps":[{"sentence":"An elephant is ______ than a mouse.","answer":"bigger","base":"big"}],"sentences":[{"answer":"The bus is faster than the bike."}]}`
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
        choices: [...answers.slice(turn), ...answers.slice(0, turn)].map(finishWorksheetSentence),
        correctAnswer: finishWorksheetSentence(answers[0]),
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

  const sentences: PracticeDraft[] = []
  for (const item of listOf(page.sentences, sentenceSchema, rejected)) {
    const answer = finishWorksheetSentence(item.answer)
    const wordCount = answer.split(/\s+/).length
    const cues = (item.words ?? []).map((word) => word.trim()).filter(Boolean)
    if (!fresh(answer)) {
      rejected.push({ reason: 'duplicate', line: answer })
    } else if (scaffold.sentences === 'jumbled') {
      if (wordCount < 3 || wordCount > 10) rejected.push({ reason: 'jumble-length', line: answer })
      else {
        const line = jumbleSentence(answer, sentences.length + 1)
        sentences.push(draft('rewrite', line, scaffold, { correctAnswer: answer, sourceQuestion: line }))
      }
    } else if (cues.length < 2 || cues.length > 5) {
      rejected.push({ reason: 'sentence-without-cue-words', line: answer })
    } else {
      const line = cues.join(' / ')
      sentences.push(draft('rewrite', line, scaffold, { correctAnswer: answer, sourceQuestion: line }))
    }
  }

  const short: string[] = []
  if (choices.length < counts.choice) short.push(`Only ${choices.length} of ${counts.choice} picture questions were usable.`)
  if (gaps.length < counts.gap) short.push(`Only ${gaps.length} of ${counts.gap} gap sentences were usable.`)
  if (sentences.length < counts.rewrite) short.push(`Only ${sentences.length} of ${counts.rewrite} sentences were usable.`)
  return {
    drafts: [
      ...choices.slice(0, counts.choice),
      ...gaps.slice(0, counts.gap),
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
  return order.map((index) => words[index]).join(' / ')
}

/**
 * One JSON line per problem, tagged so it can be found in the server logs and
 * fixed without the teacher reproducing it.
 */
function reportWorksheetGeneration(entry: { reason: string; attempt: number; lines: Rejection[] }) {
  console.error(JSON.stringify({ source: 'worksheet-generation', ...entry }))
}
