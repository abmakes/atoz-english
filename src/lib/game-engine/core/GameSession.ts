import { EventBus } from '@/lib/pixi-engine/core/EventBus'
import { GameStateManager } from '@/lib/pixi-engine/core/GameStateManager'
import { RuleEngine } from '@/lib/pixi-engine/core/RuleEngine'
import { ControlsManager } from '@/lib/pixi-engine/core/ControlsManager'
import { StorageManager } from '@/lib/pixi-engine/core/StorageManager'
import { AudioManager, type AudioConfig } from '@/lib/pixi-engine/core/AudioManager'
import { ScoringManager } from '@/lib/pixi-engine/game/ScoringManager'
import { TimerManager } from '@/lib/pixi-engine/game/TimerManager'
import { PowerUpManager } from '@/lib/pixi-engine/game/PowerUpManager'
import type { GameConfig } from '@/lib/pixi-engine/config/GameConfig'
import { SETTINGS_EVENTS } from '@/lib/pixi-engine/core/EventTypes'
import { getThemeConfig } from '@/lib/themes'

export interface GameSessionServices {
  eventBus: EventBus
  gameStateManager: GameStateManager
  ruleEngine: RuleEngine
  controlsManager: ControlsManager
  storageManager: StorageManager
  audioManager: AudioManager
  scoringManager: ScoringManager
  timerManager: TimerManager
  powerUpManager: PowerUpManager
}

const DEFAULT_SOUNDS: AudioConfig[] = [
  { id: 'correct-sound', filename: 'correct-sound.mp3', volume: 0.2, type: 'sfx' },
  { id: 'incorrect-sound', filename: 'incorrect-sound.mp3', volume: 0.2, type: 'sfx' },
  {
    id: 'background-music',
    filename: 'background-music.mp3',
    loop: true,
    volume: 0.1,
    type: 'music',
  },
  { id: 'victory-sound', filename: 'crowd-cheering.mp3', volume: 0.7, type: 'sfx' },
]

/**
 * Owns services shared by Pixi and Three runtimes.
 *
 * Renderer setup remains outside this class. Config-dependent services are
 * initialized in dependency order, with RuleEngine deliberately last.
 */
export class GameSession {
  public readonly eventBus: EventBus
  public readonly storageManager: StorageManager
  public readonly gameStateManager: GameStateManager
  public readonly timerManager: TimerManager
  public readonly controlsManager: ControlsManager
  public readonly scoringManager: ScoringManager

  private ruleEngine: RuleEngine | null = null
  private audioManager: AudioManager | null = null
  private powerUpManager: PowerUpManager | null = null
  private initialized = false
  private destroyed = false

  constructor(options: { debugEvents?: boolean; storageNamespace?: string } = {}) {
    this.eventBus = new EventBus(options.debugEvents)
    this.storageManager = new StorageManager(options.storageNamespace)
    this.gameStateManager = new GameStateManager(this.eventBus)
    this.timerManager = new TimerManager(this.eventBus, this.storageManager)
    this.controlsManager = new ControlsManager()
    this.scoringManager = new ScoringManager(this.eventBus, this.storageManager)
  }

  public init(config: GameConfig): void {
    if (this.destroyed) {
      throw new Error('GameSession cannot be initialized after destroy().')
    }
    if (this.initialized) {
      throw new Error('GameSession is already initialized.')
    }

    // Required so setActiveTeam() can validate team IDs for HUD highlighting.
    this.gameStateManager.init(config)
    this.controlsManager.init(config.controls, this.eventBus)
    this.controlsManager.enable()
    this.scoringManager.init(config.teams, config.gameMode)

    this.powerUpManager = new PowerUpManager(this.eventBus, config)

    // Preserve the existing engine audio catalog and initial mute behavior.
    const theme = getThemeConfig('default')
    this.audioManager = new AudioManager(
      this.eventBus,
      this.storageManager,
      theme.soundsBasePath,
      config.initialMusicMuted,
      config.initialSfxMuted
    )
    DEFAULT_SOUNDS.forEach((sound) => this.audioManager?.registerSound(sound))

    this.eventBus.on(SETTINGS_EVENTS.SET_GLOBAL_VOLUME, this.handleGlobalVolume)
    this.eventBus.on(SETTINGS_EVENTS.SET_MUSIC_MUTED, this.handleMusicMuted)
    this.eventBus.on(SETTINGS_EVENTS.SET_SFX_MUTED, this.handleSfxMuted)

    // Non-negotiable: rules depend on all managers above and initialize last.
    this.ruleEngine = new RuleEngine(this.eventBus, config, {
      timerManager: this.timerManager,
      gameStateManager: this.gameStateManager,
      scoringManager: this.scoringManager,
      powerUpManager: this.powerUpManager,
      audioManager: this.audioManager,
      storageManager: this.storageManager,
    })

    this.initialized = true
  }

  public getServices(): GameSessionServices {
    if (
      !this.initialized ||
      !this.ruleEngine ||
      !this.audioManager ||
      !this.powerUpManager
    ) {
      throw new Error('GameSession services are unavailable before init().')
    }

    return {
      eventBus: this.eventBus,
      gameStateManager: this.gameStateManager,
      ruleEngine: this.ruleEngine,
      controlsManager: this.controlsManager,
      storageManager: this.storageManager,
      audioManager: this.audioManager,
      scoringManager: this.scoringManager,
      timerManager: this.timerManager,
      powerUpManager: this.powerUpManager,
    }
  }

  public isInitialized(): boolean {
    return this.initialized
  }

  public destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.initialized = false

    this.eventBus.off(SETTINGS_EVENTS.SET_GLOBAL_VOLUME, this.handleGlobalVolume)
    this.eventBus.off(SETTINGS_EVENTS.SET_MUSIC_MUTED, this.handleMusicMuted)
    this.eventBus.off(SETTINGS_EVENTS.SET_SFX_MUTED, this.handleSfxMuted)

    this.timerManager.stopAllTimers()
    this.ruleEngine?.destroy()
    this.powerUpManager?.destroy()
    this.scoringManager.destroy()
    this.controlsManager.destroy()
    this.audioManager?.destroy()
    this.gameStateManager.destroy()

    this.ruleEngine = null
    this.powerUpManager = null
    this.audioManager = null
  }

  private handleGlobalVolume = (volume: number): void => {
    this.audioManager?.setGlobalVolume(volume)
  }

  private handleMusicMuted = (muted: boolean): void => {
    this.audioManager?.setMusicMuted(muted)
  }

  private handleSfxMuted = (muted: boolean): void => {
    this.audioManager?.setSfxMuted(muted)
  }
}
