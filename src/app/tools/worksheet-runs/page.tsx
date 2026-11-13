'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface Run {
  id: string
  title: string
  level: string
  status: string
  rejected: { reason?: string; line?: string }[]
  solver: { skipped?: boolean; disagreements?: { line: string; expected: string; got: string }[]; ambiguous?: number[]; error?: string }
  error: string
  createdAt: string
}

export default function WorksheetRunsPage() {
  const [runs, setRuns] = useState<Run[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    void fetch('/api/tools/worksheet-runs')
      .then((response) => response.json())
      .then((body: { runs?: Run[]; error?: string }) => {
        if (body.error) throw new Error(body.error)
        setRuns(body.runs ?? [])
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Could not load reports.'))
  }, [])

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/tools/worksheet" className="text-sm font-semibold underline">← Worksheets</Link>
        <h1 className="grandstander mt-3 text-3xl font-bold text-[#114257]">Worksheet reports</h1>
        <p className="mt-2 text-sm text-slate-600">
          Every check stores the lines it rejected and any item where a student-style read disagreed with the answer key.
        </p>
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        <ul className="mt-6 flex flex-col gap-4">
          {runs.map((run) => (
            <li key={run.id} className="rounded border bg-white p-4 text-sm">
              <p className="font-bold">{run.title || 'Untitled'} · {run.level} · {run.status}</p>
              <p className="text-slate-500">{new Date(run.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Saigon' })} · Asia/Saigon</p>
              {run.error ? <p className="mt-2 text-red-700">{run.error}</p> : null}
              {(run.rejected ?? []).slice(0, 8).map((item, index) => (
                <p key={index} className="mt-1">{item.reason}: {item.line}</p>
              ))}
              {(run.solver?.disagreements ?? []).slice(0, 8).map((item, index) => (
                <p key={`d-${index}`} className="mt-1">Check answered “{item.got}” for “{item.line}”. Key: {item.expected}</p>
              ))}
              {run.solver?.error ? <p className="mt-1">{run.solver.error}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </ProtectedRoute>
  )
}
