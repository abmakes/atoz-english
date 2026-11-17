import { NextRequest } from 'next/server'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { clientKeySchema } from '@/lib/homework/schemas'
import { HomeworkError, finishHomework, readAttempt } from '@/lib/homework/service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ token: string; attemptId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token, attemptId } = await context.params
    const parsed = clientKeySchema.safeParse(request.nextUrl.searchParams.get('clientKey'))
    if (!parsed.success) return errorResponse('That device key is not valid.', undefined, 400)
    return successResponse(await readAttempt(token, attemptId, parsed.data))
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'GET homework attempt')
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token, attemptId } = await context.params
    const body = (await request.json()) as { clientKey?: string }
    const parsed = clientKeySchema.safeParse(body.clientKey)
    if (!parsed.success) return errorResponse('That device key is not valid.', undefined, 400)
    return successResponse(await finishHomework(token, attemptId, parsed.data))
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'POST finish homework')
  }
}
