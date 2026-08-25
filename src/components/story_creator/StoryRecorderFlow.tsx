'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { StorySessionDto } from '@/components/story_creator/api'
import MouthedImage from '@/components/story_creator/MouthedImage'
import MoviePlayer from '@/components/story_creator/MoviePlayer'
import {
  useVoiceRecorder,
  type RecordingResult,
} from '@/components/story_creator/useVoiceRecorder'
import { envelopeValueAt } from '@/lib/stories/envelope'
import { RECORDING_MAX_DURATION_MS } from '@/lib/stories/schemas'
import {
  Mic,
  Square,
  Check,
  RotateCcw,
  Loader2,
  Send,
  PartyPopper,
  Film,
} from 'lucide-react'

interface StoryRecorderFlowProps {
  token: string
  session: StorySessionDto
}

type Step = 'welcome' | 'mic' | 'record' | 'review' | 'sending' | 'done'
type RecordStage = 'ready' | 'recording' | 'playback'

export default function StoryRecorderFlow({
  token,
  session,
}: StoryRecorderFlowProps) {
  const recorder = useVoiceRecorder()
  const [step, setStep] = useState<Step>('welcome')
  const [studentName, setStudentName] = useState('')
  const [panelIndex, setPanelIndex] = useState(0)
  const [stage, setStage] = useState<RecordStage>('ready')
  const [recordings, setRecordings] = useState<(RecordingResult | null)[]>(
    session.panels.map(() => null)
  )
  const [elapsedMs, setElapsedMs] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(null)

  const playbackRef = useRef<HTMLAudioElement | null>(null)
  const recorderLevelRef = useRef(0)
  recorderLevelRef.current = recorder.level

  const panels = session.panels
  const panel = panels[panelIndex]

  // Recording timer + auto-stop safety.
  useEffect(() => {
    if (stage !== 'recording') return
    const startedAt = performance.now()
    const interval = setInterval(() => {
      const elapsed = performance.now() - startedAt
      setElapsedMs(elapsed)
      if (elapsed >= RECORDING_MAX_DURATION_MS - 1000) {
        void stopRecording()
      }
    }, 200)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  const startRecording = useCallback(() => {
    setElapsedMs(0)
    recorder.start()
    setStage('recording')
  }, [recorder])

  const stopRecording = useCallback(async () => {
    const result = await recorder.stop()
    if (!result) {
      setStage('ready')
      return
    }
    setRecordings((current) => {
      const next = [...current]
      const previous = next[panelIndex]
      if (previous) URL.revokeObjectURL(previous.objectUrl)
      next[panelIndex] = result
      return next
    })
    setStage('playback')
    // Auto-play so the student immediately hears themselves.
    requestAnimationFrame(() => {
      if (playbackRef.current) {
        playbackRef.current.src = result.objectUrl
        void playbackRef.current.play().catch(() => {})
      }
    })
  }, [recorder, panelIndex])

  const getMouthOpen = useCallback((): number => {
    if (stage === 'recording') {
      return Math.min(1, recorderLevelRef.current * 1.4)
    }
    if (stage === 'playback') {
      const audio = playbackRef.current
      const recording = recordings[panelIndex]
      if (audio && recording && !audio.paused && !audio.ended) {
        const offsetMs = audio.currentTime * 1000
        return recording.envelope.length > 0
          ? envelopeValueAt(recording.envelope, offsetMs)
          : 0.5 + 0.5 * Math.sin(offsetMs * 0.025)
      }
    }
    return 0
  }, [stage, recordings, panelIndex])

  const confirmPanel = useCallback(() => {
    playbackRef.current?.pause()
    const nextMissing = recordings.findIndex(
      (recording, index) => index !== panelIndex && recording === null
    )
    if (nextMissing === -1) {
      setStep('review')
    } else {
      setPanelIndex(nextMissing)
      setStage('ready')
    }
  }, [recordings, panelIndex])

  const redoPanel = useCallback((index: number) => {
    setPanelIndex(index)
    setStage('ready')
    setStep('record')
  }, [])

  const submit = useCallback(async () => {
    setStep('sending')
    setSubmitError(null)
    try {
      const formData = new FormData()
      formData.append('studentName', studentName.trim())
      formData.append(
        'meta',
        JSON.stringify(
          recordings.map((recording, index) => ({
            panelOrder: index + 1,
            durationMs: Math.max(200, recording?.durationMs ?? 200),
            envelope: recording?.envelope ?? [],
          }))
        )
      )
      recordings.forEach((recording, index) => {
        if (recording) {
          formData.append(
            `audio-${index + 1}`,
            recording.blob,
            `panel-${index + 1}`
          )
        }
      })
      const response = await fetch(`/api/story-session/${token}/submit`, {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Upload failed')
      }
      setSubmissionId(payload?.data?.submissionId ?? null)
      setStep('done')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Something went wrong.'
      )
      setStep('review')
    }
  }, [recordings, studentName, token])

  if (!recorder.isSupported) {
    return (
      <CenterCard>
        <p className="text-xl font-bold text-[#114257]">
          This browser cannot record sound.
        </p>
        <p className="mt-2 text-slate-600">
          Please open this link in Chrome or Safari on a phone, tablet, or
          computer with a microphone.
        </p>
      </CenterCard>
    )
  }

  if (step === 'welcome') {
    return (
      <CenterCard>
        <h1 className="grandstander text-3xl font-bold text-[#114257]">
          {session.title}
        </h1>
        <p className="mt-2 text-slate-600">
          Tell this story with your own voice — one recording for each picture.
          At the end you get your own movie!
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {panels.map((candidate) =>
            candidate.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={candidate.order}
                src={candidate.imageUrl}
                alt={`Picture ${candidate.order}`}
                className="w-full rounded-lg border object-cover"
                style={{ aspectRatio: '4 / 3' }}
              />
            ) : null
          )}
        </div>
        {session.showExample && session.exampleStory && (
          <p className="mt-4 rounded-lg bg-violet-50 p-3 text-left text-sm text-violet-900">
            <span className="font-bold">Example:</span> {session.exampleStory}
          </p>
        )}
        <input
          value={studentName}
          onChange={(event) => setStudentName(event.target.value)}
          placeholder="Type your name"
          maxLength={40}
          className="mt-6 w-full rounded-xl border-2 border-violet-300 px-4 py-3 text-center text-lg focus:border-violet-500 focus:outline-none"
        />
        <BigButton
          disabled={studentName.trim().length === 0}
          onClick={() => setStep('mic')}
        >
          Start
        </BigButton>
      </CenterCard>
    )
  }

  if (step === 'mic') {
    return (
      <CenterCard>
        <Mic className="mx-auto h-16 w-16 text-violet-500" />
        <h2 className="grandstander mt-4 text-2xl font-bold text-[#114257]">
          We need your microphone
        </h2>
        <p className="mt-2 text-slate-600">
          So you can tell the story! When the phone asks, tap{' '}
          <span className="font-bold">Allow</span>.
        </p>
        <BigButton
          onClick={() => {
            void recorder.requestPermission().then((granted) => {
              if (granted) {
                setStep('record')
                setStage('ready')
              }
            })
          }}
        >
          Turn on microphone
        </BigButton>
        {!recorder.hasPermission && (
          <p className="mt-3 text-xs text-slate-400">
            If nothing happens, check the microphone setting in your browser.
          </p>
        )}
      </CenterCard>
    )
  }

  if (step === 'record' && panel) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6">
        <p className="grandstander text-center text-lg font-bold text-[#114257]">
          Picture {panel.order} of {panels.length}
        </p>
        <div className="mt-3">
          <MouthedImage
            imageUrl={panel.imageUrl ?? ''}
            mouth={panel.mouth}
            getOpen={getMouthOpen}
          />
        </div>
        {panel.exampleSentence && (
          <p className="mt-3 rounded-lg bg-violet-50 p-3 text-center text-sm text-violet-900">
            {panel.exampleSentence}
          </p>
        )}

        <div className="mt-auto pt-6">
          {stage === 'ready' && (
            <div className="text-center">
              <p className="mb-4 text-slate-600">
                Tap the button and tell this part of your story!
              </p>
              <button
                type="button"
                onClick={startRecording}
                aria-label="Start recording"
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500 text-white shadow-xl transition-transform active:scale-95"
              >
                <Mic className="h-12 w-12" />
              </button>
            </div>
          )}

          {stage === 'recording' && (
            <div className="text-center">
              <div className="mx-auto mb-3 h-3 w-56 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-green-500 transition-[width] duration-100"
                  style={{ width: `${Math.min(100, recorder.level * 130)}%` }}
                />
              </div>
              <p className="mb-4 font-mono text-slate-600">
                {(elapsedMs / 1000).toFixed(0)}s — I&apos;m listening!
              </p>
              <button
                type="button"
                onClick={() => void stopRecording()}
                aria-label="Stop recording"
                className="mx-auto flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-red-600 text-white shadow-xl"
              >
                <Square className="h-10 w-10 fill-current" />
              </button>
            </div>
          )}

          {stage === 'playback' && (
            <div className="text-center">
              <p className="mb-4 text-slate-600">Listen — how does it sound?</p>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStage('ready')
                  }}
                  className="flex h-16 items-center gap-2 rounded-full border-2 border-amber-400 bg-amber-50 px-6 text-lg font-bold text-amber-700 active:scale-95"
                >
                  <RotateCcw className="h-6 w-6" />
                  Try again
                </button>
                <button
                  type="button"
                  onClick={confirmPanel}
                  className="flex h-16 items-center gap-2 rounded-full bg-green-500 px-6 text-lg font-bold text-white shadow-lg active:scale-95"
                >
                  <Check className="h-6 w-6" />
                  Sounds good!
                </button>
              </div>
              <button
                type="button"
                onClick={() => void playbackRef.current?.play()}
                className="mt-4 text-sm text-violet-600 underline"
              >
                Play it again
              </button>
            </div>
          )}
        </div>
        <audio ref={playbackRef} className="hidden" />
      </div>
    )
  }

  if (step === 'review') {
    const clips = recordings.map((recording) => ({
      audioUrl: recording?.objectUrl ?? '',
      durationMs: recording?.durationMs ?? 1000,
      envelope: recording?.envelope ?? [],
    }))
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h2 className="grandstander text-center text-2xl font-bold text-[#114257]">
          Watch your movie!
        </h2>
        <p className="mb-4 mt-1 text-center text-slate-600">
          If you like it, send it to your teacher. You can still fix any picture.
        </p>
        <MoviePlayer
          title={session.title}
          byline={`A film by ${studentName.trim()}`}
          panels={panels.map((candidate) => ({
            imageUrl: candidate.imageUrl ?? '',
            mouth: candidate.mouth,
          }))}
          clips={clips}
        />
        <div className="mt-4 grid grid-cols-4 gap-2">
          {panels.map((candidate, index) => (
            <button
              key={candidate.order}
              type="button"
              onClick={() => redoPanel(index)}
              className="rounded-lg border-2 border-slate-200 p-1 text-center text-xs text-slate-600 hover:border-amber-400"
            >
              {candidate.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={candidate.imageUrl}
                  alt={`Picture ${candidate.order}`}
                  className="w-full rounded object-cover"
                  style={{ aspectRatio: '4 / 3' }}
                />
              ) : null}
              <span className="mt-1 flex items-center justify-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Redo {candidate.order}
              </span>
            </button>
          ))}
        </div>
        {submitError && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
            {submitError} — please try again.
          </p>
        )}
        <BigButton onClick={() => void submit()}>
          <Send className="mr-2 inline h-6 w-6" />
          Send to my teacher
        </BigButton>
      </div>
    )
  }

  if (step === 'sending') {
    return (
      <CenterCard>
        <Loader2 className="mx-auto h-14 w-14 animate-spin text-violet-500" />
        <p className="grandstander mt-4 text-xl font-bold text-[#114257]">
          Sending your movie…
        </p>
        <p className="mt-2 text-sm text-slate-500">Keep this page open!</p>
      </CenterCard>
    )
  }

  return (
    <CenterCard>
      <PartyPopper className="mx-auto h-16 w-16 text-violet-500" />
      <h2 className="grandstander mt-4 text-3xl font-bold text-[#114257]">
        Your movie was sent!
      </h2>
      <p className="mt-2 text-slate-600">
        Great storytelling, {studentName.trim()}! Your teacher can watch it now.
      </p>
      {submissionId && (
        <a
          href={`/story/${token}/watch/${submissionId}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-lg font-bold text-white shadow-lg"
        >
          <Film className="h-6 w-6" />
          Watch my movie
        </a>
      )}
    </CenterCard>
  )
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border-2 border-violet-200 bg-white p-8 text-center shadow-lg">
        {children}
      </div>
    </div>
  )
}

function BigButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grandstander mt-6 w-full rounded-2xl bg-violet-600 py-4 text-xl font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-40"
    >
      {children}
    </button>
  )
}
