import * as PIXI from 'pixi.js'
import { EventBus } from '@/lib/pixi-engine/core/EventBus'
import { ENGINE_EVENTS } from '@/lib/pixi-engine/core/EventTypes'
import type { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication'
import type { NinjaClimbLayoutManager } from './NinjaClimbLayoutManager'
import type { ShortcutNodeDef } from './NinjaClimbRaceManager'
import { buildPath, type Waypoint } from '../mountainPath'

const ASSET_BASE = '/images/ninja-climb'
const CLIFF_KEYS = ['cliff_a', 'cliff_b', 'cliff_c'] as const
const PLATEAU_KEYS = ['plateau_1', 'plateau_2', 'plateau_3'] as const

/**
 * Tiled switchback mountain trail with eased fit-zoom camera.
 */
export class NinjaClimbMountainManager {
  private view: PIXI.Container
  private world: PIXI.Container
  private skySprite: PIXI.Sprite | null = null
  private trailGraphics: PIXI.Graphics
  private cloudSprites: PIXI.Sprite[] = []
  private gateSprites: Map<string, PIXI.Sprite> = new Map()
  private barrierSprite: PIXI.Sprite | null = null
  private flagSprite: PIXI.Sprite | null = null
  private path: Waypoint[] = []
  private screenW = 0
  private screenH = 0
  private cameraX = 0
  private cameraY = 0
  private cameraZoom = 1
  private targetCameraX = 0
  private targetCameraY = 0
  private targetZoom = 1
  private cloudPhase = 0
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
    const layout = this.layoutManager.getLayoutParams()

    try {
      const skyTex = await PIXI.Assets.load(`${ASSET_BASE}/sky.webp`)
      this.skySprite = new PIXI.Sprite(skyTex)
      this.skySprite.width = width
      this.skySprite.height = height
      this.view.addChildAt(this.skySprite, 0)
    } catch {
      const g = new PIXI.Graphics()
      g.rect(0, 0, width, height).fill({ color: 0x87ceeb })
      this.view.addChildAt(g, 0)
    }

    // Ambient sky clouds (screen-space, not in world)
    for (let i = 1; i <= 3; i++) {
      try {
        const tex = await PIXI.Assets.load(`${ASSET_BASE}/cloud_${i}.png`)
        const cloud = new PIXI.Sprite(tex)
        cloud.anchor.set(0.5)
        cloud.scale.set(0.35 + i * 0.06)
        cloud.alpha = 0.7
        cloud.x = (width * i) / 4
        cloud.y = 30 + i * 28
        this.view.addChild(cloud)
        this.cloudSprites.push(cloud)
      } catch {
        /* optional */
      }
    }

    const worldBottomY = totalSteps * layout.stepHeight + 200
    this.path = buildPath({
      totalSteps,
      screenWidth: width,
      stepHeight: layout.stepHeight,
      stepsPerSection: layout.stepsPerSection,
      margin: layout.pathMargin,
      worldBottomY,
    })

    await this._buildSections()
    await this._placePlateaus()
    await this._placeDecorations()
    await this._placeGates(nodes)
    await this._placeFlag()

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

  private async _buildSections(): Promise<void> {
    if (this.path.length === 0) return
    const layout = this.layoutManager.getLayoutParams()
    const sectionCount = Math.ceil(this.path.length / layout.stepsPerSection)

    for (let s = 0; s < sectionCount; s++) {
      const isSummit = s === sectionCount - 1
      const key = isSummit
        ? 'summit'
        : CLIFF_KEYS[s % CLIFF_KEYS.length]
      try {
        const tex = await PIXI.Assets.load(`${ASSET_BASE}/${key}.webp`)
        const sprite = new PIXI.Sprite(tex)
        sprite.anchor.set(0.5, 0)

        const firstIdx = s * layout.stepsPerSection
        const lastIdx = Math.min(this.path.length - 1, firstIdx + layout.stepsPerSection - 1)
        const midY = (this.path[firstIdx].y + this.path[lastIdx].y) / 2
        const sectionHeight =
          Math.abs(this.path[firstIdx].y - this.path[lastIdx].y) + layout.stepHeight * 1.4

        sprite.width = this.screenW * 1.05
        sprite.height = Math.max(sectionHeight, layout.stepHeight * 2)
        sprite.x = this.screenW / 2
        sprite.y = midY - sprite.height * 0.35

        // Mirror odd sections
        if (s % 2 === 1 && !isSummit) {
          sprite.scale.x *= -1
        }

        this.world.addChildAt(sprite, 0)
      } catch (e) {
        console.warn('NinjaClimbMountainManager: cliff load failed', key, e)
      }
    }
  }

  private async _placePlateaus(): Promise<void> {
    for (let i = 0; i < this.path.length; i++) {
      const wp = this.path[i]
      const key = PLATEAU_KEYS[i % PLATEAU_KEYS.length]
      try {
        const tex = await PIXI.Assets.load(`${ASSET_BASE}/${key}.webp`)
        const sprite = new PIXI.Sprite(tex)
        sprite.anchor.set(0.5, 0.15)
        const charW = this.layoutManager.getLayoutParams().ninjaDisplaySize
        const targetW = i === this.path.length - 1 ? charW * 3.4 : charW * 2.9
        const scale = targetW / Math.max(1, tex.width)
        sprite.scale.set(scale)
        sprite.x = wp.x
        sprite.y = wp.y
        this.world.addChild(sprite)
      } catch (e) {
        console.warn('NinjaClimbMountainManager: plateau load failed', e)
      }
    }
  }

  private async _placeDecorations(): Promise<void> {
    const decoFiles = ['deco_tree.webp', 'deco_bush.webp', 'deco_hut.webp']
    for (let i = 0; i < this.path.length; i += 3) {
      if (i === 0 || i === this.path.length - 1) continue
      const wp = this.path[i]
      const file = decoFiles[i % decoFiles.length]
      try {
        const tex = await PIXI.Assets.load(`${ASSET_BASE}/${file}`)
        const sprite = new PIXI.Sprite(tex)
        sprite.anchor.set(0.5, 1)
        sprite.scale.set(0.35 + (i % 3) * 0.05)
        // Place beside the trail based on section direction
        const side = wp.dir === 1 ? -1 : 1
        sprite.x = wp.x + side * 90
        sprite.y = wp.y + 8
        sprite.alpha = 0.95
        this.world.addChild(sprite)
      } catch {
        /* optional */
      }
    }
  }

  private async _placeGates(nodes: ShortcutNodeDef[]): Promise<void> {
    for (const node of nodes) {
      const wp = this.getWaypoint(node.stepIndex)
      if (!wp) continue
      const src =
        node.kind === 'forest'
          ? `${ASSET_BASE}/gate_forest.png`
          : `${ASSET_BASE}/gate_cave.png`
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

  private async _placeFlag(): Promise<void> {
    const summit = this.path[this.path.length - 1]
    if (!summit) return
    try {
      const tex = await PIXI.Assets.load(`${ASSET_BASE}/flag_summit.png`)
      this.flagSprite = new PIXI.Sprite(tex)
      this.flagSprite.anchor.set(0.5, 1)
      this.flagSprite.scale.set(0.45)
      this.flagSprite.x = summit.x
      this.flagSprite.y = summit.y - 20
      this.world.addChild(this.flagSprite)
    } catch (e) {
      console.warn('NinjaClimbMountainManager: flag load failed', e)
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
      const tex = await PIXI.Assets.load(`${ASSET_BASE}/barrier.png`)
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
    this.targetZoom = Math.max(0.45, Math.min(1, play.height / (spanY + margin)))

    if (immediate) {
      this.cameraX = this.targetCameraX
      this.cameraY = this.targetCameraY
      this.cameraZoom = this.targetZoom
      this._applyCameraTransform()
    }
  }

  public update(deltaMs: number): void {
    this.cloudPhase += deltaMs * 0.02
    for (let i = 0; i < this.cloudSprites.length; i++) {
      const cloud = this.cloudSprites[i]
      cloud.x += (0.12 + i * 0.04) * (deltaMs / 16)
      if (cloud.x > this.screenW + 80) cloud.x = -80
      cloud.y += Math.sin(this.cloudPhase + i) * 0.04
    }

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
    if (this.path.length < 2) return

    // Dotted polyline
    for (let i = 1; i < this.path.length; i++) {
      const a = this.path[i - 1]
      const b = this.path[i]
      this.trailGraphics.moveTo(a.x, a.y - 6)
      this.trailGraphics.lineTo(b.x, b.y - 6)
    }
    this.trailGraphics.stroke({ width: 3, color: 0xffffff, alpha: 0.35 })

    // Pulse next ledge
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
    if (this.skySprite) {
      this.skySprite.width = width
      this.skySprite.height = height
    }
    this._applyCameraTransform()
  }

  public destroy(): void {
    this.destroyed = true
    this.eventBus.off(ENGINE_EVENTS.RESIZED, this._onResize)
    this.view.destroy({ children: true })
  }
}
