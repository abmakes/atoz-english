'use client'

import QuizEditor from "@/components/management_ui/QuizEditor"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function CreatePage() {
  return (
    <ProtectedRoute>
      <QuizEditor mode="create" />
    </ProtectedRoute>
  )
}
