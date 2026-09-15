import * as THREE from 'three'
import type { QuestionData } from '@/types'
import {
  GAME_EVENTS,
  GAME_STATE_EVENTS,
  HUD_EVENTS,
  TIMER_EVENTS,
  TUG_EVENTS,
  type HudAnswerSelectedPayload,
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
import { NinjaActor } from './NinjaActor'
import {
  TUG_NINJAS_PER_TEAM,
  TUG_QUESTION_TIMER_ID,
  applyPull,
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
  type TugMatchState,
  type TugSide,
} from './tugOfWarLogic'

const QUESTION_TIMER_ID = TUG_QUESTION_TIMER_ID
const ROUND_INTERSTITIAL_MS = 1600
const POST_PULL_MS = 380
const FLAG_TRAVEL = 3.6
const NINJA_DRAG = 0.32
const ROPE_Y = 1.08

/**
 * Turn-based, best-of-3 tug of war. Question UI lives in React; this class
 * owns the 3D arena, rope, ninjas, and round/match rules.
 */
export class TugOfWar3DGame implements ThreeGame {
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly root = new THREE.Group()
  private readonly ninjas: NinjaActor[] = []

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
  private match = createTugMatchState()
  private lastEmittedOffset = 0
  private ropeMarker: THREE.Group | null = null
  private pullSettledCallback: (() => void) | null = null
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null
  private durationMs = 15000

  constructor(private readonly context: ThreeGameContext) {
    this.scene = context.world.getScene()
    this.camera = context.world.getCamera()
  }

  public async init(): Promise<void> {
    if (this.context.config.teams.length !== 2) {
      throw new Error('Tug of War requires exactly two teams.')
    }

    const quiz = await this.context.quizDataSource.loadQuiz(
      this.context.config.quizId
    )
    if (this.disposed) return

    this.questions = quiz.questions.filter(isTugOfWarQuestionEligible)
    if (this.questions.length === 0) {
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

    this._buildArena()
    this.scene.add(this.root)
    this.context.services.eventBus.on(
      HUD_EVENTS.ANSWER_SELECTED,
      this.handleHudAnswer
    )
    this.context.services.eventBus.on(
      TIMER_EVENTS.TIMER_COMPLETED,
      this.handleTimerCompleted
    )
    this._emitOffset(true)
  }

  public start(): void {
    if (this.ended) return
    this.context.services.gameStateManager.setPhase(GamePhase.PLAYING)
    this.context.services.gameStateManager.setActiveTeam(
      this.context.config.teams[0].id
    )
    this._showNextQuestion()
  }

  public update(deltaMs: number): void {
    if (this.paused || this.ended) return

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

    this.ninjas.forEach((ninja) => ninja.update(deltaMs))

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
    // Camera projection is updated by ThreeWorld.
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
      TIMER_EVENTS.TIMER_COMPLETED,
      this.handleTimerCompleted
    )
    if (this.context.services.timerManager.getTimer(QUESTION_TIMER_ID)) {
      this.context.services.timerManager.removeTimer(QUESTION_TIMER_ID)
    }
    this.ninjas.forEach((ninja) => ninja.dispose())
    this.ninjas.length = 0
    this.scene.remove(this.root)
    disposeObject3D(this.root)
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
    this._playTeamClip('blue', 'idle_hold')
    this._playTeamClip('red', 'idle_hold')

    const team = this.context.config.teams[this.activeTeamIndex]
    this.context.services.eventBus.emit(HUD_EVENTS.QUESTION_SHOWN, {
      questionId: question.id,
      question: question.question,
      answers: question.answers,
      imageUrl: resolveTugQuestionImageUrl(question.imageUrl),
      questionIndex: this.currentQuestionIndex,
      totalQuestions: this.totalQuestions,
      teamId: team.id,
      roundNumber: this.match.roundNumber,
    })

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
      this.match = resetRound(this.match)
      this._syncRopeVisuals()
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
    const x = this.match.displayedOffset * FLAG_TRAVEL
    if (this.ropeMarker) {
      this.ropeMarker.position.x = x
    }
    this.ninjas.forEach((ninja) => {
      ninja.setWorldX(ninja.restX + this.match.displayedOffset * NINJA_DRAG)
    })
  }

  private _buildArena(): void {
    this.scene.background = new THREE.Color(0x8ecfff)
    this.scene.fog = new THREE.Fog(0x8ecfff, 18, 42)

    this.camera.position.set(0, 4.35, 11.2)
    this.camera.lookAt(0, 1.55, 0)

    const hemi = new THREE.HemisphereLight(0xfff4dc, 0x6b8f4a, 1.55)
    this.root.add(hemi)
    const sun = new THREE.DirectionalLight(0xfff3c8, 2.35)
    sun.position.set(6, 12, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    this.root.add(sun)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 22),
      new THREE.MeshStandardMaterial({ color: 0xc9a36b, roughness: 0.95 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.root.add(ground)

    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 4.2),
      new THREE.MeshStandardMaterial({ color: 0xb58a4d, roughness: 1 })
    )
    path.rotation.x = -Math.PI / 2
    path.position.y = 0.01
    path.receiveShadow = true
    this.root.add(path)

    this._addHills()
    this._addTrees()
    this._addBanners()
    this._addRope()
    this._addNinjas()
  }

  private _addHills(): void {
    const hillMat = new THREE.MeshStandardMaterial({
      color: 0x5fa85a,
      roughness: 1,
    })
    const farMat = new THREE.MeshStandardMaterial({
      color: 0x7eb7c9,
      roughness: 1,
    })
    ;[
      { x: -7, z: -9, s: 4.5, y: 0.2, mat: farMat },
      { x: 8, z: -10, s: 5.2, y: 0.4, mat: farMat },
      { x: 0, z: -11, s: 6, y: 0.6, mat: farMat },
      { x: -4, z: -6.5, s: 2.4, y: 0, mat: hillMat },
      { x: 5.5, z: -6.2, s: 2.1, y: 0, mat: hillMat },
    ].forEach((hill) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        hill.mat
      )
      mesh.scale.set(hill.s, hill.s * 0.55, hill.s * 0.7)
      mesh.position.set(hill.x, hill.y, hill.z)
      this.root.add(mesh)
    })

    const waterfall = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 3.4),
      new THREE.MeshStandardMaterial({
        color: 0xd9f4ff,
        transparent: true,
        opacity: 0.75,
      })
    )
    waterfall.position.set(7.2, 2.1, -7.4)
    this.root.add(waterfall)

    const pagoda = new THREE.Group()
    ;[1.2, 0.9, 0.6].forEach((w, i) => {
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(w, 0.35, 4),
        new THREE.MeshStandardMaterial({ color: 0xb4532a, roughness: 0.7 })
      )
      roof.position.y = 1.1 + i * 0.55
      roof.rotation.y = Math.PI / 4
      pagoda.add(roof)
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.7, 0.35, w * 0.7),
        new THREE.MeshStandardMaterial({ color: 0xe8d5a3 })
      )
      body.position.y = 0.85 + i * 0.55
      pagoda.add(body)
    })
    pagoda.position.set(6.4, 0, -7.8)
    this.root.add(pagoda)
  }

  private _addTrees(): void {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423 })
    const blossomMat = new THREE.MeshStandardMaterial({
      color: 0xf4b6c8,
      roughness: 0.8,
    })
    ;[
      [-8.5, 3.2],
      [-7.4, 4.1],
      [8.2, 3.4],
      [7.1, 4.4],
    ].forEach(([x, z]) => {
      const tree = new THREE.Group()
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 1.6, 6),
        trunkMat
      )
      trunk.position.y = 0.8
      trunk.castShadow = true
      tree.add(trunk)
      for (let i = 0; i < 5; i++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(0.45 + (i % 2) * 0.12, 10, 8),
          blossomMat
        )
        puff.position.set(
          (i - 2) * 0.22,
          1.7 + (i % 3) * 0.18,
          ((i % 2) - 0.5) * 0.2
        )
        tree.add(puff)
      }
      tree.position.set(x, 0, z)
      this.root.add(tree)
    })
  }

  private _addBanners(): void {
    this.root.add(makeBanner(-6.6, 0x2b6cb0, 0xebf8ff))
    this.root.add(makeBanner(6.6, 0xc53030, 0xfff5f5))
  }

  private _addRope(): void {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5.2, ROPE_Y + 0.02, 0),
      new THREE.Vector3(-2.4, ROPE_Y - 0.12, 0),
      new THREE.Vector3(0, ROPE_Y - 0.18, 0),
      new THREE.Vector3(2.4, ROPE_Y - 0.12, 0),
      new THREE.Vector3(5.2, ROPE_Y + 0.02, 0),
    ])
    const rope = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, 0.055, 8, false),
      new THREE.MeshStandardMaterial({ color: 0xc4a574, roughness: 0.85 })
    )
    rope.castShadow = true
    this.root.add(rope)

    const marker = new THREE.Group()
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0xf7fafc })
    )
    pole.position.y = ROPE_Y + 0.22
    marker.add(pole)
    const blue = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0x2b6cb0,
        side: THREE.DoubleSide,
      })
    )
    blue.position.set(-0.12, ROPE_Y + 0.42, 0)
    marker.add(blue)
    const red = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0xc53030,
        side: THREE.DoubleSide,
      })
    )
    red.position.set(0.12, ROPE_Y + 0.42, 0)
    marker.add(red)
    this.ropeMarker = marker
    this.root.add(marker)
  }

  private _addNinjas(): void {
    const blueXs = [-4.15, -3.35, -2.55]
    const redXs = [2.55, 3.35, 4.15]
    const zs = [-0.18, 0.05, 0.22]
    for (let i = 0; i < TUG_NINJAS_PER_TEAM; i++) {
      const blue = new NinjaActor({
        side: 'blue',
        slot: i,
        restX: blueXs[i],
        restZ: zs[i],
      })
      const red = new NinjaActor({
        side: 'red',
        slot: i,
        restX: redXs[i],
        restZ: zs[i],
      })
      this.ninjas.push(blue, red)
      this.root.add(blue.group, red.group)
    }
  }

  private handleHudAnswer = (payload: HudAnswerSelectedPayload): void => {
    if (typeof payload?.selectedIndex !== 'number') return
    this._selectAnswer(payload.selectedIndex)
  }

  private handleTimerCompleted = (payload: TimerEventPayload): void => {
    if (payload.timerId === QUESTION_TIMER_ID) {
      this._selectAnswer(null)
    }
  }
}

function makeBanner(x: number, color: number, cloth: number): THREE.Group {
  const group = new THREE.Group()
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 })
  )
  pole.position.y = 1.2
  pole.castShadow = true
  group.add(pole)
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 1.15),
    new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
      roughness: 0.7,
    })
  )
  flag.position.set(x < 0 ? 0.45 : -0.45, 1.55, 0)
  group.add(flag)
  const emblem = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 12),
    new THREE.MeshStandardMaterial({ color: cloth, side: THREE.DoubleSide })
  )
  emblem.position.copy(flag.position)
  emblem.position.z = 0.02
  group.add(emblem)
  group.position.set(x, 0, 1.6)
  return group
}
