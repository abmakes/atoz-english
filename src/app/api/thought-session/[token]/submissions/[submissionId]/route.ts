import { NextRequest } from 'next/server'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { findClassClip } from '@/lib/thoughts/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ token: string; submissionId: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token, submissionId } = await context.params
    const clip = await findClassClip(token, submissionId)
    if (!clip) return errorResponse('This recording is not available.', undefined, 404)
    return successResponse(clip)
  } catch (error) {
    return handleApiError(error, 'GET /api/thought-session/[token]/submissions/[submissionId]')
  }
}
