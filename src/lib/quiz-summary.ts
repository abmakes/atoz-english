import { Prisma } from '../../prisma/app/generated/prisma/client'
import { prisma, withDatabaseRetry } from '@/lib/prisma'
import { CATALOG_PLACEHOLDER_IMAGE, shouldSkipCatalogQuery } from '@/lib/quiz-catalog-card'
import {
  computeQuizPlayability,
  parseQuizPlayability,
  type QuizPickerSummary,
  type QuizPlayability,
} from '@/lib/quiz-playability'
import { getQuizStatistics } from '@/lib/quiz-statistics'
import type { QuizDefaultSettings } from '@/types/gameTypes'

export type { QuizPickerSummary }

const PLAYABILITY_QUESTION_SELECT = {
  type: true,
  answers: true,
  correctAnswer: true,
} as const

function readDefaultSettings(raw: unknown): QuizDefaultSettings | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  return raw as QuizDefaultSettings
}

export function playabilityJson(playability: QuizPlayability): Prisma.InputJsonValue {
  return {
    splashDash: {
      eligible: playability.splashDash.eligible,
      reason: playability.splashDash.reason,
    },
    ninjaClimb: {
      eligible: playability.ninjaClimb.eligible,
      reason: playability.ninjaClimb.reason,
    },
    tugOfWar: {
      eligible: playability.tugOfWar.eligible,
      reason: playability.tugOfWar.reason,
    },
  }
}

export function quizPlayabilityFields(
  quizType: string | null | undefined,
  questions: Array<{ type?: string | null; answers?: string[] | null; correctAnswer?: string | null }>
): { questionCount: number; playability: Prisma.InputJsonValue } {
  const playability = computeQuizPlayability({ quizType, questions })
  return {
    questionCount: questions.length,
    playability: playabilityJson(playability),
  }
}

async function persistPlayability(
  quizId: string,
  quizType: string | null | undefined,
  questions: Array<{ type?: string | null; answers?: string[] | null; correctAnswer?: string | null }>
): Promise<{ questionCount: number; playability: QuizPlayability }> {
  const playability = computeQuizPlayability({ quizType, questions })
  const questionCount = questions.length
  try {
    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        questionCount,
        playability: playabilityJson(playability),
      },
    })
  } catch (error) {
    console.warn('Failed to persist quiz playability:', error)
  }
  return { questionCount, playability }
}

/**
 * Fill playability for quizzes that only have a question count from the SQL backfill.
 * Loads answer lengths, not question text.
 */
export async function backfillMissingPlayability(): Promise<void> {
  if (shouldSkipCatalogQuery()) return

  const missing = await withDatabaseRetry(
    () =>
      prisma.quiz.findMany({
        where: { playability: { equals: Prisma.DbNull } },
        select: {
          id: true,
          quizType: true,
          questions: { select: PLAYABILITY_QUESTION_SELECT },
        },
      }),
    'Finding quizzes missing playability'
  )

  if (missing.length === 0) return

  await Promise.all(
    missing.map((quiz) => persistPlayability(quiz.id, quiz.quizType, quiz.questions))
  )
}

const pickerSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  quizType: true,
  tags: true,
  statistics: true,
  defaultSettings: true,
  questionCount: true,
  playability: true,
} as const

/** One Quiz row for the mode picker. Question bodies stay off this path. */
export async function getQuizPickerSummary(quizId: string): Promise<QuizPickerSummary | null> {
  if (shouldSkipCatalogQuery() || !quizId) return null

  const row = await withDatabaseRetry(
    () =>
      prisma.quiz.findUnique({
        where: { id: quizId },
        select: pickerSelect,
      }),
    `Fetching quiz picker summary ${quizId}`
  )

  if (!row) return null

  let playability = parseQuizPlayability(row.playability)
  let questionCount = row.questionCount

  if (!playability) {
    const questions = await prisma.question.findMany({
      where: { quizId },
      select: PLAYABILITY_QUESTION_SELECT,
    })
    const persisted = await persistPlayability(quizId, row.quizType, questions)
    playability = persisted.playability
    questionCount = persisted.questionCount
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    imageUrl: row.imageUrl || CATALOG_PLACEHOLDER_IMAGE,
    tags: row.tags ?? [],
    statistics: getQuizStatistics(row.statistics),
    defaultSettings: readDefaultSettings(row.defaultSettings),
    questionCount,
    playability,
  }
}
