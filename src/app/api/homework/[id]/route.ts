import { NextRequest } from 'next/server'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { homeworkPatchSchema } from '@/lib/homework/schemas'
import {
  HomeworkError,
  deleteHomeworkAssignment,
  getHomeworkReport,
  updateHomeworkAssignment,
} from '@/lib/homework/service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { id } = await context.params
    const report = await getHomeworkReport(authResult.userId, id)
    return successResponse(report)
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'GET /api/homework/[id]')
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { id } = await context.params
    const parsed = homeworkPatchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse('Invalid assignment update.', parsed.error.flatten(), 400)
    }
    const dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      return errorResponse('That due date is not valid.', undefined, 400)
    }
    const updated = await updateHomeworkAssignment(authResult.userId, id, {
      title: parsed.data.title,
      dueAt,
      acceptingResponses: parsed.data.acceptingResponses,
      showLeaderboard: parsed.data.showLeaderboard,
    })
    return successResponse(updated)
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'PATCH /api/homework/[id]')
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { id } = await context.params
    await deleteHomeworkAssignment(authResult.userId, id)
    return successResponse({ deleted: true })
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'DELETE /api/homework/[id]')
  }
}
