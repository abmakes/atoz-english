import { QuestionData } from '@/types'

/**
 * Ninja Climb question schedule:
 * - Each cycle: every unique question is answered by every team (Q for team0, Q for team1, …)
 *   so turn order A,B,A,B maps cleanly when team0 goes first.
 * - Within a cycle, the same team never sees the same question twice.
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
      for (const q of order) {
        // Each team answers this question once this cycle (team0, team1, …)
        for (let t = 0; t < numTeams; t++) {
          this._schedule.push(q)
        }
      }
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
export function estimateTurnsForSummit(
  summitPoints: number,
  numTeams: number,
  pointsPerCorrect = 50
): number {
  const answersPerTeam = Math.max(1, Math.ceil(summitPoints / Math.max(1, pointsPerCorrect)))
  return answersPerTeam * Math.max(1, numTeams)
}
