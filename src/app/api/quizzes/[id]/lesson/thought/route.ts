import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openLessonThought } from '@/lib/lesson/open-lesson-thought'
import { studentThoughtPath } from '@/lib/lesson/thought-assignment'

export const runtime = 'nodejs'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { id: 'asc' } } },
    })
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    if (quiz.authorId !== authResult.userId) {
      return NextResponse.json({ error: 'This quiz is not on your profile.' }, { status: 403 })
    }

    const thought = await openLessonThought(authResult.userId, quiz)
    return NextResponse.json({
      data: {
        thought: {
          ...thought,
          studentPath: studentThoughtPath(thought.shareToken),
        },
      },
    })
  } catch (error) {
    console.error(`API Error in POST /api/quizzes/${id}/lesson/thought:`, error)
    return NextResponse.json({ error: 'Could not create the speaking assignment.' }, { status: 500 })
  }
}
