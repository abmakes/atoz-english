'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { deleteThought, fetchThoughts } from '@/components/thoughts/api'
import type { ThoughtChallengeDto } from '@/lib/thoughts/service'
import { Loader2, Plus, Trash2 } from 'lucide-react'

export default function ThoughtsListPage() {
  const [challenges, setChallenges] = useState<ThoughtChallengeDto[] | null>(null)

  useEffect(() => {
    fetchThoughts()
      .then(setChallenges)
      .catch(() => setChallenges([]))
  }, [])

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="grandstander text-4xl font-bold text-[#114257]">Thoughts</h1>
            <p className="mt-1 text-slate-600">
              Students build a sticker face and answer in their own voice.
            </p>
          </div>
          <Button asChild className="bg-violet-600 text-white hover:bg-violet-700">
            <Link href="/tools/thoughts/new">
              <Plus className="mr-2 h-4 w-4" />
              New activity
            </Link>
          </Button>
        </div>
        {challenges === null ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="mt-16 rounded-2xl border-2 border-dashed border-violet-200 p-12 text-center">
            <p className="grandstander text-xl text-[#114257]">No activities yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Write a speaking prompt, share the class link, then choose which recordings to show.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
                <div>
                  <Link href={`/tools/thoughts/${challenge.id}`} className="grandstander text-2xl font-bold text-[#114257] hover:underline">
                    {challenge.title}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {challenge.status.toLowerCase()} · {challenge.pendingCount} to review · {challenge.submissionCount} sent
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${challenge.title}`}
                  onClick={() => {
                    if (!window.confirm('Delete this activity and every recording?')) return
                    void deleteThought(challenge.id).then(() =>
                      setChallenges((current) => current?.filter((item) => item.id !== challenge.id) ?? null)
                    )
                  }}
                >
                  <Trash2 className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
