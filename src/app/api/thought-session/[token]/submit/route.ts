import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { submissionsAccepted } from '@/lib/thoughts/access'
import { removePrivateAudio, savePrivateAudio } from '@/lib/thoughts/audio-store'
import {
  RECORDING_MAX_BYTES,
  audioExtension,
  isAllowedAudioMime,
  studentNameSchema,
  submissionMetaSchema,
} from '@/lib/thoughts/schemas'
import { resolveVoiceEffect } from '@/lib/thoughts/voices'

export const runtime = 'nodejs'
export const maxDuration = 60

type RouteContext = { params: Promise<{ token: string }> }

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  )
}

export async function POST(request: NextRequest, context: RouteContext) {
  let uploadedUrl: string | null = null
  try {
    const { token } = await context.params
    const challenge = await prisma.thoughtChallenge.findUnique({
      where: { shareToken: token },
    })
    if (!challenge || !submissionsAccepted(challenge.status, challenge.acceptingResponses)) {
      return errorResponse(
        challenge?.status === 'READY'
          ? 'Your teacher has closed new recordings.'
          : 'This activity is not available.',
        undefined,
        challenge?.status === 'READY' ? 403 : 404
      )
    }

    const formData = await request.formData()
    const nameResult = studentNameSchema.safeParse(formData.get('studentName'))
    if (!nameResult.success) {
      return errorResponse('Add a first name or class nickname.', undefined, 400)
    }

    let metaRaw: unknown
    try {
      metaRaw = JSON.parse(String(formData.get('meta') ?? ''))
    } catch {
      return errorResponse('Invalid submission.', undefined, 400)
    }
    const metaResult = submissionMetaSchema.safeParse(metaRaw)
    if (!metaResult.success) {
      return errorResponse('Invalid submission.', metaResult.error.flatten(), 400)
    }
    const meta = metaResult.data

    const existing = await prisma.thoughtSubmission.findUnique({
      where: {
        challengeId_clientKey: {
          challengeId: challenge.id,
          clientKey: meta.clientKey,
        },
      },
    })
    if (existing) {
      return successResponse({ submissionId: existing.id, duplicate: true })
    }

    const file = formData.get('audio')
    if (!(file instanceof File) || file.size === 0) {
      return errorResponse('The recording is missing.', undefined, 400)
    }
    if (file.size > RECORDING_MAX_BYTES) {
      return errorResponse('That recording is too large.', undefined, 400)
    }
    if (!isAllowedAudioMime(file.type)) {
      return errorResponse('That recording is not audio.', undefined, 400)
    }

    const voiceEffect = resolveVoiceEffect(meta.voiceEffect, challenge.allowFunnyVoices)
    uploadedUrl = await savePrivateAudio(
      `thoughts-audio/${challenge.id}/${meta.clientKey}.${audioExtension(file.type)}`,
      Buffer.from(await file.arrayBuffer()),
      file.type || 'audio/webm'
    )

    try {
      const submission = await prisma.thoughtSubmission.create({
        data: {
          challengeId: challenge.id,
          studentName: nameResult.data,
          character: meta.character,
          voiceEffect,
          audioPath: uploadedUrl,
          mimeType: file.type || 'audio/webm',
          durationMs: meta.durationMs,
          envelope: meta.envelope,
          clientKey: meta.clientKey,
        },
      })
      return successResponse({ submissionId: submission.id, duplicate: false }, 201)
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      if (uploadedUrl) await removePrivateAudio(uploadedUrl).catch(() => undefined)
      const raced = await prisma.thoughtSubmission.findUnique({
        where: {
          challengeId_clientKey: {
            challengeId: challenge.id,
            clientKey: meta.clientKey,
          },
        },
      })
      if (!raced) throw error
      return successResponse({ submissionId: raced.id, duplicate: true })
    }
  } catch (error) {
    if (uploadedUrl) await removePrivateAudio(uploadedUrl).catch(() => undefined)
    return handleApiError(error, 'POST /api/thought-session/[token]/submit')
  }
}
