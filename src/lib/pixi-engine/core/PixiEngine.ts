import { Ticker, Assets } from 'pixi.js';
import { PixiApplication, PixiApplicationOptions } from './PixiApplication';
import { initDevtools } from '@pixi/devtools';
import { EventBus } from './EventBus';
import { GameStateManager } from './GameStateManager';
import { RuleEngine } from './RuleEngine';
import { ControlsManager } from './ControlsManager';
import { StorageManager } from './StorageManager';
import { ScoringManager } from '../game/ScoringManager';
import { TimerManager } from '../game/TimerManager';
import { PowerUpManager } from '../game/PowerUpManager';
import { BaseGame } from '../game/BaseGame';
import { GameConfig } from '../config/GameConfig';
import { AssetLoader } from '../assets/AssetLoader';

/**
 * Defines the structure for the object containing all core engine managers.
 * This object is passed to the BaseGame instance upon creation.
 */
export interface PixiEngineManagers {
  /** Central event bus for inter-component communication. */
  eventBus: EventBus;
  /** Manages the overall state of the game (e.g., loading, playing, paused, ended). */
  gameStateManager: GameStateManager;
  /** Processes game events against defined rules to trigger actions. */
  ruleEngine: RuleEngine;
  /** Handles user input mapping and processing. */
  controlsManager: ControlsManager;
  /** Provides an interface for persistent storage (e.g., localStorage). */
  storageManager: StorageManager;
  /** Manages player/team scores and lives. */
  scoringManager: ScoringManager;
  /** Manages game timers (e.g., countdowns, elapsed time). */
  timerManager: TimerManager;
  /** Manages the logic and state of power-ups. */
  powerUpManager: PowerUpManager;
  /** Static class responsible for loading and managing game assets. */
  assetLoader: typeof AssetLoader;
  /** The core PixiApplication instance managing the canvas and rendering. */
  pixiApp: PixiApplication;
}

/**
 * Type definition for the factory function used to create a specific game instance.
 * @param config - The configuration object for the game.
 * @param managers - An object containing all the initialized engine managers.
 * @returns An instance of a class extending BaseGame.
 */
export type GameFactory = (config: GameConfig, managers: PixiEngineManagers) => BaseGame;

/**
 * Simple interface defining width and height properties.
 */
interface ISize {
  width: number;
  height: number;
}

/**
 * Configuration options for initializing the PixiEngine.
 * Extends PixiApplicationOptions for base canvas/renderer settings.
 */
export type PixiEngineOptions = PixiApplicationOptions & {
  /** Enable Pixi Devtools integration. Defaults to false. */
  debug?: boolean;
  /** Optional target DOM element to mount the Pixi canvas into. */
    targetElement?: HTMLDivElement | null; // Optional target element
  };

/**
 * Orchestrates the Pixi.js application, core managers, and the active game instance.
 * Provides lifecycle management (init, destroy) and access to managers.
 */
export class PixiEngine {
  /** The underlying PixiApplication instance. */
  private app: PixiApplication;
  /** Initial configuration options provided to the constructor. */
  private options: PixiEngineOptions;
  /** Flag indicating if the engine has been successfully initialized. */
  private initialized = false;
  /** The active game configuration object, set during init. */
  private config: GameConfig | null = null;
  /** The currently active game instance (extends BaseGame). */
  private currentGame: BaseGame | null = null;

  // Managers
  /** The central event bus instance. */
  private eventBus: EventBus;
  /** The game state manager instance. */
  private gameStateManager: GameStateManager;
  /** The rule engine instance (initialized in init). */
  private ruleEngine!: RuleEngine; // Definite assignment assertion
  /** The controls manager instance. */
  private controlsManager: ControlsManager;
  /** The storage manager instance. */
  private storageManager: StorageManager;
  /** The scoring manager instance. */
  private scoringManager: ScoringManager;
  /** The timer manager instance. */
  private timerManager: TimerManager;
  /** The power-up manager instance (initialized in init). */
  private powerUpManager!: PowerUpManager; // Definite assignment assertion

  /**
   * Creates an instance of PixiEngine.
   * Initializes the core PixiApplication and base managers that don't require GameConfig.
   * @param {PixiEngineOptions} [options={}] - Configuration options for the engine and Pixi app.
   */
  constructor(options: PixiEngineOptions = {}) {
    this.options = options;
    this.app = new PixiApplication({...this.options, targetElement: options.targetElement });

    // Initialize core managers that don't depend on GameConfig yet
    this.eventBus = new EventBus();
    this.storageManager = new StorageManager(); // Assumes StorageManager doesn't need config at init

    // Initialize managers that ONLY need eventBus and/or storageManager
    this.gameStateManager = new GameStateManager(this.eventBus);
    this.timerManager = new TimerManager(this.eventBus, this.storageManager);
    this.controlsManager = new ControlsManager(); // Init called later with config
    this.scoringManager = new ScoringManager(this.eventBus, this.storageManager); // Now takes storageManager

    // Managers requiring GameConfig (powerUpManager, ruleEngine) are initialized in init()

    if (options.debug) {
       initDevtools({ app: this.app.getApp() });
    }
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
      console.warn('PixiEngine already initialized. Call destroy() first if you want to re-initialize.');
      return;
    }
    
    console.log('Initializing PixiEngine with game config:', config.gameMode.name);
    this.config = config;
    
    try {
      // Initialize the PixiApplication
      await this.app.init();
      
      // Initialize/Configure managers that depend on GameConfig
      console.log('Initializing GameConfig-dependent managers...');

      // ControlsManager init
      if (this.config.controls) {
        this.controlsManager.init(this.config.controls, this.eventBus);
        this.controlsManager.enable(); // Enable controls after init
      } else {
        console.warn("PixiEngine: No controls configuration found in GameConfig.");
      }

      // ScoringManager init
      this.scoringManager.init(this.config.teams, this.config.gameMode);

      // PowerUpManager init
      this.powerUpManager = new PowerUpManager(this.eventBus, this.config); // Use this.config

      // RuleEngine init (needs other managers)
      this.ruleEngine = new RuleEngine(this.eventBus, this.config, { // Use this.config
          timerManager: this.timerManager,
          gameStateManager: this.gameStateManager,
          scoringManager: this.scoringManager,
          powerUpManager: this.powerUpManager // Pass the initialized powerUpManager
      });

      // --- Asset Initialization (Static) ---
      console.log('Initializing PixiJS Assets...');
      if (this.config.assets) {
         const manifest = { bundles: this.config.assets.bundles };
         await Assets.init({
            basePath: this.config.assets.basePath,
            manifest: manifest
         });
         console.log('PixiJS Assets initialized.');
         if (this.config.assets.bundles && this.config.assets.bundles.length > 0) {
             console.log('Loading all defined asset bundles:', this.config.assets.bundles.map(b => b.name));
             await Promise.all(this.config.assets.bundles.map(bundle =>
                 Assets.loadBundle(bundle.name)
             ));
             console.log('All defined asset bundles loaded.');
         } else {
            console.log('No asset bundles defined in config.');
         }
      } else {
          console.warn("PixiEngine: No assets configuration found in GameConfig. Assets not initialized.");
      }
      // --- End Asset Initialization ---

      // --- Mark engine as initialized BEFORE creating game instance ---
      this.initialized = true;
      // -------------------------------------------------------------

      // Instantiate the specific game using the factory
      console.log('Creating game instance...');
      this.currentGame = gameFactory(this.config, this.getManagers());
      if (!this.currentGame || !(this.currentGame instanceof BaseGame)) {
          throw new Error("Game factory did not return a valid BaseGame instance.");
      }
      this.app.getStage().addChild(this.currentGame.view);

      // Initialize the game
      console.log('Initializing game...');
      await this.currentGame.init();

      // Set up update loop
      this.app.getApp().ticker.add(this.handleUpdate);

      // Set up resize handling
      this.app.onResize(this.handleResize);
      // Initial resize call
      this.handleResize(this.app.getScreenSize().width, this.app.getScreenSize().height);

      // TODO: Define 'engineInitialized' event in EventBus
      // this.eventBus.emit('engineInitialized', this);
      console.log('PixiEngine initialized successfully');
    } catch (error) {
      console.error('Error initializing PixiEngine:', error);
      // TODO: Define 'engineError' event in EventBus
      // this.eventBus.emit('engineError', { type: 'initialization', error });
      await this.destroy(); // Attempt cleanup on failed init
      throw error; // Rethrow the error after cleanup attempt
    }
  }

  /**
   * Gathers all manager instances into an object.
   * Internal helper method.
   * @private
   * @returns {PixiEngineManagers} An object containing all manager instances.
   * @throws {Error} If called before PowerUpManager and RuleEngine are initialized.
   */
  private getAllManagers(): PixiEngineManagers {
       // Ensure managers initialized in init() are available
       if (!this.powerUpManager || !this.ruleEngine) {
           throw new Error("Cannot get all managers before PowerUpManager and RuleEngine are initialized in PixiEngine.init()");
       }
      return {
          eventBus: this.eventBus,
          gameStateManager: this.gameStateManager,
          ruleEngine: this.ruleEngine,
          controlsManager: this.controlsManager,
          storageManager: this.storageManager,
          scoringManager: this.scoringManager,
          timerManager: this.timerManager,
          powerUpManager: this.powerUpManager,
          assetLoader: AssetLoader,
          pixiApp: this.app
      };
  }

  /**
   * Gets all initialized manager instances.
   * Throws an error if called before the engine is fully initialized.
   * @public
   * @returns {PixiEngineManagers} An object containing all manager instances.
   * @throws {Error} If called before the engine is fully initialized.
   */
  public getManagers(): PixiEngineManagers {
      if (!this.initialized || !this.powerUpManager || !this.ruleEngine) {
          throw new Error("PixiEngine.getManagers() called before engine was fully initialized.");
      }
      // Use the private method to construct the object
      return this.getAllManagers();
  }

  /**
   * Handles the ticker update event from PixiApplication.
   * Calculates delta time and calls the main update method.
   * @private
   * @param {Ticker} ticker - The Pixi Ticker instance providing delta time.
   */
  private handleUpdate = (ticker: Ticker): void => {
    // Pixi Ticker v8 uses Ticker.deltaMS
    const deltaTimeMs = ticker.deltaMS;
    // Convert to seconds if needed by downstream update methods, or pass ms directly
    // const deltaTimeSeconds = deltaTimeMs / 1000;
    this.update(deltaTimeMs); // Passing milliseconds
  };

  /**
   * Main update loop, called each frame by the ticker handler.
   * Drives manager and game updates.
   * @private
   * @param {number} deltaTimeMs - Time elapsed since the last frame (in milliseconds).
   */
  private update = (deltaTimeMs: number): void => { // Changed parameter name to reflect ms
    if (!this.initialized || !this.currentGame) {
      return;
    }
    
    try {
        // TODO: Define 'enginePreUpdate' event in EventBus
        // this.eventBus.emit('enginePreUpdate', deltaTimeMs);

        // Update managers that need per-frame updates
        // this.timerManager.update(deltaTimeMs); // Removed - TimerManager updates internally
        // this.controlsManager.update(deltaTimeMs); // ControlsManager might not need a delta time update
        // this.gameStateManager.update(deltaTimeMs); // If needed
        this.powerUpManager.update(deltaTimeMs); // Pass milliseconds

        // Update the current game
        this.currentGame.update(deltaTimeMs); // Pass milliseconds

        // Explicit render call (often not needed with autoStart=true)
        // this.app.getApp().renderer.render(this.app.getStage());

        // TODO: Define 'enginePostUpdate' event in EventBus
        // this.eventBus.emit('enginePostUpdate', deltaTimeMs);
    } catch (error) {
        console.error("Error during engine update:", error);
        // TODO: Define 'engineError' event in EventBus
        // this.eventBus.emit('engineError', { type: 'update', error });
    }
  };

   /**
    * Handles the resize event from PixiApplication.
    * Notifies the current game instance of the resize.
    * @private
    * @param {number} width - The new width of the application.
    * @param {number} height - The new height of the application.
    */
    private handleResize = (width: number, height: number): void => {
     if (!this.initialized) return;
     console.log(`PixiEngine: Resizing to ${width}x${height}`);
     // TODO: Define 'engineResize' event in EventBus
     // this.eventBus.emit('engineResize', { width, height });

     // Notify the current game
     this.currentGame?.onResize(width, height);

     // Notify managers if they need to know about resize
     // TODO: Implement onResize(width, height) in ControlsManager if needed
     // this.controlsManager?.onResize(width, height);
   };

  /**
   * Cleans up resources, stops the ticker, destroys the Pixi application and current game.
   * Resets the engine state to uninitialized.
   * @public
   * @returns {Promise<void>} A promise that resolves when destruction is complete.
   */
  public async destroy(): Promise<void> {
    if (!this.initialized && !this.app) {
        console.warn("PixiEngine already destroyed or never initialized.");
        return;
    }
    console.log("Destroying PixiEngine...");
    this.initialized = false;

    try {
        // TODO: Define 'engineDestroyStart' event in EventBus
        // this.eventBus.emit('engineDestroyStart');

        // Remove ticker listener first
        if (this.app?.getApp()?.ticker) {
            this.app.getApp().ticker.remove(this.handleUpdate);
        }
         // Remove resize listener - Handled by app.destroy()
        // this.app?.offResize(this.handleResize);

        // Destroy the current game
        if (this.currentGame) {
            console.log("Destroying current game...");
            this.app?.getStage()?.removeChild(this.currentGame.view);
            this.currentGame.destroy(); // Assumes BaseGame has destroy()
            this.currentGame = null;
        }

        // Destroy managers (in reverse dependency order if possible)
        console.log("Destroying managers...");
        // Call destroy on managers that have it
        this.ruleEngine?.destroy(); // Destroy RuleEngine
        this.powerUpManager?.destroy(); // Destroy PowerUpManager
        this.scoringManager?.destroy(); // Destroy ScoringManager
        this.controlsManager?.destroy(); // Destroy ControlsManager
        // No destroy for TimerManager, AssetLoader, StorageManager, EventBus
        // this.timerManager?.destroy(); // Removed
        // this.gameStateManager?.destroy(); // Destroy GameStateManager
        // this.storageManager?.destroy(); // Removed
        // this.eventBus?.destroy(); // Removed
        // TODO: Implement destroy() in GameStateManager if needed
        // TODO: Consider calling storageManager.clear() if appropriate


        // Destroy the PixiApplication
        if (this.app) {
             console.log("Destroying PixiApplication...");
             await this.app.destroy();
             // @ts-expect-error - Allow setting app to null after destroy
             this.app = null;
        }

        this.config = null;

        // Clear manager references
        // @ts-expect-error Allow null assignments
        this.eventBus = null;
        // @ts-expect-error Allow null assignments
        this.gameStateManager = null;
        // @ts-expect-error Allow null assignments
        this.ruleEngine = null;
        // @ts-expect-error Allow null assignments
        this.controlsManager = null;
        // @ts-expect-error Allow null assignments
        this.storageManager = null;
        // @ts-expect-error Allow null assignments
        this.scoringManager = null;
        // @ts-expect-error Allow null assignments
        this.timerManager = null;
        // @ts-expect-error Allow null assignments
        this.powerUpManager = null;


        console.log("PixiEngine destroyed successfully.");
    } catch (error) {
        console.error("Error during PixiEngine destruction:", error);
        // TODO: Define 'engineError' event in EventBus
        // this.eventBus?.emit('engineError', { type: 'destruction', error });
        // Ensure app reference is cleared even on error
        // @ts-expect-error - Allow setting app to null after destroy
        this.app = null;
    }
  }

  /**
   * Gets the underlying PixiApplication instance.
   * @public
   * @returns {PixiApplication} The PixiApplication instance.
   */
  public getApp(): PixiApplication {
    if (!this.app) throw new Error("PixiApplication is not available.");
    return this.app;
  }

  /**
   * Gets the EventBus instance.
   * @public
   * @returns {EventBus} The EventBus instance.
   */
  public getEventBus(): EventBus {
    if (!this.eventBus) throw new Error("EventBus is not available.");
    return this.eventBus;
  }

  /**
   * Gets the GameStateManager instance.
   * @public
   * @returns {GameStateManager} The GameStateManager instance.
   */
  public getGameStateManager(): GameStateManager {
    if (!this.gameStateManager) throw new Error("GameStateManager is not available.");
    return this.gameStateManager;
  }

  /**
   * Get the RuleEngine instance.
   */
  public getRuleEngine(): RuleEngine {
      if (!this.ruleEngine) throw new Error("RuleEngine is not available.");
      return this.ruleEngine;
  }

  /**
   * Get the ControlsManager instance.
   */
  public getControlsManager(): ControlsManager {
      if (!this.controlsManager) throw new Error("ControlsManager is not available.");
      return this.controlsManager;
  }

   /**
    * Get the StorageManager instance.
    */
   public getStorageManager(): StorageManager {
       if (!this.storageManager) throw new Error("StorageManager is not available.");
       return this.storageManager;
   }

  /**
   * Get the ScoringManager instance.
   */
  public getScoringManager(): ScoringManager {
      if (!this.scoringManager) throw new Error("ScoringManager is not available.");
      return this.scoringManager;
  }

  /**
   * Get the TimerManager instance.
   */
  public getTimerManager(): TimerManager {
      if (!this.timerManager) throw new Error("TimerManager is not available.");
      return this.timerManager;
  }

  /**
   * Get the PowerUpManager instance.
   */
  public getPowerUpManager(): PowerUpManager {
      if (!this.powerUpManager) throw new Error("PowerUpManager is not available.");
      return this.powerUpManager;
  }

  /**
   * Get the current BaseGame instance.
   */
  public getCurrentGame(): BaseGame | null {
    return this.currentGame;
  }

  /**
   * Get the current GameConfig.
   */
  public getGameConfig(): Readonly<GameConfig> | null {
      return this.config ? Object.freeze(this.config) : null;
  }

  /**
   * Check if the engine is initialized.
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the screen size of the PixiApplication
   */
  public getScreenSize(): ISize {
    if (!this.app) {
      console.warn("PixiEngine.getScreenSize: PixiApplication not initialized yet.");
      // Return default or configured size
      return { width: this.options.width ?? 800, height: this.options.height ?? 600 };
    }
    return this.app.getScreenSize();
  }
}

// Keep export {} if needed for module context, otherwise remove
// export {};