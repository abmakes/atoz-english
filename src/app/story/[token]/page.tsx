'use client'

import { use, useEffect, useState } from 'react'
import StoryRecorderFlow from '@/components/story_creator/StoryRecorderFlow'
import {
  fetchStorySession,
  type StorySessionDto,
} from '@/components/story_creator/api'
import { Loader2 } from 'lucide-react'

export default function StudentStoryPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [session, setSession] = useState<StorySessionDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStorySession(token)
      .then(setSession)
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : 'This story is not available.'
        )
      )
  }, [token])

  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50 to-sky-50">
      {error ? (
        <div className="flex min-h-dvh items-center justify-center px-6 text-center">
          <p className="text-lg text-slate-600">{error}</p>
        </div>
      ) : session ? (
        <StoryRecorderFlow token={token} session={session} />
      ) : (
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
        </div>
      )}
    </div>
  )
}
