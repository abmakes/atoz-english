'use client'

import { createContext, useContext } from 'react'

const ClerkActiveContext = createContext(false)

/**
 * Mirrors whether layout mounted <ClerkProvider>.
 * Prefer this over checking NEXT_PUBLIC_CLERK_* in client components —
 * env can be stale vs the actual provider tree.
 */
export function ClerkActiveProvider({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  return (
    <ClerkActiveContext.Provider value={active}>{children}</ClerkActiveContext.Provider>
  )
}

export function useIsClerkActive(): boolean {
  return useContext(ClerkActiveContext)
}
