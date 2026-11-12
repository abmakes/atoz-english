'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { isRealPicture, type WorksheetActivity, type WorksheetItem } from '@/lib/lesson/assess'
import { EXERCISE_TITLE } from '@/lib/lesson/worksheet-practice'
import { Loader2, Printer } from 'lucide-react'

const INSTRUCTION: Partial<Record<WorksheetActivity, string>> = {
  question: 'Write the answer on the line.',
  gap: 'Write the missing word.',
  choice: 'Circle the answer.',
}

function activityOf(item: WorksheetItem): WorksheetActivity {
  if (item.activity) return item.activity
  if (item.line.includes('______')) return 'gap'
  if (item.choices.length > 0) return 'choice'
  if (item.line.trim().endsWith('?')) return 'question'
  return 'practice'
}

function groupExercises(items: WorksheetItem[]) {
  const groups: { title: string; activity: WorksheetActivity; items: WorksheetItem[] }[] = []
  for (const item of items) {
    const activity = activityOf(item)
    const title =
      item.exercise ||
      (activity === 'question' || activity === 'gap' || activity === 'choice' ? EXERCISE_TITLE[activity] : activity)
    const last = groups[groups.length - 1]
    if (last && last.title === title) last.items.push(item)
    else groups.push({ title, activity, items: [item] })
  }
  return groups
}

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
          <div className="worksheet rounded border bg-white shadow-sm">
            <div className="worksheet-head">
              <h1 className="grandstander">{payload?.quiz.title}</h1>
              <div className="worksheet-meta">
                Name: ________________ &nbsp; Date: __________
              </div>
            </div>
            <p className="worksheet-note">Answer the questions, complete the gaps, then circle the answer.</p>
            {groupExercises(items).map((group) => (
              <section key={group.title} className={`worksheet-exercise is-${group.activity}`}>
                <h2>{group.title}</h2>
                {INSTRUCTION[group.activity] ? <p className="worksheet-instruction">{INSTRUCTION[group.activity]}</p> : null}
                <ol className="worksheet-items">
                  {group.items.map((item, index) => (
                    <li key={`${item.questionId ?? group.activity}-${index}`} className={`worksheet-item is-${group.activity}`}>
                      <span className="worksheet-num">{index + 1}</span>
                      {group.activity === 'choice' && isRealPicture(item.imageUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="worksheet-photo" />
                      ) : null}
                      <div className="worksheet-body">
                        <p className="worksheet-line">{item.line}</p>
                        {group.activity === 'question' ? <div className="worksheet-write" /> : null}
                        {group.activity === 'choice' && item.choices.length > 0 ? (
                          <ul className="worksheet-choices">
                            {item.choices.map((choice, choiceIndex) => (
                              <li key={`${choice}-${choiceIndex}`}>
                                <span className="worksheet-circle" />
                                {choice}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
      <style jsx global>{`
        .worksheet {
          width: 186mm;
          max-width: 100%;
          padding: 2mm 4mm 1mm;
        }
        .worksheet-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          border-bottom: 1.5px solid #0f172a;
          padding-top: 2mm;
          padding-bottom: 2.5mm;
          margin-bottom: 3mm;
        }
        .worksheet-head h1 {
          margin: 0;
          font-size: 16px;
          line-height: 1.15;
          font-weight: 700;
          color: #0f172a;
        }
        .worksheet-meta,
        .worksheet-note {
          margin: 0;
          font-size: 11px;
          line-height: 1.2;
          color: #334155;
          white-space: nowrap;
        }
        .worksheet-note {
          margin-top: 0;
          white-space: normal;
        }
        .worksheet-exercise + .worksheet-exercise {
          margin-top: 4mm;
          padding-top: 2.4mm;
          border-top: 1px solid #94a3b8;
        }
        .worksheet-exercise h2 {
          margin: 1.2mm 0 0.4mm;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 700;
          color: #0f172a;
        }
        .worksheet-exercise + .worksheet-exercise h2 {
          margin-top: 0;
        }
        .worksheet-instruction {
          margin: 0;
          font-size: 11px;
          line-height: 1.3;
          color: #334155;
        }
        .worksheet-items {
          display: flex;
          flex-direction: column;
          gap: 1.3mm;
          margin: 1.2mm 0 0;
          padding: 0;
          list-style: none;
        }
        .worksheet-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 0.45mm 0;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .worksheet-item.is-question .worksheet-body,
        .worksheet-item.is-gap .worksheet-body {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .worksheet-item.is-question .worksheet-line,
        .worksheet-item.is-gap .worksheet-line {
          flex: none;
        }
        .worksheet-item.is-choice {
          align-items: center;
          min-height: 15.6mm;
          padding: 0.5mm 0;
        }
        .worksheet-num {
          width: 1.1rem;
          flex: none;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          color: #0f172a;
        }
        .worksheet-photo {
          width: 18mm;
          height: 13mm;
          flex: none;
          object-fit: cover;
          border: 1px solid #cbd5e1;
          border-radius: 2px;
          background: #f8fafc;
        }
        .worksheet-write {
          flex: 1;
          height: 0;
          margin: 0;
          border-bottom: 1px solid #0f172a;
        }
        .worksheet-body {
          min-width: 0;
          flex: 1;
        }
        .worksheet-line {
          margin: 0;
          font-size: 13px;
          line-height: 1.35;
          color: #0f172a;
        }
        .worksheet-choices {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px 10px;
          margin: 2px 0 0;
          padding: 0;
          list-style: none;
        }
        .worksheet-choices li {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
          font-size: 12px;
          line-height: 1.35;
          color: #1e293b;
        }
        .worksheet-circle {
          width: 11px;
          height: 11px;
          flex: none;
          border: 1.5px solid #0f172a;
          border-radius: 999px;
        }
        @media print {
          nav,
          .no-print {
            display: none !important;
          }
          body {
            min-height: 0 !important;
            background: white !important;
          }
          .print-page {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .worksheet {
            width: auto;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </ProtectedRoute>
  )
}
