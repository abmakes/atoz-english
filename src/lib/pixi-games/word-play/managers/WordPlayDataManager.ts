import { BaseQuizDataManager } from '@/lib/pixi-engine/game/BaseQuizDataManager'
import { QuestionHandlingConfig } from '@/lib/pixi-engine/config/GameConfig'
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader'
import { QuestionData } from '@/types'
import { parseWordPlayQuestion, WordPlayRound } from '../wordPlayQuestion'

/**
 * Data manager for Word Play. Reuses the shared quiz loading, media preload,
 * and sequencing from BaseQuizDataManager, and adds parsing of SORTING /
 * MATCHING questions into playable rounds. Unplayable questions (wrong type
 * or malformed correctAnswer JSON) are filtered out before sequencing.
 */
export class WordPlayDataManager extends BaseQuizDataManager {
  constructor(
    quizId: string,
    questionHandlingConfig: QuestionHandlingConfig,
    assetLoader: typeof AssetLoader
  ) {
    super(quizId, questionHandlingConfig, assetLoader, 'WordPlayDataManager')
  }

  protected override async loadQuestionData(): Promise<void> {
    await super.loadQuestionData()

    const playable = this.questionsData.filter(
      (question) => parseWordPlayQuestion(question) !== null
    )
    const dropped = this.questionsData.length - playable.length
    if (dropped > 0) {
      console.warn(
        `${this.logPrefix}: Dropped ${dropped} question(s) not playable in Word Play.`
      )
    }
    this.questionsData = playable

    if (this.questionsData.length === 0) {
      throw new Error('This quiz has no Word Play compatible questions.')
    }
  }

  /**
   * Returns the next question as a freshly shuffled Word Play round,
   * or null when the sequence is finished.
   */
  public getNextRound(): WordPlayRound | null {
    const question = this.getNextQuestion()
    if (!question) return null
    return this.parseRound(question)
  }

  /** Re-parses (and reshuffles) a specific question, e.g. for timeout feedback. */
  public parseRound(question: QuestionData): WordPlayRound | null {
    return parseWordPlayQuestion(question)
  }
}
