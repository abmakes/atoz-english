import type { GameConfig } from '@/lib/pixi-engine/config/GameConfig'
import type { GameSessionServices } from '@/lib/game-engine/core/GameSession'

export type RendererKind = 'pixi' | 'three'

export interface GameRuntimeInit {
  target: HTMLElement
  config: GameConfig
}

/**
 * Renderer-neutral lifecycle used by GameplayView.
 *
 * A runtime owns its renderer and frame loop. It exposes only shared game
 * services to React; Pixi Container and Three Object3D never cross this seam.
 */
export interface GameRuntime {
  readonly rendererKind: RendererKind

  init(options: GameRuntimeInit): Promise<void>
  start(): void
  pause(): void
  resume(): void
  resize(width: number, height: number): void
  getServices(): GameSessionServices
  destroy(): Promise<void>
}

export type GameRuntimeFactory = () => Promise<GameRuntime>
