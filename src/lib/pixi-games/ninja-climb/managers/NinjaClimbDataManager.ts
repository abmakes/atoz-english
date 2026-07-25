import { QuestionHandlingConfig } from '@/lib/pixi-engine/config/GameConfig'
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader'
import { BaseQuizDataManager } from '@/lib/pixi-engine/game/BaseQuizDataManager'

export class NinjaClimbDataManager extends BaseQuizDataManager {
  constructor(
    quizId: string,
    questionHandlingConfig: QuestionHandlingConfig,
    assetLoader: typeof AssetLoader
  ) {
    super(quizId, questionHandlingConfig, assetLoader, 'NinjaClimbDataManager')
  }
}
