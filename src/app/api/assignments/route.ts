import { requireAuth, isUnauthorized } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-utils'
import { listAssignmentHub } from '@/lib/homework/service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    return successResponse(await listAssignmentHub(authResult.userId))
  } catch (error) {
    return handleApiError(error, 'GET /api/assignments')
  }
}
