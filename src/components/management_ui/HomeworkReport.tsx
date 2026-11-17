'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { dueInputToIso, dueInputValue, formatDue } from '@/lib/assignments/due'

interface Miss {
  questionId: string
  questionText: string
  selectedAnswer: string
  correctAnswer: string
}

interface TryRow {
  id: string
  createdAt: string
  percentage: number
  durationMs: number
  misses: Miss[]
}

interface StudentRow {
  studentName: string
  attemptCount: number
  bestPercentage: number
  bestDurationMs: number
  strip: boolean[]
  tries: TryRow[]
}

interface QuestionRow {
  questionId: string
  questionText: string
  answered: number
  wrong: number
  incorrectPercent: number
  commonWrong: string | null
}

interface ChallengeRow {
  rank: number
  studentName: string
  correctCount: number
  reachedHundred: boolean
  timeToHundredMs: number | null
}

interface Report {
  id: string
  title: string
  quizId: string
  quizTitle: string
  shareToken: string
  dueAt: string
  acceptingResponses: boolean
  showLeaderboard: boolean
  createdAt: string
  overview: {
    finishedStudents: number
    classAccuracy: number | null
    totalAnswers: number
    totalWrong: number
  }
  students: StudentRow[]
  questions: QuestionRow[]
  challenge: ChallengeRow[]
}

function formatClock(ms: number | null): string {
  if (ms === null) return '—'
  const seconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

export default function HomeworkReport({ assignmentId }: { assignmentId: string }) {
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openStudent, setOpenStudent] = useState<string | null>(null)
  const [sort, setSort] = useState<'accuracy' | 'name'>('accuracy')
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const response = await fetch(`/api/homework/${assignmentId}`, { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(typeof payload?.error === 'string' ? payload.error : 'Assignment not found.')
        return
      }
      setReport(payload.data as Report)
    })()
  }, [assignmentId])

  const link = useMemo(() => {
    if (!report || typeof window === 'undefined') return ''
    return `${window.location.origin}/homework/${report.shareToken}`
  }, [report])

  useEffect(() => {
    if (!link) return
    let cancelled = false
    void import('qrcode')
      .then((qrcode) => qrcode.toDataURL(link, { margin: 1, width: 180 }))
      .then((url) => {
        if (!cancelled) setQr(url)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [link])

  const students = useMemo(() => {
    if (!report) return []
    const copy = [...report.students]
    if (sort === 'name') copy.sort((left, right) => left.studentName.localeCompare(right.studentName))
    return copy
  }, [report, sort])

  async function save(patch: Record<string, unknown>) {
    const response = await fetch(`/api/homework/${assignmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(typeof payload?.error === 'string' ? payload.error : 'Could not save.')
      return
    }
    setReport((current) => (current ? { ...current, ...payload.data } : current))
  }

  if (error) return <p className="text-red-700">{error}</p>
  if (!report) return <p className="text-slate-500">Loading assignment…</p>

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sky-700">Quiz assignment</p>
          <h1 className="grandstander text-3xl font-bold text-[#114257]">{report.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Assigned {formatDue(report.createdAt)} · Due {formatDue(report.dueAt)} ·{' '}
            <Link href={`/quizzes/${report.quizId}/edit`} className="underline">
              {report.quizTitle}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/homework/${report.id}/export`}
            className="rounded-full border-2 border-[#1E5167] px-4 py-2 text-sm font-semibold"
          >
            Download CSV
          </a>
          <button
            type="button"
            className="rounded-full border-2 border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
            onClick={() => {
              if (!window.confirm('Delete this assignment and its results?')) return
              void fetch(`/api/homework/${report.id}`, { method: 'DELETE' }).then(() => {
                router.push('/quizzes')
              })
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <section className="grid gap-4 rounded-2xl border-2 border-[#1E5167] bg-white p-4 md:grid-cols-[180px_1fr]">
        {qr ? (
          // The QR is a data URL of the class link, drawn for the teacher to project.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR code for the class link" className="h-44 w-44" />
        ) : (
          <div className="h-44 w-44 rounded-xl bg-slate-100" />
        )}
        <div>
          <p className="break-all rounded-xl bg-sky-50 p-3 text-sm">{link}</p>
          <button
            type="button"
            className="mt-2 rounded-full bg-[#114257] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              void navigator.clipboard.writeText(link)
              setCopied(true)
            }}
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <label className="mt-4 block text-sm font-semibold">
            Due date
            <input
              type="datetime-local"
              defaultValue={dueInputValue(report.dueAt)}
              key={report.dueAt}
              onBlur={(event) => {
                const next = dueInputToIso(event.target.value)
                if (next && next !== report.dueAt) void save({ dueAt: next, acceptingResponses: true })
              }}
              className="mt-1 w-full max-w-xs rounded-xl border px-3 py-2 font-normal"
            />
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={report.showLeaderboard}
              onChange={(event) => void save({ showLeaderboard: event.target.checked })}
            />
            Show the challenge leaderboard to students
          </label>
          <p className="mt-2 text-sm text-slate-600">
            {report.acceptingResponses ? 'Accepting new tries.' : 'New tries are closed.'} Move the due date later to reopen.
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Students finished" value={String(report.overview.finishedStudents)} />
        <Stat label="Class accuracy" value={report.overview.classAccuracy === null ? '—' : `${report.overview.classAccuracy}%`} />
        <Stat label="Answers" value={String(report.overview.totalAnswers)} />
        <Stat label="Wrong answers" value={String(report.overview.totalWrong)} />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="grandstander text-2xl font-bold">Students</h2>
          <button type="button" className="text-sm font-semibold underline" onClick={() => setSort(sort === 'accuracy' ? 'name' : 'accuracy')}>
            Sort by {sort === 'accuracy' ? 'name' : 'accuracy'}
          </button>
        </div>
        <div className="overflow-x-auto rounded-2xl border-2 border-[#1E5167] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Best</th>
                <th className="px-3 py-2">Tries</th>
                <th className="px-3 py-2">Best try</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Finished</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <Fragment key={student.studentName}>
                  <tr
                    className="cursor-pointer border-b border-slate-100"
                    tabIndex={0}
                    onClick={() =>
                      setOpenStudent(openStudent === student.studentName ? null : student.studentName)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setOpenStudent(openStudent === student.studentName ? null : student.studentName)
                      }
                    }}
                  >
                    <td className="px-3 py-2 font-semibold">{student.studentName}</td>
                    <td className="px-3 py-2">{student.bestPercentage}%</td>
                    <td className="px-3 py-2">{student.attemptCount}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex gap-1">
                        {student.strip.map((right, dot) => (
                          <span
                            key={`${student.studentName}-${dot}`}
                            className={`h-2.5 w-2.5 rounded-full ${right ? 'bg-green-500' : 'bg-red-400'}`}
                          />
                        ))}
                      </span>
                    </td>
                    <td className="px-3 py-2">{formatClock(student.bestDurationMs)}</td>
                    <td className="px-3 py-2">Yes</td>
                  </tr>
                  {openStudent === student.studentName ? (
                    <tr key={`${student.studentName}-detail`} className="border-b bg-slate-50">
                      <td colSpan={6} className="px-3 py-3">
                        {student.tries.map((attempt) => (
                          <div key={attempt.id} className="mb-3">
                            <p className="font-semibold">
                              {formatDue(attempt.createdAt)} · {attempt.percentage}% · {formatClock(attempt.durationMs)}
                            </p>
                            {attempt.misses.length === 0 ? (
                              <p className="text-slate-600">No misses.</p>
                            ) : (
                              <ul className="mt-1 space-y-1">
                                {attempt.misses.map((miss) => (
                                  <li key={`${attempt.id}-${miss.questionId}`}>
                                    {miss.questionText} — chose {miss.selectedAnswer || '—'}, right answer {miss.correctAnswer}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="grandstander mb-2 text-2xl font-bold">Hardest questions</h2>
        <div className="overflow-x-auto rounded-2xl border-2 border-[#1E5167] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Question</th>
                <th className="px-3 py-2">Answered</th>
                <th className="px-3 py-2">Wrong</th>
                <th className="px-3 py-2">Incorrect</th>
                <th className="px-3 py-2">Common miss</th>
              </tr>
            </thead>
            <tbody>
              {report.questions.map((question) => (
                <tr key={question.questionId} className="border-b border-slate-100">
                  <td className="px-3 py-2">{question.questionText}</td>
                  <td className="px-3 py-2">{question.answered}</td>
                  <td className="px-3 py-2">{question.wrong}</td>
                  <td className="px-3 py-2">{question.incorrectPercent}%</td>
                  <td className="px-3 py-2">{question.commonWrong ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="grandstander mb-2 text-2xl font-bold">Challenge leaderboard</h2>
        {report.challenge.length === 0 ? (
          <p className="text-sm text-slate-500">No challenge runs yet.</p>
        ) : (
          <ol className="space-y-1 rounded-2xl border-2 border-orange-200 bg-white p-4 text-sm">
            {report.challenge.map((row) => (
              <li key={`${row.rank}-${row.studentName}`} className="flex justify-between gap-3">
                <span>
                  {row.rank}. {row.studentName}
                </span>
                <span className="font-semibold">
                  {row.reachedHundred ? `Mega Chad ${formatClock(row.timeToHundredMs)}` : `${row.correctCount} correct`}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-[#1E5167] bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="grandstander text-2xl font-bold text-[#114257]">{value}</p>
    </div>
  )
}
