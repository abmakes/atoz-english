'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { createThought } from '@/components/thoughts/api'
import { THOUGHT_PROMPTS } from '@/lib/thoughts/prompts'

export default function NewThoughtPage() {
  const router = useRouter()
  const [title, setTitle] = useState<string>(THOUGHT_PROMPTS[0].title)
  const [prompt, setPrompt] = useState<string>(THOUGHT_PROMPTS[0].prompt)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-xl px-6 py-10">
        <Link href="/tools/thoughts" className="text-sm text-violet-700 hover:underline">
          All Thoughts activities
        </Link>
        <h1 className="grandstander mt-4 text-4xl font-bold text-[#114257]">New activity</h1>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            setSaving(true)
            void createThought({ title, prompt })
              .then((challenge) => router.push(`/tools/thoughts/${challenge.id}`))
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Could not create the activity.')
                setSaving(false)
              })
          }}
        >
          <div className="flex flex-wrap gap-2">
            {THOUGHT_PROMPTS.map((template) => (
              <button
                key={template.title}
                type="button"
                className="rounded-full border px-3 py-1 text-sm"
                onClick={() => {
                  setTitle(template.title)
                  setPrompt(template.prompt)
                }}
              >
                {template.title}
              </button>
            ))}
          </div>
          <label className="block text-sm font-semibold">
            Prompt name
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            What students say
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"
              required
            />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" disabled={saving} className="bg-violet-600 text-white hover:bg-violet-700">
            {saving ? 'Creating…' : 'Create activity'}
          </Button>
        </form>
      </div>
    </ProtectedRoute>
  )
}
