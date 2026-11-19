'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import FaceStage from '@/components/thoughts/FaceStage'
import { submitThought } from '@/components/thoughts/api'
import { useVoiceRecorder } from '@/components/story_creator/useVoiceRecorder'
import { stepAmplitude } from '@/lib/thoughts/animation'
import { assembleRandomFace, type Character } from '@/lib/thoughts/character'
import type { LessonSpeakPicture } from '@/lib/lesson/thought-assignment'
import type { ThoughtSessionDto } from '@/lib/thoughts/service'

type Phase = 'start' | 'count' | 'speak' | 'sent'

/**
 * The lesson speaking page. One phone screen: a start button, a countdown,
 * then the face on top and the assignment underneath for the whole recording.
 */
export default function LessonSpeak({
  token,
  session,
}: {
  token: string
  session: ThoughtSessionDto
}) {
  const recorder = useVoiceRecorder()
  const [phase, setPhase] = useState<Phase>('start')
  const [count, setCount] = useState(3)
  const [character, setCharacter] = useState<Character | null>(null)
  const [name, setName] = useState('')
  const [take, setTake] = useState<Awaited<ReturnType<typeof recorder.stop>>>(null)
  const [clientKey, setClientKey] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const smoothRef = useRef(0)
  const liveRef = useRef(0)
  const startedRef = useRef(false)
  const finishRef = useRef<() => void>(() => {})

  useEffect(() => {
    setCharacter(assembleRandomFace())
  }, [])

  useEffect(() => {
    if (!recorder.isRecording) {
      smoothRef.current = 0
      liveRef.current = 0
      return
    }
    const stepped = stepAmplitude(smoothRef.current, recorder.level)
    smoothRef.current = stepped.state
    liveRef.current = stepped.level
  }, [recorder.isRecording, recorder.level])

  const startRecorder = recorder.start
  useEffect(() => {
    if (phase !== 'count') {
      startedRef.current = false
      return
    }
    const id = window.setTimeout(() => {
      if (count > 1) {
        setCount((current) => current - 1)
        return
      }
      if (startedRef.current) return
      startedRef.current = true
      setPhase('speak')
      startRecorder()
    }, 800)
    return () => window.clearTimeout(id)
  }, [phase, count, startRecorder])

  useEffect(() => {
    if (!recorder.isRecording) return
    const started = performance.now()
    const id = window.setInterval(() => {
      if (performance.now() - started >= 59_000) finishRef.current()
    }, 200)
    return () => window.clearInterval(id)
  }, [recorder.isRecording])

  const begin = async () => {
    setMessage(null)
    if (!recorder.isSupported) {
      setMessage('This phone cannot record audio.')
      return
    }
    const allowed = recorder.hasPermission || (await recorder.requestPermission())
    if (!allowed) {
      setMessage('Allow the microphone, then press Start.')
      return
    }
    setTake(null)
    setClientKey(null)
    setCount(3)
    setPhase('count')
  }

  const finishRecording = async () => {
    if (!recorder.isRecording) return
    const result = await recorder.stop()
    if (!result || result.envelope.length === 0 || result.durationMs < 400) {
      setMessage('Could not read that recording. Press Again.')
      setTake(null)
      return
    }
    if (result.durationMs > 60_000) {
      setMessage('Keep it under one minute.')
      setTake(null)
      return
    }
    setTake(result)
    setClientKey(crypto.randomUUID())
    setMessage(null)
  }
  finishRef.current = () => {
    void finishRecording()
  }

  const send = async () => {
    if (!character || !take || !clientKey) return
    const trimmed = name.trim()
    if (!trimmed) {
      setMessage('Add your name.')
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      await submitThought(
        token,
        trimmed,
        {
          clientKey,
          durationMs: Math.min(60_000, Math.round(take.durationMs)),
          envelope: take.envelope,
          character,
          voiceEffect: 'original',
        },
        take.blob
      )
      setPhase('sent')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send the recording.')
    } finally {
      setSubmitting(false)
    }
  }

  const getLevel = () => (recorder.isRecording ? liveRef.current : 0)

  if (!session.acceptingResponses) {
    return (
      <Screen>
        <p className="max-w-xs text-center text-xl font-semibold">{session.prompt}</p>
        <p className="text-center text-sm text-slate-600">Your teacher has closed new recordings.</p>
      </Screen>
    )
  }

  if (phase === 'start') {
    return (
      <Screen>
        <button
          type="button"
          onClick={() => void begin()}
          className="h-28 w-full max-w-xs rounded-full bg-violet-600 text-3xl font-bold text-white shadow-[0_8px_0_0_#5b21b6]"
        >
          Start
        </button>
        {message ? <p className="max-w-xs text-center text-sm font-semibold text-amber-800">{message}</p> : null}
      </Screen>
    )
  }

  if (phase === 'count') {
    return (
      <Screen>
        <p className="text-[8rem] font-bold leading-none text-violet-700" aria-live="assertive">
          {count}
        </p>
      </Screen>
    )
  }

  if (phase === 'sent') {
    return (
      <Screen>
        <p className="text-4xl font-bold">Sent</p>
        <button
          type="button"
          onClick={() => {
            setTake(null)
            setClientKey(null)
            setMessage(null)
            setPhase('start')
          }}
          className="rounded-full bg-violet-600 px-8 py-4 text-lg font-bold text-white"
        >
          Record another
        </button>
      </Screen>
    )
  }

  return (
    <FullScreen>
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#fbf6ef] text-[#1e1b4b]">
      <div className="flex h-1/2 min-h-0 items-center justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        {character ? (
          <div className="aspect-square h-full max-h-full w-auto max-w-full">
            <FaceStage character={character} getLevel={getLevel} className="!h-full !w-full" />
          </div>
        ) : null}
      </div>
      <div className="flex h-1/2 min-h-0 flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-h-0 flex-1 overflow-hidden">
          {session.pictures.length > 0 ? (
            <PictureBoard pictures={session.pictures} />
          ) : (
            <p className="flex h-full items-center justify-center overflow-y-auto text-center text-xl font-semibold leading-snug">
              {session.prompt}
            </p>
          )}
        </div>
        {message ? <p className="shrink-0 pt-1 text-center text-xs font-semibold text-amber-800">{message}</p> : null}
        {recorder.isRecording ? (
          <button
            type="button"
            onClick={() => void finishRecording()}
            className="mx-auto mt-2 h-12 shrink-0 rounded-full bg-rose-600 px-8 text-base font-bold text-white"
          >
            Stop
          </button>
        ) : take ? (
          <div className="mt-2 flex shrink-0 items-center gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              maxLength={40}
              aria-label="Your name"
              className="h-12 min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 text-base font-semibold outline-none"
            />
            <button
              type="button"
              onClick={() => void begin()}
              className="h-12 shrink-0 rounded-full bg-white px-4 text-sm font-bold text-violet-800"
            >
              Again
            </button>
            <button
              type="button"
              onClick={() => void send()}
              disabled={submitting}
              className="h-12 shrink-0 rounded-full bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {submitting ? 'Sending' : 'Send'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void begin()}
            className="mx-auto mt-2 h-12 shrink-0 rounded-full bg-violet-600 px-8 text-base font-bold text-white"
          >
            Again
          </button>
        )}
      </div>
    </div>
    </FullScreen>
  )
}

function FullScreen({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <FullScreen>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#fbf6ef] px-6 text-[#1e1b4b]">
        {children}
      </div>
    </FullScreen>
  )
}

function PictureBoard({ pictures }: { pictures: LessonSpeakPicture[] }) {
  const columns = pictures.length === 1 ? 1 : pictures.length === 2 || pictures.length === 4 ? 2 : 3
  const rows = pictures.length > 3 ? 2 : 1
  return (
    <div
      className="grid h-full min-h-0 gap-2"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {pictures.map((picture, index) => (
        <figure
          key={`${picture.imageUrl}-${index}`}
          className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white"
        >
          <div className="min-h-0 flex-1">
            <img
              src={picture.imageUrl}
              alt={picture.line || 'Lesson picture'}
              className="h-full w-full object-contain"
            />
          </div>
          {picture.line ? (
            <figcaption className="line-clamp-2 shrink-0 px-1 pb-1 text-center text-xs font-semibold leading-tight">
              {picture.line}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  )
}
