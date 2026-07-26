import { QuestionHandlingConfig } from '@/lib/pixi-engine/config/GameConfig'
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader'
import { BaseQuizDataManager } from '@/lib/pixi-engine/game/BaseQuizDataManager'
import { QuestionData } from '@/types'
import {
  NinjaClimbQuestionSequencer,
  estimateTurnsForSummit,
} from '../ninjaClimbQuestionSequencer'

/**
 * Ninja Climb data manager — uses coverage-cycle sequencing so both teams
 * answer each question before any (team, question) pair repeats.
 */
export class NinjaClimbDataManager extends BaseQuizDataManager {
  private ninjaSequencer?: NinjaClimbQuestionSequencer
  private summitPointsForSchedule = 560

  constructor(
    quizId: string,
    questionHandlingConfig: QuestionHandlingConfig,
    assetLoader: typeof AssetLoader
  ) {
    super(quizId, questionHandlingConfig, assetLoader, 'NinjaClimbDataManager')
  }

  public setSummitPointsForSchedule(summitPoints: number): void {
    this.summitPointsForSchedule = Math.max(1, summitPoints)
  }

  public override initializeSequencer(numTeams: number): void {
    if (this.questionsData.length === 0) {
      console.error(`${this.logPrefix}: Cannot initialize sequencer, no questions loaded.`)
      return
    }
    if (numTeams <= 0) {
      console.error(
        `${this.logPrefix}: Cannot initialize sequencer, invalid number of teams:`,
        numTeams
      )
      return
    }

    const minTurns = estimateTurnsForSummit(this.summitPointsForSchedule, numTeams)
    this.ninjaSequencer = new NinjaClimbQuestionSequencer(this.questionsData, numTeams, {
      minTurns,
      randomize: this.questionHandlingConfig.randomizeOrder !== false,
    })
    // Keep base sequencer unset — we override accessors below.
    console.log(
      `${this.logPrefix}: Ninja climb sequencer ready — ${this.ninjaSequencer.getTotalQuestionsToAsk()} turns (min ${minTurns}) for summit ${this.summitPointsForSchedule}.`
    )
  }

  public override getNextQuestion(): QuestionData | null {
    if (!this.ninjaSequencer) {
      console.error(`${this.logPrefix}: Sequencer not initialized when calling getNextQuestion.`)
      return null
    }
    return this.ninjaSequencer.getNextQuestion()
  }

  public override isSequenceFinished(): boolean {
    return this.ninjaSequencer?.isFinished() ?? true
  }

  public override getCurrentProgressIndex(): number {
    return this.ninjaSequencer?.getCurrentProgressIndex() ?? 0
  }

  public override getTotalQuestionsToAsk(): number {
    return this.ninjaSequencer?.getTotalQuestionsToAsk() ?? 0
  }
}
