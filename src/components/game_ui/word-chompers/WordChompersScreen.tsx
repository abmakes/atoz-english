'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Application } from 'pixi.js'
import { WordChompersGame } from '@/lib/pixi-games/word-chompers/WordChompersGame'
import {
  type BiteKind,
  type ChomperMode,
  type PlayerCount,
} from '@/lib/pixi-games/word-chompers/content'
import { type SwimInput } from '@/lib/pixi-games/word-chompers/round'
import {
  GRAMMAR_BLURBS,
  GRAMMAR_FOCUSES,
  GRAMMAR_LABELS,
  type GrammarFocus,
} from '@/lib/pixi-games/sentence-builder/content'

const SKY_BACKGROUND = {
  backgroundColor: '#f7fbff',
  backgroundImage: [
    'radial-gradient(ellipse 72% 58% at -4% -8%, rgba(186, 230, 253, 0.95) 0%, rgba(186, 230, 253, 0) 68%)',
    'radial-gradient(ellipse 58% 48% at 108% -6%, rgba(221, 204, 255, 0.9) 0%, rgba(221, 204, 255, 0) 64%)',
    'radial-gradient(ellipse 46% 42% at 92% 108%, rgba(191, 219, 254, 0.72) 0%, rgba(191, 219, 254, 0) 70%)',
    'radial-gradient(ellipse 38% 36% at 4% 96%, rgba(237, 224, 255, 0.78) 0%, rgba(237, 224, 255, 0) 72%)',
  ].join(', '),
} as const

const COPY = {
  bite: {
    kicker: 'Same screen · 2 to 4 players',
    title: 'Word Bite',
    body: 'A sentence appears with one word missing. Bite the verb form or the pronoun that fits. First correct bite wins the round.',
    otherHref: '/practice/sentence-swim',
    otherLabel: 'Try Sentence Swim',
  },
  swim: {
    kicker: 'Same screen · 2 to 4 players',
    title: 'Sentence Swim',
    body: 'Each round has four pictures in the pool. Match the person to the verb, then eat any object. She eats some soup counts. She eat an apple does not. Most sentences in one minute wins the round.',
    otherHref: '/practice/word-bite',
    otherLabel: 'Try Word Bite',
  },
} as const

export default function WordChompersScreen({ mode }: { mode: ChomperMode }) {
  const copy = COPY[mode]
  const [phase, setPhase] = useState<'setup' | 'play'>('setup')
  const [focus, setFocus] = useState<GrammarFocus>('present-simple')
  const [biteKind, setBiteKind] = useState<BiteKind>('verb')
  const [players, setPlayers] = useState<PlayerCount>(2)
  const [swimInput, setSwimInput] = useState<SwimInput>('touch')
  const [sounds, setSounds] = useState(true)
  const [status, setStatus] = useState('')
  const [startError, setStartError] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const mountRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<WordChompersGame | null>(null)
  const soundsRef = useRef(sounds)
  soundsRef.current = sounds

  const leaveToSetup = useCallback(() => {
    gameRef.current?.destroy()
    gameRef.current = null
    setConfirmLeave(false)
    setPhase('setup')
    setStatus('')
  }, [])

  useEffect(() => {
    if (phase !== 'play' || !mountRef.current) return
    const mount = mountRef.current
    let cancelled = false
    let appDestroyed = false
    const app = new Application()
    let game: WordChompersGame | null = null

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
      app.canvas.style.display = 'block'
      app.canvas.style.touchAction = 'none'
      mount.appendChild(app.canvas)
      game = new WordChompersGame(
        app,
        { mode, focus, biteKind, players, sounds: soundsRef.current, swimInput },
        { onStatus: setStatus }
      )
      gameRef.current = game
      await game.init()
      if (cancelled) {
        game.destroy()
        destroyApp()
      }
    })().catch((error) => {
      console.error('[WordChompers] Failed to start', error)
      if (!cancelled) {
        setStartError('This game could not start. Try again.')
        setPhase('setup')
      }
    })

    return () => {
      cancelled = true
      game?.destroy()
      gameRef.current = null
      destroyApp()
    }
  }, [phase, mode, focus, biteKind, players, swimInput])

  useEffect(() => {
    if (gameRef.current) gameRef.current.sounds = sounds
  }, [sounds])

  useEffect(() => {
    gameRef.current?.setPaused(confirmLeave)
  }, [confirmLeave])

  useEffect(() => {
    if (phase !== 'play') setConfirmLeave(false)
  }, [phase])

  return (
    <div
      className={`${phase === 'play' ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'} text-[--text-color]`}
      style={phase === 'play' ? { backgroundColor: '#f7fbff' } : SKY_BACKGROUND}
    >
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      {phase === 'setup' && (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:py-12">
          <div className="flex items-center justify-between gap-3">
            <Link href="/practice" className="grandstander font-bold underline">
              Practice
            </Link>
            <SoundButton sounds={sounds} onClick={() => setSounds((value) => !value)} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#168CB9] grandstander">{copy.kicker}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black grandstander md:text-6xl">{copy.title}</h1>
              <span className="shrink-0 rounded-full border-2 border-[#1E5167] bg-amber-200 px-2 py-0.5 text-xs font-black tracking-wide text-[#114257]">
                BETA
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-lg text-[--text-light] inclusive-sans">{copy.body}</p>
            {startError ? (
              <p role="alert" className="mt-4 rounded-2xl border-2 border-[#1E5167] bg-white p-4 inclusive-sans">
                {startError}
              </p>
            ) : null}
          </div>

          <div>
            <h2 className="text-xl font-black grandstander">Players</h2>
            <div className="mt-3 flex gap-3">
              {([2, 3, 4] as const).map((count) => (
                <button
                  key={count}
                  type="button"
                  aria-pressed={players === count}
                  onClick={() => setPlayers(count)}
                  className={`grid h-14 w-14 place-items-center rounded-full border-[3px] border-[#114257] text-xl font-black grandstander ${
                    players === count ? 'bg-[#49C8FF] text-white' : 'bg-white'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-[--text-light] inclusive-sans">
              Sit around one phone or tablet. Players on the far side see the clues turned around.
            </p>
            {mode === 'swim' ? (
              <div className="mt-4">
                <h2 className="text-xl font-black grandstander">Controls</h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    aria-pressed={swimInput === 'touch'}
                    onClick={() => setSwimInput('touch')}
                    className={`rounded-full border-[3px] border-[#114257] px-5 py-2 text-lg font-black grandstander ${
                      swimInput === 'touch' ? 'bg-[#49C8FF] text-white' : 'bg-white'
                    }`}
                  >
                    Touch
                  </button>
                  <button
                    type="button"
                    aria-pressed={swimInput === 'keyboard'}
                    onClick={() => setSwimInput('keyboard')}
                    className={`rounded-full border-[3px] border-[#114257] px-5 py-2 text-lg font-black grandstander ${
                      swimInput === 'keyboard' ? 'bg-[#49C8FF] text-white' : 'bg-white'
                    }`}
                  >
                    Keyboard
                  </button>
                </div>
                <p className="mt-2 text-sm text-[--text-light] inclusive-sans">
                  {swimInput === 'touch'
                    ? 'Hold the button on your edge. Your crocodile spins until you hold, then it swims that way.'
                    : 'Four hands on one keyboard. Bottom Space, left Shift, right 6, top Caps Lock. Hold to swim.'}
                </p>
              </div>
            ) : null}
          </div>

          {mode === 'bite' && (
            <div className="grid gap-4 md:grid-cols-2">
              <ChoiceCard
                selected={biteKind === 'verb'}
                title="Verb forms"
                body="She ___ an apple. Bite eats, not eat or eating."
                onSelect={() => setBiteKind('verb')}
              />
              <ChoiceCard
                selected={biteKind === 'pronoun'}
                title="Pronouns"
                body="___ eats an apple. Bite She, not Her or Hers."
                onSelect={() => setBiteKind('pronoun')}
              />
            </div>
          )}

          <div>
            <h2 className="text-xl font-black grandstander">Choose a structure</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {GRAMMAR_FOCUSES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={focus === item}
                  onClick={() => setFocus(item)}
                  className={`neo-card p-4 text-left ${focus === item ? 'bg-[#e8f8ff]' : 'bg-white'}`}
                >
                  <h3 className="text-lg font-black grandstander">{GRAMMAR_LABELS[item]}</h3>
                  <p className="mt-2 text-sm text-[--text-light] inclusive-sans">{GRAMMAR_BLURBS[item]}</p>
                </button>
              ))}
            </div>
          </div>

          <HowTo mode={mode} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => {
                setStartError('')
                setPhase('play')
              }}
              className="neo-button bg-[--primary-accent] px-8 text-white"
            >
              Play {GRAMMAR_LABELS[focus]}
            </button>
            <Link href={copy.otherHref} className="font-bold underline grandstander">
              {copy.otherLabel}
            </Link>
          </div>
        </div>
      )}

      {phase === 'play' && (
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
          <div className="relative flex h-14 shrink-0 items-center justify-between px-4">
            <button
              type="button"
              onClick={() => {
                if (gameRef.current?.over) leaveToSetup()
                else setConfirmLeave(true)
              }}
              className="grandstander font-bold underline"
            >
              Back
            </button>
            <SoundButton sounds={sounds} onClick={() => setSounds((value) => !value)} />
          </div>
          <div ref={mountRef} className="relative min-h-0 flex-1 overflow-hidden" />
          {confirmLeave ? (
            <div className="absolute inset-0 z-30 grid place-items-center bg-[#114257]/35 px-4">
              <div className="neo-card w-full max-w-sm bg-white p-5" role="dialog" aria-labelledby="leave-title">
                <h2 id="leave-title" className="text-2xl font-black grandstander">
                  Leave this game?
                </h2>
                <p className="mt-2 text-[--text-light] inclusive-sans">This score will not be saved.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setConfirmLeave(false)} className="neo-button bg-white">
                    Keep playing
                  </button>
                  <button type="button" onClick={leaveToSetup} className="neo-button bg-[--primary-accent] text-white">
                    Leave
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function HowTo({ mode }: { mode: ChomperMode }) {
  const steps =
    mode === 'bite'
      ? [
          'Read the sentence on your side of the screen.',
          'Tap near your crocodile. It stretches and bites the word in front of it.',
          'A wrong bite costs a point, if you have one, and you wait 2 seconds.',
          'A blue card turns the words around. A red card gives last place a head start.',
        ]
      : [
          'Hold your button. The crocodile spins, then swims the way its snout points.',
          'Eat a person, a matching verb, then any object. The grammar card says which structure to build.',
          'A wrong word knocks you back for 2 seconds. Your sentence stays.',
          'You have one minute. The most finished sentences wins the round.',
        ]
  return (
    <div className="neo-card bg-white p-5">
      <h2 className="text-xl font-black grandstander">How to play</h2>
      <ol className="mt-3 space-y-2 inclusive-sans">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#49C8FF] text-sm font-black text-white grandstander">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function ChoiceCard({
  selected,
  title,
  body,
  onSelect,
}: {
  selected: boolean
  title: string
  body: string
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
    </button>
  )
}

function SoundButton({ sounds, onClick }: { sounds: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={sounds}
      aria-label={sounds ? 'Sound on' : 'Sound off'}
      className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#1E5167] bg-white"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4V9z" fill="#114257" />
        {sounds ? (
          <path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="#114257" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="#114257" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
    </button>
  )
}
