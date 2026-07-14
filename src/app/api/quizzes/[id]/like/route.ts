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
      `Find quiz for like ${quizId}`
    )

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const existing = await prisma.quizLike.findUnique({
      where: { quizId_userId: { quizId, userId } },
    })

    let liked: boolean
    const stats = getQuizStatistics(quiz.statistics)

    if (existing) {
      await prisma.$transaction([
        prisma.quizLike.delete({ where: { id: existing.id } }),
        prisma.quiz.update({
          where: { id: quizId },
          data: {
            statistics: toStatisticsJson({
              ...stats,
              likes: Math.max(0, stats.likes - 1),
            }),
          },
        }),
      ])
      liked = false
      stats.likes = Math.max(0, stats.likes - 1)
    } else {
      await prisma.$transaction([
        prisma.quizLike.create({ data: { quizId, userId } }),
        prisma.quiz.update({
          where: { id: quizId },
          data: {
            statistics: toStatisticsJson({
              ...stats,
              likes: stats.likes + 1,
            }),
          },
        }),
      ])
      liked = true
      stats.likes += 1
    }

    return NextResponse.json({ data: { liked, likes: stats.likes } })
  } catch (error) {
    console.error('Failed to toggle like:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to toggle like: ${message}` }, { status: 500 })
  }
}
