import * as THREE from 'three'
import type { QuestionData } from '@/types'
import {
  GAME_EVENTS,
  GAME_STATE_EVENTS,
  HUD_EVENTS,
  TIMER_EVENTS,
  TUG_EVENTS,
  type HudAnswerSelectedPayload,
  type HudQuestionShownPayload,
  type TimerEventPayload,
} from '@/lib/pixi-engine/core/EventTypes'
import { GamePhase } from '@/lib/pixi-engine/core/GameStateManager'
import { TimerType } from '@/lib/pixi-engine/game/TimerManager'
import { QuestionSequencer } from '@/lib/pixi-engine/game/QuestionSequencer'
import { DEFAULT_QUESTION_HANDLING_CONFIG } from '@/lib/pixi-engine/config/GameConfig'
import type {
  ThreeGame,
  ThreeGameContext,
} from '@/lib/three-engine/game/ThreeGame'
import { disposeObject3D } from '@/lib/three-engine/ThreeWorld'
import { NinjaActor, type TugNinjaTextures } from './NinjaActor'
import { TugRope } from './TugRope'
import { TugDust, TugPetals } from './tugEffects'
import { TUG_ART } from './tugArt'
import { createCutoutMaterial } from './tugMaterials'
import {
  createChalkTexture,
  createDustTexture,
  createFlagTexture,
  createPetalTexture,
  createShadowTexture,
} from './tugCanvasTextures'
import {
  TUG_CAMERA_DISTANCE,
  TUG_FEET_Y,
  TUG_ROPE_TRAVEL,
  TUG_STAGE_HEIGHT,
  TUG_STAGE_WIDTH,
  computeTugStageView,
  tugNinjaPx,
  tugSlotX,
  type TugStageView,
} from './tugStageLayout'
import {
  TUG_NINJAS_PER_TEAM,
  TUG_QUESTION_TIMER_ID,
  applyPull,
  canReplayHudQuestion,
  computePullImpulse,
  createTugAnswerPayload,
  createTugMatchState,
  isTugOfWarQuestionEligible,
  resetRound,
  resolveMatchOnQuestionsExhausted,
  resolveTugQuestionImageUrl,
  shouldEmitOffset,
  sideForTeam,
  stepDisplayedOffset,
  type TugSide,
} from './tugOfWarLogic'

const QUESTION_TIMER_ID = TUG_QUESTION_TIMER_ID
const ROUND_INTERSTITIAL_MS = 1600
const POST_PULL_MS = 380
const SHAKE_MS = 260
const SHAKE_AMPLITUDE = 0.035
const SIDES: readonly TugSide[] = ['blue', 'red']
/** Rear-foot offset from a pull-pose anchor, in sprite pixels. */
const REAR_FOOT_PX = 190

interface TugArt {
  backdrop: THREE.Texture
  rope: THREE.Texture
  ninjas: Record<TugSide, TugNinjaTextures>
}

/**
 * Turn-based, best-of-3 tug of war. Question UI lives in React; this class
 * owns the painted stage, rope, ninjas, and round/match rules.
 */
export class TugOfWar3DGame implements ThreeGame {
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly root = new THREE.Group()
  private readonly ninjas: NinjaActor[] = []
  private readonly winLines: THREE.Mesh[] = []

  private questions: QuestionData[] = []
  private sequencer: QuestionSequencer | null = null
  private currentQuestion: QuestionData | null = null
  private currentQuestionIndex = -1
  private totalQuestions = 0
  private activeTeamIndex = 0
  private answerLocked = true
  private paused = false
  private ended = false
  private disposed = false
  private started = false
  private match = createTugMatchState()
  private lastEmittedOffset = 0
  private pullSettledCallback: (() => void) | null = null
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null
  private durationMs = 15000
  private lastHudQuestion: HudQuestionShownPayload | null = null
  private view: TugStageView = computeTugStageView(TUG_STAGE_WIDTH / TUG_STAGE_HEIGHT)
  private art: TugArt | null = null
  private rope: TugRope | null = null
  private dust: TugDust | null = null
  private petals: TugPetals | null = null
  private shakeMs = 0

  constructor(private readonly context: ThreeGameContext) {
    this.scene = context.world.getScene()
    this.camera = context.world.getCamera()
  }

  public async init(): Promise<void> {
    if (this.context.config.teams.length !== 2) {
      throw new Error('Tug of War requires exactly two teams.')
    }

    const [quiz, art] = await Promise.all([
      this.context.quizDataSource.loadQuiz(this.context.config.quizId),
      loadTugArt(),
    ])
    if (this.disposed) {
      disposeTugArt(art)
      return
    }

    this.questions = quiz.questions.filter(isTugOfWarQuestionEligible)
    if (this.questions.length === 0) {
      disposeTugArt(art)
      throw new Error(
        'Tug of War requires multiple-choice questions with 2–4 answers.'
      )
    }

    this.sequencer = this.context.quizDataSource.createSequencer(
      { ...quiz, questions: this.questions },
      this.context.config.teams.length,
      this.context.config.questionHandling ?? DEFAULT_QUESTION_HANDLING_CONFIG
    )
    this.totalQuestions = this.sequencer.getTotalQuestionsToAsk()
    this.durationMs = this.context.config.intensityTimeLimit * 1000

    this._buildStage(art)
    this.scene.add(this.root)
    this.context.services.eventBus.on(
      HUD_EVENTS.ANSWER_SELECTED,
      this.handleHudAnswer
    )
    this.context.services.eventBus.on(
      HUD_EVENTS.READY,
      this.handleHudReady
    )
    this.context.services.eventBus.on(
      TIMER_EVENTS.TIMER_COMPLETED,
      this.handleTimerCompleted
    )
    this._emitOffset(true)
  }

  public start(): void {
    if (this.ended || this.started) return
    this.started = true
    this.context.services.gameStateManager.setPhase(GamePhase.PLAYING)
    this.context.services.gameStateManager.setActiveTeam(
      this.context.config.teams[0].id
    )
    this._showNextQuestion()
  }

  public update(deltaMs: number): void {
    if (this.paused || this.disposed) return

    this.ninjas.forEach((ninja) => ninja.update(deltaMs))
    this.rope?.update(deltaMs)
    this.dust?.update(deltaMs)
    this.petals?.update(deltaMs)
    this._updateShake(deltaMs)
    if (this.ended) return

    const displayed = stepDisplayedOffset(
      this.match.displayedOffset,
      this.match.offset,
      deltaMs
    )
    if (displayed !== this.match.displayedOffset) {
      this.match = { ...this.match, displayedOffset: displayed }
      this._syncRopeVisuals()
      if (shouldEmitOffset(this.lastEmittedOffset, displayed)) {
        this._emitOffset(false)
      }
    }

    if (
      this.pullSettledCallback &&
      Math.abs(this.match.displayedOffset - this.match.offset) < 0.02
    ) {
      const callback = this.pullSettledCallback
      this.pullSettledCallback = null
      this.feedbackTimeout = setTimeout(() => {
        this.feedbackTimeout = null
        if (this.disposed || this.ended) return
        if (this.paused) {
          this.pullSettledCallback = callback
          return
        }
        callback()
      }, POST_PULL_MS)
    }
  }

  public pause(): void {
    this.paused = true
    this.context.services.gameStateManager.setPhase(GamePhase.PAUSED)
  }

  public resume(): void {
    this.paused = false
    this.context.services.gameStateManager.setPhase(GamePhase.PLAYING)
  }

  public onResize(): void {
    if (this.disposed) return
    this._applyView()
  }

  public destroy(): void {
    this.disposed = true
    this.pullSettledCallback = null
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout)
      this.feedbackTimeout = null
    }
    this.context.services.eventBus.off(
      HUD_EVENTS.ANSWER_SELECTED,
      this.handleHudAnswer
    )
    this.context.services.eventBus.off(
      HUD_EVENTS.READY,
      this.handleHudReady
    )
    this.context.services.eventBus.off(
      TIMER_EVENTS.TIMER_COMPLETED,
      this.handleTimerCompleted
    )
    if (this.context.services.timerManager.getTimer(QUESTION_TIMER_ID)) {
      this.context.services.timerManager.removeTimer(QUESTION_TIMER_ID)
    }
    this.ninjas.forEach((ninja) => ninja.dispose())
    this.ninjas.length = 0
    this.rope?.dispose()
    this.dust?.dispose()
    this.petals?.dispose()
    this.rope = null
    this.dust = null
    this.petals = null
    this.winLines.length = 0
    this.scene.remove(this.root)
    disposeObject3D(this.root)
    if (this.art) {
      disposeTugArt(this.art)
      this.art = null
    }
  }

  private _showNextQuestion(): void {
    if (this.ended || this.disposed) return
    const question = this.sequencer?.getNextQuestion() ?? null
    if (!question) {
      this._finishFromExhaustedQuestions()
      return
    }

    this.currentQuestionIndex =
      (this.sequencer?.getCurrentProgressIndex() ?? 1) - 1
    this.currentQuestion = question
    this.answerLocked = false
    this.rope?.setSlack(0)
    this._playTeamClip('blue', 'idle_hold')
    this._playTeamClip('red', 'idle_hold')

    const team = this.context.config.teams[this.activeTeamIndex]
    const payload: HudQuestionShownPayload = {
      questionId: question.id,
      question: question.question,
      answers: question.answers,
      imageUrl: resolveTugQuestionImageUrl(question.imageUrl),
      questionIndex: this.currentQuestionIndex,
      totalQuestions: this.totalQuestions,
      teamId: team.id,
      roundNumber: this.match.roundNumber,
    }
    this.lastHudQuestion = payload
    this.context.services.eventBus.emit(HUD_EVENTS.QUESTION_SHOWN, payload)

    if (this.context.services.timerManager.getTimer(QUESTION_TIMER_ID)) {
      this.context.services.timerManager.removeTimer(QUESTION_TIMER_ID)
    }
    this.context.services.timerManager.createTimer(
      QUESTION_TIMER_ID,
      this.durationMs,
      TimerType.COUNTDOWN
    )
    this.context.services.timerManager.startTimer(QUESTION_TIMER_ID)
  }

  private _selectAnswer(selectedIndex: number | null): void {
    const question = this.currentQuestion
    if (!question || this.answerLocked || this.paused || this.ended) return
    this.answerLocked = true

    const remainingTimeMs = this.context.services.timerManager.getTimer(
      QUESTION_TIMER_ID
    )
      ? this.context.services.timerManager.getTimeRemaining(QUESTION_TIMER_ID)
      : 0
    const team = this.context.config.teams[this.activeTeamIndex]
    const timedOut = selectedIndex === null
    const payload = createTugAnswerPayload(
      question,
      selectedIndex,
      team.id,
      remainingTimeMs
    )

    this.context.services.eventBus.emit(GAME_EVENTS.ANSWER_SELECTED, payload)
    if (this.context.services.timerManager.getTimer(QUESTION_TIMER_ID)) {
      this.context.services.timerManager.removeTimer(QUESTION_TIMER_ID)
    }

    const impulse = computePullImpulse({
      isCorrect: payload.isCorrect,
      timedOut,
      remainingTimeMs,
      durationMs: this.durationMs,
    })
    const result = applyPull(this.match, this.activeTeamIndex, impulse)
    this.match = {
      ...result.state,
      displayedOffset: this.match.displayedOffset,
    }

    const activeSide = sideForTeam(this.activeTeamIndex)
    const otherSide: TugSide = activeSide === 'blue' ? 'red' : 'blue'
    if (payload.isCorrect) {
      this._playTeamClip(activeSide, 'pull_heave')
      this._playTeamClip(otherSide, 'strain_lose')
    } else {
      this._playTeamClip(activeSide, timedOut ? 'strain_lose' : 'stumble_slip')
      this._playTeamClip(otherSide, 'pull_heave')
    }
    this._kickDust(payload.isCorrect ? activeSide : otherSide, 3)
    this.shakeMs = SHAKE_MS

    this.pullSettledCallback = () => {
      if (this.disposed || this.ended) return
      if (result.roundWinner) {
        this._handleRoundWin(result.roundWinner, result.matchWinner)
        return
      }
      this._advanceTurn()
      this._showNextQuestion()
    }
  }

  private _handleRoundWin(winner: TugSide, matchWinner: TugSide | null): void {
    const winningTeam =
      winner === 'blue'
        ? this.context.config.teams[0]
        : this.context.config.teams[1]
    const loser: TugSide = winner === 'blue' ? 'red' : 'blue'
    this._playTeamClip(winner, 'victory_cheer')
    this._playTeamClip(loser, 'defeat_fall')
    this.rope?.setSlack(1)
    this._kickDust(loser, 4)

    this.context.services.eventBus.emit(TUG_EVENTS.ROUND_WON, {
      teamId: winningTeam.id,
      winningSide: winner,
      roundNumber: this.match.roundNumber,
      blueRoundWins: this.match.blueRoundWins,
      redRoundWins: this.match.redRoundWins,
    })
    this._emitOffset(true)

    this.feedbackTimeout = setTimeout(() => {
      this.feedbackTimeout = null
      if (this.disposed) return
      if (matchWinner) {
        this._endMatch(matchWinner, 'rounds')
        return
      }
      this._smokeBomb()
      this.match = resetRound(this.match)
      this._syncRopeVisuals()
      this._smokeBomb()
      this._emitOffset(true)
      this._advanceTurn()
      this._showNextQuestion()
    }, ROUND_INTERSTITIAL_MS)
  }

  private _finishFromExhaustedQuestions(): void {
    const resolution = resolveMatchOnQuestionsExhausted(this.match)
    this._endMatch(resolution.winner, resolution.reason)
  }

  private _endMatch(
    winner: TugSide | null,
    reason: 'rounds' | 'questions' | 'draw'
  ): void {
    if (this.ended) return
    this.ended = true
    this.answerLocked = true
    this.match = { ...this.match, phase: 'matchOver' }

    if (winner) {
      const loser: TugSide = winner === 'blue' ? 'red' : 'blue'
      this._playTeamClip(winner, 'victory_cheer')
      this._playTeamClip(loser, 'defeat_fall')
      this.rope?.setSlack(1)
    }

    const winnerTeam =
      winner === 'blue'
        ? this.context.config.teams[0]
        : winner === 'red'
          ? this.context.config.teams[1]
          : null

    this.context.services.eventBus.emit(TUG_EVENTS.MATCH_ENDED, {
      winnerTeamId: winnerTeam?.id ?? null,
      winningSide: winner,
      blueRoundWins: this.match.blueRoundWins,
      redRoundWins: this.match.redRoundWins,
      reason,
    })
    this.context.services.gameStateManager.setPhase(GamePhase.GAME_OVER)
    this.context.services.eventBus.emit(GAME_STATE_EVENTS.GAME_ENDED)
  }

  private _advanceTurn(): void {
    this.activeTeamIndex =
      (this.activeTeamIndex + 1) % this.context.config.teams.length
    this.context.services.gameStateManager.setActiveTeam(
      this.context.config.teams[this.activeTeamIndex].id
    )
  }

  private _playTeamClip(
    side: TugSide,
    clip: Parameters<NinjaActor['play']>[0]
  ): void {
    this.ninjas
      .filter((ninja) => ninja.side === side)
      .forEach((ninja) => ninja.play(clip))
  }

  private _emitOffset(force: boolean): void {
    if (!force && !shouldEmitOffset(this.lastEmittedOffset, this.match.displayedOffset)) {
      return
    }
    this.lastEmittedOffset = this.match.displayedOffset
    this.context.services.eventBus.emit(TUG_EVENTS.OFFSET_CHANGED, {
      offset: this.match.offset,
      displayedOffset: this.match.displayedOffset,
    })
  }

  private _syncRopeVisuals(): void {
    const shift =
      this.match.displayedOffset * TUG_ROPE_TRAVEL * this.view.layoutScaleX
    if (this.rope) this.rope.group.position.x = shift
    this.ninjas.forEach((ninja) => ninja.setWorldX(ninja.restX + shift))
  }

  private _kickDust(side: TugSide, perNinja: number): void {
    if (!this.dust) return
    const away = side === 'blue' ? -1 : 1
    const rearFoot = tugNinjaPx(REAR_FOOT_PX, this.view.spriteScale) * away
    this.ninjas
      .filter((ninja) => ninja.side === side)
      .forEach((ninja) => {
        this.dust?.spawn(
          ninja.group.position.x + rearFoot,
          TUG_FEET_Y + 0.04,
          away,
          perNinja,
          this.view.spriteScale
        )
      })
  }

  /** Ninja smoke puffs that hide the snap back to the start line. */
  private _smokeBomb(): void {
    if (!this.dust) return
    this.ninjas.forEach((ninja, index) => {
      this.dust?.spawn(
        ninja.group.position.x,
        TUG_FEET_Y + 0.35 * this.view.spriteScale,
        index % 2 === 0 ? -0.4 : 0.4,
        3,
        this.view.spriteScale * 1.8
      )
    })
  }

  private _updateShake(deltaMs: number): void {
    if (this.shakeMs <= 0) return
    this.shakeMs = Math.max(0, this.shakeMs - deltaMs)
    const strength = (this.shakeMs / SHAKE_MS) * SHAKE_AMPLITUDE
    this.camera.position.x = (Math.random() - 0.5) * 2 * strength
    this.camera.position.y = this.view.cameraY + (Math.random() - 0.5) * strength
    if (this.shakeMs === 0) {
      this.camera.position.set(0, this.view.cameraY, TUG_CAMERA_DISTANCE)
    }
  }

  private _applyView(): void {
    this.view = computeTugStageView(this.camera.aspect)
    this.camera.fov = this.view.fovDeg
    this.camera.near = 1
    this.camera.far = 60
    this.camera.position.set(0, this.view.cameraY, TUG_CAMERA_DISTANCE)
    this.camera.lookAt(0, this.view.cameraY, 0)
    this.camera.updateProjectionMatrix()

    const { layoutScaleX, spriteScale } = this.view
    this.ninjas.forEach((ninja) => {
      ninja.setLayout({
        restX: tugSlotX(ninja.side, ninja.slot, layoutScaleX),
        spriteScale,
        baselineY: TUG_FEET_Y,
      })
    })
    this.rope?.setLayout(spriteScale, layoutScaleX)
    this.winLines.forEach((line, index) => {
      const sign = index === 0 ? -1 : 1
      line.position.set(sign * TUG_ROPE_TRAVEL * layoutScaleX, TUG_FEET_Y - 0.05, 0.001)
      line.scale.set(spriteScale, spriteScale, 1)
    })
    this.petals?.setBounds(
      this.view.visibleWidth / 2,
      this.view.cameraY - this.view.visibleHeight / 2,
      this.view.cameraY + this.view.visibleHeight / 2
    )
    this._syncRopeVisuals()
  }

  private _buildStage(art: TugArt): void {
    this.art = art
    this.scene.background = new THREE.Color(0x9fd3f5)
    this.scene.fog = null

    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(TUG_STAGE_WIDTH, TUG_STAGE_HEIGHT),
      new THREE.MeshBasicMaterial({ map: art.backdrop, depthWrite: false })
    )
    backdrop.name = 'tug-arena-backdrop'
    backdrop.position.set(0, TUG_STAGE_HEIGHT / 2, -0.05)
    backdrop.renderOrder = 0
    this.root.add(backdrop)

    SIDES.forEach((side) => {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 1.05).translate(0, 0.08, 0),
        createCutoutMaterial(
          createChalkTexture(side === 'blue' ? '#dbeafe' : '#fee2e2'),
          0.85
        )
      )
      line.name = `tug-win-line-${side}`
      line.rotation.z = side === 'blue' ? -0.12 : 0.12
      line.renderOrder = 1
      this.winLines.push(line)
      this.root.add(line)
    })

    this.rope = new TugRope(art.rope, createFlagTexture())
    this.root.add(this.rope.group)

    const shadowTexture = createShadowTexture()
    for (let slot = 0; slot < TUG_NINJAS_PER_TEAM; slot++) {
      SIDES.forEach((side) => {
        const ninja = new NinjaActor({
          side,
          slot,
          textures: art.ninjas[side],
          restX: tugSlotX(side, slot, 1),
          baselineY: TUG_FEET_Y,
          shadowTexture,
          renderOrder: 10 + (TUG_NINJAS_PER_TEAM - slot),
        })
        this.ninjas.push(ninja)
        this.root.add(ninja.group)
      })
    }

    this.dust = new TugDust(createDustTexture())
    this.root.add(this.dust.group)
    this.petals = new TugPetals(createPetalTexture())
    this.root.add(this.petals.group)
    this._applyView()
  }

  private handleHudAnswer = (payload: HudAnswerSelectedPayload): void => {
    if (typeof payload?.selectedIndex !== 'number') return
    this._selectAnswer(payload.selectedIndex)
  }

  private handleHudReady = (): void => {
    const replay = {
      ended: this.ended,
      disposed: this.disposed,
      answerLocked: this.answerLocked,
      lastHudQuestion: this.lastHudQuestion,
    }
    if (!canReplayHudQuestion(replay)) return
    this.context.services.eventBus.emit(
      HUD_EVENTS.QUESTION_SHOWN,
      replay.lastHudQuestion
    )
  }

  private handleTimerCompleted = (payload: TimerEventPayload): void => {
    if (payload.timerId === QUESTION_TIMER_ID) {
      this._selectAnswer(null)
    }
  }
}

async function loadTugArt(): Promise<TugArt> {
  const loader = new THREE.TextureLoader()
  const load = async (url: string, premultiply: boolean) => {
    const texture = await loader.loadAsync(url)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.premultiplyAlpha = premultiply
    texture.needsUpdate = true
    return texture
  }
  const poses = (side: TugSide) =>
    Promise.all([
      load(TUG_ART.ninjas[side].pull, true),
      load(TUG_ART.ninjas[side].cheer, true),
      load(TUG_ART.ninjas[side].fallen, true),
    ]).then(([pull, cheer, fallen]) => ({ pull, cheer, fallen }))

  const [backdrop, rope, blue, red] = await Promise.all([
    load(TUG_ART.backdrop, false),
    load(TUG_ART.ropeStrip, true),
    poses('blue'),
    poses('red'),
  ])
  return { backdrop, rope, ninjas: { blue, red } }
}

function disposeTugArt(art: TugArt): void {
  art.backdrop.dispose()
  art.rope.dispose()
  SIDES.forEach((side) => {
    Object.values(art.ninjas[side]).forEach((texture) => texture.dispose())
  })
}
