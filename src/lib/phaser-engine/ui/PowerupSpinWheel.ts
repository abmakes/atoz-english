import { Scene, GameObjects } from 'phaser';
import { PowerUpManager, SelectablePowerupInfo } from '../game/PowerUpManager';
import { EventBus } from '../core/EventBus';

/**
 * A spin wheel component for power-up selection.
 * This is a placeholder implementation for the Phaser version.
 * 
 * In a full implementation, this would include:
 * - Animated spinning wheel graphics
 * - Power-up icons around the wheel
 * - Spin animation with physics
 * - Selection highlighting
 * - Sound effects
 */
export class PowerupSpinWheel extends GameObjects.Container {
  private selectablePowerups: SelectablePowerupInfo[];
  private powerUpManager: PowerUpManager;
  private eventBus: EventBus;
  private selectedPowerupId: string | null = null;
  private wheel: GameObjects.Graphics;
  private centerText: GameObjects.Text;

  constructor(
    scene: Scene,
    selectablePowerups: SelectablePowerupInfo[],
    powerUpManager: PowerUpManager,
    eventBus: EventBus
  ) {
    super(scene, 0, 0);
    
    this.selectablePowerups = selectablePowerups;
    this.powerUpManager = powerUpManager;
    this.eventBus = eventBus;

    // Create wheel graphics
    this.wheel = new GameObjects.Graphics(scene);
    this.add(this.wheel);

    // Create center text
    this.centerText = new GameObjects.Text(scene, 0, 0, 'SPIN!', {
      fontFamily: 'Grandstander',
      fontSize: '32px',
        // fontWeight: 'bold', // Not supported in Phaser
      color: '#FFFFFF',
      align: 'center'
    });
    this.centerText.setOrigin(0.5);
    this.add(this.centerText);

    this._drawWheel();
  }

  /**
   * Draws the spin wheel.
   */
  private _drawWheel(): void {
    this.wheel.clear();
    
    const radius = 100;
    const segments = this.selectablePowerups.length;
    const anglePerSegment = (Math.PI * 2) / segments;

    // Draw wheel segments
    for (let i = 0; i < segments; i++) {
      const startAngle = i * anglePerSegment;
      const endAngle = (i + 1) * anglePerSegment;
      
      // Alternate colors
      const color = i % 2 === 0 ? 0xFF6B6B : 0x4ECDC4;
      
      this.wheel.fillStyle(color);
      this.wheel.slice(0, 0, radius, startAngle, endAngle);
      this.wheel.fillPath();
      
      // Draw segment border
      this.wheel.lineStyle(2, 0x000000);
      this.wheel.slice(0, 0, radius, startAngle, endAngle);
      this.wheel.strokePath();
    }

    // Draw center circle
    this.wheel.fillStyle(0x333333);
    this.wheel.fillCircle(0, 0, 20);
    this.wheel.lineStyle(2, 0x000000);
    this.wheel.strokeCircle(0, 0, 20);
  }

  /**
   * Spins the wheel and returns the selected power-up.
   * @returns {Promise<void>} A promise that resolves when spinning is complete.
   */
  public async spin(): Promise<void> {
    console.log('[PowerupSpinWheel] Starting spin...');
    
    // Simple spin animation
    const spinDuration = 2000; // 2 seconds
    const rotations = 5; // 5 full rotations
    
    // Animate rotation
    this.scene.tweens.add({
      targets: this,
      angle: 360 * rotations,
      duration: spinDuration,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Select a random power-up
        const randomIndex = Math.floor(Math.random() * this.selectablePowerups.length);
        this.selectedPowerupId = this.selectablePowerups[randomIndex].id;
        console.log('[PowerupSpinWheel] Selected power-up:', this.selectedPowerupId);
      }
    });

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, spinDuration));
  }

  /**
   * Gets the selected power-up ID.
   * @returns {string | null} The selected power-up ID or null if none selected.
   */
  public getSelectedPowerupId(): string | null {
    return this.selectedPowerupId;
  }
}
