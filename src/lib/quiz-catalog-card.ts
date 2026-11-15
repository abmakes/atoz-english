import { getQuizStatistics } from '@/lib/quiz-statistics'
import { levelFromTags, levelLabelFromId } from '@/lib/taxonomy/quiz-taxonomy'
import type { QuizDefaultSettings, QuizListItem } from '@/types/gameTypes'

export const QUIZ_CATALOG_TAG = 'quiz-catalog'
export const CATALOG_PLACEHOLDER_IMAGE = '/images/placeholder.webp'

export interface QuizCatalogSource {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  tags: string[] | null
  statistics: unknown
  defaultSettings: unknown
  authorId: string | null
  createdAt: Date | string
  questionCount: number
}

function readDefaultSettings(raw: unknown): QuizDefaultSettings | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  return raw as QuizDefaultSettings
}

/**
 * Catalog cards are titles, covers, and counts. Question text stays on the quiz page.
 */
export function mapQuizRowToCatalogCard(row: QuizCatalogSource): QuizListItem {
  const tags = row.tags ?? []
  const levelId = levelFromTags(tags)
  const createdAt = row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    imageUrl: row.imageUrl || CATALOG_PLACEHOLDER_IMAGE,
    statistics: getQuizStatistics(row.statistics),
    tags,
    authorId: row.authorId || 'admin',
    createdAt,
    questionCount: row.questionCount,
    likedByMe: false,
    favoritedByMe: false,
    level: levelId ? levelLabelFromId(levelId) : undefined,
    defaultSettings: readDefaultSettings(row.defaultSettings),
  }
}

/**
 * CI builds with a localhost stub database. Skip that query so `next build`
 * does not wait on a connection that will never open. A real hosted URL
 * still runs, so production HTML can include the catalog.
 */
export function shouldSkipCatalogQuery(): boolean {
  if (process.env.NEXT_PHASE !== 'phase-production-build') return false
  const url =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ''
  if (!url) return true
  return /localhost|127\.0\.0\.1/i.test(url)
}
