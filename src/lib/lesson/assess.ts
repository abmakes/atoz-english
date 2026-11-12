import { z } from 'zod'
import { auditQuestion } from '@/lib/lexicon/validator'
import type { LanguageAuditIssue } from '@/lib/lexicon/types'
import type { CefrLevelId } from '@/lib/taxonomy/quiz-taxonomy'
import { QuestionType } from '@/types/question_types'
import {
  finishDraft,
  finishWorksheetSentence,
  grammarPracticeDrafts,
  parseWorksheetPractice,
  worksheetPracticePrompt,
  type PracticeDraft,
  type WorksheetActivity,
} from '@/lib/lesson/worksheet-practice'

export { finishWorksheetSentence }
export type { WorksheetActivity }

export type LessonTarget = 'worksheet' | 'sentence-builder'

export interface SourceQuestion {
  id?: string
  question: string
  answers: string[]
  correctAnswer: string
  type: QuestionType | string
  imageUrl?: string | null
}

export interface LessonAssessmentItem {
  questionId: string
  sourceQuestion: string
  sourceAnswers: string[]
  correctAnswer: string
  type: string
  imageUrl: string | null
  compatible: boolean
  converted: boolean
  reason: string
  line: string
  choices: string[]
  activity?: WorksheetActivity
  exercise?: string
  languageWarnings: LanguageAuditIssue[]
}

export interface WorksheetItem {
  questionId?: string
  line: string
  imageUrl?: string
  choices: string[]
  activity?: WorksheetActivity
  exercise?: string
}

export interface LessonSentence {
  text: string
  imageUrl?: string
  questionId?: string
}

export interface LessonReviewRow {
  status?: 'pending' | 'approved' | 'rejected'
  questionId?: string
  line: string
  choices?: string[]
  imageUrl?: string | null
  correctAnswer?: string
  activity?: WorksheetActivity
  exercise?: string
}

const BLANK = /_{3,}/

export function usableAnswers(answers: readonly string[]): string[] {
  return answers.map((answer) => answer.trim()).filter(Boolean)
}

export function isStructuredCorrectAnswer(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return false
  try {
    const parsed: unknown = JSON.parse(trimmed)
    return Array.isArray(parsed) || (parsed !== null && typeof parsed === 'object')
  } catch {
    return false
  }
}

export function isRealPicture(url: string | null | undefined): url is string {
  if (!url?.trim()) return false
  const path = url.split('?')[0]?.split('#')[0] ?? ''
  return !path.endsWith('/placeholder.webp') && !path.endsWith('/placeholder.png')
}

/** Replace the first gap with the correct word. The stored question is not touched. */
export function fillGap(stem: string, answer: string): string {
  return stem.replace(BLANK, answer).replace(/[ \t]{2,}/g, ' ').trim()
}

export function worksheetStem(stem: string): string {
  return stem.replace(BLANK, '______').replace(/[ \t]{2,}/g, ' ').trim()
}

function isMultipleChoice(type: string): boolean {
  return type === QuestionType.MULTIPLE_CHOICE || type === 'MULTIPLE_CHOICE'
}

/**
 * A gap multiple-choice item with four answers is already a sentence.
 * Returns null when the model has to decide.
 */
export function localSentenceAssessment(question: SourceQuestion): LessonAssessmentItem | null {
  if (!isMultipleChoice(String(question.type))) return null
  if (isStructuredCorrectAnswer(question.correctAnswer)) return null
  if (!BLANK.test(question.question)) return null
  const answers = usableAnswers(question.answers)
  const correct = question.correctAnswer.trim()
  if (answers.length !== 4 || !answers.includes(correct)) return null
  return {
    questionId: question.id?.trim() || '',
    sourceQuestion: question.question,
    sourceAnswers: [...question.answers],
    correctAnswer: question.correctAnswer,
    type: String(question.type),
    imageUrl: question.imageUrl ?? null,
    compatible: true,
    converted: true,
    reason: 'Filled the blank with the correct answer.',
    line: fillGap(question.question, correct),
    choices: answers,
    languageWarnings: [],
  }
}

/**
 * A multiple-choice stem with two to four choices is already a worksheet line.
 * A gap stays a blank. Sorting and matching JSON is not a line.
 */
export function localWorksheetAssessment(question: SourceQuestion): LessonAssessmentItem | null {
  if (!isMultipleChoice(String(question.type))) return null
  if (isStructuredCorrectAnswer(question.correctAnswer)) return null
  const stem = question.question.trim()
  if (!stem) return null
  const answers = usableAnswers(question.answers)
  const correct = question.correctAnswer.trim()
  if (answers.length < 2 || answers.length > 4 || !answers.includes(correct)) return null
  const gap = BLANK.test(question.question)
  return {
    questionId: question.id?.trim() || '',
    sourceQuestion: question.question,
    sourceAnswers: [...question.answers],
    correctAnswer: question.correctAnswer,
    type: String(question.type),
    imageUrl: question.imageUrl ?? null,
    compatible: true,
    converted: false,
    reason: gap
      ? 'The blank stays empty on the paper.'
      : 'This multiple-choice item can be printed as written.',
    line: worksheetStem(question.question),
    choices: answers,
    languageWarnings: [],
  }
}

function refused(question: SourceQuestion, questionId: string, reason: string): LessonAssessmentItem {
  return {
    questionId,
    sourceQuestion: question.question,
    sourceAnswers: [...question.answers],
    correctAnswer: question.correctAnswer,
    type: String(question.type),
    imageUrl: question.imageUrl ?? null,
    compatible: false,
    converted: false,
    reason,
    line: question.question,
    choices: usableAnswers(question.answers).slice(0, 4),
    languageWarnings: [],
  }
}

const modelItemSchema = z.object({
  id: z.string().min(1),
  compatible: z.boolean(),
  reason: z.string().max(400).optional(),
  line: z.string().max(500).optional(),
  choices: z.array(z.string().max(120)).max(4).optional(),
})

export function parseModelAssessments(raw: string): z.infer<typeof modelItemSchema>[] {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start < 0 || end <= start) {
    throw new Error('The AI returned an invalid assessment.')
  }
  const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1))
  return z.array(modelItemSchema).parse(parsed)
}

export function lessonAssessmentPrompt(
  target: LessonTarget,
  questions: Array<SourceQuestion & { questionId: string }>
): string {
  const task =
    target === 'sentence-builder'
      ? `Turn each item into one English sentence a student can build, or say it does not fit.
The sentence should use the correct answer as one of its words when that is honest.
Do not invent extra forms of a word. Do not add three more versions of "he" or of the object.
A vocabulary question such as "What color is the sky?" / Blue is not a sentence yet. You may offer one sentence, or set compatible to false.`
      : `Turn each item into a worksheet line: either a plain sentence, or a short question with up to four choices to circle.
A gap should stay a blank, written as ______.
Do not print raw JSON. Sorting and matching lists are not worksheet lines until you rewrite them as a sentence or a circle-the-answer line.`

  return `You check saved quiz questions for a classroom activity. Do not invent a new quiz.

Target: ${target}

${task}

Return only a JSON array. One object per input id:
{"id":"...","compatible":true,"reason":"short reason","line":"the sentence or worksheet line","choices":["optional","up to four"]}
When compatible is false, still include a short reason and omit line or leave it empty.
Keep reasons under 20 words.

Questions:
${JSON.stringify(
  questions.map((question) => ({
    id: question.questionId,
    question: question.question,
    answers: question.answers,
    correctAnswer: question.correctAnswer,
    type: question.type,
    imageUrl: question.imageUrl ?? null,
  }))
)}`
}

function applyModelItem(
  question: SourceQuestion,
  questionId: string,
  model: z.infer<typeof modelItemSchema> | undefined
): LessonAssessmentItem {
  if (!model) {
    return refused(question, questionId, 'This question could not be converted.')
  }
  const line = model.line?.trim() ?? ''
  const looksLikeJson = line.startsWith('[') || line.startsWith('{')
  if (!model.compatible || !line || looksLikeJson) {
    return refused(
      question,
      questionId,
      model.reason?.trim() ||
        (looksLikeJson ? 'The raw answer list is not a worksheet line.' : 'This question does not fit.')
    )
  }
  const choices = (model.choices ?? [])
    .map((choice) => choice.trim())
    .filter(Boolean)
    .slice(0, 4)
  return {
    questionId,
    sourceQuestion: question.question,
    sourceAnswers: [...question.answers],
    correctAnswer: question.correctAnswer,
    type: String(question.type),
    imageUrl: question.imageUrl ?? null,
    compatible: true,
    converted: true,
    reason: model.reason?.trim() || 'Rewritten for this activity.',
    line,
    choices,
    languageWarnings: [],
  }
}

function withWarnings(item: LessonAssessmentItem, level: CefrLevelId): LessonAssessmentItem {
  const audit = auditQuestion(
    {
      question: item.line,
      answers: item.choices,
      correctAnswer: item.correctAnswer,
    },
    level
  )
  return { ...item, languageWarnings: audit.issues }
}

function practiceItem(draft: PracticeDraft, level: CefrLevelId): LessonAssessmentItem {
  const finished = finishDraft(draft)
  return withWarnings(
    {
      questionId: finished.questionId || '',
      sourceQuestion: finished.sourceQuestion,
      sourceAnswers: finished.choices,
      correctAnswer: finished.correctAnswer,
      type: QuestionType.MULTIPLE_CHOICE,
      imageUrl: finished.imageUrl ?? null,
      compatible: true,
      converted: true,
      reason: finished.reason,
      line: finished.line,
      choices: finished.choices,
      activity: finished.activity,
      exercise: finished.exercise,
      languageWarnings: [],
    },
    level
  )
}

function sourcePractice(question: SourceQuestion) {
  return {
    id: question.id,
    question: question.question,
    answers: question.answers,
    correctAnswer: question.correctAnswer,
    imageUrl: question.imageUrl,
  }
}

/**
 * The worksheet check reads the unit grammar and writes a short practice set.
 * A valid model mix is kept. Otherwise the same activity mix is written here.
 */
async function assessWorksheet(input: {
  questions: SourceQuestion[]
  level: CefrLevelId
  grammar?: string[]
  title?: string
  description?: string
  scope?: 'set' | 'item'
  generate?: (prompt: string) => Promise<string>
}): Promise<LessonAssessmentItem[]> {
  const practiceInput = {
    grammar: input.grammar,
    title: input.title,
    description: input.description,
    questions: input.questions.map(sourcePractice),
  }
  if (input.scope === 'item') {
    const source = input.questions[0]
    const line = source ? finishWorksheetSentence(worksheetStem(source.question)) : ''
    if (!source || !line) return []
    const gap = BLANK.test(source.question)
    return [
      practiceItem(
        {
          activity: gap ? 'gap' : line.endsWith('?') ? 'question' : 'practice',
          line,
          choices: gap ? usableAnswers(source.answers).slice(0, 4) : [],
          questionId: source.id,
          imageUrl: source.imageUrl,
          correctAnswer: isStructuredCorrectAnswer(source.correctAnswer) ? '' : source.correctAnswer.trim(),
          reason: 'One practice line from this question.',
          sourceQuestion: source.question,
        },
        input.level
      ),
    ]
  }

  if (input.generate) {
    try {
      const raw = await input.generate(worksheetPracticePrompt(practiceInput))
      const parsed = parseWorksheetPractice(raw)
      if (parsed) {
        const byId = new Map(
          input.questions.filter((question) => question.id).map((question) => [question.id as string, question])
        )
        return parsed.map((item) => {
          const source = item.questionId ? byId.get(item.questionId) : undefined
          return practiceItem(
            {
              activity: item.activity,
              line: item.line,
              choices: item.choices ?? [],
              questionId: item.questionId,
              imageUrl: source?.imageUrl,
              correctAnswer: '',
              reason: item.reason?.trim() || item.exercise || `Practice for ${practiceInput.title || 'this grammar'}.`,
              sourceQuestion: source?.question || practiceInput.title || 'Grammar practice',
              exercise: item.exercise,
            },
            input.level
          )
        })
      }
    } catch {
      // The grammar set below still gives the teacher a worksheet to review.
    }
  }

  return grammarPracticeDrafts(practiceInput).map((draft) => practiceItem(draft, input.level))
}

/**
 * Sentence builder: local rules run first, and the model only sees the rest.
 * Worksheet: the check writes grammar practice instead of copying the quiz.
 * Lexicon warnings are attached and never drop a row.
 */
export async function assessLessonQuestions(input: {
  target: LessonTarget
  questions: SourceQuestion[]
  level: CefrLevelId
  grammar?: string[]
  title?: string
  description?: string
  scope?: 'set' | 'item'
  generate?: (prompt: string) => Promise<string>
}): Promise<LessonAssessmentItem[]> {
  if (input.target === 'worksheet') {
    return assessWorksheet(input)
  }

  const keyed = input.questions.map((question, index) => ({
    question,
    questionId: question.id?.trim() || `item-${index}`,
  }))

  const pending: typeof keyed = []
  const local = new Map<string, LessonAssessmentItem>()

  for (const entry of keyed) {
    const assessed = localSentenceAssessment(entry.question)
    if (assessed) {
      local.set(entry.questionId, { ...assessed, questionId: entry.questionId })
    } else {
      pending.push(entry)
    }
  }

  const modelById = new Map<string, z.infer<typeof modelItemSchema>>()
  let modelFailure = ''
  if (pending.length > 0) {
    if (!input.generate) {
      modelFailure = 'This question needs a teacher edit before it can be used.'
    } else {
      try {
        const raw = await input.generate(
          lessonAssessmentPrompt(
            input.target,
            pending.map((entry) => ({ ...entry.question, questionId: entry.questionId }))
          )
        )
        for (const item of parseModelAssessments(raw)) {
          modelById.set(item.id, item)
        }
      } catch (error) {
        modelFailure =
          error instanceof Error && error.message.includes('not configured')
            ? 'AI assessment is not configured, so this question was left for you to edit or reject.'
            : 'This question could not be converted.'
      }
    }
  }

  return keyed.map((entry) => {
    const ready = local.get(entry.questionId)
    const item =
      ready ??
      (modelFailure
        ? refused(entry.question, entry.questionId, modelFailure)
        : applyModelItem(entry.question, entry.questionId, modelById.get(entry.questionId)))
    return withWarnings(item, input.level)
  })
}

/** Only approved rows are kept. Nothing here is written back onto a Question. */
export function commitLessonSelection(
  target: LessonTarget,
  rows: LessonReviewRow[]
):
  | { ok: true; worksheetItems: WorksheetItem[]; sentences: LessonSentence[] }
  | { ok: false; message: string } {
  const approved = rows.filter((row) => row.status === 'approved' && row.line.trim())
  if (approved.length === 0) {
    return { ok: false, message: 'Approve at least one item before continuing.' }
  }
  if (target === 'worksheet') {
    return {
      ok: true,
      sentences: [],
      worksheetItems: approved.map((row) => ({
        questionId: row.questionId,
        line: finishWorksheetSentence(row.line),
        imageUrl: isRealPicture(row.imageUrl) ? row.imageUrl : undefined,
        choices: (row.choices ?? []).map((choice) => choice.trim()).filter(Boolean),
        ...(row.activity ? { activity: row.activity } : {}),
        ...(row.exercise ? { exercise: row.exercise } : {}),
      })),
    }
  }
  return {
    ok: true,
    worksheetItems: [],
    sentences: approved.map((row) => ({
      text: row.line.trim(),
      questionId: row.questionId,
      imageUrl: isRealPicture(row.imageUrl) ? row.imageUrl : undefined,
    })),
  }
}
