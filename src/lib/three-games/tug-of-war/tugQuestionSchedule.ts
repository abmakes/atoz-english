import type { GameLengthId } from '@/lib/game-length'
import { dealQuestionsAcrossTeams } from '@/lib/pixi-games/ninja-climb/ninjaClimbQuestionSequencer'
import type { QuestionData } from '@/types'

function shuffleQuestions(
  questions: readonly QuestionData[],
  rng: () => number
): QuestionData[] {
  const copy = [...questions]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Question list for one Tug of War match of the chosen length. */
export function buildTugQuestionSchedule(
  questions: readonly QuestionData[],
  teamCount: number,
  length: GameLengthId,
  rng: () => number = Math.random
): QuestionData[] {
  if (questions.length === 0) return []
  if (length === 'short') return [...questions]
  const coverage = dealQuestionsAcrossTeams(questions, teamCount)
  if (length === 'regular') return coverage
  return [...coverage, ...dealQuestionsAcrossTeams(shuffleQuestions(questions, rng), teamCount)]
}

/**
 * Walks a prepared Tug of War question list. Same surface as QuestionSequencer
 * so the 3D game can ask "next" without knowing the length rules.
 */
export class TugQuestionSequencer {
  private readonly schedule: QuestionData[]
  private index = 0

  constructor(
    questions: readonly QuestionData[],
    teamCount: number,
    length: GameLengthId,
    randomize: boolean,
    rng: () => number = Math.random
  ) {
    const ordered = randomize ? shuffleQuestions(questions, rng) : [...questions]
    this.schedule = buildTugQuestionSchedule(ordered, teamCount, length, rng)
  }

  public getNextQuestion(): QuestionData | null {
    if (this.isFinished()) return null
    const question = this.schedule[this.index]
    this.index += 1
    return question ?? null
  }

  public isFinished(): boolean {
    return this.index >= this.schedule.length
  }

  public getTotalQuestionsToAsk(): number {
    return this.schedule.length
  }

  public getCurrentProgressIndex(): number {
    return this.index
  }

  public getScheduledQuestionIds(): string[] {
    return this.schedule.map((question) => question.id)
  }
}
