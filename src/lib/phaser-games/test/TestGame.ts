import { GameObjects } from 'phaser';
import { BaseGame, BaseGameState } from '../../phaser-engine/game/BaseGame';

/**
 * Test game state interface.
 */
interface TestGameState extends BaseGameState {
  score: number;
  message: string;
  clickCount: number;
}

/**
 * A simple test game to verify the Phaser engine foundation.
 * This game demonstrates:
 * - Basic game lifecycle
 * - Manager integration
 * - Event handling
 * - UI elements
 * - State management
 */
export class TestGame extends BaseGame<TestGameState> {
  private testText: GameObjects.Text | null = null;
  private scoreText: GameObjects.Text | null = null;
  private clickButton: GameObjects.Text | null = null;
  private background: GameObjects.Graphics | null = null;

  /**
   * Creates the initial state for the test game.
   */
  protected createInitialState(): TestGameState {
    return {
      phase: 'ready',
      score: 0,
      message: 'Test Game Ready!',
      clickCount: 0,
      scores: { player1: 0 },
      activeTeam: 'player1'
    };
  }

  /**
   * Initializes the test game.
   */
  protected async initImplementation(engineAssetsPromise: Promise<unknown>): Promise<void> {
    console.log('[TestGame] Initializing test game...');
    
    // Wait for engine assets
    await engineAssetsPromise;
    
    // Create background
    this.background = this.add.graphics();
    this.background.fillStyle(0x87CEEB); // Light blue
    this.background.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    this.addToLayer(this.background, 0); // Background layer

    // Create test text
    this.testText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 100,
      this.getState().message,
      {
        fontFamily: 'Grandstander',
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#114257',
        align: 'center'
      }
    );
    this.testText.setOrigin(0.5);
    this.addToLayer(this.testText, 10); // UI layer

    // Create score text
    this.scoreText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      `Score: ${this.getState().score}`,
      {
        fontFamily: 'Grandstander',
        fontSize: '32px',
        color: '#114257',
        align: 'center'
      }
    );
    this.scoreText.setOrigin(0.5);
    this.addToLayer(this.scoreText, 10); // UI layer

    // Create click button
    this.clickButton = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 50,
      'Click Me!',
      {
        fontFamily: 'Grandstander',
        fontSize: '24px',
        color: '#FFFFFF',
        backgroundColor: '#FF6B6B',
        padding: { x: 20, y: 10 }
      }
    );
    this.clickButton.setOrigin(0.5);
    this.clickButton.setInteractive();
    this.clickButton.on('pointerdown', this._onButtonClick.bind(this));
    this.addToLayer(this.clickButton, 10); // UI layer

    // Register event listeners
    this.registerEventListener('test:incrementScore', this._onIncrementScore.bind(this));
    this.registerEventListener('test:changeMessage', this._onChangeMessage.bind(this));

    // Show initial transition
    await this.showTransition({
      type: 'loading',
      message: 'Test Game Loading...',
      duration: 2000,
      autoHide: true
    });

    console.log('[TestGame] Test game initialized successfully!');
  }

  /**
   * Starts the test game.
   */
  protected startImplementation(): void {
    console.log('[TestGame] Starting test game...');
    
    // Update state
    this.setState({ phase: 'playing' });
    
    // Show turn transition
    this.showTransition({
      type: 'turn',
      message: 'Test Game Started!',
      duration: 1500,
      autoHide: true
    });

    // Start a simple timer to demonstrate timer manager
    this.managers.timerManager.startTimer('testTimer', 10, () => {
      console.log('[TestGame] Test timer completed!');
      this._onTimerComplete();
    });

    console.log('[TestGame] Test game started!');
  }

  /**
   * Updates the test game each frame.
   */
  protected updateImplementation(_delta: number): void {
    // Update score display
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.getState().score}`);
    }

    // Simple animation for the test text
    if (this.testText) {
      const time = this.getFrameTiming().elapsedTime;
      this.testText.setScale(1 + Math.sin(time * 2) * 0.1);
    }
  }

  /**
   * Ends the test game.
   */
  protected endImplementation(): void {
    console.log('[TestGame] Ending test game...');
    
    // Update state
    this.setState({ phase: 'gameOver' });
    
    // Show game over transition
    this.showTransition({
      type: 'custom',
      message: `Game Over! Final Score: ${this.getState().score}`,
      duration: 3000,
      autoHide: true
    });

    // Emit game over event
    this.managers.eventBus.emit('game:over', {
      finalScore: this.getState().score,
      clickCount: this.getState().clickCount
    });
  }

  /**
   * Destroys the test game.
   */
  protected destroyImplementation(): void {
    console.log('[TestGame] Destroying test game...');
    
    // Clean up game objects
    if (this.background) {
      this.background.destroy();
    }
    if (this.testText) {
      this.testText.destroy();
    }
    if (this.scoreText) {
      this.scoreText.destroy();
    }
    if (this.clickButton) {
      this.clickButton.destroy();
    }
  }

  /**
   * Handles button click events.
   */
  private _onButtonClick(): void {
    console.log('[TestGame] Button clicked!');
    
    // Update state
    const currentState = this.getState();
    this.setState({
      score: currentState.score + 10,
      clickCount: currentState.clickCount + 1
    });

    // Play sound effect
    this.managers.audioManager.playSound('correct-sound');

    // Add visual feedback
    if (this.clickButton) {
      this.scene.tweens.add({
        targets: this.clickButton,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        repeat: 1
      });
    }

    // Check for game end condition
    if (this.getState().score >= 100) {
      this.end();
    }
  }

  /**
   * Handles score increment events.
   */
  private _onIncrementScore(): void {
    const currentState = this.getState();
    this.setState({ score: currentState.score + 5 });
  }

  /**
   * Handles message change events.
   */
  private _onChangeMessage(newMessage: string): void {
    this.setState({ message: newMessage });
    if (this.testText) {
      this.testText.setText(newMessage);
    }
  }

  /**
   * Handles timer completion.
   */
  private _onTimerComplete(): void {
    console.log('[TestGame] Timer completed!');
    
    // Show power-up transition
    this.showTransition({
      type: 'powerup',
      message: 'Time Bonus!',
      duration: 2000,
      autoHide: true
    });

    // Add bonus score
    const currentState = this.getState();
    this.setState({ score: currentState.score + 25 });
  }
}
