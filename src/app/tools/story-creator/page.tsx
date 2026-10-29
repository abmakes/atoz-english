'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { useCustomToast } from '@/components/ui/CustomToast'
import {
  deleteStory,
  fetchStories,
  type StoryDto,
} from '@/components/story_creator/api'
import { Loader2, Plus, Trash2, Users, Printer } from 'lucide-react'

export default function StoryCreatorListPage() {
  const { addToast } = useCustomToast()
  const [stories, setStories] = useState<StoryDto[] | null>(null)

  useEffect(() => {
    fetchStories()
      .then(setStories)
      .catch(() => setStories([]))
  }, [])

  const remove = async (id: string) => {
    if (!window.confirm('Delete this story and all student recordings?')) return
    try {
      await deleteStory(id)
      setStories((current) => current?.filter((story) => story.id !== id) ?? null)
    } catch {
      addToast('Could not delete the story.', {
        variant: 'error',
        position: 'top-center',
      })
    }
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="grandstander text-4xl font-bold text-[#114257]">
              Story Creator
            </h1>
            <p className="mt-1 text-slate-600">
              4-picture stories your students narrate into their own short film.
            </p>
          </div>
          <Button
            asChild
            className="grandstander bg-violet-600 text-white hover:bg-violet-700"
          >
            <Link href="/tools/story-creator/new">
              <Plus className="mr-2 h-4 w-4" />
              New story
            </Link>
          </Button>
        </div>

        {stories === null ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
          </div>
        ) : stories.length === 0 ? (
          <div className="mt-16 rounded-2xl border-2 border-dashed border-violet-200 p-12 text-center">
            <p className="grandstander text-xl text-[#114257]">
              No stories yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Describe a story idea, get four pictures, print the worksheet, and
              share the recording link with your class.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => {
              const cover = story.panels.find((panel) => panel.imageUrl)?.imageUrl
              const generatedCount = story.panels.filter((p) => p.imageUrl).length
              return (
                <div
                  key={story.id}
                  className="overflow-hidden rounded-2xl border-2 border-violet-100 bg-white shadow-sm"
                >
                  <Link href={`/tools/story-creator/${story.id}`}>
                    <div
                      className="relative w-full bg-slate-100"
                      style={{ aspectRatio: '4 / 3' }}
                    >
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt={story.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                          No pictures yet
                        </div>
                      )}
                      {generatedCount < 4 && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                          {generatedCount}/4 pictures
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link
                      href={`/tools/story-creator/${story.id}`}
                      className="grandstander block truncate text-lg font-bold text-[#114257] hover:text-violet-700"
                    >
                      {story.title}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {story.tags.join(' · ')}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="flex gap-3 text-slate-500">
                        <Link
                          href={`/tools/story-creator/${story.id}/submissions`}
                          className="flex items-center gap-1 hover:text-violet-600"
                        >
                          <Users className="h-4 w-4" />
                          {story.submissionCount ?? 0}
                        </Link>
                        <Link
                          href={`/tools/story-creator/${story.id}/print`}
                          className="flex items-center gap-1 hover:text-violet-600"
                        >
                          <Printer className="h-4 w-4" />
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => void remove(story.id)}
                        className="text-slate-400 hover:text-red-500"
                        aria-label="Delete story"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
