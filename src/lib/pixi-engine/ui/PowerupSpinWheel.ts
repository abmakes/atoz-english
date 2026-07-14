import * as PIXI from 'pixi.js';
import { Text } from 'pixi.js';
import { SelectablePowerupInfo } from '../game/PowerUpManager';
import { getThemeConfig } from '../../themes';

export interface PowerupSpinWheelConfig {
  /** Ordered wheel segments (duplicates allowed — one slot per entry). */
  powerups: SelectablePowerupInfo[];
  /**
   * Optional predetermined landing powerup id. Prefer preselectedSegmentIndex
   * when duplicates exist so the arrow and result stay in sync.
   */
  preselectedPowerupId?: string | null;
  /** Exact segment index to land on (0-based). Takes precedence over id. */
  preselectedSegmentIndex?: number | null;
  onSelection?: (selectedPowerup: SelectablePowerupInfo, segmentIndex: number) => void;
  onSpinComplete?: () => void;
}

interface WheelSegment {
  powerup: SelectablePowerupInfo | null;
  color: number;
  text: string;
}

const TWO_PI = Math.PI * 2;

/**
 * Spin wheel for powerup selection.
 * A fixed pointer at the top of the wheel indicates the winning segment when spin stops.
 */
export class PowerupSpinWheel extends PIXI.Container {
  private wheel: PIXI.Container;
  private pointer: PIXI.Graphics;
  private sparkleContainer: PIXI.Container;
  private sparkles: Sparkle[] = [];
  private powerups: SelectablePowerupInfo[];
  private preselectedPowerupId?: string | null;
  private preselectedSegmentIndex?: number | null;
  private onSelection?: (selectedPowerup: SelectablePowerupInfo, segmentIndex: number) => void;
  private onSpinComplete?: () => void;

  private spinning = false;
  private spinVelocity = 0;
  private currentRotation = 0;
  private targetRotation?: number;
  private hasReportedSelection = false;

  private centerText: PIXI.Text | null = null;
  private confettiContainer: PIXI.Container | null = null;

  private centerX = 0;
  private centerY = 0;
  private radius = 0;

  private themeConfig: ReturnType<typeof getThemeConfig>['pixiConfig'];
  private wheelSegments: WheelSegment[] = [];

  private readonly DARK_BLUE = 0x1e3a8a;
  private readonly WHITE = 0xffffff;

  constructor(config: PowerupSpinWheelConfig) {
    super();
    this.powerups = config.powerups;
    this.preselectedPowerupId = config.preselectedPowerupId;
    this.preselectedSegmentIndex = config.preselectedSegmentIndex;
    this.onSelection = config.onSelection;
    this.onSpinComplete = config.onSpinComplete;

    this.themeConfig = getThemeConfig('default').pixiConfig;

    this.wheel = new PIXI.Container();
    this.pointer = new PIXI.Graphics();
    this.sparkleContainer = new PIXI.Container();

    this.addChild(this.wheel);
    this.addChild(this.pointer);
    this.addChild(this.sparkleContainer);

    this.eventMode = 'static';
    this.cursor = 'default';
    this.on('pointerdown', this.handleClick.bind(this));

    this.createWheelSegments();
  }

  private get segmentCount(): number {
    return Math.max(this.wheelSegments.length, 1);
  }

  private get segmentAngle(): number {
    return TWO_PI / this.segmentCount;
  }

  /**
   * Builds segments from the provided slot list (one segment per slot).
   * Pads to at least 4 segments with blanks so the wheel still looks full.
   */
  private createWheelSegments(): void {
    this.wheelSegments = [];

    const slots: (SelectablePowerupInfo | null)[] = [...this.powerups];
    while (slots.length < 4) {
      slots.push(null);
    }

    for (let i = 0; i < slots.length; i++) {
      const powerup = slots[i];
      const color = i % 2 === 0 ? this.DARK_BLUE : this.WHITE;
      const text = powerup ? powerup.displayName : 'No Power-up';
      this.wheelSegments.push({ powerup, color, text });
    }
  }

  public initialize(screenWidth: number, screenHeight: number): void {
    this.centerX = screenWidth / 2;
    // Half-wheel peeking up from bottom of screen
    this.centerY = screenHeight + screenHeight * 0.05;
    this.radius = Math.min(screenWidth * 0.75, screenHeight * 0.4);

    this.createWheel();
    this.createPointer();
    this._createCenterText();

    setTimeout(() => {
      if (!this.spinning) {
        this.spin();
      }
    }, 500);
  }

  /**
   * Local angle of a segment's center (0 rotation = segment 0 centered at top).
   * Segments are drawn starting at -PI/2 (top).
   */
  private segmentCenterLocalAngle(index: number): number {
    return -Math.PI / 2 + (index + 0.5) * this.segmentAngle;
  }

  /**
   * Wheel rotation that places segment `index` under the top pointer.
   * Pointer sits at world angle -PI/2; with rotation R, local θ maps to θ + R.
   */
  private rotationForSegment(index: number, extraSpins = 4): number {
    const localCenter = this.segmentCenterLocalAngle(index);
    // localCenter + R ≡ -PI/2  (mod 2π)  →  R ≡ -PI/2 - localCenter
    let delta = -Math.PI / 2 - localCenter;
    // Normalize to negative direction (spin clockwise visually via positive R in Pixi Y-down)
    // We spin with positive velocity; pick a large positive target.
    while (delta <= 0) {
      delta += TWO_PI;
    }
    return delta + TWO_PI * extraSpins;
  }

  /**
   * Which segment is under the top pointer for the given wheel rotation.
   */
  private segmentIndexAtPointer(rotation: number): number {
    const rot = ((rotation % TWO_PI) + TWO_PI) % TWO_PI;
    // Local angle currently under the pointer (world -PI/2)
    const localUnderPointer = (((-Math.PI / 2 - rot) % TWO_PI) + TWO_PI) % TWO_PI;
    const fromSeg0Start = (((localUnderPointer - (-Math.PI / 2)) % TWO_PI) + TWO_PI) % TWO_PI;
    return Math.floor(fromSeg0Start / this.segmentAngle) % this.segmentCount;
  }

  private resolveTargetSegmentIndex(): number {
    if (
      this.preselectedSegmentIndex != null &&
      this.preselectedSegmentIndex >= 0 &&
      this.preselectedSegmentIndex < this.segmentCount
    ) {
      return this.preselectedSegmentIndex;
    }

    if (this.preselectedPowerupId) {
      const idx = this.wheelSegments.findIndex((s) => s.powerup?.id === this.preselectedPowerupId);
      if (idx !== -1) return idx;
    }

    // Prefer a non-blank segment when picking randomly
    const filled = this.wheelSegments
      .map((s, i) => (s.powerup ? i : -1))
      .filter((i) => i >= 0);
    if (filled.length > 0) {
      return filled[Math.floor(Math.random() * filled.length)];
    }
    return Math.floor(Math.random() * this.segmentCount);
  }

  public spin(): void {
    if (this.spinning) return;

    this.spinning = true;
    this.hasReportedSelection = false;
    this.spinVelocity = Math.random() * 0.35 + 0.45;

    const targetIndex = this.resolveTargetSegmentIndex();
    const extraSpins = 3 + Math.floor(Math.random() * 3);
    // Continue forward from current rotation
    const base = this.rotationForSegment(targetIndex, extraSpins);
    const currentMod = ((this.currentRotation % TWO_PI) + TWO_PI) % TWO_PI;
    const baseMod = ((base % TWO_PI) + TWO_PI) % TWO_PI;
    let forward = baseMod - currentMod;
    if (forward < TWO_PI * 2) {
      forward += TWO_PI * extraSpins;
    }
    this.targetRotation = this.currentRotation + forward;
    this.preselectedSegmentIndex = targetIndex;

    this.cursor = 'not-allowed';
    this.eventMode = 'none';
  }

  private _createCenterText(): void {
    if (this.centerText) {
      this.removeChild(this.centerText);
    }

    this.centerText = new PIXI.Text('Get Ready!', {
      fontFamily: 'Grandstander',
      fontSize: 48,
      fill: 0x114257,
      fontWeight: 'bold',
      align: 'center',
    });

    this.centerText.anchor.set(0.5);
    this.centerText.x = this.centerX;
    this.centerText.y = this.centerY - this.radius - 60;
    this.addChild(this.centerText);
  }

  private _showPowerupResult(powerupName: string): void {
    if (this.centerText) {
      this.centerText.text = powerupName;
      this.centerText.style.fontSize = 72;
      this.centerText.style.fill = 0xffd700;
      this.centerText.style.stroke = { color: 0x000000, width: 6 };
    }
    this._createConfetti();
  }

  private _createConfetti(): void {
    if (this.confettiContainer) {
      this.removeChild(this.confettiContainer);
    }

    this.confettiContainer = new PIXI.Container();
    this.addChild(this.confettiContainer);

    for (let i = 0; i < 50; i++) {
      const confetti = new PIXI.Graphics();
      confetti.beginFill(Math.random() * 0xffffff);
      confetti.drawRect(0, 0, 4, 4);
      confetti.endFill();

      confetti.x = this.centerX + (Math.random() - 0.5) * 150;
      confetti.y = this.centerY - this.radius - 60;

      this.confettiContainer.addChild(confetti);

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

  private _reportSelectionFromPointer(): void {
    if (this.hasReportedSelection) return;
    this.hasReportedSelection = true;

    const winningIndex = this.segmentIndexAtPointer(this.currentRotation);
    const selectedSegment = this.wheelSegments[winningIndex];
    const label = selectedSegment?.powerup?.displayName ?? selectedSegment?.text ?? 'No Power-up';

    this._showPowerupResult(label);

    if (selectedSegment?.powerup && this.onSelection) {
      this.onSelection(selectedSegment.powerup, winningIndex);
    } else if (this.onSelection && selectedSegment) {
      // Blank segment — still notify with a synthetic "none"
      this.onSelection(
        { id: 'none', displayName: 'No Power-up' },
        winningIndex
      );
    }
  }

  private handleClick(): void {
    this.spin();
  }

  private createWheel(): void {
    this.wheel.removeChildren();

    const segmentAngle = this.segmentAngle;

    this.wheelSegments.forEach((segmentData, index) => {
      const segment = new PIXI.Graphics();
      const startAngle = index * segmentAngle - Math.PI / 2;
      const endAngle = (index + 1) * segmentAngle - Math.PI / 2;

      segment.beginFill(segmentData.color);
      segment.moveTo(this.centerX, this.centerY);
      segment.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
      segment.lineTo(this.centerX, this.centerY);
      segment.endFill();

      segment.lineStyle(4, 0xffffff, 0.8);
      segment.moveTo(this.centerX, this.centerY);
      segment.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
      segment.lineTo(this.centerX, this.centerY);

      this.wheel.addChild(segment);
      this.addPowerupText(segmentData, index, segmentAngle, startAngle);
    });

    const centerCircle = new PIXI.Graphics();
    centerCircle.beginFill(0xffd700);
    centerCircle.drawCircle(this.centerX, this.centerY, this.radius * 0.15);
    centerCircle.endFill();
    centerCircle.lineStyle(6, 0xffffff);
    centerCircle.drawCircle(this.centerX, this.centerY, this.radius * 0.15);
    this.wheel.addChild(centerCircle);

    const outerBorder = new PIXI.Graphics();
    outerBorder.lineStyle(8, this.DARK_BLUE);
    outerBorder.drawCircle(this.centerX, this.centerY, this.radius);
    this.wheel.addChild(outerBorder);

    this.wheel.pivot.set(this.centerX, this.centerY);
    this.wheel.x = this.centerX;
    this.wheel.y = this.centerY;
  }

  private addPowerupText(
    segmentData: WheelSegment,
    _index: number,
    segmentAngle: number,
    startAngle: number
  ): void {
    const midAngle = startAngle + segmentAngle / 2;
    const textRadius = this.radius * 0.7;
    const words = segmentData.text.split(' ');

    const fontSize = Math.min(this.radius * 0.07, 28);
    const lineHeight = fontSize * 1.3;
    const fill = segmentData.color === this.WHITE ? this.DARK_BLUE : 0xffffff;

    const textContainer = new PIXI.Container();
    textContainer.x = this.centerX + Math.cos(midAngle) * textRadius;
    textContainer.y = this.centerY + Math.sin(midAngle) * textRadius;

    words.forEach((word, wordIndex) => {
      const wordText = new Text(word, {
        fontFamily: 'Grandstander',
        fontSize: fontSize,
        fill,
        fontWeight: 'bold',
        align: 'center',
        dropShadow: {
          color: segmentData.color === this.WHITE ? 0xffffff : 0x000000,
          alpha: 0.6,
          angle: Math.PI / 4,
          distance: 2,
          blur: 1,
        },
      });

      wordText.anchor.set(0.5);
      wordText.x = 0;
      wordText.y = (wordIndex - (words.length - 1) / 2) * lineHeight;
      textContainer.addChild(wordText);
    });

    textContainer.rotation = midAngle + Math.PI / 2;
    this.wheel.addChild(textContainer);
  }

  /**
   * Fixed yellow arrow at the top of the wheel, tip pointing inward at the rim.
   * Whatever segment sits under this tip when the wheel stops is the selection.
   */
  private createPointer(): void {
    this.pointer.clear();

    const tipY = -this.radius + 12;
    const baseY = -this.radius - 42;
    const halfWidth = 28;

    this.pointer.beginFill(0xffff00);
    this.pointer.moveTo(0, tipY);
    this.pointer.lineTo(-halfWidth, baseY);
    this.pointer.lineTo(halfWidth, baseY);
    this.pointer.closePath();
    this.pointer.endFill();

    this.pointer.lineStyle(4, 0xffffff);
    this.pointer.moveTo(0, tipY);
    this.pointer.lineTo(-halfWidth, baseY);
    this.pointer.lineTo(halfWidth, baseY);
    this.pointer.closePath();

    // Dark outline for contrast
    this.pointer.lineStyle(2, 0x114257, 0.9);
    this.pointer.moveTo(0, tipY);
    this.pointer.lineTo(-halfWidth, baseY);
    this.pointer.lineTo(halfWidth, baseY);
    this.pointer.closePath();

    this.pointer.x = this.centerX;
    this.pointer.y = this.centerY;
  }

  private createSparkles(): void {
    if (!this.spinning) return;

    const velocityRatio = Math.max(0, this.spinVelocity / 0.9);
    const particleIntensity = Math.pow(velocityRatio, 2);
    const shouldCreateParticle = Math.random() < particleIntensity * 4;

    if (shouldCreateParticle) {
      const burstSize = Math.ceil(particleIntensity * 16);
      for (let i = 0; i < burstSize; i++) {
        const angle = Math.random() * Math.PI * 2;
        const sparkleRadius = this.radius + (Math.random() - 0.5) * 100;
        const x = this.centerX + Math.cos(angle) * sparkleRadius;
        const y = this.centerY + Math.sin(angle) * sparkleRadius;
        this.sparkles.push(new Sparkle(x, y, this.sparkleContainer));
      }
    }
  }

  public update(delta: number): void {
    if (this.spinning) {
      this.currentRotation += this.spinVelocity * delta;
      this.wheel.rotation = this.currentRotation;
      this.createSparkles();

      if (this.targetRotation !== undefined) {
        const remaining = this.targetRotation - this.currentRotation;
        if (remaining <= 0.02) {
          // Snap exactly onto target so the arrow and result match
          this.currentRotation = this.targetRotation;
          this.wheel.rotation = this.currentRotation;
          this.spinVelocity = 0;
          this.spinning = false;
          this.cursor = 'pointer';
          this.eventMode = 'static';
          this._reportSelectionFromPointer();
          setTimeout(() => this.onSpinComplete?.(), 1000);
          return;
        }

        // Ease down as we approach the target (exciting slowdown)
        if (remaining < Math.PI) {
          this.spinVelocity = Math.max(0.01, remaining * 0.06);
        } else if (remaining < Math.PI * 2.5) {
          this.spinVelocity = Math.max(0.04, Math.min(this.spinVelocity, remaining * 0.08));
        } else {
          this.spinVelocity = Math.max(0.15, this.spinVelocity * 0.992);
        }
      } else {
        this.spinVelocity *= 0.95;
        if (this.spinVelocity < 0.001) {
          this.spinVelocity = 0;
          this.spinning = false;
          this.cursor = 'pointer';
          this.eventMode = 'static';
          this._reportSelectionFromPointer();
          setTimeout(() => this.onSpinComplete?.(), 1000);
        }
      }
    }

    this.updateSparkles();
  }

  private updateSparkles(): void {
    this.sparkles = this.sparkles.filter((sparkle) => {
      const alive = sparkle.update();
      if (!alive) sparkle.destroy();
      return alive;
    });
  }

  public resize(screenWidth: number, screenHeight: number): void {
    this.centerX = screenWidth / 2;
    this.centerY = screenHeight + screenHeight * 0.05;
    this.radius = Math.min(screenWidth * 0.75, screenHeight * 0.4);

    this.sparkles.forEach((sparkle) => sparkle.destroy());
    this.sparkles = [];

    this.createWheel();
    this.createPointer();
    this._createCenterText();
  }

  public destroy(options?: boolean | PIXI.DestroyOptions | undefined): void {
    this.sparkles.forEach((sparkle) => sparkle.destroy());
    this.sparkles = [];
    super.destroy(options);
  }
}

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
    this.decay = Math.random() * 0.008 + 0.004;
    this.size = Math.random() * 12 + 10;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.3;

    const colors = [0xffd700, 0xff69b4, 0x00ced1, 0xff6347, 0x98fb98, 0xdda0dd, 0xff1493, 0x00ff7f];
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

  private drawStar(
    graphics: PIXI.Graphics,
    x: number,
    y: number,
    points: number,
    outerRadius: number,
    innerRadius: number
  ): void {
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
    this.vy += 0.15;

    return this.life > 0;
  }

  public destroy(): void {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
    this.sprite.destroy();
  }
}
