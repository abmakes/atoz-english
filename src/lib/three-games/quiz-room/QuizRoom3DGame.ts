import * as THREE from 'three'
import type { QuestionData } from '@/types'
import {
  GAME_EVENTS,
  GAME_STATE_EVENTS,
  TIMER_EVENTS,
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
import {
  createQuizRoomAnswerPayload,
  isQuizRoomQuestionEligible,
} from './quizRoomLogic'

const QUESTION_TIMER_ID = 'quizRoom3dQuestionTimer'
const FEEDBACK_DELAY_MS = 1200

/**
 * Procedural contract-test game: a bright 3D room with 2–4 clickable answer
 * pedestals. It uses existing quizzes and shared manager events end-to-end.
 */
export class QuizRoom3DGame implements ThreeGame {
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly answerTargets: THREE.Object3D[] = []
  private readonly answerPedestals: THREE.Mesh[] = []
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()

  private questionGroup: THREE.Group | null = null
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
  private elapsedMs = 0
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(private readonly context: ThreeGameContext) {
    this.scene = context.world.getScene()
    this.camera = context.world.getCamera()
  }

  public async init(): Promise<void> {
    const quiz = await this.context.quizDataSource.loadQuiz(this.context.config.quizId)
    if (this.disposed) return
    this.questions = quiz.questions.filter(isQuizRoomQuestionEligible)
    if (this.questions.length === 0) {
      throw new Error('3D Quiz Room requires multiple-choice questions with 2–4 answers.')
    }
    this.sequencer = this.context.quizDataSource.createSequencer(
      { ...quiz, questions: this.questions },
      this.context.config.teams.length,
      this.context.config.questionHandling ?? DEFAULT_QUESTION_HANDLING_CONFIG
    )
    this.totalQuestions = this.sequencer.getTotalQuestionsToAsk()

    this._buildRoom()
    this.context.world
      .getCanvas()
      .addEventListener('pointerup', this.handlePointerUp)
    this.context.services.eventBus.on(
      TIMER_EVENTS.TIMER_COMPLETED,
      this.handleTimerCompleted
    )
  }

  public start(): void {
    if (this.ended) return
    this.context.services.gameStateManager.setPhase(GamePhase.PLAYING)
    this._showNextQuestion()
  }

  public update(deltaMs: number): void {
    if (this.paused || this.ended) return
    this.elapsedMs += deltaMs

    this.answerPedestals.forEach((pedestal, index) => {
      pedestal.position.y =
        0.5 + Math.sin(this.elapsedMs * 0.0018 + index * 0.8) * 0.06
      pedestal.rotation.y = Math.sin(this.elapsedMs * 0.0005 + index) * 0.025
    })
  }

  public pause(): void {
    this.paused = true
    this.context.services.gameStateManager.setPhase(GamePhase.PAUSED)
  }

  public resume(): void {
    this.paused = false
    this.context.services.gameStateManager.setPhase(GamePhase.PLAYING)
  }

  public onResize(_width: number, _height: number): void {
    // Camera projection is updated by ThreeWorld.
  }

  public destroy(): void {
    this.disposed = true
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout)
      this.feedbackTimeout = null
    }
    try {
      this.context.world
        .getCanvas()
        .removeEventListener('pointerup', this.handlePointerUp)
    } catch {
      // Renderer may already be disposed during teardown races.
    }
    this.context.services.eventBus.off(
      TIMER_EVENTS.TIMER_COMPLETED,
      this.handleTimerCompleted
    )
    this._clearQuestionGroup()
    if (this.context.services.timerManager.getTimer(QUESTION_TIMER_ID)) {
      this.context.services.timerManager.removeTimer(QUESTION_TIMER_ID)
    }
  }

  private _buildRoom(): void {
    this.scene.background = new THREE.Color(0x9bdcff)
    this.scene.fog = new THREE.Fog(0x9bdcff, 14, 30)

    this.camera.position.set(0, 4.8, 10)
    this.camera.lookAt(0, 1.8, 0)

    const ambient = new THREE.HemisphereLight(0xffffff, 0x5a7d44, 2.1)
    this.scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xffffff, 2.4)
    sun.position.set(5, 10, 6)
    sun.castShadow = true
    this.scene.add(sun)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 24),
      new THREE.MeshStandardMaterial({ color: 0x7fd36b, roughness: 0.9 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.15
    floor.receiveShadow = true
    this.scene.add(floor)

    const backHill = new THREE.Mesh(
      new THREE.SphereGeometry(7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x58b957, roughness: 1 })
    )
    backHill.scale.set(1.8, 0.55, 0.7)
    backHill.position.set(0, -0.1, -7)
    this.scene.add(backHill)

    for (let i = 0; i < 16; i++) {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(0.55 + (i % 3) * 0.12, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      )
      cloud.scale.set(1.8, 0.65, 0.8)
      cloud.position.set(
        -9 + (i % 8) * 2.7,
        5.5 + Math.floor(i / 8) * 1.4,
        -8 - (i % 2)
      )
      this.scene.add(cloud)
    }
  }

  private _showNextQuestion(): void {
    if (this.ended) return
    const question = this.sequencer?.getNextQuestion() ?? null
    if (!question) {
      this._endGame()
      return
    }

    this.currentQuestionIndex =
      (this.sequencer?.getCurrentProgressIndex() ?? 1) - 1
    this.answerLocked = false
    this.currentQuestion = question
    this._clearQuestionGroup()
    this.questionGroup = this._createQuestionGroup(this.currentQuestion)
    this.scene.add(this.questionGroup)

    const durationMs = this.context.config.intensityTimeLimit * 1000
    if (this.context.services.timerManager.getTimer(QUESTION_TIMER_ID)) {
      this.context.services.timerManager.removeTimer(QUESTION_TIMER_ID)
    }
    this.context.services.timerManager.createTimer(
      QUESTION_TIMER_ID,
      durationMs,
      TimerType.COUNTDOWN
    )
    this.context.services.timerManager.startTimer(QUESTION_TIMER_ID)
  }

  private _createQuestionGroup(question: QuestionData): THREE.Group {
    const group = new THREE.Group()

    const board = createTextPlane(
      question.question,
      1024,
      256,
      '#ffffff',
      '#114257',
      64
    )
    board.scale.set(7.6, 1.9, 1)
    board.position.set(0, 4.25, -2.5)
    group.add(board)

    const counter = createTextPlane(
      `Question ${this.currentQuestionIndex + 1} of ${this.totalQuestions}`,
      512,
      96,
      '#ffe36e',
      '#114257',
      38
    )
    counter.scale.set(3.2, 0.6, 1)
    counter.position.set(0, 5.45, -2.4)
    group.add(counter)

    const spacing = 2.35
    const startX = -((question.answers.length - 1) * spacing) / 2
    const colors = [0x35bdf4, 0xffb43b, 0xf56fa7, 0x65c979]

    question.answers.forEach((answer, index) => {
      const pedestal = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 1, 1.9),
        new THREE.MeshStandardMaterial({
          color: colors[index],
          roughness: 0.55,
          metalness: 0.05,
        })
      )
      pedestal.position.set(startX + index * spacing, 0.5, 0)
      pedestal.castShadow = true
      pedestal.receiveShadow = true
      pedestal.userData.answerIndex = index
      group.add(pedestal)
      this.answerPedestals.push(pedestal)
      this.answerTargets.push(pedestal)

      const label = createTextPlane(answer, 512, 256, '#ffffff', '#114257', 54)
      label.scale.set(1.65, 0.82, 1)
      label.position.set(startX + index * spacing, 1.62, 0)
      label.userData.answerIndex = index
      group.add(label)
      this.answerTargets.push(label)
    })

    return group
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
    const payload = createQuizRoomAnswerPayload(
      question,
      selectedIndex,
      team.id,
      remainingTimeMs
    )

    this.answerPedestals.forEach((pedestal, index) => {
      const material = pedestal.material as THREE.MeshStandardMaterial
      const answer = question.answers[index]
      if (answer === question.correctAnswer) {
        material.emissive.setHex(0x1b8f42)
        material.emissiveIntensity = 0.7
      } else if (index === selectedIndex) {
        material.emissive.setHex(0xa61d42)
        material.emissiveIntensity = 0.7
      }
    })

    this.context.services.eventBus.emit(GAME_EVENTS.ANSWER_SELECTED, payload)
    if (this.context.services.timerManager.getTimer(QUESTION_TIMER_ID)) {
      this.context.services.timerManager.removeTimer(QUESTION_TIMER_ID)
    }

    this.feedbackTimeout = setTimeout(() => {
      this.feedbackTimeout = null
      this._advanceTurn()
      this._showNextQuestion()
    }, FEEDBACK_DELAY_MS)
  }

  private _advanceTurn(): void {
    this.activeTeamIndex =
      (this.activeTeamIndex + 1) % this.context.config.teams.length
    this.context.services.gameStateManager.setActiveTeam(
      this.context.config.teams[this.activeTeamIndex].id
    )
  }

  private _endGame(): void {
    if (this.ended) return
    this.ended = true
    this.answerLocked = true
    this.context.services.gameStateManager.setPhase(GamePhase.GAME_OVER)
    this.context.services.eventBus.emit(GAME_STATE_EVENTS.GAME_ENDED)
  }

  private _clearQuestionGroup(): void {
    this.answerTargets.length = 0
    this.answerPedestals.length = 0
    if (!this.questionGroup) return
    this.scene.remove(this.questionGroup)
    disposeObject3D(this.questionGroup)
    this.questionGroup = null
  }

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.answerLocked || this.paused) return
    const canvas = this.context.world.getCanvas()
    const bounds = canvas.getBoundingClientRect()
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)

    const hit = this.raycaster.intersectObjects(this.answerTargets, false)[0]
    const answerIndex = hit?.object.userData.answerIndex
    if (typeof answerIndex === 'number') {
      this._selectAnswer(answerIndex)
    }
  }

  private handleTimerCompleted = (payload: TimerEventPayload): void => {
    if (payload.timerId === QUESTION_TIMER_ID) {
      this._selectAnswer(null)
    }
  }
}

function createTextPlane(
  text: string,
  width: number,
  height: number,
  background: string,
  foreground: string,
  fontSize: number
): THREE.Mesh {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context unavailable for 3D quiz label.')
  }

  context.fillStyle = background
  roundedRect(context, 0, 0, width, height, 34)
  context.fill()
  context.fillStyle = foreground
  context.font = `700 ${fontSize}px Grandstander, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  drawWrappedText(context, text, width / 2, height / 2, width - 72, fontSize * 1.15)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  })
  return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  })
  if (line) lines.push(line)

  const firstY = centerY - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((value, index) => {
    context.fillText(value, centerX, firstY + index * lineHeight)
  })
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}
