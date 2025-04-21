import { Container } from 'pixi.js';
import { EventBus } from '../core/EventBus';
import { StorageManager } from '../core/StorageManager';
import { ScoringManager } from './ScoringManager';
import { TimerManager } from './TimerManager';
// Import AssetLoader
import { AssetLoader } from '../assets/AssetLoader';
// Import the managers type from PixiEngine
import { PixiEngineManagers } from '../core/PixiEngine';
// Import other managers as needed (Controls, Assets, GameState, Rules, PowerUps)
// import { ControlsManager } from '../core/ControlsManager';
// import { GameStateManager } from '../core/GameStateManager';
// import { RuleEngine } from '../core/RuleEngine';
// import { PowerUpManager } from './PowerUpManager';
import { GameConfig } from '../config/GameConfig';

/**
 * Abstract base class for all specific game implementations within the PixiEngine.
 * Provides a standard structure for game lifecycle methods (init, update, destroy)
 * and grants access to shared engine managers.
 * Subclasses must implement the abstract methods.
 */
export abstract class BaseGame {
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
  protected readonly assetLoader: AssetLoader;
  /** Provides access to the application instance for screen size, etc. */
  protected readonly pixiApp: PixiEngineManagers['pixiApp']; // Use indexed access for type safety
  // Add other manager properties with JSDoc comments as they are uncommented/added
  // protected readonly controlsManager: ControlsManager;
  // protected readonly gameStateManager: GameStateManager;
  // protected readonly ruleEngine: RuleEngine;
  // protected readonly powerUpManager: PowerUpManager;

  /** Flag indicating if the game's asynchronous `init()` method has completed successfully. */
  protected isInitialized: boolean = false;

  /**
   * Creates an instance of BaseGame.
   * @param config The specific game configuration object.
   * @param managers An object containing references to all required engine managers, provided by PixiEngine.
   */
  constructor(
    config: GameConfig,
    // Use the imported PixiEngineManagers type directly
    managers: PixiEngineManagers
    /* Remove inline definition 
    {
      eventBus: EventBus;
      storageManager: StorageManager;
      scoringManager: ScoringManager;
      timerManager: TimerManager;
      assetLoader: AssetLoader;
      // Add other managers here
    }
    */
  ) {
    this.config = Object.freeze(config);
    this.eventBus = managers.eventBus;
    this.storageManager = managers.storageManager;
    this.scoringManager = managers.scoringManager;
    this.timerManager = managers.timerManager;
    this.assetLoader = managers.assetLoader;
    this.pixiApp = managers.pixiApp; // Assign pixiApp
    // Assign other managers

    this.view = new Container();
    this.view.label = `GameView-${this.constructor.name}`;
  }

  /**
   * Asynchronously initializes the game. Should typically involve:
   * - Setting up the initial game scene and UI elements.
   * - Loading any assets specific to this game (if not preloaded).
   * - Binding necessary event listeners.
   * - Setting the `isInitialized` flag to true upon successful completion.
   * 
   * Must be implemented by subclasses.
   * @returns A promise that resolves when initialization is complete.
   */
  abstract init(): Promise<void>;

  /**
   * Called every frame by the PixiEngine's update loop (via Ticker).
   * Subclasses must implement this method to update game logic, handle input,
   * move objects, check collisions, etc.
   * 
   * @param delta - Time elapsed since the last frame, usually in milliseconds (provided by PixiEngine).
   */
  abstract update(delta: number): void;

  /**
   * Renders the current game state. 
   * NOTE: In most cases, PixiJS handles rendering automatically through the scene graph.
   * Subclasses typically leave this method empty unless custom rendering logic
   * (e.g., shaders, direct graphics calls) is required.
   */
  abstract render(): void;

  /**
   * Cleans up all resources used by the game instance. Should typically involve:
   * - Removing event listeners bound during `init`.
   * - Stopping and removing any timers created via `timerManager`.
   * - Destroying PixiJS objects (sprites, containers, graphics, text) added to the `view`.
   * - Releasing any other game-specific resources.
   * 
   * Must be implemented by subclasses.
   */
  abstract destroy(): void;

  /**
   * Called by PixiEngine when the game should be paused (e.g., window loses focus).
   * Optional: Subclasses can override to pause game-specific activities like animations,
   * AI, or timers not managed globally.
   */
  public onPause(): void {
    console.log(`${this.constructor.name}: onPause`);
    // Example: Pause game-specific timers or animations
  }

  /**
   * Called by PixiEngine when the game should be resumed after being paused.
   * Optional: Subclasses can override to resume activities paused in `onPause`.
   */
  public onResume(): void {
    console.log(`${this.constructor.name}: onResume`);
    // Example: Resume game-specific timers or animations
  }

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
    // Subclasses implement layout adjustments here.
  }

}
