import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { prisma, withDatabaseRetry } from '@/lib/prisma'
import {
  mapQuizRowToCatalogCard,
  QUIZ_CATALOG_TAG,
  shouldSkipCatalogQuery,
} from '@/lib/quiz-catalog-card'
import { backfillMissingPlayability } from '@/lib/quiz-summary'
import { sortByStatistics } from '@/lib/quiz-statistics'
import type { QuizSort } from '@/lib/schemas'
import type { QuizListItem } from '@/types/gameTypes'

export { QUIZ_CATALOG_TAG, shouldSkipCatalogQuery }

const loadPublicCatalogCards = unstable_cache(
  async (): Promise<QuizListItem[]> => {
    try {
      await backfillMissingPlayability()
    } catch (error) {
      console.warn('Playability backfill failed:', error)
    }
    const rows = await withDatabaseRetry(
      () =>
        prisma.quiz.findMany({
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            tags: true,
            statistics: true,
            defaultSettings: true,
            authorId: true,
            createdAt: true,
            questionCount: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
      'Fetching quiz catalog'
    )

    return rows.map((row) =>
      mapQuizRowToCatalogCard({
        id: row.id,
        title: row.title,
        description: row.description,
        imageUrl: row.imageUrl,
        tags: row.tags,
        statistics: row.statistics,
        defaultSettings: row.defaultSettings,
        authorId: row.authorId,
        createdAt: row.createdAt,
        questionCount: row.questionCount,
      })
    )
  },
  ['public-quiz-catalog'],
  { revalidate: 60, tags: [QUIZ_CATALOG_TAG] }
)

/** Public games grid. Question rows are not loaded. */
export async function getPublicQuizCatalog(sort: QuizSort = 'newest'): Promise<QuizListItem[]> {
  if (shouldSkipCatalogQuery()) return []
  const cards = await loadPublicCatalogCards()
  return sortByStatistics(cards, sort)
}

export async function withCatalogEngagement(
  cards: QuizListItem[],
  userId: string
): Promise<QuizListItem[]> {
  if (cards.length === 0) return cards
  const quizIds = cards.map((card) => card.id)
  try {
    const [likes, favorites] = await Promise.all([
      prisma.quizLike.findMany({
        where: { userId, quizId: { in: quizIds } },
        select: { quizId: true },
      }),
      prisma.quizFavorite.findMany({
        where: { userId, quizId: { in: quizIds } },
        select: { quizId: true },
      }),
    ])
    const likedSet = new Set(likes.map((like) => like.quizId))
    const favoritedSet = new Set(favorites.map((favorite) => favorite.quizId))
    return cards.map((card) => ({
      ...card,
      likedByMe: likedSet.has(card.id),
      favoritedByMe: favoritedSet.has(card.id),
    }))
  } catch (error) {
    console.warn('Skipping likedByMe/favoritedByMe enrichment:', error)
    return cards
  }
}

export function revalidateQuizCatalog(): void {
  revalidateTag(QUIZ_CATALOG_TAG)
  revalidatePath('/games')
  revalidatePath('/games/[quizId]', 'page')
}
