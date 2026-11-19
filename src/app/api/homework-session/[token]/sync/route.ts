import { NextRequest } from 'next/server'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { homeworkSyncSchema } from '@/lib/homework/schemas'
import { HomeworkError, syncHomework } from '@/lib/homework/service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ token: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params
    const parsed = homeworkSyncSchema.safeParse(await request.json())
    if (!parsed.success) return errorResponse('That homework could not be saved.', parsed.error.flatten(), 400)
    return successResponse(await syncHomework(token, parsed.data))
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'POST homework sync')
  }
}
