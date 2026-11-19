/**
 * Server-only profile query. Client components must import
 * `emptyProfileQuizLists` from `@/lib/profile-quiz-card` instead.
 * Importing this file pulls in Prisma, which throws in the browser.
 */
import { prisma, withDatabaseRetry } from '@/lib/prisma'
import {
  emptyProfileQuizLists,
  toProfileQuizCard,
  type ProfileQuizLists,
} from '@/lib/profile-quiz-card'
import { shouldSkipCatalogQuery } from '@/lib/quiz-catalog-card'

export type { ProfileQuizLists }
export { emptyProfileQuizLists }

const profileCardSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  quizType: true,
  tags: true,
  statistics: true,
  authorId: true,
  questionCount: true,
} as const

/**
 * Owned, liked, and favorited quizzes for one teacher.
 * Three slim reads in parallel. Question rows are not loaded.
 */
export async function getProfileQuizLists(userId: string): Promise<ProfileQuizLists> {
  if (shouldSkipCatalogQuery()) return emptyProfileQuizLists()

  const [owned, likes, favorites] = await withDatabaseRetry(
    () =>
      Promise.all([
        prisma.quiz.findMany({
          where: { authorId: userId },
          orderBy: { createdAt: 'desc' },
          select: profileCardSelect,
        }),
        prisma.quizLike.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { quiz: { select: profileCardSelect } },
        }),
        prisma.quizFavorite.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { quiz: { select: profileCardSelect } },
        }),
      ]),
    'Fetching profile quiz cards'
  )

  return {
    owned: owned.map(toProfileQuizCard),
    liked: likes.map((like) => toProfileQuizCard(like.quiz)),
    favorites: favorites.map((favorite) => toProfileQuizCard(favorite.quiz)),
  }
}
