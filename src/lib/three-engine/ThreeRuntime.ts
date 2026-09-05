import { GameSession, type GameSessionServices } from '@/lib/game-engine/core/GameSession'
import { QuizDataSource } from '@/lib/game-engine/quiz/QuizDataSource'
import type {
  GameRuntime,
  GameRuntimeInit,
} from '@/lib/game-engine/runtime/GameRuntime'
import { ENGINE_EVENTS, GAME_STATE_EVENTS } from '@/lib/pixi-engine/core/EventTypes'
import type {
  ThreeGame,
  ThreeGameFactory,
} from '@/lib/three-engine/game/ThreeGame'
import { ThreeWorld } from '@/lib/three-engine/ThreeWorld'

/**
 * Three renderer runtime. Owns exactly one animation loop and delegates all
 * domain concerns to GameSession and the selected ThreeGame implementation.
 */
export class ThreeRuntime implements GameRuntime {
  public readonly rendererKind = 'three' as const

  private session: GameSession | null = null
  private world: ThreeWorld | null = null
  private game: ThreeGame | null = null
  private animationFrameId: number | null = null
  private lastFrameTime = 0
  private running = false
  private paused = false
  private destroyRequested = false

  constructor(private readonly gameFactory: ThreeGameFactory) {}

  public async init({ target, config }: GameRuntimeInit): Promise<void> {
    if (this.session || this.world) {
      throw new Error('ThreeRuntime is already initialized.')
    }

    this.destroyRequested = false
    const session = new GameSession()
    const world = new ThreeWorld({ maxPixelRatio: 1.75 })
    this.session = session
    this.world = world

    try {
      await world.init(target)
      if (this.destroyRequested) return

      session.init(config)
      if (this.destroyRequested) return

      const services = session.getServices()
      services.eventBus.on(GAME_STATE_EVENTS.GAME_PAUSED, this.handleHudPaused)
      services.eventBus.on(GAME_STATE_EVENTS.GAME_RESUMED, this.handleHudResumed)

      const game = this.gameFactory({
        config: Object.freeze({ ...config }),
        services,
        world,
        quizDataSource: new QuizDataSource(),
      })
      this.game = game
      await game.init()
      if (this.destroyRequested) return

      // After the 3D game is ready so a failed quiz fetch does not start music
      // and immediately tear the session down.
      services.eventBus.emit(ENGINE_EVENTS.ENGINE_READY_FOR_GAME)
    } catch (error) {
      await this.destroy()
      throw error
    }
  }

  public start(): void {
    if (!this.game || !this.world || this.running) return
    this.game.start()
    this.running = true
    this.paused = false
    this.lastFrameTime = performance.now()
    this.animationFrameId = requestAnimationFrame(this.frame)
  }

  public pause(): void {
    if (!this.running || this.paused) return
    this.paused = true
    this.session?.timerManager.pauseAll()
    this.game?.pause()
  }

  public resume(): void {
    if (!this.running || !this.paused) return
    this.paused = false
    this.lastFrameTime = performance.now()
    this.session?.timerManager.resumeAll()
    this.game?.resume()
  }

  public resize(width: number, height: number): void {
    this.world?.resize(width, height)
    this.game?.onResize(width, height)
  }

  public getServices(): GameSessionServices {
    if (!this.session) {
      throw new Error('ThreeRuntime services are unavailable before init().')
    }
    return this.session.getServices()
  }

  public async destroy(): Promise<void> {
    this.destroyRequested = true
    this.running = false
    this.paused = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    this.session?.eventBus.off(GAME_STATE_EVENTS.GAME_PAUSED, this.handleHudPaused)
    this.session?.eventBus.off(GAME_STATE_EVENTS.GAME_RESUMED, this.handleHudResumed)

    this.game?.destroy()
    this.game = null
    this.session?.destroy()
    this.session = null
    this.world?.destroy()
    this.world = null
  }

  private handleHudPaused = (): void => {
    this.pause()
  }

  private handleHudResumed = (): void => {
    this.resume()
  }

  private frame = (now: number): void => {
    if (!this.running) return
    const deltaMs = Math.min(100, Math.max(0, now - this.lastFrameTime))
    this.lastFrameTime = now

    if (!this.paused) {
      const services = this.session?.getServices()
      services?.powerUpManager.update(deltaMs)
      this.game?.update(deltaMs)
      this.world?.render()
    }

    this.animationFrameId = requestAnimationFrame(this.frame)
  }
}
