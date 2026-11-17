'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDue } from '@/lib/assignments/due'

interface AssignmentRow {
  id: string
  kind: 'quiz' | 'thoughts' | 'story'
  title: string
  assignedAt: string
  dueAt: string | null
  submissions: number
  href: string
}

const KIND_LABEL = {
  quiz: 'Quiz',
  thoughts: 'Thoughts',
  story: 'Story',
} as const

export default function AssignmentsPanel() {
  const [rows, setRows] = useState<AssignmentRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/assignments', { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || 'Could not load assignments.')
        setRows(Array.isArray(payload.data) ? payload.data : [])
      } catch (reason: unknown) {
        setError(reason instanceof Error ? reason.message : 'Could not load assignments.')
        setRows([])
      }
    })()
  }, [])

  if (!rows) {
    return <p className="text-sm text-slate-500">Loading assignments…</p>
  }
  if (error) {
    return <p className="text-sm text-red-700">{error}</p>
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[#1E5167] py-10 text-center">
        <p className="grandstander text-xl text-slate-500">No assignments yet.</p>
        <p className="mt-2 text-sm text-slate-500">
          Assign a multiple-choice quiz, or create a Thought or a story. They all show up here.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-[#1E5167] bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Assignment</th>
            <th className="px-4 py-3 font-semibold">Kind</th>
            <th className="px-4 py-3 font-semibold">Assigned</th>
            <th className="px-4 py-3 font-semibold">Due</th>
            <th className="px-4 py-3 font-semibold">Submissions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.kind}-${row.id}`} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3">
                <Link href={row.href} className="font-semibold text-[#114257] underline-offset-2 hover:underline">
                  {row.title}
                </Link>
              </td>
              <td className="px-4 py-3">{KIND_LABEL[row.kind]}</td>
              <td className="px-4 py-3">{formatDue(row.assignedAt)}</td>
              <td className="px-4 py-3">{formatDue(row.dueAt)}</td>
              <td className="px-4 py-3 tabular-nums">{row.submissions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
