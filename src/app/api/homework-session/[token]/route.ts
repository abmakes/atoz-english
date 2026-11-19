import { NextRequest } from 'next/server'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { clientKeySchema } from '@/lib/homework/schemas'
import { HomeworkError, getHomeworkSession } from '@/lib/homework/service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ token: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params
    const clientKey = request.nextUrl.searchParams.get('clientKey')
    const parsedKey = clientKey ? clientKeySchema.safeParse(clientKey) : null
    if (parsedKey && !parsedKey.success) {
      return errorResponse('That device key is not valid.', undefined, 400)
    }
    const session = await getHomeworkSession(token, parsedKey?.success ? parsedKey.data : undefined)
    return successResponse(session)
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'GET /api/homework-session/[token]')
  }
}
