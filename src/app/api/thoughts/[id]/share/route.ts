import { NextRequest } from 'next/server'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils'
import { createShareToken } from '@/lib/stories/tokens'
import { getOwnedChallenge } from '@/lib/thoughts/service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

/** Rotate the class link. Old student, gallery, and watch URLs stop working. */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { id } = await context.params
    const owned = await getOwnedChallenge(id, authResult.userId)
    if (!owned) return errorResponse('Activity not found', undefined, 404)
    const updated = await prisma.thoughtChallenge.update({
      where: { id: owned.id },
      data: { shareToken: createShareToken() },
    })
    return successResponse({ shareToken: updated.shareToken })
  } catch (error) {
    return handleApiError(error, 'POST /api/thoughts/[id]/share')
  }
}
