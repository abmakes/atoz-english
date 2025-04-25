import * as PIXI from 'pixi.js';
import { Text } from 'pixi.js'; // Explicit import

export interface TransitionScreenConfig {
  type: 'loading' | 'turn' | 'powerup' | 'custom';
  message?: string;
  duration?: number; // Duration in ms for auto-hide
  autoHide?: boolean;
}

/**
 * A reusable screen component for showing transitions between game states.
 * Handles displaying messages, loading indicators, and potential future elements like a power-up wheel.
 */
export class TransitionScreen extends PIXI.Container {
  private background: PIXI.Graphics;
  private messageText: Text;
  private currentConfig: TransitionScreenConfig | null = null;
  private timeoutId: number | null = null;
  private resolvePromise: (() => void) | null = null;
  private _manualHideResolve: (() => void) | null = null;

  constructor(screenWidth: number, screenHeight: number) {
    super();

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
    this.visible = true;
    this.alpha = 1;

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
      this.visible = false;
      // this.currentConfig = null; // <-- Ensure this line is commented out or removed
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
    super.destroy(options);
  }
}

// Helper enum (assuming RenderLayer might not be directly importable here)
// If RenderLayer is globally accessible or can be imported, use that instead.
const enum RenderLayer { 
    UI_FOREGROUND = 60 
}
