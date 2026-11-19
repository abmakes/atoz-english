'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import FaceStage from '@/components/thoughts/FaceStage'
import StudentSession from '@/components/thoughts/StudentSession'
import { useClipPlayer } from '@/components/thoughts/useClipPlayer'
import { submitThought } from '@/components/thoughts/api'
import { useVoiceRecorder } from '@/components/story_creator/useVoiceRecorder'
import { stepAmplitude } from '@/lib/thoughts/animation'
import type { Character } from '@/lib/thoughts/character'
import type { LessonSpeakPicture } from '@/lib/lesson/thought-assignment'
import type { ThoughtSessionDto } from '@/lib/thoughts/service'
import { VOICE_EFFECTS, VOICE_LABELS, type VoiceEffect } from '@/lib/thoughts/voices'

type Phase = 'brief' | 'make' | 'count' | 'speak' | 'listen' | 'submit' | 'sent'

/**
 * Lesson speaking: the task, the character maker, the recording screen,
 * playback with funny voices, then submit.
 */
export default function LessonSpeak({
  token,
  session,
}: {
  token: string
  session: ThoughtSessionDto
}) {
  const recorder = useVoiceRecorder()
  const player = useClipPlayer()
  const [phase, setPhase] = useState<Phase>('brief')
  const [count, setCount] = useState(3)
  const [character, setCharacter] = useState<Character | null>(null)
  const [name, setName] = useState('')
  const [voice, setVoice] = useState<VoiceEffect>('original')
  const [take, setTake] = useState<Awaited<ReturnType<typeof recorder.stop>>>(null)
  const [clientKey, setClientKey] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const smoothRef = useRef(0)
  const liveRef = useRef(0)
  const startedRef = useRef(false)
  const finishRef = useRef<() => void>(() => {})

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
      setMessage('Allow the microphone, then press Record.')
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
    setVoice('original')
    setMessage(null)
    setPhase('listen')
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
          voiceEffect: voice,
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

  const getLevel = () => (recorder.isRecording ? liveRef.current : player.levelRef.current)

  const playTake = (effect: VoiceEffect) => {
    if (!take) return
    setVoice(effect)
    void player.play({ blob: take.blob, envelope: take.envelope, effect })
  }

  useEffect(() => {
    if (phase !== 'listen' || !take) return
    void player.play({ blob: take.blob, envelope: take.envelope, effect: 'original' })
    return () => player.stop()
    // Play once when the recording is ready. Picking a voice starts it again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, take])

  const shareRecording = async () => {
    if (!take) return
    const type = take.mimeType || 'audio/webm'
    const extension = type.includes('mp4') ? 'm4a' : 'webm'
    const file = new File([take.blob], `my-thought.${extension}`, { type })
    const text = session.prompt
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My thought', text })
        return
      }
      if (navigator.share) {
        await navigator.share({ title: 'My thought', text })
        return
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setMessage('Could not open share. The recording is still here.')
      return
    }
    const link = document.createElement('a')
    link.href = take.objectUrl
    link.download = file.name
    link.click()
  }

  if (!session.acceptingResponses) {
    return (
      <Page>
        <p className="max-w-xs text-center text-2xl font-bold">{session.prompt}</p>
        <p className="text-center text-base">Your teacher has closed new recordings.</p>
      </Page>
    )
  }

  if (phase === 'brief') {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col justify-center gap-6 px-5 py-6 text-[--text-color] grandstander">
        <p className="text-center text-2xl font-bold leading-snug">{session.prompt}</p>
        <ol className="space-y-2 text-lg font-bold">
          <li>Step 1. Create your character.</li>
          <li>Step 2. Record.</li>
          <li>Step 3. Listen and pick a voice.</li>
          <li>Step 4. Submit.</li>
        </ol>
        <button type="button" className="neo-button bg-[--primary-accent] text-[--text-color]" onClick={() => setPhase('make')}>
          Start
        </button>
      </div>
    )
  }

  if (phase === 'make') {
    return (
      <StudentSession
        token={token}
        session={session}
        lessonStep
        notice={message}
        onContinue={(face) => {
          setCharacter(face)
          void begin()
        }}
      />
    )
  }

  if (phase === 'count') {
    return (
      <Page>
        <p className="text-center text-lg font-bold">Step 2. Record.</p>
        <p className="text-[7rem] font-bold leading-none" aria-live="assertive">
          {count}
        </p>
      </Page>
    )
  }

  if (phase === 'listen' && take && character) {
    return (
      <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-md flex-col overflow-hidden bg-white px-4 pb-3 text-[--text-color] grandstander">
        <p className="pt-2 text-center text-lg font-bold">Step 3. Listen and pick a voice.</p>
        <div className="flex min-h-0 flex-1 items-center justify-center py-1">
          <div className="aspect-square h-full max-h-full w-auto max-w-full">
            <FaceStage character={character} getLevel={getLevel} className="!h-full !w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {VOICE_EFFECTS.map((effect) => (
            <button
              key={effect}
              type="button"
              aria-pressed={voice === effect}
              onClick={() => playTake(effect)}
              className={`rounded-full border-[3px] border-[--text-color] px-2 py-2 text-sm font-bold shadow-[3px_3px_0_0_var(--text-color)] ${
                voice === effect ? 'bg-[--primary-accent]' : 'bg-white'
              }`}
            >
              {VOICE_LABELS[effect]}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="neo-button bg-white px-3 py-2 text-sm text-[--text-color]"
            onClick={() => {
              if (player.playing) player.stop()
              else playTake(voice)
            }}
          >
            {player.playing ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="neo-button bg-white px-3 py-2 text-sm text-[--text-color]"
            onClick={() => void shareRecording()}
          >
            Share
          </button>
        </div>
        {message ? <p className="pt-1 text-center text-xs font-semibold text-amber-800">{message}</p> : null}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="neo-button bg-white px-3 py-2 text-sm text-[--text-color]"
            onClick={() => {
              player.stop()
              setMessage(null)
              void begin()
            }}
          >
            Record again
          </button>
          <button
            type="button"
            className="neo-button bg-[--primary-accent] px-3 py-2 text-sm text-[--text-color]"
            onClick={() => {
              player.stop()
              setMessage(null)
              setPhase('submit')
            }}
          >
            Submit
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'submit') {
    return (
      <Page>
        <p className="text-center text-2xl font-bold">Step 4. Submit.</p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          maxLength={40}
          aria-label="Your name"
          className="h-12 w-full max-w-xs rounded-full border-2 border-[--border-dark] bg-white px-4 text-lg font-bold text-[--text-color] outline-none"
        />
        {message ? <p className="max-w-xs text-center text-sm font-semibold text-amber-800">{message}</p> : null}
        <button
          type="button"
          onClick={() => void send()}
          disabled={submitting || !take}
          className="neo-button bg-[--primary-accent] text-[--text-color] disabled:opacity-50"
        >
          {submitting ? 'Sending' : 'Submit'}
        </button>
        <button
          type="button"
          className="neo-button bg-white text-[--text-color]"
          onClick={() => {
            setTake(null)
            setClientKey(null)
            setMessage(null)
            void begin()
          }}
        >
          Record again
        </button>
      </Page>
    )
  }

  if (phase === 'sent') {
    return (
      <Page>
        <p className="text-4xl font-bold">Sent</p>
        <button
          type="button"
          onClick={() => {
            setTake(null)
            setClientKey(null)
            setMessage(null)
            setPhase('brief')
          }}
          className="neo-button bg-[--primary-accent] text-[--text-color]"
        >
          Start again
        </button>
      </Page>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-white text-[--text-color] grandstander">
      <div className="flex h-1/2 min-h-0 items-center justify-center px-3">
        {character ? (
          <div className="aspect-square h-full max-h-full w-auto max-w-full">
            <FaceStage character={character} getLevel={getLevel} className="!h-full !w-full" />
          </div>
        ) : null}
      </div>
      <div className="flex h-1/2 min-h-0 flex-col px-3 pb-3">
        <div className="min-h-0 flex-1 overflow-hidden">
          {session.pictures.length > 0 ? (
            <PictureBoard pictures={session.pictures} />
          ) : (
            <p className="flex h-full items-center justify-center overflow-y-auto text-center text-xl font-bold leading-snug">
              {session.prompt}
            </p>
          )}
        </div>
        {message ? <p className="shrink-0 pt-1 text-center text-xs font-semibold text-amber-800">{message}</p> : null}
        {recorder.isRecording ? (
          <button
            type="button"
            onClick={() => void finishRecording()}
            className="neo-button mx-auto mt-2 shrink-0 bg-white text-[--text-color]"
          >
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void begin()}
            className="neo-button mx-auto mt-2 shrink-0 bg-[--primary-accent] text-[--text-color]"
          >
            Record again
          </button>
        )}
      </div>
    </div>
  )
}

function Page({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col items-center justify-center gap-5 px-5 text-[--text-color] grandstander">
      {children}
    </div>
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
