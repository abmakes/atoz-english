'use client'

import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import LessonKitScreen from '@/components/management_ui/LessonKitScreen'
import type { LessonTarget } from '@/lib/lesson/assess'

function LessonPageInner({ quizId }: { quizId: string }) {
  const search = useSearchParams()
  const check = search.get('check')
  const initialCheck: LessonTarget | undefined =
    check === 'worksheet' || check === 'sentence-builder' ? check : undefined
  return <LessonKitScreen quizId={quizId} initialCheck={initialCheck} />
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <ProtectedRoute>
      <Suspense>
        <LessonPageInner quizId={id} />
      </Suspense>
    </ProtectedRoute>
  )
}
