'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SentenceBuilderScreen from '@/components/game_ui/sentence-builder/SentenceBuilderScreen'
import type { LessonSentence, SourceQuestion } from '@/lib/lesson/assess'
import { promptsFromLesson } from '@/lib/lesson/prompts'
import { Loader2 } from 'lucide-react'

interface PlayPayload {
  quiz: {
    id: string
    title: string
    imageUrl: string | null
    questions: SourceQuestion[]
  }
  lesson: { sentences: LessonSentence[] }
}

export default function QuizSentenceBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [payload, setPayload] = useState<PlayPayload | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/quizzes/${id}/lesson`, { cache: 'no-store' })
      .then(async (response) => {
        const body = (await response.json()) as { error?: string; data?: PlayPayload }
        if (!response.ok || !body.data) throw new Error(body.error || 'Could not open Sentence Builder.')
        return body.data
      })
      .then((data) => {
        if (!cancelled) setPayload(data)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not open Sentence Builder.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const prompts = useMemo(() => {
    if (!payload) return []
    return promptsFromLesson({
      sentences: payload.lesson.sentences,
      questions: payload.quiz.questions,
      coverUrl: payload.quiz.imageUrl,
    })
  }, [payload])

  if (!payload && !error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[--primary-accent]" />
      </div>
    )
  }

  if (error || prompts.length === 0) {
    return (
      <ProtectedRoute>
        <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center grandstander">
          <p className="text-lg font-bold text-[--text-color]">
            {error || 'None of the approved lines can be played as a sentence.'}
          </p>
          <Link href={`/quizzes/${id}/lesson`} className="font-bold underline">
            Back to pieces
          </Link>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <SentenceBuilderScreen
        prompts={prompts}
        homeHref={`/quizzes/${id}/lesson`}
        homeLabel="Lesson"
        structureLabel="Quiz sentences"
      />
    </ProtectedRoute>
  )
}
