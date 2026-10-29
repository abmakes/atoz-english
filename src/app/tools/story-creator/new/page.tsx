'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StoryBriefForm from '@/components/story_creator/StoryBriefForm'

export default function NewStoryPage() {
  const router = useRouter()

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-2 text-sm">
          <Link href="/tools/story-creator" className="text-violet-600 hover:underline">
            ← All stories
          </Link>
        </div>
        <h1 className="grandstander text-4xl font-bold text-[#114257]">
          New story
        </h1>
        <p className="mb-8 mt-1 text-slate-600">
          Describe the story, pick the level and grammar, and the story plan is
          written for you. The pictures come next.
        </p>
        <StoryBriefForm
          onCreated={(story) => router.push(`/tools/story-creator/${story.id}`)}
        />
      </div>
    </ProtectedRoute>
  )
}
