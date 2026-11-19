import { NextRequest } from 'next/server'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { challengeAnswerSchema, saveAnswerSchema } from '@/lib/homework/schemas'
import { HomeworkError, answerChallenge, saveHomeworkAnswer } from '@/lib/homework/service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ token: string; attemptId: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token, attemptId } = await context.params
    const body: unknown = await request.json()
    const mode = typeof body === 'object' && body && 'mode' in body ? (body as { mode?: string }).mode : undefined
    if (mode === 'CHALLENGE') {
      const parsed = challengeAnswerSchema.safeParse(body)
      if (!parsed.success) return errorResponse('That answer could not be saved.', parsed.error.flatten(), 400)
      return successResponse(await answerChallenge(token, attemptId, parsed.data))
    }
    const parsed = saveAnswerSchema.safeParse(body)
    if (!parsed.success) return errorResponse('Choose an answer.', parsed.error.flatten(), 400)
    return successResponse(await saveHomeworkAnswer(token, attemptId, parsed.data))
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'POST homework answer')
  }
}
