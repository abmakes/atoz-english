import { NextRequest } from 'next/server'
import { errorResponse, handleApiError } from '@/lib/api-utils'
import { privateAudioResponse } from '@/lib/thoughts/audio-response'
import { findClassAudio } from '@/lib/thoughts/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ token: string; submissionId: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token, submissionId } = await context.params
    const audio = await findClassAudio(token, submissionId)
    if (!audio) return errorResponse('Recording not found', undefined, 404)
    return privateAudioResponse(audio.audioPath, audio.mimeType)
  } catch (error) {
    return handleApiError(error, 'GET /api/thought-session/[token]/submissions/[submissionId]/audio')
  }
}
