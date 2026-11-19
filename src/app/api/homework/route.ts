import { NextRequest } from 'next/server'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { homeworkCreateSchema } from '@/lib/homework/schemas'
import { HomeworkError, createHomeworkAssignment } from '@/lib/homework/service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const parsed = homeworkCreateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse('Give the assignment a title and a due date.', parsed.error.flatten(), 400)
    }
    const dueAt = new Date(parsed.data.dueAt)
    if (Number.isNaN(dueAt.getTime())) {
      return errorResponse('That due date is not valid.', undefined, 400)
    }
    const created = await createHomeworkAssignment(authResult.userId, {
      quizId: parsed.data.quizId,
      title: parsed.data.title,
      dueAt,
    })
    return successResponse(created, 201)
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'POST /api/homework')
  }
}
