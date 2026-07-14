import { NextRequest, NextResponse } from 'next/server'
import { prisma, withDatabaseRetry } from '@/lib/prisma'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { getQuizStatistics, toStatisticsJson } from '@/lib/quiz-statistics'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { userId } = authResult
    const { id: quizId } = await params

    const quiz = await withDatabaseRetry(
      () => prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true, statistics: true } }),
      `Find quiz for favorite ${quizId}`
    )

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const existing = await prisma.quizFavorite.findUnique({
      where: { quizId_userId: { quizId, userId } },
    })

    let favorited: boolean
    const stats = getQuizStatistics(quiz.statistics)

    if (existing) {
      await prisma.$transaction([
        prisma.quizFavorite.delete({ where: { id: existing.id } }),
        prisma.quiz.update({
          where: { id: quizId },
          data: {
            statistics: toStatisticsJson({
              ...stats,
              favoritesCount: Math.max(0, stats.favoritesCount - 1),
            }),
          },
        }),
      ])
      favorited = false
      stats.favoritesCount = Math.max(0, stats.favoritesCount - 1)
    } else {
      await prisma.$transaction([
        prisma.quizFavorite.create({ data: { quizId, userId } }),
        prisma.quiz.update({
          where: { id: quizId },
          data: {
            statistics: toStatisticsJson({
              ...stats,
              favoritesCount: stats.favoritesCount + 1,
            }),
          },
        }),
      ])
      favorited = true
      stats.favoritesCount += 1
    }

    return NextResponse.json({
      data: { favorited, favoritesCount: stats.favoritesCount },
    })
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to toggle favorite: ${message}` }, { status: 500 })
  }
}
