import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-utils'
import { openPrivateAudio } from '@/lib/thoughts/audio-store'

export async function privateAudioResponse(
  audioPath: string,
  mimeType: string
): Promise<NextResponse> {
  const opened = await openPrivateAudio(audioPath)
  if (!opened) return errorResponse('Recording not found', undefined, 404)
  return new NextResponse(opened.stream, {
    status: 200,
    headers: {
      'Content-Type': opened.contentType || mimeType,
      'Cache-Control': 'private, no-store',
    },
  })
}
