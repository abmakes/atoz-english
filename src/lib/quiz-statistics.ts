import { Prisma } from '../../prisma/app/generated/prisma/client'
import {
  DEFAULT_QUIZ_STATISTICS,
  normalizeQuizStatistics,
  type QuizStatistics,
} from '@/lib/schemas'

/**
 * Parse Quiz.statistics JSON into a typed aggregate object.
 */
export function getQuizStatistics(raw: unknown): QuizStatistics {
  return normalizeQuizStatistics(raw)
}

/**
 * Build a Prisma JSON value for statistics updates.
 */
export function toStatisticsJson(stats: QuizStatistics): Prisma.InputJsonValue {
  return {
    likes: stats.likes,
    favoritesCount: stats.favoritesCount,
    playsCount: stats.playsCount,
  }
}

export function emptyStatisticsJson(): Prisma.InputJsonValue {
  return toStatisticsJson({ ...DEFAULT_QUIZ_STATISTICS })
}

/**
 * Sort quizzes in-memory by engagement counters (v1 — JSON field).
 */
export function sortByStatistics<T extends { statistics?: unknown; createdAt?: Date | string | null }>(
  quizzes: T[],
  sort: 'newest' | 'likes' | 'plays' | 'favorites'
): T[] {
  const copy = [...quizzes]
  if (sort === 'newest') {
    return copy.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
  }

  return copy.sort((a, b) => {
    const aStats = getQuizStatistics(a.statistics)
    const bStats = getQuizStatistics(b.statistics)
    if (sort === 'likes') return bStats.likes - aStats.likes
    if (sort === 'plays') return bStats.playsCount - aStats.playsCount
    return bStats.favoritesCount - aStats.favoritesCount
  })
}
