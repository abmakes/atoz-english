export const CHALLENGE_GOAL = 100
export const CHALLENGE_START_SECONDS = 15
export const EXTRA_LIFE_AT = 20
export const FLAME_START_AT = 30
export const TIMER_DROP_AT = 50
export const STARTING_LIVES = 1
export const ANSWER_GRACE_MS = 2_000

export type FlameColor =
  | 'amber'
  | 'orange'
  | 'red'
  | 'deep-red'
  | 'magenta'
  | 'violet'
  | 'white-blue'

const FLAME_COLORS: readonly FlameColor[] = [
  'amber',
  'orange',
  'red',
  'deep-red',
  'magenta',
  'violet',
  'white-blue',
]

/**
 * Seconds allowed for the next question.
 * `correct` is how many answers are already right before that question.
 * 15 seconds through 49 correct, then 2 seconds off every 10: 13, 11, 9, 7, and 5 from 90.
 */
export function challengeSeconds(correct: number): number {
  if (correct < TIMER_DROP_AT) return CHALLENGE_START_SECONDS
  const steps = Math.floor((correct - 40) / 10)
  return CHALLENGE_START_SECONDS - steps * 2
}

export function challengeTimeLimitMs(correct: number): number {
  return challengeSeconds(correct) * 1000
}

export function shouldShake(seconds: number): boolean {
  return seconds < 10
}

/** Progress flames. They start at 30 correct and change color every 10. A miss does not clear them. */
export function flameColor(correct: number): FlameColor | null {
  if (correct < FLAME_START_AT) return null
  const stage = Math.floor(correct / 10) - 3
  return FLAME_COLORS[Math.min(FLAME_COLORS.length - 1, stage)] ?? null
}

export function frameForCorrect(correct: number): {
  seconds: number
  timeLimitMs: number
  shake: boolean
  flame: FlameColor | null
} {
  const seconds = challengeSeconds(correct)
  return {
    seconds,
    timeLimitMs: seconds * 1000,
    shake: shouldShake(seconds),
    flame: flameColor(correct),
  }
}

/**
 * After a correct answer, `correctCount` is the new total.
 * The extra life is granted once, when that total first reaches 20.
 */
export function livesAfterCorrect(
  correctCount: number,
  livesLeft: number,
  extraLifeGranted: boolean
): { livesLeft: number; extraLifeGranted: boolean; reachedHundred: boolean } {
  const reachedHundred = correctCount >= CHALLENGE_GOAL
  if (!extraLifeGranted && correctCount >= EXTRA_LIFE_AT && !reachedHundred) {
    return { livesLeft: livesLeft + 1, extraLifeGranted: true, reachedHundred }
  }
  return { livesLeft, extraLifeGranted, reachedHundred }
}

export function answerIsLate(elapsedMs: number, timeLimitMs: number): boolean {
  return elapsedMs > timeLimitMs + ANSWER_GRACE_MS
}

export type ChallengeGrade = {
  correct: boolean
  timedOut: boolean
  correctCount: number
  livesLeft: number
  extraLifeGranted: boolean
  endReason: 'WRONG' | 'TIMEOUT' | 'HUNDRED' | null
  reachedHundred: boolean
  timeToHundredMs: number | null
  durationMs: number
  timeUsedMs: number
  nextTimeLimitMs: number
}

/** Grade one challenge tap from the clock and the real answer. This is the same step the saved run is replayed with. */
export function gradeChallengeTap(input: {
  correctCount: number
  livesLeft: number
  extraLifeGranted: boolean
  runStartedAtMs: number
  questionStartedAtMs: number
  timeLimitMs: number
  nowMs: number
  timedOut: boolean
  selectedAnswer: string
  correctAnswer: string
}): ChallengeGrade {
  const elapsed = Math.max(0, input.nowMs - input.questionStartedAtMs)
  const timedOut = input.timedOut || answerIsLate(elapsed, input.timeLimitMs)
  const selected = input.selectedAnswer.trim()
  const correct = !timedOut && selected.length > 0 && selected === input.correctAnswer
  let livesLeft = input.livesLeft
  let correctCount = input.correctCount
  let extraLifeGranted = input.extraLifeGranted
  let endReason: ChallengeGrade['endReason'] = null
  let reachedHundred = false
  let timeToHundredMs: number | null = null
  if (correct) {
    correctCount += 1
    const next = livesAfterCorrect(correctCount, livesLeft, extraLifeGranted)
    livesLeft = next.livesLeft
    extraLifeGranted = next.extraLifeGranted
    reachedHundred = next.reachedHundred
    if (reachedHundred) {
      endReason = 'HUNDRED'
      timeToHundredMs = Math.max(0, input.nowMs - input.runStartedAtMs)
    }
  } else {
    livesLeft -= 1
    if (livesLeft <= 0) endReason = timedOut ? 'TIMEOUT' : 'WRONG'
  }
  return {
    correct,
    timedOut,
    correctCount,
    livesLeft,
    extraLifeGranted,
    endReason,
    reachedHundred,
    timeToHundredMs,
    durationMs: Math.max(0, input.nowMs - input.runStartedAtMs),
    timeUsedMs: Math.max(0, Math.min(elapsed, input.timeLimitMs)),
    nextTimeLimitMs: challengeTimeLimitMs(correctCount),
  }
}

export type ChallengeRun = {
  studentName: string
  correctCount: number
  reachedHundred: boolean
  timeToHundredMs: number | null
  durationMs: number
  finishedAt: string
}

export type RankedChallengeRun = ChallengeRun & { rank: number }

function nameKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** A Mega Chad run beats any unfinished run. Time to 100 decides those. Everyone else is ranked by correct answers. */
export function betterChallengeRun(left: ChallengeRun, right: ChallengeRun): boolean {
  if (left.reachedHundred !== right.reachedHundred) return left.reachedHundred
  if (left.reachedHundred && right.reachedHundred) {
    const leftTime = left.timeToHundredMs ?? Number.POSITIVE_INFINITY
    const rightTime = right.timeToHundredMs ?? Number.POSITIVE_INFINITY
    if (leftTime !== rightTime) return leftTime < rightTime
  } else if (left.correctCount !== right.correctCount) {
    return left.correctCount > right.correctCount
  }
  if (left.durationMs !== right.durationMs) return left.durationMs < right.durationMs
  return left.finishedAt < right.finishedAt
}

export function rankChallengeRuns(runs: readonly ChallengeRun[]): RankedChallengeRun[] {
  const best = new Map<string, ChallengeRun>()
  for (const run of runs) {
    const key = nameKey(run.studentName)
    if (!key) continue
    const current = best.get(key)
    if (!current || betterChallengeRun(run, current)) best.set(key, run)
  }
  return [...best.values()]
    .sort((left, right) => (betterChallengeRun(left, right) ? -1 : 1))
    .map((run, index) => ({ ...run, rank: index + 1 }))
}

export function homeworkPercentage(correct: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((correct / total) * 1000) / 10
}

export function displayNameKey(name: string): string {
  return nameKey(name)
}
