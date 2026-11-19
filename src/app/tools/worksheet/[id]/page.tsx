'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import WorksheetPaper from '@/components/lesson/WorksheetPaper'
import { Button } from '@/components/ui/button'
import type { WorksheetItem } from '@/lib/lesson/assess'
import { QuestionType } from '@/types/question_types'
import { Loader2, Printer } from 'lucide-react'

interface Sheet {
  id: string
  title: string
  level: string
  items: WorksheetItem[]
}

export default function WorksheetSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [items, setItems] = useState<WorksheetItem[]>([])
  const [error, setError] = useState('')
  const [withKey, setWithKey] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/tools/worksheets/${id}`)
      .then((response) => response.json())
      .then((body: { sheet?: Sheet; error?: string }) => {
        if (cancelled) return
        if (!body.sheet) throw new Error(body.error || 'Could not open this worksheet.')
        setSheet(body.sheet)
        setItems(body.sheet.items)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not open this worksheet.')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const save = async (next: WorksheetItem[]) => {
    setItems(next)
    const response = await fetch(`/api/tools/worksheets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: next }),
    })
    if (!response.ok) throw new Error('Could not save.')
  }

  const replace = async (index: number) => {
    const item = items[index]
    if (!item || !sheet) return
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
          level: sheet.level,
          title: sheet.title,
          questions: [
            {
              id: item.questionId,
              question: item.line,
              answers: item.choices.length > 0 ? item.choices : [item.answer || 'yes', 'no'],
              correctAnswer: item.answer || item.choices[0] || 'yes',
              type: QuestionType.MULTIPLE_CHOICE,
              imageUrl: item.imageUrl ?? null,
            },
          ],
        }),
      })
      const body = (await response.json()) as { error?: string; items?: { line: string; choices: string[]; correctAnswer: string; warning?: string }[] }
      const fresh = body.items?.[0]
      if (!response.ok || !fresh) throw new Error(body.error || 'Could not replace that line.')
      await save(items.map((row, rowIndex) => (
        rowIndex === index
          ? { ...row, line: fresh.line, choices: fresh.choices, answer: fresh.correctAnswer, warning: fresh.warning }
          : row
      )))
    } catch (replaceError) {
      setError(replaceError instanceof Error ? replaceError.message : 'Could not replace that line.')
    } finally {
      setBusy(false)
    }
  }

  if (!sheet && !error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="print-page mx-auto max-w-3xl px-6 py-8">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/tools/worksheet" className="text-sm font-semibold underline">← Worksheets</Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setWithKey(true); setTimeout(() => window.print(), 50) }}>Print with answer key</Button>
            <Button onClick={() => { setWithKey(false); setTimeout(() => window.print(), 50) }} className="bg-violet-700 text-white">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </div>
        {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
        {items.length > 0 ? (
          <WorksheetPaper
            title={sheet?.title || 'Worksheet'}
            items={items}
            withKey={withKey}
            busy={busy}
            onReplace={(index) => void replace(index)}
            onChange={(next) => {
              save(next).catch(() => setError('Could not save.'))
            }}
          />
        ) : null}
      </div>
    </ProtectedRoute>
  )
}
