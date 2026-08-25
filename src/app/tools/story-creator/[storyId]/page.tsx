'use client'

import { use } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StoryEditorView from '@/components/story_creator/StoryEditorView'

export default function StoryEditorPage({
  params,
}: {
  params: Promise<{ storyId: string }>
}) {
  const { storyId } = use(params)

  return (
    <ProtectedRoute>
      <StoryEditorView storyId={storyId} />
    </ProtectedRoute>
  )
}
