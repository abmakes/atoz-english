import * as PIXI from 'pixi.js';
import { Text } from 'pixi.js'; // Explicit import
import { EventBus } from '../core/EventBus'; // Import EventBus
import { TRANSITION_EVENTS, TransitionPowerupSelectedPayload } from '../core/EventTypes'; // Import event types - Removed TransitionStartPayload
import { MathUtils } from '../utils/MathUtils'; // Import MathUtils
// Import PowerUpManager and the new SelectablePowerupInfo interface
import { PowerUpManager, SelectablePowerupInfo } from '../game/PowerUpManager';

// Define the list of power-ups available for random selection
// const SELECTABLE_POWERUPS: string[] = ['double_points', 'time_extension', 'fifty_fifty']; // Replaced skip_question

export interface TransitionScreenConfig {
  type: 'loading' | 'turn' | 'powerup' | 'custom';
  message?: string;
  duration?: number; // Duration in ms for auto-hide
  autoHide?: boolean;
  triggerPowerupRoll?: boolean; // Add the flag here
}

/**
 * A reusable screen component for showing transitions between game states.
 * Displays as a full-screen overlay with centered text elements.
 */
export class TransitionScreen extends PIXI.Container {
  private panelBackground: PIXI.Graphics; // Changed from background
  private messageText: Text;
  private getReadyText: Text; // New text element
  private powerupTextDisplay: Text; // Text to show cycling power-up
  private currentConfig: TransitionScreenConfig | null = null;
  private timeoutId: number | null = null;
  private resolvePromise: (() => void) | null = null;
  private _manualHideResolve: (() => void) | null = null;
  private eventBus: EventBus; // Add EventBus reference
  private powerUpManager: PowerUpManager; // <-- Add PowerUpManager reference
  private app: PIXI.Application; // Store PIXI app reference

  // State for power-up cycling
  private isCyclingPowerups: boolean = false;
  private cycleIntervalId: number | null = null;
  private currentDisplayedPowerupIndex: number = 0;
  private finalSelectedPowerupId: string | null = null;
  private currentSelectablePowerups: SelectablePowerupInfo[] = []; // <-- Store selectable powerups for the current roll
  private readonly CYCLE_INTERVAL_MS = 50; // How fast to cycle
  private readonly CYCLE_DURATION_MS = 1500; // How long to cycle before stopping

  // Panel Dimensions (will be calculated dynamically)
  private panelWidth: number = 0;
  private panelHeight: number = 0;
  // private panelRadius: number = 64; // No longer needed

  constructor(
    app: PIXI.Application, // Pass PIXI app instance
    eventBus: EventBus,
    powerUpManager: PowerUpManager
  ) {
    super();
    this.app = app;
    this.eventBus = eventBus;
    this.powerUpManager = powerUpManager;
    console.log('[TransitionScreen Constructor] PowerUpManager received:', this.powerUpManager);

    this.interactive = true;
    this.eventMode = 'static';
    this.zIndex = RenderLayer.UI_FOREGROUND;

    // Create Panel Background - Draw/Position later in show/resize
    this.panelBackground = new PIXI.Graphics();
    this.addChild(this.panelBackground);

    // Message Text Styling
    this.messageText = new Text({ 
      text: '', 
      style: {
        fontFamily: 'Grandstander',
        fontSize: 64, // Keep size 64
        fontWeight: 'bold',
        fill: 0x114257, // Main text color
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 1 // Placeholder, will be set in show/resize
      }
    });
    this.messageText.anchor.set(0.5);
    this.addChild(this.messageText);

    // Get Ready Text Styling
    this.getReadyText = new Text({
      text: 'Get ready!', // Static text
      style: {
        fontFamily: 'Grandstander',
        fontSize: 42, // Size 42
        fontWeight: 'normal',
        fill: 0x114257, // Same color as main message
        align: 'center'
      }
    });
    this.getReadyText.anchor.set(0.5);
    this.addChild(this.getReadyText);

    // Power-up Text Display
    this.powerupTextDisplay = new Text({
      text: '',
      style: {
        fontFamily: 'Grandstander',
        fontSize: 42,
        fill: 0x059669, // Keep distinct color for power-up
        align: 'center'
      }
    });
    this.powerupTextDisplay.anchor.set(0.5);
    this.powerupTextDisplay.visible = false;
    this.addChild(this.powerupTextDisplay);

    this.visible = false;
  }

  private _updatePanelDimensions(): void {
    // Default fallback dimensions
    let calculatedWidth = 800; 
    let calculatedHeight = 600;
    
    // Priority 1: Try to get dimensions from app.screen
    if (this.app && this.app.screen) {
      if (typeof this.app.screen.width === 'number' && typeof this.app.screen.height === 'number') {
        calculatedWidth = this.app.screen.width;
        calculatedHeight = this.app.screen.height;
        // Check if dimensions are valid
        if (calculatedWidth === 0 || calculatedHeight === 0) {
          console.warn("[TransitionScreen] PIXI App.screen dimensions are 0x0. Falling back.");
          calculatedWidth = 0;
          calculatedHeight = 0;
        } else {
          console.log(`[TransitionScreen] Using app.screen dimensions: ${calculatedWidth}x${calculatedHeight}`);
        }
      } else {
        console.warn("[TransitionScreen] app.screen exists but width/height are not numbers. Falling back.");
      }
    } else {
      console.warn("[TransitionScreen] PIXI App or App.screen not available. Falling back.");
    }
    // Fallback: If still zero, use hardcoded defaults
    if (calculatedWidth === 0 || calculatedHeight === 0) {
      calculatedWidth = 800;
      calculatedHeight = 600;
      console.warn(`[TransitionScreen] Using hardcoded default panel dimensions: ${calculatedWidth}x${calculatedHeight}`);
    }
    this.panelWidth = calculatedWidth;
    this.panelHeight = calculatedHeight;
  }

  private _drawPanelBackground(): void {
    this.panelBackground.clear()
       // Use rect for full screen, no radius
       .rect(0, 0, this.panelWidth, this.panelHeight)
       .fill({ color: 0xe8f8ff, alpha: 0.95 }); // Slightly less transparent
  }

  private _centerPanel(): void {
      // Position at top-left for full screen
      this.panelBackground.x = 0;
      this.panelBackground.y = 0;
  }

  private _centerMessageText(): void {
      // Position main message higher
      const screen = this.app && this.app.screen;
      const screenWidth = screen ? screen.width : 800;
      const screenHeight = screen ? screen.height : 600;
      if (!screen) {
        console.warn("[TransitionScreen] PIXI App.screen not available for message text centering.");
      }
      this.messageText.style.wordWrapWidth = this.panelWidth * 0.9; // panelWidth should be set by _updatePanelDimensions
      this.messageText.position.set(screenWidth / 2, screenHeight / 2 - 80); // Adjusted Y
  }

  private _centerGetReadyText(): void {
      // Position "Get ready!" below the main message
      const screen = this.app && this.app.screen;
      const screenWidth = screen ? screen.width : 800;
      if (!screen) {
        console.warn("[TransitionScreen] PIXI App.screen not available for get ready text centering.");
      }
      this.getReadyText.position.set(
          screenWidth / 2,
          this.messageText.y + this.messageText.height / 2 + 30 // Add padding
      );
  }

  private _centerPowerupText(): void {
      // Position power-up text below "Get ready!" text
      const screen = this.app && this.app.screen;
      const screenWidth = screen ? screen.width : 800;
      if (!screen) {
        console.warn("[TransitionScreen] PIXI App.screen not available for powerup text centering.");
      }
      this.powerupTextDisplay.position.set(
          screenWidth / 2,
          this.getReadyText.y + this.getReadyText.height / 2 + 50 // Add padding
      );
  }

  /**
   * Shows the transition screen with the specified configuration.
   * @param config - Configuration for the transition type, message, duration, etc.
   * @returns A promise that resolves when the transition completes (e.g., after auto-hide duration).
   */
  public async show(config: TransitionScreenConfig): Promise<void> {
    console.log(`[TransitionScreen] show() called. Config:`, config);
    this.currentConfig = config;

    // *** Calculate dimensions and position elements HERE ***
    this._updatePanelDimensions();
    this._drawPanelBackground();
    this._centerPanel();
    this._centerMessageText();
    this._centerGetReadyText(); // Position the new text
    this._centerPowerupText();
    // ****************************************************

    this.messageText.text = config.message || '';
    // wordWrapWidth is set in _centerMessageText

    // Make "Get ready!" visible (it's always the same text)
    this.getReadyText.visible = true;

    this.powerupTextDisplay.text = '';
    this.powerupTextDisplay.visible = false;
    this.visible = true;
    this.alpha = 1;
    this.finalSelectedPowerupId = null;
    this.isCyclingPowerups = false;
    this.currentSelectablePowerups = [];
    if (this.cycleIntervalId) {
        clearInterval(this.cycleIntervalId);
        this.cycleIntervalId = null;
    }

    // Start power-up roll if requested
    if (config.triggerPowerupRoll) {
        console.log('[TransitionScreen show()] Checking this.powerUpManager before getSelectablePowerups:', this.powerUpManager);
        this.currentSelectablePowerups = this.powerUpManager.getSelectablePowerups();
        console.log(`[TransitionScreen] Got ${this.currentSelectablePowerups.length} selectable powerups from manager.`);

        if (this.currentSelectablePowerups.length > 0) {
            this.startPowerupCycle();
        } else {
             console.log("[TransitionScreen] No selectable powerups available for this mode. Skipping roll.");
        }
    }

    // Handle auto-hide logic
    if (config.autoHide && config.duration) {
      console.log(`[TransitionScreen] show(): Starting auto-hide timer for ${config.duration}ms`);
      return new Promise(resolve => {
        // Use window.setTimeout for browser compatibility
        this.timeoutId = window.setTimeout(() => {
          console.log(`[TransitionScreen] show(): Auto-hide timer finished. Calling hide().`);
          this.hide();
          resolve();
          this.timeoutId = null; // Clear timeout ID after execution
        }, config.duration);
      });
    } else {
      console.log(`[TransitionScreen] show(): No auto-hide. Storing manual resolve.`);
      return new Promise(resolve => {
        this._manualHideResolve = resolve;
      });
    }
  }

  /**
   * Gets the configuration object that was used for the currently active transition.
   * Returns null if the screen is not currently visible or was hidden.
   */
  public getCurrentConfig(): TransitionScreenConfig | null {
      return this.currentConfig;
  }

  /**
   * Hides the transition screen.
   * If the screen was shown without autoHide, this resolves the promise returned by show().
   */
  public hide(): void {
    console.log(`[TransitionScreen] hide() called. Current visibility: ${this.visible}`);
    if (this.visible) {
      // Stop timers/intervals first
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      if (this.isCyclingPowerups) {
          console.log("[TransitionScreen] hide(): Cycling was active, stopping and selecting power-up.");
          this.stopPowerupCycle(true);
      }

      // Emit event if a power-up was selected *before* hiding
      if (this.finalSelectedPowerupId) {
          console.log(`[TransitionScreen] hide(): Emitting POWERUP_SELECTED (${this.finalSelectedPowerupId})`);
          const payload: TransitionPowerupSelectedPayload = {
              selectedPowerupId: this.finalSelectedPowerupId,
              transitionType: this.currentConfig?.type || 'custom'
          };
          this.eventBus.emit(TRANSITION_EVENTS.POWERUP_SELECTED, payload);
          this.finalSelectedPowerupId = null; // Clear after emitting
      }

      this.visible = false;
      console.log(`[TransitionScreen] hide(): Set visible = false.`);

      if (this._manualHideResolve) {
        console.log(`[TransitionScreen] hide(): Calling stored manualHideResolve().`);
        this._manualHideResolve();
        this._manualHideResolve = null;
      }
    } else {
      console.log(`[TransitionScreen] hide(): Already hidden. Doing nothing.`);
    }
  }

  /**
   * Update method (called by game loop if needed).
   * Currently unused, but placeholder for future animations (e.g., wheel spin).
   * @param delta - Time elapsed since last frame.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(delta: number): void {
    // Future: Update animations (e.g., loading spinner, power-up wheel)
  }

  /**
   * Adjusts layout when the screen resizes.
   */
  public onResize(): void { // Now doesn't need parameters
    if (!this.visible) return;
    console.log("[TransitionScreen] onResize triggered.");

    // Recalculate dimensions and redraw based on the current app screen size
    this._updatePanelDimensions(); // This will use this.app.screen with checks
    this._drawPanelBackground();
    this._centerPanel();
    this._centerMessageText();
    this._centerGetReadyText();
    this._centerPowerupText();
  }

  /**
   * Starts the visual cycling effect for power-up selection.
   */
  private startPowerupCycle(): void {
    if (this.currentSelectablePowerups.length === 0) return; // Should not happen if check in show() is correct

    console.log("[TransitionScreen] Starting power-up cycle...");
    this.isCyclingPowerups = true;
    this.powerupTextDisplay.visible = true;
    this.currentDisplayedPowerupIndex = 0;

    this.cycleIntervalId = window.setInterval(() => {
      // Cycle through the display names
      const powerupInfo = this.currentSelectablePowerups[this.currentDisplayedPowerupIndex];
      this.powerupTextDisplay.text = powerupInfo.displayName; // <-- Use displayName
      this.currentDisplayedPowerupIndex = (this.currentDisplayedPowerupIndex + 1) % this.currentSelectablePowerups.length;
    }, this.CYCLE_INTERVAL_MS);

    // Set a timeout to stop the cycle
    setTimeout(() => {
      // Check if we haven't already stopped (e.g., by hide() being called early)
      if (this.isCyclingPowerups) {
          this.stopPowerupCycle();
      }
    }, this.CYCLE_DURATION_MS);
  }

  /**
   * Stops the visual cycling and selects the final power-up.
   * @param forceImmediate - If true, stops immediately without waiting for the next interval tick.
   */
  private stopPowerupCycle(forceImmediate: boolean = false): void {
    if (!this.isCyclingPowerups) return;

    console.log(`[TransitionScreen] Stopping power-up cycle... (immediate: ${forceImmediate})`);
    this.isCyclingPowerups = false;
    if (this.cycleIntervalId) {
      clearInterval(this.cycleIntervalId);
      this.cycleIntervalId = null;
    }

    if (this.currentSelectablePowerups.length > 0) {
      // Select a random power-up from the *filtered* list
      const randomIndex = MathUtils.randomIntRange(0, this.currentSelectablePowerups.length - 1);
      const selectedPowerup = this.currentSelectablePowerups[randomIndex];
      
      this.finalSelectedPowerupId = selectedPowerup.id; // <-- Store the ID
      this.powerupTextDisplay.text = selectedPowerup.displayName; // <-- Display final name
      console.log(`[TransitionScreen] Final power-up selected: ID=${this.finalSelectedPowerupId}, Name=${selectedPowerup.displayName}`);
    } else {
        console.warn("[TransitionScreen] stopPowerupCycle called, but no selectable powerups were available.");
        this.powerupTextDisplay.text = "No Power-ups!"; // Indicate none available
        this.finalSelectedPowerupId = null;
    }
    // Note: The event emission is now handled in the hide() method
  }

  /**
   * Cleans up resources when the screen is destroyed.
   */
  public destroy(options?: boolean | PIXI.DestroyOptions | undefined): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    // Prevent memory leaks if a promise is still pending during destruction
    if (this.resolvePromise) {
        console.warn("TransitionScreen destroyed while a transition promise was pending.");
        this.resolvePromise(); // Resolve it immediately
        this.resolvePromise = null;
    }
    // Clear cycle interval if active
    if (this.cycleIntervalId) {
        clearInterval(this.cycleIntervalId);
        this.cycleIntervalId = null;
    }
    // Destroy the new text element
    this.getReadyText.destroy();
    super.destroy(options);
  }
}

// Helper enum (assuming RenderLayer might not be directly importable here)
// If RenderLayer is globally accessible or can be imported, use that instead.
const enum RenderLayer { 
    UI_FOREGROUND = 60 
}
