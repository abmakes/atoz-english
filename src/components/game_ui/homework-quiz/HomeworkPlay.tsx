'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Application } from 'pixi.js'
import { HomeworkQuizGame, type HomeworkCard, type HomeworkFrame } from '@/lib/pixi-games/homework-quiz/HomeworkQuizGame'
import { flameColor, frameForCorrect, gradeChallengeTap, shouldShake } from '@/lib/homework/rules'
import { reshuffleAvoiding } from '@/lib/homework/queue'
import { formatDue } from '@/lib/assignments/due'
import { readChallengeTry, rememberChallengeTry, submitChallengeTry } from '@/lib/homework/localChallenge'
import { flushHomeworkTry, readHomeworkTry, rememberHomeworkTry } from '@/lib/homework/localProgress'
import { getPixiThemeConfig, sceneBackgroundUrl, sceneThemeId } from '@/lib/themes'

const CLIENT_KEY = 'playtoz-homework-client'

type Mode = 'HOMEWORK' | 'CHALLENGE'

interface PublicQuestion {
  id: string
  question: string
  imageUrl: string | null
  answers: string[]
  correctAnswer: string
}

interface GradedAnswer {
  questionId: string
  questionText: string
  selectedAnswer: string
  correctAnswer: string
  correct: boolean
  order: number
}

interface PlayState {
  attemptId: string
  mode: Mode
  status: 'IN_PROGRESS' | 'FINISHED'
  studentName: string
  questions: PublicQuestion[]
  selections: { questionId: string; selectedAnswer: string }[]
  currentQuestionId: string | null
  correctCount: number
  livesLeft: number | null
  timeLimitMs: number | null
  questionStartedAt: string | null
  percentage: number | null
  durationMs: number
  endReason: 'COMPLETE' | 'WRONG' | 'TIMEOUT' | 'HUNDRED' | null
  reachedHundred: boolean
  timeToHundredMs: number | null
  results: GradedAnswer[] | null
  startedAt: string
  queue: string[]
  extraLifeGranted: boolean
}

interface LeaderRow {
  rank: number
  studentName: string
  correctCount: number
  reachedHundred: boolean
  timeToHundredMs: number | null
}

interface SessionInfo {
  title: string
  dueAt: string
  questionCount: number
  acceptingResponses: boolean
  showLeaderboard: boolean
  leaderboard: LeaderRow[]
  finishedHomework: boolean
  bestPercentage: number | null
  theme: string
  resume: { attemptId: string; mode: Mode; studentName: string } | null
}

function clientKey(): string {
  const existing = window.localStorage.getItem(CLIENT_KEY)
  if (existing) return existing
  const created = crypto.randomUUID()
  window.localStorage.setItem(CLIENT_KEY, created)
  return created
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof payload?.error === 'string' ? payload.error : 'Something went wrong.')
  }
  return (payload.data ?? payload) as T
}

function formatClock(ms: number | null): string {
  if (ms === null) return '—'
  const seconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

export default function HomeworkPlay({ token }: { token: string }) {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phase, setPhase] = useState<'loading' | 'name' | 'play' | 'homework-results' | 'challenge-results'>('loading')
  const [play, setPlay] = useState<PlayState | null>(null)
  const [index, setIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const mountRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<HomeworkQuizGame | null>(null)
  const playRef = useRef<PlayState | null>(null)
  const indexRef = useRef(0)
  const sessionRef = useRef<SessionInfo | null>(null)
  const chooseRef = useRef<(answer: string) => void>(() => undefined)
  const timeoutRef = useRef<() => void>(() => undefined)
  playRef.current = play
  indexRef.current = index
  sessionRef.current = session

  const loadSession = useCallback(async () => {
    const key = clientKey()
    const info = await readJson<SessionInfo>(
      await fetch(`/api/homework-session/${token}?clientKey=${key}`, { cache: 'no-store' })
    )
    setSession(info)
    return info
  }, [token])

  useEffect(() => {
    void (async () => {
      try {
        const info = await loadSession()
        const local = readHomeworkTry<PlayState>(token, clientKey())
        if (local && info.acceptingResponses) {
          setName(local.play.studentName)
          setPlay(local.play)
          const open = local.play.questions.findIndex(
            (question) => !local.play.selections.some((selection) => selection.questionId === question.id)
          )
          setIndex(open < 0 ? 0 : open)
          setPhase('play')
          return
        }
        const localChallenge = readChallengeTry<PlayState>(token, clientKey())
        if (localChallenge && info.acceptingResponses) {
          setName(localChallenge.play.studentName)
          if (localChallenge.play.status === 'FINISHED') {
            setPlay(localChallenge.play)
            setPhase('challenge-results')
            void submitChallengeTry<PlayState>(token, clientKey())
              .then(async (saved) => {
                if (!saved) return
                setPlay(saved)
                await loadSession()
              })
              .catch((reason: unknown) => {
                setError(reason instanceof Error ? reason.message : 'That challenge could not be saved.')
              })
            return
          }
          const resumed = { ...localChallenge.play, questionStartedAt: new Date().toISOString() }
          rememberChallengeTry(token, resumed, localChallenge.events, clientKey())
          setPlay(resumed)
          setPhase('play')
          return
        }
        if (!info.resume || !info.acceptingResponses || info.resume.mode === 'CHALLENGE') {
          setPhase('name')
          return
        }
        const state = await readJson<PlayState>(
          await fetch(
            `/api/homework-session/${token}/attempts/${info.resume.attemptId}?clientKey=${clientKey()}`,
            { cache: 'no-store' }
          )
        )
        setName(state.studentName)
        if (state.mode === 'HOMEWORK') rememberHomeworkTry(token, state, clientKey(), false)
        setPlay(state)
        const open = state.questions.findIndex(
          (question) => !state.selections.some((selection) => selection.questionId === question.id)
        )
        setIndex(open < 0 ? 0 : open)
        setPhase('play')
      } catch (reason: unknown) {
        setError(reason instanceof Error ? reason.message : 'This homework is not available.')
        setPhase('name')
      }
    })()
  }, [loadSession, token])

  const showCard = useCallback((state: PlayState, questionIndex: number) => {
    const game = gameRef.current
    const card = state.questions[questionIndex]
    if (!game || !card) return
    const challenge = state.mode === 'CHALLENGE'
    const frameRules = frameForCorrect(state.correctCount)
    const frame: HomeworkFrame = {
      mode: state.mode,
      progress: challenge
        ? `${state.correctCount} correct`
        : `${questionIndex + 1} / ${state.questions.length}`,
      step: challenge ? state.correctCount : questionIndex + 1,
      total: challenge ? 100 : state.questions.length,
      lives: state.livesLeft,
      timeLimitMs: challenge ? state.timeLimitMs ?? frameRules.timeLimitMs : null,
      startedAtMs: challenge && state.questionStartedAt ? Date.parse(state.questionStartedAt) : null,
      flame: challenge ? flameColor(state.correctCount) : null,
      shake: challenge ? shouldShake(frameRules.seconds) : false,
    }
    game.show(
      {
        id: card.id,
        question: card.question,
        imageUrl: card.imageUrl,
        answers: card.answers,
        correctAnswer: card.correctAnswer,
      } satisfies HomeworkCard,
      frame
    )
    const upcoming =
      state.mode === 'HOMEWORK'
        ? state.questions[questionIndex + 1]
        : state.questions.find((question) => question.id === state.queue[1])
    game.preload(upcoming?.imageUrl ?? null)
  }, [])

  useEffect(() => {
    if (phase !== 'play' || !mountRef.current) return
    const mount = mountRef.current
    let cancelled = false
    let destroyed = false
    const app = new Application()
    const destroyApp = () => {
      if (destroyed || !app.renderer) return
      destroyed = true
      app.destroy(true)
    }
    void (async () => {
      await app.init({
        resizeTo: mount,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      })
      if (cancelled) {
        destroyApp()
        return
      }
      app.canvas.style.touchAction = 'none'
      mount.appendChild(app.canvas)
      const game = new HomeworkQuizGame(app, sessionRef.current?.theme, {
        onChoose: (answer) => {
          chooseRef.current(answer)
        },
        onTimeout: () => {
          timeoutRef.current()
        },
      })
      gameRef.current = game
      await game.init()
      const current = playRef.current
      if (current) {
        const questionIndex =
          current.mode === 'HOMEWORK'
            ? indexRef.current
            : current.questions.findIndex((question) => question.id === current.currentQuestionId)
        showCard(current, questionIndex < 0 ? 0 : questionIndex)
      }
    })().catch((reason: unknown) => {
      console.error('[HomeworkQuiz] start failed', reason)
      if (!cancelled) setError('The game could not start. Refresh and try again.')
    })
    return () => {
      cancelled = true
      gameRef.current?.destroy()
      gameRef.current = null
      destroyApp()
    }
    // The game is created once per play phase. Question changes go through showCard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase !== 'play' || !play) return
    const questionIndex = play.mode === 'HOMEWORK' ? index : Math.max(0, play.questions.findIndex((question) => question.id === play.currentQuestionId))
    showCard(play, questionIndex < 0 ? 0 : questionIndex)
  }, [index, phase, play, showCard])

  useEffect(() => {
    if (phase !== 'play') return
    const flush = () => {
      if (playRef.current?.mode !== 'HOMEWORK') return
      void flushHomeworkTry(token, clientKey(), false).catch(() => undefined)
    }
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [phase, token])

  async function start(mode: Mode) {
    setBusy(true)
    setError(null)
    try {
      const state = await readJson<PlayState>(
        await fetch(`/api/homework-session/${token}/attempts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentName: name.trim(), clientKey: clientKey(), mode }),
        })
      )
      if (state.mode === 'HOMEWORK' && state.status === 'IN_PROGRESS') {
        rememberHomeworkTry(token, state, clientKey(), false)
      }
      if (state.mode === 'CHALLENGE' && state.status === 'IN_PROGRESS') {
        rememberChallengeTry(token, state, [], clientKey())
      }
      setPlay(state)
      if (state.status === 'FINISHED' && state.mode === 'HOMEWORK') {
        setPhase('homework-results')
        return
      }
      if (state.status === 'FINISHED') {
        setPhase('challenge-results')
        return
      }
      const open = state.questions.findIndex(
        (question) => !state.selections.some((selection) => selection.questionId === question.id)
      )
      setIndex(open < 0 ? 0 : open)
      setPhase('play')
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Could not start.')
    } finally {
      setBusy(false)
    }
  }

  function recordChallenge(current: PlayState, question: PublicQuestion, selectedAnswer: string, timedOut: boolean): PlayState {
    const limit = current.timeLimitMs ?? frameForCorrect(current.correctCount).timeLimitMs
    const grade = gradeChallengeTap({
      correctCount: current.correctCount,
      livesLeft: current.livesLeft ?? 1,
      extraLifeGranted: current.extraLifeGranted,
      runStartedAtMs: Date.parse(current.startedAt),
      questionStartedAtMs: Date.parse(current.questionStartedAt ?? current.startedAt),
      timeLimitMs: limit,
      nowMs: Date.now(),
      timedOut,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
    })
    const events = [
      ...(readChallengeTry<PlayState>(token, clientKey())?.events ?? []),
      {
        questionId: question.id,
        selectedAnswer: grade.timedOut ? '' : selectedAnswer,
        timedOut: grade.timedOut,
        timeUsedMs: grade.timeUsedMs,
      },
    ]
    let queue = current.queue.slice(1)
    if (!grade.endReason && queue.length === 0) {
      queue = reshuffleAvoiding(
        current.questions.map((item) => item.id),
        question.id
      )
    }
    const frame = frameForCorrect(grade.correctCount)
    const next: PlayState = {
      ...current,
      selections: [...current.selections, { questionId: question.id, selectedAnswer: grade.timedOut ? '' : selectedAnswer }],
      currentQuestionId: grade.endReason ? current.currentQuestionId : (queue[0] ?? null),
      correctCount: grade.correctCount,
      answeredCount: current.answeredCount + 1,
      livesLeft: grade.livesLeft,
      extraLifeGranted: grade.extraLifeGranted,
      queue,
      timeLimitMs: grade.endReason ? current.timeLimitMs : frame.timeLimitMs,
      flame: frame.flame,
      shake: frame.shake,
      durationMs: grade.durationMs,
      status: grade.endReason ? 'FINISHED' : 'IN_PROGRESS',
      endReason: grade.endReason,
      reachedHundred: grade.reachedHundred,
      timeToHundredMs: grade.timeToHundredMs,
    }
    rememberChallengeTry(token, next, events, clientKey())
    return next
  }

  async function revealChallenge(nextPlay: PlayState, save: Promise<PlayState | null> | null) {
    await gameRef.current?.depart()
    if (nextPlay.status === 'FINISHED') {
      setPlay(nextPlay)
      setPhase('challenge-results')
      const saved = await save
      if (saved) {
        setPlay(saved)
        await loadSession()
      }
      return
    }
    const revealed = { ...nextPlay, questionStartedAt: new Date().toISOString() }
    const events = readChallengeTry<PlayState>(token, clientKey())?.events ?? []
    rememberChallengeTry(token, revealed, events, clientKey())
    playRef.current = revealed
    setPlay(revealed)
  }

  async function choose(answer: string) {
    const current = playRef.current
    if (!current) {
      gameRef.current?.unlock()
      return
    }
    if (busy) return
    const questionIndex = indexRef.current
    const question = current.mode === 'HOMEWORK' ? current.questions[questionIndex] : current.questions.find((item) => item.id === current.currentQuestionId)
    if (!question) {
      gameRef.current?.unlock()
      return
    }
    setBusy(true)
    const correct = answer === question.correctAnswer
    gameRef.current?.showVerdict(answer, correct, question.correctAnswer)
    let nextPlay = current
    let challengeSave: Promise<PlayState | null> | null = null
    try {
      if (current.mode === 'HOMEWORK') {
        nextPlay = {
          ...current,
          selections: [
            ...current.selections.filter((selection) => selection.questionId !== question.id),
            { questionId: question.id, selectedAnswer: answer },
          ],
        }
        rememberHomeworkTry(token, nextPlay, clientKey(), true)
        playRef.current = nextPlay
      } else {
        nextPlay = recordChallenge(current, question, answer, false)
        playRef.current = nextPlay
        if (nextPlay.status === 'FINISHED') challengeSave = submitChallengeTry<PlayState>(token, clientKey())
      }
      await wait(correct ? 420 : 700)
      if (current.mode === 'HOMEWORK') {
        await gameRef.current?.depart()
        const nextIndex = questionIndex + 1
        if (nextIndex >= current.questions.length) {
          const finished = await flushHomeworkTry<PlayState>(token, clientKey(), true)
          if (!finished) throw new Error('That homework could not be saved.')
          setPlay(finished)
          setPhase('homework-results')
          await loadSession()
        } else {
          setPlay(nextPlay)
          setIndex(nextIndex)
        }
      } else {
        await revealChallenge(nextPlay, challengeSave)
      }
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'That answer was not saved.')
      if (nextPlay.status === 'FINISHED') {
        setPlay(nextPlay)
        setPhase('challenge-results')
      } else if (current) {
        showCard(current, questionIndex)
      }
    } finally {
      setBusy(false)
    }
  }
  chooseRef.current = (answer) => {
    void choose(answer)
  }

  async function timeout() {
    const current = playRef.current
    if (!current || current.mode !== 'CHALLENGE' || !current.currentQuestionId || busy) return
    const question = current.questions.find((item) => item.id === current.currentQuestionId)
    if (!question) return
    setBusy(true)
    try {
      const nextPlay = recordChallenge(current, question, '', true)
      playRef.current = nextPlay
      const challengeSave = nextPlay.status === 'FINISHED' ? submitChallengeTry<PlayState>(token, clientKey()) : null
      await revealChallenge(nextPlay, challengeSave)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'The clock could not be saved.')
    } finally {
      setBusy(false)
    }
  }
  timeoutRef.current = () => {
    void timeout()
  }

  const scene = sceneThemeId(session?.theme)
  const colors = getPixiThemeConfig(scene)
  const background = sceneBackgroundUrl(scene)

  const inkShadow = scene === 'dark' ? '0 2px 8px rgba(0,0,0,0.85)' : '0 1px 0 #fff, 0 0 12px rgba(255,255,255,0.9)'

  return (
    <div
      className={`bg-cover bg-center bg-no-repeat ${phase === 'play' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
      style={{ backgroundImage: `url(${background})`, color: colors.textColor }}
    >
      {phase === 'play' ? <div ref={mountRef} className="fixed inset-0 z-0" /> : null}
      <div className={`relative z-10 flex min-h-screen flex-col px-4 py-6 ${phase === 'play' ? 'pointer-events-none' : 'mx-auto max-w-5xl'}`}>
        {phase === 'play' ? null : (
          <>
            <p className="text-sm font-semibold" style={{ color: colors.primaryAccent, textShadow: inkShadow }}>Homework</p>
            <h1 className="grandstander text-3xl font-bold" style={{ color: colors.headingColor, textShadow: inkShadow }}>{session?.title ?? 'Quiz homework'}</h1>
            {session ? (
              <p className="mt-1 text-sm" style={{ color: colors.textLight, textShadow: inkShadow }}>
                Due {formatDue(session.dueAt)} · {session.questionCount}{' '}
                {session.questionCount === 1 ? 'question' : 'questions'}
                {session.bestPercentage !== null ? ` · Your best ${session.bestPercentage}%` : ''}
              </p>
            ) : null}
          </>
        )}
        {error ? <p className="pointer-events-auto mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        {phase === 'loading' ? <p className="mt-10 text-slate-500">Loading…</p> : null}

        {phase === 'name' && session ? (
          <section className="pointer-events-auto mx-auto mt-10 w-full max-w-md rounded-3xl border-2 border-[#1E5167] bg-white p-6 text-[#114257] shadow-[4px_4px_0px_0px_#1E5167]">
            <p className="text-slate-600">
              Answer every question. You can look things up, and you can try again for a better percentage.
            </p>
            <label className="mt-4 block text-sm font-semibold" htmlFor="homework-name">
              Your name
            </label>
            <input
              id="homework-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Type your name"
              maxLength={40}
              className="mt-1 w-full rounded-xl border-2 border-sky-300 px-4 py-3 text-center text-lg"
            />
            <button
              type="button"
              disabled={busy || name.trim().length === 0 || !session.acceptingResponses}
              onClick={() => void start('HOMEWORK')}
              className="grandstander mt-4 w-full rounded-full bg-[#114257] px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {session.acceptingResponses ? 'Start homework' : 'This homework is closed'}
            </button>
            {session.finishedHomework ? (
              <button
                type="button"
                disabled={busy || name.trim().length === 0 || !session.acceptingResponses}
                onClick={() => void start('CHALLENGE')}
                className="grandstander mt-3 w-full rounded-full border-2 border-orange-400 px-4 py-3 font-bold text-orange-700 disabled:opacity-50"
              >
                Take the challenge
              </button>
            ) : null}
            {session.showLeaderboard ? <Leaderboard rows={session.leaderboard} /> : null}
          </section>
        ) : null}


        {phase === 'homework-results' && play ? (
          <section className="pointer-events-auto mx-auto mt-8 w-full max-w-xl rounded-3xl border-2 border-[#1E5167] bg-white p-6 text-[#114257] shadow-[4px_4px_0px_0px_#1E5167]">
            <p className="grandstander text-5xl font-bold">{play.percentage ?? 0}%</p>
            <p className="mt-1 text-slate-600">
              {play.correctCount} of {play.questions.length} in {formatClock(play.durationMs)}
            </p>
            <ul className="mt-4 space-y-2">
              {(play.results ?? []).filter((answer) => !answer.correct).map((answer) => (
                <li key={answer.questionId} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-semibold">{answer.questionText}</p>
                  <p>You chose {answer.selectedAnswer || '—'}</p>
                  <p>Right answer: {answer.correctAnswer}</p>
                </li>
              ))}
            </ul>
            {(play.results ?? []).every((answer) => answer.correct) ? (
              <p className="mt-4 text-sm text-slate-600">Every answer was right.</p>
            ) : null}
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                disabled={busy || session?.acceptingResponses === false}
                onClick={() => void start('HOMEWORK')}
                className="rounded-full bg-[#114257] px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                Try again
              </button>
              <button
                type="button"
                disabled={busy || session?.acceptingResponses === false}
                onClick={() => void start('CHALLENGE')}
                className="rounded-full border-2 border-orange-400 px-4 py-3 font-bold text-orange-700 disabled:opacity-50"
              >
                Take the challenge
              </button>
            </div>
          </section>
        ) : null}

        {phase === 'challenge-results' && play ? (
          <section className="pointer-events-auto mx-auto mt-8 w-full max-w-xl rounded-3xl border-2 border-orange-400 bg-white p-6 text-center text-[#114257] shadow-[4px_4px_0px_0px_#fdba74]">
            <p className="grandstander text-4xl font-bold">
              {play.reachedHundred ? 'Mega Chad' : `${play.correctCount} correct`}
            </p>
            <p className="mt-2 text-slate-600">
              {play.reachedHundred
                ? `100 correct in ${formatClock(play.timeToHundredMs)}`
                : play.endReason === 'TIMEOUT'
                  ? 'Time ran out.'
                  : 'That miss ended the run.'}
            </p>
            <button
              type="button"
              className="mt-6 rounded-full bg-[#114257] px-4 py-3 font-bold text-white"
              onClick={() => setPhase('name')}
            >
              Back
            </button>
            {session?.showLeaderboard ? <Leaderboard rows={session.leaderboard} /> : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function Leaderboard({ rows }: { rows: LeaderRow[] }) {
  return (
    <div className="mt-6 text-left">
      <h2 className="grandstander text-xl font-bold">Challenge leaderboard</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No challenge scores yet.</p>
      ) : (
        <ol className="mt-2 space-y-1 text-sm">
          {rows.map((row) => (
            <li key={`${row.rank}-${row.studentName}`} className="flex justify-between gap-3">
              <span>
                {row.rank}. {row.studentName}
              </span>
              <span className="font-semibold">
                {row.reachedHundred ? formatClock(row.timeToHundredMs) : `${row.correctCount} correct`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
