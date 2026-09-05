import {
  PixiEngine,
  type GameFactory,
} from '@/lib/pixi-engine/core/PixiEngine'
import type {
  GameRuntime,
  GameRuntimeInit,
} from '@/lib/game-engine/runtime/GameRuntime'
import type { GameSessionServices } from '@/lib/game-engine/core/GameSession'

/**
 * Adapts the existing PixiEngine to the renderer-neutral React shell.
 * PixiEngine still owns its stage, assets and ticker.
 */
export class PixiRuntimeAdapter implements GameRuntime {
  public readonly rendererKind = 'pixi' as const
  private engine: PixiEngine | null = null

  constructor(private readonly gameFactory: GameFactory) {}

  public async init({ target, config }: GameRuntimeInit): Promise<void> {
    if (this.engine) {
      throw new Error('PixiRuntimeAdapter is already initialized.')
    }
    this.engine = new PixiEngine({ targetElement: target })
    await this.engine.init(config, this.gameFactory)
  }

  /**
   * Legacy PixiEngine starts the game at the end of init(); keep this method
   * idempotent so the shared GameplayView can use one lifecycle contract.
   */
  public start(): void {}

  public pause(): void {
    this.engine?.getCurrentGame()?.pause()
  }

  public resume(): void {
    this.engine?.getCurrentGame()?.resume()
  }

  public resize(width: number, height: number): void {
    this.engine?.getApp().resize(width, height)
  }

  public getServices(): GameSessionServices {
    if (!this.engine) {
      throw new Error('PixiRuntimeAdapter services are unavailable before init().')
    }
    return this.engine.getManagers()
  }

  public async destroy(): Promise<void> {
    const engine = this.engine
    this.engine = null
    await engine?.destroy()
  }
}
