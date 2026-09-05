import type { GameConfig } from '@/lib/pixi-engine/config/GameConfig'
import type { GameSessionServices } from '@/lib/game-engine/core/GameSession'
import type { QuizDataSource } from '@/lib/game-engine/quiz/QuizDataSource'
import type { ThreeWorld } from '@/lib/three-engine/ThreeWorld'

export interface ThreeGameContext {
  config: Readonly<GameConfig>
  services: GameSessionServices
  world: ThreeWorld
  quizDataSource: QuizDataSource
}

/**
 * Required contract for every 3D game module.
 *
 * Three games own Three scene objects and raycasting, but never construct
 * shared managers or mutate scores directly.
 */
export interface ThreeGame {
  init(): Promise<void>
  start(): void
  update(deltaMs: number): void
  pause(): void
  resume(): void
  onResize(width: number, height: number): void
  destroy(): void
}

export type ThreeGameFactory = (context: ThreeGameContext) => ThreeGame
