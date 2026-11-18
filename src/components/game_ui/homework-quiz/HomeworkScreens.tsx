import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { SceneThemeId } from '@/lib/themes'
import styles from './homework-screens.module.css'

export type ScreenPalette = {
  ink: string
  muted: string
  cardInk: string
  border: string
  shadow: string
  challengeBorder: string
  challengeShadow: string
  pillOn: string
  pillOff: string
  chunkyStroke: string
}

export function screenPalette(scene: SceneThemeId): ScreenPalette {
  if (scene === 'dark') {
    return {
      ink: '#f8fafc',
      muted: '#cbd5e1',
      cardInk: '#0f2744',
      border: '#7dd3fc',
      shadow: '#0369a1',
      challengeBorder: '#fde047',
      challengeShadow: '#ca8a04',
      pillOn: '#38bdf8',
      pillOff: '#64748b',
      chunkyStroke: '#082f49',
    }
  }
  if (scene === 'forest') {
    return {
      ink: '#14532d',
      muted: '#3f6212',
      cardInk: '#14532d',
      border: '#86efac',
      shadow: '#166534',
      challengeBorder: '#fde047',
      challengeShadow: '#ca8a04',
      pillOn: '#4ade80',
      pillOff: '#dcfce7',
      chunkyStroke: '#14532d',
    }
  }
  return {
    ink: '#114257',
    muted: '#175975',
    cardInk: '#114257',
    border: '#7dd3fc',
    shadow: '#38bdf8',
    challengeBorder: '#fde047',
    challengeShadow: '#eab308',
    pillOn: '#38bdf8',
    pillOff: '#e5e7eb',
    chunkyStroke: '#114257',
  }
}

export function sceneShell(background: string): CSSProperties {
  return {
    backgroundImage: `url(${background})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'left center',
    backgroundSize: 'cover',
  }
}

function chunkyStyle(stroke: string, size: number): CSSProperties {
  return {
    color: '#ffffff',
    WebkitTextStroke: `${size}px ${stroke}`,
    paintOrder: 'stroke fill',
    textShadow: `${size}px ${size}px 0 ${stroke}`,
  }
}

export function ChunkyNumber({ value, stroke }: { value: string; stroke: string }) {
  return (
    <p
      className={`grandstander text-center font-black leading-none ${value.length > 3 ? 'text-6xl' : 'text-7xl'}`}
      style={chunkyStyle(stroke, 6)}
    >
      {value}
    </p>
  )
}

function PillButton({
  children,
  border,
  shadow,
  disabled,
  onClick,
}: {
  children: string
  border: string
  shadow: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="grandstander w-full rounded-full border-[3px] bg-white px-5 py-3.5 text-xl font-bold transition active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
      style={{ color: '#114257', borderColor: border, boxShadow: `4px 5px 0 0 ${shadow}` }}
    >
      {children}
    </button>
  )
}

export function StartScreen({
  palette,
  title,
  dueLabel,
  questionCount,
  name,
  closed,
  busy,
  canChallenge,
  onName,
  onStartQuiz,
  onStartChallenge,
}: {
  palette: ScreenPalette
  title: string
  dueLabel: string
  questionCount: number
  name: string
  closed: boolean
  busy: boolean
  canChallenge: boolean
  onName: (value: string) => void
  onStartQuiz: () => void
  onStartChallenge: () => void
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <div
        className="mx-auto rounded-full border-[3px] bg-white px-8 py-3"
        style={{ borderColor: palette.border, boxShadow: `4px 5px 0 0 ${palette.shadow}` }}
      >
        <p className="grandstander text-3xl font-black" style={{ color: palette.cardInk }}>Assignment</p>
      </div>
      <section className="mt-6 rounded-[28px] bg-white px-5 py-6 text-center shadow-[0_8px_0_rgba(15,23,42,0.04)]">
        <h1 className="grandstander text-2xl font-black leading-tight" style={{ color: palette.cardInk }}>{title}</h1>
        <p className="mt-2 text-sm font-semibold" style={{ color: palette.cardInk }}>Due {dueLabel}</p>
        <label className="mt-4 block text-left text-sm font-bold" htmlFor="homework-name" style={{ color: palette.cardInk }}>
          Your name
        </label>
        <input
          id="homework-name"
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder="Type your name"
          maxLength={40}
          className="grandstander mt-1 w-full rounded-full border-[3px] bg-white px-4 py-3 text-center text-lg font-bold outline-none"
          style={{ color: palette.cardInk, borderColor: palette.border }}
        />
        <p className="grandstander mt-6 text-4xl font-black" style={chunkyStyle(palette.chunkyStroke, 4)}>
          {questionCount} {questionCount === 1 ? 'question' : 'questions'}
        </p>
        <p className="mt-6 text-base font-semibold leading-snug" style={{ color: palette.cardInk }}>
          Answer all the questions in the quiz
        </p>
        <p className="mt-4 text-base font-semibold leading-snug" style={{ color: palette.cardInk }}>
          Then try the challenge to see how many you can get right without making a mistake
        </p>
      </section>
      <div className="mt-8 flex flex-col gap-4">
        <PillButton border={palette.border} shadow={palette.shadow} disabled={busy || closed || name.trim().length === 0} onClick={onStartQuiz}>
          {closed ? 'This homework is closed' : 'Start Quiz'}
        </PillButton>
        {canChallenge ? (
          <PillButton
            border={palette.challengeBorder}
            shadow={palette.challengeShadow}
            disabled={busy || closed || name.trim().length === 0}
            onClick={onStartChallenge}
          >
            Start Challenge
          </PillButton>
        ) : null}
      </div>
    </div>
  )
}

function ZoomedPicture({
  src,
  border,
  shadow,
  onClose,
}: {
  src: string
  border: string
  shadow: string
  onClose: () => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef(0)
  const dragged = useRef(false)
  const [slidesSideways, setSlidesSideways] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const centered = useRef(false)

  function settlePicture() {
    const node = scrollerRef.current
    if (!node) return
    const wide = node.scrollWidth > node.clientWidth + 8
    setSlidesSideways(wide)
    if (!wide || centered.current) return
    node.scrollLeft = (node.scrollWidth - node.clientWidth) / 2
    centered.current = true
  }

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    settlePicture()
    const observer = new ResizeObserver(() => settlePicture())
    observer.observe(node)
    return () => observer.disconnect()
  }, [src])

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#041525]/80" role="dialog" aria-modal="true" aria-label="Picture">
      <div
        ref={scrollerRef}
        className="flex min-h-0 flex-1 items-center overflow-x-auto overflow-y-hidden overscroll-x-contain"
        onPointerDown={(event) => {
          dragStart.current = event.clientX
          dragged.current = false
        }}
        onPointerMove={(event) => {
          if (Math.abs(event.clientX - dragStart.current) > 6) dragged.current = true
        }}
        onClick={() => {
          if (!dragged.current) onClose()
        }}
      >
        <div className="flex w-max min-w-full shrink-0 justify-center px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="h-[50dvh] w-auto max-w-none shrink-0 rounded-[24px] border-[3px] bg-white"
            style={{ borderColor: border }}
            onClick={(event) => event.stopPropagation()}
            onLoad={() => settlePicture()}
          />
        </div>
      </div>
      <div className="shrink-0 px-4 pt-3" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
        {slidesSideways ? (
          <p className="grandstander mb-3 text-center text-base font-bold text-white">Slide sideways to see all of it</p>
        ) : null}
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="grandstander w-full rounded-full border-[3px] bg-white px-4 py-3.5 text-lg font-bold text-[#114257] active:translate-x-1 active:translate-y-1"
          style={{ borderColor: border, boxShadow: `4px 5px 0 0 ${shadow}` }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export function QuizScreen({
  palette,
  title,
  dueLabel,
  progressLabel,
  filled,
  total,
  imageUrl,
  question,
  answers,
  selected,
  correctAnswer,
  note,
  lives,
  timerRatio,
  shake,
  busy,
  onChoose,
}: {
  palette: ScreenPalette
  title: string
  dueLabel: string
  progressLabel: string
  filled: number
  total: number
  imageUrl: string | null
  question: string
  answers: string[]
  selected: string | null
  correctAnswer: string | null
  note: string | null
  lives: number | null
  timerRatio: number | null
  shake: boolean
  busy: boolean
  onChoose: (answer: string) => void
}) {
  const pills = Math.max(1, Math.min(total, 24))
  const [zoomed, setZoomed] = useState(false)
  useEffect(() => {
    setZoomed(false)
  }, [question])
  return (
    <>
    <div className={`fixed inset-0 z-10 flex justify-center ${shake ? styles.shake : ''}`}>
      <div
        className="flex h-full w-full max-w-md flex-col px-4"
        style={{
          paddingTop: 'max(2rem, calc(env(safe-area-inset-top) + 0.75rem))',
          paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1.25rem))',
        }}
      >
      <header className="shrink-0">
        <h1 className="grandstander text-center text-2xl font-black leading-tight" style={{ color: palette.ink }}>{title}</h1>
        <p className="mt-1 text-center text-sm font-semibold" style={{ color: palette.muted }}>Due {dueLabel}</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="grandstander w-12 shrink-0 text-sm font-black" style={{ color: palette.ink }}>{progressLabel}</span>
          <div className="flex min-w-0 flex-1 gap-1">
            {Array.from({ length: pills }, (_, index) => (
              <span
                key={index}
                className="h-2.5 flex-1 rounded-full"
                style={{ background: index < filled ? palette.pillOn : palette.pillOff }}
              />
            ))}
          </div>
          {lives !== null ? (
            <span className="grandstander shrink-0 text-sm font-black" style={{ color: palette.ink }}>
              {lives} {lives === 1 ? 'life' : 'lives'}
            </span>
          ) : null}
        </div>
      </header>
      <div key={question} className={`${styles.rise} flex min-h-0 flex-1 flex-col justify-evenly overflow-hidden`}>
        <div className="mx-auto flex min-h-0 w-full max-w-full flex-col items-center" style={{ maxHeight: '48%' }}>
          {imageUrl ? (
            <button
              type="button"
              onClick={() => setZoomed(true)}
              className="relative block min-h-0 max-h-full max-w-full overflow-hidden rounded-[24px] border-[3px] bg-white p-0"
              style={{ borderColor: palette.border }}
              aria-label="Make the picture bigger"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="block max-h-full max-w-full object-contain" />
              <span className="pointer-events-none absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#7dd3fc] bg-white text-[#114257]" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="10.5" cy="10.5" r="6.25" />
                  <path d="M15.2 15.2 L20 20" strokeLinecap="round" />
                </svg>
              </span>
            </button>
          ) : null}
          {timerRatio !== null ? (
            <div className="mt-2 h-2 w-full shrink-0 overflow-hidden rounded-full" style={{ background: palette.pillOff }}>
              <div className="h-full" style={{ width: `${Math.max(0, Math.min(1, timerRatio)) * 100}%`, background: palette.pillOn }} />
            </div>
          ) : null}
        </div>
        <div className="shrink-0">
          <h2 className="grandstander text-center text-3xl font-black leading-tight" style={{ color: palette.ink }}>
            {question}
          </h2>
          {note ? (
            <p className="grandstander mt-2 text-center text-lg font-black" style={{ color: palette.ink }}>{note}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-3">
        {answers.map((answer, answerIndex) => {
          const picked = selected === answer
          const show = selected !== null && correctAnswer !== null
          const right = show && answer === correctAnswer
          const wrong = show && picked && answer !== correctAnswer
          const border = right ? '#15803d' : wrong ? '#be123c' : palette.border
          const shadow = right ? '#166534' : wrong ? '#9f1239' : palette.shadow
          const fill = right ? '#dcfce7' : wrong ? '#ffe4e6' : '#ffffff'
          return (
            <button
              key={`${answer}-${answerIndex}`}
              type="button"
              disabled={busy}
              onClick={() => onChoose(answer)}
              className="grandstander w-full rounded-full border-[3px] px-4 py-3.5 text-lg font-bold transition active:translate-x-1 active:translate-y-1 disabled:opacity-80"
              style={{ color: '#114257', background: fill, borderColor: border, boxShadow: `4px 5px 0 0 ${shadow}` }}
            >
              {answer}
            </button>
          )
        })}
      </div>
      </div>
    </div>
    {zoomed && imageUrl ? (
      <ZoomedPicture
        src={imageUrl}
        border={palette.border}
        shadow={palette.shadow}
        onClose={() => setZoomed(false)}
      />
    ) : null}
    </>
  )
}

export function EndScreen({
  palette,
  title,
  dueLabel,
  score,
  mode,
  misses,
  canRetry,
  busy,
  onAgain,
  onChallenge,
  leaderboard,
}: {
  palette: ScreenPalette
  title: string
  dueLabel: string
  score: string
  mode: 'homework' | 'challenge'
  misses: { questionText: string; selectedAnswer: string; correctAnswer: string }[]
  canRetry: boolean
  busy: boolean
  onAgain: () => void
  onChallenge: () => void
  leaderboard: { name: string; detail: string }[] | null
}) {
  const [showMistakes, setShowMistakes] = useState(false)
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <h1 className="grandstander text-center text-2xl font-black leading-tight" style={{ color: palette.ink }}>{title}</h1>
      <p className="mt-1 text-center text-sm font-semibold" style={{ color: palette.muted }}>Due {dueLabel}</p>
      <div
        className="mx-auto mt-5 rounded-full border-[3px] bg-white px-10 py-3"
        style={{ borderColor: palette.border, boxShadow: `4px 5px 0 0 ${palette.shadow}` }}
      >
        <p className="grandstander text-3xl font-black tracking-wide" style={{ color: palette.cardInk }}>SCORE</p>
      </div>
      <div className="mt-4">
        <ChunkyNumber value={score} stroke={palette.chunkyStroke} />
      </div>
      <div className="mt-8 flex flex-col gap-4">
        {mode === 'challenge' ? (
          <>
            <PillButton border={palette.challengeBorder} shadow={palette.challengeShadow} disabled={busy || !canRetry} onClick={onChallenge}>
              Play Again
            </PillButton>
            <PillButton border={palette.border} shadow={palette.shadow} disabled={busy || !canRetry} onClick={onAgain}>
              Practice quiz again
            </PillButton>
          </>
        ) : (
          <>
            <PillButton border={palette.border} shadow={palette.shadow} disabled={busy || !canRetry} onClick={onAgain}>
              Play Again
            </PillButton>
            <PillButton border={palette.challengeBorder} shadow={palette.challengeShadow} disabled={busy || !canRetry} onClick={onChallenge}>
              Challenge
            </PillButton>
          </>
        )}
      </div>
      {mode === 'homework' && misses.length > 0 ? (
        <div className="mt-6">
          <button
            type="button"
            aria-expanded={showMistakes}
            onClick={() => setShowMistakes((open) => !open)}
            className="grandstander w-full rounded-full border-[3px] bg-white px-5 py-3.5 text-xl font-bold text-[#114257] transition active:translate-x-1 active:translate-y-1 active:shadow-none"
            style={{ borderColor: palette.border, boxShadow: `4px 5px 0 0 ${palette.shadow}` }}
          >
            {showMistakes ? 'Hide my mistakes' : 'View my mistakes'}
          </button>
          {showMistakes ? (
            <section className="mt-4 rounded-[24px] bg-white px-4 py-4 text-left">
              {misses.map((miss) => (
                <div key={`${miss.questionText}-${miss.correctAnswer}`} className="border-b border-slate-100 py-2 last:border-b-0">
                  <p className="text-sm font-bold" style={{ color: palette.cardInk }}>{miss.questionText}</p>
                  <p className="text-sm" style={{ color: palette.cardInk }}>You chose {miss.selectedAnswer || '—'}</p>
                  <p className="text-sm font-semibold" style={{ color: palette.cardInk }}>Right answer: {miss.correctAnswer}</p>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      ) : null}
      {leaderboard ? (
        <div className="relative mt-28">
          <Crown />
          <div
            className="rounded-[28px] border-[3px] bg-white px-4 pb-4 pt-8"
            style={{ borderColor: palette.challengeBorder }}
          >
            <div
              className="-mx-4 -mt-8 rounded-t-[24px] px-4 py-3 text-center"
              style={{ background: palette.challengeBorder }}
            >
              <p className="grandstander text-xl font-black" style={{ color: palette.cardInk }}>Challenge Leaderboard</p>
            </div>
            {leaderboard.length === 0 ? (
              <p className="mt-4 text-center text-sm font-semibold" style={{ color: palette.cardInk }}>No challenge scores yet.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {leaderboard.map((row) => (
                  <li key={`${row.name}-${row.detail}`} className="flex items-baseline gap-2 text-base font-bold" style={{ color: palette.cardInk }}>
                    <span className="max-w-[46%] truncate">{row.name}</span>
                    <span className="mb-1 flex-1 border-b-2 border-dotted" style={{ borderColor: palette.cardInk }} />
                    <span className="shrink-0">{row.detail}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Crown() {
  return (
    <div className="pointer-events-none absolute -top-[6.75rem] left-1/2 h-28 w-28 -translate-x-1/2 overflow-hidden" aria-hidden="true">
      {/* The file has a large empty margin, so the picture is shifted to show only the crown. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/ui/crown.png"
        alt=""
        className="absolute max-w-none"
        style={{ width: '164.5%', height: '201%', left: '-61.5%', top: '-43.6%' }}
      />
    </div>
  )
}
