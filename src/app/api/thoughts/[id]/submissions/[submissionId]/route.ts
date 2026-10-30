import { NextRequest } from 'next/server'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils'
import { submissionStatusSchema } from '@/lib/thoughts/schemas'
import { removePrivateAudio } from '@/lib/thoughts/audio-store'
import { getChallengeDetail } from '@/lib/thoughts/service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string; submissionId: string }> }

async function ownedSubmission(challengeId: string, submissionId: string, authorId: string) {
  return prisma.thoughtSubmission.findFirst({
    where: { id: submissionId, challengeId, challenge: { authorId } },
  })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { id, submissionId } = await context.params
    const submission = await ownedSubmission(id, submissionId, authResult.userId)
    if (!submission) return errorResponse('Recording not found', undefined, 404)
    const parsed = submissionStatusSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse('Invalid status', parsed.error.flatten(), 400)
    }
    await prisma.thoughtSubmission.update({
      where: { id: submission.id },
      data: { status: parsed.data.status },
    })
    const challenge = await getChallengeDetail(id, authResult.userId)
    return successResponse(challenge)
  } catch (error) {
    return handleApiError(error, 'PATCH /api/thoughts/[id]/submissions/[submissionId]')
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { id, submissionId } = await context.params
    const submission = await ownedSubmission(id, submissionId, authResult.userId)
    if (!submission) return errorResponse('Recording not found', undefined, 404)
    await prisma.thoughtSubmission.delete({ where: { id: submission.id } })
    await removePrivateAudio(submission.audioPath).catch(() => undefined)
    const challenge = await getChallengeDetail(id, authResult.userId)
    return successResponse(challenge)
  } catch (error) {
    return handleApiError(error, 'DELETE /api/thoughts/[id]/submissions/[submissionId]')
  }
}
