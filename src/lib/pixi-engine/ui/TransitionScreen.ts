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
 * Handles displaying messages, loading indicators, and potential future elements like a power-up wheel.
 */
export class TransitionScreen extends PIXI.Container {
  private background: PIXI.Graphics;
  private messageText: Text;
  private powerupTextDisplay: Text; // Text to show cycling power-up
  private currentConfig: TransitionScreenConfig | null = null;
  private timeoutId: number | null = null;
  private resolvePromise: (() => void) | null = null;
  private _manualHideResolve: (() => void) | null = null;
  private eventBus: EventBus; // Add EventBus reference
  private powerUpManager: PowerUpManager; // <-- Add PowerUpManager reference

  // State for power-up cycling
  private isCyclingPowerups: boolean = false;
  private cycleIntervalId: number | null = null;
  private currentDisplayedPowerupIndex: number = 0;
  private finalSelectedPowerupId: string | null = null;
  private currentSelectablePowerups: SelectablePowerupInfo[] = []; // <-- Store selectable powerups for the current roll
  private readonly CYCLE_INTERVAL_MS = 50; // How fast to cycle
  private readonly CYCLE_DURATION_MS = 1500; // How long to cycle before stopping

  constructor(
    screenWidth: number, 
    screenHeight: number, 
    eventBus: EventBus, 
    powerUpManager: PowerUpManager // <-- Add powerUpManager parameter
  ) {
    super();
    this.eventBus = eventBus; // Store EventBus
    this.powerUpManager = powerUpManager; // <-- Store PowerUpManager
    console.log('[TransitionScreen Constructor] PowerUpManager received:', this.powerUpManager); // DEBUG LOG

    // Make it interactive to block clicks on elements behind it
    this.interactive = true;
    this.eventMode = 'static'; // Use 'static' for optimized hit testing
    // Set a high zIndex to ensure it appears on top
    this.zIndex = RenderLayer.UI_FOREGROUND; // Assuming RenderLayer is available or use a high number

    // Semi-transparent background
    this.background = new PIXI.Graphics()
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: 0x000000, alpha: 0.7 });
    this.addChild(this.background);

    // Message Text
    this.messageText = new Text({ 
      text: '', 
      style: {
        fontFamily: 'Arial', // TODO: Use a themed font?
        fontSize: 48,
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: screenWidth * 0.8
      }
    });
    this.messageText.anchor.set(0.5);
    this.messageText.position.set(screenWidth / 2, screenHeight / 2);
    this.addChild(this.messageText);

    // Power-up Text Display (initially hidden or empty)
    this.powerupTextDisplay = new Text({ 
      text: '', 
      style: {
        fontFamily: 'Arial', 
        fontSize: 36, 
        fill: 0xFFFF00, // Yellow color for emphasis
        align: 'center' 
      }
    });
    this.powerupTextDisplay.anchor.set(0.5);
    // Position it below the main message
    this.powerupTextDisplay.position.set(screenWidth / 2, screenHeight / 2 + 60);
    this.powerupTextDisplay.visible = false; // Start hidden
    this.addChild(this.powerupTextDisplay);

    // Initially hidden
    this.visible = false;
  }

  /**
   * Shows the transition screen with the specified configuration.
   * @param config - Configuration for the transition type, message, duration, etc.
   * @returns A promise that resolves when the transition completes (e.g., after auto-hide duration).
   */
  public async show(config: TransitionScreenConfig): Promise<void> {
    console.log(`[TransitionScreen] show() called. Config:`, config);
    this.currentConfig = config;
    this.messageText.text = config.message || '';
    this.powerupTextDisplay.text = ''; // Reset power-up text
    this.powerupTextDisplay.visible = false; // Ensure hidden initially
    this.visible = true;
    this.alpha = 1;
    this.finalSelectedPowerupId = null; // Reset selection
    this.isCyclingPowerups = false;
    this.currentSelectablePowerups = []; // Reset selectable list
    if (this.cycleIntervalId) {
        clearInterval(this.cycleIntervalId);
        this.cycleIntervalId = null;
    }

    // Start power-up roll if requested
    if (config.triggerPowerupRoll) {
        // DEBUG LOG before accessing powerUpManager
        console.log('[TransitionScreen show()] Checking this.powerUpManager before getSelectablePowerups:', this.powerUpManager);
        // Get selectable power-ups from the manager
        this.currentSelectablePowerups = this.powerUpManager.getSelectablePowerups(); 
        console.log(`[TransitionScreen] Got ${this.currentSelectablePowerups.length} selectable powerups from manager.`); // DEBUG
        
        if (this.currentSelectablePowerups.length > 0) {
            this.startPowerupCycle();
        } else {
             console.log("[TransitionScreen] No selectable powerups available for this mode. Skipping roll.");
        }
    }

    // Handle auto-hide logic
    if (config.autoHide && config.duration) {
      console.log(`[TransitionScreen] show(): Starting auto-hide timer for ${config.duration}ms`);
      // Return a promise that resolves after the duration
      return new Promise(resolve => {
        setTimeout(() => {
          console.log(`[TransitionScreen] show(): Auto-hide timer finished. Calling hide().`);
          this.hide(); // Hide the screen automatically
          resolve(); // Resolve the promise
        }, config.duration);
      });
    } else {
      console.log(`[TransitionScreen] show(): No auto-hide. Storing manual resolve.`);
      // If not auto-hiding, return a promise that resolves ONLY when hide() is called manually.
      return new Promise(resolve => {
        this._manualHideResolve = resolve; // Store the resolve function
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
      // --- Power-up Selection Logic --- START ---
      if (this.isCyclingPowerups) {
          // If still cycling when hide is called, stop it immediately and select
          console.log("[TransitionScreen] hide(): Cycling was active, stopping and selecting power-up.");
          this.stopPowerupCycle(true); // Force immediate stop and selection
      }
      
      // Emit event if a power-up was selected *before* setting visible = false
      if (this.finalSelectedPowerupId) {
          console.log(`[TransitionScreen] hide(): Emitting POWERUP_SELECTED (${this.finalSelectedPowerupId})`);
          const payload: TransitionPowerupSelectedPayload = {
              selectedPowerupId: this.finalSelectedPowerupId,
              transitionType: this.currentConfig?.type || 'custom'
          };
          this.eventBus.emit(TRANSITION_EVENTS.POWERUP_SELECTED, payload);
          this.finalSelectedPowerupId = null; // Clear after emitting
      }
      // --- Power-up Selection Logic --- END ---

      this.visible = false;
      console.log(`[TransitionScreen] hide(): Set visible = false.`);

      // If a manual resolve function exists (from a non-autoHide show), call it
      if (this._manualHideResolve) {
        console.log(`[TransitionScreen] hide(): Calling stored manualHideResolve().`);
        this._manualHideResolve();
        this._manualHideResolve = null; // Clear it after use
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
   * @param screenWidth - New screen width.
   * @param screenHeight - New screen height.
   */
  public onResize(screenWidth: number, screenHeight: number): void {
    // Resize background
    this.background.clear()
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: 0x000000, alpha: 0.7 });

    // Reposition and resize message text
    this.messageText.style.wordWrapWidth = screenWidth * 0.8;
    this.messageText.position.set(screenWidth / 2, screenHeight / 2);
    
    // TODO: Reposition other elements (spinner, wheel placeholder) if added
    this.powerupTextDisplay.position.set(screenWidth / 2, screenHeight / 2 + 60);
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
    super.destroy(options);
  }
}

// Helper enum (assuming RenderLayer might not be directly importable here)
// If RenderLayer is globally accessible or can be imported, use that instead.
const enum RenderLayer { 
    UI_FOREGROUND = 60 
}
