import { computeSummitPoints } from '@/lib/pixi-games/ninja-climb/managers/NinjaClimbRaceManager'
import { estimateTurnsForSummit } from '@/lib/pixi-games/ninja-climb/ninjaClimbQuestionSequencer'

export type GameLengthId = 'short' | 'regular' | 'long'

export const GAME_LENGTH_OPTIONS: readonly { id: GameLengthId; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'regular', label: 'Regular' },
  { id: 'long', label: 'Long' },
]

const SUMMIT_SCALE: Record<GameLengthId, number> = {
  short: 0.5,
  regular: 1,
  long: 2,
}

/** Summit height for a Ninja Climb of this length. Regular matches today's default. */
export function ninjaSummitForLength(
  questionCount: number,
  length: GameLengthId
): number {
  const regular = computeSummitPoints(Math.max(1, questionCount))
  if (length === 'regular') return regular
  if (length === 'short') return Math.max(240, Math.round(regular * SUMMIT_SCALE.short))
  return regular * SUMMIT_SCALE.long
}

/**
 * Turns actually scheduled for a climb. The sequencer always finishes a
 * coverage cycle, then adds whole extra cycles until the summit is reachable.
 */
export function ninjaTurnsForLength(
  questionCount: number,
  teamCount: number,
  length: GameLengthId
): number {
  const teams = Math.max(1, teamCount)
  const questions = Math.max(1, questionCount)
  const cycleLen = questions * teams
  const minNeeded = estimateTurnsForSummit(
    ninjaSummitForLength(questions, length),
    teams
  )
  const minTurns = Math.max(cycleLen, minNeeded)
  const cycles = Math.max(1, Math.ceil(minTurns / cycleLen))
  return cycles * cycleLen
}

/**
 * Tug of War turns. Short is one pass through the quiz. Regular gives every
 * team every question once. Long does that twice. The match can still end
 * earlier when a team hangs 3 banners.
 */
export function tugTurnsForLength(
  questionCount: number,
  teamCount: number,
  length: GameLengthId
): number {
  const questions = Math.max(1, questionCount)
  const teams = Math.max(1, teamCount)
  if (length === 'short') return questions
  const coverage = questions * teams
  return length === 'long' ? coverage * 2 : coverage
}

export function turnsForGameLength(
  gameSlug: string,
  questionCount: number,
  teamCount: number,
  length: GameLengthId
): number {
  if (gameSlug === 'tug-of-war-3d') {
    return tugTurnsForLength(questionCount, teamCount, length)
  }
  return ninjaTurnsForLength(questionCount, teamCount, length)
}

/** Classroom-facing estimate from the question timer. */
export function formatPlayTime(turns: number, secondsPerQuestion: number): string {
  const totalSeconds =
    Math.max(0, turns) * Math.max(1, secondsPerQuestion)
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 1) return 'Under a minute'
  if (minutes === 1) return 'About 1 minute'
  return `About ${minutes} minutes`
}
