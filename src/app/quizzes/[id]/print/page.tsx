'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { isRealPicture, type WorksheetActivity, type WorksheetItem } from '@/lib/lesson/assess'
import { EXERCISE_ORDER, EXERCISE_TITLE, exerciseInstruction } from '@/lib/lesson/worksheet-practice'
import { levelFromTags } from '@/lib/taxonomy/quiz-taxonomy'
import { QuestionType } from '@/types/question_types'
import { Loader2, Printer } from 'lucide-react'

const WRITE_ON_LINE = new Set<WorksheetActivity>(['question', 'rewrite'])

function activityOf(item: WorksheetItem): WorksheetActivity {
  if (item.activity) return item.activity
  if (item.line.includes('______')) return 'gap'
  if (item.choices.length > 0) return 'choice'
  if (item.line.trim().endsWith('?')) return 'question'
  return 'practice'
}

function groupExercises(items: WorksheetItem[]) {
  const groups: { title: string; activity: WorksheetActivity; instruction: string; items: { item: WorksheetItem; index: number }[] }[] = []
  const ordered = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (EXERCISE_ORDER[activityOf(a.item)] ?? 9) - (EXERCISE_ORDER[activityOf(b.item)] ?? 9))
  for (const entry of ordered) {
    const activity = activityOf(entry.item)
    const title = entry.item.exercise || (activity in EXERCISE_TITLE ? EXERCISE_TITLE[activity as keyof typeof EXERCISE_TITLE] : activity)
    const last = groups[groups.length - 1]
    if (last && last.title === title) last.items.push(entry)
    else groups.push({ title, activity, instruction: entry.item.instruction || exerciseInstruction(activity), items: [entry] })
  }
  return groups
}

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

function wordBank(items: WorksheetItem[]): string[] {
  return items
    .map((item) => item.bank?.trim() ?? '')
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
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
          <div className="worksheet rounded border bg-white shadow-sm">
            <div className="worksheet-head">
              <h1 className="grandstander">{payload?.quiz.title}</h1>
              <div className="worksheet-meta">
                Name: ________________ &nbsp; Date: __________
              </div>
            </div>
            {groupExercises(items).map((group) => (
              <section key={group.title} className={`worksheet-exercise is-${group.activity}`}>
                <h2>{group.title}</h2>
                {group.instruction ? <p className="worksheet-instruction">{group.instruction}</p> : null}
                {group.activity === 'gap' && wordBank(group.items.map((entry) => entry.item)).length > 0 ? (
                  <ul className="worksheet-bank">
                    {wordBank(group.items.map((entry) => entry.item)).map((word, index) => (
                      <li key={`${word}-${index}`}>{word}</li>
                    ))}
                  </ul>
                ) : null}
                <ol className="worksheet-items">
                  {group.items.map(({ item, index }, position) => (
                    <li key={`${item.questionId ?? group.activity}-${index}`} className={`worksheet-item is-${group.activity}${item.held ? ' is-held' : ''}${item.example ? ' is-example' : ''}`}>
                      <span className="worksheet-num">{item.example ? '0' : position + (group.items[0]?.item.example ? 0 : 1)}</span>
                      {group.activity === 'choice' && isRealPicture(item.imageUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="worksheet-photo" />
                      ) : null}
                      <div className="worksheet-body">
                        <p className="worksheet-line">
                          {item.line}
                          {item.example && item.answer ? <span className="worksheet-example-answer"> {item.answer}</span> : null}
                        </p>
                        {WRITE_ON_LINE.has(group.activity) && !item.example ? <div className="worksheet-write" /> : null}
                        {group.activity === 'choice' && item.choices.length > 0 ? (
                          <ul className={`worksheet-choices${item.choices.length === 3 ? ' is-three' : ''}`}>
                            {item.choices.map((choice, choiceIndex) => (
                              <li key={`${choice}-${choiceIndex}`} className={item.example && choice === item.answer ? 'is-key' : ''}>
                                <span className="worksheet-circle" />
                                {choice}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {item.warning ? <p className="worksheet-warning no-print">{item.warning}</p> : null}
                        <div className="worksheet-row-actions no-print">
                          <button type="button" onClick={() => save(items.map((row, rowIndex) => (rowIndex === index ? { ...row, held: !row.held } : row))).catch((saveError: unknown) => setError(saveError instanceof Error ? saveError.message : 'Could not save.'))}>
                            {item.held ? 'Put back' : 'Leave off the page'}
                          </button>
                          <button type="button" disabled={busy} onClick={() => void regenerate(index)}>Replace</button>
                          <button type="button" onClick={() => save(items.filter((_, rowIndex) => rowIndex !== index)).catch((saveError: unknown) => setError(saveError instanceof Error ? saveError.message : 'Could not save.'))}>Delete</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            {withKey ? (
              <section className="worksheet-key">
                <h2>Answer key</h2>
                <ol>
                  {items.filter((item) => !item.held && !item.example && item.answer).map((item, index) => (
                    <li key={`${item.line}-${index}`}>{item.answer}</li>
                  ))}
                </ol>
              </section>
            ) : null}
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
        .worksheet-meta {
          margin: 0;
          font-size: 11px;
          line-height: 1.2;
          color: #334155;
          white-space: nowrap;
        }
        .worksheet-bank {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1mm 6mm;
          margin: 1.2mm 0 0;
          padding: 1.2mm 3mm;
          list-style: none;
          border: 1px solid #0f172a;
          border-radius: 2px;
          font-size: 12px;
          line-height: 1.35;
          font-weight: 600;
          color: #0f172a;
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
        .worksheet-item.is-rewrite .worksheet-body,
        .worksheet-item.is-gap .worksheet-body {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .worksheet-item.is-question .worksheet-line,
        .worksheet-item.is-rewrite .worksheet-line,
        .worksheet-item.is-gap .worksheet-line {
          flex: none;
          max-width: 62%;
        }
        .worksheet-item.is-choice {
          align-items: center;
          min-height: 14.8mm;
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
          min-width: 45mm;
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
        .worksheet-choices.is-three {
          grid-template-columns: 1fr 1fr 1fr;
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
        .worksheet-choices li.is-key .worksheet-circle {
          background: #0f172a;
        }
        .worksheet-example-answer {
          font-weight: 700;
        }
        .worksheet-warning {
          margin: 1mm 0 0;
          font-size: 11px;
          line-height: 1.3;
          color: #9a3412;
        }
        .worksheet-row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 1mm;
        }
        .worksheet-row-actions button {
          padding: 0;
          border: 0;
          background: none;
          font-size: 11px;
          text-decoration: underline;
          color: #334155;
          cursor: pointer;
        }
        .worksheet-item.is-held {
          opacity: 0.45;
        }
        .worksheet-key {
          margin-top: 8mm;
          padding-top: 3mm;
          border-top: 1.5px solid #0f172a;
        }
        .worksheet-key h2 {
          margin: 0 0 2mm;
          font-size: 14px;
          font-weight: 700;
        }
        .worksheet-key ol {
          margin: 0;
          padding-left: 1.2rem;
          font-size: 12px;
          line-height: 1.4;
          columns: 2;
        }
        @media print {
          nav,
          .no-print,
          .is-held {
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
