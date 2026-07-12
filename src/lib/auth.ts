import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export type AuthResult = { userId: string }

/**
 * Require an authenticated user for mutating API routes.
 * When Clerk env vars are absent (local/dev), falls back to "admin"
 * so the app remains usable without auth configured.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  if (!isClerkEnabled) {
    return { userId: 'admin' }
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { userId }
}

export function isUnauthorized(
  result: AuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse
}
