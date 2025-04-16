import { Container } from 'pixi.js';
import { EventBus } from '../core/EventBus';
import { StorageManager } from '../core/StorageManager';
import { ScoringManager } from './ScoringManager';
import { TimerManager } from './TimerManager';
// Import AssetLoader
import { AssetLoader } from '../assets/AssetLoader';
// Import other managers as needed (Controls, Assets, GameState, Rules, PowerUps)
// import { ControlsManager } from '../core/ControlsManager';
// import { GameStateManager } from '../core/GameStateManager';
// import { RuleEngine } from '../core/RuleEngine';
// import { PowerUpManager } from './PowerUpManager';
import { GameConfig } from '../config/GameConfig';

/**
 * Abstract base class for all specific game implementations within the PixiEngine.
 * Defines the required lifecycle methods and provides access to engine managers.
 */
export abstract class BaseGame {
  /** The main PixiJS container for this game's visual elements. */
  public readonly view: Container;

  /** Reference to the game configuration. */
  protected readonly config: Readonly<GameConfig>;

  // Manager references (passed in constructor)
  protected readonly eventBus: EventBus;
  protected readonly storageManager: StorageManager;
  protected readonly scoringManager: ScoringManager;
  protected readonly timerManager: TimerManager;
  // Add AssetLoader property
  protected readonly assetLoader: AssetLoader;
  // protected readonly controlsManager: ControlsManager;
  // protected readonly gameStateManager: GameStateManager;
  // protected readonly ruleEngine: RuleEngine;
  // protected readonly powerUpManager: PowerUpManager;

  /** Flag indicating if the game has been initialized. */
  protected isInitialized: boolean = false;

  /**
   * Creates an instance of BaseGame.
   * @param config - The specific game configuration.
   * @param managers - An object containing references to all required engine managers.
   */
  constructor(
    config: GameConfig,
    managers: {
      eventBus: EventBus;
      storageManager: StorageManager;
      scoringManager: ScoringManager;
      timerManager: TimerManager;
      // Add AssetLoader to the managers type
      assetLoader: AssetLoader;
      // Add other managers here
    }
  ) {
    this.config = Object.freeze(config);
    this.eventBus = managers.eventBus;
    this.storageManager = managers.storageManager;
    this.scoringManager = managers.scoringManager;
    this.timerManager = managers.timerManager;
    // Assign AssetLoader
    this.assetLoader = managers.assetLoader;
    // Assign other managers

    this.view = new Container();
    this.view.label = `GameView-${this.constructor.name}`;
  }

  /**
   * Initializes the game state, sets up initial scene, loads required assets.
   * Must be implemented by subclasses.
   * Should return a promise that resolves when initialization is complete.
   */
  abstract init(): Promise<void>;

  /**
   * Called every frame by the PixiEngine update loop.
   * Must be implemented by subclasses to update game logic.
   * @param delta - Time elapsed since the last frame (in seconds or ticks, depending on engine).
   */
  abstract update(delta: number): void;

  /**
   * Renders the current game state. This might be implicitly handled by Pixi's scene graph,
   * but can be used for specific rendering logic if needed (e.g., custom shaders, manual draws).
   * Often, subclasses might leave this empty if standard Pixi container updates are sufficient.
   */
  abstract render(): void;

  /**
   * Cleans up all resources used by the game (event listeners, timers, Pixi objects).
   * Must be implemented by subclasses.
   */
  abstract destroy(): void;

  /**
   * Called when the game is paused (e.g., focus loss, explicit pause).
   * Optional: Subclasses can override to pause game-specific logic, animations, timers.
   */
  public onPause(): void {
    console.log(`${this.constructor.name}: onPause`);
    // Default implementation might pause relevant timers
    // this.timerManager.pauseAll();
  }

  /**
   * Called when the game is resumed after being paused.
   * Optional: Subclasses can override to resume logic, animations, timers.
   */
  public onResume(): void {
    console.log(`${this.constructor.name}: onResume`);
    // Default implementation might resume relevant timers
    // this.timerManager.resumeAll();
  }

  /**
   * Called when the application window/view is resized.
   * Optional: Subclasses can override to adjust layout based on new dimensions.
   * @param width - The new width.
   * @param height - The new height.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onResize(width: number, height: number): void {
    console.log(`${this.constructor.name}: onResize (${width}x${height})`);
    // Default implementation does nothing, subclasses handle layout.
  }

}
