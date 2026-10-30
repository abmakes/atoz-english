import * as PIXI from 'pixi.js'
import { EventBus } from '@/lib/pixi-engine/core/EventBus'
import { ENGINE_EVENTS } from '@/lib/pixi-engine/core/EventTypes'
import type { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication'
import type { NinjaClimbLayoutManager } from './NinjaClimbLayoutManager'
import type { ShortcutNodeDef } from './NinjaClimbRaceManager'
import { buildCliffLayout, type CliffLayout, type Waypoint } from '../mountainPath'

const SCENE_BASE = '/images/ninja-climb/v2'
const PROP_BASE = '/images/ninja-climb'

/**
 * Painted cliff: distant vista, base → tiled mid zigzag → summit,
 * with a screen-fixed cloud and foliage frame.
 */
export class NinjaClimbMountainManager {
  private view: PIXI.Container
  private world: PIXI.Container
  private backdrop: PIXI.Sprite | null = null
  private cloudFrame: PIXI.Sprite | null = null
  private bushFrame: PIXI.Sprite | null = null
  private cliff: CliffLayout | null = null
  private trailGraphics: PIXI.Graphics
  private gateSprites: Map<string, PIXI.Sprite> = new Map()
  private barrierSprite: PIXI.Sprite | null = null
  private path: Waypoint[] = []
  private screenW = 0
  private screenH = 0
  private cameraX = 0
  private cameraY = 0
  private cameraZoom = 1
  private targetCameraX = 0
  private targetCameraY = 0
  private targetZoom = 1
  private destroyed = false
  private pulseStep: number | null = null
  private pulseTime = 0

  constructor(
    private pixiApp: PixiApplication,
    private eventBus: EventBus,
    private layoutManager: NinjaClimbLayoutManager
  ) {
    this.view = new PIXI.Container()
    this.world = new PIXI.Container()
    this.trailGraphics = new PIXI.Graphics()
    this.view.addChild(this.world)
    this.eventBus.on(ENGINE_EVENTS.RESIZED, this._onResize)
  }

  public getView(): PIXI.Container {
    return this.view
  }

  public getWorld(): PIXI.Container {
    return this.world
  }

  /** Painted clouds live inside this view. No separate procedural bank. */
  public getCloudOverlay(): null {
    return null
  }

  public getPath(): Waypoint[] {
    return this.path
  }

  public getWaypoint(stepIndex: number): Waypoint | null {
    if (stepIndex < 0 || stepIndex >= this.path.length) return null
    return this.path[stepIndex]
  }

  public async initialize(totalSteps: number, nodes: ShortcutNodeDef[]): Promise<void> {
    const { width, height } = this.pixiApp.getScreenSize()
    this.screenW = width
    this.screenH = height

    this.cliff = buildCliffLayout({
      totalSteps,
      screenWidth: width,
    })
    this.path = this.cliff.waypoints

    await this._buildBackdrop()
    await this._buildCliffTiles()
    await this._placeGates(nodes)
    await this._buildFrames()

    this.world.addChild(this.trailGraphics)
    this._drawTrail()

    // Start camera at base
    if (this.path[0]) {
      this.cameraX = this.path[0].x
      this.cameraY = this.path[0].y
      this.targetCameraX = this.cameraX
      this.targetCameraY = this.cameraY
    }
    this._applyCameraTransform()

  }

  /** Distant mountains, screen-fixed behind the scrolling cliff. */
  private async _buildBackdrop(): Promise<void> {
    try {
      const tex = await PIXI.Assets.load(`${SCENE_BASE}/background.png`)
      this.backdrop = new PIXI.Sprite(tex)
      this._coverScreen(this.backdrop)
      this.view.addChildAt(this.backdrop, 0)
    } catch (e) {
      console.warn('NinjaClimbMountainManager: backdrop failed', e)
      const g = new PIXI.Graphics()
      g.rect(0, 0, this.screenW, this.screenH).fill({ color: 0x87ceeb })
      this.view.addChildAt(g, 0)
    }
  }

  /**
   * Stack base, repeating mid, and summit using the same tile boxes as the path
   * so each waypoint sits on the painted grass.
   */
  private async _buildCliffTiles(): Promise<void> {
    if (!this.cliff) return
    const fileFor = { base: 'base.png', mid: 'mid.png', top: 'top.png' } as const
    try {
      for (const tile of this.cliff.tiles) {
        const tex = await PIXI.Assets.load(`${SCENE_BASE}/${fileFor[tile.kind]}`)
        const sprite = new PIXI.Sprite(tex)
        sprite.anchor.set(0.5, 1)
        sprite.scale.set(tile.width / Math.max(1, tex.width))
        sprite.x = tile.centerX
        sprite.y = tile.bottomY
        sprite.zIndex = 0
        this.world.addChild(sprite)
      }
    } catch (e) {
      console.warn('NinjaClimbMountainManager: cliff stack failed', e)
    }
  }

  /** Side clouds and foliage, screen-fixed in front of the cliff and behind the HUD. */
  private async _buildFrames(): Promise<void> {
    try {
      const clouds = await PIXI.Assets.load(`${SCENE_BASE}/clouds.png`)
      this.cloudFrame = new PIXI.Sprite(clouds)
      this._coverScreen(this.cloudFrame)
      this.view.addChild(this.cloudFrame)
    } catch (e) {
      console.warn('NinjaClimbMountainManager: clouds failed', e)
    }
    try {
      const bush = await PIXI.Assets.load(`${SCENE_BASE}/bush.png`)
      this.bushFrame = new PIXI.Sprite(bush)
      this._coverScreen(this.bushFrame)
      this.view.addChild(this.bushFrame)
    } catch (e) {
      console.warn('NinjaClimbMountainManager: bush frame failed', e)
    }
  }

  private _coverScreen(sprite: PIXI.Sprite): void {
    const texW = Math.max(1, sprite.texture.width)
    const texH = Math.max(1, sprite.texture.height)
    const scale = Math.max(this.screenW / texW, this.screenH / texH)
    sprite.anchor.set(0.5, 0.5)
    sprite.scale.set(scale)
    sprite.x = this.screenW / 2
    sprite.y = this.screenH / 2
  }

  private async _placeGates(nodes: ShortcutNodeDef[]): Promise<void> {
    for (const node of nodes) {
      const wp = this.getWaypoint(node.stepIndex)
      if (!wp) continue
      const src =
        node.kind === 'forest'
          ? `${PROP_BASE}/gate_forest.png`
          : `${PROP_BASE}/gate_cave.png`
      try {
        const tex = await PIXI.Assets.load(src)
        const sprite = new PIXI.Sprite(tex)
        sprite.anchor.set(0.5, 1)
        sprite.scale.set(0.4)
        sprite.x = wp.x
        sprite.y = wp.y - 10
        this.world.addChild(sprite)
        this.gateSprites.set(node.id, sprite)
      } catch (e) {
        console.warn('NinjaClimbMountainManager: gate load failed', e)
      }
    }
  }

  public async setBarrierAtStep(stepIndex: number | null): Promise<void> {
    if (this.barrierSprite) {
      this.world.removeChild(this.barrierSprite)
      this.barrierSprite.destroy()
      this.barrierSprite = null
    }
    if (stepIndex == null) return
    const wp = this.getWaypoint(stepIndex)
    if (!wp) return
    try {
      const tex = await PIXI.Assets.load(`${PROP_BASE}/barrier.png`)
      this.barrierSprite = new PIXI.Sprite(tex)
      this.barrierSprite.anchor.set(0.5, 0.5)
      this.barrierSprite.scale.set(0.55)
      this.barrierSprite.x = wp.x
      this.barrierSprite.y = wp.y - 40
      this.world.addChild(this.barrierSprite)
    } catch (e) {
      console.warn('NinjaClimbMountainManager: barrier load failed', e)
    }
  }

  public shatterBarrier(): void {
    if (!this.barrierSprite) return
    const sprite = this.barrierSprite
    this.barrierSprite = null
    sprite.alpha = 0.3
    sprite.scale.set(sprite.scale.x * 1.25)
    setTimeout(() => {
      if (this.destroyed) return
      if (sprite.parent) sprite.parent.removeChild(sprite)
      sprite.destroy()
    }, 400)
  }

  public dimGate(nodeId: string): void {
    const sprite = this.gateSprites.get(nodeId)
    if (sprite) sprite.alpha = 0.35
  }

  public pulseNextStep(stepIndex: number | null): void {
    this.pulseStep = stepIndex
  }

  /**
   * Update camera target from climber world positions.
   * When `immediate` is true, snap instead of easing.
   */
  public setCameraTargets(
    positions: Array<{ x: number; y: number }>,
    immediate = false
  ): void {
    if (positions.length === 0) return
    const play = this.layoutManager.getPlayWindow(this.screenH)

    let minY = Infinity
    let maxY = -Infinity
    let sumX = 0
    let sumY = 0
    for (const p of positions) {
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
      sumX += p.x
      sumY += p.y
    }
    this.targetCameraX = sumX / positions.length
    this.targetCameraY = sumY / positions.length

    const spanY = Math.max(80, maxY - minY)
    const margin = 160
    // 1.3× fit so the ninjas read larger on screen.
    this.targetZoom = Math.max(0.45, Math.min(1.3, (play.height / (spanY + margin)) * 1.3))

    if (immediate) {
      this.cameraX = this.targetCameraX
      this.cameraY = this.targetCameraY
      this.cameraZoom = this.targetZoom
      this._applyCameraTransform()
    }
  }

  public update(deltaMs: number): void {
    // Ease camera
    const t = Math.min(1, (deltaMs / 16) * 0.08)
    this.cameraX += (this.targetCameraX - this.cameraX) * t
    this.cameraY += (this.targetCameraY - this.cameraY) * t
    this.cameraZoom += (this.targetZoom - this.cameraZoom) * t
    this._applyCameraTransform()

    this.pulseTime += deltaMs
    this._drawTrail()
  }

  private _applyCameraTransform(): void {
    const play = this.layoutManager.getPlayWindow(this.screenH)
    const midX = this.screenW / 2
    const midY = (play.top + play.bottom) / 2
    this.world.scale.set(this.cameraZoom)
    this.world.x = midX - this.cameraX * this.cameraZoom
    this.world.y = midY - this.cameraY * this.cameraZoom
  }

  private _drawTrail(): void {
    this.trailGraphics.clear()
    // Pulse the next painted pad. The pads themselves are in the cliff art.
    if (this.pulseStep != null) {
      const wp = this.getWaypoint(this.pulseStep)
      if (wp) {
        const pulse = 0.5 + 0.5 * Math.sin(this.pulseTime / 200)
        this.trailGraphics
          .circle(wp.x, wp.y - 8, 14 + pulse * 6)
          .stroke({ width: 3, color: 0xfbbf24, alpha: 0.4 + pulse * 0.4 })
      }
    }
  }

  private _onResize = (): void => {
    if (this.destroyed) return
    const { width, height } = this.pixiApp.getScreenSize()
    this.screenW = width
    this.screenH = height
    this.layoutManager.updateLayout(width, height)
    if (this.backdrop) this._coverScreen(this.backdrop)
    if (this.cloudFrame) this._coverScreen(this.cloudFrame)
    if (this.bushFrame) this._coverScreen(this.bushFrame)
    this._applyCameraTransform()
  }

  public destroy(): void {
    this.destroyed = true
    this.eventBus.off(ENGINE_EVENTS.RESIZED, this._onResize)
    this.view.destroy({ children: true })
  }
}
