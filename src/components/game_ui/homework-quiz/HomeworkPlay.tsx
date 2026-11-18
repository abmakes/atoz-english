'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { frameForCorrect, gradeChallengeTap, shouldShake, type FlameColor } from '@/lib/homework/rules'
import { reshuffleAvoiding } from '@/lib/homework/queue'
import { formatDue } from '@/lib/assignments/due'
import { readChallengeTry, rememberChallengeTry, submitChallengeTry } from '@/lib/homework/localChallenge'
import { flushHomeworkTry, readHomeworkTry, rememberHomeworkTry } from '@/lib/homework/localProgress'
import { sceneBackgroundUrl, sceneThemeId } from '@/lib/themes'
import { EndScreen, QuizScreen, sceneShell, screenPalette, StartScreen } from '@/components/game_ui/homework-quiz/HomeworkScreens'

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
  answeredCount: number
  livesLeft: number | null
  timeLimitMs: number | null
  questionStartedAt: string | null
  flame: FlameColor | null
  shake: boolean
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
  const [verdict, setVerdict] = useState<{ selected: string; correct: boolean; note: string } | null>(null)
  const [clockMs, setClockMs] = useState<number | null>(null)
  const playRef = useRef<PlayState | null>(null)
  const indexRef = useRef(0)
  const timeoutRef = useRef<() => void>(() => undefined)
  const timingOut = useRef(false)
  playRef.current = play
  indexRef.current = index

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

  useEffect(() => {
    if (phase !== 'play' || !play) return
    const upcoming = play.mode === 'HOMEWORK'
      ? play.questions[index + 1]
      : play.questions.find((question) => question.id === play.queue[1])
    if (!upcoming?.imageUrl) return
    const image = new Image()
    image.src = upcoming.imageUrl
  }, [index, phase, play])

  useEffect(() => {
    if (phase !== 'play' || play?.mode !== 'CHALLENGE' || !play.questionStartedAt || !play.timeLimitMs) return
    const startedAt = Date.parse(play.questionStartedAt)
    const startedIso = play.questionStartedAt
    const questionId = play.currentQuestionId
    const limit = play.timeLimitMs
    let timer = 0
    const tick = () => {
      const left = limit - (Date.now() - startedAt)
      setClockMs(left)
      const sameQuestion = playRef.current?.currentQuestionId === questionId && playRef.current.questionStartedAt === startedIso
      if (left <= 0 && sameQuestion) {
        window.clearInterval(timer)
        timeoutRef.current()
      }
    }
    tick()
    timer = window.setInterval(tick, 100)
    return () => window.clearInterval(timer)
  }, [phase, play?.mode, play?.questionStartedAt, play?.timeLimitMs, play?.currentQuestionId])

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
    setVerdict(null)
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
    if (!current || busy) return
    const questionIndex = indexRef.current
    const question = current.mode === 'HOMEWORK' ? current.questions[questionIndex] : current.questions.find((item) => item.id === current.currentQuestionId)
    if (!question) return
    setBusy(true)
    const correct = answer === question.correctAnswer
    setVerdict({
      selected: answer,
      correct,
      note: correct ? 'Correct!' : `Not quite. ${question.correctAnswer}`,
    })
    const blip = new Audio(correct ? '/audio/default/correct-sound.mp3' : '/audio/default/incorrect-sound.mp3')
    blip.volume = 0.5
    void blip.play().catch(() => undefined)
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
      setVerdict(null)
      if (current.mode === 'HOMEWORK') {
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
      setVerdict(null)
      if (nextPlay.status === 'FINISHED') {
        setPlay(nextPlay)
        setPhase('challenge-results')
      }
    } finally {
      setBusy(false)
    }
  }
  async function timeout() {
    const current = playRef.current
    if (!current || current.mode !== 'CHALLENGE' || !current.currentQuestionId || busy || timingOut.current) return
    const question = current.questions.find((item) => item.id === current.currentQuestionId)
    if (!question) return
    timingOut.current = true
    setBusy(true)
    setVerdict({ selected: '', correct: false, note: 'Time’s up' })
    try {
      await wait(420)
      const nextPlay = recordChallenge(current, question, '', true)
      playRef.current = nextPlay
      const challengeSave = nextPlay.status === 'FINISHED' ? submitChallengeTry<PlayState>(token, clientKey()) : null
      await revealChallenge(nextPlay, challengeSave)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'The clock could not be saved.')
      setVerdict(null)
    } finally {
      timingOut.current = false
      setBusy(false)
    }
  }
  timeoutRef.current = () => {
    void timeout()
  }

  const scene = sceneThemeId(session?.theme)
  const palette = screenPalette(scene)
  const background = sceneBackgroundUrl(scene)
  const question = play
    ? play.mode === 'HOMEWORK'
      ? play.questions[index]
      : play.questions.find((item) => item.id === play.currentQuestionId)
    : undefined
  const challengeFrame = play?.mode === 'CHALLENGE' ? frameForCorrect(play.correctCount) : null
  const leaderboard = session?.showLeaderboard
    ? session.leaderboard.map((row) => ({
        name: row.studentName,
        detail: row.reachedHundred ? `${row.correctCount} - ${formatClock(row.timeToHundredMs)}` : `${row.correctCount}`,
      }))
    : null

  return (
    <div className="min-h-screen" style={sceneShell(background)}>
      {error ? <p className="mx-auto mt-3 max-w-md rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {phase === 'loading' || !session ? <p className="px-5 pt-16 text-center font-semibold" style={{ color: palette.ink }}>Loading…</p> : null}
      {phase === 'name' && session ? (
        <StartScreen
          palette={palette}
          title={session.title}
          dueLabel={formatDue(session.dueAt)}
          questionCount={session.questionCount}
          name={name}
          closed={!session.acceptingResponses}
          busy={busy}
          canChallenge={session.finishedHomework}
          onName={setName}
          onStartQuiz={() => void start('HOMEWORK')}
          onStartChallenge={() => void start('CHALLENGE')}
        />
      ) : null}
      {phase === 'play' && session && play && question ? (
        <QuizScreen
          palette={palette}
          title={session.title}
          dueLabel={formatDue(session.dueAt)}
          progressLabel={play.mode === 'HOMEWORK' ? `${index + 1}/${play.questions.length}` : `${play.correctCount}`}
          filled={play.mode === 'HOMEWORK' ? index + 1 : Math.min(10, Math.floor(play.correctCount / 10))}
          total={play.mode === 'HOMEWORK' ? play.questions.length : 10}
          imageUrl={question.imageUrl}
          question={question.question}
          answers={question.answers}
          selected={verdict?.selected || null}
          correctAnswer={verdict ? question.correctAnswer : null}
          note={verdict?.note ?? null}
          lives={play.mode === 'CHALLENGE' ? play.livesLeft : null}
          timerRatio={play.mode === 'CHALLENGE' && play.timeLimitMs ? Math.max(0, (clockMs ?? play.timeLimitMs) / play.timeLimitMs) : null}
          shake={Boolean(challengeFrame && shouldShake(challengeFrame.seconds) && (clockMs ?? play.timeLimitMs ?? 0) > 0)}
          busy={busy}
          onChoose={(answer) => void choose(answer)}
        />
      ) : null}
      {(phase === 'homework-results' || phase === 'challenge-results') && session && play ? (
        <EndScreen
          palette={palette}
          title={session.title}
          dueLabel={formatDue(session.dueAt)}
          score={phase === 'homework-results' ? quizPercent(play.percentage) : `${play.correctCount}`}
          mode={phase === 'homework-results' ? 'homework' : 'challenge'}
          misses={phase === 'homework-results' ? (play.results ?? []).filter((answer) => !answer.correct) : []}
          canRetry={session.acceptingResponses}
          busy={busy}
          onAgain={() => void start('HOMEWORK')}
          onChallenge={() => void start('CHALLENGE')}
          leaderboard={leaderboard}
        />
      ) : null}
    </div>
  )
}

function quizPercent(value: number | null): string {
  const amount = Math.round((value ?? 0) * 10) / 10
  return `${Number.isInteger(amount) ? amount : amount.toFixed(1)}%`
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
