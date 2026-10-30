import type { AnswerSelectedPayload } from '@/lib/pixi-engine/core/EventTypes'
import type { QuestionData } from '@/types'
import { QuestionType } from '@/types/question_types'

export const TUG_QUESTION_TIMER_ID = 'tugOfWarQuestionTimer'
/** First to this many round points wins the match. Not best-of-3 / first to 2. */
export const TUG_ROUNDS_TO_WIN = 3
/** One correct answer moves the rope this many steps toward the active team. */
export const TUG_STEP = 1
/** Consecutive correct answers a team needs before the next one is worth double. */
export const TUG_STREAK_FOR_DOUBLE = 3
export const TUG_DOUBLE_STEP_MULTIPLIER = 2
/** A team wins the round once it is this many steps ahead. */
export const TUG_ROUND_THRESHOLD = 2
export const TUG_OFFSET_LERP_PER_SEC = 4
export const TUG_PLACEHOLDER_IMAGE = '/images/placeholder.webp'
export const TUG_MIN_ANSWERS = 2
export const TUG_MAX_ANSWERS = 4
export const TUG_NINJAS_PER_TEAM = 3

export type TugSide = 'blue' | 'red'
export type TugMatchPhase = 'playing' | 'pulling' | 'roundOver' | 'matchOver'

export const TUG_NINJA_CLIPS = [
  'idle_hold',
  'pull_heave',
  'strain_lose',
  'stumble_slip',
  'victory_cheer',
  'defeat_fall',
  'charge_up',
] as const

export type TugNinjaClip = (typeof TUG_NINJA_CLIPS)[number]

export interface TugMatchState {
  /** Target rope offset in steps. Negative is toward blue (left). */
  offset: number
  displayedOffset: number
  blueRoundWins: number
  redRoundWins: number
  roundNumber: number
  phase: TugMatchPhase
  /** Consecutive correct answers for the blue (team 0) side. */
  blueStreak: number
  /** Consecutive correct answers for the red (team 1) side. */
  redStreak: number
}

export interface TugPullImpulse {
  magnitude: number
  /** When true, pull toward the active team; otherwise toward the opponent. Misses use magnitude 0. */
  towardActiveTeam: boolean
}

export interface TugPullResult {
  state: TugMatchState
  roundWinner: TugSide | null
  matchWinner: TugSide | null
}

export interface TugMatchResolution {
  winner: TugSide | null
  reason: 'rounds' | 'questions' | 'draw'
}

export function createTugMatchState(): TugMatchState {
  return {
    offset: 0,
    displayedOffset: 0,
    blueRoundWins: 0,
    redRoundWins: 0,
    roundNumber: 1,
    phase: 'playing',
    blueStreak: 0,
    redStreak: 0,
  }
}

/** Team 0 (blue, left) pulls toward -1; team 1 (red, right) toward +1. */
export function pullSignForTeam(teamIndex: number): -1 | 1 {
  return teamIndex % 2 === 0 ? -1 : 1
}

export function sideForTeam(teamIndex: number): TugSide {
  return teamIndex % 2 === 0 ? 'blue' : 'red'
}

export function clampTugOffset(offset: number): number {
  return Math.max(-TUG_ROUND_THRESHOLD, Math.min(TUG_ROUND_THRESHOLD, offset))
}

/**
 * Steps awarded for a correct answer given the team's current streak
 * (count before this answer). After 3 in a row, the next is worth 2.
 * The bonus repeats every four consecutive correct answers.
 */
export function stepsForCorrectStreak(streak: number): number {
  return (streak + 1) % (TUG_STREAK_FOR_DOUBLE + 1) === 0
    ? TUG_STEP * TUG_DOUBLE_STEP_MULTIPLIER
    : TUG_STEP
}

export function streakForTeam(
  state: TugMatchState,
  teamIndex: number
): number {
  return sideForTeam(teamIndex) === 'blue' ? state.blueStreak : state.redStreak
}

export function withUpdatedStreak(
  state: TugMatchState,
  teamIndex: number,
  isCorrect: boolean
): TugMatchState {
  const side = sideForTeam(teamIndex)
  if (side === 'blue') {
    return { ...state, blueStreak: isCorrect ? state.blueStreak + 1 : 0 }
  }
  return { ...state, redStreak: isCorrect ? state.redStreak + 1 : 0 }
}

/**
 * Super Saiyan aura: classroom buffs from PowerUpManager, or while the
 * team's next correct answer is the streak double.
 */
export function teamHasSuperSaiyanGlow(args: {
  streak: number
  hasActivePowerUp: boolean
}): boolean {
  return (
    args.hasActivePowerUp ||
    stepsForCorrectStreak(args.streak) === TUG_STEP * TUG_DOUBLE_STEP_MULTIPLIER
  )
}

/** Map step offset onto the visual [-1, 1] rope / meter range. */
export function tugNormalizedOffset(offset: number): number {
  return offset / TUG_ROUND_THRESHOLD
}

export function computePullImpulse(args: {
  isCorrect: boolean
  timedOut?: boolean
  streak?: number
}): TugPullImpulse {
  if (args.timedOut || !args.isCorrect) {
    return {
      magnitude: 0,
      towardActiveTeam: true,
    }
  }

  return {
    magnitude: stepsForCorrectStreak(args.streak ?? 0),
    towardActiveTeam: true,
  }
}

export function signedPullDelta(
  teamIndex: number,
  impulse: TugPullImpulse
): number {
  const toward = pullSignForTeam(teamIndex)
  return (impulse.towardActiveTeam ? toward : -toward) * impulse.magnitude
}

export function applyTugAnswer(
  state: TugMatchState,
  teamIndex: number,
  args: { isCorrect: boolean; timedOut?: boolean }
): TugPullResult {
  if (state.phase === 'matchOver') {
    return { state, roundWinner: null, matchWinner: winnerFromRounds(state) }
  }

  const isCorrect = args.isCorrect && !args.timedOut
  const impulse = computePullImpulse({
    isCorrect,
    timedOut: args.timedOut,
    streak: streakForTeam(state, teamIndex),
  })
  return applyPull(withUpdatedStreak(state, teamIndex, isCorrect), teamIndex, impulse)
}

export function applyPull(
  state: TugMatchState,
  teamIndex: number,
  impulse: TugPullImpulse
): TugPullResult {
  if (state.phase === 'matchOver') {
    return { state, roundWinner: null, matchWinner: winnerFromRounds(state) }
  }

  const nextOffset = clampTugOffset(state.offset + signedPullDelta(teamIndex, impulse))
  let next: TugMatchState = {
    ...state,
    offset: nextOffset,
    phase: 'pulling',
  }

  const roundWinner = roundWinnerFromOffset(nextOffset)
  if (!roundWinner) {
    return { state: next, roundWinner: null, matchWinner: null }
  }

  next = awardRoundWin(next, roundWinner)
  const matchWinner = winnerFromRounds(next)
  if (matchWinner) {
    next = { ...next, phase: 'matchOver' }
  } else {
    next = { ...next, phase: 'roundOver' }
  }

  return { state: next, roundWinner, matchWinner }
}

export function awardRoundWin(
  state: TugMatchState,
  winner: TugSide
): TugMatchState {
  return {
    ...state,
    blueRoundWins:
      winner === 'blue' ? state.blueRoundWins + 1 : state.blueRoundWins,
    redRoundWins: winner === 'red' ? state.redRoundWins + 1 : state.redRoundWins,
  }
}

export function resetRound(state: TugMatchState): TugMatchState {
  if (state.phase === 'matchOver') return state
  return {
    ...state,
    offset: 0,
    displayedOffset: 0,
    roundNumber: state.roundNumber + 1,
    phase: 'playing',
  }
}

export function roundWinnerFromOffset(offset: number): TugSide | null {
  if (offset <= -TUG_ROUND_THRESHOLD) return 'blue'
  if (offset >= TUG_ROUND_THRESHOLD) return 'red'
  return null
}

export function winnerFromRounds(state: TugMatchState): TugSide | null {
  if (state.blueRoundWins >= TUG_ROUNDS_TO_WIN) return 'blue'
  if (state.redRoundWins >= TUG_ROUNDS_TO_WIN) return 'red'
  return null
}

export function isMatchOver(state: TugMatchState): boolean {
  return state.phase === 'matchOver' || winnerFromRounds(state) !== null
}

/**
 * When the question pool is exhausted, more round wins win. Equal round
 * wins fall through to the current rope advantage; a centered rope is a draw.
 */
export function resolveMatchOnQuestionsExhausted(
  state: TugMatchState
): TugMatchResolution {
  const fromRounds = winnerFromRounds(state)
  if (fromRounds) {
    return { winner: fromRounds, reason: 'rounds' }
  }
  if (state.blueRoundWins !== state.redRoundWins) {
    return {
      winner: state.blueRoundWins > state.redRoundWins ? 'blue' : 'red',
      reason: 'rounds',
    }
  }
  if (state.offset < -0.02) {
    return { winner: 'blue', reason: 'questions' }
  }
  if (state.offset > 0.02) {
    return { winner: 'red', reason: 'questions' }
  }
  return { winner: null, reason: 'draw' }
}

export function stepDisplayedOffset(
  displayedOffset: number,
  targetOffset: number,
  deltaMs: number
): number {
  const delta = targetOffset - displayedOffset
  if (Math.abs(delta) < 0.0005) return targetOffset
  const maxStep = TUG_OFFSET_LERP_PER_SEC * (deltaMs / 1000)
  if (Math.abs(delta) <= maxStep) return targetOffset
  return displayedOffset + Math.sign(delta) * maxStep
}

export function shouldEmitOffset(
  lastEmitted: number,
  displayedOffset: number
): boolean {
  return Math.abs(displayedOffset - lastEmitted) >= 0.01
}

export function isTugOfWarQuestionEligible(question: QuestionData): boolean {
  return (
    question.type === QuestionType.MULTIPLE_CHOICE &&
    question.answers.length >= TUG_MIN_ANSWERS &&
    question.answers.length <= TUG_MAX_ANSWERS &&
    question.answers.includes(question.correctAnswer)
  )
}

/**
 * EventBus does not replay missed events. The React question card can mount
 * after `QUESTION_SHOWN`, so `HUD_EVENTS.READY` re-emits the current card
 * only while that question is still waiting for an answer.
 */
export function canReplayHudQuestion<T>(state: {
  ended: boolean
  disposed: boolean
  answerLocked: boolean
  lastHudQuestion: T | null | undefined
}): state is {
  ended: false
  disposed: false
  answerLocked: false
  lastHudQuestion: T
} {
  return (
    !state.ended &&
    !state.disposed &&
    !state.answerLocked &&
    state.lastHudQuestion != null
  )
}

export function resolveTugQuestionImageUrl(
  imageUrl: string | null | undefined
): string | null {
  if (typeof imageUrl !== 'string') return null
  const trimmed = imageUrl.trim()
  if (!trimmed) return null
  if (
    trimmed === TUG_PLACEHOLDER_IMAGE ||
    trimmed.endsWith('/placeholder.webp')
  ) {
    return null
  }
  return trimmed
}

/** Fisher-Yates copy so the correct choice is not stuck in its stored slot. */
export function shuffleAnswers(
  answers: readonly string[],
  random: () => number = Math.random
): string[] {
  const next = [...answers]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const swap = next[i]
    next[i] = next[j]
    next[j] = swap
  }
  return next
}

export function createTugAnswerPayload(
  question: QuestionData,
  selectedIndex: number | null,
  teamId: string | number,
  remainingTimeMs: number,
  displayedAnswers: readonly string[] = question.answers
): AnswerSelectedPayload {
  const selectedAnswer =
    selectedIndex === null ? null : displayedAnswers[selectedIndex] ?? null

  return {
    questionId: question.id,
    selectedOptionId:
      selectedIndex === null ? null : `${question.id}-answer-${selectedIndex}`,
    isCorrect: selectedAnswer === question.correctAnswer,
    teamId,
    remainingTimeMs,
    scoreMultiplier: 1,
  }
}
