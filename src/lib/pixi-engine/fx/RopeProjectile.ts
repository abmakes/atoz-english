import * as PIXI from 'pixi.js'
import {
  type RopePhase,
  type RopeTiming,
  type Vec2,
  easeInQuad,
  easeOutQuad,
  sampleRope,
  timingToPhase,
  totalRopeDurationMs,
} from './ropeProjectileMath'

export type {
  RopePhase,
  RopeTiming,
  Vec2,
} from './ropeProjectileMath'

export interface RopeProjectileOptions {
  parent: PIXI.Container
  tipTexture?: PIXI.Texture | null
  bodyTexture?: PIXI.Texture | null
  bodyThickness?: number
  bodyTint?: number
  tipDisplaySize?: number
  extendDurationMs?: number
  holdDurationMs?: number
  retractDurationMs?: number
  easeExtend?: (t: number) => number
  easeRetract?: (t: number) => number
  /** Draw above most world sprites. */
  zIndex?: number
}

export interface RopePlayArgs {
  getPointA: () => Vec2
  getPointB: () => Vec2
  /**
   * During retract, tip stays on B (victim). Game should move B toward
   * the landing point (e.g. opponent hop) so the rope shortens naturally.
   */
  pullTargetDuringRetract?: boolean
  onReachB?: () => void
  onComplete?: () => void
}

/**
 * Reusable rope / harpoon VFX: tip leads A→B, body stretches, then retracts.
 */
export class RopeProjectile {
  private readonly view: PIXI.Container
  private readonly bodyGraphics: PIXI.Graphics
  private readonly bodySprite: PIXI.TilingSprite | null = null
  private readonly tipSprite: PIXI.Sprite
  private readonly timing: RopeTiming
  private readonly bodyThickness: number
  private readonly bodyTint: number
  private readonly tipDisplaySize: number
  private readonly easeExtend: (t: number) => number
  private readonly easeRetract: (t: number) => number

  private phase: RopePhase = 'idle'
  private elapsedMs = 0
  private playing = false
  private destroyed = false
  private reachedBFired = false
  private pullTargetDuringRetract = false
  private getPointA: (() => Vec2) | null = null
  private getPointB: (() => Vec2) | null = null
  private onReachB: (() => void) | null = null
  private onComplete: (() => void) | null = null
  private resolvePlay: (() => void) | null = null
  private tipPos: Vec2 = { x: 0, y: 0 }

  constructor(private readonly options: RopeProjectileOptions) {
    this.timing = {
      extendDurationMs: options.extendDurationMs ?? 280,
      holdDurationMs: options.holdDurationMs ?? 90,
      retractDurationMs: options.retractDurationMs ?? 420,
    }
    this.bodyThickness = options.bodyThickness ?? 6
    this.bodyTint = options.bodyTint ?? 0xd4a574
    this.tipDisplaySize = options.tipDisplaySize ?? 28
    this.easeExtend = options.easeExtend ?? easeOutQuad
    this.easeRetract = options.easeRetract ?? easeInQuad

    this.view = new PIXI.Container()
    this.view.zIndex = options.zIndex ?? 500
    this.view.visible = false
    this.view.sortableChildren = true

    this.bodyGraphics = new PIXI.Graphics()
    this.bodyGraphics.zIndex = 0
    this.view.addChild(this.bodyGraphics)

    if (options.bodyTexture) {
      this.bodySprite = new PIXI.TilingSprite({
        texture: options.bodyTexture,
        width: 8,
        height: this.bodyThickness,
      })
      this.bodySprite.anchor.set(0, 0.5)
      this.bodySprite.tint = this.bodyTint
      this.bodySprite.zIndex = 0
      this.view.addChild(this.bodySprite)
      this.bodyGraphics.visible = false
    }

    this.tipSprite = new PIXI.Sprite(options.tipTexture ?? PIXI.Texture.WHITE)
    this.tipSprite.anchor.set(0.85, 0.5)
    this.tipSprite.zIndex = 1
    if (options.tipTexture) {
      const scale = this.tipDisplaySize / Math.max(1, options.tipTexture.height)
      this.tipSprite.scale.set(scale)
    } else {
      this.tipSprite.width = this.tipDisplaySize
      this.tipSprite.height = this.tipDisplaySize * 0.35
      this.tipSprite.tint = 0xcbd5e1
    }
    this.view.addChild(this.tipSprite)

    options.parent.addChild(this.view)
    options.parent.sortableChildren = true
  }

  public getPhase(): RopePhase {
    return this.phase
  }

  public getTipPosition(): Vec2 {
    return { ...this.tipPos }
  }

  public isPlaying(): boolean {
    return this.playing
  }

  public play(args: RopePlayArgs): Promise<void> {
    if (this.destroyed) return Promise.resolve()
    this.cancel()

    this.getPointA = args.getPointA
    this.getPointB = args.getPointB
    this.pullTargetDuringRetract = !!args.pullTargetDuringRetract
    this.onReachB = args.onReachB ?? null
    this.onComplete = args.onComplete ?? null
    this.elapsedMs = 0
    this.reachedBFired = false
    this.playing = true
    this.phase = 'extending'
    this.view.visible = true

    return new Promise((resolve) => {
      this.resolvePlay = resolve
    })
  }

  public update(deltaMs: number): void {
    if (this.destroyed || !this.playing || !this.getPointA || !this.getPointB) {
      return
    }

    this.elapsedMs += Math.max(0, deltaMs)
    const { phase, phaseT, totalDone } = timingToPhase(this.elapsedMs, this.timing)

    if (phase === 'holding' || phase === 'retracting' || phase === 'done') {
      if (!this.reachedBFired) {
        this.reachedBFired = true
        try {
          this.onReachB?.()
        } catch (e) {
          console.warn('RopeProjectile onReachB error', e)
        }
      }
    }

    const pointA = this.getPointA()
    const pointB = this.getPointB()
    const sample = sampleRope({
      phase,
      phaseT,
      pointA,
      pointB,
      tipFollowsB: this.pullTargetDuringRetract && phase === 'retracting',
      easeExtend: this.easeExtend,
      easeRetract: this.easeRetract,
    })

    this.phase = sample.phase
    this.tipPos = sample.tip
    this._draw(pointA, sample.tip, sample.rotation)

    if (totalDone || phase === 'done') {
      this._finish()
    }
  }

  public cancel(): void {
    if (!this.playing && !this.resolvePlay) {
      this.view.visible = false
      return
    }
    this.playing = false
    this.phase = 'done'
    this.view.visible = false
    this.bodyGraphics.clear()
    const resolve = this.resolvePlay
    this.resolvePlay = null
    this.getPointA = null
    this.getPointB = null
    this.onReachB = null
    const onComplete = this.onComplete
    this.onComplete = null
    resolve?.()
    try {
      onComplete?.()
    } catch (e) {
      console.warn('RopeProjectile onComplete error', e)
    }
  }

  public destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.cancel()
    if (this.view.parent) this.view.parent.removeChild(this.view)
    this.view.destroy({ children: true })
  }

  public static getDefaultDurationMs(partial?: Partial<RopeTiming>): number {
    return totalRopeDurationMs({
      extendDurationMs: partial?.extendDurationMs ?? 280,
      holdDurationMs: partial?.holdDurationMs ?? 90,
      retractDurationMs: partial?.retractDurationMs ?? 420,
    })
  }

  private _finish(): void {
    if (!this.playing) return
    this.playing = false
    this.phase = 'done'
    this.view.visible = false
    this.bodyGraphics.clear()
    const resolve = this.resolvePlay
    this.resolvePlay = null
    const onComplete = this.onComplete
    this.onComplete = null
    this.getPointA = null
    this.getPointB = null
    this.onReachB = null
    resolve?.()
    try {
      onComplete?.()
    } catch (e) {
      console.warn('RopeProjectile onComplete error', e)
    }
  }

  private _draw(anchor: Vec2, tip: Vec2, rotation: number): void {
    this.tipSprite.x = tip.x
    this.tipSprite.y = tip.y
    this.tipSprite.rotation = rotation

    const dx = tip.x - anchor.x
    const dy = tip.y - anchor.y
    const len = Math.hypot(dx, dy)

    if (this.bodySprite) {
      this.bodySprite.visible = len > 1
      this.bodySprite.x = anchor.x
      this.bodySprite.y = anchor.y
      this.bodySprite.rotation = rotation
      this.bodySprite.width = Math.max(1, len)
      this.bodySprite.height = this.bodyThickness
      return
    }

    this.bodyGraphics.clear()
    if (len < 1) return
    // Outline under, then fill
    this.bodyGraphics
      .moveTo(anchor.x, anchor.y)
      .lineTo(tip.x, tip.y)
      .stroke({
        width: this.bodyThickness + 3,
        color: 0x1f2937,
        cap: 'round',
      })
    this.bodyGraphics
      .moveTo(anchor.x, anchor.y)
      .lineTo(tip.x, tip.y)
      .stroke({ width: this.bodyThickness, color: this.bodyTint, cap: 'round' })
  }
}
