import { NextRequest } from 'next/server'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { startAttemptSchema } from '@/lib/homework/schemas'
import { HomeworkError, startAttempt } from '@/lib/homework/service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ token: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params
    const parsed = startAttemptSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse('Enter your name to start.', parsed.error.flatten(), 400)
    }
    const state = await startAttempt(token, parsed.data)
    return successResponse(state, 201)
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'POST /api/homework-session/[token]/attempts')
  }
}
