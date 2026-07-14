'use client'

import QuizEditor from "@/components/management_ui/QuizEditor"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import LoadingSpinner from "@/components/loading_spinner"

function CreateEditor() {
  const searchParams = useSearchParams()
  const resumeDraftId = searchParams.get('draft') || undefined

  return <QuizEditor mode="create" resumeDraftId={resumeDraftId} />
}

export default function CreatePage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-[40vh] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <CreateEditor />
      </Suspense>
    </ProtectedRoute>
  )
}
