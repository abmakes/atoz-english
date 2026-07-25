import * as PIXI from 'pixi.js'
import type { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication'
import type { NinjaClimbLayoutManager } from './NinjaClimbLayoutManager'
import type { NinjaClimbMountainManager } from './NinjaClimbMountainManager'
import type { NinjaPowerupId } from '../ninjaPowerups'

const ASSET_BASE = '/images/ninja-climb'

export type NinjaTeamColor = 'blue' | 'red'
export type NinjaAnimState = 'idle' | 'climb' | 'teleport' | 'rope' | 'smoke' | 'cheer'

interface SpriteSheet {
  texture: PIXI.Texture
  frameWidth: number
  frameHeight: number
  totalFrames: number
}

interface NinjaActor {
  teamId: string
  color: NinjaTeamColor
  lane: 'left' | 'right'
  container: PIXI.Container
  sprite: PIXI.Sprite
  idleSheet: SpriteSheet | null
  climbSheet: SpriteSheet | null
  actionTextures: Partial<Record<NinjaPowerupId | 'cheer', PIXI.Texture>>
  animState: NinjaAnimState
  animFrame: number
  animTimer: number
  targetWorldY: number
  currentWorldY: number
  climbUntilMs: number
  actionUntilMs: number
}

/**
 * Two ninja climbers with strip-frame idle/climb animation and one-shot action poses.
 */
export class NinjaClimbPlayerManager {
  private view: PIXI.Container
  private actors: NinjaActor[] = []
  private elapsedMs = 0
  private destroyed = false
  private readonly IDLE_SPEED = 420
  private readonly CLIMB_SPEED = 90
  private readonly MOVE_LERP = 0.08

  constructor(
    private pixiApp: PixiApplication,
    private layoutManager: NinjaClimbLayoutManager,
    private mountainManager: NinjaClimbMountainManager
  ) {
    this.view = new PIXI.Container()
  }

  public getView(): PIXI.Container {
    return this.view
  }

  public async initializePlayers(
    teams: Array<{ id: string; name: string }>
  ): Promise<void> {
    const colors: NinjaTeamColor[] = ['blue', 'red']
    const lanes: Array<'left' | 'right'> = ['left', 'right']

    for (let i = 0; i < Math.min(2, teams.length); i++) {
      const color = colors[i]
      const lane = lanes[i]
      const team = teams[i]

      const idleSheet = await this._loadSheet(`${ASSET_BASE}/ninja_${color}_idle.png`, 2)
      const climbSheet = await this._loadSheet(`${ASSET_BASE}/ninja_${color}_climb.png`, 4)

      const actionTextures: NinjaActor['actionTextures'] = {}
      for (const action of ['teleport', 'rope', 'smoke', 'cheer'] as const) {
        try {
          actionTextures[action] = await PIXI.Assets.load(
            `${ASSET_BASE}/ninja_${color}_${action}.png`
          )
        } catch (e) {
          console.warn(`NinjaClimbPlayerManager: missing ${color} ${action}`, e)
        }
      }

      const container = new PIXI.Container()
      const sprite = new PIXI.Sprite()
      sprite.anchor.set(0.5, 1)

      const size = this.layoutManager.getLayoutParams().ninjaDisplaySize
      if (idleSheet) {
        this._setFrame(sprite, idleSheet, 0)
        const scale = size / idleSheet.frameHeight
        sprite.scale.set(scale)
      }

      container.addChild(sprite)
      this.view.addChild(container)

      const track = this.mountainManager.getTrackBounds()
      const actor: NinjaActor = {
        teamId: team.id,
        color,
        lane,
        container,
        sprite,
        idleSheet,
        climbSheet,
        actionTextures,
        animState: 'idle',
        animFrame: 0,
        animTimer: 0,
        targetWorldY: track.bottomY,
        currentWorldY: track.bottomY,
        climbUntilMs: 0,
        actionUntilMs: 0,
      }
      this.actors.push(actor)
      this._positionActor(actor)
    }
  }

  public getLaneForTeam(teamId: string): 'left' | 'right' | null {
    return this.actors.find((a) => a.teamId === teamId)?.lane ?? null
  }

  public getColorForTeam(teamId: string): NinjaTeamColor | null {
    return this.actors.find((a) => a.teamId === teamId)?.color ?? null
  }

  public setHeightFraction(teamId: string, fraction: number, animate = true): void {
    const actor = this.actors.find((a) => a.teamId === teamId)
    if (!actor) return
    const y = this.mountainManager.fractionToWorldY(fraction)
    actor.targetWorldY = y
    if (!animate) {
      actor.currentWorldY = y
      this._positionActor(actor)
    } else {
      actor.animState = 'climb'
      actor.climbUntilMs = this.elapsedMs + 900
    }
  }

  public playAction(teamId: string, action: NinjaPowerupId | 'cheer', durationMs = 900): void {
    const actor = this.actors.find((a) => a.teamId === teamId)
    if (!actor) return
    const tex = actor.actionTextures[action]
    if (tex) {
      actor.sprite.texture = tex
      const size = this.layoutManager.getLayoutParams().ninjaDisplaySize
      const scale = size / Math.max(tex.height, 1)
      actor.sprite.scale.set(scale)
    }
    actor.animState = action === 'cheer' ? 'cheer' : action
    actor.actionUntilMs = this.elapsedMs + durationMs
  }

  public celebrate(teamId: string): void {
    this.playAction(teamId, 'cheer', 10_000)
  }

  public update(deltaMs: number): void {
    if (this.destroyed) return
    this.elapsedMs += deltaMs

    for (const actor of this.actors) {
      // Lerp toward target height
      const dy = actor.targetWorldY - actor.currentWorldY
      if (Math.abs(dy) > 0.5) {
        actor.currentWorldY += dy * Math.min(1, this.MOVE_LERP * (deltaMs / 16) * 4)
      } else {
        actor.currentWorldY = actor.targetWorldY
      }

      if (actor.actionUntilMs > this.elapsedMs) {
        // hold action pose
      } else if (actor.climbUntilMs > this.elapsedMs || Math.abs(dy) > 2) {
        this._tickStrip(actor, 'climb', deltaMs)
      } else {
        this._tickStrip(actor, 'idle', deltaMs)
      }

      this._positionActor(actor)
    }
  }

  private _positionActor(actor: NinjaActor): void {
    const lanes = this.mountainManager.getLaneXs()
    actor.container.x = actor.lane === 'left' ? lanes.left : lanes.right
    // Actors live in the mountain world container via parenting — set world Y
    actor.container.y = actor.currentWorldY
  }

  /** Reparent sprites into the mountain world so they scroll with the camera. */
  public attachToWorld(world: PIXI.Container): void {
    for (const actor of this.actors) {
      if (actor.container.parent) actor.container.parent.removeChild(actor.container)
      world.addChild(actor.container)
    }
  }

  private _tickStrip(actor: NinjaActor, state: 'idle' | 'climb', deltaMs: number): void {
    const sheet = state === 'idle' ? actor.idleSheet : actor.climbSheet
    if (!sheet) return

    if (actor.animState !== state) {
      actor.animState = state
      actor.animFrame = 0
      actor.animTimer = 0
    }

    const speed = state === 'idle' ? this.IDLE_SPEED : this.CLIMB_SPEED
    actor.animTimer += deltaMs
    if (actor.animTimer >= speed) {
      actor.animTimer = 0
      actor.animFrame = (actor.animFrame + 1) % sheet.totalFrames
      this._setFrame(actor.sprite, sheet, actor.animFrame)
      const size = this.layoutManager.getLayoutParams().ninjaDisplaySize
      actor.sprite.scale.set(size / sheet.frameHeight)
    }
  }

  private async _loadSheet(path: string, expectedFrames: number): Promise<SpriteSheet | null> {
    try {
      const texture = await PIXI.Assets.load(path)
      const totalFrames = expectedFrames
      const frameWidth = texture.width / totalFrames
      const frameHeight = texture.height
      return { texture, frameWidth, frameHeight, totalFrames }
    } catch (e) {
      console.warn('NinjaClimbPlayerManager: sheet load failed', path, e)
      return null
    }
  }

  private _setFrame(sprite: PIXI.Sprite, sheet: SpriteSheet, frameIndex: number): void {
    const frameX = frameIndex * sheet.frameWidth
    const frameTexture = new PIXI.Texture({
      source: sheet.texture.source,
      frame: new PIXI.Rectangle(frameX, 0, sheet.frameWidth, sheet.frameHeight),
    })
    sprite.texture = frameTexture
  }

  public destroy(): void {
    this.destroyed = true
    for (const actor of this.actors) {
      actor.container.destroy({ children: true })
    }
    this.actors = []
    this.view.destroy({ children: true })
  }
}
