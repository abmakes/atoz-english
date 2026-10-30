'use client'

import { use, useEffect, useState } from 'react'
import StudentSession from '@/components/thoughts/StudentSession'
import { fetchThoughtSession } from '@/components/thoughts/api'
import type { ThoughtSessionDto } from '@/lib/thoughts/service'
import { Loader2 } from 'lucide-react'

export default function StudentThoughtsPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [session, setSession] = useState<ThoughtSessionDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchThoughtSession(token)
      .then(setSession)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'This activity is not available.')
      )
  }, [token])

  if (error) {
    return <p className="px-6 py-20 text-center text-lg text-slate-600">{error}</p>
  }
  if (!session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
      </div>
    )
  }
  return <StudentSession token={token} session={session} />
}
