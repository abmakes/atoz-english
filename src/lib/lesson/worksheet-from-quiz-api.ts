import {
  createTeacherFirstPrompt,
  parseGeneratedQuestions,
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
 * createTeacherFirstPrompt and parseGeneratedQuestions. A worksheet uses
 * those same two functions, once for each exercise.
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
    })
    return [item]
  }

  const plan = planWorksheetLayout()
  const questions = await writeBatch(input, {
    activity: 'question',
    count: plan.questions,
    shape: 'Wh-question',
    note: 'Each item is a real question a student can answer in writing. Do not turn a statement into a question by adding a question mark.',
  })
  const gaps = await writeBatch(input, {
    activity: 'gap',
    count: plan.gaps,
    shape: 'Fill the gap',
    note: 'Each question field is one sentence with ______ for the missing word. Give four different answers.',
  })
  const choices = await writeBatch(input, {
    activity: 'choice',
    count: plan.choices,
    shape: 'Wh-question',
    note: 'Each item is a different question about a picture. Give four different answers. Do not repeat a question.',
  })
  return [...questions, ...gaps, ...choices]
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
  }
): Promise<PracticeDraft[]> {
  let rejection = ''
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const written = await input.generate(promptFor(input, batch, rejection))
    try {
      return acceptBatch(parseGeneratedQuestions(written, batch.count), batch, input.questions)
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
  },
  rejection: string
): string {
  const examples = input.questions.slice(0, 4).map((question) => ({
    shape: batch.shape,
    question: question.question.replace(/\s+/g, ' ').trim().slice(0, 240),
    answerStyle: defaultAnswerStyleForShape(batch.shape),
  }))
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

function acceptBatch(
  items: GeneratedQuestionText[],
  batch: { activity: 'question' | 'gap' | 'choice' },
  sources: PracticeSource[]
): PracticeDraft[] {
  const seen = new Set<string>()
  const pictured = sources.filter((source) => source.imageUrl)
  return items.map((item, index) => {
    const answers = distinctAnswers(item)
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
      choices: batch.activity === 'question' ? [] : answers,
      correctAnswer: item.correctAnswer,
      reason: 'Written by the quiz question generator.',
      sourceQuestion: item.question,
      exercise: EXERCISE_TITLE[batch.activity],
      imageUrl: picture?.imageUrl,
      questionId: picture?.id,
    }
  })
}

function distinctAnswers(item: GeneratedQuestionText): string[] {
  const answers = item.answers.map((answer) => answer.trim()).filter(Boolean)
  const keys = answers.map((answer) => answer.toLowerCase())
  if (new Set(keys).size !== answers.length) {
    throw new Error('The AI returned duplicate answers.')
  }
  if (!answers.some((answer) => answer === item.correctAnswer.trim())) {
    throw new Error('The AI returned an answer key that is not one of the choices.')
  }
  return answers
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
