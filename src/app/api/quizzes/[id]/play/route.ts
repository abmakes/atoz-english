import { NextRequest, NextResponse } from 'next/server'
import { prisma, withDatabaseRetry } from '@/lib/prisma'
import { getQuizStatistics, toStatisticsJson } from '@/lib/quiz-statistics'

export const dynamic = 'force-dynamic'

/**
 * Increment playsCount. Public (no auth) — guests can play in class.
 * Client should call at most once per quiz per browser session.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params

    const quiz = await withDatabaseRetry(
      () => prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true, statistics: true } }),
      `Find quiz for play ${quizId}`
    )

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const stats = getQuizStatistics(quiz.statistics)
    const playsCount = stats.playsCount + 1

    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        statistics: toStatisticsJson({
          ...stats,
          playsCount,
        }),
      },
    })

    return NextResponse.json({ data: { playsCount } })
  } catch (error) {
    console.error('Failed to record play:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to record play: ${message}` }, { status: 500 })
  }
}
