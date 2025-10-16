import { Game, Scene } from 'phaser';
import { EventBus } from './EventBus';
import { GameStateManager } from './GameStateManager';
import { ControlsManager } from './ControlsManager';
import { StorageManager } from './StorageManager';
import { AudioManager, AudioConfig } from './AudioManager';
import { RuleEngine } from './RuleEngine';
import { ScoringManager } from '../game/ScoringManager';
import { TimerManager } from '../game/TimerManager';
import { PowerUpManager } from '../game/PowerUpManager';
import { BaseGame } from '../game/BaseGame';
import { GameConfig } from '../config/GameConfig';
import { AssetLoader } from '../assets/AssetLoader';
import { getThemeConfig } from '../../themes';
import { ENGINE_EVENTS, SETTINGS_EVENTS, EngineResizedPayload } from './EventTypes';

/**
 * Defines the structure for the object containing all core engine managers.
 * This object is passed to the BaseGame instance upon creation.
 */
export interface PhaserEngineManagers {
  /** Central event bus for inter-component communication. */
  eventBus: EventBus;
  /** Manages the overall state of the game (e.g., loading, playing, paused, ended). */
  gameStateManager: GameStateManager;
  /** Handles user input mapping and processing. */
  controlsManager: ControlsManager;
  /** Provides an interface for persistent storage (e.g., localStorage). */
  storageManager: StorageManager;
  /** Manages audio playback and settings. */
  audioManager: AudioManager;
  /** Manages rule-based game logic and event processing. */
  ruleEngine: RuleEngine;
  /** Manages player/team scores and lives. */
  scoringManager: ScoringManager;
  /** Manages game timers (e.g., countdowns, elapsed time). */
  timerManager: TimerManager;
  /** Manages the logic and state of power-ups. */
  powerUpManager: PowerUpManager;
  /** Static class responsible for loading and managing game assets. */
  assetLoader: typeof AssetLoader;
  /** The core Phaser Game instance managing the canvas and rendering. */
  phaserGame: Game;
}

/**
 * Type definition for the factory function used to create a specific game instance.
 * @param config - The configuration object for the game.
 * @param managers - An object containing all the initialized engine managers.
 * @returns An instance of a class extending BaseGame.
 */
export type GameFactory = (config: GameConfig, managers: PhaserEngineManagers) => BaseGame;

/**
 * Simple interface defining width and height properties.
 */
interface ISize {
  width: number;
  height: number;
}

/**
 * Configuration options for initializing the PhaserEngine.
 * Extends Phaser Game config for base canvas/renderer settings.
 */
export type PhaserEngineOptions = Phaser.Types.Core.GameConfig & {
  /** Enable Phaser Devtools integration. Defaults to false. */
  debug?: boolean;
  /** Optional target DOM element to mount the Phaser canvas into. */
  targetElement?: HTMLDivElement | null;
};

/**
 * Orchestrates the Phaser Game, core managers, and the active game instance.
 * Provides lifecycle management (init, destroy) and access to managers.
 * 
 * This is a port from the PixiJS version, maintaining the same interface
 * and behavior while using Phaser's scene system and native features.
 */
export class PhaserEngine {
  /** The underlying Phaser Game instance. */
  private game: Game;
  /** Initial configuration options provided to the constructor. */
  private options: PhaserEngineOptions;
  /** Flag indicating if the engine has been successfully initialized. */
  private initialized = false;
  /** The active game configuration object, set during init. */
  private config: GameConfig | null = null;
  /** The currently active game instance (extends BaseGame). */
  private currentGame: BaseGame | null = null;
  /** The main game scene that contains the active game. */
  private gameScene: Scene | null = null;

  // Managers
  /** The central event bus instance. */
  private eventBus: EventBus;
  /** The game state manager instance. */
  private gameStateManager: GameStateManager;
  /** The controls manager instance. */
  private controlsManager: ControlsManager;
  /** The storage manager instance. */
  private storageManager: StorageManager;
  /** The audio manager instance. */
  private audioManager!: AudioManager;
  /** The rule engine instance. */
  private ruleEngine!: RuleEngine;
  /** The scoring manager instance. */
  private scoringManager: ScoringManager;
  /** The timer manager instance. */
  private timerManager: TimerManager;
  /** The power-up manager instance. */
  private powerUpManager!: PowerUpManager;

  /**
   * Creates an instance of PhaserEngine.
   * Initializes the core Phaser Game and base managers that don't require GameConfig.
   * @param {PhaserEngineOptions} [options={}] - Configuration options for the engine and Phaser game.
   */
  constructor(options: PhaserEngineOptions = {}) {
    this.options = options;
    
    // Create Phaser Game instance
    this.game = new Game({
      type: Phaser.AUTO,
      width: options.width || 800,
      height: options.height || 600,
      parent: options.targetElement || undefined,
      backgroundColor: options.backgroundColor || '#000000',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        ...options.scale
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: options.debug || false
        }
      },
      scene: {
        key: 'MainGameScene',
        create: (data: any) => this.createMainScene(data)
      },
      ...options
    });

    // Initialize core managers that don't depend on GameConfig yet
    this.eventBus = new EventBus();
    this.storageManager = new StorageManager();

    // Initialize managers that ONLY need eventBus and/or storageManager
    this.gameStateManager = new GameStateManager(this.eventBus);
    this.timerManager = new TimerManager(this.eventBus, this.storageManager);
    this.controlsManager = new ControlsManager();
    this.scoringManager = new ScoringManager(this.eventBus, this.storageManager);

    // Set up resize handling
    this.game.scale.on('resize', this.handleResize.bind(this));

    console.log('PhaserEngine created with Phaser Game instance');
  }

  /**
   * Creates the main game scene that will contain the active game.
   * @param {Phaser.Scene} scene - The Phaser scene instance.
   */
  private createMainScene(data: any): void {
    this.gameScene = data;
    console.log('Main game scene created');
  }

  /**
   * Initializes the engine with a specific game configuration and game implementation.
   * Sets up managers dependent on GameConfig, loads assets, creates the game instance,
   * and starts the update loop.
   * @param {GameConfig} config - The configuration for the specific game instance.
   * @param {GameFactory} gameFactory - A function that returns an instance of the specific BaseGame implementation.
   * @returns {Promise<void>} A promise that resolves when initialization is complete or rejects on error.
   */
  public async init(config: GameConfig, gameFactory: GameFactory): Promise<void> {
    if (this.initialized) {
      console.warn('PhaserEngine already initialized. Call destroy() first if you want to re-initialize.');
      return;
    }
    
    console.log('Initializing PhaserEngine with game config:', config.gameMode.name);
    this.config = config;
    
    try {
      // Wait for the main scene to be created
      if (!this.gameScene) {
        await new Promise<void>((resolve) => {
          const checkScene = () => {
            if (this.gameScene) {
              resolve();
            } else {
              setTimeout(checkScene, 10);
            }
          };
          checkScene();
        });
      }

      // Initialize AssetLoader with the main scene
      console.log('Initializing AssetLoader...');
      let bundleLoadPromise: Promise<unknown> = Promise.resolve();
      if (this.config && this.config.assets) {
        await AssetLoader.init(this.gameScene!);
        console.log('AssetLoader initialized.');
        
        if (this.config.assets.bundles && this.config.assets.bundles.length > 0) {
          const bundleNames = this.config.assets.bundles.map(b => b.name);
          console.log('Starting background loading of asset bundles:', bundleNames);
          // Use Promise.allSettled to handle individual bundle failures gracefully
          bundleLoadPromise = Promise.allSettled(bundleNames.map(bundleName =>
            AssetLoader.loadGameBundle(bundleName)
          ));
          bundleLoadPromise.then((results: any) => {
            const successful = results.filter((r: any) => r.status === 'fulfilled').length;
            const failed = results.filter((r: any) => r.status === 'rejected').length;
            console.log(`Asset bundle loading complete: ${successful} successful, ${failed} failed.`);
            if (failed > 0) {
              console.warn('Some asset bundles failed to load, but continuing...');
            }
          });
        } else {
          console.log('No asset bundles defined in config to preload.');
        }
      } else {
        console.warn('PhaserEngine: No assets configuration found in GameConfig.');
        await AssetLoader.init(this.gameScene!);
        console.log('AssetLoader initialized (no config).');
      }

      // Initialize Managers
      console.log('Initializing GameConfig-dependent managers...');

      // ControlsManager init
      if (this.config.controls) {
        this.controlsManager.init(this.config.controls, this.eventBus, this.gameScene!);
        this.controlsManager.enable(this.gameScene!);
      } else {
        console.warn("PhaserEngine: No controls configuration found in GameConfig.");
      }

      // ScoringManager init
      this.scoringManager.init(this.config.teams, this.config.gameMode);

      // PowerUpManager init
      this.powerUpManager = new PowerUpManager(this.eventBus, this.config);

      // Create AudioManager first
      const themeConfig = getThemeConfig('default');
      this.audioManager = new AudioManager(
        this.eventBus,
        this.storageManager,
        themeConfig.soundsBasePath,
        this.config.initialMusicMuted || false,
        this.config.initialSfxMuted || false
      );

      // RuleEngine init (after AudioManager is created)
      this.ruleEngine = new RuleEngine(this.eventBus, this.config, {
        gameStateManager: this.gameStateManager,
        scoringManager: this.scoringManager,
        powerUpManager: this.powerUpManager,
        timerManager: this.timerManager,
        storageManager: this.storageManager,
        audioManager: this.audioManager
      });

      // Register Default Sounds
      const defaultSounds: AudioConfig[] = [
        { id: 'correct-sound', filename: 'correct-sound.mp3', volume: 0.2, type: 'sfx' },
        { id: 'incorrect-sound', filename: 'incorrect-sound.mp3', volume: 0.2, type: 'sfx' },
        { id: 'background-music', filename: 'background-music.mp3', loop: true, volume: 0.1, type: 'music' },
        { id: 'victory-sound', filename: 'crowd-cheering.mp3', volume: 0.7, type: 'sfx' },
      ];
      defaultSounds.forEach(soundConfig => {
        try {
          this.audioManager.registerSound(soundConfig);
        } catch (error) {
          console.error(`Failed to register default sound ${soundConfig.id}:`, error);
        }
      });

      // Add Settings Listeners
      this.eventBus.on(SETTINGS_EVENTS.SET_GLOBAL_VOLUME, (volume: number) => {
        console.log(`[EventBus Listener] Received SET_GLOBAL_VOLUME: ${volume}`);
        this.audioManager.setGlobalVolume(volume);
      });
      this.eventBus.on(SETTINGS_EVENTS.SET_MUSIC_MUTED, (muted: boolean) => {
        console.log(`[EventBus Listener] Received SET_MUSIC_MUTED: ${muted}`);
        this.audioManager.setMusicMuted(muted);
      });
      this.eventBus.on(SETTINGS_EVENTS.SET_SFX_MUTED, (muted: boolean) => {
        console.log(`[EventBus Listener] Received SET_SFX_MUTED: ${muted}`);
        this.audioManager.setSfxMuted(muted);
      });

      // Emit Engine Ready Event
      console.log('PhaserEngine: Emitting ENGINE_READY_FOR_GAME');
      this.eventBus.emit(ENGINE_EVENTS.ENGINE_READY_FOR_GAME);

      // Game Creation and Initialization
      console.log('Creating game instance...');
      console.log('PhaserEngine: this.config =', this.config);
      const managers = this.getAllManagers();
      console.log('PhaserEngine: managers =', managers);
      this.currentGame = gameFactory(this.config, managers);

      // Note: BaseGame extends Phaser.Scene, so it's managed by Phaser's scene system
      // We need to wait for the scene to be created before calling our custom init
      console.log('Setting up game initialization after scene creation...');
      
      // Add the scene to the game first
      this.game.scene.add('MainGameScene', this.currentGame, true);
      
      // Set up a promise that resolves when the scene is created and our init is called
      const gameInitPromise = new Promise<void>((resolve, reject) => {
        // Wait for the scene to be fully initialized by Phaser
        // Use a timeout to ensure the scene's create() method has been called
        setTimeout(() => {
          console.log('Scene should be ready now, calling custom initializeGame()');
          // Now call our custom initializeGame after the scene's create() method has set currentState to INITIALIZED
          this.currentGame.initializeGame(bundleLoadPromise).then(() => {
            console.log('Game initialization complete.');
            resolve();
          }).catch((error) => {
            console.error('Error during game initialization:', error);
            reject(error);
          });
        }, 100); // Wait 100ms for the scene to be fully initialized
      });

      // Wait for the game initialization to complete
      await gameInitPromise;

      // Set up update loop using Phaser's scene update
      if (this.currentGame) {
        this.currentGame.events.on('update', this.handleUpdate.bind(this));
      }

      this.initialized = true;
      console.log('PhaserEngine initialization complete.');
      
    } catch (error) {
      console.error('Error during PhaserEngine initialization:', error);
      await this.destroy();
      throw error;
    }
  }

  /**
   * Gathers all manager instances into an object.
   * @private
   * @returns {PhaserEngineManagers} An object containing all manager instances.
   */
  private getAllManagers(): PhaserEngineManagers {
    if (!this.powerUpManager || !this.audioManager || !this.ruleEngine) {
      throw new Error('PhaserEngine: PowerUpManager, AudioManager, and RuleEngine must be initialized before calling getAllManagers()');
    }

    return {
      eventBus: this.eventBus,
      gameStateManager: this.gameStateManager,
      controlsManager: this.controlsManager,
      storageManager: this.storageManager,
      audioManager: this.audioManager,
      ruleEngine: this.ruleEngine,
      scoringManager: this.scoringManager,
      timerManager: this.timerManager,
      powerUpManager: this.powerUpManager,
      assetLoader: AssetLoader,
      phaserGame: this.game
    };
  }

  /**
   * Handles the main update loop.
   * @param {number} time - The current time.
   * @param {number} delta - The time delta since last update.
   */
  private handleUpdate(time: number, delta: number): void {
    if (this.currentGame) {
      this.currentGame.updateImplementation(delta);
    }
  }

  /**
   * Handles window resize events.
   * @param {Phaser.Structs.Size} gameSize - The new game size.
   */
  private handleResize(gameSize: Phaser.Structs.Size): void {
    console.log(`PhaserEngine: Resize detected - ${gameSize.width}x${gameSize.height}`);
    
    const payload: EngineResizedPayload = {
      width: gameSize.width,
      height: gameSize.height
    };
    
    this.eventBus.emit(ENGINE_EVENTS.RESIZED, payload);
  }

  /**
   * Gets the current game instance.
   * @returns {BaseGame | null} The current game instance or null if none is active.
   */
  public getCurrentGame(): BaseGame | null {
    return this.currentGame;
  }

  /**
   * Gets the Phaser Game instance.
   * @returns {Game} The Phaser Game instance.
   */
  public getGame(): Game {
    return this.game;
  }

  /**
   * Gets the main game scene.
   * @returns {Scene | null} The main game scene or null if not created.
   */
  public getGameScene(): Scene | null {
    return this.gameScene;
  }

  /**
   * Gets the current screen size.
   * @returns {ISize} The current screen dimensions.
   */
  public getScreenSize(): ISize {
    return {
      width: this.game.scale.width,
      height: this.game.scale.height
    };
  }

  /**
   * Gets all manager instances.
   * @returns {PhaserEngineManagers} An object containing all manager instances.
   */
  public getManagers(): PhaserEngineManagers {
    return this.getAllManagers();
  }

  /**
   * Gets a specific manager by type.
   * @template T - The type of manager to retrieve.
   * @param {keyof PhaserEngineManagers} managerName - The name of the manager to retrieve.
   * @returns {T} The requested manager instance.
   */
  public getManager<T extends keyof PhaserEngineManagers>(managerName: T): PhaserEngineManagers[T] {
    // Allow access to eventBus before full initialization
    if (managerName === 'eventBus') {
      return this.eventBus as PhaserEngineManagers[T];
    }
    
    const managers = this.getAllManagers();
    return managers[managerName];
  }

  /**
   * Pauses the game and all timers.
   */
  public pause(): void {
    if (this.currentGame) {
      this.currentGame.pause();
    }
    this.game.scene.pause('MainGameScene');
    console.log('PhaserEngine: Game paused');
  }

  /**
   * Resumes the game and all timers.
   */
  public resume(): void {
    if (this.currentGame) {
      this.currentGame.resume();
    }
    this.game.scene.resume('MainGameScene');
    console.log('PhaserEngine: Game resumed');
  }

  /**
   * Destroys the engine and cleans up all resources.
   * @returns {Promise<void>} A promise that resolves when cleanup is complete.
   */
  public async destroy(): Promise<void> {
    if (!this.initialized) {
      console.warn('PhaserEngine already destroyed or never initialized.');
      return;
    }

    console.log('Destroying PhaserEngine...');

    try {
      // Destroy the current game
      if (this.currentGame) {
        await this.currentGame.destroy();
        this.currentGame = null;
      }

      // Remove update listener
      if (this.gameScene) {
        this.gameScene.events.off('update', this.handleUpdate);
      }

      // Destroy managers
      this.controlsManager?.destroy();
      this.audioManager?.destroy();
      this.ruleEngine?.destroy();
      this.timerManager?.destroy();
      this.powerUpManager?.destroy();
      this.scoringManager?.destroy();
      this.gameStateManager?.destroy();
      this.storageManager?.clear();
      this.eventBus?.destroy();

      // Destroy the Phaser game
      this.game.destroy(true);

      this.initialized = false;
      console.log('PhaserEngine destroyed successfully.');
      
    } catch (error) {
      console.error('Error during PhaserEngine destruction:', error);
      throw error;
    }
  }
}
