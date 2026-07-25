import * as PIXI from 'pixi.js'
import { EventBus } from '@/lib/pixi-engine/core/EventBus'
import { ENGINE_EVENTS } from '@/lib/pixi-engine/core/EventTypes'
import type { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication'
import type { NinjaClimbLayoutManager } from './NinjaClimbLayoutManager'
import type { ShortcutKind, ShortcutNodeDef } from './NinjaClimbRaceManager'

const ASSET_BASE = '/images/ninja-climb'

interface BandSprite {
  key: string
  sprite: PIXI.Sprite
  /** World Y of the top of this band (0 = summit, larger = lower). */
  worldTop: number
  worldHeight: number
}

/**
 * Sky + parallax mountain bands + gates + barriers + summit flag.
 * Camera scrolls vertically to follow the race leader.
 */
export class NinjaClimbMountainManager {
  private view: PIXI.Container
  private world: PIXI.Container
  private skySprite: PIXI.Sprite | null = null
  private cloudSprites: PIXI.Sprite[] = []
  private bands: BandSprite[] = []
  private gateSprites: Map<string, PIXI.Sprite> = new Map()
  private barrierSprites: Map<string, PIXI.Sprite> = new Map()
  private flagSprite: PIXI.Sprite | null = null
  private trackLeftX = 0
  private trackRightX = 0
  private trackBottomWorldY = 0
  private trackTopWorldY = 0
  private worldHeight = 2400
  private cameraY = 0
  private screenW = 0
  private screenH = 0
  private cloudPhase = 0
  private destroyed = false

  constructor(
    private pixiApp: PixiApplication,
    private eventBus: EventBus,
    private layoutManager: NinjaClimbLayoutManager
  ) {
    this.view = new PIXI.Container()
    this.world = new PIXI.Container()
    this.view.addChild(this.world)
    this.eventBus.on(ENGINE_EVENTS.RESIZED, this._onResize)
  }

  public getView(): PIXI.Container {
    return this.view
  }

  public getWorld(): PIXI.Container {
    return this.world
  }

  /** Left and right lane X positions in world/screen space (lanes don't scroll horizontally). */
  public getLaneXs(): { left: number; right: number } {
    return { left: this.trackLeftX, right: this.trackRightX }
  }

  public getTrackBounds(): { bottomY: number; topY: number; worldHeight: number } {
    return {
      bottomY: this.trackBottomWorldY,
      topY: this.trackTopWorldY,
      worldHeight: this.worldHeight,
    }
  }

  /** Convert race score fraction (0–1) to world Y (larger Y = lower on mountain). */
  public fractionToWorldY(fraction: number): number {
    const f = Math.max(0, Math.min(1, fraction))
    return this.trackBottomWorldY + (this.trackTopWorldY - this.trackBottomWorldY) * f
  }

  public async initialize(nodes: ShortcutNodeDef[]): Promise<void> {
    const { width, height } = this.pixiApp.getScreenSize()
    this.screenW = width
    this.screenH = height
    this._computeTrackGeometry()

    try {
      const skyTex = await PIXI.Assets.load(`${ASSET_BASE}/sky.webp`)
      this.skySprite = new PIXI.Sprite(skyTex)
      this.skySprite.width = width
      this.skySprite.height = height
      this.view.addChildAt(this.skySprite, 0)
    } catch (e) {
      console.warn('NinjaClimbMountainManager: sky load failed', e)
      const g = new PIXI.Graphics()
      g.rect(0, 0, width, height).fill({ color: 0x87ceeb })
      this.view.addChildAt(g, 0)
    }

    const bandFiles = [
      { key: 'summit', src: `${ASSET_BASE}/band_summit.webp` },
      { key: 'snow', src: `${ASSET_BASE}/band_snow.webp` },
      { key: 'rocky', src: `${ASSET_BASE}/band_rocky.webp` },
      { key: 'foothills', src: `${ASSET_BASE}/band_foothills.webp` },
    ]

    const bandH = this.worldHeight / bandFiles.length
    for (let i = 0; i < bandFiles.length; i++) {
      const def = bandFiles[i]
      try {
        const tex = await PIXI.Assets.load(def.src)
        const sprite = new PIXI.Sprite(tex)
        sprite.width = this.screenW
        sprite.height = bandH + 4
        const worldTop = i * bandH
        sprite.y = worldTop
        sprite.x = 0
        this.world.addChild(sprite)
        this.bands.push({ key: def.key, sprite, worldTop, worldHeight: bandH })
      } catch (e) {
        console.warn(`NinjaClimbMountainManager: band ${def.key} failed`, e)
      }
    }

    for (let i = 1; i <= 3; i++) {
      try {
        const tex = await PIXI.Assets.load(`${ASSET_BASE}/cloud_${i}.png`)
        const cloud = new PIXI.Sprite(tex)
        cloud.anchor.set(0.5)
        cloud.scale.set(0.45 + i * 0.08)
        cloud.alpha = 0.85
        cloud.x = (width * i) / 4
        cloud.y = 40 + i * 30
        this.view.addChild(cloud)
        this.cloudSprites.push(cloud)
      } catch {
        /* optional */
      }
    }

    await this._placeGates(nodes)
    await this._placeFlag()
    this.setCameraToFraction(0)
  }

  private async _placeGates(nodes: ShortcutNodeDef[]): Promise<void> {
    for (const node of nodes) {
      const src =
        node.kind === 'forest'
          ? `${ASSET_BASE}/gate_forest.png`
          : `${ASSET_BASE}/gate_cave.png`
      try {
        const tex = await PIXI.Assets.load(src)
        const sprite = new PIXI.Sprite(tex)
        sprite.anchor.set(0.5)
        sprite.scale.set(0.55)
        sprite.x = this.screenW / 2
        sprite.y = this.fractionToWorldY(node.fraction)
        this.world.addChild(sprite)
        this.gateSprites.set(node.id, sprite)
      } catch (e) {
        console.warn('NinjaClimbMountainManager: gate load failed', e)
      }
    }
  }

  private async _placeFlag(): Promise<void> {
    try {
      const tex = await PIXI.Assets.load(`${ASSET_BASE}/flag_summit.png`)
      this.flagSprite = new PIXI.Sprite(tex)
      this.flagSprite.anchor.set(0.5, 1)
      this.flagSprite.scale.set(0.5)
      this.flagSprite.x = this.screenW / 2
      this.flagSprite.y = this.trackTopWorldY
      this.world.addChild(this.flagSprite)
    } catch (e) {
      console.warn('NinjaClimbMountainManager: flag load failed', e)
    }
  }

  public async setBarrier(teamLane: 'left' | 'right', heightFraction: number | null): Promise<void> {
    const key = teamLane
    const existing = this.barrierSprites.get(key)
    if (existing) {
      this.world.removeChild(existing)
      existing.destroy()
      this.barrierSprites.delete(key)
    }
    if (heightFraction == null) return

    try {
      const tex = await PIXI.Assets.load(`${ASSET_BASE}/barrier.png`)
      const sprite = new PIXI.Sprite(tex)
      sprite.anchor.set(0.5)
      sprite.scale.set(0.4)
      sprite.x = teamLane === 'left' ? this.trackLeftX : this.trackRightX
      sprite.y = this.fractionToWorldY(heightFraction)
      this.world.addChild(sprite)
      this.barrierSprites.set(key, sprite)
    } catch (e) {
      console.warn('NinjaClimbMountainManager: barrier load failed', e)
    }
  }

  public shatterBarrier(teamLane: 'left' | 'right'): void {
    const existing = this.barrierSprites.get(teamLane)
    if (!existing) return
    existing.alpha = 0.3
    existing.scale.set(existing.scale.x * 1.2)
    setTimeout(() => {
      if (this.destroyed) return
      if (existing.parent) existing.parent.removeChild(existing)
      existing.destroy()
      this.barrierSprites.delete(teamLane)
    }, 400)
  }

  public dimGate(nodeId: string): void {
    const sprite = this.gateSprites.get(nodeId)
    if (sprite) sprite.alpha = 0.35
  }

  public setCameraToFraction(leaderFraction: number): void {
    const worldY = this.fractionToWorldY(leaderFraction)
    const layout = this.layoutManager.getLayoutParams()
    // Keep climber roughly in vertical middle of the playable area
    const playableTop = layout.questionCardHeight + layout.topPadding
    const playableBottom = this.screenH - layout.bottomUIHeight
    const mid = (playableTop + playableBottom) / 2
    this.cameraY = worldY - mid
    const maxCam = Math.max(0, this.worldHeight - this.screenH)
    this.cameraY = Math.max(0, Math.min(maxCam, this.cameraY))
    this.world.y = -this.cameraY
  }

  public worldYToScreenY(worldY: number): number {
    return worldY + this.world.y
  }

  public update(deltaMs: number): void {
    this.cloudPhase += deltaMs * 0.02
    for (let i = 0; i < this.cloudSprites.length; i++) {
      const cloud = this.cloudSprites[i]
      cloud.x += (0.15 + i * 0.05) * (deltaMs / 16)
      if (cloud.x > this.screenW + 80) cloud.x = -80
      cloud.y += Math.sin(this.cloudPhase + i) * 0.05
    }
  }

  private _computeTrackGeometry(): void {
    const layout = this.layoutManager.getLayoutParams()
    this.worldHeight = Math.max(2000, this.screenH * 3.2)
    this.trackLeftX = this.screenW * 0.32
    this.trackRightX = this.screenW * 0.68
    // Bottom of track near foothills; top near summit
    this.trackBottomWorldY = this.worldHeight - layout.bottomUIHeight - 40
    this.trackTopWorldY = 80
  }

  private _onResize = (): void => {
    if (this.destroyed) return
    const { width, height } = this.pixiApp.getScreenSize()
    this.screenW = width
    this.screenH = height
    this.layoutManager.updateLayout(width, height)
    this._computeTrackGeometry()
    if (this.skySprite) {
      this.skySprite.width = width
      this.skySprite.height = height
    }
    for (const band of this.bands) {
      band.sprite.width = width
    }
    this.trackLeftX = width * 0.32
    this.trackRightX = width * 0.68
  }

  public destroy(): void {
    this.destroyed = true
    this.eventBus.off(ENGINE_EVENTS.RESIZED, this._onResize)
    this.view.destroy({ children: true })
  }
}

export type { ShortcutKind }
