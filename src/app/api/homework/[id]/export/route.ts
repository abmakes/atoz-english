import { NextRequest } from 'next/server'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { errorResponse, handleApiError } from '@/lib/api-utils'
import { HomeworkError, homeworkCsv } from '@/lib/homework/service'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const { id } = await context.params
    const file = await homeworkCsv(authResult.userId, id)
    const filename = `${file.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'homework'}.csv`
    return new Response(file.csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    if (error instanceof HomeworkError) return errorResponse(error.message, undefined, error.status)
    return handleApiError(error, 'GET /api/homework/[id]/export')
  }
}
