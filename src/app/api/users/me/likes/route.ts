import { NextResponse } from 'next/server'
import { prisma, withDatabaseRetry } from '@/lib/prisma'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { getQuizStatistics } from '@/lib/quiz-statistics'

export const dynamic = 'force-dynamic'

const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

export async function GET() {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { userId } = authResult

    const likes = await withDatabaseRetry(
      () =>
        prisma.quizLike.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                quizType: true,
                tags: true,
                statistics: true,
                defaultSettings: true,
                authorId: true,
                createdAt: true,
                updatedAt: true,
                questions: {
                  select: {
                    id: true,
                    question: true,
                    answers: true,
                    correctAnswer: true,
                    imageUrl: true,
                    type: true,
                    quizId: true,
                  },
                },
              },
            },
          },
        }),
      'Fetching user likes'
    )

    const quizzes = likes.map((like) => {
      const quiz = like.quiz
      return {
        ...quiz,
        imageUrl: quiz.imageUrl ?? PLACEHOLDER_IMAGE,
        statistics: getQuizStatistics(quiz.statistics),
        tags: quiz.tags ?? [],
        likedByMe: true,
        favoritedByMe: false,
        questions: (quiz.questions || []).map((q) => ({
          ...q,
          imageUrl: q.imageUrl ?? PLACEHOLDER_IMAGE,
        })),
      }
    })

    const quizIds = quizzes.map((q) => q.id)
    if (quizIds.length > 0) {
      const favorites = await prisma.quizFavorite.findMany({
        where: { userId, quizId: { in: quizIds } },
        select: { quizId: true },
      })
      const favSet = new Set(favorites.map((f) => f.quizId))
      for (const quiz of quizzes) {
        quiz.favoritedByMe = favSet.has(quiz.id)
      }
    }

    return NextResponse.json({ data: quizzes })
  } catch (error) {
    console.error('Failed to fetch likes:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to fetch likes: ${message}` }, { status: 500 })
  }
}
