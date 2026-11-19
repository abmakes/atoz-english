import { NextResponse } from 'next/server'
import { isUnauthorized, requireAuth } from '@/lib/auth'
import { emptyProfileQuizLists, getProfileQuizLists } from '@/lib/profile-quizzes'

export const dynamic = 'force-dynamic'

/** Slim profile lists. Used when the server page could not load them. */
export async function GET() {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult
    const data = await getProfileQuizLists(authResult.userId)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Failed to fetch profile quizzes:', error)
    return NextResponse.json({ data: emptyProfileQuizLists() })
  }
}
