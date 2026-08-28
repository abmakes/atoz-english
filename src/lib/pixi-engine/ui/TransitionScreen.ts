import * as PIXI from 'pixi.js';
import { Text } from 'pixi.js'; // Explicit import
import { EventBus } from '../core/EventBus'; // Import EventBus
import { TRANSITION_EVENTS, TransitionPowerupSelectedPayload } from '../core/EventTypes'; // Import event types - Removed TransitionStartPayload
// Import PowerUpManager and the new SelectablePowerupInfo interface
import { PowerUpManager, SelectablePowerupInfo } from '../game/PowerUpManager';
import { PowerupSpinWheel } from './PowerupSpinWheel';
import { GameStateManager } from '../core/GameStateManager';
import { AssetLoader } from '../assets/AssetLoader';

// Define the list of power-ups available for random selection
// const SELECTABLE_POWERUPS: string[] = ['double_points', 'time_extension', 'fifty_fifty']; // Replaced skip_question

export interface TransitionScreenConfig {
  type: 'loading' | 'turn' | 'powerup' | 'custom' | 'question_preview' | 'countdown' | 'go';
  message?: string;
  duration?: number; // Duration in ms for auto-hide
  autoHide?: boolean;
  triggerPowerupRoll?: boolean;
  /** Ordered wheel slots for this spin (dynamic pool). Falls back to manager list. */
  powerupWheelSegments?: SelectablePowerupInfo[];
  question?: { question: string; imageUrl?: string; [key: string]: unknown };
  showCountdown?: boolean;
  questionCounter?: { current: number; total: number };
}

/**
 * A reusable screen component for showing transitions between game states.
 * Displays as a full-screen overlay with centered text elements.
 */
export class TransitionScreen extends PIXI.Container {
  private panelBackground: PIXI.Graphics; // Changed from background
  private messageText: Text;
  private questionText: Text; // For question preview
  private questionImage: PIXI.Sprite | null = null; // For question image
  private countdownText: Text; // For countdown
  private goText: Text; // For GO! text
  private questionCounterText: Text; // For "Question X of Y" display
  private powerupSpinWheel: PowerupSpinWheel | null = null; // Spin wheel for powerup selection
  private currentConfig: TransitionScreenConfig | null = null;
  private timeoutId: number | null = null;
  private resolvePromise: (() => void) | null = null;
  private _manualHideResolve: (() => void) | null = null;
  private eventBus: EventBus; // Add EventBus reference
  private powerUpManager: PowerUpManager; // <-- Add PowerUpManager reference
  private gameStateManager: GameStateManager; // Add GameStateManager reference
  private app: PIXI.Application; // Store PIXI app reference
  private assetLoader: typeof AssetLoader; // Add AssetLoader reference

  // State for power-up selection
  private finalSelectedPowerupId: string | null = null;
  private powerupSelectionEmitted = false;
  private currentSelectablePowerups: SelectablePowerupInfo[] = [];

  // Panel Dimensions (will be calculated dynamically)
  private panelWidth: number = 0;
  private panelHeight: number = 0;
  // private panelRadius: number = 64; // No longer needed

  constructor(
    app: PIXI.Application, // Pass PIXI app instance
    eventBus: EventBus,
    powerUpManager: PowerUpManager,
    gameStateManager: GameStateManager,
    assetLoader: typeof AssetLoader
  ) {
    super();
    this.app = app;
    this.eventBus = eventBus;
    this.powerUpManager = powerUpManager;
    this.gameStateManager = gameStateManager;
    this.assetLoader = assetLoader;
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

    // Question text for question preview
    this.questionText = new Text({ 
      text: '', 
      style: {
        fontFamily: 'Grandstander',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0x114257,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 1 // Placeholder, will be set in show/resize
      }
    });
    this.questionText.anchor.set(0.5);
    this.addChild(this.questionText);

    // Countdown text
    this.countdownText = new Text({ 
      text: '', 
      style: {
        fontFamily: 'Grandstander',
        fontSize: 120,
        fontWeight: 'bold',
        fill: 0xFFD700,
        align: 'center',
        stroke: { color: 0x000000, width: 6 }
      }
    });
    this.countdownText.anchor.set(0.5);
    this.addChild(this.countdownText);

    // GO! text
    this.goText = new Text({ 
      text: 'GO!', 
      style: {
        fontFamily: 'Grandstander',
        fontSize: 100,
        fontWeight: 'bold',
        fill: 0x00FF00,
        align: 'center',
        stroke: { color: 0x000000, width: 6 }
      }
    });
    this.goText.anchor.set(0.5);
    this.addChild(this.goText);

    // Question counter text
    this.questionCounterText = new Text({ 
      text: '', 
      style: {
        fontFamily: 'Grandstander',
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0x114257,
        align: 'center'
      }
    });
    this.questionCounterText.anchor.set(0.5);
    this.addChild(this.questionCounterText);

    // Power-up Spin Wheel (will be created when needed)
    this.powerupSpinWheel = null;

    this.visible = false;
  }

  private _updatePanelDimensions(): void {
    // Make it full screen
    this.panelWidth = this.app.screen.width;
    this.panelHeight = this.app.screen.height;
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

  private _centerMessageText(powerupRoll = false): void {
      this.messageText.style.wordWrapWidth = this.panelWidth * 0.9;
      if (powerupRoll) {
        // Portrait wheel intentionally crops at the sides; keep the turn label
        // compact in the HUD-safe top band.
        const portrait = this.panelWidth < 640 && this.panelHeight > this.panelWidth;
        this.messageText.style.fontSize = portrait ? 30 : 36;
        this.messageText.position.set(
          this.app.screen.width / 2,
          this.app.screen.height * (portrait ? 0.14 : 0.12)
        );
      } else {
        this.messageText.style.fontSize = 64;
        this.messageText.position.set(this.app.screen.width / 2, this.app.screen.height * 0.4);
      }
  }

  private _centerQuestionCounterText(powerupRoll = false): void {
      if (powerupRoll) {
        this.questionCounterText.position.set(
          this.app.screen.width / 2,
          this.app.screen.height * 0.06
        );
      } else {
        this.questionCounterText.position.set(
          this.app.screen.width / 2,
          this.app.screen.height * 0.25
        );
      }
  }

  /** Keep turn + counter in the top band while the spinner owns the center. */
  private _layoutForPowerupRoll(): void {
    this._centerMessageText(true);
    this._centerQuestionCounterText(true);
    this.messageText.zIndex = 10;
    this.questionCounterText.zIndex = 10;
    if (this.powerupSpinWheel) {
      this.powerupSpinWheel.zIndex = 50;
    }
    this.sortableChildren = true;
  }

  private _centerQuestionText(): void {
      // Position question text in bottom half of screen
      this.questionText.style.wordWrapWidth = this.panelWidth * 0.8;
      this.questionText.position.set(this.app.screen.width / 2, this.app.screen.height * 0.75); // Bottom quarter
  }

  private _centerCountdownText(): void {
      // Position countdown in center
      this.countdownText.position.set(this.app.screen.width / 2, this.app.screen.height / 2 + 30);
  }

  private _centerGoText(): void {
      // Position GO! in center
      this.goText.position.set(this.app.screen.width / 2, this.app.screen.height / 2 + 30);
  } 


  private _centerPowerupText(): void {
    // This method is no longer needed with spin wheel
  }

  private _resetUIElements(): void {
    this.messageText.visible = true;
    this.questionText.visible = false;
    this.countdownText.visible = false;
    this.goText.visible = false;
    // Don't hide question counter here - it will be controlled by config
    
    if (this.questionImage) {
      this.questionImage.destroy();
      this.questionImage = null;
    }
  }

  private async _showQuestionPreview(question: { question: string; imageUrl?: string; [key: string]: unknown }): Promise<void> {
    // Phase 1: Show "Get Ready!" in top half, question in bottom half
    this.messageText.text = 'Get Ready!';
    this.messageText.visible = true;
    this.questionText.text = question.question;
    this.questionText.visible = true;

    // Wait 1 second, then hide "Get Ready!" and show image
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Phase 2: Hide "Get Ready!" and show image in top half
    this.messageText.visible = false;
    
    // Load and display question image if it exists
    if (question.imageUrl) {
      try {
        console.log('Loading question image:', question.imageUrl);
        // CRITICAL: Use AssetLoader.getDisplayObject() for proper GIF handling
        const displayObject = this.assetLoader.getDisplayObject(question.imageUrl);
        
        if (displayObject) {
          // CRITICAL: Handle different display object types
          const isSprite = displayObject instanceof PIXI.Sprite;
          const isAnimatedSprite = displayObject instanceof PIXI.AnimatedSprite;
          
          if (isSprite || isAnimatedSprite) {
            this.questionImage = displayObject as PIXI.Sprite;
            this.questionImage.anchor.set(0.5);
            this.questionImage.x = this.app.screen.width / 2;
            this.questionImage.y = this.app.screen.height * 0.25; // Top quarter, same as "Get Ready!"
            
            // Scale image to fit nicely in the top half
            const maxWidth = this.app.screen.width * 0.8;
            const maxHeight = this.app.screen.height * 0.4; // Top half minus some padding
            const scaleX = maxWidth / this.questionImage.width;
            const scaleY = maxHeight / this.questionImage.height;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
            this.questionImage.scale.set(scale);
            
            this.addChild(this.questionImage);
            
            // CRITICAL: Handle animation for AnimatedSprites
            if (isAnimatedSprite) {
              console.log(`[TransitionScreen] Starting animation for AnimatedSprite: ${question.image}`);
              if (!displayObject.playing) {
                setTimeout(() => {
                  if (displayObject && !displayObject.destroyed) {
                    displayObject.play(); // CRITICAL: This starts animation!
                    console.log(`[TransitionScreen] Animation started for: ${question.image}`);
                  }
                }, 50);
              }
            }
            
            console.log('Question image loaded and displayed');
          } else {
            // Check for GifSprite separately
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const gifSprite = displayObject as any;
            if (gifSprite && typeof gifSprite.play === 'function') {
              this.questionImage = gifSprite as PIXI.Sprite;
              this.questionImage.anchor.set(0.5);
              this.questionImage.x = this.app.screen.width / 2;
              this.questionImage.y = this.app.screen.height * 0.25;
              
              // Scale image to fit nicely in the top half
              const maxWidth = this.app.screen.width * 0.8;
              const maxHeight = this.app.screen.height * 0.4;
              const scaleX = maxWidth / this.questionImage.width;
              const scaleY = maxHeight / this.questionImage.height;
              const scale = Math.min(scaleX, scaleY, 1);
              this.questionImage.scale.set(scale);
              
              this.addChild(this.questionImage);
              
              // Start GIF animation
              console.log(`[TransitionScreen] Starting animation for GifSprite: ${question.image}`);
              if (!gifSprite.playing) {
                setTimeout(() => {
                  if (gifSprite && !gifSprite.destroyed) {
                    gifSprite.play();
                    console.log(`[TransitionScreen] GIF animation started for: ${question.image}`);
                  }
                }, 50);
              }
              
              console.log('Question GIF loaded and displayed');
            } else {
              console.warn(`[TransitionScreen] Unsupported display object type for: ${question.image}`);
            }
          }
        } else {
          console.warn(`[TransitionScreen] AssetLoader.getDisplayObject returned null for: ${question.image}`);
        }
      } catch (error) {
        console.warn('Failed to load question image:', error);
        // If image fails to load, show a placeholder or continue without it
      }
    }

    // Wait 1 more second with image and question both visible, then start countdown
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Phase 3: Start countdown with both image and question visible
    if (this.currentConfig?.showCountdown) {
      this._showCountdown();
    }
  }

  private _showCountdown(): void {
    // Keep image and question visible during countdown
    this.messageText.visible = false;
    this.questionText.visible = true; // Keep question visible
    this.countdownText.visible = true;
    
    let count = 3;
    this.countdownText.text = count.toString();
    
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        this.countdownText.text = count.toString();
      } else {
        clearInterval(countdownInterval);
        this._showGo();
      }
    }, 1000);
  }

  private _showGo(): void {
    // Keep image and question visible during GO!
    this.countdownText.visible = false;
    this.questionText.visible = true; // Keep question visible
    this.goText.visible = true;
    
    // Emit event when GO! appears to start timer
    this.eventBus.emit(TRANSITION_EVENTS.GO_SHOWN);
    
    // Add some animation to GO! text
    this.goText.scale.set(0.5);
    const targetScale = 1.2;
    const startTime = Date.now();
    const duration = 500;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const scale = 0.5 + (targetScale - 0.5) * progress;
      this.goText.scale.set(scale);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
    
    // Hide after 1 second
    setTimeout(() => {
      this.hide();
    }, 1000);
  }

  /**
   * Creates the spin wheel. Selection is determined by whichever segment the
   * top arrow points at when the wheel stops — then POWERUP_SELECTED is emitted.
   */
  private createPowerupSpinWheel(): void {
    if (this.powerupSpinWheel) {
      this.removeChild(this.powerupSpinWheel);
      this.powerupSpinWheel.destroy();
    }

    // Predetermine a fair landing segment so animation can ease onto it;
    // the reported result still comes from the arrow/segment under the pointer.
    const filledIndexes = this.currentSelectablePowerups
      .map((p, i) => (p && p.id !== 'none' ? i : -1))
      .filter((i) => i >= 0);
    const preselectedSegmentIndex =
      filledIndexes.length > 0
        ? filledIndexes[Math.floor(Math.random() * filledIndexes.length)]
        : Math.floor(Math.random() * Math.max(this.currentSelectablePowerups.length, 1));

    console.log(
      '[TransitionScreen] Creating spin wheel. Segments:',
      this.currentSelectablePowerups.map((p) => p.displayName),
      'landing index:',
      preselectedSegmentIndex
    );

    this.powerupSpinWheel = new PowerupSpinWheel({
      powerups: this.currentSelectablePowerups,
      preselectedSegmentIndex,
      onSelection: (selectedPowerup) => {
        this.finalSelectedPowerupId = selectedPowerup.id;
        console.log(
          `[TransitionScreen] Arrow landed on: ${selectedPowerup.displayName} (${selectedPowerup.id})`
        );

        if (!this.powerupSelectionEmitted) {
          this.powerupSelectionEmitted = true;
          const payload: TransitionPowerupSelectedPayload = {
            selectedPowerupId: selectedPowerup.id,
            transitionType: this.currentConfig?.type || 'custom',
            slotId: selectedPowerup.slotId,
          };
          this.eventBus.emit(TRANSITION_EVENTS.POWERUP_SELECTED, payload);
        }
      },
      onSpinComplete: () => {
        // Wheel already held the result card ~2.5–3s — dismiss immediately
        console.log('[TransitionScreen] Spin wheel reveal complete — hiding');
        this.hide();
      },
    });

    this.powerupSpinWheel.initialize(this.panelWidth, this.panelHeight);
    this.powerupSpinWheel.zIndex = 50;
    this.addChild(this.powerupSpinWheel);
    this._layoutForPowerupRoll();
  }

  /**
   * Shows the transition screen with the specified configuration.
   * @param config - Configuration for the transition type, message, duration, etc.
   * @returns A promise that resolves when the transition completes (e.g., after auto-hide duration).
   */
  public async show(config: TransitionScreenConfig): Promise<void> {
    console.log(`[TransitionScreen] show() called. Config:`, config);
    this.currentConfig = config;

    const willRollPowerups = Boolean(config.triggerPowerupRoll);

    // *** Calculate dimensions and position elements HERE ***
    this._updatePanelDimensions();
    this._drawPanelBackground();
    this._centerPanel();
    this._centerMessageText(willRollPowerups);
    this._centerQuestionCounterText(willRollPowerups);
    this._centerQuestionText();
    this._centerCountdownText();
    this._centerGoText();
    this._centerPowerupText();
    // ****************************************************

    this.messageText.text = config.message || '';
    // wordWrapWidth is set in _centerMessageText

    // Set question counter text if provided
    if (config.questionCounter) {
      this.questionCounterText.text = `Question ${config.questionCounter.current} of ${config.questionCounter.total}`;
      this.questionCounterText.visible = true;
    } else {
      this.questionCounterText.visible = false;
    }

    // Handle different transition types
    this._resetUIElements();
    
    if (config.type === 'question_preview' && config.question) {
      // Start the question preview flow (this will handle its own timing)
      this._showQuestionPreview(config.question).catch(error => {
        console.error('Error in question preview:', error);
        // Fallback to countdown if preview fails
        if (config.showCountdown) {
          this._showCountdown();
        }
      });
    } else if (config.type === 'countdown') {
      this._showCountdown();
    } else if (config.type === 'go') {
      this._showGo();
    }

    this.visible = true;
    this.alpha = 1;
    this.finalSelectedPowerupId = null;
    this.powerupSelectionEmitted = false;
    this.currentSelectablePowerups = [];

    let powerupRollActive = false;

    // Create power-up spin wheel if requested (for any transition type)
    if (config.triggerPowerupRoll) {
        this.currentSelectablePowerups =
          config.powerupWheelSegments && config.powerupWheelSegments.length > 0
            ? config.powerupWheelSegments
            : this.powerUpManager.getSelectablePowerups();

        console.log(
          `[TransitionScreen] Got ${this.currentSelectablePowerups.length} wheel segments.`
        );

        if (this.currentSelectablePowerups.length > 0) {
            this.createPowerupSpinWheel();
            powerupRollActive = true;
        } else {
             console.log("[TransitionScreen] No selectable powerups available for this mode. Skipping roll.");
             // No wheel — restore normal mid-screen turn layout
             this._centerMessageText(false);
             this._centerQuestionCounterText(false);
        }
    }

    // Handle auto-hide logic - but not when there's an active powerup roll
    if (config.autoHide && config.duration && !powerupRollActive) {
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
      // Spin wheel cleanup is handled in the wheel's onSpinComplete callback

      // Backup emit only if the wheel never reported (should be rare)
      if (this.finalSelectedPowerupId && !this.powerupSelectionEmitted) {
          this.powerupSelectionEmitted = true;
          const payload: TransitionPowerupSelectedPayload = {
              selectedPowerupId: this.finalSelectedPowerupId,
              transitionType: this.currentConfig?.type || 'custom'
          };
          this.eventBus.emit(TRANSITION_EVENTS.POWERUP_SELECTED, payload);
          this.finalSelectedPowerupId = null;
      } else {
          this.finalSelectedPowerupId = null;
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
   * Adjusts layout when the screen resizes.
   */
  public onResize(): void { // Now doesn't need parameters
    const powerupRoll = Boolean(this.powerupSpinWheel);
    this._updatePanelDimensions();
    this._drawPanelBackground();
    this._centerPanel();
    this._centerMessageText(powerupRoll);
    this._centerQuestionCounterText(powerupRoll);
    this._centerQuestionText();
    this._centerCountdownText();
    this._centerGoText();
    this._centerPowerupText();
    
    // Update image position if it exists
    if (this.questionImage) {
      this.questionImage.x = this.app.screen.width / 2;
      this.questionImage.y = this.app.screen.height * 0.25;
      
      // Recalculate scale for new screen size
      const maxWidth = this.app.screen.width * 0.8;
      const maxHeight = this.app.screen.height * 0.4;
      const scaleX = maxWidth / (this.questionImage.width / this.questionImage.scale.x);
      const scaleY = maxHeight / (this.questionImage.height / this.questionImage.scale.y);
      const scale = Math.min(scaleX, scaleY, 1);
      this.questionImage.scale.set(scale);
    }
    
    // Resize spin wheel if it exists
    if (this.powerupSpinWheel) {
      this.powerupSpinWheel.resize(this.panelWidth, this.panelHeight);
      this._layoutForPowerupRoll();
    }
  }



  /**
   * Updates the transition screen (for spin wheel animation).
   */
  public update(delta: number): void {
    if (this.powerupSpinWheel) {
      this.powerupSpinWheel.update(delta);
    }
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
    // Clean up spin wheel
    if (this.powerupSpinWheel) {
      this.removeChild(this.powerupSpinWheel);
      this.powerupSpinWheel.destroy();
      this.powerupSpinWheel = null;
    }
    // Destroy the new text element
    super.destroy(options);
  }
}

// Helper enum (assuming RenderLayer might not be directly importable here)
// If RenderLayer is globally accessible or can be imported, use that instead.
const enum RenderLayer { 
    UI_FOREGROUND = 60 
}
