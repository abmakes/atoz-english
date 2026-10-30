import { NextRequest } from 'next/server'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { getSessionByToken } from '@/lib/thoughts/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ token: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params
    const session = await getSessionByToken(token)
    if (!session) return errorResponse('This activity is not available.', undefined, 404)
    return successResponse(session)
  } catch (error) {
    return handleApiError(error, 'GET /api/thought-session/[token]')
  }
}
