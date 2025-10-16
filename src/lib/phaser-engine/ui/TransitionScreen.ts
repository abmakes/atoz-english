import { Scene, GameObjects } from 'phaser';
import { EventBus } from '../core/EventBus';
import { TRANSITION_EVENTS, TransitionPowerupSelectedPayload } from '../core/EventTypes';
import { PowerUpManager, SelectablePowerupInfo } from '../game/PowerUpManager';
import { PowerupSpinWheel } from './PowerupSpinWheel';
import { GameStateManager } from '../core/GameStateManager';
import { RenderLayer } from '../game/BaseGame';

export interface TransitionScreenConfig {
  type: 'loading' | 'turn' | 'powerup' | 'custom' | 'question_preview' | 'countdown' | 'go';
  message?: string;
  duration?: number; // Duration in ms for auto-hide
  autoHide?: boolean;
  triggerPowerupRoll?: boolean;
  question?: { question: string; imageUrl?: string; [key: string]: unknown };
  showCountdown?: boolean;
}

/**
 * A reusable screen component for showing transitions between game states.
 * Displays as a full-screen overlay with centered text elements.
 * 
 * This is a port from the PixiJS version, now using Phaser GameObjects.
 */
export class TransitionScreen extends GameObjects.Container {
  private panelBackground: GameObjects.Graphics;
  private messageText: GameObjects.Text;
  private questionText: GameObjects.Text;
  private questionImage: GameObjects.Sprite | null = null;
  private countdownText: GameObjects.Text;
  private goText: GameObjects.Text;
  private powerupSpinWheel: PowerupSpinWheel | null = null;
  private currentConfig: TransitionScreenConfig | null = null;
  private timeoutId: number | null = null;
  private resolvePromise: (() => void) | null = null;
  private _manualHideResolve: (() => void) | null = null;
  private eventBus: EventBus;
  private powerUpManager: PowerUpManager;
  private gameStateManager: GameStateManager;
  private scene: Scene;

  // State for power-up selection
  private finalSelectedPowerupId: string | null = null;
  private currentSelectablePowerups: SelectablePowerupInfo[] = [];

  // Panel Dimensions
  private panelWidth: number = 0;
  private panelHeight: number = 0;

  constructor(
    scene: Scene,
    eventBus: EventBus,
    powerUpManager: PowerUpManager,
    gameStateManager: GameStateManager
  ) {
    super(scene, 0, 0);
    
    this.scene = scene;
    this.eventBus = eventBus;
    this.powerUpManager = powerUpManager;
    this.gameStateManager = gameStateManager;
    
    console.log('[TransitionScreen Constructor] PowerUpManager received:', this.powerUpManager);

    // Set depth for proper layering
    this.setDepth(RenderLayer.UI_FOREGROUND);

    // Create Panel Background
    this.panelBackground = new GameObjects.Graphics(scene);
    this.add(this.panelBackground);

    // Message Text
    this.messageText = new GameObjects.Text(scene, 0, 0, '', {
      fontFamily: 'Grandstander',
      fontSize: '64px',
        // fontWeight: 'bold', // Not supported in Phaser
      color: '#114257',
      align: 'center',
      wordWrap: { width: 1 } // Placeholder, will be set in show/resize
    });
    this.messageText.setOrigin(0.5);
    this.add(this.messageText);

    // Question text for question preview
    this.questionText = new GameObjects.Text(scene, 0, 0, '', {
      fontFamily: 'Grandstander',
      fontSize: '48px',
        // fontWeight: 'bold', // Not supported in Phaser
      color: '#114257',
      align: 'center',
      wordWrap: { width: 1 }
    });
    this.questionText.setOrigin(0.5);
    this.add(this.questionText);

    // Countdown text
    this.countdownText = new GameObjects.Text(scene, 0, 0, '', {
      fontFamily: 'Grandstander',
      fontSize: '120px',
        // fontWeight: 'bold', // Not supported in Phaser
      color: '#FFD700',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6
    });
    this.countdownText.setOrigin(0.5);
    this.add(this.countdownText);

    // GO! text
    this.goText = new GameObjects.Text(scene, 0, 0, 'GO!', {
      fontFamily: 'Grandstander',
      fontSize: '100px',
        // fontWeight: 'bold', // Not supported in Phaser
      color: '#00FF00',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6
    });
    this.goText.setOrigin(0.5);
    this.add(this.goText);

    // Initially hide all elements
    this.setVisible(false);
  }

  /**
   * Shows the transition screen with the specified configuration.
   * @param {TransitionScreenConfig} config - The transition configuration.
   * @returns {Promise<void>} A promise that resolves when the transition is complete.
   */
  public async show(config: TransitionScreenConfig): Promise<void> {
    console.log('[TransitionScreen] Showing transition:', config.type);
    
    this.currentConfig = config;
    this.setVisible(true);

    // Clear any existing timeout
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Hide all text elements initially
    this.messageText.setVisible(false);
    this.questionText.setVisible(false);
    this.countdownText.setVisible(false);
    this.goText.setVisible(false);
    if (this.questionImage) {
      this.questionImage.setVisible(false);
    }

    // Handle different transition types
    switch (config.type) {
      case 'loading':
        await this._showLoading(config);
        break;
      case 'turn':
        await this._showTurn(config);
        break;
      case 'powerup':
        await this._showPowerup(config);
        break;
      case 'question_preview':
        await this._showQuestionPreview(config);
        break;
      case 'countdown':
        await this._showCountdown(config);
        break;
      case 'go':
        await this._showGo(config);
        break;
      case 'custom':
        await this._showCustom(config);
        break;
    }

    // Auto-hide if specified
    if (config.autoHide && config.duration) {
      this.timeoutId = window.setTimeout(() => {
        this.hide();
      }, config.duration);
    }

    // Return promise that resolves when transition is complete
    return new Promise<void>((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  /**
   * Hides the transition screen.
   */
  public hide(): void {
    console.log('[TransitionScreen] Hiding transition screen');
    
    this.setVisible(false);
    
    // Clear timeout
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Resolve promise if waiting
    if (this.resolvePromise) {
      this.resolvePromise();
      this.resolvePromise = null;
    }

    // Clean up powerup spin wheel
    if (this.powerupSpinWheel) {
      this.powerupSpinWheel.destroy();
      this.powerupSpinWheel = null;
    }

    // Clean up question image
    if (this.questionImage) {
      this.questionImage.destroy();
      this.questionImage = null;
    }

    // Emit transition end event
    if (this.currentConfig) {
      this.eventBus.emit(TRANSITION_EVENTS.END, { type: this.currentConfig.type });
      this.currentConfig = null;
    }
  }

  /**
   * Updates the panel dimensions and positions elements.
   */
  private _updatePanelDimensions(): void {
    // Make it full screen
    this.panelWidth = this.scene.cameras.main.width;
    this.panelHeight = this.scene.cameras.main.height;

    // Clear and redraw background
    this.panelBackground.clear();
    this.panelBackground.fillStyle(0x000000, 0.8); // Semi-transparent black
    this.panelBackground.fillRect(0, 0, this.panelWidth, this.panelHeight);

    // Position elements
    this._centerMessageText();
    this._centerQuestionText();
    this._centerCountdownText();
    this._centerGoText();
  }

  /**
   * Centers the message text.
   */
  private _centerMessageText(): void {
    this.messageText.setPosition(this.panelWidth / 2, this.panelHeight * 0.25);
    this.messageText.setWordWrapWidth(this.panelWidth * 0.8);
  }

  /**
   * Centers the question text.
   */
  private _centerQuestionText(): void {
    this.questionText.setPosition(this.panelWidth / 2, this.panelHeight * 0.75);
    this.questionText.setWordWrapWidth(this.panelWidth * 0.8);
  }

  /**
   * Centers the countdown text.
   */
  private _centerCountdownText(): void {
    this.countdownText.setPosition(this.panelWidth / 2, this.panelHeight / 2);
  }

  /**
   * Centers the GO! text.
   */
  private _centerGoText(): void {
    this.goText.setPosition(this.panelWidth / 2, this.panelHeight / 2);
  }

  /**
   * Shows loading transition.
   */
  private async _showLoading(config: TransitionScreenConfig): Promise<void> {
    this._updatePanelDimensions();
    this.messageText.setText(config.message || 'Loading...');
    this.messageText.setVisible(true);
    this._centerMessageText();
  }

  /**
   * Shows turn transition.
   */
  private async _showTurn(config: TransitionScreenConfig): Promise<void> {
    this._updatePanelDimensions();
    this.messageText.setText(config.message || 'Get Ready!');
    this.messageText.setVisible(true);
    this._centerMessageText();
  }

  /**
   * Shows powerup transition.
   */
  private async _showPowerup(config: TransitionScreenConfig): Promise<void> {
    this._updatePanelDimensions();
    
    if (config.triggerPowerupRoll) {
      await this._showPowerupWheel();
    } else {
      this.messageText.setText(config.message || 'Power-up!');
      this.messageText.setVisible(true);
      this._centerMessageText();
    }
  }

  /**
   * Shows question preview transition.
   */
  private async _showQuestionPreview(config: TransitionScreenConfig): Promise<void> {
    this._updatePanelDimensions();
    
    // Phase 1: Show "Get Ready!" and question text
    this.messageText.setText('Get Ready!');
    this.messageText.setVisible(true);
    this._centerMessageText();
    
    if (config.question) {
      this.questionText.setText(config.question.question);
      this.questionText.setVisible(true);
      this._centerQuestionText();
    }
    
    // Wait 1 second
    await this._wait(1000);
    
    // Phase 2: Hide "Get Ready!", show image
    this.messageText.setVisible(false);
    
    if (config.question && config.question.imageUrl) {
      await this._loadQuestionImage(config.question.imageUrl);
    }
    
    // Wait 1 second
    await this._wait(1000);
    
    // Phase 3: Start countdown if requested
    if (config.showCountdown) {
      await this._showCountdown(config);
    }
  }

  /**
   * Shows countdown transition.
   */
  private async _showCountdown(config: TransitionScreenConfig): Promise<void> {
    this._updatePanelDimensions();
    
    // Countdown from 3 to 1
    for (let i = 3; i >= 1; i--) {
      this.countdownText.setText(i.toString());
      this.countdownText.setVisible(true);
      this._centerCountdownText();
      await this._wait(1000);
    }
    
    // Show GO!
    await this._showGo(config);
  }

  /**
   * Shows GO! transition.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async _showGo(_config: TransitionScreenConfig): Promise<void> {
    this._updatePanelDimensions();
    
    this.countdownText.setVisible(false);
    this.goText.setVisible(true);
    this._centerGoText();
    
    // Add some animation effect
    this.scene.tweens.add({
      targets: this.goText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      repeat: 1
    });
    
    await this._wait(1000);
  }

  /**
   * Shows custom transition.
   */
  private async _showCustom(config: TransitionScreenConfig): Promise<void> {
    this._updatePanelDimensions();
    this.messageText.setText(config.message || '');
    this.messageText.setVisible(true);
    this._centerMessageText();
  }

  /**
   * Shows powerup wheel.
   */
  private async _showPowerupWheel(): Promise<void> {
    this._updatePanelDimensions();
    
    // Get selectable powerups
    this.currentSelectablePowerups = this.powerUpManager.getSelectablePowerups();
    
    if (this.currentSelectablePowerups.length === 0) {
      console.warn('[TransitionScreen] No selectable powerups available');
      this.messageText.setText('No power-ups available');
      this.messageText.setVisible(true);
      this._centerMessageText();
      return;
    }
    
    // Create and show spin wheel
    this.powerupSpinWheel = new PowerupSpinWheel(
      this.scene,
      this.currentSelectablePowerups,
      this.powerUpManager,
      this.eventBus
    );
    
    this.powerupSpinWheel.setPosition(this.panelWidth / 2, this.panelHeight / 2);
    this.add(this.powerupSpinWheel);
    
    // Wait for selection
    await this.powerupSpinWheel.spin();
    
    // Get selected powerup
    this.finalSelectedPowerupId = this.powerupSpinWheel.getSelectedPowerupId();
    
    if (this.finalSelectedPowerupId) {
      // Emit powerup selected event
      this.eventBus.emit(TRANSITION_EVENTS.POWERUP_SELECTED, {
        selectedPowerupId: this.finalSelectedPowerupId,
        transitionType: 'powerup'
      } as TransitionPowerupSelectedPayload);
    }
  }

  /**
   * Loads and displays question image.
   */
  private async _loadQuestionImage(imageUrl: string): Promise<void> {
    try {
      console.log('Loading question image:', imageUrl);
      
      // Clear existing image
      if (this.questionImage) {
        this.questionImage.destroy();
        this.questionImage = null;
      }
      
      // Load image using Phaser's native loader
      const imageKey = `question-transition-${Date.now()}`;
      
      // Check if already loaded
      if (!this.scene.textures.exists(imageKey)) {
        this.scene.load.image(imageKey, imageUrl);
        this.scene.load.once('complete', () => {
          this.questionImage = this.scene.add.sprite(0, 0, imageKey);
          this.questionImage.setOrigin(0.5);
          this.questionImage.setPosition(this.panelWidth / 2, this.panelHeight * 0.25);
          
          // Scale image to fit
          const maxWidth = this.panelWidth * 0.8;
          const maxHeight = this.panelHeight * 0.4;
          const scaleX = maxWidth / this.questionImage.width;
          const scaleY = maxHeight / this.questionImage.height;
          const scale = Math.min(scaleX, scaleY, 1);
          this.questionImage.setScale(scale);
          
          this.add(this.questionImage);
          this.questionImage.setVisible(true);
          
          console.log('Question image loaded and displayed');
        });
        this.scene.load.once('loaderror', (file: any) => {
          console.error('TransitionScreen: Error loading question image:', file.key, file.url);
        });
        this.scene.load.start();
      } else {
        // Already loaded, just create the sprite
        this.questionImage = this.scene.add.sprite(0, 0, imageKey);
        this.questionImage.setOrigin(0.5);
        this.questionImage.setPosition(this.panelWidth / 2, this.panelHeight * 0.25);
        
        // Scale image to fit
        const maxWidth = this.panelWidth * 0.8;
        const maxHeight = this.panelHeight * 0.4;
        const scaleX = maxWidth / this.questionImage.width;
        const scaleY = maxHeight / this.questionImage.height;
        const scale = Math.min(scaleX, scaleY, 1);
        this.questionImage.setScale(scale);
        
        this.add(this.questionImage);
        this.questionImage.setVisible(true);
        
        console.log('Question image loaded and displayed');
      }
    } catch (error) {
      console.warn('Failed to load question image:', error);
    }
  }

  /**
   * Waits for the specified duration.
   */
  private _wait(duration: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }

  /**
   * Destroys the transition screen and cleans up resources.
   */
  public destroy(): void {
    console.log('[TransitionScreen] Destroying transition screen');
    
    // Clear timeout
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Clean up powerup spin wheel
    if (this.powerupSpinWheel) {
      this.powerupSpinWheel.destroy();
      this.powerupSpinWheel = null;
    }

    // Clean up question image
    if (this.questionImage) {
      this.questionImage.destroy();
      this.questionImage = null;
    }

    // Call parent destroy
    super.destroy();
  }
}
