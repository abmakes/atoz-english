'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Application } from 'pixi.js'
import { SentenceBuilderGame } from '@/lib/pixi-games/sentence-builder/SentenceBuilderGame'
import {
  GRAMMAR_BLURBS,
  GRAMMAR_FOCUSES,
  GRAMMAR_LABELS,
  type GrammarFocus,
} from '@/lib/pixi-games/sentence-builder/content'
import {
  formatSeconds,
  QUESTION_TIME_MS,
  SCORE_RUN_LENGTH,
  type PlayMode,
  type SentenceBuilderResult,
} from '@/lib/pixi-games/sentence-builder/round'

const BEST_KEY = 'playtoz-sentence-builder-bests-v2'

const SKY_BACKGROUND = {
  backgroundColor: '#f7fbff',
  backgroundImage: [
    'radial-gradient(ellipse 72% 58% at -4% -8%, rgba(186, 230, 253, 0.95) 0%, rgba(186, 230, 253, 0) 68%)',
    'radial-gradient(ellipse 58% 48% at 108% -6%, rgba(221, 204, 255, 0.9) 0%, rgba(221, 204, 255, 0) 64%)',
    'radial-gradient(ellipse 46% 42% at 92% 108%, rgba(191, 219, 254, 0.72) 0%, rgba(191, 219, 254, 0) 70%)',
    'radial-gradient(ellipse 38% 36% at 4% 96%, rgba(237, 224, 255, 0.78) 0%, rgba(237, 224, 255, 0) 72%)',
  ].join(', '),
} as const

const PLAY_BACKGROUND = { backgroundColor: '#f7fbff' } as const

interface FocusBest {
  scoreRunScore: number
  scoreRunBuilt: number
  survivalScore: number
  survivalSentences: number
}

type Bests = Record<GrammarFocus, FocusBest>

function emptyFocusBest(): FocusBest {
  return { scoreRunScore: 0, scoreRunBuilt: 0, survivalScore: 0, survivalSentences: 0 }
}

function emptyBests(): Bests {
  return Object.fromEntries(GRAMMAR_FOCUSES.map((focus) => [focus, emptyFocusBest()])) as Bests
}

function readBests(): Bests {
  const bests = emptyBests()
  if (typeof window === 'undefined') return bests
  try {
    const raw = window.localStorage.getItem(BEST_KEY)
    if (!raw) return bests
    const parsed = JSON.parse(raw) as Partial<Record<GrammarFocus, Partial<FocusBest>>>
    for (const focus of GRAMMAR_FOCUSES) {
      const item = parsed[focus]
      if (!item) continue
      bests[focus] = {
        scoreRunScore: Number(item.scoreRunScore) || 0,
        scoreRunBuilt: Number(item.scoreRunBuilt) || 0,
        survivalScore: Number(item.survivalScore) || 0,
        survivalSentences: Number(item.survivalSentences) || 0,
      }
    }
    return bests
  } catch {
    return bests
  }
}

function writeBests(next: Bests) {
  window.localStorage.setItem(BEST_KEY, JSON.stringify(next))
}

function rememberBest(previous: Bests, next: SentenceBuilderResult): Bests {
  const current = previous[next.focus] ?? emptyFocusBest()
  const updatedFocus: FocusBest = { ...current }
  if (next.mode === 'score-run' && next.endedBy === 'finished') {
    const betterAccuracy = next.sentencesBuilt > current.scoreRunBuilt
    const betterScore = next.sentencesBuilt === current.scoreRunBuilt && next.score > current.scoreRunScore
    if (betterAccuracy || betterScore) {
      updatedFocus.scoreRunBuilt = next.sentencesBuilt
      updatedFocus.scoreRunScore = next.score
    }
  }
  if (next.mode === 'survival') {
    updatedFocus.survivalScore = Math.max(current.survivalScore, next.score)
    updatedFocus.survivalSentences = Math.max(current.survivalSentences, next.sentencesBuilt)
  }
  return { ...previous, [next.focus]: updatedFocus }
}

export default function SentenceBuilderScreen() {
  const [phase, setPhase] = useState<'setup' | 'play' | 'results'>('setup')
  const [mode, setMode] = useState<PlayMode>('score-run')
  const [focus, setFocus] = useState<GrammarFocus>('present-simple')
  const [sounds, setSounds] = useState(true)
  const [bests, setBests] = useState<Bests>(emptyBests)
  const [result, setResult] = useState<SentenceBuilderResult | null>(null)
  const [status, setStatus] = useState('')
  const [startError, setStartError] = useState('')
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
      if (appDestroyed || !app.renderer) return
      appDestroyed = true
      app.destroy(true)
    }

    void (async () => {
      await app.init({
        resizeTo: mount,
        background: '#f7fbff',
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
        { mode, focus, sounds: soundsRef.current },
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
      if (!cancelled) {
        setStartError(startFailureMessage(error))
        setPhase('setup')
      }
    })

    return () => {
      cancelled = true
      game?.destroy()
      gameRef.current = null
      destroyApp()
    }
  }, [phase, mode, focus])

  useEffect(() => {
    if (gameRef.current) gameRef.current.sounds = sounds
  }, [sounds])

  return (
    <div
      className="min-h-[100dvh] text-[--text-color]"
      style={phase === 'play' ? PLAY_BACKGROUND : SKY_BACKGROUND}
    >
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      {phase === 'setup' && (
        <Setup
          mode={mode}
          focus={focus}
          sounds={sounds}
          bests={bests}
          onMode={setMode}
          onFocus={setFocus}
          onSounds={setSounds}
          startError={startError}
          onPlay={() => {
            setResult(null)
            setStartError('')
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

function startFailureMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : ''
  if (/webgl|canvasrenderer|renderer/i.test(text)) {
    return 'The picture canvas could not start in this browser. Turn on hardware acceleration, then try again.'
  }
  return 'Sentence Builder could not start. Try again.'
}

function Setup({
  mode,
  focus,
  sounds,
  bests,
  startError,
  onMode,
  onFocus,
  onSounds,
  onPlay,
}: {
  mode: PlayMode
  focus: GrammarFocus
  sounds: boolean
  bests: Bests
  startError: string
  onMode: (mode: PlayMode) => void
  onFocus: (focus: GrammarFocus) => void
  onSounds: (sounds: boolean) => void
  onPlay: () => void
}) {
  const selectedBest = bests[focus]
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
          Pick one grammar structure, then build sentences for that structure only.
          Look at the picture and choose the next word. Faster sentences score more.
        </p>
        {startError ? (
          <p role="alert" className="mt-4 rounded-2xl border-2 border-[#1E5167] bg-white p-4 inclusive-sans">
            {startError}
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ModeCard
          selected={mode === 'score-run'}
          title="Score Run"
          body="20 questions from the structure you pick. A wrong word costs 2.5 seconds. Finish all 20 to see your percent."
          detail={
            selectedBest.scoreRunBuilt > 0
              ? `Best ${selectedBest.scoreRunBuilt}/${SCORE_RUN_LENGTH} on this structure`
              : 'Your best for this structure shows here'
          }
          onSelect={() => onMode('score-run')}
        />
        <ModeCard
          selected={mode === 'survival'}
          title="Survival"
          body="Stay on the structure you pick. One wrong word, or a timeout, ends the run."
          detail={
            selectedBest.survivalSentences > 0
              ? `Best ${selectedBest.survivalSentences} sentences · ${selectedBest.survivalScore} points`
              : 'See how far you can get'
          }
          onSelect={() => onMode('survival')}
        />
      </div>
      <div>
        <h2 className="text-xl font-black grandstander">Choose a structure</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GRAMMAR_FOCUSES.map((item) => (
            <GrammarCard
              key={item}
              selected={focus === item}
              title={GRAMMAR_LABELS[item]}
              example={GRAMMAR_BLURBS[item]}
              detail={grammarBestLabel(mode, bests[item])}
              onSelect={() => onFocus(item)}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={onPlay} className="neo-button bg-[--primary-accent] px-8 text-white">
          Play {GRAMMAR_LABELS[focus]}
        </button>
        <p className="text-sm text-[--text-light] inclusive-sans">
          Keys 1–4 pick the next word. A perfect sentence is {100 + 100} points. You have{' '}
          {QUESTION_TIME_MS / 1000} seconds.
        </p>
      </div>
    </div>
  )
}

function grammarBestLabel(mode: PlayMode, best: FocusBest): string {
  if (mode === 'score-run') {
    return best.scoreRunBuilt > 0 ? `Best ${best.scoreRunBuilt}/${SCORE_RUN_LENGTH}` : 'Not played yet'
  }
  return best.survivalSentences > 0 ? `Best ${best.survivalSentences} sentences` : 'Not played yet'
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

function GrammarCard({
  selected,
  title,
  example,
  detail,
  onSelect,
}: {
  selected: boolean
  title: string
  example: string
  detail: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`neo-card p-4 text-left ${selected ? 'bg-[#e8f8ff]' : 'bg-white'}`}
    >
      <h3 className="text-lg font-black grandstander">{title}</h3>
      <p className="mt-2 text-sm text-[--text-light] inclusive-sans">{example}</p>
      <p className="mt-3 text-sm font-bold grandstander">{detail}</p>
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
  const focusBest = bests[result.focus]
  const percent =
    result.mode === 'score-run' ? Math.round((result.sentencesBuilt / SCORE_RUN_LENGTH) * 100) : null
  const best =
    result.mode === 'score-run'
      ? `Best ${focusBest.scoreRunBuilt}/${SCORE_RUN_LENGTH}`
      : `Best ${focusBest.survivalSentences} sentences`

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col justify-center gap-5 px-4 py-10">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#168CB9] grandstander">
        {GRAMMAR_LABELS[result.focus]}
      </p>
      <h1 className="text-4xl font-black grandstander md:text-5xl">{title}</h1>
      {percent !== null ? (
        <p className="text-6xl font-black grandstander text-[#168CB9]">{percent}%</p>
      ) : (
        <p className="text-6xl font-black grandstander text-[#168CB9]">{result.sentencesBuilt}</p>
      )}
      <ul className="space-y-2 text-lg inclusive-sans">
        <li>
          Sentences built: <strong className="grandstander">{result.sentencesBuilt}</strong>
          {result.mode === 'score-run' ? ` of ${SCORE_RUN_LENGTH}` : ''}
        </li>
        <li>
          Score: <strong className="grandstander">{result.score}</strong>
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
        {(result.mode === 'score-run' ? focusBest.scoreRunBuilt : focusBest.survivalSentences) > 0 && (
          <li>{best}</li>
        )}
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
          Change structure
        </button>
      </div>
    </div>
  )
}
