import * as PIXI from 'pixi.js'
import { QuestionData } from '@/types'
import { QuestionSequencer } from '@/lib/pixi-engine/game/QuestionSequencer'
import { QuestionHandlingConfig } from '@/lib/pixi-engine/config/GameConfig'
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader'

/**
 * Shared quiz data loading, media preload, and question sequencing
 * for quiz-based Pixi games (Multiple Choice, Splash Dash, etc.).
 */
export class BaseQuizDataManager {
  protected questionsData: QuestionData[] = []
  protected questionSequencer?: QuestionSequencer
  protected preloadedMediaUrls: string[] = []
  protected quizId: string
  protected questionHandlingConfig: QuestionHandlingConfig
  protected assetLoader: typeof AssetLoader
  protected readonly logPrefix: string

  constructor(
    quizId: string,
    questionHandlingConfig: QuestionHandlingConfig,
    assetLoader: typeof AssetLoader,
    logPrefix = 'QuizDataManager'
  ) {
    if (!quizId) {
      throw new Error('Quiz ID is required for DataManager.')
    }
    if (!questionHandlingConfig) {
      throw new Error('Question Handling Config is required for DataManager.')
    }
    this.quizId = quizId
    this.questionHandlingConfig = questionHandlingConfig
    this.assetLoader = assetLoader
    this.logPrefix = logPrefix
  }

  public async loadData(): Promise<void> {
    try {
      await this.loadQuestionData()
      await this.preloadQuestionMedia(this.questionsData)
      if (this.questionsData.length === 0) {
        console.warn(`${this.logPrefix}: No questions were loaded.`)
      }
    } catch (error) {
      console.error(`${this.logPrefix}: Failed to load critical game data.`, error)
      throw error
    }
  }

  public initializeSequencer(numTeams: number): void {
    if (this.questionsData.length === 0) {
      console.error(`${this.logPrefix}: Cannot initialize sequencer, no questions loaded.`)
      return
    }
    if (numTeams <= 0) {
      console.error(`${this.logPrefix}: Cannot initialize sequencer, invalid number of teams:`, numTeams)
      return
    }

    this.questionSequencer = new QuestionSequencer(
      this.questionsData,
      numTeams,
      this.questionHandlingConfig
    )
    console.log(`${this.logPrefix}: Question Sequencer initialized.`)
  }

  public getNextQuestion(): QuestionData | null {
    if (!this.questionSequencer) {
      console.error(`${this.logPrefix}: Sequencer not initialized when calling getNextQuestion.`)
      return null
    }
    return this.questionSequencer.getNextQuestion()
  }

  public isSequenceFinished(): boolean {
    return this.questionSequencer?.isFinished() ?? true
  }

  public getCurrentProgressIndex(): number {
    return this.questionSequencer?.getCurrentProgressIndex() ?? 0
  }

  public getTotalQuestionsToAsk(): number {
    return this.questionSequencer?.getTotalQuestionsToAsk() ?? 0
  }

  public getQuestionById(id: string): QuestionData | undefined {
    return this.questionsData.find((q) => q.id === id)
  }

  public getAllQuestions(): readonly QuestionData[] {
    return Object.freeze([...this.questionsData])
  }

  public getPreloadedMediaUrls(): readonly string[] {
    return Object.freeze([...this.preloadedMediaUrls])
  }

  public getTotalLoadedQuestions(): number {
    return this.questionsData.length
  }

  protected async loadQuestionData(): Promise<void> {
    const maxRetries = 3
    const retryDelay = 1000

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const apiUrl = `/api/quizzes/${this.quizId}`
        console.log(`${this.logPrefix}: Fetching questions from ${apiUrl} (attempt ${attempt}/${maxRetries})`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          if (response.status === 404) {
            throw new Error(`Quiz not found for ID: ${this.quizId}`)
          }

          if (response.status === 500 && errorText.includes('connection pool')) {
            console.warn(`${this.logPrefix}: Database connection pool timeout (attempt ${attempt}/${maxRetries})`)
            if (attempt < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, retryDelay))
              continue
            }
          }

          throw new Error(
            `API Error fetching quiz: ${response.status} ${response.statusText} - ${errorText}`
          )
        }

        const quizData = await response.json()
        const potentialQuestions = quizData?.data?.questions ?? quizData?.questions

        if (!potentialQuestions || !Array.isArray(potentialQuestions)) {
          throw new Error('Invalid quiz data format received.')
        }

        this.questionsData = potentialQuestions as QuestionData[]
        console.log(`${this.logPrefix}: Loaded ${this.questionsData.length} questions.`)
        return
      } catch (error) {
        console.error(
          `${this.logPrefix}: Failed during loadQuestionData (attempt ${attempt}/${maxRetries}):`,
          error
        )

        if (attempt === maxRetries || !this.isRetryableError(error)) {
          this.questionsData = []
          throw error
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      }
    }
  }

  protected isRetryableError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
      return true
    }
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      if (error.message.includes('connection pool')) return true
      if (error.message.includes('fetch')) return true
    }
    return false
  }

  protected async preloadQuestionMedia(questions: QuestionData[]): Promise<void> {
    const imageUrls = questions
      .map((q) => q.imageUrl)
      .filter((url): url is string => typeof url === 'string' && url.length > 0)
    const uniqueImageUrls = Array.from(new Set(imageUrls))

    this.preloadedMediaUrls = uniqueImageUrls

    if (uniqueImageUrls.length === 0) {
      console.log(`${this.logPrefix}: No unique media URLs to preload.`)
      return
    }

    console.log(`${this.logPrefix}: Preloading ${uniqueImageUrls.length} unique media assets...`)

    try {
      const loadPromises = uniqueImageUrls.map(async (url) => {
        try {
          await PIXI.Assets.load(url)
        } catch (error) {
          console.warn(`${this.logPrefix}: Failed to load image ${url}:`, error)
        }
      })

      await Promise.allSettled(loadPromises)
      console.log(`${this.logPrefix}: Question media preloading completed.`)
    } catch (error) {
      console.error(`${this.logPrefix}: Error during question media preload:`, error)
      uniqueImageUrls.forEach((url) =>
        PIXI.Assets.unload(url).catch((unloadErr) =>
          console.warn(`${this.logPrefix}: Failed to unload ${url}`, unloadErr)
        )
      )
    }
  }
}
