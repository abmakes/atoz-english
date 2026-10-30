import { NextRequest } from 'next/server'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { errorResponse, handleApiError } from '@/lib/api-utils'
import { privateAudioResponse } from '@/lib/thoughts/audio-response'
import { findOwnedAudio } from '@/lib/thoughts/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string; submissionId: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { id, submissionId } = await context.params
    const audio = await findOwnedAudio(authResult.userId, id, submissionId)
    if (!audio) return errorResponse('Recording not found', undefined, 404)
    return privateAudioResponse(audio.audioPath, audio.mimeType)
  } catch (error) {
    return handleApiError(error, 'GET /api/thoughts/[id]/submissions/[submissionId]/audio')
  }
}
