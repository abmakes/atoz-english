'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ImageSelectModal from '@/components/management_ui/ImageSelectModal'
import WorksheetSetup, { type WorksheetPick } from '@/components/lesson/WorksheetSetup'
import { Button } from '@/components/ui/button'

interface PictureDraft {
  imageUrl: string
  question: string
  answers: string[]
  correctAnswer: string
}

interface SheetSummary {
  id: string
  title: string
  level: string
}

const LEVELS = ['PRE_A1', 'A1', 'A2', 'B1'] as const

export default function WorksheetToolPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('A1')
  const [grammar, setGrammar] = useState('')
  const [source, setSource] = useState('')
  const [step, setStep] = useState<'details' | 'options'>('details')
  const [pictures, setPictures] = useState<PictureDraft[]>([])
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sheets, setSheets] = useState<SheetSummary[]>([])

  useEffect(() => {
    void fetch('/api/tools/worksheets')
      .then((response) => response.json())
      .then((body: { sheets?: SheetSummary[] }) => setSheets(body.sheets ?? []))
      .catch(() => setSheets([]))
  }, [])

  const generate = async (choice: { pages: 1 | 2; sections: WorksheetPick[] }) => {
    if (pictures.some((picture) => !picture.question.trim() || picture.answers.some((answer) => !answer.trim()) || !picture.correctAnswer.trim())) {
      setError('Each picture needs its question and answers.')
      setStep('details')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/tools/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, level, grammar, source, sections: choice.sections, pages: choice.pages, pictures }),
      })
      const body = (await response.json()) as { id?: string; error?: string }
      if (!response.ok || !body.id) throw new Error(body.error || 'Could not write the worksheet.')
      router.push(`/tools/worksheet/${body.id}`)
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Could not write the worksheet.')
      setBusy(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/tools" className="text-sm font-semibold text-violet-700 underline">
          ← Teacher tools
        </Link>
        <h1 className="grandstander mt-3 text-4xl font-bold text-[#114257]">Worksheet</h1>
        <p className="mt-2 text-slate-600">
          Paste the grammar, or paste the text of a page. Picture questions are left out unless you add a photo and the question that goes with it.
        </p>
        {step === 'options' ? (
          <div className="mt-6">
            <WorksheetSetup
              level={level}
              hasPictures={pictures.length > 0}
              busy={busy}
              onBack={() => setStep('details')}
              onWrite={(choice) => void generate(choice)}
            />
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          </div>
        ) : null}
        <div className={`mt-6 flex flex-col gap-4 ${step === 'options' ? 'hidden' : ''}`}>
          <label className="text-sm font-semibold">
            Title
            <input className="mt-1 w-full rounded border px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Level
            <select className="mt-1 w-full rounded border px-3 py-2" value={level} onChange={(event) => setLevel(event.target.value as (typeof LEVELS)[number])}>
              {LEVELS.map((option) => (
                <option key={option} value={option}>{option.replace('_', '-')}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Grammar
            <textarea className="mt-1 w-full rounded border px-3 py-2" rows={2} value={grammar} onChange={(event) => setGrammar(event.target.value)} placeholder="comparatives, there is / there are" />
          </label>
          <label className="text-sm font-semibold">
            Paste a page or notes
            <textarea className="mt-1 w-full rounded border px-3 py-2" rows={5} value={source} onChange={(event) => setSource(event.target.value)} />
          </label>
          <div>
            <Button type="button" variant="outline" onClick={() => setPicking(true)} disabled={pictures.length >= 6}>
              Add a picture question
            </Button>
            <ul className="mt-3 flex flex-col gap-3">
              {pictures.map((picture, index) => (
                <li key={`${picture.imageUrl}-${index}`} className="rounded border p-3 text-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={picture.imageUrl} alt="" className="mb-2 h-16 w-24 object-cover" />
                  <input className="mb-2 w-full rounded border px-2 py-1" value={picture.question} placeholder="Question" onChange={(event) => setPictures(pictures.map((row, rowIndex) => (rowIndex === index ? { ...row, question: event.target.value } : row)))} />
                  {picture.answers.map((answer, answerIndex) => (
                    <label key={answerIndex} className="mb-1 flex items-center gap-2">
                      <input type="radio" checked={picture.correctAnswer === answer} onChange={() => setPictures(pictures.map((row, rowIndex) => (rowIndex === index ? { ...row, correctAnswer: answer } : row)))} />
                      <input className="w-full rounded border px-2 py-1" value={answer} onChange={(event) => {
                        const answers = picture.answers.map((value, valueIndex) => (valueIndex === answerIndex ? event.target.value : value))
                        setPictures(pictures.map((row, rowIndex) => (rowIndex === index ? { ...row, answers, correctAnswer: row.correctAnswer === answer ? event.target.value : row.correctAnswer } : row)))
                      }} />
                    </label>
                  ))}
                  <button type="button" className="text-xs underline" onClick={() => setPictures(pictures.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button
            type="button"
            disabled={!title.trim()}
            onClick={() => {
              if (pictures.some((picture) => !picture.question.trim() || picture.answers.some((answer) => !answer.trim()) || !picture.correctAnswer.trim())) {
                setError('Each picture needs its question and answers.')
                return
              }
              setError('')
              setStep('options')
            }}
            className="bg-violet-700 text-white"
          >
            Choose the questions
          </Button>
        </div>
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Saved worksheets</h2>
            <Link href="/tools/worksheet-runs" className="text-sm underline">Generation reports</Link>
          </div>
          <ul className="mt-2 text-sm">
            {sheets.map((sheet) => (
              <li key={sheet.id}>
                <Link href={`/tools/worksheet/${sheet.id}`} className="underline">{sheet.title}</Link>
                <span className="text-slate-500"> · {sheet.level}</span>
              </li>
            ))}
          </ul>
        </div>
        <ImageSelectModal
          isOpen={picking}
          onClose={() => setPicking(false)}
          onImageSelect={(imageUrl) => {
            setPictures([...pictures, { imageUrl, question: '', answers: ['', '', ''], correctAnswer: '' }])
            setPicking(false)
          }}
        />
      </div>
    </ProtectedRoute>
  )
}
