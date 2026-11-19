import { NextRequest } from 'next/server'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { challengeSyncSchema } from '@/lib/homework/schemas'
import { HomeworkError, submitChallenge } from '@/lib/homework/service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ token: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params
    const parsed = challengeSyncSchema.safeParse(await request.json())
    if (!parsed.success) return errorResponse('That challenge could not be saved.', parsed.error.flatten(), 400)
    return successResponse(await submitChallenge(token, parsed.data))
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'POST challenge sync')
  }
}
