import { NextResponse } from 'next/server'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { listWorksheetRuns } from '@/lib/lesson/worksheet-store'

export async function GET() {
  const authResult = await requireAuth()
  if (isUnauthorized(authResult)) return authResult
  const runs = await listWorksheetRuns(authResult.userId)
  return NextResponse.json({ runs })
}
