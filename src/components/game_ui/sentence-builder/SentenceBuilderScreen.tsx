'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Application } from 'pixi.js'
import { SentenceBuilderGame } from '@/lib/pixi-games/sentence-builder/SentenceBuilderGame'
import {
  formatSeconds,
  QUESTION_TIME_MS,
  type PlayMode,
  type SentenceBuilderResult,
} from '@/lib/pixi-games/sentence-builder/round'

const BEST_KEY = 'playtoz-sentence-builder-bests'

interface Bests {
  scoreRun: number
  survivalScore: number
  survivalSentences: number
}

const EMPTY_BESTS: Bests = { scoreRun: 0, survivalScore: 0, survivalSentences: 0 }

const GRAMMAR_CHIPS = [
  'Present simple',
  'Present continuous',
  'WH questions',
  'am / is / isn\'t',
  'was / were / wasn\'t / weren\'t',
  'has / have',
  'Past simple, regular',
  'Past simple, irregular',
]

function readBests(): Bests {
  if (typeof window === 'undefined') return EMPTY_BESTS
  try {
    const raw = window.localStorage.getItem(BEST_KEY)
    if (!raw) return EMPTY_BESTS
    const parsed = JSON.parse(raw) as Partial<Bests>
    return {
      scoreRun: Number(parsed.scoreRun) || 0,
      survivalScore: Number(parsed.survivalScore) || 0,
      survivalSentences: Number(parsed.survivalSentences) || 0,
    }
  } catch {
    return EMPTY_BESTS
  }
}

function writeBests(next: Bests) {
  window.localStorage.setItem(BEST_KEY, JSON.stringify(next))
}

function rememberBest(previous: Bests, next: SentenceBuilderResult): Bests {
  const updated: Bests = { ...previous }
  if (next.mode === 'score-run' && next.endedBy === 'finished') {
    updated.scoreRun = Math.max(previous.scoreRun, next.score)
  }
  if (next.mode === 'survival') {
    updated.survivalScore = Math.max(previous.survivalScore, next.score)
    updated.survivalSentences = Math.max(previous.survivalSentences, next.sentencesBuilt)
  }
  return updated
}

export default function SentenceBuilderScreen() {
  const [phase, setPhase] = useState<'setup' | 'play' | 'results'>('setup')
  const [mode, setMode] = useState<PlayMode>('score-run')
  const [sounds, setSounds] = useState(true)
  const [bests, setBests] = useState<Bests>(EMPTY_BESTS)
  const [result, setResult] = useState<SentenceBuilderResult | null>(null)
  const [status, setStatus] = useState('')
  const mountRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<SentenceBuilderGame | null>(null)
  const soundsRef = useRef(sounds)
  soundsRef.current = sounds

  useEffect(() => {
    setBests(readBests())
  }, [])

  const leaveToSetup = useCallback(() => {
    gameRef.current?.destroy()
    gameRef.current = null
    setPhase('setup')
    setStatus('')
  }, [])

  useEffect(() => {
    if (phase !== 'play' || !mountRef.current) return
    const mount = mountRef.current
    let cancelled = false
    let appDestroyed = false
    const app = new Application()
    let game: SentenceBuilderGame | null = null

    const destroyApp = () => {
      if (appDestroyed) return
      appDestroyed = true
      app.destroy(true)
    }

    void (async () => {
      await app.init({
        resizeTo: mount,
        background: '#bfdbfe',
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      })
      if (cancelled) {
        destroyApp()
        return
      }
      mount.appendChild(app.canvas)
      game = new SentenceBuilderGame(
        app,
        { mode, sounds: soundsRef.current },
        {
          onStatus: setStatus,
          onComplete: (next) => {
            setResult(next)
            setBests((previous) => {
              const updated = rememberBest(previous, next)
              writeBests(updated)
              return updated
            })
            setPhase('results')
          },
        }
      )
      gameRef.current = game
      await game.init()
      if (cancelled) {
        game.destroy()
        destroyApp()
      }
    })().catch((error) => {
      console.error('[SentenceBuilder] Failed to start', error)
      if (!cancelled) setPhase('setup')
    })

    return () => {
      cancelled = true
      game?.destroy()
      gameRef.current = null
      destroyApp()
    }
  }, [phase, mode])

  useEffect(() => {
    if (gameRef.current) gameRef.current.sounds = sounds
  }, [sounds])

  return (
    <div className="min-h-[100dvh] bg-[--secondary-bg] text-[--text-color]">
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      {phase === 'setup' && (
        <Setup
          mode={mode}
          sounds={sounds}
          bests={bests}
          onMode={setMode}
          onSounds={setSounds}
          onPlay={() => {
            setResult(null)
            setPhase('play')
          }}
        />
      )}
      {phase === 'play' && (
        <div className="flex h-[100dvh] flex-col">
          <div className="flex h-14 items-center justify-between px-4">
            <button type="button" onClick={leaveToSetup} className="grandstander font-bold underline">
              Back
            </button>
            <p className="grandstander font-black">Sentence Builder</p>
            <button
              type="button"
              onClick={() => setSounds((value) => !value)}
              className="grandstander font-bold"
            >
              {sounds ? 'Sound on' : 'Sound off'}
            </button>
          </div>
          <div ref={mountRef} className="relative min-h-0 flex-1" />
        </div>
      )}
      {phase === 'results' && result && (
        <Results
          result={result}
          bests={bests}
          onAgain={() => {
            setResult(null)
            setPhase('play')
          }}
          onSetup={leaveToSetup}
        />
      )}
    </div>
  )
}

function Setup({
  mode,
  sounds,
  bests,
  onMode,
  onSounds,
  onPlay,
}: {
  mode: PlayMode
  sounds: boolean
  bests: Bests
  onMode: (mode: PlayMode) => void
  onSounds: (sounds: boolean) => void
  onPlay: () => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:py-12">
      <div className="flex items-center justify-between">
        <Link href="/games" className="grandstander font-bold underline">
          All games
        </Link>
        <button type="button" onClick={() => onSounds(!sounds)} className="grandstander font-bold">
          {sounds ? 'Sound on' : 'Sound off'}
        </button>
      </div>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#168CB9] grandstander">
          Grammar practice
        </p>
        <h1 className="mt-2 text-4xl font-black grandstander md:text-6xl">Sentence Builder</h1>
        <p className="mt-3 max-w-2xl text-lg text-[--text-light] inclusive-sans">
          Look at the picture, then pick the sentence one word at a time. Faster
          sentences score more. Each picture comes back in a different tense.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {GRAMMAR_CHIPS.map((chip) => (
          <li
            key={chip}
            className="rounded-full border-2 border-[#1E5167] bg-white px-3 py-1 text-sm font-bold grandstander"
          >
            {chip}
          </li>
        ))}
      </ul>
      <div className="grid gap-4 md:grid-cols-2">
        <ModeCard
          selected={mode === 'score-run'}
          title="Score Run"
          body="20 pictures. Build every sentence before the 20-second timer runs out. A wrong word costs 2.5 seconds."
          detail={bests.scoreRun > 0 ? `Best score ${bests.scoreRun}` : 'Best score will show here'}
          onSelect={() => onMode('score-run')}
        />
        <ModeCard
          selected={mode === 'survival'}
          title="Survival"
          body="Keep going through the grammar bank. One wrong word, or a timeout, ends the run."
          detail={
            bests.survivalSentences > 0
              ? `Best ${bests.survivalSentences} sentences · ${bests.survivalScore} points`
              : 'See how far you can get'
          }
          onSelect={() => onMode('survival')}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={onPlay} className="neo-button bg-[--primary-accent] px-8 text-white">
          Play
        </button>
        <p className="text-sm text-[--text-light] inclusive-sans">
          Keys 1–4 pick the next word. A perfect sentence is {100 + 100} points. You have{' '}
          {QUESTION_TIME_MS / 1000} seconds.
        </p>
      </div>
    </div>
  )
}

function ModeCard({
  selected,
  title,
  body,
  detail,
  onSelect,
}: {
  selected: boolean
  title: string
  body: string
  detail: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`neo-card p-5 text-left ${selected ? 'bg-[#e8f8ff]' : 'bg-white'}`}
    >
      <h2 className="text-2xl font-black grandstander">{title}</h2>
      <p className="mt-2 text-[--text-light] inclusive-sans">{body}</p>
      <p className="mt-3 font-bold grandstander">{detail}</p>
    </button>
  )
}

function Results({
  result,
  bests,
  onAgain,
  onSetup,
}: {
  result: SentenceBuilderResult
  bests: Bests
  onAgain: () => void
  onSetup: () => void
}) {
  const average =
    result.sentencesBuilt > 0 ? formatSeconds(result.totalAnswerMs / result.sentencesBuilt) : null
  const title =
    result.mode === 'score-run'
      ? 'Score Run complete'
      : result.endedBy === 'timeout'
        ? 'Time ran out'
        : 'Survival ended'
  const best =
    result.mode === 'score-run'
      ? `Best score ${bests.scoreRun}`
      : `Best ${bests.survivalSentences} sentences`

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col justify-center gap-5 px-4 py-10">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#168CB9] grandstander">
        {result.mode === 'score-run' ? '20 questions' : 'Survival'}
      </p>
      <h1 className="text-4xl font-black grandstander md:text-5xl">{title}</h1>
      <p className="text-6xl font-black grandstander text-[#168CB9]">{result.score}</p>
      <ul className="space-y-2 text-lg inclusive-sans">
        <li>
          Sentences built: <strong className="grandstander">{result.sentencesBuilt}</strong>
          {result.mode === 'score-run' ? ` of ${result.questionsSeen}` : ''}
        </li>
        {average && (
          <li>
            Average speed: <strong className="grandstander">{average}</strong>
          </li>
        )}
        {result.fastestMs !== null && (
          <li>
            Fastest sentence: <strong className="grandstander">{formatSeconds(result.fastestMs)}</strong>
          </li>
        )}
        {(result.mode === 'score-run' ? bests.scoreRun : bests.survivalSentences) > 0 && <li>{best}</li>}
      </ul>
      {result.missedAnswer && (
        <p className="rounded-2xl border-2 border-[#1E5167] bg-white p-4 inclusive-sans">
          {result.missedChoice ? (
            <>
              <span className="font-bold grandstander">{result.missedChoice}</span> was not the next word.{' '}
            </>
          ) : null}
          The sentence was <span className="font-bold grandstander">{result.missedAnswer}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onAgain} className="neo-button bg-[--primary-accent] text-white">
          Play again
        </button>
        <button type="button" onClick={onSetup} className="neo-button bg-white">
          Change mode
        </button>
      </div>
    </div>
  )
}
