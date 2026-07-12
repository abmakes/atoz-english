import { Container } from 'pixi.js';
import { EventBus } from '../core/EventBus';
import { StorageManager } from '../core/StorageManager';
import { ScoringManager } from './ScoringManager';
import { TimerManager } from './TimerManager';
// Import AssetLoader
import { AssetLoader } from '../assets/AssetLoader';
// Import the managers type from PixiEngine
import { PixiEngineManagers } from '../core/PixiEngine';
// Import theme config types and loader
import { getThemeConfig } from '../../themes';
import type { PixiThemeConfig } from '../../themes'; // Revert to simple type import
// Import other managers
import { ControlsManager } from '../core/ControlsManager';
import { GameStateManager } from '../core/GameStateManager';
import { RuleEngine } from '../core/RuleEngine';
import { PowerUpManager } from './PowerUpManager';
import { AudioManager } from '../core/AudioManager';
import { GameConfig, validateGameConfig } from '../config/GameConfig';
import { 
  GAME_STATE_EVENTS, 
  ENGINE_EVENTS,
  GameStateActiveTeamChangedPayload, 
  EngineEvents, 
  TRANSITION_EVENTS,
  TransitionPowerupSelectedPayload
} from '../core/EventTypes';
import * as PIXI from 'pixi.js';
import { TransitionScreen, TransitionScreenConfig } from '../ui/TransitionScreen';
import { GameEventRegistry } from './GameEventRegistry';
import { GameFrameClock, type FrameTiming } from './GameFrameClock';
import {
  getPropertyByPath,
  validateConfigChange as validateConfigChangeHelper,
  applyMutableConfigChange,
  type ConfigChangeEvent,
  type ConfigValidationResult,
} from './GameConfigHotReload';
import { GameTransitionHost } from './GameTransitionHost';

export type { ConfigChangeEvent, ConfigValidationResult, FrameTiming };

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
 * Represents a custom renderer function that can be registered with the game
 */
type CustomRendererFunction = (renderer: PIXI.Renderer) => void;

/**
 * Represents a registered custom renderer with its priority
 */
interface CustomRenderer {
  /** Unique identifier for this renderer */
  id: string;
  /** The renderer function */
  renderer: CustomRendererFunction;
  /** Priority value (lower numbers render first) */
  priority: number;
}

/**
 * Abstract base class for all specific game implementations within the PixiEngine.
 * Provides a standard structure for game lifecycle methods and grants access to shared engine managers.
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
export abstract class BaseGame<TGameState extends BaseGameState = BaseGameState> {
  /** 
   * The main PixiJS container for this game's visual elements.
   * All visual components created by the game should be added to this container.
   */
  public readonly view: Container;

  /** 
   * A read-only reference to the specific configuration object 
   * provided when this game instance was created.
   */
  protected readonly config: Readonly<GameConfig>;

  /** 
   * A read-only reference to the specific PixiJS theme configuration 
   * loaded based on the game config's theme ID.
   */
  protected readonly themeConfig: PixiThemeConfig;

  // Manager references
  /** Provides access to the central event bus for emitting and subscribing to engine events. */
  protected readonly eventBus: EventBus;
  /** Provides access to the storage manager for persisting and retrieving data (e.g., high scores). */
  protected readonly storageManager: StorageManager;
  /** Provides access to the scoring manager for tracking scores and lives. */
  protected readonly scoringManager: ScoringManager;
  /** Provides access to the timer manager for creating and controlling timers. */
  protected readonly timerManager: TimerManager;
  /** Provides access to the asset loader for retrieving loaded assets. */
  protected readonly assetLoader: typeof AssetLoader;
  /** Provides access to the application instance for screen size, etc. */
  protected readonly pixiApp: PixiEngineManagers['pixiApp']; // Use indexed access for type safety
  /** Provides access to the controls manager for handling player input. */
  protected readonly controlsManager: ControlsManager;
  /** Provides access to the game state manager for overall game state management. */
  protected readonly gameStateManager: GameStateManager;
  /** Provides access to the rule engine for processing game rules and actions. */
  protected readonly ruleEngine: RuleEngine;
  /** Provides access to the power-up manager for managing power-ups. */
  protected readonly powerUpManager: PowerUpManager;
  /** Provides access to the audio manager for sound playback. */
  protected readonly audioManager: AudioManager;

  /** Flag indicating if the game's asynchronous `init()` method has completed successfully. */
  protected isInitialized: boolean = false;

  /** Current state of the game instance */
  protected gameState: GameState = GameState.NOT_INITIALIZED;

  /** Game-specific state */
  protected _gameState!: TGameState;
  
  /** History of previous game states */
  protected _stateHistory: TGameState[] = [];
  
  /** Maximum number of state history entries to keep */
  protected readonly _maxHistoryLength: number = 10;

  /**
   * Tracks EventBus subscriptions for automatic cleanup on destroy.
   */
  private readonly eventRegistry: GameEventRegistry;

  /**
   * Fixed timestep / FPS clock for frame updates.
   */
  private readonly frameClock: GameFrameClock = new GameFrameClock();

  /**
   * Transition screen show/hide + phase restore helper.
   */
  private transitionHost!: GameTransitionHost;

  /**
   * Static constants documenting the required events that all game implementations
   * must handle to maintain consistency with the engine.
   */
  public static readonly REQUIRED_EVENTS = [
    GAME_STATE_EVENTS.GAME_STARTED,
    GAME_STATE_EVENTS.GAME_PAUSED,
    GAME_STATE_EVENTS.GAME_ENDED
  ] as const;

  /**
   * Static constants documenting optional events that game implementations
   * should consider handling for enhanced functionality.
   */
  public static readonly OPTIONAL_EVENTS = [
    GAME_STATE_EVENTS.PHASE_CHANGED,
    GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED
  ] as const;

  /** Optional transition screen instance for managing intermediate states */
  protected transitionScreen?: TransitionScreen;

  /** Promise for the completion of engine-level asset loading (e.g., bundles) */
  private engineAssetsPromise: Promise<unknown> = Promise.resolve(); 

  /**
   * Creates an instance of BaseGame.
   * @param config The specific game configuration object.
   * @param managers An object containing references to all required engine managers, provided by PixiEngine.
   */
  constructor(
    config: GameConfig,
    managers: PixiEngineManagers
  ) {
    // Validate the incoming configuration first
    const validationErrors = validateGameConfig(config);
    // Check if the validation returned any errors
    if (validationErrors.length > 0) {
      console.error("Invalid GameConfig provided:", validationErrors);
      // Throw an error to prevent initialization with bad config
      throw new Error(`Invalid GameConfig: ${validationErrors.join(', ')}`);
    }
    this.config = Object.freeze({ ...config }); // Store validated config

    // Load and store the corresponding theme configuration using the optional theme property
    this.themeConfig = getThemeConfig(this.config.theme);

    // Assign managers
    this.eventBus = managers.eventBus;
    this.storageManager = managers.storageManager;
    this.scoringManager = managers.scoringManager;
    this.timerManager = managers.timerManager;
    this.assetLoader = managers.assetLoader;
    this.pixiApp = managers.pixiApp;
    // Assign other managers
    this.controlsManager = managers.controlsManager;
    this.gameStateManager = managers.gameStateManager;
    this.ruleEngine = managers.ruleEngine;
    this.powerUpManager = managers.powerUpManager;
    this.audioManager = managers.audioManager;

    this.eventRegistry = new GameEventRegistry(this.eventBus);

    this.view = new Container();
    this.view.label = `GameView-${this.constructor.name}`;

    // Initialize fixed timestep value from config or use default
    this.FIXED_TIMESTEP_MS = 1000 / (config.fixedUpdateFPS || 60);

    // Initialize game state immediately using the subclass implementation
    this._gameState = this.createInitialState();

    // Create and add the transition screen early in the BaseGame constructor
    // Pass the necessary managers including the powerUpManager
    this.transitionScreen = new TransitionScreen(
        this.pixiApp.getApp(), // Pass the actual PIXI.Application instance
        this.eventBus, 
        this.powerUpManager, // Pass powerUpManager here
        this.gameStateManager, // Pass gameStateManager here
        this.assetLoader // Pass assetLoader here
    );
    // Add to the highest UI layer
    this.addToLayer(this.transitionScreen, RenderLayer.UI_FOREGROUND);

    this.transitionHost = new GameTransitionHost(
      () => this.transitionScreen,
      () => this._gameState.phase,
      (phase, options) => {
        this.setState({ phase } as Partial<TGameState>, options)
      },
      (count) => this.getStateHistory(count),
      (eventName, payload) => {
        this.emitEvent(eventName, payload as never)
      }
    )

    // Add listener for the new power-up selection event
    this.registerEventListener(TRANSITION_EVENTS.POWERUP_SELECTED, this._handlePowerupSelected.bind(this));
  }

  /**
   * Asynchronously initializes the game.
   * @param engineAssetsPromise - A promise that resolves when engine-level assets (like bundles) are loaded.
   * @returns A promise that resolves when game initialization is complete.
   */
  async init(engineAssetsPromise: Promise<unknown>): Promise<void> {
    // Store the promise
    this.engineAssetsPromise = engineAssetsPromise;

    // Emit game starting event
    this.emitEvent(GAME_STATE_EVENTS.GAME_STARTING);
    
    // Initialize the game (abstract method implemented by subclasses), passing the promise
    await this.initImplementation(this.engineAssetsPromise);
    
    // Set game state and emit game started event
    this.gameState = GameState.INITIALIZED;
    this.isInitialized = true;
    this.emitEvent(GAME_STATE_EVENTS.GAME_STARTED);
  }
  
  /**
   * Abstract method that subclasses must implement to provide game-specific initialization.
   * @param engineAssetsPromise - A promise that resolves when engine-level assets (like bundles) are loaded.
   */
  protected abstract initImplementation(engineAssetsPromise: Promise<unknown>): Promise<void>;

  /**
   * Provides access to the promise tracking engine-level asset loading completion.
   * @returns The promise for engine asset loading.
   */
  protected getEngineAssetsPromise(): Promise<unknown> { 
    return this.engineAssetsPromise; 
  }

  /**
   * Starts the actual gameplay after initialization is complete.
   * Should typically involve:
   * - Starting game timers
   * - Beginning animations or movement
   * - Enabling user input/controls
   * - Triggering initial game events
   * 
   * This separates initialization from gameplay start, allowing for
   * a "ready" or "countdown" state between initialization and actual gameplay.
   * Updates gameState to STARTED.
   * 
   * @throws Error if called before initialization or after the game has ended
   */
  abstract start(): void;

  /**
   * Called every frame by the PixiEngine's update loop (via Ticker).
   * Subclasses must implement this method to update game logic, handle input,
   * move objects, check collisions, etc.
   * 
   * @param delta - Time elapsed since the last frame, usually in milliseconds (provided by PixiEngine).
   */
  abstract update(delta: number): void;

  /**
   * Called every frame by the PixiEngine's render loop.
   * This is where all rendering for this game should occur.
   * 
   * @remarks
   * - Use this for drawing your game state to the screen.
   * - Avoid performing game logic or state updates here.
   * - For most games, simply delegate rendering to scene/component objects.
   * - Override for custom rendering effects.
   */
  abstract render(): void;

  /**
   * Pauses the game, suspending all gameplay activity.
   * Should typically involve:
   * - Pausing game-specific timers and animations
   * - Disabling user input/controls
   * - Displaying a pause indicator or menu
   * 
   * Called by PixiEngine when the game should be paused (e.g., window loses focus).
   * Updates gameState to PAUSED.
   * 
   * @throws Error if called before the game is started or after it has ended
   */
  public pause(): void {
    // State validation
    if (this.gameState !== GameState.STARTED) {
      console.warn(`Cannot pause game that is not in STARTED state. Current state: ${this.gameState}`);
      return;
    }
    
    // Update internal state
    this.gameState = GameState.PAUSED;
    
    // Emit event for external components
    this.emitEvent(GAME_STATE_EVENTS.GAME_PAUSED);
    console.log(`[BaseGame] Game paused. State: ${this.gameState}`);
  }

  /**
   * @deprecated Use pause() instead for consistency with other lifecycle methods
   */
  public onPause(): void {
    this.pause();
  }

  /**
   * Resumes the game after it has been paused.
   * Should typically involve:
   * - Resuming game-specific timers and animations
   * - Re-enabling user input/controls
   * - Removing any pause indicators
   * 
   * Called by PixiEngine when the game should resume (e.g., window regains focus).
   * Updates gameState to STARTED.
   * 
   * @throws Error if called when the game is not in a paused state
   */
  public resume(): void {
    if (this.gameState !== GameState.PAUSED) {
      console.warn(`${this.constructor.name}: Cannot resume game that is not in PAUSED state. Current state: ${this.gameState}`);
      return;
    }
    
    this.gameState = GameState.STARTED;
    
    // Emit event for external components
    this.emitEvent(GAME_STATE_EVENTS.GAME_RESUMED);
    console.log(`[BaseGame] Game resumed. State: ${this.gameState}`);
  }

  /**
   * @deprecated Use resume() instead for consistency with other lifecycle methods
   */
  public onResume(): void {
    this.resume();
  }

  /**
   * Ends the game and finalizes the game state.
   * Should typically involve:
   * - Finalizing score and game outcome
   * - Triggering game over events or animations
   * - Disabling all gameplay functionality
   * 
   * Updates gameState to ENDED. After this method is called, the game
   * instance should not be restarted.
   * 
   * @throws Error if the game has not been initialized
   */
  end(): void {
    // State validation
    if (this.gameState !== GameState.STARTED && this.gameState !== GameState.PAUSED) {
      console.warn(`Cannot end game that is in state ${this.gameState}`);
      return;
    }
    
    // Emit game ending event
    this.emitEvent(GAME_STATE_EVENTS.GAME_ENDING);
    
    // End implementation (subclass specific)
    this.endImplementation();
    
    // Update game state
    this.gameState = GameState.ENDED;
    
    // Emit game ended event
    this.emitEvent(GAME_STATE_EVENTS.GAME_ENDED);
  }
  
  /**
   * Abstract method that subclasses must implement to provide game-specific ending logic.
   */
  protected abstract endImplementation(): void;

  /**
   * Called by PixiEngine when the application window/view is resized.
   * Optional: Subclasses should override this method to adjust their layout,
   * reposition elements, or recalculate dimensions based on the new screen size.
   * 
   * @param width - The new width of the rendering area.
   * @param height - The new height of the rendering area.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onResize(width: number, height: number): void {
    console.log(`${this.constructor.name}: onResize (${width}x${height})`);
    // Resize transition screen if it exists (no arguments needed)
    this.transitionScreen?.onResize();
    // Subclasses implement layout adjustments here.
  }

  /**
   * Cleans up all resources used by the game instance. Should typically involve:
   * - Removing event listeners bound during `init`.
   * - Stopping and removing any timers created via `timerManager`.
   * - Destroying PixiJS objects (sprites, containers, graphics, text) added to the `view`.
   * - Releasing any other game-specific resources.
   * 
   * This is called by PixiEngine during cleanup and should be called after end().
   * 
   * @throws Error if called before the game has been initialized
   */
  destroy(): void {
    // Destroy transition screen if it exists
    this.transitionScreen?.destroy();
    this.transitionScreen = undefined;

    // Unregister all event listeners to prevent memory leaks
    this.unregisterAllEventListeners();
    
    // Implement game-specific cleanup
    this.destroyImplementation();
  }
  
  /**
   * Abstract method that subclasses must implement to provide game-specific cleanup.
   */
  protected abstract destroyImplementation(): void;

  /**
   * Returns the current state of the game.
   * 
   * @returns The current GameState
   */
  public getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Creates the initial game state for this game type.
   * Must be implemented by subclasses to provide type-specific initial state.
   * 
   * @returns The initial state object for this game
   */
  protected abstract createInitialState(): TGameState;

  /**
   * Gets a readonly copy of the current game state.
   * Use this to read game state properties without risk of mutation.
   * 
   * @returns A readonly copy of the current game state
   */
  public getState(): Readonly<TGameState> {
    return Object.freeze({ ...this._gameState });
  }

  /**
   * Updates the game state by merging the provided partial state.
   * Emits appropriate events based on what properties changed.
   * Adds the previous state to history.
   * 
   * @param partialState - A partial state object with properties to update
   * @param options - Options for state updates (e.g. skipHistory, silent)
   * @returns The resulting full state after the update
   */
  protected setState(
    partialState: Partial<TGameState>, 
    options: { 
      skipHistory?: boolean, 
      silent?: boolean 
    } = {}
  ): TGameState {
    // Skip if there are no actual changes
    if (Object.keys(partialState).length === 0) {
      return this._gameState;
    }
    
    // Validate the proposed new state
    const newState = { ...this._gameState, ...partialState };
    if (!this.validateState(newState)) {
      throw new Error('Invalid game state update');
    }
    
    // Save to history if not skipped
    if (!options.skipHistory) {
      this.addStateToHistory(this._gameState);
    }
    
    // Create new state by merging
    const oldState = this._gameState;
    this._gameState = newState;
    
    // Emit events unless silent
    if (!options.silent) {
      // Emit phase change event if phase changed
      if (oldState.phase !== this._gameState.phase) {
        this.emitEvent(GAME_STATE_EVENTS.PHASE_CHANGED, {
          previousPhase: String(oldState.phase || 'unknown'),
          currentPhase: String(this._gameState.phase || 'unknown')
        });
      }
      
      // Detect and emit specific state change events
      this.emitSpecificStateChangeEvents(oldState, this._gameState);
    }
    
    return this._gameState;
  }

  /**
   * Adds a state to the history stack, maintaining the maximum history length.
   * 
   * @param state - The state to add to history
   */
  private addStateToHistory(state: TGameState): void {
    this._stateHistory.push({ ...state });
    
    // Trim history if it exceeds max length
    if (this._stateHistory.length > this._maxHistoryLength) {
      this._stateHistory.shift();
    }
  }

  /**
   * Gets the state history.
   * Useful for debugging or implementing undo functionality.
   * 
   * @param count - Optional number of history entries to retrieve (from newest to oldest)
   * @returns An array of previous states (newest first)
   */
  public getStateHistory(count?: number): ReadonlyArray<Readonly<TGameState>> {
    const history = [...this._stateHistory].reverse();
    return Object.freeze(
      count ? history.slice(0, count) : history
    );
  }

  /**
   * Reverts to a previous state.
   * 
   * @param steps - Number of steps to revert (default: 1)
   * @returns The new current state after reverting
   * @throws Error if there's not enough history to revert the specified steps
   */
  protected revertToPreviousState(steps: number = 1): TGameState {
    if (steps <= 0) {
      throw new Error('Steps to revert must be positive');
    }
    
    if (this._stateHistory.length < steps) {
      throw new Error(`Cannot revert ${steps} steps (only have ${this._stateHistory.length} in history)`);
    }
    
    // Get the state we want to revert to
    const targetStateIndex = this._stateHistory.length - steps;
    const targetState = this._stateHistory[targetStateIndex];
    
    // Remove states we're skipping past
    this._stateHistory = this._stateHistory.slice(0, targetStateIndex);
    
    // Set the state (without adding to history)
    return this.setState(targetState, { skipHistory: true });
  }

  /**
   * Gets a specific property from the game state.
   * Provides type safety for accessing nested properties.
   * 
   * @param propertyPath - The path to the property (using dot notation for nested props)
   * @returns The property value or undefined if not found
   */
  protected getStateProperty<T>(propertyPath: string): T | undefined {
    return getPropertyByPath(this._gameState as Record<string, unknown>, propertyPath) as T | undefined;
  }

  /**
   * Serializes the current game state to a JSON string.
   * Used for saving game progress.
   * 
   * @returns A JSON string representing the current game state
   */
  public serializeState(): string {
    // Safely access config.version if it exists
    const configVersion = typeof this.config === 'object' && this.config !== null && 'version' in this.config 
      ? this.config.version as string || '1.0.0'
      : '1.0.0';
      
    return JSON.stringify({
      gameState: this._gameState,
      metadata: {
        gameType: this.constructor.name,
        timestamp: new Date().toISOString(),
        version: configVersion
      }
    });
  }

  /**
   * Deserializes and loads a previously saved game state.
   * 
   * @param serializedState - The serialized state string
   * @param validate - Whether to validate the state before loading (default: true)
   * @returns The new current state after loading
   * @throws Error if state validation fails
   */
  protected deserializeAndLoadState(serializedState: string, validate: boolean = true): TGameState {
    try {
      const parsed = JSON.parse(serializedState);
      
      // Validate basic structure
      if (!parsed.gameState || !parsed.metadata) {
        throw new Error('Invalid state format: missing gameState or metadata');
      }
      
      // Game type validation
      if (validate && parsed.metadata.gameType !== this.constructor.name) {
        throw new Error(
          `State mismatch: saved for ${parsed.metadata.gameType}, ` +
          `but current game is ${this.constructor.name}`
        );
      }
      
      // Apply the state (will handle history and events)
      return this.setState(parsed.gameState);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to deserialize game state: ${errorMessage}`);
    }
  }

  /**
   * Validates a proposed state update.
   * Game implementations should override this for custom validation.
   * 
   * @param newState - The proposed new state
   * @returns True if state is valid, false otherwise 
   */
  protected validateState(newState: TGameState): boolean {
    // Base implementation performs basic validation
    // Games should override with specific validation logic
    return newState !== null && typeof newState === 'object';
  }

  /**
   * Emits specific events for state changes based on property changes.
   * Game implementations should extend this for game-specific events.
   * 
   * @param oldState - The previous state
   * @param newState - The new state 
   */
  protected emitSpecificStateChangeEvents(oldState: TGameState, newState: TGameState): void {
    // Example: Detect active team changes
    if (oldState.activeTeam !== newState.activeTeam && newState.activeTeam !== undefined) {
      const payload: GameStateActiveTeamChangedPayload = {
        previousTeamId: oldState.activeTeam ?? undefined,
        currentTeamId: newState.activeTeam
      };
      this.emitEvent(GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED, payload);
    }
    
    // Games should override to add game-specific state change detection
  }

  // === Event Handling Methods ===

  /**
   * Registers an event listener that will be automatically cleaned up when the game is destroyed.
   */
  protected registerEventListener<K extends keyof EngineEvents>(
    eventName: K, 
    listener: EngineEvents[K]
  ): this {
    this.eventRegistry.on(eventName, listener);
    return this;
  }

  /**
   * Registers a one-time event listener that will be automatically cleaned up if not triggered
   * before the game is destroyed.
   */
  protected registerOneTimeEventListener<K extends keyof EngineEvents>(
    eventName: K, 
    listener: EngineEvents[K]
  ): this {
    this.eventRegistry.once(eventName, listener);
    return this;
  }

  /**
   * Unregisters a previously registered event listener.
   */
  protected unregisterEventListener<K extends keyof EngineEvents>(
    eventName: K, 
    listener: EngineEvents[K]
  ): this {
    this.eventRegistry.off(eventName, listener);
    return this;
  }

  /**
   * Unregisters all event listeners registered by this game instance.
   */
  protected unregisterAllEventListeners(): this {
    this.eventRegistry.offAll(() => {
      this.eventBus.off(TRANSITION_EVENTS.POWERUP_SELECTED, this._handlePowerupSelected.bind(this));
    });
    return this;
  }

  /**
   * Emits an event through the EventBus with proper type checking for the payload.
   */
  protected emitEvent<K extends keyof EngineEvents>(
    eventName: K, 
    ...args: Parameters<EngineEvents[K]>
  ): boolean {
    return this.eventRegistry.emit(eventName, ...args);
  }

  /**
   * Emits a game-specific event, adding a namespace prefix if needed.
   */
  protected emitGameEvent<T>(eventName: string, payload?: T): boolean {
    const namespacedEvent = eventName.includes(':') 
      ? eventName 
      : `game:${this.constructor.name.toLowerCase()}:${eventName}`;
    
    return this.eventBus.emit(namespacedEvent as keyof EngineEvents, payload as never);
  }

  /**
   * Waits for an event to occur before continuing execution.
   */
  protected waitForEvent<K extends keyof EngineEvents>(
    eventName: K, 
    timeout?: number
  ): Promise<Parameters<EngineEvents[K]>[0]> {
    return this.eventRegistry.waitFor(eventName, timeout);
  }

  /**
   * Creates a debounced event emitter that prevents event spam.
   */
  protected createDebouncedEmitter<K extends keyof EngineEvents>(
    eventName: K, 
    delay: number
  ): (...args: Parameters<EngineEvents[K]>) => void {
    return this.eventRegistry.createDebouncedEmitter(eventName, delay);
  }

  /**
   * Plays a sound effect using the audio manager
   * @param soundId The ID of the registered sound to play
   * @param options Optional playback options (volume, rate, etc.)
   * @returns The Howl sound instance ID or -1 if failed
   */
  protected playSound(
    soundId: string, 
    sprite?: string
  ): number | null {
    if (!this.audioManager) {
      console.warn(`Cannot play sound "${soundId}": AudioManager not available`);
      return null;
    }
    
    try {
      return this.audioManager.play(soundId, sprite);
    } catch (error) {
      console.error(`Error playing sound "${soundId}":`, error);
      return null;
    }
  }

  /**
   * Stops a sound that's currently playing
   * @param soundId The ID of the registered sound to stop
   * @returns True if successful, false otherwise
   */
  protected stopSound(soundId: string, soundInstanceId?: number): boolean {
    if (!this.audioManager) {
      console.warn(`Cannot stop sound "${soundId}": AudioManager not available`);
      return false;
    }
    
    try {
      this.audioManager.stop(soundId, soundInstanceId);
      return true;
    } catch (error) {
      console.error(`Error stopping sound "${soundId}":`, error);
      return false;
    }
  }

  /**
   * Apply a game rule with the given name, arguments, and context
   * @param ruleName The name of the rule to apply
   * @param args The arguments to pass to the rule
   * @param _context The context in which the rule is being applied
   * @returns True if the rule was successfully applied, false otherwise
   */
  public applyRule(ruleName: string, args: unknown[], 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: unknown = {}
  ): boolean {
    if (!this.ruleEngine) {
      console.warn(`Cannot apply rule "${ruleName}": RuleEngine not available`);
      return false;
    }

    try {
      // TODO: Implement when RuleEngine is updated
      console.warn(`Rule applied:`, ruleName);
      return true;
    } catch (error) {
      console.error(`Error applying rule:`, ruleName, error);
      return false;
    }
  }

  /**
   * Check if a game rule can be applied with the given arguments and context
   * @param ruleName The name of the rule to check
   * @param args The arguments to pass to the rule
   * @param _context The context in which the rule is being checked
   * @returns True if the rule can be applied, false otherwise
   */
  public isRuleApplicable(ruleName: string, args: unknown[], 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: unknown = {}
  ): boolean {
    if (!this.ruleEngine) {
      console.warn(`Cannot check rule "${ruleName}": RuleEngine not available`);
      return false;
    }

    try {
      // TODO: Implement when RuleEngine is updated
      console.warn(`Rule is applicable:`, ruleName);
      return true;
    } catch (error) {
      console.error(`Error checking if rule is applicable:`, ruleName, error);
      return false;
    }
  }

  /**
   * Registers an interactive area with the controls manager
   * @param displayObject The PixiJS Container object to make interactive
   * @param action The action ID to trigger when this area is interacted with
   * @returns True if successfully registered, false otherwise
   */
  protected registerInteractiveArea(
    displayObject: Container,
    action: string
  ): boolean {
    if (!this.controlsManager) {
      console.warn(`Cannot register interactive area for "${action}": ControlsManager not available`);
      return false;
    }
    
    try {
      this.controlsManager.registerInteractiveArea(displayObject, action);
      return true;
    } catch (error) {
      console.error(`Error registering interactive area for "${action}":`, error);
      return false;
    }
  }

  /**
   * Unregisters an interactive area from the controls manager
   * @param displayObject The PixiJS Container to unregister
   * @returns True if successfully unregistered, false otherwise
   */
  protected unregisterInteractiveArea(displayObject: Container): boolean {
    if (!this.controlsManager) {
      console.warn(`Cannot unregister interactive area: ControlsManager not available`);
      return false;
    }
    
    try {
      this.controlsManager.unregisterInteractiveArea(displayObject);
      return true;
    } catch (error) {
      console.error(`Error unregistering interactive area:`, error);
      return false;
    }
  }

  /**
   * Activates a power-up for the specified team
   * @param powerUpId The ID of the power-up to activate
   * @param teamId The ID of the team to apply the power-up to
   * @returns The activated power-up instance or null if failed
   */
  protected activatePowerUp(powerUpId: string, teamId: string | number): ReturnType<PowerUpManager['activatePowerUp']> {
    if (!this.powerUpManager) {
      console.warn(`Cannot activate power-up "${powerUpId}": PowerUpManager not available`);
      return null;
    }
    
    try {
      return this.powerUpManager.activatePowerUp(powerUpId, teamId);
    } catch (error) {
      console.error(`Error activating power-up "${powerUpId}" for team "${teamId}":`, error);
      return null;
    }
  }

  /**
   * Checks if a power-up is active for the specified team
   * @param powerUpId The ID of the power-up to check
   * @param teamId The ID of the team to check for
   * @returns True if the power-up is active, false otherwise
   */
  protected isPowerUpActive(powerUpId: string, teamId: string | number): boolean {
    if (!this.powerUpManager) {
      console.warn(`Cannot check power-up "${powerUpId}": PowerUpManager not available`);
      return false;
    }
    
    try {
      return this.powerUpManager.isPowerUpActiveForTarget(powerUpId, teamId);
    } catch (error) {
      console.error(`Error checking if power-up "${powerUpId}" is active for team "${teamId}":`, error);
      return false;
    }
  }

  /**
   * Saves data to persistent storage
   * @param key The key to store the data under
   * @param value The data to store
   * @returns True if successfully saved, false otherwise
   */
  protected saveData<T>(key: string, value: T): boolean {
    if (!this.storageManager) {
      console.warn(`Cannot save data for key "${key}": StorageManager not available`);
      return false;
    }
    
    try {
      this.storageManager.set(key, value);
      return true;
    } catch (error) {
      console.error(`Error saving data for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Loads data from persistent storage
   * @param key The key to retrieve data for
   * @param defaultValue Default value to return if key doesn't exist
   * @returns The stored data or defaultValue if not found
   */
  protected loadData<T>(key: string, defaultValue?: T): T | null {
    if (!this.storageManager) {
      console.warn(`Cannot load data for key "${key}": StorageManager not available`);
      return defaultValue ?? null;
    }
    
    try {
      return this.storageManager.get<T>(key) ?? (defaultValue ?? null);
    } catch (error) {
      console.error(`Error loading data for key "${key}":`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * Controls whether this game instance should be rendered.
   * Implementations can override to add custom visibility logic.
   * 
   * @returns True if the game should be rendered, false otherwise
   */
  public isVisible(): boolean {
    // Default implementation - only render after initialization and when not hidden
    return this.isInitialized && !this._isHidden;
  }

  /**
   * Visibility flag that can be set to hide the game temporarily
   * without affecting game state.
   */
  protected _isHidden: boolean = false;

  /**
   * Hide the game without changing its state.
   * The game will continue updating but won't render.
   */
  public hide(): void {
    this._isHidden = true;
    this.view.visible = false;
  }

  /**
   * Show the game if it was previously hidden.
   */
  public show(): void {
    this._isHidden = false;
    this.view.visible = true;
  }

  /**
   * The current viewport dimensions and position
   */
  protected _viewport = {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    zoom: 1
  };

  /**
   * Gets the current viewport settings.
   * @returns A read-only copy of the viewport settings
   */
  public getViewport(): Readonly<typeof this._viewport> {
    return { ...this._viewport };
  }

  /**
   * Sets the viewport position.
   * @param x - The x-coordinate
   * @param y - The y-coordinate
   */
  public setViewportPosition(x: number, y: number): void {
    this._viewport.x = x;
    this._viewport.y = y;
    this._updateViewport();
  }

  /**
   * Sets the viewport zoom level.
   * @param zoom - The zoom level (1 = 100%)
   */
  public setViewportZoom(zoom: number): void {
    this._viewport.zoom = Math.max(0.1, Math.min(10, zoom)); // Limit zoom range
    this._updateViewport();
  }

  /**
   * Updates the viewport based on current settings.
   * Override to implement custom viewport behavior.
   */
  protected _updateViewport(): void {
    // Default implementation adjusts the main view container
    this.view.position.set(-this._viewport.x, -this._viewport.y);
    this.view.scale.set(this._viewport.zoom);
  }

  /**
   * Accumulated time since the last fixed update.
   * @deprecated Prefer frameClock; kept for subclasses that read _frameTimeAccumulator.
   */
  protected get _frameTimeAccumulator(): number {
    return this.frameClock.getFrameTimeAccumulator();
  }

  /**
   * The fixed timestep in milliseconds for consistent physics/updates.
   * Can be adjusted in derived classes if needed.
   */
  protected readonly FIXED_TIMESTEP_MS: number;

  /**
   * Process frame timing information for the current frame.
   */
  protected processFrameTiming(delta: number): FrameTiming {
    return this.frameClock.processFrame(
      delta,
      this.gameState === GameState.PAUSED,
      {
        maxFPS: this.config.maxFPS,
        targetFPS: this.config.targetFPS,
      },
      (fps, targetFPS) => {
        this.emitEvent(EXTENDED_ENGINE_EVENTS.FPS_UPDATED, { fps, targetFPS });
      }
    );
  }

  /**
   * Updates the game state using a fixed timestep approach.
   */
  protected updateWithFixedTimestep(timing: FrameTiming): void {
    this.frameClock.runFixedUpdates(
      timing,
      this.gameState === GameState.PAUSED,
      {
        fixedUpdateFPS: this.config.fixedUpdateFPS,
        maxFixedUpdatesPerFrame: this.config.maxFixedUpdatesPerFrame,
      },
      (dt) => this.fixedUpdate(dt),
      (dt) => this.emitEvent(EXTENDED_ENGINE_EVENTS.BEFORE_FIXED_UPDATE, { deltaTime: dt }),
      (dt) => this.emitEvent(EXTENDED_ENGINE_EVENTS.AFTER_FIXED_UPDATE, { deltaTime: dt })
    );
  }

  /**
   * Fixed update method called at a fixed frequency regardless of frame rate.
   * Ideal for physics and deterministic game logic that should not vary with framerate.
   * Subclasses should override this method to implement game-specific fixed updates.
   * @param deltaTime The fixed time step in seconds (typically 1/fixedUpdateFPS)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected fixedUpdate(_deltaTime: number): void {
    // Default implementation does nothing
    // Subclasses should override this method
  }

  /**
   * Execute the rendering pipeline for the current frame.
   * This handles the entire rendering process including:
   * 1. Pre-render operations and events
   * 2. Clearing the viewport if configured
   * 3. Executing all registered custom renderers in priority order
   * 4. Calling the game's main render method
   * 5. Post-render operations and events
   */
  protected renderPipeline(): void {
    // Skip rendering if game is not visible
    if (!this.isVisible()) return;

    try {
      // Pre-render phase - fix by not passing empty objects to event with no parameters
      this.emitEvent(ENGINE_EVENTS.BEFORE_RENDER);
      
      // Clear the viewport if configured to do so
      if (this.config.clearBeforeRender) {
        // Use getApp() to access the renderer
        this.pixiApp.getApp().renderer.clear();
      }
      
      // Execute all custom renderers in priority order
      for (const customRenderer of this._customRenderers) {
        try {
          // Use getApp() to access the renderer
          customRenderer.renderer(this.pixiApp.getApp().renderer);
        } catch (error) {
          console.error(`[BaseGame] Error in custom renderer (ID: ${customRenderer.id}):`, error);
        }
      }
      
      // Main render phase - call the game's implementation - fix event parameter
      this.emitEvent(ENGINE_EVENTS.RENDER);
      this.render();
      
      // Post-render phase - fix event parameter
      this.emitEvent(ENGINE_EVENTS.AFTER_RENDER);
    } catch (error) {
      console.error('[BaseGame] Error in render pipeline:', error);
    }
  }

  /**
   * Register a custom renderer with a specific priority.
   * Higher priority renderers will be executed later in the rendering pipeline.
   * @param renderer The renderer function to register
   * @param priority The priority of the renderer (default: 0)
   * @returns ID of the registered renderer for later removal
   */
  public registerCustomRenderer(
    renderer: CustomRendererFunction,
    priority: number = 0
  ): string {
    const id = crypto.randomUUID();
    this._customRenderers.push({
      id,
      renderer,
      priority
    });
    
    // Sort renderers by priority (lower numbers render first)
    this._customRenderers.sort((a, b) => a.priority - b.priority);
    
    return id;
  }

  /**
   * Remove a previously registered custom renderer
   * @param id The ID of the renderer to remove
   * @returns True if renderer was found and removed, false otherwise
   */
  public unregisterCustomRenderer(id: string): boolean {
    const initialLength = this._customRenderers.length;
    this._customRenderers = this._customRenderers.filter(r => r.id !== id);
    return this._customRenderers.length < initialLength;
  }

  /**
   * Get the current FPS (Frames Per Second) of the game
   * @returns The current FPS as calculated during processFrameTiming
   */
  public getCurrentFPS(): number {
    return this.frameClock.getCurrentFPS();
  }

  /**
   * Set game speed multiplier to speed up or slow down the game
   * Values > 1 speed up the game, values < 1 slow it down
   * @param speed Speed multiplier (default: 1.0)
   */
  public setGameSpeed(speed: number): void {
    this.frameClock.setGameSpeed(speed);
    
    this.emitEvent(EXTENDED_ENGINE_EVENTS.GAME_SPEED_CHANGED, {
      speed: this.frameClock.getGameSpeed(),
      previousSpeed: this.frameClock.getPreviousGameSpeed()
    });
  }

  // === Layer Management ===

  /**
   * Container cache for quick access to layer containers
   */
  private _layerContainers: Map<RenderLayer | string, Container> = new Map();

  /**
   * Get a container for a specific render layer
   * @param layer The render layer or custom layer name
   * @returns The container for the specified layer
   */
  public getLayerContainer(layer: RenderLayer | string): Container {
    if (!this._layerContainers.has(layer)) {
      const container = new Container();
      container.label = typeof layer === 'string' ? layer : RenderLayer[layer];
      container.zIndex = typeof layer === 'number' ? layer : RenderLayer.OBJECTS;
      container.sortableChildren = true;
      this._layerContainers.set(layer, container);
      this.view.addChild(container);
      this.view.sortChildren();
    }
    return this._layerContainers.get(layer)!;
  }

  /**
   * Add a display object to a specific render layer
   * @param displayObject The display object to add
   * @param layer The render layer or custom layer name
   */
  public addToLayer(displayObject: Container, layer: RenderLayer | string): void {
    const container = this.getLayerContainer(layer);
    container.addChild(displayObject);
  }

  /**
   * Remove a display object from a specific render layer
   * @param displayObject The display object to remove
   * @param layer The render layer or custom layer name
   */
  public removeFromLayer(displayObject: Container, layer: RenderLayer | string): void {
    const container = this.getLayerContainer(layer);
    container.removeChild(displayObject);
  }

  /** Custom renderers registered with this game */
  protected _customRenderers: CustomRenderer[] = [];

  /**
   * Gets the entire game configuration or a specific section.
   */
  public getConfig<T = Readonly<GameConfig>>(path?: string): T {
    if (!path) {
      return this.config as unknown as T;
    }
    
    return getPropertyByPath(this.config as unknown as Record<string, unknown>, path) as T;
  }

  /**
   * Registers an event listener for configuration changes.
   */
  protected registerConfigChangeHandler(
    path: string,
    handler: (event: ConfigChangeEvent) => void
  ): this {
    const eventName = path ? `config:change:${path}` : 'config:change';
    this.eventBus.on(eventName as keyof EngineEvents, handler as EngineEvents[keyof EngineEvents]);
    return this;
  }

  /**
   * Unregisters a previously registered configuration change handler.
   */
  protected unregisterConfigChangeHandler(
    path: string,
    handler: (event: ConfigChangeEvent) => void
  ): this {
    const eventName = path ? `config:change:${path}` : 'config:change';
    this.eventBus.off(eventName as keyof EngineEvents, handler as EngineEvents[keyof EngineEvents]);
    return this;
  }

  /**
   * Safely applies a configuration change at runtime.
   */
  protected applyConfigChange(
    path: string,
    newValue: unknown,
    source: ConfigChangeEvent['source'] = 'runtime'
  ): boolean {
    const validationResult = this.validateConfigChange(path, newValue);
    if (!validationResult.valid) {
      console.error(`Invalid config change at ${path}:`, validationResult.errors);
      return false;
    }

    const oldValue = getPropertyByPath(this.config as unknown as Record<string, unknown>, path);
    
    try {
      const nextConfig = applyMutableConfigChange(this.config, path, newValue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).config = nextConfig;
      
      const event: ConfigChangeEvent = {
        path,
        oldValue,
        newValue,
        source
      };
      
      this.eventBus.emit(`config:change:${path}` as keyof EngineEvents, event as never);
      this.eventBus.emit('config:change' as keyof EngineEvents, event as never);
      
      this.handleConfigChange(path, oldValue, newValue, source);
      
      return true;
    } catch (error) {
      console.error(`Failed to apply config change at ${path}:`, error);
      return false;
    }
  }

  /**
   * Validates a proposed configuration change.
   */
  protected validateConfigChange(path: string, newValue: unknown): ConfigValidationResult {
    return validateConfigChangeHelper(this.config, path, newValue);
  }

  /**
   * Handles a configuration change by updating game state or behavior.
   */
  protected handleConfigChange(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _path: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _oldValue: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _newValue: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _source: ConfigChangeEvent['source']
  ): void {
    // Base implementation doesn't do anything
  }

  // === Transition Screen Methods ===

  /**
   * Shows the transition screen and sets the game state to 'transition'.
   */
  protected async showTransition(config: TransitionScreenConfig): Promise<void> {
    return this.transitionHost.show(config);
  }

  /**
   * Hides the transition screen if it is currently visible.
   */
  protected hideTransition(): void {
    this.transitionHost.hide();
  }

  /**
   * Handles the power-up selection event during a transition.
   */
  protected _handlePowerupSelected(payload: TransitionPowerupSelectedPayload): void {
    console.log(`[BaseGame] Power-up selected during transition: ${payload.selectedPowerupId}`);
  }
}
