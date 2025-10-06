import { Scene } from 'phaser';
import { PhaserEngineManagers } from '../core/PhaserEngine';
import { getThemeConfig } from '../../themes';
import type { PixiThemeConfig } from '../../themes';
import { GameConfig, validateGameConfig } from '../config/GameConfig';
import { 
  EngineEvents, 
  TRANSITION_EVENTS,
  TransitionPowerupSelectedPayload
} from '../core/EventTypes';
import { v4 as uuidv4 } from 'uuid';
import { TransitionScreen, TransitionScreenConfig } from '../ui/TransitionScreen';

// Extend GameConfig with missing properties used in this class
declare module '../config/GameConfig' {
  interface GameConfig {
    fixedUpdateFPS?: number;
    maxFPS?: number;
    targetFPS?: number;
    maxFixedUpdatesPerFrame?: number;
    clearBeforeRender?: boolean;
  }
}

// Add extended ENGINE_EVENTS constants
declare module '../core/EventTypes' {
  interface EngineEvents {
    'engine:fpsUpdated': (payload: { fps: number; targetFPS: number }) => void;
    'engine:beforeFixedUpdate': (payload: { deltaTime: number }) => void;
    'engine:afterFixedUpdate': (payload: { deltaTime: number }) => void;
    'engine:gameSpeedChanged': (payload: { speed: number; previousSpeed: number }) => void;
  }
}

// Add additional ENGINE_EVENTS constants
const EXTENDED_ENGINE_EVENTS = {
  FPS_UPDATED: 'engine:fpsUpdated' as const,
  BEFORE_FIXED_UPDATE: 'engine:beforeFixedUpdate' as const,
  AFTER_FIXED_UPDATE: 'engine:afterFixedUpdate' as const,
  GAME_SPEED_CHANGED: 'engine:gameSpeedChanged' as const
};

/**
 * Enumeration of standard layers for consistent Z-ordering
 */
export enum RenderLayer {
  BACKGROUND = 0,
  TERRAIN = 10,
  OBJECTS = 20,
  CHARACTERS = 30,
  FOREGROUND = 40,
  UI = 50,
  UI_FOREGROUND = 60,
  EFFECTS = 70,
  DEBUG = 100
}

/**
 * Represents the possible states of a game instance.
 */
export enum GameState {
  NOT_INITIALIZED = 'notInitialized',
  INITIALIZED = 'initialized',
  STARTED = 'started',
  PAUSED = 'paused',
  ENDED = 'ended'
}

/**
 * Basic game state interface that all game states should extend.
 * Provides common properties used across different game types.
 */
export interface BaseGameState {
  /** 
   * Current high-level phase of the game.
   * Standard phases include: 'loading', 'ready', 'playing', 'paused', 'transition', 'gameOver'.
   * Games can define additional phases internally.
   */
  phase?: string;
  /** Score information by team/player */
  scores?: Record<string, number>;
  /** Currently active team/player */
  activeTeam?: string | number;
  /** Remaining time (if timed) */
  timeRemaining?: number;
  /** Custom parameters for this game instance */
  params?: Record<string, unknown>;
  /** Additional properties for extensibility */
  [key: string]: unknown;
}

/**
 * Represents timing information for a single frame
 */
interface FrameTiming {
  /** Time elapsed since the last frame in seconds */
  deltaTime: number;
  /** Time elapsed since the last frame in seconds, multiplied by timeScale */
  scaledDeltaTime: number;
  /** Current time scaling factor (for slow-motion or speed-up effects) */
  timeScale: number;
  /** Total game time elapsed in seconds */
  elapsedTime: number;
  /** Accumulated time for fixed timestep updates */
  fixedTimeAccumulator: number;
}

/**
 * Configuration change event structure for configuration updates
 */
export interface ConfigChangeEvent {
  /** Path to the configuration property that changed (dot notation) */
  path: string;
  /** Previous value of the changed property */
  oldValue: unknown;
  /** New value of the changed property */
  newValue: unknown;
  /** Source of the configuration change */
  source: 'user' | 'system' | 'runtime';
}

/**
 * Result of a configuration validation operation
 */
export interface ConfigValidationResult {
  /** Whether the configuration change is valid */
  valid: boolean;
  /** Optional array of error messages if validation failed */
  errors?: string[];
}

/**
 * Abstract base class for all specific game implementations within the PhaserEngine.
 * Extends Phaser.Scene to provide a standard structure for game lifecycle methods 
 * and grants access to shared engine managers.
 * 
 * ## Game Lifecycle:
 * 1. Constructor: Sets up manager references and creates the view container
 * 2. init(): Asynchronously initializes the game (UI setup, event binding)
 * 3. start(): Begins actual gameplay after initialization
 * 4. update()/render(): Called each frame during active gameplay
 * 5. pause()/resume(): Temporarily suspends/resumes gameplay
 * 6. end(): Finalizes the game (scores, outcomes, triggers game over)
 * 7. destroy(): Cleans up all resources
 * 
 * Subclasses must implement all abstract methods to create a fully functioning game.
 */
export abstract class BaseGame<TGameState extends BaseGameState = BaseGameState> extends Scene {
  /** 
   * A read-only reference to the specific configuration object 
   * provided when this game instance was created.
   */
  protected readonly config: Readonly<GameConfig>;

  /** 
   * A read-only reference to the specific theme configuration 
   * loaded based on the game config's theme ID.
   */
  protected readonly themeConfig: Readonly<PixiThemeConfig>;

  /** 
   * A read-only reference to all engine managers.
   * Provides access to EventBus, GameStateManager, ScoringManager, etc.
   */
  protected readonly managers: Readonly<PhaserEngineManagers>;

  /** 
   * The current state of this game instance.
   * Subclasses should extend BaseGameState to add game-specific properties.
   */
  protected gameState: TGameState;

  /** 
   * The current high-level state of the game (initialized, started, paused, ended).
   */
  protected currentState: GameState = GameState.NOT_INITIALIZED;

  /** 
   * Unique identifier for this game instance.
   */
  protected readonly gameId: string;

  /** 
   * Event listeners registered by this game instance.
   * Used for automatic cleanup during destroy().
   */
  private eventListeners: Array<{ event: string; listener: (...args: unknown[]) => void }> = [];

  /** 
   * Custom renderers registered with this game instance.
   */
  private customRenderers: Map<string, { renderer: () => void; priority: number }> = new Map();

  /** 
   * Timing information for the current frame.
   */
  private frameTiming: FrameTiming = {
    deltaTime: 0,
    scaledDeltaTime: 0,
    timeScale: 1,
    elapsedTime: 0,
    fixedTimeAccumulator: 0
  };

  /** 
   * The transition screen instance for this game.
   */
  protected transitionScreen: TransitionScreen;

  /**
   * Creates a new BaseGame instance.
   * @param {GameConfig} config - The configuration object for this game instance.
   * @param {PhaserEngineManagers} managers - Object containing all engine manager instances.
   */
  constructor(config: GameConfig, managers: PhaserEngineManagers) {
    // Call Phaser Scene constructor with a unique key
    super({ key: `Game_${uuidv4()}` });
    
    // Validate configuration
    const validation = validateGameConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid game configuration: ${validation.errors?.join(', ')}`);
    }

    this.config = Object.freeze({ ...config });
    this.managers = Object.freeze(managers);
    this.gameId = uuidv4();
    
    // Load theme configuration
    this.themeConfig = getThemeConfig(this.config.themeId || 'default');
    
    // Initialize game state
    this.gameState = this.createInitialState();
    
    // Create and add the transition screen early in the BaseGame constructor
    this.transitionScreen = new TransitionScreen(
      this, // Pass the Phaser Scene instance
      this.managers.eventBus, 
      this.managers.powerUpManager,
      this.managers.gameStateManager,
      this.managers.assetLoader
    );
    // Add to the highest UI layer
    this.addToLayer(this.transitionScreen, RenderLayer.UI_FOREGROUND);

    // Add listener for the new power-up selection event
    this.registerEventListener(TRANSITION_EVENTS.POWERUP_SELECTED, this._handlePowerupSelected.bind(this));
  }

  /**
   * Creates the initial state for this game instance.
   * Must be implemented by subclasses to define game-specific initial state.
   * @returns {TGameState} The initial game state.
   */
  protected abstract createInitialState(): TGameState;

  /**
   * Asynchronously initializes the game implementation.
   * Called after the engine is ready and assets are loaded.
   * @param {Promise<unknown>} engineAssetsPromise - Promise that resolves when engine assets are loaded.
   * @returns {Promise<void>} A promise that resolves when initialization is complete.
   */
  protected abstract initImplementation(engineAssetsPromise: Promise<unknown>): Promise<void>;

  /**
   * Called when the game should start.
   * Implement game-specific start logic here.
   */
  protected abstract startImplementation(): void;

  /**
   * Called each frame to update game logic.
   * @param {number} delta - Time elapsed since last frame in milliseconds.
   */
  protected abstract updateImplementation(delta: number): void;

  /**
   * Called when the game should end.
   * Implement game-specific end logic here.
   */
  protected abstract endImplementation(): void;

  /**
   * Called when the game should be destroyed.
   * Implement game-specific cleanup logic here.
   */
  protected abstract destroyImplementation(): void;

  /**
   * Phaser Scene create method - called when the scene is created.
   * This replaces the old init() method from PixiJS version.
   */
  create(): void {
    console.log(`[BaseGame] Scene created: ${this.scene.key}`);
    this.currentState = GameState.INITIALIZED;
  }

  /**
   * Phaser Scene update method - called each frame.
   * @param {number} time - Current time.
   * @param {number} delta - Time delta since last frame.
   */
  update(time: number, delta: number): void {
    if (this.currentState !== GameState.STARTED) {
      return;
    }

    // Update frame timing
    this.frameTiming.deltaTime = delta / 1000; // Convert to seconds
    this.frameTiming.scaledDeltaTime = this.frameTiming.deltaTime * this.frameTiming.timeScale;
    this.frameTiming.elapsedTime += this.frameTiming.deltaTime;

    // Call implementation
    this.updateImplementation(delta);
  }

  /**
   * Initializes the game with engine assets.
   * @param {Promise<unknown>} engineAssetsPromise - Promise that resolves when engine assets are loaded.
   * @returns {Promise<void>} A promise that resolves when initialization is complete.
   */
  public async init(engineAssetsPromise: Promise<unknown>): Promise<void> {
    if (this.currentState !== GameState.INITIALIZED) {
      throw new Error('Game must be initialized before calling init()');
    }

    try {
      console.log(`[BaseGame] Initializing game: ${this.gameId}`);
      
      // Wait for engine assets to be ready
      await engineAssetsPromise;
      
      // Call implementation
      await this.initImplementation(engineAssetsPromise);
      
      console.log(`[BaseGame] Game initialized: ${this.gameId}`);
    } catch (error) {
      console.error(`[BaseGame] Failed to initialize game: ${this.gameId}`, error);
      throw error;
    }
  }

  /**
   * Starts the game.
   */
  public start(): void {
    if (this.currentState !== GameState.INITIALIZED) {
      throw new Error('Game must be initialized before calling start()');
    }

    console.log(`[BaseGame] Starting game: ${this.gameId}`);
    this.currentState = GameState.STARTED;
    this.startImplementation();
  }

  /**
   * Pauses the game.
   */
  public pause(): void {
    if (this.currentState === GameState.STARTED) {
      console.log(`[BaseGame] Pausing game: ${this.gameId}`);
      this.currentState = GameState.PAUSED;
      this.scene.pause();
    }
  }

  /**
   * Resumes the game.
   */
  public resume(): void {
    if (this.currentState === GameState.PAUSED) {
      console.log(`[BaseGame] Resuming game: ${this.gameId}`);
      this.currentState = GameState.STARTED;
      this.scene.resume();
    }
  }

  /**
   * Ends the game.
   */
  public end(): void {
    if (this.currentState === GameState.STARTED || this.currentState === GameState.PAUSED) {
      console.log(`[BaseGame] Ending game: ${this.gameId}`);
      this.currentState = GameState.ENDED;
      this.endImplementation();
    }
  }

  /**
   * Updates the game state.
   * @param {Partial<TGameState>} newState - Partial state update.
   */
  protected setState(newState: Partial<TGameState>): void {
    this.gameState = { ...this.gameState, ...newState };
  }

  /**
   * Gets the current game state.
   * @returns {TGameState} The current game state.
   */
  protected getState(): TGameState {
    return { ...this.gameState };
  }

  /**
   * Registers an event listener that will be automatically cleaned up during destroy().
   * @param {string} event - The event name to listen for.
   * @param {(...args: unknown[]) => void} listener - The event listener function.
   */
  protected registerEventListener(event: string, listener: (...args: unknown[]) => void): void {
    this.managers.eventBus.on(event as keyof EngineEvents, listener as any);
    this.eventListeners.push({ event, listener });
  }

  /**
   * Adds a game object to a specific render layer.
   * @param {Phaser.GameObjects.GameObject} gameObject - The game object to add.
   * @param {RenderLayer} layer - The render layer to add to.
   */
  protected addToLayer(gameObject: Phaser.GameObjects.GameObject, layer: RenderLayer): void {
    this.add.existing(gameObject);
    gameObject.setDepth(layer);
  }

  /**
   * Shows a transition screen.
   * @param {TransitionScreenConfig} config - The transition screen configuration.
   * @returns {Promise<void>} A promise that resolves when the transition is complete.
   */
  protected async showTransition(config: TransitionScreenConfig): Promise<void> {
    return this.transitionScreen.show(config);
  }

  /**
   * Hides the transition screen.
   */
  protected hideTransition(): void {
    this.transitionScreen.hide();
  }

  /**
   * Handles power-up selection events.
   * @param {TransitionPowerupSelectedPayload} payload - The power-up selection payload.
   */
  private _handlePowerupSelected(payload: TransitionPowerupSelectedPayload): void {
    console.log(`[BaseGame] Power-up selected: ${payload.selectedPowerupId} during ${payload.transitionType}`);
    // Subclasses can override this method to handle power-up selections
  }

  /**
   * Gets the current frame timing information.
   * @returns {FrameTiming} The current frame timing.
   */
  protected getFrameTiming(): FrameTiming {
    return { ...this.frameTiming };
  }

  /**
   * Sets the time scale for the game.
   * @param {number} scale - The time scale factor.
   */
  protected setTimeScale(scale: number): void {
    const previousScale = this.frameTiming.timeScale;
    this.frameTiming.timeScale = scale;
    
    this.managers.eventBus.emit(EXTENDED_ENGINE_EVENTS.GAME_SPEED_CHANGED, {
      speed: scale,
      previousSpeed: previousScale
    });
  }

  /**
   * Gets the current time scale.
   * @returns {number} The current time scale.
   */
  protected getTimeScale(): number {
    return this.frameTiming.timeScale;
  }

  /**
   * Phaser Scene shutdown method - called when the scene is destroyed.
   */
  shutdown(): void {
    console.log(`[BaseGame] Shutting down game: ${this.gameId}`);
    this.destroy();
  }

  /**
   * Destroys the game and cleans up all resources.
   */
  public destroy(): void {
    console.log(`[BaseGame] Destroying game: ${this.gameId}`);
    
    // Clean up event listeners
    this.eventListeners.forEach(({ event, listener }) => {
      this.managers.eventBus.off(event as keyof EngineEvents, listener as any);
    });
    this.eventListeners = [];

    // Clean up custom renderers
    this.customRenderers.clear();

    // Call implementation
    this.destroyImplementation();

    // Clean up transition screen
    if (this.transitionScreen) {
      this.transitionScreen.destroy();
    }

    console.log(`[BaseGame] Game destroyed: ${this.gameId}`);
  }
}
