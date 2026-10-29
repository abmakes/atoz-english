'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { fetchStory, type StoryDto } from '@/components/story_creator/api'
import { Loader2, Printer } from 'lucide-react'

export default function StoryPrintPage({
  params,
}: {
  params: Promise<{ storyId: string }>
}) {
  const { storyId } = use(params)
  const [story, setStory] = useState<StoryDto | null>(null)
  const [showExample, setShowExample] = useState(true)
  const [showSentences, setShowSentences] = useState(false)

  useEffect(() => {
    fetchStory(storyId).then(setStory).catch(() => setStory(null))
  }, [storyId])

  if (!story) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
      </div>
    )
  }

  const panels = [...story.panels].sort((a, b) => a.order - b.order)

  return (
    <ProtectedRoute>
      <div className="print-page mx-auto max-w-3xl px-6 py-8">
        {/* Screen-only controls */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm">
            <Link
              href={`/tools/story-creator/${storyId}`}
              className="text-violet-600 hover:underline"
            >
              ← Back to editor
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showExample}
                onChange={(event) => setShowExample(event.target.checked)}
                className="accent-violet-600"
              />
              Example story box
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showSentences}
                onChange={(event) => setShowSentences(event.target.checked)}
                className="accent-violet-600"
              />
              Sentence starters under pictures
            </label>
            <Button
              onClick={() => window.print()}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Worksheet */}
        <div className="worksheet rounded border bg-white p-8 shadow-sm">
          <div className="flex items-end justify-between gap-6 border-b-2 border-slate-800 pb-3">
            <h1 className="grandstander text-2xl font-bold text-slate-900">
              {story.title}
            </h1>
            <div className="text-sm text-slate-700">
              Name: ______________________ &nbsp; Date: ____________
            </div>
          </div>

          <p className="mt-3 text-sm italic text-slate-600">
            Look at the pictures. Write the story — one or two sentences for each
            picture. Then practise saying it out loud!
          </p>

          {showExample && story.exampleStory && (
            <div className="mt-4 rounded-lg border-2 border-dashed border-slate-400 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Example story
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">
                {story.exampleStory}
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8">
            {panels.map((panel) => (
              <div key={panel.id}>
                <div
                  className="relative w-full overflow-hidden rounded border-2 border-slate-800 bg-slate-50"
                  style={{ aspectRatio: '4 / 3' }}
                >
                  {panel.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={panel.imageUrl}
                      alt={`Picture ${panel.order}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                      Picture {panel.order} not generated yet
                    </div>
                  )}
                  <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {panel.order}
                  </span>
                </div>
                {showSentences && panel.exampleSentence && (
                  <p className="mt-1 text-xs italic text-slate-500">
                    e.g. {panel.exampleSentence}
                  </p>
                )}
                <div className="mt-2 space-y-4">
                  <div className="h-px w-full bg-slate-400" />
                  <div className="h-px w-full bg-slate-400" />
                  <div className="h-px w-full bg-slate-400" />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Made with PlaytoZ Story Creator
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          nav,
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .print-page {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .worksheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 14mm;
          }
        }
      `}</style>
    </ProtectedRoute>
  )
}
