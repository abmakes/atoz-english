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
const WEDGE_FLASH_MS = 400;
const RESULT_HOLD_MS = 2800;
const PORTRAIT_WHEEL_MIN_RADIUS = 220;

export interface PowerupWheelLayout {
  centerX: number;
  centerY: number;
  radius: number;
  isPortrait: boolean;
}

/**
 * Portrait deliberately keeps the wheel readable instead of shrinking it to
 * fit the narrow edge. The viewport clips the outer rim; the pointer, center,
 * labels, and result overlay remain visible.
 */
export function calculatePowerupWheelLayout(
  screenWidth: number,
  screenHeight: number
): PowerupWheelLayout {
  const isPortrait = screenWidth < 640 && screenHeight > screenWidth;
  const radius = isPortrait
    ? Math.max(
        PORTRAIT_WHEEL_MIN_RADIUS,
        Math.min(screenHeight * 0.3, 260)
      )
    : Math.min(screenWidth * 0.38, screenHeight * 0.34);
  const centerX = screenWidth / 2;
  const desiredCenterY = screenHeight * (isPortrait ? 0.58 : 0.58);
  const minCenterY = radius + (isPortrait ? 24 : 56);
  const maxCenterY = screenHeight - radius - 24;
  const centerY = Math.min(maxCenterY, Math.max(minCenterY, desiredCenterY));

  return { centerX, centerY, radius, isPortrait };
}

/**
 * Spin wheel for powerup selection.
 * A fixed pointer at the top of the wheel indicates the winning segment when spin stops.
 * After stop: brief wedge flash, then a centered result card for classroom visibility.
 */
export class PowerupSpinWheel extends PIXI.Container {
  private wheel: PIXI.Container;
  private pointer: PIXI.Graphics;
  private sparkleContainer: PIXI.Container;
  private overlayContainer: PIXI.Container;
  private sparkles: Sparkle[] = [];
  private powerups: SelectablePowerupInfo[];
  private preselectedPowerupId?: string | null;
  private preselectedSegmentIndex?: number | null;
  private onSelection?: (selectedPowerup: SelectablePowerupInfo, segmentIndex: number) => void;
  private onSpinComplete?: () => void;

  private spinning = false;
  private currentRotation = 0;
  private hasReportedSelection = false;
  private revealInProgress = false;

  /** Time-based spin (delta is milliseconds). */
  private spinElapsedMs = 0;
  private spinDurationMs = 4500;
  private spinStartRotation = 0;
  private spinEndRotation = 0;

  private confettiContainer: PIXI.Container | null = null;
  private wedgeHighlight: PIXI.Graphics | null = null;
  private resultCard: PIXI.Container | null = null;

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
    void this.themeConfig;

    this.wheel = new PIXI.Container();
    this.pointer = new PIXI.Graphics();
    this.sparkleContainer = new PIXI.Container();
    this.overlayContainer = new PIXI.Container();

    this.addChild(this.wheel);
    this.addChild(this.pointer);
    this.addChild(this.sparkleContainer);
    this.addChild(this.overlayContainer);

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
    this.layoutForScreen(screenWidth, screenHeight);

    this.createWheel();
    this.createPointer();

    setTimeout(() => {
      if (!this.spinning && !this.revealInProgress) {
        this.spin();
      }
    }, 500);
  }

  /** Full wheel on screen — centered in the lower half with room for the pointer. */
  private layoutForScreen(screenWidth: number, screenHeight: number): void {
    const layout = calculatePowerupWheelLayout(screenWidth, screenHeight);
    this.centerX = layout.centerX;
    this.centerY = layout.centerY;
    this.radius = layout.radius;
  }

  private segmentCenterLocalAngle(index: number): number {
    return -Math.PI / 2 + (index + 0.5) * this.segmentAngle;
  }

  private rotationForSegment(index: number, extraSpins = 4): number {
    const localCenter = this.segmentCenterLocalAngle(index);
    let delta = -Math.PI / 2 - localCenter;
    while (delta <= 0) {
      delta += TWO_PI;
    }
    return delta + TWO_PI * extraSpins;
  }

  private segmentIndexAtPointer(rotation: number): number {
    const rot = ((rotation % TWO_PI) + TWO_PI) % TWO_PI;
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

    const filled = this.wheelSegments
      .map((s, i) => (s.powerup ? i : -1))
      .filter((i) => i >= 0);
    if (filled.length > 0) {
      return filled[Math.floor(Math.random() * filled.length)];
    }
    return Math.floor(Math.random() * this.segmentCount);
  }

  public spin(): void {
    if (this.spinning || this.revealInProgress) return;

    this.spinning = true;
    this.hasReportedSelection = false;
    this.spinElapsedMs = 0;
    this.spinDurationMs = 4000 + Math.random() * 1500;

    const targetIndex = this.resolveTargetSegmentIndex();
    const extraSpins = 4 + Math.floor(Math.random() * 3);
    const base = this.rotationForSegment(targetIndex, extraSpins);
    const currentMod = ((this.currentRotation % TWO_PI) + TWO_PI) % TWO_PI;
    const baseMod = ((base % TWO_PI) + TWO_PI) % TWO_PI;
    let forward = baseMod - currentMod;
    if (forward < TWO_PI * extraSpins) {
      forward += TWO_PI * extraSpins;
    }

    this.spinStartRotation = this.currentRotation;
    this.spinEndRotation = this.currentRotation + forward;
    this.preselectedSegmentIndex = targetIndex;

    this.cursor = 'not-allowed';
    this.eventMode = 'none';
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private _flashWinningWedge(index: number): void {
    if (this.wedgeHighlight) {
      this.wedgeHighlight.destroy();
      this.wedgeHighlight = null;
    }

    const startAngle = index * this.segmentAngle - Math.PI / 2;
    const endAngle = (index + 1) * this.segmentAngle - Math.PI / 2;

    // Draw in local wheel space so it rotates with the stopped wheel
    const highlight = new PIXI.Graphics();
    highlight.beginFill(0xffd700, 0.35);
    highlight.moveTo(this.centerX, this.centerY);
    highlight.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
    highlight.lineTo(this.centerX, this.centerY);
    highlight.endFill();

    highlight.lineStyle(8, 0xffd700, 1);
    highlight.moveTo(this.centerX, this.centerY);
    highlight.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
    highlight.lineTo(this.centerX, this.centerY);

    this.wheel.addChild(highlight);
    this.wedgeHighlight = highlight;

    // Pulse opacity
    let elapsed = 0;
    const pulse = () => {
      if (!this.wedgeHighlight) return;
      elapsed += 16;
      const t = (elapsed % 200) / 200;
      this.wedgeHighlight.alpha = 0.55 + 0.45 * Math.sin(t * Math.PI);
      if (elapsed < WEDGE_FLASH_MS) {
        requestAnimationFrame(pulse);
      } else if (this.wedgeHighlight) {
        this.wedgeHighlight.alpha = 0.7;
      }
    };
    requestAnimationFrame(pulse);
  }

  private _showResultCard(powerup: SelectablePowerupInfo): void {
    if (this.resultCard) {
      this.overlayContainer.removeChild(this.resultCard);
      this.resultCard.destroy({ children: true });
      this.resultCard = null;
    }

    // Dim the wheel slightly so the card owns focus
    this.wheel.alpha = 0.45;
    this.pointer.alpha = 0.5;

    const isDebuff = powerup.polarity === 'debuff';
    const cardBg = isDebuff ? 0xb91c1c : 0x0f766e;
    const accent = isDebuff ? 0xfca5a5 : 0x5eead4;

    const card = new PIXI.Container();
    const screenWidth = this.centerX * 2;
    const isPortrait = screenWidth < 640;
    const padX = isPortrait ? 24 : 48;
    const padY = isPortrait ? 20 : 28;

    const label = new Text(powerup.displayName, {
      fontFamily: 'Grandstander',
      fontSize: isPortrait ? 36 : 56,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center',
      stroke: { color: 0x000000, width: 5 },
      wordWrap: isPortrait,
      wordWrapWidth: isPortrait ? screenWidth * 0.68 : screenWidth * 0.8,
    });
    label.anchor.set(0.5);

    const subtitle = new Text(isDebuff ? 'Power-down!' : 'Power-up!', {
      fontFamily: 'Grandstander',
      fontSize: isPortrait ? 18 : 22,
      fontWeight: 'bold',
      fill: accent,
      align: 'center',
    });
    subtitle.anchor.set(0.5);

    const cardWidth = Math.max(label.width, subtitle.width) + padX * 2;
    const cardHeight = label.height + subtitle.height + padY * 2 + 12;

    const bg = new PIXI.Graphics();
    bg.beginFill(cardBg, 0.96);
    bg.drawRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 20);
    bg.endFill();
    bg.lineStyle(5, 0xffd700, 1);
    bg.drawRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 20);

    subtitle.y = -cardHeight / 2 + padY + subtitle.height / 2;
    label.y = subtitle.y + subtitle.height / 2 + 10 + label.height / 2;

    card.addChild(bg);
    card.addChild(subtitle);
    card.addChild(label);
    card.x = this.centerX;
    card.y = this.centerY;
    card.scale.set(0.6);
    card.alpha = 0;

    this.overlayContainer.addChild(card);
    this.resultCard = card;

    // Pop-in
    const start = performance.now();
    const animateIn = () => {
      if (!this.resultCard) return;
      const t = Math.min(1, (performance.now() - start) / 280);
      const eased = 1 - Math.pow(1 - t, 3);
      this.resultCard.scale.set(0.6 + 0.4 * eased);
      this.resultCard.alpha = eased;
      if (t < 1) requestAnimationFrame(animateIn);
    };
    requestAnimationFrame(animateIn);

    this._createConfettiAroundCard();
  }

  private _createConfettiAroundCard(): void {
    if (this.confettiContainer) {
      this.overlayContainer.removeChild(this.confettiContainer);
      this.confettiContainer.destroy({ children: true });
    }

    this.confettiContainer = new PIXI.Container();
    this.overlayContainer.addChild(this.confettiContainer);

    const colors = [0xffd700, 0xffffff, 0x5eead4, 0xfbbf24, 0xf472b6];
    for (let i = 0; i < 28; i++) {
      const confetti = new PIXI.Graphics();
      confetti.beginFill(colors[Math.floor(Math.random() * colors.length)]);
      confetti.drawRect(0, 0, 5, 5);
      confetti.endFill();

      confetti.x = this.centerX + (Math.random() - 0.5) * 220;
      confetti.y = this.centerY - 40 + (Math.random() - 0.5) * 40;
      this.confettiContainer.addChild(confetti);

      const fallSpeed = Math.random() * 2.5 + 1.5;
      const rotationSpeed = (Math.random() - 0.5) * 0.15;

      const animate = () => {
        confetti.y += fallSpeed;
        confetti.rotation += rotationSpeed;
        confetti.alpha -= 0.012;
        if (confetti.alpha > 0 && confetti.y < this.centerY + 220) {
          requestAnimationFrame(animate);
        } else {
          confetti.destroy();
        }
      };
      requestAnimationFrame(animate);
    }
  }

  private async _runSelectionReveal(
    selected: SelectablePowerupInfo,
    winningIndex: number
  ): Promise<void> {
    this.revealInProgress = true;
    this._flashWinningWedge(winningIndex);

    await new Promise((r) => setTimeout(r, WEDGE_FLASH_MS));

    this._showResultCard(selected);

    if (this.onSelection) {
      this.onSelection(selected, winningIndex);
    }

    await new Promise((r) => setTimeout(r, RESULT_HOLD_MS));

    this.revealInProgress = false;
    this.onSpinComplete?.();
  }

  private _reportSelectionFromPointer(): void {
    if (this.hasReportedSelection) return;
    this.hasReportedSelection = true;

    const winningIndex = this.segmentIndexAtPointer(this.currentRotation);
    const selectedSegment = this.wheelSegments[winningIndex];
    const selected: SelectablePowerupInfo = selectedSegment?.powerup ?? {
      id: 'none',
      displayName: 'No Power-up',
    };

    void this._runSelectionReveal(selected, winningIndex);
  }

  private handleClick(): void {
    this.spin();
  }

  private createWheel(): void {
    this.wheel.removeChildren();
    this.wedgeHighlight = null;

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
    this.wheel.alpha = 1;
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

    this.pointer.lineStyle(2, 0x114257, 0.9);
    this.pointer.moveTo(0, tipY);
    this.pointer.lineTo(-halfWidth, baseY);
    this.pointer.lineTo(halfWidth, baseY);
    this.pointer.closePath();

    this.pointer.x = this.centerX;
    this.pointer.y = this.centerY;
    this.pointer.alpha = 1;
  }

  /** Quiet accent sparkles — never dense enough to cover labels. */
  private createSparkles(): void {
    if (!this.spinning) return;

    const progress = Math.min(1, this.spinElapsedMs / this.spinDurationMs);
    const velocityRatio = Math.max(0, 1 - progress);
    const particleIntensity = Math.pow(velocityRatio, 2);
    // ~5× quieter than before
    const shouldCreateParticle = Math.random() < particleIntensity * 0.55;

    if (shouldCreateParticle) {
      const burstSize = Math.min(2, Math.max(1, Math.ceil(particleIntensity * 2)));
      for (let i = 0; i < burstSize; i++) {
        const angle = Math.random() * Math.PI * 2;
        const sparkleRadius = this.radius + (Math.random() - 0.5) * 40;
        const x = this.centerX + Math.cos(angle) * sparkleRadius;
        const y = this.centerY + Math.sin(angle) * sparkleRadius;
        this.sparkles.push(new Sparkle(x, y, this.sparkleContainer));
      }
    }
  }

  /**
   * @param deltaMs Frame delta in milliseconds.
   */
  public update(deltaMs: number): void {
    if (this.spinning) {
      this.spinElapsedMs += Math.max(0, deltaMs);
      const t = Math.min(1, this.spinElapsedMs / this.spinDurationMs);
      const eased = this.easeOutCubic(t);
      this.currentRotation =
        this.spinStartRotation + (this.spinEndRotation - this.spinStartRotation) * eased;
      this.wheel.rotation = this.currentRotation;
      this.createSparkles();

      if (t >= 1) {
        this.currentRotation = this.spinEndRotation;
        this.wheel.rotation = this.currentRotation;
        this.spinning = false;
        this.cursor = 'pointer';
        this.eventMode = 'static';
        this._reportSelectionFromPointer();
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
    this.layoutForScreen(screenWidth, screenHeight);

    this.sparkles.forEach((sparkle) => sparkle.destroy());
    this.sparkles = [];

    this.createWheel();
    this.createPointer();
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
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6;
    this.life = 1.0;
    this.decay = Math.random() * 0.014 + 0.01; // faster fade
    this.size = Math.random() * 5 + 4; // smaller
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;

    const colors = [0xffd700, 0xff69b4, 0x00ced1, 0xff6347];
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.sprite.beginFill(color, 0.85);
    this.drawStar(this.sprite, 0, 0, 5, this.size, this.size * 0.4);
    this.sprite.endFill();

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
    this.vy += 0.12;

    return this.life > 0;
  }

  public destroy(): void {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
    this.sprite.destroy();
  }
}
