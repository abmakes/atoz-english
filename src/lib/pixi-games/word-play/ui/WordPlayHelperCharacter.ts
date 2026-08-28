import * as PIXI from 'pixi.js'
import { AnimationUtils } from '@/lib/pixi-engine/utils/AnimationUtils'
import type { DraggableTile } from './DraggableTile'
import { WORD_PLAY_VISUAL_THEME } from '../wordPlayVisualTheme'

const CAPY_SHEET = '/images/splash-dash/capy_spritesheet.png'
const CAPY_FRAME_COUNT = 9

export function calculateCarryPoint(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  progress: number
): { x: number; y: number } {
  const eased = AnimationUtils.easeInOutCubic(progress)
  return {
    x: AnimationUtils.lerp(startX, targetX, eased),
    y:
      AnimationUtils.lerp(startY, targetY, eased) -
      Math.sin(Math.PI * progress) * 42,
  }
}

/**
 * Small branded capybara helper. On quick-tap placement it runs from its
 * colorful clubhouse, carries the word card along an arc, then runs home.
 */
export class WordPlayHelperCharacter extends PIXI.Container {
  private readonly home = new PIXI.Container()
  private readonly character = new PIXI.Container()
  private readonly sparkles = new PIXI.Container()
  private readonly fallback: PIXI.Graphics
  private sprite: PIXI.Sprite | null = null
  private frameTextures: PIXI.Texture[] = []
  private frameIndex = 0
  private frameElapsedMs = 0
  private homePosition = new PIXI.Point()
  private queue: Promise<void> = Promise.resolve()
  private generation = 0
  private busy = false

  constructor() {
    super()
    this.label = 'WordPlayHelperCharacter'
    this.eventMode = 'none'

    this._drawHome()
    this.fallback = this._createFallbackCapy()
    this.character.addChild(this.fallback)
    this.character.visible = false

    this.addChild(this.home)
    this.addChild(this.sparkles)
    this.addChild(this.character)

    void this._loadCapySprite()
  }

  public setHomePosition(x: number, y: number): void {
    this.homePosition.set(x, y)
    this.home.position.copyFrom(this.homePosition)
    if (!this.busy) {
      this.character.position.copyFrom(this.homePosition)
    }
  }

  /**
   * Queue carries so one helper can support rapid word taps without visual
   * collisions. Slot occupancy is managed by the UI before this starts.
   */
  public carryTile(
    tile: DraggableTile,
    targetX: number,
    targetY: number
  ): Promise<void> {
    const queuedGeneration = this.generation
    this.queue = this.queue.then(async () => {
      if (queuedGeneration !== this.generation || tile.destroyed) return
      await this._performCarry(tile, targetX, targetY, queuedGeneration)
    })
    return this.queue
  }

  public reset(): void {
    this.generation += 1
    this.queue = Promise.resolve()
    this.busy = false
    this.character.visible = false
    this.character.position.copyFrom(this.homePosition)
    this.sparkles.removeChildren().forEach((child) => child.destroy())
  }

  public update(deltaMs: number): void {
    if (!this.character.visible || !this.sprite || this.frameTextures.length === 0) return
    this.frameElapsedMs += deltaMs
    if (this.frameElapsedMs < 85) return
    this.frameElapsedMs = 0
    this.frameIndex = (this.frameIndex + 1) % this.frameTextures.length
    this.sprite.texture = this.frameTextures[this.frameIndex]
  }

  private async _performCarry(
    tile: DraggableTile,
    targetX: number,
    targetY: number,
    generation: number
  ): Promise<void> {
    this.busy = true
    this.character.visible = true
    this.character.scale.set(1)

    const pickupX = tile.x + tile.tileWidth / 2
    const pickupY = tile.y + tile.tileHeight + 18

    await this._moveCharacter(
      this.homePosition.x,
      this.homePosition.y,
      pickupX,
      pickupY,
      220,
      generation
    )
    if (generation !== this.generation || tile.destroyed) return

    const startTileX = tile.x
    const startTileY = tile.y
    this.character.scale.x = targetX < startTileX ? -1 : 1
    await this._animate(520, generation, (t) => {
      if (tile.destroyed) return
      const point = calculateCarryPoint(startTileX, startTileY, targetX, targetY, t)
      tile.x = point.x
      tile.y = point.y
      this.character.x = tile.x + tile.tileWidth / 2
      this.character.y = tile.y + tile.tileHeight + 18
      this.character.rotation = Math.sin(t * Math.PI * 4) * 0.06
      if (Math.floor(t * 12) !== Math.floor((t - 0.03) * 12)) {
        this._createSparkle(this.character.x, this.character.y)
      }
    })

    if (generation !== this.generation || tile.destroyed) return
    tile.position.set(targetX, targetY)
    this.character.rotation = 0

    await this._moveCharacter(
      this.character.x,
      this.character.y,
      this.homePosition.x,
      this.homePosition.y,
      320,
      generation
    )
    if (generation !== this.generation) return

    this.character.visible = false
    this.busy = false
  }

  private async _moveCharacter(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    durationMs: number,
    generation: number
  ): Promise<void> {
    if (Math.abs(toX - fromX) > 1) {
      this.character.scale.x = toX < fromX ? -1 : 1
    }
    this.character.scale.y = 1
    await this._animate(durationMs, generation, (t) => {
      const eased = AnimationUtils.easeInOutQuad(t)
      this.character.x = AnimationUtils.lerp(fromX, toX, eased)
      this.character.y =
        AnimationUtils.lerp(fromY, toY, eased) - Math.sin(Math.PI * t) * 18
      this.character.rotation = Math.sin(t * Math.PI * 3) * 0.08
    })
    this.character.rotation = 0
  }

  private _animate(
    durationMs: number,
    generation: number,
    apply: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now()
      const step = () => {
        if (generation !== this.generation || this.destroyed) {
          resolve()
          return
        }
        const progress = Math.min(1, (performance.now() - start) / durationMs)
        apply(progress)
        if (progress < 1) {
          requestAnimationFrame(step)
        } else {
          resolve()
        }
      }
      requestAnimationFrame(step)
    })
  }

  private async _loadCapySprite(): Promise<void> {
    try {
      const baseTexture =
        PIXI.Assets.get<PIXI.Texture>('word-play-capy-helper') ??
        (await PIXI.Assets.load<PIXI.Texture>(CAPY_SHEET))
      if (this.destroyed) return

      const frameWidth = baseTexture.width / CAPY_FRAME_COUNT
      const frameHeight = baseTexture.height
      this.frameTextures = Array.from({ length: CAPY_FRAME_COUNT }, (_, index) =>
        new PIXI.Texture({
          source: baseTexture.source,
          frame: new PIXI.Rectangle(index * frameWidth, 0, frameWidth, frameHeight),
        })
      )

      this.sprite = new PIXI.Sprite(this.frameTextures[0])
      this.sprite.anchor.set(0.5)
      this.sprite.scale.set(58 / frameHeight)
      this.character.removeChild(this.fallback)
      this.fallback.destroy()
      this.character.addChild(this.sprite)
    } catch (error) {
      console.warn('[WordPlayHelperCharacter] Using drawn fallback helper.', error)
    }
  }

  private _drawHome(): void {
    const hut = new PIXI.Graphics()
    hut.roundRect(-31, -18, 62, 42, 12).fill(WORD_PLAY_VISUAL_THEME.helperHome)
    hut
      .moveTo(-37, -16)
      .lineTo(0, -46)
      .lineTo(37, -16)
      .closePath()
      .fill(WORD_PLAY_VISUAL_THEME.helperRoof)
      .stroke({ color: 0xffffff, width: 3 })
    hut.roundRect(-9, 4, 18, 20, 8).fill(0x8b5a2b)
    hut.circle(-18, -1, 4).fill(0xffffff)
    hut.circle(18, -1, 4).fill(0xffffff)
    this.home.addChild(hut)

    const sign = new PIXI.Text({
      text: 'HOME',
      style: {
        fontFamily: 'Grandstander',
        fontSize: 11,
        fontWeight: 'bold',
        fill: WORD_PLAY_VISUAL_THEME.text,
      },
    })
    sign.anchor.set(0.5)
    sign.y = -10
    this.home.addChild(sign)
  }

  private _createFallbackCapy(): PIXI.Graphics {
    const capy = new PIXI.Graphics()
    capy.ellipse(0, 0, 27, 17).fill(0xa86f3d)
    capy.circle(21, -6, 15).fill(0xb77a43)
    capy.circle(15, -18, 5).fill(0x8c5b32)
    capy.circle(28, -17, 5).fill(0x8c5b32)
    capy.circle(26, -8, 2.5).fill(0x114257)
    capy.circle(35, -2, 3).fill(0x5a3822)
    capy.ellipse(-15, 14, 6, 4).fill(0x7a4b2b)
    capy.ellipse(12, 14, 6, 4).fill(0x7a4b2b)
    return capy
  }

  private _createSparkle(x: number, y: number): void {
    const colors = [0xffd85a, 0xf56fa7, 0x35bdf4, 0x65c979]
    const dot = new PIXI.Graphics()
      .circle(0, 0, 3 + Math.random() * 3)
      .fill(colors[Math.floor(Math.random() * colors.length)])
    dot.position.set(x + (Math.random() - 0.5) * 24, y + (Math.random() - 0.5) * 18)
    this.sparkles.addChild(dot)

    const start = performance.now()
    const animate = () => {
      if (dot.destroyed) return
      const t = Math.min(1, (performance.now() - start) / 420)
      dot.y -= 0.8
      dot.alpha = 1 - t
      dot.scale.set(1 + t * 0.8)
      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        dot.destroy()
      }
    }
    requestAnimationFrame(animate)
  }

  public override destroy(options?: Parameters<PIXI.Container['destroy']>[0]): void {
    this.reset()
    this.frameTextures.forEach((texture) => texture.destroy())
    this.frameTextures = []
    super.destroy(options ?? { children: true })
  }
}
