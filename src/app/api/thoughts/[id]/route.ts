import { NextRequest } from 'next/server'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils'
import { challengePatchSchema } from '@/lib/thoughts/schemas'
import {
  deleteChallengeAudio,
  getChallengeDetail,
  getOwnedChallenge,
} from '@/lib/thoughts/service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { id } = await context.params
    const challenge = await getChallengeDetail(id, authResult.userId)
    if (!challenge) return errorResponse('Activity not found', undefined, 404)
    return successResponse(challenge)
  } catch (error) {
    return handleApiError(error, 'GET /api/thoughts/[id]')
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { id } = await context.params
    const owned = await getOwnedChallenge(id, authResult.userId)
    if (!owned) return errorResponse('Activity not found', undefined, 404)
    const parsed = challengePatchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse('Invalid activity', parsed.error.flatten(), 400)
    }
    await prisma.thoughtChallenge.update({
      where: { id: owned.id },
      data: parsed.data,
    })
    const challenge = await getChallengeDetail(owned.id, authResult.userId)
    return successResponse(challenge)
  } catch (error) {
    return handleApiError(error, 'PATCH /api/thoughts/[id]')
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { id } = await context.params
    const owned = await getOwnedChallenge(id, authResult.userId)
    if (!owned) return errorResponse('Activity not found', undefined, 404)
    await deleteChallengeAudio(owned.id)
    await prisma.thoughtChallenge.delete({ where: { id: owned.id } })
    return successResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/thoughts/[id]')
  }
}
