import { QuestionData } from '@/types'
import { QuestionHandlingConfig } from '@/lib/pixi-engine/config/GameConfig'
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader'
import { BaseQuizDataManager } from '@/lib/pixi-engine/game/BaseQuizDataManager'

/**
 * Splash Dash quiz data manager — shares fetch/retry/preload/sequencing
 * with Multiple Choice via BaseQuizDataManager + engine QuestionSequencer.
 */
export class SplashDashDataManager extends BaseQuizDataManager {
  constructor(
    quizId: string,
    questionHandling: QuestionHandlingConfig,
    assetLoader: typeof AssetLoader
  ) {
    super(quizId, questionHandling, assetLoader, 'SplashDashDataManager')
  }

  public getQuestionByIndex(index: number): QuestionData | null {
    return this.questionsData[index] || null
  }
}
