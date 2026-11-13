'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import type { WorksheetItem } from '@/lib/lesson/assess'
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
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <article className="rounded border bg-white p-4">
          <h1 className="text-xl font-bold">{sheet?.title}</h1>
          <ol className="mt-4 flex flex-col gap-3">
            {items.map((item, index) => (
              <li key={`${item.line}-${index}`} className={item.held ? 'is-held opacity-40' : ''}>
                <p className="text-xs font-bold text-slate-500">{item.exercise}{item.example ? ' · Example' : ''}</p>
                <p>{item.line}{item.example && item.answer ? <strong> {item.answer}</strong> : null}</p>
                {item.warning ? <p className="no-print text-xs text-orange-800">{item.warning}</p> : null}
                <div className="no-print mt-1 flex gap-3 text-xs">
                  <button type="button" className="underline" onClick={() => save(items.map((row, rowIndex) => (rowIndex === index ? { ...row, held: !row.held } : row))).catch(() => setError('Could not save.'))}>{item.held ? 'Put back' : 'Leave off'}</button>
                  <button type="button" className="underline" onClick={() => save(items.filter((_, rowIndex) => rowIndex !== index)).catch(() => setError('Could not save.'))}>Delete</button>
                </div>
              </li>
            ))}
          </ol>
          {withKey ? (
            <section className="mt-6 border-t pt-3">
              <h2 className="font-bold">Answer key</h2>
              <ol className="list-decimal pl-5 text-sm">
                {items.filter((item) => !item.held && !item.example && item.answer).map((item) => (
                  <li key={item.line}>{item.answer}</li>
                ))}
              </ol>
            </section>
          ) : null}
        </article>
      </div>
      <style jsx global>{`
        @media print {
          nav, .no-print, .is-held { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </ProtectedRoute>
  )
}
