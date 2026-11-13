'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import WorksheetPaper from '@/components/lesson/WorksheetPaper'
import type { WorksheetItem } from '@/lib/lesson/assess'
import { levelFromTags } from '@/lib/taxonomy/quiz-taxonomy'
import { QuestionType } from '@/types/question_types'
import { Loader2, Printer } from 'lucide-react'

function storable(item: WorksheetItem) {
  return {
    questionId: item.questionId,
    line: item.line,
    imageUrl: item.imageUrl ?? null,
    choices: item.choices,
    activity: item.activity,
    exercise: item.exercise,
    instruction: item.instruction,
    bank: item.bank,
    example: item.example,
    warning: item.warning,
    held: item.held,
    answer: item.answer,
  }
}

interface PrintPayload {
  quiz: { id: string; title: string; tags: string[] }
  lesson: { worksheetItems: WorksheetItem[] }
}

export default function QuizWorksheetPrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [payload, setPayload] = useState<PrintPayload | null>(null)
  const [items, setItems] = useState<WorksheetItem[]>([])
  const [error, setError] = useState('')
  const [withKey, setWithKey] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/quizzes/${id}/lesson`, { cache: 'no-store' })
      .then(async (response) => {
        const body = (await response.json()) as { error?: string; data?: PrintPayload }
        if (!response.ok || !body.data) throw new Error(body.error || 'Could not open the worksheet.')
        return body.data
      })
      .then((data) => {
        if (!cancelled) {
          setPayload(data)
          setItems(data.lesson.worksheetItems)
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not open the worksheet.')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (!payload && !error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[--primary-accent]" />
      </div>
    )
  }

  const save = async (next: WorksheetItem[]) => {
    setItems(next)
    const response = await fetch(`/api/quizzes/${id}/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'worksheet', items: next.map(storable) }),
    })
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(body.error || 'Could not save the worksheet.')
    }
  }

  const regenerate = async (index: number) => {
    const item = items[index]
    if (!item || !payload) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/ai/assess-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'worksheet',
          scope: 'item',
          sections: item.activity === 'question' ? ['long'] : undefined,
          level: levelFromTags(payload.quiz.tags) ?? 'A1',
          title: payload.quiz.title,
          quizId: payload.quiz.id,
          questions: [
            {
              id: item.questionId,
              question: item.line,
              answers: item.choices.length > 0 ? item.choices : [item.answer || 'yes', 'no', 'maybe', 'soon'],
              correctAnswer: item.answer || item.choices[0] || 'yes',
              type: QuestionType.MULTIPLE_CHOICE,
              imageUrl: item.imageUrl ?? null,
            },
          ],
        }),
      })
      const body = (await response.json()) as { error?: string; items?: { line: string; choices: string[]; correctAnswer: string; warning?: string; imageUrl?: string | null }[] }
      const fresh = body.items?.[0]
      if (!response.ok || !fresh) throw new Error(body.error || 'Could not replace that line.')
      const next = items.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, line: fresh.line, choices: fresh.choices, answer: fresh.correctAnswer, warning: fresh.warning, imageUrl: fresh.imageUrl || row.imageUrl }
          : row
      )
      await save(next)
    } catch (regenError) {
      setError(regenError instanceof Error ? regenError.message : 'Could not replace that line.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="print-page mx-auto max-w-3xl px-6 py-8">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
          <Link href={`/quizzes/${id}/lesson`} className="text-sm font-semibold text-[--primary-accent] hover:underline">
            ← Back to pieces
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/quizzes/${id}/lesson?check=worksheet`}
              className="text-sm font-semibold text-slate-600 underline"
            >
              Check again
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setWithKey(true)
                setTimeout(() => window.print(), 50)
              }}
              disabled={items.length === 0}
            >
              Print with answer key
            </Button>
            <Button
              onClick={() => {
                setWithKey(false)
                setTimeout(() => window.print(), 50)
              }}
              className="bg-[--primary-accent] text-white hover:bg-[--primary-accent-hover]"
              disabled={items.length === 0 || busy}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {error || items.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center grandstander">
            <p className="text-lg font-bold">{error || 'Approve worksheet lines before printing.'}</p>
            <Link href={`/quizzes/${id}/lesson`} className="mt-3 inline-block text-sm underline">
              Back to pieces
            </Link>
          </div>
        ) : (
          <WorksheetPaper
            title={payload?.quiz.title || 'Worksheet'}
            items={items}
            withKey={withKey}
            busy={busy}
            onReplace={(index) => void regenerate(index)}
            onChange={(next) => {
              save(next).catch((saveError: unknown) => setError(saveError instanceof Error ? saveError.message : 'Could not save.'))
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
