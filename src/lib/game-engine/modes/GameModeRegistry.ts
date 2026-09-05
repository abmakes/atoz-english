import type {
  AssetConfig,
  ControlsConfig,
} from '@/lib/pixi-engine/config/GameConfig'
import type {
  EligibilityQuiz,
  GameModeId,
} from '@/lib/game-mode-eligibility'
import type {
  GameRuntimeFactory,
  RendererKind,
} from '@/lib/game-engine/runtime/GameRuntime'

export interface GameModeDefinition {
  slug: GameModeId
  title: string
  description: string
  thumbnail: string
  renderer: RendererKind
  questionTimerId: string
  isEligible(quiz: EligibilityQuiz): boolean
  getBlockReason(quiz: EligibilityQuiz): string | null
  buildControls(defaults: ControlsConfig): ControlsConfig
  buildAssets(defaults: AssetConfig): AssetConfig
  loadRuntime: GameRuntimeFactory
}

/**
 * Explicit mode registry. Unknown slugs are errors rather than silently
 * falling through to Multiple Choice.
 */
export class GameModeRegistry {
  private readonly definitions = new Map<GameModeId, GameModeDefinition>()

  public register(definition: GameModeDefinition): this {
    if (this.definitions.has(definition.slug)) {
      throw new Error(`Game mode '${definition.slug}' is already registered.`)
    }
    this.definitions.set(definition.slug, definition)
    return this
  }

  public get(slug: string): GameModeDefinition | undefined {
    return this.definitions.get(slug as GameModeId)
  }

  public require(slug: string): GameModeDefinition {
    const definition = this.get(slug)
    if (!definition) {
      throw new Error(`Unknown game mode '${slug}'.`)
    }
    return definition
  }

  public list(): readonly GameModeDefinition[] {
    return Object.freeze([...this.definitions.values()])
  }
}
