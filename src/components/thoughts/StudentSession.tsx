'use client'

import { useEffect, useRef, useState } from 'react'
import FaceStage from '@/components/thoughts/FaceStage'
import PartsTray from '@/components/thoughts/PartsTray'
import { useClipPlayer } from '@/components/thoughts/useClipPlayer'
import { useVoiceRecorder } from '@/components/story_creator/useVoiceRecorder'
import {
  classAudioUrl,
  fetchAudioBlob,
  submitThought,
} from '@/components/thoughts/api'
import { stepAmplitude } from '@/lib/thoughts/animation'
import {
  addCatalogPart,
  assembleRandomFace,
  bringPartIntoView,
  deletePart,
  readSavedFace,
  readSavedName,
  updatePart,
  writeSavedFace,
  writeSavedName,
  type Character,
} from '@/lib/thoughts/character'
import { getPart } from '@/lib/thoughts/catalog'
import type { ThoughtPublicClip, ThoughtSessionDto } from '@/lib/thoughts/service'
import { formatDuration, VOICE_EFFECTS, VOICE_LABELS, type VoiceEffect } from '@/lib/thoughts/voices'

type Step = 'make' | 'talk' | 'send'
type Tab = 'mine' | 'gallery'
type StyleFilter = 'cartoon' | 'photo' | 'sketch'

export default function StudentSession({
  token,
  session,
}: {
  token: string
  session: ThoughtSessionDto
}) {
  const recorder = useVoiceRecorder()
  const player = useClipPlayer()
  const [tab, setTab] = useState<Tab>('mine')
  const [step, setStep] = useState<Step>('make')
  const [character, setCharacter] = useState<Character | null>(null)
  const [undo, setUndo] = useState<Character[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [style, setStyle] = useState<StyleFilter>('cartoon')
  const [customizing, setCustomizing] = useState(false)
  const [name, setName] = useState('')
  const [voice, setVoice] = useState<VoiceEffect>('original')
  const [take, setTake] = useState<Awaited<ReturnType<typeof recorder.stop>>>(null)
  const [clientKey, setClientKey] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [recordMs, setRecordMs] = useState(0)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [activeClip, setActiveClip] = useState<string | null>(null)
  const baselineRef = useRef<Character | null>(null)
  const smoothRef = useRef(0)
  const liveRef = useRef(0)
  const finishRef = useRef<() => void>(() => {})

  useEffect(() => {
    const saved = readSavedFace()
    const face = saved ?? assembleRandomFace()
    setCharacter(face)
    baselineRef.current = face
    setName(readSavedName())
  }, [])

  useEffect(() => {
    if (character) writeSavedFace(character)
  }, [character])

  useEffect(() => {
    writeSavedName(name)
  }, [name])

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
    if (countdown === null) return
    if (countdown === 0) {
      setCountdown(null)
      startRecorder()
      return
    }
    const id = window.setTimeout(
      () => setCountdown((current) => (current === null ? null : current - 1)),
      700
    )
    return () => window.clearTimeout(id)
  }, [countdown, startRecorder])

  useEffect(() => {
    if (!recorder.isRecording) return
    const started = performance.now()
    const id = window.setInterval(() => {
      const elapsed = performance.now() - started
      setRecordMs(elapsed)
      if (elapsed >= 59_000) finishRef.current()
    }, 200)
    return () => window.clearInterval(id)
  }, [recorder.isRecording])

  const commit = (next: Character) => {
    setCharacter((current) => {
      if (current) setUndo((stack) => [...stack, current].slice(-30))
      return next
    })
  }

  const finishRecording = async () => {
    if (!recorder.isRecording) return
    const result = await recorder.stop()
    setRecordMs(0)
    if (!result || result.envelope.length === 0 || result.durationMs < 400) {
      setMessage('Could not read that recording. Try again.')
      setStep('talk')
      return
    }
    if (result.durationMs > 60_000) {
      setMessage('Keep it under one minute.')
      return
    }
    setTake(result)
    setClientKey(crypto.randomUUID())
    setMessage(null)
    setStep('send')
    await player.play({
      blob: result.blob,
      envelope: result.envelope,
      effect: session.allowFunnyVoices ? voice : 'original',
    })
  }
  finishRef.current = () => {
    void finishRecording()
  }

  const startRecording = async () => {
    if (!recorder.isSupported) {
      setMessage('This browser cannot record audio.')
      return
    }
    player.stop()
    setMessage(null)
    setStep('talk')
    const allowed = recorder.hasPermission || (await recorder.requestPermission())
    if (!allowed) {
      setMessage('Allow the microphone to record.')
      return
    }
    setCountdown(3)
  }

  const send = async () => {
    if (!character || !take || !clientKey) return
    const trimmed = name.trim()
    if (!trimmed) {
      setMessage('Add a first name or class nickname.')
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
          voiceEffect: session.allowFunnyVoices ? voice : 'original',
        },
        take.blob
      )
      player.stop()
      setSent(true)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send the recording.')
    } finally {
      setSubmitting(false)
    }
  }

  const selected = character?.parts.find((part) => part.instanceId === selectedId)
  const selectedDef = selected ? getPart(selected.partId) : undefined

  useEffect(() => {
    if (!customizing || !selectedId || !character) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
      const nudge = event.shiftKey ? 0.04 : 0.01
      const move = (dx: number, dy: number) => {
        setCharacter((current) => {
          if (!current) return current
          const part = current.parts.find((item) => item.instanceId === selectedId)
          if (!part) return current
          return updatePart(current, selectedId, { x: part.x + dx, y: part.y + dy })
        })
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        move(-nudge, 0)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        move(nudge, 0)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        move(0, -nudge)
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        move(0, nudge)
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        setCharacter((current) => (current ? deletePart(current, selectedId) : current))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [customizing, selectedId])

  if (!character) {
    return <p className="p-10 text-center text-slate-500">Building a face…</p>
  }

  const getLevel = () => (recorder.isRecording ? liveRef.current : player.levelRef.current)

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#fbf6ef] px-4 py-6 text-[#1e1b4b]">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#f3e7d3] bg-[#fffaf3] p-4 shadow-sm md:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-xl text-white">
              :)
            </span>
            <h1 className="grandstander text-3xl font-bold">Thoughts</h1>
          </div>
          <div className="flex rounded-full bg-white p-1">
            <button
              type="button"
              onClick={() => setTab('mine')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'mine' ? 'bg-violet-100 text-violet-800' : 'text-slate-500'}`}
            >
              My recording
            </button>
            <button
              type="button"
              onClick={() => setTab('gallery')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'gallery' ? 'bg-violet-100 text-violet-800' : 'text-slate-500'}`}
            >
              Class gallery
            </button>
          </div>
          <label className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm">
            <span className="text-slate-500">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="First name or nickname"
              maxLength={40}
              className="w-36 bg-transparent font-semibold outline-none"
              aria-label="First name or class nickname"
            />
          </label>
        </header>

        {tab === 'gallery' ? (
          <Gallery
            showGallery={session.showGallery}
            clips={session.gallery}
            activeId={activeClip}
            getLevel={getLevel}
            onPlay={async (clip) => {
              if (player.playing && activeClip === clip.id) {
                player.stop()
                setActiveClip(null)
                return
              }
              const blob = await fetchAudioBlob(classAudioUrl(token, clip.id))
              setActiveClip(clip.id)
              await player.play({ blob, envelope: clip.envelope, effect: clip.voiceEffect })
            }}
          />
        ) : sent ? (
          <div className="mx-auto max-w-lg py-16 text-center">
            <p className="grandstander text-3xl font-bold">Sent!</p>
            <p className="mt-3 text-slate-600">
              Your teacher will decide whether to share this with the class.
            </p>
            <button
              type="button"
              className="mt-8 rounded-full bg-violet-600 px-6 py-3 font-semibold text-white"
              onClick={() => {
                setSent(false)
                setTake(null)
                setClientKey(null)
                setStep('make')
                setCustomizing(false)
              }}
            >
              Record another
            </button>
          </div>
        ) : !session.acceptingResponses ? (
          <div className="mx-auto max-w-lg py-16 text-center">
            <p className="text-sm font-semibold text-violet-700">Your teacher asks</p>
            <p className="grandstander mt-2 text-2xl font-bold">{session.prompt}</p>
            <p className="mt-6 text-slate-600">Your teacher has closed new recordings.</p>
          </div>
        ) : (
          <div className="mt-6">
            <ol className="mb-4 flex items-center justify-center gap-3 text-sm font-semibold">
              {(['make', 'talk', 'send'] as const).map((item, index) => (
                <li key={item} className="flex items-center gap-3">
                  <span className={step === item ? 'text-violet-700' : 'text-slate-400'}>
                    {`${index + 1} ${item[0].toUpperCase()}${item.slice(1)}`}
                  </span>
                  {index < 2 ? <span className="h-px w-8 bg-slate-300" /> : null}
                </li>
              ))}
            </ol>
            {step !== 'make' ? (
              <div className="mb-4 rounded-2xl bg-[#fff4cc] px-4 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Your teacher asks</p>
                <p className="grandstander text-xl font-bold">{session.prompt}</p>
              </div>
            ) : null}
            <div className={`grid gap-4 ${customizing || step === 'talk' ? 'lg:grid-cols-[240px_1fr_260px]' : ''}`}>
              {customizing && step !== 'send' ? (
                <PartsTray
                  style={style}
                  onStyle={setStyle}
                  onPick={(partId) => {
                    const result = addCatalogPart(character, partId)
                    if ('error' in result) {
                      setMessage(result.error)
                      return
                    }
                    commit(result.character)
                    setMessage(null)
                  }}
                />
              ) : (
                <div className="hidden lg:block" />
              )}
              <div>
                <div className="relative mx-auto max-w-md">
                  {countdown !== null && countdown > 0 ? (
                    <p className="grandstander pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-7xl font-bold text-violet-700">
                      {countdown}
                    </p>
                  ) : null}
                  <FaceStage
                    character={character}
                    getLevel={getLevel}
                    interactive={customizing && step === 'make'}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onMove={(instanceId, x, y) =>
                      setCharacter((current) => (current ? updatePart(current, instanceId, { x, y }) : current))
                    }
                  />
                </div>
                {customizing && step === 'make' && selected && selectedDef ? (
                  <div className="mx-auto mt-3 flex max-w-md flex-wrap items-center gap-3 text-sm">
                    {selectedDef.category === 'head' ? (
                      <p>Pick another head in the tray. The head stays in the middle.</p>
                    ) : (
                      <>
                        <label>
                          Size
                          <input
                            type="range"
                            min={0.08}
                            max={0.9}
                            step={0.01}
                            value={selected.scale}
                            onChange={(event) =>
                              setCharacter((current) =>
                                current
                                  ? updatePart(current, selected.instanceId, {
                                      scale: Number(event.target.value),
                                    })
                                  : current
                              )
                            }
                          />
                        </label>
                        <label>
                          Turn
                          <input
                            type="range"
                            min={-180}
                            max={180}
                            step={1}
                            value={selected.rotation}
                            onChange={(event) =>
                              setCharacter((current) =>
                                current
                                  ? updatePart(current, selected.instanceId, {
                                      rotation: Number(event.target.value),
                                    })
                                  : current
                              )
                            }
                          />
                        </label>
                        {selectedDef.mirrorable ? (
                          <button
                            type="button"
                            className="rounded-full border px-3 py-1"
                            onClick={() =>
                              setCharacter((current) =>
                                current
                                  ? updatePart(current, selected.instanceId, { mirror: !selected.mirror })
                                  : current
                              )
                            }
                          >
                            Flip
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="rounded-full border px-3 py-1"
                          onClick={() =>
                            setCharacter((current) =>
                              current ? bringPartIntoView(current, selected.instanceId) : current
                            )
                          }
                        >
                          Bring into view
                        </button>
                        <button
                          type="button"
                          className="rounded-full border px-3 py-1"
                          onClick={() => {
                            setCharacter((current) =>
                              current ? deletePart(current, selected.instanceId) : current
                            )
                            setSelectedId(null)
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
                {step === 'make' ? (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-violet-200 bg-white px-4 py-2 font-semibold"
                      onClick={() => {
                        const next = assembleRandomFace()
                        commit(next)
                        baselineRef.current = next
                        setSelectedId(null)
                      }}
                    >
                      Remix my face
                    </button>
                    {!customizing ? (
                      <button
                        type="button"
                        className="rounded-full border border-violet-200 bg-white px-4 py-2 font-semibold"
                        onClick={() => {
                          baselineRef.current = character
                          setCustomizing(true)
                        }}
                      >
                        Make it mine
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="rounded-full border px-4 py-2"
                          onClick={() => {
                            const previous = undo[undo.length - 1]
                            if (!previous) return
                            setUndo((stack) => stack.slice(0, -1))
                            setCharacter(previous)
                          }}
                        >
                          Undo
                        </button>
                        <button
                          type="button"
                          className="rounded-full border px-4 py-2"
                          onClick={() => {
                            if (baselineRef.current) setCharacter(baselineRef.current)
                          }}
                        >
                          Reset
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="rounded-full bg-violet-600 px-5 py-2 font-semibold text-white"
                      onClick={() => {
                        void startRecording()
                      }}
                    >
                      Ready to talk
                    </button>
                  </div>
                ) : null}
                {session.allowFunnyVoices && step !== 'make' ? (
                  <div className="mt-4">
                    <p className="mb-2 text-center text-sm font-semibold">Pick your voice</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {VOICE_EFFECTS.map((effect) => (
                        <button
                          key={effect}
                          type="button"
                          onClick={() => {
                            setVoice(effect)
                            if (!take) return
                            void player.play({
                              blob: take.blob,
                              envelope: take.envelope,
                              effect,
                            })
                          }}
                          className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                            voice === effect ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white'
                          }`}
                        >
                          {VOICE_LABELS[effect]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              {step === 'talk' || step === 'send' ? (
                <aside className="rounded-3xl bg-white p-4">
                  <h2 className="grandstander text-xl font-bold">Let&apos;s hear your thoughts</h2>
                  <p className="mt-1 text-sm text-slate-500">{name.trim() || 'Add your name'}</p>
                  {step === 'talk' ? (
                    <button
                      type="button"
                      className="mt-4 w-full rounded-full bg-violet-600 px-4 py-3 font-semibold text-white"
                      onClick={() => {
                        if (recorder.isRecording) void finishRecording()
                        else void startRecording()
                      }}
                    >
                      {recorder.isRecording ? `Stop ${formatDuration(recordMs)}` : 'Record'}
                    </button>
                  ) : (
                    <>
                      <p className="mt-3 text-sm text-slate-500">
                        {formatDuration(player.elapsedMs)} / {formatDuration(take?.durationMs ?? 0)}
                      </p>
                      <button
                        type="button"
                        className="mt-3 w-full rounded-full border px-4 py-2 font-semibold"
                        onClick={() => {
                          if (!take) return
                          if (player.playing) player.stop()
                          else {
                            void player.play({
                              blob: take.blob,
                              envelope: take.envelope,
                              effect: session.allowFunnyVoices ? voice : 'original',
                            })
                          }
                        }}
                      >
                        {player.playing ? 'Pause' : 'Play'}
                      </button>
                      <button
                        type="button"
                        className="mt-2 w-full rounded-full border px-4 py-2"
                        onClick={() => {
                          player.stop()
                          setTake(null)
                          setStep('talk')
                        }}
                      >
                        Record again
                      </button>
                    </>
                  )}
                </aside>
              ) : (
                <div className="hidden lg:block" />
              )}
            </div>
            {step === 'send' ? (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    void send()
                  }}
                  className="rounded-full bg-violet-600 px-8 py-3 text-lg font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? 'Sending…' : 'Send to teacher'}
                </button>
                <p className="mt-2 text-sm text-slate-500">Only your teacher can see it until approved.</p>
              </div>
            ) : null}
            {message ? <p className="mt-3 text-center text-sm text-rose-600">{message}</p> : null}
          </div>
        )}
      </div>
    </div>
  )
}

function Gallery({
  showGallery,
  clips,
  activeId,
  getLevel,
  onPlay,
}: {
  showGallery: boolean
  clips: ThoughtPublicClip[]
  activeId: string | null
  getLevel: () => number
  onPlay: (clip: ThoughtPublicClip) => Promise<void>
}) {
  if (!showGallery) {
    return (
      <p className="py-16 text-center text-slate-600">
        Your teacher is keeping these recordings private.
      </p>
    )
  }
  if (clips.length === 0) {
    return <p className="py-16 text-center text-slate-600">No shared recordings yet.</p>
  }
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clips.map((clip) => (
        <button
          key={clip.id}
          type="button"
          onClick={() => {
            void onPlay(clip).catch(() => undefined)
          }}
          className="rounded-3xl bg-white p-3 text-left"
        >
          <FaceStage
            character={clip.character}
            animate={activeId === clip.id}
            getLevel={activeId === clip.id ? getLevel : () => 0}
          />
          <p className="mt-2 font-semibold">{clip.studentName}</p>
          <p className="text-sm text-slate-500">
            {formatDuration(clip.durationMs)} · {VOICE_LABELS[clip.voiceEffect]}
          </p>
        </button>
      ))}
    </div>
  )
}
