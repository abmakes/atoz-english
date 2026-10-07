import type { SentencePrompt } from './content'

export type PlayMode = 'score-run' | 'survival'

export const QUESTION_TIME_MS = 20_000
export const WRONG_PENALTY_MS = 2_500
export const BASE_SENTENCE_POINTS = 100
export const MAX_SPEED_BONUS = 100
export const SCORE_RUN_LENGTH = 20

export interface SentenceBuilderResult {
  mode: PlayMode
  score: number
  sentencesBuilt: number
  questionsSeen: number
  totalAnswerMs: number
  fastestMs: number | null
  endedBy: 'finished' | 'wrong' | 'timeout'
  missedAnswer?: string
  missedChoice?: string
}

/**
 * Finished sentences score 100 plus up to 100 more for time left.
 * A timeout scores nothing.
 */
export function pointsForSentence(
  timeRemainingMs: number,
  timeLimitMs: number = QUESTION_TIME_MS
): number {
  if (timeRemainingMs <= 0 || timeLimitMs <= 0) return 0
  const clamped = Math.min(timeLimitMs, timeRemainingMs)
  const bonus = Math.round((clamped / timeLimitMs) * MAX_SPEED_BONUS)
  return BASE_SENTENCE_POINTS + bonus
}

export function applyTimePenalty(
  remainingMs: number,
  penaltyMs: number = WRONG_PENALTY_MS
): number {
  return Math.max(0, remainingMs - penaltyMs)
}

export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swap]
    copy[swap] = current
  }
  return copy
}

/** One prompt per picture, covering the grammar set, in random order. */
export function buildScoreRun(
  prompts: readonly SentencePrompt[],
  random: () => number = Math.random
): SentencePrompt[] {
  return shuffle(
    prompts.filter((item) => item.scoreRun),
    random
  )
}

/** Full bank, shuffled. The game reshuffles when the queue runs out. */
export function buildSurvivalQueue(
  prompts: readonly SentencePrompt[],
  random: () => number = Math.random
): SentencePrompt[] {
  return shuffle(prompts, random)
}

/**
 * Next survival queue should not open on the prompt that just finished,
 * so a reshuffle does not repeat the same sentence immediately.
 */
export function reshuffleSurvival(
  prompts: readonly SentencePrompt[],
  previousId: string | undefined,
  random: () => number = Math.random
): SentencePrompt[] {
  const next = buildSurvivalQueue(prompts, random)
  if (previousId && next.length > 1 && next[0]?.id === previousId) {
    const first = next.shift()
    if (first) next.push(first)
  }
  return next
}
