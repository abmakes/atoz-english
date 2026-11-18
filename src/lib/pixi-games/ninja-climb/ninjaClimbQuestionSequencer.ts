import { QuestionData } from '@/types'

/**
 * Ninja Climb question schedule. Turns alternate team 0, team 1, …
 * - Questions are dealt in order: team 0 gets Q1, team 1 gets Q2, team 0 gets Q3, …
 * - A team is never handed a question it has already seen until every team has
 *   seen every question in the cycle.
 * - Extra cycles are appended when the pool is too short for a tall summit climb.
 */
export class NinjaClimbQuestionSequencer {
  private readonly _schedule: QuestionData[] = []
  private _currentIndex = 0
  private readonly _totalQuestionsToAsk: number

  constructor(
    questions: Readonly<QuestionData[]>,
    numTeams: number,
    options?: {
      /** Minimum turns to schedule (usually sized for summit climb). */
      minTurns?: number
      randomize?: boolean
      rng?: () => number
    }
  ) {
    if (!questions || questions.length === 0) {
      throw new Error('NinjaClimbQuestionSequencer requires a non-empty question list.')
    }
    if (numTeams <= 0) {
      throw new Error('NinjaClimbQuestionSequencer requires at least one team.')
    }

    const rng = options?.rng ?? Math.random
    const randomize = options?.randomize !== false
    const unique = randomize ? this._shuffle([...questions], rng) : [...questions]
    const cycleLen = unique.length * numTeams
    const minTurns = Math.max(cycleLen, options?.minTurns ?? cycleLen)
    const cyclesNeeded = Math.max(1, Math.ceil(minTurns / cycleLen))

    for (let c = 0; c < cyclesNeeded; c++) {
      const order = c === 0 ? unique : this._shuffle([...unique], rng)
      this._schedule.push(...dealQuestionsAcrossTeams(order, numTeams))
    }

    this._totalQuestionsToAsk = this._schedule.length
  }

  public getNextQuestion(): QuestionData | null {
    if (this.isFinished()) return null
    const q = this._schedule[this._currentIndex]
    this._currentIndex++
    return q
  }

  public isFinished(): boolean {
    return this._currentIndex >= this._totalQuestionsToAsk
  }

  public getTotalQuestionsToAsk(): number {
    return this._totalQuestionsToAsk
  }

  public getCurrentProgressIndex(): number {
    return this._currentIndex
  }

  /** Test helper: peek scheduled ids without advancing. */
  public getScheduledQuestionIds(): string[] {
    return this._schedule.map((q) => q.id)
  }

  private _shuffle<T>(array: T[], rng: () => number): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }
}

/**
 * How many turns to schedule so a typical correct climb can reach the summit.
 * Uses a conservative ~50 pts / correct answer floor.
 */
/**
 * One coverage cycle. Turn `t` belongs to team `t % numTeams` and receives the
 * next question that team has not yet seen, walking forward through the list.
 */
export function dealQuestionsAcrossTeams(
  questions: readonly QuestionData[],
  numTeams: number
): QuestionData[] {
  const count = questions.length
  const seen = Array.from({ length: numTeams }, () => new Set<number>())
  const schedule: QuestionData[] = []
  let cursor = 0
  let team = 0
  const target = count * numTeams

  while (schedule.length < target) {
    let picked = -1
    for (let step = 0; step < count; step++) {
      const index = (cursor + step) % count
      if (!seen[team].has(index)) {
        picked = index
        break
      }
    }
    if (picked < 0) break
    seen[team].add(picked)
    schedule.push(questions[picked])
    cursor = (picked + 1) % count
    team = (team + 1) % numTeams
  }

  return schedule
}

export function estimateTurnsForSummit(
  summitPoints: number,
  numTeams: number,
  pointsPerCorrect = 50
): number {
  const answersPerTeam = Math.max(1, Math.ceil(summitPoints / Math.max(1, pointsPerCorrect)))
  return answersPerTeam * Math.max(1, numTeams)
}
