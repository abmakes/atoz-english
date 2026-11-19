'use client'

import { use } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import HomeworkReport from '@/components/management_ui/HomeworkReport'

export default function HomeworkAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-5xl p-4">
        <HomeworkReport assignmentId={id} />
      </div>
    </ProtectedRoute>
  )
}
