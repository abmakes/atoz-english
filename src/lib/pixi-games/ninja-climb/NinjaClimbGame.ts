import {
  BaseGame,
  BaseGameState,
  GameState,
} from '@/lib/pixi-engine/game/BaseGame'
import { GameConfig } from '@/lib/pixi-engine/config/GameConfig'
import { PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine'
import { TimerType } from '@/lib/pixi-engine/game/TimerManager'
import {
  GAME_STATE_EVENTS,
  GAME_EVENTS,
  TIMER_EVENTS,
  CONTROLS_EVENTS,
  TimerEventPayload,
  ControlsPlayerActionPayload,
  AnswerSelectedPayload,
} from '@/lib/pixi-engine/core/EventTypes'
import { ensureFontIsLoaded } from '@/lib/pixi-engine/utils/ensureFontIsLoaded'
import { QuestionData } from '@/types'
import { NinjaClimbDataManager } from './managers/NinjaClimbDataManager'
import { NinjaClimbLayoutManager } from './managers/NinjaClimbLayoutManager'
import { NinjaClimbMountainManager } from './managers/NinjaClimbMountainManager'
import { NinjaClimbPlayerManager } from './managers/NinjaClimbPlayerManager'
import {
  NinjaClimbUIManager,
  NinjaAnswerOption,
  QUESTION_TIMER_ID,
} from './managers/NinjaClimbUIManager'
import {
  NinjaClimbRaceManager,
  computeCorrectGain,
} from './managers/NinjaClimbRaceManager'
import {
  DEFAULT_NINJA_POWERUPS,
  NinjaPowerupsConfig,
  NinjaPowerupId,
  getEnabledNinjaPowerupIds,
} from './ninjaPowerups'

interface NinjaClimbGameState extends BaseGameState {
  currentQuestionIndex: number
  activeTeamIndex: number
  activeTeam: string
  phase: string
  scores: Record<string, number>
  hasTriggeredGameOver: boolean
  currentQuestion: QuestionData | null
}

/**
 * Turn-based two-team mountain race. Score is climb distance.
 */
export class NinjaClimbGame extends BaseGame<NinjaClimbGameState> {
  private dataManager!: NinjaClimbDataManager
  private layoutManager!: NinjaClimbLayoutManager
  private mountainManager!: NinjaClimbMountainManager
  private playerManager!: NinjaClimbPlayerManager
  private uiManager!: NinjaClimbUIManager
  private raceManager!: NinjaClimbRaceManager

  private ninjaPowerupsConfig: NinjaPowerupsConfig
  private currentAnswerOptions: NinjaAnswerOption[] = []
  private questionDurationMs = 15000
  private answeringLocked = false
  private processingTurn = false
  private boostedFeatures = false

  constructor(config: GameConfig, managers: PixiEngineManagers) {
    super(config, managers)
    const raw = config.ninjaPowerups
    this.ninjaPowerupsConfig = {
      ...DEFAULT_NINJA_POWERUPS,
      ...(raw ?? {}),
    }
    this.boostedFeatures = (config as GameConfig & { gameFeatures?: string }).gameFeatures === 'boosted'
      || false
    // GameContainer stores gameFeatures only in setup; detect boosted via progressive rules if needed
  }

  protected createInitialState(): NinjaClimbGameState {
    const firstTeamId = String(this.config.teams[0]?.id ?? 'unknown')
    return {
      currentQuestionIndex: 0,
      activeTeamIndex: 0,
      activeTeam: firstTeamId,
      phase: 'loading',
      scores: {},
      hasTriggeredGameOver: false,
      currentQuestion: null,
    }
  }

  protected async initImplementation(engineAssetsPromise: Promise<unknown>): Promise<void> {
    await this.showTransition({
      type: 'loading',
      message: 'Getting Ready...',
      autoHide: false,
    })

    const { width, height } = this.pixiApp.getScreenSize()
    this.layoutManager = new NinjaClimbLayoutManager(width, height)
    this.dataManager = new NinjaClimbDataManager(
      this.config.quizId,
      this.config.questionHandling ?? {
        distributionMode: 'perTeam',
        randomizeOrder: true,
        truncateForFairness: true,
      },
      this.assetLoader
    )

    await Promise.all([engineAssetsPromise, this.dataManager.loadData()])
    await ensureFontIsLoaded('Grandstander')

    this.dataManager.initializeSequencer(this.config.teams.length)
    const totalQuestions = this.dataManager.getTotalQuestionsToAsk()
    const questionsPerTeam = Math.max(1, Math.floor(totalQuestions / Math.max(1, this.config.teams.length)))

    const startingCharges = getEnabledNinjaPowerupIds(this.ninjaPowerupsConfig)
    this.raceManager = new NinjaClimbRaceManager({
      teamIds: this.config.teams.map((t) => String(t.id)),
      startingCharges,
      questionsPerTeam,
      shortcutsEnabled: this.ninjaPowerupsConfig.shortcuts,
    })

    // Detect boosted from rule config (progressive scoring)
    const rules = this.config.rules?.rules ?? []
    this.boostedFeatures = rules.some(
      (r) =>
        r.id === 'score-correct-answer' &&
        r.actions?.some((a) => a.params?.mode === 'progressive')
    )

    this.hideTransition()
    await this.showTransition({
      type: 'loading',
      message: 'Climb the Mountain!',
      duration: 1800,
      autoHide: true,
    })

    this.mountainManager = new NinjaClimbMountainManager(
      this.pixiApp,
      this.eventBus,
      this.layoutManager
    )
    await this.mountainManager.initialize(
      this.ninjaPowerupsConfig.shortcuts ? this.raceManager.getNodes() : []
    )
    this.view.addChildAt(this.mountainManager.getView(), 0)

    this.playerManager = new NinjaClimbPlayerManager(
      this.pixiApp,
      this.layoutManager,
      this.mountainManager
    )
    await this.playerManager.initializePlayers(
      this.config.teams.map((t) => ({ id: String(t.id), name: t.name }))
    )
    this.playerManager.attachToWorld(this.mountainManager.getWorld())

    this.uiManager = new NinjaClimbUIManager(
      this.pixiApp,
      this.eventBus,
      this.assetLoader,
      this.themeConfig.pixiConfig,
      this.layoutManager
    )
    await this.uiManager.initialize()
    this.uiManager.setAnswerHandler((optionId) => {
      void this._handleAnswerSelected(optionId)
    })
    this.uiManager.setPowerupHandler((id) => {
      void this._handlePowerupPlay(id)
    })
    this.view.addChild(this.uiManager.getView())

    this._syncPowerupButtons(true)

    const firstTeam = this.config.teams[0]
    await this.showTransition({
      type: 'turn',
      message: `${firstTeam?.name ?? 'Team 1'} Climbs!`,
      duration: 2000,
      autoHide: true,
      questionCounter: {
        current: 1,
        total: totalQuestions,
      },
    })

    this._bindGameEvents()
    this.setState({ phase: 'playing' })
    await this._showQuestion()
  }

  public start(): void {
    if (this.gameState !== GameState.INITIALIZED) return
    this.gameState = GameState.STARTED
  }

  public update(delta: number): void {
    this.transitionScreen?.update(delta)
    this.mountainManager?.update(delta)
    this.playerManager?.update(delta)

    // Keep camera on the leader
    if (this.raceManager && this.mountainManager) {
      const leaderId = this.raceManager.getLeadingTeamId()
      if (leaderId) {
        this.mountainManager.setCameraToFraction(this.raceManager.getHeightFraction(leaderId))
      }
    }
  }

  public render(): void {
    // Pixi auto-renders
  }

  protected endImplementation(): void {
    this.timerManager?.removeTimer(QUESTION_TIMER_ID)
    this.uiManager?.setAnswerButtonsEnabled(false)
    this.uiManager?.clearQuestionState()
  }

  protected destroyImplementation(): void {
    this._unbindGameEvents()
    this.uiManager?.destroy()
    this.playerManager?.destroy()
    this.mountainManager?.destroy()
    this.view.removeChildren()
  }

  private _bindGameEvents(): void {
    this.registerEventListener(TIMER_EVENTS.TIMER_COMPLETED, this._onTimerCompleted)
    this.registerEventListener(CONTROLS_EVENTS.PLAYER_ACTION, this._onPlayerAction)
  }

  private _unbindGameEvents(): void {
    this.unregisterEventListener(TIMER_EVENTS.TIMER_COMPLETED, this._onTimerCompleted)
    this.unregisterEventListener(CONTROLS_EVENTS.PLAYER_ACTION, this._onPlayerAction)
  }

  private _onTimerCompleted = (payload: TimerEventPayload): void => {
    if (payload.timerId !== QUESTION_TIMER_ID) return
    if (this.answeringLocked || this.processingTurn) return
    void this._handleTimeout()
  }

  private _onPlayerAction = (payload: ControlsPlayerActionPayload): void => {
    if (this.getState().phase !== 'playing') return
    if (this.answeringLocked || this.processingTurn) return

    const action = payload.action
    if (action === 'POWERUP_TELEPORT') void this._handlePowerupPlay('teleport')
    else if (action === 'POWERUP_ROPE') void this._handlePowerupPlay('rope')
    else if (action === 'POWERUP_SMOKE') void this._handlePowerupPlay('smoke')
    else if (action.startsWith('ANSWER_')) {
      const index = parseInt(action.replace('ANSWER_', ''), 10) - 1
      const option = this.currentAnswerOptions[index]
      if (option) void this._handleAnswerSelected(option.id)
    }
  }

  private async _showQuestion(): Promise<void> {
    if (this.getState().hasTriggeredGameOver) return

    const question = this.dataManager.getNextQuestion()
    if (!question) {
      this._triggerGameOver()
      return
    }

    this.answeringLocked = false
    this.processingTurn = false
    this.currentAnswerOptions = this._createAnswerOptions(question)
    this.setState({
      currentQuestion: question,
      currentQuestionIndex: this.dataManager.getCurrentProgressIndex(),
    })

    this.questionDurationMs = (this.config.intensityTimeLimit || 15) * 1000
    await this.uiManager.showQuestion(
      question.question,
      question.imageUrl,
      this.currentAnswerOptions,
      this.questionDurationMs
    )

    this._syncPowerupButtons(true)
    this._startQuestionTimer()
  }

  private _createAnswerOptions(question: QuestionData): NinjaAnswerOption[] {
    const answers = (question.answers as string[]) ?? []
    const options = answers.map((text, i) => ({
      id: `${question.id}-opt-${i}`,
      text,
      isCorrect: text === question.correctAnswer,
    }))
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    return options
  }

  private _startQuestionTimer(): void {
    this.timerManager.removeTimer(QUESTION_TIMER_ID)
    this.timerManager.createTimer(QUESTION_TIMER_ID, this.questionDurationMs, TimerType.COUNTDOWN)
    this.timerManager.startTimer(QUESTION_TIMER_ID)
    this.uiManager.updateTimerDisplay(this.questionDurationMs, this.questionDurationMs)
  }

  private _syncPowerupButtons(interactive: boolean): void {
    const teamId = String(this.getState().activeTeam)
    const state = this.raceManager.getTeamState(teamId)
    if (!state) return
    this.uiManager.setPowerupCharges(state.charges, interactive && this.ninjaPowerupsConfig.enabled)
  }

  private async _handlePowerupPlay(powerup: NinjaPowerupId): Promise<void> {
    if (this.answeringLocked || this.processingTurn) return
    if (!this.ninjaPowerupsConfig.enabled) return

    const teamId = String(this.getState().activeTeam)
    if (!this.raceManager.canPlayPowerup(teamId, powerup)) return

    const previousScores = new Map(
      this.config.teams.map((t) => [String(t.id), this.raceManager.getScore(String(t.id))])
    )

    const result = this.raceManager.applyPowerup(teamId, powerup)
    if (!result.ok) return

    this.playerManager.playAction(teamId, powerup, 900)

    if (powerup === 'teleport') {
      const delta = result.actorScoreDelta ?? 0
      if (delta !== 0) {
        this.scoringManager.addScore(teamId, delta)
      }
      this.playerManager.setHeightFraction(teamId, this.raceManager.getHeightFraction(teamId), true)
      const lane = this.playerManager.getLaneForTeam(teamId)
      if (lane) {
        await this.mountainManager.setBarrier(lane, this.raceManager.getHeightFraction(teamId))
      }
      this.uiManager.showPowerupFeedback(`Shadow Teleport! +${delta}`)
      await this._maybeHandleShortcut(teamId, previousScores.get(teamId) ?? 0)
    } else if (powerup === 'rope') {
      const targetId = this.raceManager.getOpponentId(teamId)
      const targetDelta = result.targetScoreDelta ?? 0
      if (targetId && targetDelta !== 0) {
        if (targetDelta < 0) this.scoringManager.subtractScore(targetId, Math.abs(targetDelta))
        else this.scoringManager.addScore(targetId, targetDelta)
        this.playerManager.setHeightFraction(
          targetId,
          this.raceManager.getHeightFraction(targetId),
          true
        )
      }
      this.uiManager.showPowerupFeedback('Kunai Rope! Opponent −50, you boost ×3')
    } else if (powerup === 'smoke') {
      this.uiManager.showPowerupFeedback('Smoke Bomb! Opponent −30% for 2 answers')
    }

    this._syncPowerupButtons(true)
    this._syncAllHeights()

    if (this.raceManager.hasReachedSummit(teamId)) {
      this._finishWithWinner(teamId)
    }
  }

  private async _handleAnswerSelected(optionId: string): Promise<void> {
    if (this.answeringLocked || this.processingTurn) return
    this.answeringLocked = true
    this.processingTurn = true
    this.uiManager.setAnswerButtonsEnabled(false)
    this._syncPowerupButtons(false)

    const question = this.getState().currentQuestion
    const selected = this.currentAnswerOptions.find((o) => o.id === optionId)
    if (!question || !selected) {
      this.answeringLocked = false
      this.processingTurn = false
      this.uiManager.setAnswerButtonsEnabled(true)
      return
    }

    const remainingMs = this.timerManager.getTimer(QUESTION_TIMER_ID)
      ? this.timerManager.getTimeRemaining(QUESTION_TIMER_ID)
      : 0
    this.timerManager.removeTimer(QUESTION_TIMER_ID)

    await this._resolveAnswer(question, selected, remainingMs)
  }

  private async _handleTimeout(): Promise<void> {
    if (this.answeringLocked || this.processingTurn) return
    this.answeringLocked = true
    this.processingTurn = true
    this.uiManager.setAnswerButtonsEnabled(false)
    this._syncPowerupButtons(false)
    this.timerManager.removeTimer(QUESTION_TIMER_ID)

    const question = this.getState().currentQuestion
    if (!question) {
      await this._advanceTurn()
      return
    }

    this.uiManager.showAnswerFeedback(false, 0)
    this.emitEvent(GAME_EVENTS.ANSWER_SELECTED, {
      questionId: question.id,
      selectedOptionId: 'timeout',
      isCorrect: false,
      teamId: this.getState().activeTeam,
      remainingTimeMs: 0,
    } satisfies AnswerSelectedPayload)

    await new Promise((r) => setTimeout(r, 1000))
    await this._advanceTurn()
  }

  private async _resolveAnswer(
    question: QuestionData,
    selected: NinjaAnswerOption,
    remainingMs: number
  ): Promise<void> {
    const teamId = String(this.getState().activeTeam)
    const isCorrect = !!selected.isCorrect

    this.emitEvent(GAME_EVENTS.ANSWER_SELECTED, {
      questionId: question.id,
      selectedOptionId: selected.id,
      isCorrect,
      teamId,
      remainingTimeMs: remainingMs,
    } satisfies AnswerSelectedPayload)

    let applied = 0
    if (isCorrect) {
      const previousScore = this.raceManager.getScore(teamId)
      const base = computeCorrectGain({
        boosted: this.boostedFeatures,
        remainingTimeMs: remainingMs,
        questionDurationMs: this.questionDurationMs,
      })
      const gain = this.raceManager.applyGain(teamId, base)
      applied = gain.applied
      if (applied > 0) {
        this.scoringManager.addScore(teamId, applied)
      }

      this.playerManager.setHeightFraction(teamId, this.raceManager.getHeightFraction(teamId), true)

      if (gain.barrierShattered) {
        const opponentId = this.raceManager.getOpponentId(teamId)
        const lane = opponentId ? this.playerManager.getLaneForTeam(opponentId) : null
        if (lane) this.mountainManager.shatterBarrier(lane)
      }

      this.uiManager.showAnswerFeedback(true, applied)
      await new Promise((r) => setTimeout(r, 900))
      await this._maybeHandleShortcut(teamId, previousScore)
    } else {
      this.uiManager.showAnswerFeedback(false, 0)
      await new Promise((r) => setTimeout(r, 1000))
    }

    if (this.raceManager.hasReachedSummit(teamId)) {
      this._finishWithWinner(teamId)
      return
    }

    await this._advanceTurn()
  }

  private async _maybeHandleShortcut(teamId: string, previousScore: number): Promise<void> {
    const newScore = this.raceManager.getScore(teamId)
    const node = this.raceManager.findCrossedShortcut(teamId, previousScore, newScore)
    if (!node) return

    const choice = await this.uiManager.promptShortcut({
      kind: node.kind,
      ladderChance: node.ladderChance,
      ladderDelta: node.ladderDelta,
      snakeDelta: node.snakeDelta,
    })

    if (choice === 'skip') {
      this.raceManager.skipShortcut(teamId, node.id)
      this.mountainManager.dimGate(node.id)
      return
    }

    const before = this.raceManager.getScore(teamId)
    const roll = this.raceManager.rollShortcut(teamId, node)
    const raceScore = this.raceManager.getScore(teamId)
    const scoringBefore = this.scoringManager.getScore(teamId)
    const syncDelta = raceScore - scoringBefore
    if (syncDelta > 0) this.scoringManager.addScore(teamId, syncDelta)
    else if (syncDelta < 0) this.scoringManager.subtractScore(teamId, Math.abs(syncDelta))

    this.playerManager.setHeightFraction(teamId, this.raceManager.getHeightFraction(teamId), true)
    this.mountainManager.dimGate(node.id)

    const msg =
      roll.outcome === 'ladder'
        ? `Ladder! +${roll.delta}`
        : `Snake! ${roll.delta}`
    this.uiManager.showPowerupFeedback(msg)
    await new Promise((r) => setTimeout(r, 1100))
    void before
  }

  private _syncAllHeights(): void {
    for (const team of this.config.teams) {
      const id = String(team.id)
      this.playerManager.setHeightFraction(
        id,
        this.raceManager.getHeightFraction(id),
        true
      )
    }
  }

  private async _advanceTurn(): Promise<void> {
    if (this.getState().hasTriggeredGameOver) return

    if (this.dataManager.isSequenceFinished()) {
      this._triggerGameOver()
      return
    }

    const currentTeamIndex = this.getState().activeTeamIndex
    const nextTeamIndex = (currentTeamIndex + 1) % this.config.teams.length
    const nextTeam = this.config.teams[nextTeamIndex]
    const nextTeamId = String(nextTeam?.id ?? 'unknown')
    const nextTeamName = nextTeam?.name || `Team ${nextTeamIndex + 1}`

    this.setState({
      activeTeamIndex: nextTeamIndex,
      activeTeam: nextTeamId,
    })

    const nextQuestionIndex = this.dataManager.getCurrentProgressIndex()
    const totalQuestions = this.dataManager.getTotalQuestionsToAsk()

    await this.showTransition({
      type: 'turn',
      message: `${nextTeamName} Climbs!`,
      duration: 2200,
      autoHide: true,
      questionCounter: {
        current: Math.min(nextQuestionIndex + 1, totalQuestions),
        total: totalQuestions,
      },
    })

    if (this.getState().hasTriggeredGameOver) return
    await this._showQuestion()
  }

  private _finishWithWinner(teamId: string): void {
    this.playerManager.celebrate(teamId)
    this.playerManager.setHeightFraction(teamId, 1, true)
    this.mountainManager.setCameraToFraction(1)
    this._triggerGameOver()
  }

  private _triggerGameOver(): void {
    if (this.getState().hasTriggeredGameOver) return
    this.setState({ hasTriggeredGameOver: true, phase: 'gameOver' })

    const summitTeam = this.raceManager.anyTeamAtSummit()
    if (summitTeam) {
      this.playerManager.celebrate(summitTeam)
    } else {
      const leader = this.raceManager.getLeadingTeamId()
      if (leader) this.playerManager.celebrate(leader)
    }

    this.emitEvent(GAME_STATE_EVENTS.GAME_ENDED)
    this.end()
    this.uiManager?.clearQuestionState()
  }
}
