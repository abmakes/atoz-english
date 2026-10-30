'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import TeacherEditor from '@/components/thoughts/TeacherEditor'
import { use } from 'react'

export default function ThoughtEditorPage({
  params,
}: {
  params: Promise<{ challengeId: string }>
}) {
  const { challengeId } = use(params)
  return (
    <ProtectedRoute>
      <TeacherEditor challengeId={challengeId} />
    </ProtectedRoute>
  )
}
