import {
  createTeacherFirstPrompt,
  generatedQuestionSchema,
  type GeneratedQuestionText,
} from '@/lib/ai/quiz-generation'
import type { GenerationBrief } from '@/lib/ai/generation-brief'
import {
  defaultAnswerStyleForShape,
  type QuestionShapeLabel,
} from '@/lib/ai/question-shapes'
import { resolveLexicon } from '@/lib/lexicon/resolver'
import type { CefrLevelId } from '@/lib/taxonomy/quiz-taxonomy'
import {
  EXERCISE_TITLE,
  finishWorksheetSentence,
  planWorksheetLayout,
  type PracticeDraft,
  type PracticeSource,
} from '@/lib/lesson/worksheet-practice'

const QUESTION_START =
  /^(who|what|where|when|why|how|which|whose|am|is|are|was|were|do|does|did|can|could|will|would|shall|should|have|has|had)\b/i

/**
 * The create form posts to /api/ai/generate-questions. That route calls
 * createTeacherFirstPrompt and parses the same question object. A worksheet
 * uses that one call for the whole page, so the preview does not time out
 * on three separate generations.
 */
export async function generateWorksheetWithQuizApi(input: {
  level: CefrLevelId
  grammar?: string[]
  title?: string
  description?: string
  questions: PracticeSource[]
  generate: (prompt: string) => Promise<string>
  scope?: 'set' | 'item'
}): Promise<PracticeDraft[]> {
  if (input.scope === 'item') {
    const source = input.questions[0]
    const shape = shapeForLine(source?.question ?? '')
    const [item] = await writeBatch(input, {
      activity: activityForShape(shape),
      count: 1,
      shape,
      note: 'Write one new item. Do not copy the teacher example.',
      useShapes: true,
    })
    return [item]
  }

  const plan = planWorksheetLayout()
  const total = plan.questions + plan.gaps + plan.choices
  const note = [
    `Return exactly ${total} items, in this order.`,
    `Items 1 to ${plan.questions} are real questions and end with ?.`,
    `Items ${plan.questions + 1} to ${plan.questions + plan.gaps} are sentences with ______ for the missing word.`,
    `Items ${plan.questions + plan.gaps + 1} to ${total} are different picture questions and end with ?.`,
    'Every item has four different answers. Do not repeat a question.',
  ].join(' ')
  let rejection = ''
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const written = await input.generate(
      promptFor(input, { count: total, shape: 'Wh-question', note, useShapes: false }, rejection)
    )
    try {
      const items = readQuestions(written, total)
      return [
        ...acceptBatch(items.slice(0, plan.questions), { activity: 'question' }, input.questions),
        ...acceptBatch(items.slice(plan.questions, plan.questions + plan.gaps), { activity: 'gap' }, input.questions),
        ...acceptBatch(items.slice(plan.questions + plan.gaps), { activity: 'choice' }, input.questions),
      ]
    } catch (error) {
      rejection = error instanceof Error ? error.message : 'The draft was not usable.'
      if (attempt === 1) throw error
    }
  }
  throw new Error('The AI returned an invalid question format.')
}

function activityForShape(shape: QuestionShapeLabel): 'question' | 'gap' | 'choice' {
  if (shape === 'Fill the gap') return 'gap'
  if (shape === 'Wh-question' || shape === 'Yes/No question') return 'question'
  return 'choice'
}

function shapeForLine(line: string): QuestionShapeLabel {
  if (/_{2,}/.test(line)) return 'Fill the gap'
  if (QUESTION_START.test(line.trim())) return 'Wh-question'
  return 'Find the mistake'
}

async function writeBatch(
  input: {
    level: CefrLevelId
    grammar?: string[]
    title?: string
    description?: string
    questions: PracticeSource[]
    generate: (prompt: string) => Promise<string>
  },
  batch: {
    activity: 'question' | 'gap' | 'choice'
    count: number
    shape: QuestionShapeLabel
    note: string
    useShapes: boolean
  }
): Promise<PracticeDraft[]> {
  let rejection = ''
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const written = await input.generate(promptFor(input, batch, rejection))
    try {
      return acceptBatch(readQuestions(written, batch.count), batch, input.questions)
    } catch (error) {
      rejection = error instanceof Error ? error.message : 'The draft was not usable.'
      if (attempt === 1) throw error
    }
  }
  throw new Error('The AI returned an invalid question format.')
}

function promptFor(
  input: {
    level: CefrLevelId
    grammar?: string[]
    title?: string
    description?: string
    questions: PracticeSource[]
  },
  batch: {
    count: number
    shape: QuestionShapeLabel
    note: string
    useShapes: boolean
  },
  rejection: string
): string {
  const examples = batch.useShapes
    ? input.questions.slice(0, 4).map((question) => ({
        shape: batch.shape,
        question: question.question.replace(/\s+/g, ' ').trim().slice(0, 240),
        answerStyle: defaultAnswerStyleForShape(batch.shape),
      }))
    : []
  const brief: GenerationBrief = {
    level: input.level,
    topics: [],
    grammarFocus: (input.grammar ?? []).slice(0, 8),
    teacherNotes: [batch.note, rejection ? `Fix the previous draft: ${rejection}` : '']
      .filter(Boolean)
      .join(' ')
      .slice(0, 1200),
    modelSentence: input.questions
      .map((question) => question.question.trim())
      .filter(Boolean)
      .join('\n')
      .slice(0, 800),
    sentenceForms: [],
    questionStyles: [],
    vocabularyFocus: 'Mixed',
    numberOfQuestions: batch.count,
    quizTitle: (input.title ?? '').slice(0, 160),
    quizDescription: (input.description ?? '').slice(0, 500),
    selectedShapes: examples.length > 0 ? examples : undefined,
  }
  const selection = resolveLexicon({
    level: input.level,
    tags: brief.grammarFocus,
    limit: 100,
  })
  return createTeacherFirstPrompt({ brief, selection })
}

function readQuestions(raw: string, expected: number): GeneratedQuestionText[] {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start < 0 || end <= start) {
    throw new SyntaxError('The AI returned an invalid question format.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw.slice(start, end + 1))
  } catch {
    throw new SyntaxError('The AI returned an invalid question format.')
  }
  if (!Array.isArray(parsed)) {
    throw new SyntaxError('The AI returned an invalid question format.')
  }
  const items = parsed.map((item) => generatedQuestionSchema.parse(normalizeItem(item)))
  if (items.length !== expected) {
    throw new Error(`The AI returned ${items.length} questions instead of ${expected}.`)
  }
  return items
}

function normalizeItem(raw: unknown): GeneratedQuestionText {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const question = String(record.question ?? record.line ?? '').trim()
  const seen = new Set<string>()
  const answers = (Array.isArray(record.answers) ? record.answers : [])
    .map((answer) => String(answer).trim())
    .filter((answer) => {
      const key = answer.toLowerCase()
      if (!answer || seen.has(key)) return false
      seen.add(key)
      return true
    })
  let correct = String(record.correctAnswer ?? '').trim()
  const match = answers.find((answer) => answer.toLowerCase() === correct.toLowerCase())
  if (match) correct = match
  else if (correct) answers.unshift(correct)
  const four = answers.includes(correct) ? [correct, ...answers.filter((answer) => answer !== correct)] : answers
  if (four.length < 4) {
    throw new Error('The AI returned duplicate answers.')
  }
  return {
    question,
    answers: four.slice(0, 4),
    correctAnswer: correct,
    imageKeyword: typeof record.imageKeyword === 'string' ? record.imageKeyword : undefined,
  }
}

function acceptBatch(
  items: GeneratedQuestionText[],
  batch: { activity: 'question' | 'gap' | 'choice' },
  sources: PracticeSource[]
): PracticeDraft[] {
  const seen = new Set<string>()
  const pictured = sources.filter((source) => source.imageUrl)
  return items.map((item, index) => {
    const line = lineFor(batch.activity, item)
    const key = line.toLowerCase()
    if (seen.has(key)) {
      throw new Error('The AI repeated a question.')
    }
    seen.add(key)
    const picture = batch.activity === 'choice' ? pictured[index % Math.max(pictured.length, 1)] : undefined
    return {
      activity: batch.activity,
      line,
      choices: batch.activity === 'question' ? [] : item.answers,
      correctAnswer: item.correctAnswer,
      reason: 'Written by the quiz question generator.',
      sourceQuestion: item.question,
      exercise: EXERCISE_TITLE[batch.activity],
      imageUrl: picture?.imageUrl,
      questionId: picture?.id,
    }
  })
}

function lineFor(activity: 'question' | 'gap' | 'choice', item: GeneratedQuestionText): string {
  if (activity === 'gap') {
    const withBlank = item.question.includes('______')
      ? item.question
      : blankTheAnswer(item.question, item.correctAnswer)
    if (!withBlank.includes('______')) {
      throw new Error('The AI returned a gap with no blank.')
    }
    return finishWorksheetSentence(withBlank)
  }
  const line = finishWorksheetSentence(item.question)
  if (!line.endsWith('?')) {
    throw new Error('The AI returned a sentence instead of a question.')
  }
  return line
}

function blankTheAnswer(question: string, answer: string): string {
  const escaped = answer.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!escaped) return question
  return question.replace(new RegExp(escaped, 'i'), '______')
}
