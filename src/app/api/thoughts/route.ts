import { NextRequest } from 'next/server'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils'
import { challengeCreateSchema } from '@/lib/thoughts/schemas'
import { createChallenge, listChallenges } from '@/lib/thoughts/service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    return successResponse(await listChallenges(authResult.userId))
  } catch (error) {
    return handleApiError(error, 'GET /api/thoughts')
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const parsed = challengeCreateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse('Give the activity a title and a prompt.', parsed.error.flatten(), 400)
    }
    const challenge = await createChallenge(
      authResult.userId,
      parsed.data.title,
      parsed.data.prompt
    )
    return successResponse(challenge, 201)
  } catch (error) {
    return handleApiError(error, 'POST /api/thoughts')
  }
}
