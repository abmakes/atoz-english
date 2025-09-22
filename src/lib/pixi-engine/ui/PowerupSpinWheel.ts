import * as PIXI from 'pixi.js';
import { Text } from 'pixi.js';
import { SelectablePowerupInfo } from '../game/PowerUpManager';
import { getThemeConfig } from '../../themes';

export interface PowerupSpinWheelConfig {
  powerups: SelectablePowerupInfo[];
  preselectedPowerupId?: string | null; // The powerup that should be selected visually
  onSelection?: (selectedPowerup: SelectablePowerupInfo) => void;
  onSpinComplete?: () => void;
}

// Interface for wheel segments
interface WheelSegment {
  powerup: SelectablePowerupInfo | null;
  color: number;
  text: string;
}

/**
 * A spin wheel component for powerup selection.
 * Replaces the text cycling with an interactive spinning wheel.
 */
export class PowerupSpinWheel extends PIXI.Container {
  private wheel: PIXI.Container;
  private pointer: PIXI.Graphics;
  private sparkleContainer: PIXI.Container;
  private sparkles: Sparkle[] = [];
  private powerups: SelectablePowerupInfo[];
  private preselectedPowerupId?: string | null;
  private onSelection?: (selectedPowerup: SelectablePowerupInfo) => void;
  private onSpinComplete?: () => void;

  // Spin state
  private spinning: boolean = false;
  private spinVelocity: number = 0;
  private currentRotation: number = 0;
  private targetRotation?: number; // Target rotation for preselected powerup
  
  // Blur and text reveal effects
  private textVisible: boolean = false;
  private blurFilter: PIXI.BlurFilter | null = null;
  
  // Center text and confetti
  private centerText: PIXI.Text | null = null;
  private confettiContainer: PIXI.Container | null = null;

  // Wheel properties
  private centerX: number = 0;
  private centerY: number = 0;
  private radius: number = 0;

  // Theme colors and configuration
  private themeConfig: ReturnType<typeof getThemeConfig>['pixiConfig'];
  private wheelSegments: WheelSegment[] = [];

  // Colors for powerup segments (using theme colors)
  // Two-color alternating design
  private readonly DARK_BLUE = 0x1E3A8A;  // Dark blue
  private readonly WHITE = 0xFFFFFF;      // White

  constructor(config: PowerupSpinWheelConfig) {
    super();
    this.powerups = config.powerups;
    this.preselectedPowerupId = config.preselectedPowerupId;
    this.onSelection = config.onSelection;
    this.onSpinComplete = config.onSpinComplete;
    
    console.log('[PowerupSpinWheel] Constructor - preselectedPowerupId:', this.preselectedPowerupId);
    console.log('[PowerupSpinWheel] Constructor - available powerups:', this.powerups.map(p => p.id));

    // Initialize theme
    this.themeConfig = getThemeConfig('default').pixiConfig;

    this.wheel = new PIXI.Container();
    this.pointer = new PIXI.Graphics();
    this.sparkleContainer = new PIXI.Container();

    this.addChild(this.wheel);
    this.addChild(this.pointer);
    this.addChild(this.sparkleContainer);

    this.interactive = false; // Start non-interactive, will be enabled after auto-spin
    this.cursor = 'default';
    this.on('pointerdown', this.handleClick.bind(this));

    // Create 6-segment wheel with dynamic powerup distribution
    this.createWheelSegments();
  }

  /**
   * Creates the 6-segment wheel with dynamic powerup distribution.
   */
  private createWheelSegments(): void {
    this.wheelSegments = [];
    const numSegments = 6;
    
    // Determine distribution based on number of powerups
    const powerupCount = this.powerups.length;
    let powerupDistribution: (SelectablePowerupInfo | null)[] = [];
    
    if (powerupCount === 0) {
      // No powerups - all blank spaces
      powerupDistribution = new Array(6).fill(null);
    } else if (powerupCount === 1) {
      // 1 powerup - 2 spots for powerup, 4 blank
      powerupDistribution = [this.powerups[0], this.powerups[0], null, null, null, null];
    } else if (powerupCount === 2) {
      // 2 powerups - 2 spots each, 2 blank
      powerupDistribution = [this.powerups[0], this.powerups[0], this.powerups[1], this.powerups[1], null, null];
    } else if (powerupCount === 3) {
      // 3 powerups - 2 spots each
      powerupDistribution = [this.powerups[0], this.powerups[0], this.powerups[1], this.powerups[1], this.powerups[2], this.powerups[2]];
    } else {
      // 4+ powerups - 1 of each + 2 random extras
      const shuffled = [...this.powerups].sort(() => Math.random() - 0.5);
      powerupDistribution = [
        shuffled[0], shuffled[1], shuffled[2], shuffled[3],
        shuffled[Math.floor(Math.random() * shuffled.length)],
        shuffled[Math.floor(Math.random() * shuffled.length)]
      ];
    }
    
    // If we have a preselected powerup, ensure it's in the first segment (index 0)
    if (this.preselectedPowerupId && powerupCount > 0) {
      const preselectedPowerup = this.powerups.find(p => p.id === this.preselectedPowerupId);
      if (preselectedPowerup) {
        // Find the preselected powerup in the distribution and move it to index 0
        const preselectedIndex = powerupDistribution.findIndex(p => p?.id === this.preselectedPowerupId);
        if (preselectedIndex !== -1) {
          // Swap with index 0
          [powerupDistribution[0], powerupDistribution[preselectedIndex]] = 
          [powerupDistribution[preselectedIndex], powerupDistribution[0]];
          console.log(`[PowerupSpinWheel] Moved preselected powerup '${preselectedPowerup.displayName}' to segment 0`);
        }
      }
    }
    
    // Create segments with alternating colors
    for (let i = 0; i < numSegments; i++) {
      const powerup = powerupDistribution[i];
      // Alternating colors: even indices = dark blue, odd indices = white
      const color = i % 2 === 0 ? this.DARK_BLUE : this.WHITE;
      const text = powerup ? powerup.displayName : 'No Power-up';
      
      this.wheelSegments.push({
        powerup,
        color,
        text
      });
    }
  }

  /**
   * Initializes the wheel with current screen dimensions.
   */
  public initialize(screenWidth: number, screenHeight: number): void {
    // Position wheel at bottom, half on screen, 3x wider, moved up so center is visible
    this.centerX = screenWidth / 2;
    this.centerY = screenHeight + (screenHeight * 0.05); // Moved up so center dot is visible
    this.radius = Math.min(screenWidth * 0.75, screenHeight * 0.4); // 3x wider - 3/4 width or 2/5 height

    this.createWheel();
    this.createPointer();
    this._createCenterText();
    
    // Auto-start spinning after 0.5 seconds
    setTimeout(() => {
      if (!this.spinning) {
        console.log('[PowerupSpinWheel] Auto-starting spin after 0.5 second display');
        this.spin();
      }
    }, 500);
  }

  /**
   * Starts spinning the wheel.
   */
  public spin(): void {
    if (this.spinning) return;

    this.spinning = true;
    this.spinVelocity = Math.random() * 0.5 + 0.4; // Original smooth spin speed
    
    // Calculate target rotation to land on preselected powerup
    if (this.preselectedPowerupId) {
      const targetSegmentIndex = this.wheelSegments.findIndex(segment => 
        segment.powerup?.id === this.preselectedPowerupId
      );
      
      if (targetSegmentIndex !== -1) {
        // Calculate the target rotation (segment should be at the top when stopped)
        const segmentAngle = (Math.PI * 2) / 6;
        const targetRotation = (targetSegmentIndex * segmentAngle) + (Math.PI * 2 * 3); // 3 full rotations + segment position
        this.targetRotation = targetRotation;
        console.log(`[PowerupSpinWheel] Will land on segment ${targetSegmentIndex} for powerup ${this.preselectedPowerupId}`);
      }
    }
    
    this.cursor = 'not-allowed';
    this.interactive = false; // Disable interaction while spinning
  }

  /**
   * Adds blur effect to the wheel during spinning.
   */
  private _addBlurEffect(): void {
    if (!this.blurFilter) {
      this.blurFilter = new PIXI.BlurFilter();
      this.blurFilter.blur = 2;
    }
    this.wheel.filters = [this.blurFilter];
  }

  /**
   * Removes blur effect from the wheel.
   */
  private _removeBlurEffect(): void {
    this.wheel.filters = [];
  }

  /**
   * Updates text visibility based on current state.
   */
  private _updateTextVisibility(): void {
    // This will be implemented to show/hide text on segments
    // For now, we'll control this through the segment creation
  }

  /**
   * Creates center text for "Get Ready" and powerup display.
   */
  private _createCenterText(): void {
    if (this.centerText) {
      this.removeChild(this.centerText);
    }

    this.centerText = new PIXI.Text('Get Ready!', {
      fontFamily: 'Grandstander',
      fontSize: 48,
      fill: 0x114257, // Dark blue to match player name color
      fontWeight: 'bold',
      align: 'center'
      // Removed dropShadow for cleaner look
    });

    this.centerText.anchor.set(0.5);
    this.centerText.x = this.centerX;
    this.centerText.y = this.centerY - this.radius - 60; // Above the wheel (closer since wheel is smaller)
    this.addChild(this.centerText);
  }

  /**
   * Updates center text with powerup name and triggers confetti.
   */
  private _showPowerupResult(powerupName: string): void {
    if (this.centerText) {
      this.centerText.text = powerupName;
      this.centerText.style.fill = 0xFFD700; // Gold color for result
    }
    
    this._createConfetti();
  }


  /**
   * Creates confetti effect.
   */
  private _createConfetti(): void {
    if (this.confettiContainer) {
      this.removeChild(this.confettiContainer);
    }

    this.confettiContainer = new PIXI.Container();
    this.addChild(this.confettiContainer);

    // Create confetti particles
    for (let i = 0; i < 50; i++) {
      const confetti = new PIXI.Graphics();
      confetti.beginFill(Math.random() * 0xFFFFFF);
      confetti.drawRect(0, 0, 4, 4);
      confetti.endFill();
      
      confetti.x = this.centerX + (Math.random() - 0.5) * 150;
      confetti.y = this.centerY - this.radius - 60;
      
      this.confettiContainer.addChild(confetti);
      
      // Animate confetti falling
      const fallSpeed = Math.random() * 3 + 2;
      const rotationSpeed = (Math.random() - 0.5) * 0.2;
      
      const animate = () => {
        confetti.y += fallSpeed;
        confetti.rotation += rotationSpeed;
        confetti.alpha -= 0.01;
        
        if (confetti.alpha > 0 && confetti.y < this.centerY + 200) {
          requestAnimationFrame(animate);
        } else {
          confetti.destroy();
        }
      };
      
      requestAnimationFrame(animate);
    }
  }

  /**
   * Selects powerup based on current rotation (fallback method).
   */
  private _selectFromRotation(): void {
    const normalizedRotation = ((this.currentRotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
    const segmentSize = (Math.PI * 2) / 6; // Always 6 segments
    const winningIndex = Math.floor(((Math.PI * 2) - normalizedRotation + (segmentSize / 2)) / segmentSize) % 6;
    
    const selectedSegment = this.wheelSegments[winningIndex];
    console.log('[PowerupSpinWheel] Rotation-based selection:', selectedSegment.text);
    
    if (selectedSegment.powerup && this.onSelection) {
      this._showPowerupResult(selectedSegment.powerup.displayName);
      this.onSelection(selectedSegment.powerup);
    } else if (this.onSelection) {
      this._showPowerupResult('No Power-up');
    }
  }

  /**
   * Handles click/tap events to start spinning.
   */
  private handleClick(): void {
    this.spin();
  }

  /**
   * Creates the spinning wheel with 6 segments.
   */
  private createWheel(): void {
    this.wheel.removeChildren();
    
    const segmentAngle = (Math.PI * 2) / 6; // Always 6 segments

    this.wheelSegments.forEach((segmentData, index) => {
      const segment = new PIXI.Graphics();
      const startAngle = index * segmentAngle - Math.PI / 2;
      const endAngle = (index + 1) * segmentAngle - Math.PI / 2;

      // Draw segment
      segment.beginFill(segmentData.color);
      segment.moveTo(this.centerX, this.centerY);
      segment.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
      segment.lineTo(this.centerX, this.centerY);
      segment.endFill();

      // Add white border
      segment.lineStyle(4, 0xffffff, 0.8);
      segment.moveTo(this.centerX, this.centerY);
      segment.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
      segment.lineTo(this.centerX, this.centerY);

      this.wheel.addChild(segment);

      // Add text
      this.addPowerupText(segmentData, index, segmentAngle, startAngle);
    });

    // Create center circle
    const centerCircle = new PIXI.Graphics();
    centerCircle.beginFill(0xFFD700);
    centerCircle.drawCircle(this.centerX, this.centerY, this.radius * 0.15);
    centerCircle.endFill();
    
    centerCircle.lineStyle(6, 0xffffff);
    centerCircle.drawCircle(this.centerX, this.centerY, this.radius * 0.15);
    
    this.wheel.addChild(centerCircle);

    // Add dark blue outer border
    const outerBorder = new PIXI.Graphics();
    outerBorder.lineStyle(8, this.DARK_BLUE);
    outerBorder.drawCircle(this.centerX, this.centerY, this.radius);
    this.wheel.addChild(outerBorder);

    // Position wheel at center
    this.wheel.pivot.set(this.centerX, this.centerY);
    this.wheel.x = this.centerX;
    this.wheel.y = this.centerY;
  }

  /**
   * Adds text to a powerup segment.
   */
  private addPowerupText(segmentData: WheelSegment, index: number, segmentAngle: number, startAngle: number): void {
    const midAngle = startAngle + segmentAngle / 2;
    const textRadius = this.radius * 0.7;
    const words = segmentData.text.split(' ');
    
    const fontSize = Math.min(this.radius * 0.07, 28);
    const lineHeight = fontSize * 1.3;
    
    const textContainer = new PIXI.Container();
    textContainer.x = this.centerX + Math.cos(midAngle) * textRadius;
    textContainer.y = this.centerY + Math.sin(midAngle) * textRadius;
    
    words.forEach((word, wordIndex) => {
      const wordText = new Text(word, {
        fontFamily: 'Grandstander',
        fontSize: fontSize,
        fill: 0xffffff,
        fontWeight: 'bold',
        align: 'center',
        dropShadow: {
          color: 0x000000,
          alpha: 1,
          angle: Math.PI / 4,
          distance: 2,
          blur: 1
        }
      });
      
      wordText.anchor.set(0.5);
      wordText.x = 0;
      wordText.y = (wordIndex - (words.length - 1) / 2) * lineHeight;
      
      textContainer.addChild(wordText);
    });
    
    const textRotation = midAngle + Math.PI / 2;
    textContainer.rotation = textRotation;
    this.wheel.addChild(textContainer);
  }

  /**
   * Creates the pointer that indicates the selected segment.
   */
  private createPointer(): void {
    this.pointer.clear();
    
    // Pointer triangle
    this.pointer.beginFill(0xFFFF00); // Yellow color
    this.pointer.moveTo(0, this.radius + 30); // Flipped Y coordinates for 180° rotation
    this.pointer.lineTo(-35, this.radius - 35);
    this.pointer.lineTo(35, this.radius - 35);
    this.pointer.lineTo(0, this.radius + 30);
    this.pointer.endFill();

    // Add white outline
    this.pointer.lineStyle(5, 0xffffff);
    this.pointer.moveTo(0, this.radius + 30);
    this.pointer.lineTo(-35, this.radius - 35);
    this.pointer.lineTo(35, this.radius - 35);
    this.pointer.lineTo(0, this.radius + 30);

    this.pointer.x = this.centerX;
    this.pointer.y = this.centerY;
  }

  /**
   * Creates sparkle particles around the wheel edge.
   */
  private createSparkles(): void {
    if (!this.spinning) return;
    
    const velocityRatio = Math.max(0, this.spinVelocity / 0.9);
    const particleIntensity = Math.pow(velocityRatio, 2);
    const shouldCreateParticle = Math.random() < particleIntensity * 4; // Quadruple the particle creation rate
    
    if (shouldCreateParticle) {
      const burstSize = Math.ceil(particleIntensity * 16); // Double the particles per burst
      
      for (let i = 0; i < burstSize; i++) {
        const angle = Math.random() * Math.PI * 2;
        const sparkleRadius = this.radius + (Math.random() - 0.5) * 100; // Larger spread
        const x = this.centerX + Math.cos(angle) * sparkleRadius;
        const y = this.centerY + Math.sin(angle) * sparkleRadius;
        
        this.sparkles.push(new Sparkle(x, y, this.sparkleContainer));
      }
    }
  }

  /**
   * Updates the wheel animation and sparkles.
   */
  public update(delta: number): void {
    if (this.spinning) {
      this.currentRotation += this.spinVelocity * delta;
      this.wheel.rotation = this.currentRotation;
      
      this.createSparkles();
      
      // Deceleration - slow down when approaching target
      if (this.targetRotation !== undefined) {
        const distanceToTarget = Math.abs(this.targetRotation - this.currentRotation);
        if (distanceToTarget < Math.PI) {
          // Slow down significantly when close to target
          this.spinVelocity *= 0.85;
        } else {
          // Normal deceleration
          this.spinVelocity *= 0.95;
        }
      } else {
        // Normal deceleration if no target
        this.spinVelocity *= 0.95;
      }
      
      // Stop spinning when velocity is low enough
      if (this.spinVelocity < 0.001) {
        this.spinning = false;
        this.spinVelocity = 0;
        this.cursor = 'pointer';
        this.interactive = true; // Re-enable interaction after spinning stops
        
        // Use preselected powerup if available, otherwise calculate from rotation
        if (this.preselectedPowerupId) {
          const preselectedPowerup = this.powerups.find(p => p.id === this.preselectedPowerupId);
          if (preselectedPowerup && this.onSelection) {
            console.log('[PowerupSpinWheel] Using preselected powerup:', preselectedPowerup.displayName);
            this._showPowerupResult(preselectedPowerup.displayName);
            this.onSelection(preselectedPowerup);
          } else {
            console.warn('[PowerupSpinWheel] Preselected powerup not found, falling back to rotation');
            // Fallback to rotation-based selection
            this._selectFromRotation();
          }
        } else {
          // No preselected powerup, use rotation-based selection
          this._selectFromRotation();
        }
        
        // Add 1-second pause after powerup selection before completing
        setTimeout(() => {
          if (this.onSpinComplete) {
            this.onSpinComplete();
          }
        }, 1000); // 1 second pause
      }
    }
    
    // Update sparkles
    this.updateSparkles();
  }

  /**
   * Updates sparkle particles.
   */
  private updateSparkles(): void {
    this.sparkles = this.sparkles.filter(sparkle => {
      const alive = sparkle.update();
      if (!alive) {
        sparkle.destroy();
      }
      return alive;
    });
  }

  /**
   * Resizes the wheel for new screen dimensions.
   */
  public resize(screenWidth: number, screenHeight: number): void {
    this.centerX = screenWidth / 2;
    this.centerY = screenHeight / 2;
    this.radius = Math.min(this.centerX, this.centerY) * 0.85;

    // Clear existing sparkles
    this.sparkles.forEach(sparkle => sparkle.destroy());
    this.sparkles = [];

    // Recreate wheel segments and wheel
    this.createWheelSegments();
    this.createWheel();
    this.createPointer();
  }

  /**
   * Destroys the spin wheel and cleans up resources.
   */
  public destroy(options?: boolean | PIXI.DestroyOptions | undefined): void {
    this.sparkles.forEach(sparkle => sparkle.destroy());
    this.sparkles = [];
    super.destroy(options);
  }
}

/**
 * Sparkle particle class for visual effects.
 */
class Sparkle {
  private sprite: PIXI.Graphics;
  private x: number;
  private y: number;
  private vx: number;
  private vy: number;
  private life: number;
  private decay: number;
  private size: number;
  private rotation: number;
  private rotationSpeed: number;

  constructor(x: number, y: number, container: PIXI.Container) {
    this.sprite = new PIXI.Graphics();
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 12;
    this.vy = (Math.random() - 0.5) * 12;
    this.life = 1.0;
    this.decay = Math.random() * 0.008 + 0.004; // Slower decay - particles last longer
    this.size = Math.random() * 12 + 10; // Bigger particles (was 6-14, now 10-22)
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.3;
    
    const colors = [0xFFD700, 0xFF69B4, 0x00CED1, 0xFF6347, 0x98FB98, 0xDDA0DD, 0xFF1493, 0x00FF7F];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    this.sprite.beginFill(color, 0.9);
    this.drawStar(this.sprite, 0, 0, 5, this.size, this.size * 0.4);
    this.sprite.endFill();
    
    this.sprite.lineStyle(2, color, 0.3);
    this.drawStar(this.sprite, 0, 0, 5, this.size * 1.3, this.size * 0.5);
    
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.rotation = this.rotation;
    
    container.addChild(this.sprite);
  }
  
  private drawStar(graphics: PIXI.Graphics, x: number, y: number, points: number, outerRadius: number, innerRadius: number): void {
    const step = Math.PI / points;
    graphics.moveTo(x, y - outerRadius);
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      graphics.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    graphics.closePath();
  }
  
  public update(): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.life -= this.decay;
    
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.rotation = this.rotation;
    this.sprite.alpha = this.life;
    this.sprite.scale.set(this.life);
    
    this.vy += 0.15; // Gravity
    
    return this.life > 0;
  }
  
  public destroy(): void {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
    this.sprite.destroy();
  }
}
