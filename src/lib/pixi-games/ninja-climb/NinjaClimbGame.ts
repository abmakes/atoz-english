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
  computeSummitPoints,
} from './managers/NinjaClimbRaceManager'
import {
  DEFAULT_NINJA_POWERUPS,
  NinjaPowerupsConfig,
  NinjaPowerupId,
  NINJA_POWERUP_DEFINITIONS,
  getEnabledNinjaPowerupIds,
} from './ninjaPowerups'
import { RopeProjectile } from '@/lib/pixi-engine/fx/RopeProjectile'
import * as PIXI from 'pixi.js'

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
 * Turn-based two-team mountain race. Score maps to shared switchback waypoints.
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
  /** Teams still owed a reply turn after someone first reaches the summit. */
  private catchUpTurnsRemaining = 0
  private ropeProjectile: RopeProjectile | null = null
  private ropeVfxBusy = false

  constructor(config: GameConfig, managers: PixiEngineManagers) {
    super(config, managers)
    const raw = config.ninjaPowerups
    this.ninjaPowerupsConfig = {
      ...DEFAULT_NINJA_POWERUPS,
      ...(raw ?? {}),
    }
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

    // Summit from unique pool size (not expanded schedule length). Start with no charges.
    const uniqueQuestions = Math.max(1, this.dataManager.getTotalLoadedQuestions())
    const questionsPerTeam = uniqueQuestions
    const previewSummit = computeSummitPoints(questionsPerTeam)
    this.dataManager.setSummitPointsForSchedule(previewSummit)
    this.dataManager.initializeSequencer(this.config.teams.length)

    this.raceManager = new NinjaClimbRaceManager({
      teamIds: this.config.teams.map((t) => String(t.id)),
      startingCharges: [],
      questionsPerTeam,
      shortcutsEnabled: this.ninjaPowerupsConfig.shortcuts,
    })

    // Each team starts with one random enabled power-up.
    const powerPool = getEnabledNinjaPowerupIds(this.ninjaPowerupsConfig)
    for (const team of this.config.teams) {
      this.raceManager.grantRandomCharge(String(team.id), powerPool)
    }

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
      this.raceManager.getTotalSteps(),
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

    await this._initRopeProjectile()

    this.uiManager = new NinjaClimbUIManager(
      this.pixiApp,
      this.eventBus,
      this.assetLoader,
      this.themeConfig.pixiConfig,
      this.layoutManager
    )
    await this.uiManager.initialize(
      this.config.teams.map((t) => ({ id: String(t.id), name: t.name }))
    )
    this.uiManager.setAnswerHandler((optionId) => {
      void this._handleAnswerSelected(optionId)
    })
    this.uiManager.setPowerupHandler((teamId, id) => {
      void this._handlePowerupPlay(teamId, id)
    })
    this.view.addChild(this.uiManager.getView())

    this.playerManager.setActiveTeam(String(this.getState().activeTeam))
    this._syncPowerTrays(true)
    this._syncCamera(true)
    this._pulseNextLedges()

    const firstTeam = this.config.teams[0]
    const totalQuestions = this.dataManager.getTotalQuestionsToAsk()
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
    this.ropeProjectile?.update(delta)
    this.uiManager?.update(delta)
    this._syncCamera(false)
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
    this.ropeProjectile?.destroy()
    this.ropeProjectile = null
    this.uiManager?.destroy()
    this.playerManager?.destroy()
    this.mountainManager?.destroy()
    this.view.removeChildren()
  }

  private async _initRopeProjectile(): Promise<void> {
    let tipTexture: PIXI.Texture | null = null
    let bodyTexture: PIXI.Texture | null = null
    try {
      tipTexture = await PIXI.Assets.load('/images/shared/kunai_tip.png')
    } catch (e) {
      console.warn('NinjaClimbGame: kunai tip missing', e)
    }
    try {
      bodyTexture = await PIXI.Assets.load('/images/shared/rope_segment.png')
    } catch (e) {
      console.warn('NinjaClimbGame: rope segment missing', e)
    }

    this.ropeProjectile = new RopeProjectile({
      parent: this.mountainManager.getWorld(),
      tipTexture,
      bodyTexture,
      bodyThickness: 7,
      tipDisplaySize: 32,
      extendDurationMs: 300,
      holdDurationMs: 100,
      retractDurationMs: 450,
      zIndex: 800,
    })
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
    // Guard keyup / release — only act on pressed (true)
    if (!payload.value) return
    if (this.getState().phase !== 'playing') return
    if (this.answeringLocked || this.processingTurn) return

    const action = payload.action
    if (action === 'POWERUP_TELEPORT') {
      void this._handlePowerupPlay(String(this.getState().activeTeam), 'teleport')
    } else if (action === 'POWERUP_ROPE') {
      void this._handlePowerupPlay(String(this.getState().activeTeam), 'rope')
    } else if (action === 'POWERUP_SMOKE') {
      void this._handlePowerupPlay(String(this.getState().activeTeam), 'smoke')
    } else if (action.startsWith('ANSWER_')) {
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

    this.playerManager.setActiveTeam(String(this.getState().activeTeam))
    this.questionDurationMs = (this.config.intensityTimeLimit || 15) * 1000

    const totalQuestions = this.dataManager.getTotalQuestionsToAsk()
    const current = Math.min(
      this.dataManager.getCurrentProgressIndex() + 1,
      totalQuestions
    )

    await this.uiManager.showQuestion(
      question.question,
      question.imageUrl,
      this.currentAnswerOptions,
      this.questionDurationMs,
      { current, total: totalQuestions }
    )

    this._syncPowerTrays(true)
    this._pulseNextLedges()
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

  private _syncPowerTrays(interactive: boolean): void {
    const activeId = String(this.getState().activeTeam)
    this.uiManager.setTeamTrays(
      this.config.teams.map((t) => {
        const id = String(t.id)
        const state = this.raceManager.getTeamState(id)
        return {
          teamId: id,
          teamName: t.name,
          charges: state?.charges ?? { teleport: 0, rope: 0, smoke: 0 },
          interactive:
            interactive &&
            this.ninjaPowerupsConfig.enabled &&
            id === activeId,
        }
      })
    )
  }

  private async _handlePowerupPlay(
    teamId: string,
    powerup: NinjaPowerupId
  ): Promise<void> {
    if (this.answeringLocked || this.processingTurn || this.ropeVfxBusy) return
    if (!this.ninjaPowerupsConfig.enabled) return
    if (teamId !== String(this.getState().activeTeam)) return
    if (!this.raceManager.canPlayPowerup(teamId, powerup)) return

    if (powerup === 'rope') {
      await this._playRopePowerup(teamId)
      return
    }

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
      await this._syncTeamSteps(true)
      await this.mountainManager.setBarrierAtStep(this.raceManager.getBarrierStep())
      this.uiManager.showPowerupFeedback(`Shadow Teleport! +${delta}`)
      await this._maybeHandleShortcut(teamId, previousScores.get(teamId) ?? 0)
    } else if (powerup === 'smoke') {
      this.uiManager.showPowerupFeedback('Smoke Bomb! Opponent −30% for 2 answers')
    }

    this._syncPowerTrays(true)
    this._pulseNextLedges()

    if (this.raceManager.hasReachedSummit(teamId)) {
      await this._onSummitReached(teamId)
    }
  }

  /**
   * Kunai rope: tip extends to opponent, grabs, then retracts while they hop back.
   * Score apply happens on grab (reach B).
   */
  private async _playRopePowerup(teamId: string): Promise<void> {
    const targetId = this.raceManager.getOpponentId(teamId)
    if (!targetId || !this.ropeProjectile) {
      const result = this.raceManager.applyPowerup(teamId, 'rope')
      if (!result.ok) return
      const targetDelta = result.targetScoreDelta ?? 0
      if (targetId && targetDelta < 0) {
        this.scoringManager.subtractScore(targetId, Math.abs(targetDelta))
      } else if (targetId && targetDelta > 0) {
        this.scoringManager.addScore(targetId, targetDelta)
      }
      await this._syncTeamSteps(true)
      this.uiManager.showPowerupFeedback('Kunai Rope! Opponent −50, you boost ×3')
      this._syncPowerTrays(true)
      return
    }

    this.ropeVfxBusy = true
    this.playerManager.playAction(teamId, 'rope', 1400)

    let hopPromise: Promise<void> = Promise.resolve()
    let applied = false

    try {
      await this.ropeProjectile.play({
        getPointA: () =>
          this.playerManager.getAttachPoint(teamId) ?? { x: 0, y: 0 },
        getPointB: () =>
          this.playerManager.getAttachPoint(targetId) ?? { x: 0, y: 0 },
        pullTargetDuringRetract: true,
        onReachB: () => {
          if (applied) return
          applied = true
          const result = this.raceManager.applyPowerup(teamId, 'rope')
          if (!result.ok) return
          const targetDelta = result.targetScoreDelta ?? 0
          if (targetDelta < 0) {
            this.scoringManager.subtractScore(targetId, Math.abs(targetDelta))
          } else if (targetDelta > 0) {
            this.scoringManager.addScore(targetId, targetDelta)
          }
          hopPromise = this._syncTeamSteps(true)
          this._syncPowerTrays(true)
          this._pulseNextLedges()
        },
      })
      await hopPromise
      this.uiManager.showPowerupFeedback('Kunai Rope! Opponent −50, you boost ×3')
    } finally {
      this.ropeVfxBusy = false
    }
  }

  private async _handleAnswerSelected(optionId: string): Promise<void> {
    if (this.answeringLocked || this.processingTurn) return
    this.answeringLocked = true
    this.processingTurn = true
    this.uiManager.setAnswerButtonsEnabled(false)
    this._syncPowerTrays(false)

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
    this._syncPowerTrays(false)
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
    await this._continueAfterTurn()
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

      await this._syncTeamSteps(true)

      if (gain.barrierShattered) {
        this.mountainManager.shatterBarrier()
      }
      await this.mountainManager.setBarrierAtStep(this.raceManager.getBarrierStep())

      this.uiManager.showAnswerFeedback(true, applied)
      await new Promise((r) => setTimeout(r, 900))

      const granted = this.raceManager.registerCorrectAnswer(
        teamId,
        getEnabledNinjaPowerupIds(this.ninjaPowerupsConfig)
      )
      if (granted) {
        const label =
          NINJA_POWERUP_DEFINITIONS.find((d) => d.id === granted)?.label ?? granted
        this.uiManager.showPowerupFeedback(`Power gained: ${label}!`)
        this._syncPowerTrays(true)
        await new Promise((r) => setTimeout(r, 900))
      }

      await this._maybeHandleShortcut(teamId, previousScore)
    } else {
      this.uiManager.showAnswerFeedback(false, 0)
      await new Promise((r) => setTimeout(r, 1000))
    }

    if (this.raceManager.hasReachedSummit(teamId)) {
      await this._onSummitReached(teamId)
      return
    }

    await this._continueAfterTurn()
  }

  /** After a non-summit turn: finish catch-up if owed, else rotate. */
  private async _continueAfterTurn(): Promise<void> {
    if (this.catchUpTurnsRemaining > 0) {
      this.catchUpTurnsRemaining -= 1
      if (this.catchUpTurnsRemaining === 0) {
        this._finishRaceByScore()
        return
      }
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
    })

    if (choice === 'skip') {
      this.raceManager.skipShortcut(teamId, node.id)
      this.mountainManager.dimGate(node.id)
      return
    }

    const roll = this.raceManager.rollShortcut(teamId, node)
    const raceScore = this.raceManager.getScore(teamId)
    const scoringBefore = this.scoringManager.getScore(teamId)
    const syncDelta = raceScore - scoringBefore
    if (syncDelta > 0) this.scoringManager.addScore(teamId, syncDelta)
    else if (syncDelta < 0) this.scoringManager.subtractScore(teamId, Math.abs(syncDelta))

    await this._syncTeamSteps(true)
    await this.mountainManager.setBarrierAtStep(this.raceManager.getBarrierStep())
    this.mountainManager.dimGate(node.id)

    const msg =
      roll.outcome === 'ladder'
        ? `Forward! +${roll.delta}`
        : `Back! ${roll.delta}`
    this.uiManager.showPowerupFeedback(msg)
    await new Promise((r) => setTimeout(r, 1100))
  }

  private async _syncTeamSteps(animate: boolean): Promise<void> {
    const hops: Promise<void>[] = []
    for (const team of this.config.teams) {
      const id = String(team.id)
      const step = this.raceManager.getStepIndex(id)
      hops.push(this.playerManager.setStepIndex(id, step, animate))
    }
    await Promise.all(hops)
    this.playerManager.recomputeOccupancy()
    this._pulseNextLedges()
  }

  private _pulseNextLedges(): void {
    const maxStep = this.raceManager.getTotalSteps() - 1
    let next: number | null = null
    for (const team of this.config.teams) {
      const step = this.raceManager.getStepIndex(String(team.id))
      const candidate = Math.min(step + 1, maxStep)
      if (next == null || candidate < next) next = candidate
    }
    this.mountainManager.pulseNextStep(next)
  }

  private _syncCamera(immediate: boolean): void {
    if (!this.playerManager || !this.mountainManager) return
    const positions = this.playerManager.getWorldPositions()
    this.mountainManager.setCameraTargets(
      positions.map((p) => ({ x: p.x, y: p.y })),
      immediate
    )
  }

  private async _advanceTurn(): Promise<void> {
    if (this.getState().hasTriggeredGameOver) return

    if (this.dataManager.isSequenceFinished()) {
      this._finishRaceByScore()
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

    this.playerManager.setActiveTeam(nextTeamId)

    const nextQuestionIndex = this.dataManager.getCurrentProgressIndex()
    const totalQuestions = this.dataManager.getTotalQuestionsToAsk()

    await this.showTransition({
      type: 'turn',
      message:
        this.catchUpTurnsRemaining > 0
          ? `${nextTeamName} — last climb!`
          : `${nextTeamName} Climbs!`,
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

  /**
   * If the first team of a round hits the summit, later teams still get one
   * answer. After that catch-up (or if the last team summits), highest score wins.
   */
  private async _onSummitReached(teamId: string): Promise<void> {
    if (this.getState().hasTriggeredGameOver) return

    // Already in catch-up: this reply finishes the race.
    if (this.catchUpTurnsRemaining > 0) {
      this.catchUpTurnsRemaining = 0
      this._finishRaceByScore()
      return
    }

    const activeIndex = this.getState().activeTeamIndex
    const teamsAfter = this.config.teams.length - 1 - activeIndex
    if (teamsAfter > 0) {
      this.catchUpTurnsRemaining = teamsAfter
      this.uiManager.showPowerupFeedback('Summit! Opponent gets one more climb')
      await new Promise((r) => setTimeout(r, 1200))
      await this._advanceTurn()
      return
    }

    this._finishRaceByScore(teamId)
  }

  private _finishRaceByScore(preferredId?: string): void {
    const leader = this.raceManager.getLeadingTeamId() ?? preferredId ?? null
    if (leader) {
      this.playerManager.celebrate(leader)
      const summitStep = this.raceManager.getTotalSteps() - 1
      void this.playerManager.setStepIndex(leader, summitStep, true)
    }
    this._syncCamera(false)
    this._triggerGameOver()
  }

  private _triggerGameOver(): void {
    if (this.getState().hasTriggeredGameOver) return
    this.setState({ hasTriggeredGameOver: true, phase: 'gameOver' })

    const leader = this.raceManager.getLeadingTeamId()
    if (leader) this.playerManager.celebrate(leader)

    this.emitEvent(GAME_STATE_EVENTS.GAME_ENDED)
    this.end()
    this.uiManager?.clearQuestionState()
  }
}
