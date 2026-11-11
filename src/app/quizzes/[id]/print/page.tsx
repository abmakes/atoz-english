'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { isRealPicture, type WorksheetItem } from '@/lib/lesson/assess'
import { Loader2, Printer } from 'lucide-react'

interface PrintPayload {
  quiz: { id: string; title: string }
  lesson: { worksheetItems: WorksheetItem[] }
}

export default function QuizWorksheetPrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [payload, setPayload] = useState<PrintPayload | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/quizzes/${id}/lesson`, { cache: 'no-store' })
      .then(async (response) => {
        const body = (await response.json()) as { error?: string; data?: PrintPayload }
        if (!response.ok || !body.data) throw new Error(body.error || 'Could not open the worksheet.')
        return body.data
      })
      .then((data) => {
        if (!cancelled) setPayload(data)
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

  const items = payload?.lesson.worksheetItems ?? []

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
              onClick={() => window.print()}
              className="bg-[--primary-accent] text-white hover:bg-[--primary-accent-hover]"
              disabled={items.length === 0}
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
          <div className="worksheet rounded border bg-white p-8 shadow-sm">
            <div className="flex items-end justify-between gap-6 border-b-2 border-slate-800 pb-3">
              <h1 className="grandstander text-2xl font-bold text-slate-900">{payload?.quiz.title}</h1>
              <div className="text-sm text-slate-700">
                Name: ______________________ &nbsp; Date: ____________
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Circle the answer, or fill the blank.</p>
            <ol className="mt-6 space-y-8">
              {items.map((item, index) => (
                <li key={`${item.questionId ?? 'line'}-${index}`} className="break-inside-avoid">
                  {isRealPicture(item.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="mb-3 max-h-48 rounded border border-slate-300 object-contain"
                    />
                  ) : null}
                  <p className="text-lg text-slate-900">{item.line}</p>
                  {item.choices.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {item.choices.map((choice, choiceIndex) => (
                        <li key={`${choice}-${choiceIndex}`} className="flex items-center gap-3 text-base text-slate-800">
                          <span className="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-slate-800" />
                          {choice}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <style jsx global>{`
        @media print {
          nav,
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .print-page {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .worksheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 14mm;
          }
        }
      `}</style>
    </ProtectedRoute>
  )
}
