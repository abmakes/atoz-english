import type { QuestionData } from '@/types'
import { QuestionType } from '@/types/question_types'
import type { QuestionHandlingConfig } from '@/lib/pixi-engine/config/GameConfig'
import { QuestionSequencer } from '@/lib/pixi-engine/game/QuestionSequencer'

export interface RuntimeQuizData {
  id: string
  title: string
  description?: string | null
  quizType: QuestionType
  questions: QuestionData[]
}

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

/** Window.fetch throws "Illegal invocation" if called without a window receiver. */
const boundFetch: FetchLike = (input, init) => globalThis.fetch(input, init)

/**
 * Fetches and validates quiz content without preloading renderer-specific
 * media. Pixi data managers may keep their AssetLoader path; Three games use
 * this source and choose TextureLoader/GLTFLoader only when required.
 */
export class QuizDataSource {
  constructor(private readonly fetcher: FetchLike = boundFetch) {}

  public async loadQuiz(quizId: string): Promise<RuntimeQuizData> {
    if (!quizId.trim()) {
      throw new Error('QuizDataSource requires a quiz id.')
    }

    const response = await this.fetcher(`/api/quizzes/${quizId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Quiz request failed: ${response.status} ${response.statusText}`)
    }

    const body: unknown = await response.json()
    const candidate = unwrapQuiz(body)
    return parseQuiz(candidate, quizId)
  }

  public createSequencer(
    quiz: RuntimeQuizData,
    numberOfTeams: number,
    config: QuestionHandlingConfig
  ): QuestionSequencer {
    return new QuestionSequencer(quiz.questions, numberOfTeams, config)
  }
}

function unwrapQuiz(body: unknown): unknown {
  if (!isRecord(body)) return body
  return 'data' in body ? body.data : body
}

function parseQuiz(candidate: unknown, requestedId: string): RuntimeQuizData {
  if (!isRecord(candidate)) {
    throw new Error('Quiz API returned an invalid object.')
  }
  if (!Array.isArray(candidate.questions)) {
    throw new Error('Quiz API response is missing questions.')
  }

  const questions = candidate.questions.map((question, index) =>
    parseQuestion(question, index)
  )

  return {
    id: typeof candidate.id === 'string' ? candidate.id : requestedId,
    title: typeof candidate.title === 'string' ? candidate.title : 'Untitled Quiz',
    description:
      typeof candidate.description === 'string' || candidate.description === null
        ? candidate.description
        : undefined,
    quizType: parseQuestionType(candidate.quizType) ?? QuestionType.MULTIPLE_CHOICE,
    questions,
  }
}

function parseQuestion(candidate: unknown, index: number): QuestionData {
  if (!isRecord(candidate)) {
    throw new Error(`Quiz question ${index + 1} is invalid.`)
  }
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.question !== 'string' ||
    !Array.isArray(candidate.answers) ||
    !candidate.answers.every((answer) => typeof answer === 'string') ||
    typeof candidate.correctAnswer !== 'string'
  ) {
    throw new Error(`Quiz question ${index + 1} has an invalid shape.`)
  }

  const type = parseQuestionType(candidate.type)
  if (!type) {
    throw new Error(`Quiz question ${index + 1} has an unsupported type.`)
  }

  return {
    id: candidate.id,
    question: candidate.question,
    answers: candidate.answers,
    correctAnswer: candidate.correctAnswer,
    type,
    imageUrl: typeof candidate.imageUrl === 'string' ? candidate.imageUrl : undefined,
    quizId: typeof candidate.quizId === 'string' ? candidate.quizId : undefined,
  }
}

function parseQuestionType(value: unknown): QuestionType | null {
  if (typeof value !== 'string') return null
  return Object.values(QuestionType).includes(value as QuestionType)
    ? (value as QuestionType)
    : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
