import type { AnswerSelectedPayload } from '@/lib/pixi-engine/core/EventTypes'
import type { QuestionData } from '@/types'
import { QuestionType } from '@/types/question_types'

export const TUG_QUESTION_TIMER_ID = 'tugOfWarQuestionTimer'
export const TUG_ROUNDS_TO_WIN = 2
export const TUG_BEST_OF = 3
export const TUG_BASE_PULL = 0.18
export const TUG_SPEED_BONUS = 0.12
export const TUG_WRONG_PULL_FACTOR = 0.5
export const TUG_TIMEOUT_PULL_FACTOR = 0.25
export const TUG_ROUND_THRESHOLD = 1
export const TUG_OFFSET_LERP_PER_SEC = 0.85
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
  /** Target rope offset in [-1, 1]. Negative is toward blue (left). */
  offset: number
  displayedOffset: number
  blueRoundWins: number
  redRoundWins: number
  roundNumber: number
  phase: TugMatchPhase
}

export interface TugPullImpulse {
  magnitude: number
  /** When true, pull toward the active team; otherwise toward the opponent. */
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

export function computePullImpulse(args: {
  isCorrect: boolean
  timedOut: boolean
  remainingTimeMs: number
  durationMs: number
}): TugPullImpulse {
  if (args.timedOut) {
    return {
      magnitude: TUG_BASE_PULL * TUG_TIMEOUT_PULL_FACTOR,
      towardActiveTeam: false,
    }
  }

  if (!args.isCorrect) {
    return {
      magnitude: TUG_BASE_PULL * TUG_WRONG_PULL_FACTOR,
      towardActiveTeam: false,
    }
  }

  const durationMs = Math.max(0, args.durationMs)
  const speedRatio =
    durationMs === 0
      ? 0
      : Math.max(0, Math.min(1, args.remainingTimeMs / durationMs))

  return {
    magnitude: TUG_BASE_PULL + TUG_SPEED_BONUS * speedRatio,
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

export function createTugAnswerPayload(
  question: QuestionData,
  selectedIndex: number | null,
  teamId: string | number,
  remainingTimeMs: number
): AnswerSelectedPayload {
  const selectedAnswer =
    selectedIndex === null ? null : question.answers[selectedIndex] ?? null

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
