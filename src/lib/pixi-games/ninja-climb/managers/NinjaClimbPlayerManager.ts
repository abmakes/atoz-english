import * as PIXI from 'pixi.js'
import type { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication'
import type { NinjaClimbLayoutManager } from './NinjaClimbLayoutManager'
import type { NinjaClimbMountainManager } from './NinjaClimbMountainManager'
import type { NinjaPowerupId } from '../ninjaPowerups'
import { layoutOccupants, type OccupantPlacement } from '../plateauSlots'

const ASSET_BASE = '/images/ninja-climb'

export type NinjaTeamColor = 'blue' | 'red'
export type NinjaAnimState = 'idle' | 'climb' | 'teleport' | 'rope' | 'smoke' | 'cheer'

interface SpriteSheet {
  texture: PIXI.Texture
  frameWidth: number
  frameHeight: number
  totalFrames: number
}

interface HopState {
  fromX: number
  fromY: number
  toX: number
  toY: number
  elapsed: number
  duration: number
  onComplete?: () => void
}

interface NinjaActor {
  teamId: string
  teamIndex: number
  color: NinjaTeamColor
  container: PIXI.Container
  sprite: PIXI.Sprite
  highlight: PIXI.Graphics
  idleSheets: [SpriteSheet | null, SpriteSheet | null]
  climbSheet: SpriteSheet | null
  actionTextures: Partial<Record<NinjaPowerupId | 'cheer', PIXI.Texture>>
  animState: NinjaAnimState
  animFrame: number
  animTimer: number
  phaseOffsetMs: number
  poseVariant: 0 | 1
  stepIndex: number
  facing: 1 | -1
  hop: HopState | null
  actionUntilMs: number
  baseScale: number
}

/**
 * Ninjas that hop between waypoints with occupancy placement.
 */
export class NinjaClimbPlayerManager {
  private actors: NinjaActor[] = []
  private elapsedMs = 0
  private destroyed = false
  private readonly IDLE_SPEED = 420
  private readonly CLIMB_SPEED = 90
  private readonly HOP_DURATION = 380

  constructor(
    private pixiApp: PixiApplication,
    private layoutManager: NinjaClimbLayoutManager,
    private mountainManager: NinjaClimbMountainManager
  ) {}

  public async initializePlayers(
    teams: Array<{ id: string; name: string }>
  ): Promise<void> {
    const colors: NinjaTeamColor[] = ['blue', 'red']
    const size = this.layoutManager.getLayoutParams().ninjaDisplaySize

    for (let i = 0; i < Math.min(4, teams.length); i++) {
      const color = colors[i % colors.length]
      const team = teams[i]

      const idleA = await this._loadSheet(`${ASSET_BASE}/ninja_${color}_idle.png`, 2)
      const idleB = await this._loadSheet(`${ASSET_BASE}/ninja_${color}_idle_b.png`, 2)
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
      const highlight = new PIXI.Graphics()
      highlight
        .circle(0, -size * 0.55, size * 0.55)
        .fill({ color: 0xfbbf24, alpha: 0.0 })
      const sprite = new PIXI.Sprite()
      sprite.anchor.set(0.5, 1)

      const sheet = idleA
      if (sheet) {
        this._setFrame(sprite, sheet, 0)
        const scale = size / sheet.frameHeight
        sprite.scale.set(scale)
      }

      container.addChild(highlight)
      container.addChild(sprite)

      const actor: NinjaActor = {
        teamId: team.id,
        teamIndex: i,
        color,
        container,
        sprite,
        highlight,
        idleSheets: [idleA, idleB],
        climbSheet,
        actionTextures,
        animState: 'idle',
        animFrame: 0,
        animTimer: 0,
        phaseOffsetMs: 0,
        poseVariant: 0,
        stepIndex: 0,
        facing: 1,
        hop: null,
        actionUntilMs: 0,
        baseScale: size / (idleA?.frameHeight ?? size),
      }
      this.actors.push(actor)
    }

    this.recomputeOccupancy()
    this._snapAllToSteps()
  }

  public attachToWorld(world: PIXI.Container): void {
    for (const actor of this.actors) {
      if (actor.container.parent) actor.container.parent.removeChild(actor.container)
      world.addChild(actor.container)
    }
  }

  public getWorldPositions(): Array<{ teamId: string; x: number; y: number }> {
    return this.actors.map((a) => ({
      teamId: a.teamId,
      x: a.container.x,
      y: a.container.y,
    }))
  }

  public getStepIndex(teamId: string): number {
    return this.actors.find((a) => a.teamId === teamId)?.stepIndex ?? 0
  }

  /**
   * Set step for a team and hop there. Recomputes occupancy for affected ledges.
   * Resolves when the hop finishes (or immediately if not animating).
   */
  public setStepIndex(
    teamId: string,
    stepIndex: number,
    animate = true
  ): Promise<void> {
    const actor = this.actors.find((a) => a.teamId === teamId)
    if (!actor) return Promise.resolve()
    const prev = actor.stepIndex
    actor.stepIndex = Math.max(0, stepIndex)

    const wp = this.mountainManager.getWaypoint(actor.stepIndex)
    if (wp) {
      actor.facing = wp.dir
      actor.sprite.scale.x = Math.abs(actor.sprite.scale.x) * actor.facing
    }

    this.recomputeOccupancy()
    // Slide any non-hopping neighbours into their new slots immediately
    for (const other of this.actors) {
      if (other === actor || other.hop) continue
      if (other.stepIndex === prev || other.stepIndex === actor.stepIndex) {
        this._applyPlacement(other)
      }
    }

    if (!animate || !wp) {
      this._applyPlacement(actor)
      return Promise.resolve()
    }

    const placement = this._placementFor(actor)
    const toX = wp.x + (placement?.dx ?? 0)
    const toY = wp.y + (placement?.dy ?? 0)
    return new Promise((resolve) => {
      actor.hop = {
        fromX: actor.container.x,
        fromY: actor.container.y,
        toX,
        toY,
        elapsed: 0,
        duration:
          this.HOP_DURATION *
          Math.max(1, Math.min(3, Math.abs(actor.stepIndex - prev))),
        onComplete: resolve,
      }
      actor.animState = 'climb'
    })
  }

  public setActiveTeam(teamId: string | null): void {
    for (const actor of this.actors) {
      const active = actor.teamId === teamId
      actor.highlight.clear()
      if (active) {
        const size = this.layoutManager.getLayoutParams().ninjaDisplaySize
        actor.highlight
          .circle(0, -size * 0.55, size * 0.55)
          .fill({ color: 0xfbbf24, alpha: 0.22 })
        actor.container.scale.set(1.08)
      } else {
        actor.container.scale.set(1)
      }
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
      actor.sprite.scale.set(scale * actor.facing, scale)
    }
    actor.animState = action === 'cheer' ? 'cheer' : action
    actor.actionUntilMs = this.elapsedMs + durationMs
  }

  public celebrate(teamId: string): void {
    this.playAction(teamId, 'cheer', 10_000)
  }

  public recomputeOccupancy(): void {
    const byStep = new Map<number, NinjaActor[]>()
    for (const actor of this.actors) {
      const list = byStep.get(actor.stepIndex) ?? []
      list.push(actor)
      byStep.set(actor.stepIndex, list)
    }

    const charW = this.layoutManager.getLayoutParams().ninjaDisplaySize
    for (const [, occupants] of byStep) {
      // Stable team index order
      occupants.sort((a, b) => a.teamIndex - b.teamIndex)
      const placements = layoutOccupants(occupants.length, charW)
      occupants.forEach((actor, i) => {
        const p = placements[i]
        actor.poseVariant = p.poseVariant
        actor.phaseOffsetMs = p.phaseOffsetMs
        actor.container.zIndex = p.zIndex
        // Store placement on container for _applyPlacement
        ;(actor as NinjaActor & { _placement?: OccupantPlacement })._placement = p
      })
    }

    // Ensure parent sorts by zIndex
    const world = this.mountainManager.getWorld()
    world.sortableChildren = true
  }

  public update(deltaMs: number): void {
    if (this.destroyed) return
    this.elapsedMs += deltaMs

    for (const actor of this.actors) {
      if (actor.hop) {
        actor.hop.elapsed += deltaMs
        const t = Math.min(1, actor.hop.elapsed / actor.hop.duration)
        const ease = t * (2 - t)
        const arc = Math.sin(Math.PI * t) * 36
        actor.container.x = actor.hop.fromX + (actor.hop.toX - actor.hop.fromX) * ease
        actor.container.y =
          actor.hop.fromY + (actor.hop.toY - actor.hop.fromY) * ease - arc
        this._tickStrip(actor, 'climb', deltaMs)
        if (t >= 1) {
          const done = actor.hop.onComplete
          actor.hop = null
          this._applyPlacement(actor)
          done?.()
        }
      } else if (actor.actionUntilMs > this.elapsedMs) {
        // hold action pose
      } else {
        this._tickStrip(actor, 'idle', deltaMs)
      }
    }
  }

  private _placementFor(actor: NinjaActor): OccupantPlacement | undefined {
    return (actor as NinjaActor & { _placement?: OccupantPlacement })._placement
  }

  private _applyPlacement(actor: NinjaActor): void {
    const wp = this.mountainManager.getWaypoint(actor.stepIndex)
    if (!wp) return
    const p = this._placementFor(actor)
    actor.container.x = wp.x + (p?.dx ?? 0)
    actor.container.y = wp.y + (p?.dy ?? 0)
    if (p) {
      actor.container.scale.set(p.scale * (actor.teamId ? 1 : 1))
      // Keep active-team scale if highlighted — setActiveTeam handles that
    }
  }

  private _snapAllToSteps(): void {
    this.recomputeOccupancy()
    for (const actor of this.actors) {
      this._applyPlacement(actor)
    }
  }

  private _tickStrip(actor: NinjaActor, state: 'idle' | 'climb', deltaMs: number): void {
    const sheet =
      state === 'idle'
        ? actor.idleSheets[actor.poseVariant] ?? actor.idleSheets[0]
        : actor.climbSheet
    if (!sheet) return

    if (actor.animState !== state) {
      actor.animState = state
      actor.animFrame = 0
      actor.animTimer = actor.phaseOffsetMs % (state === 'idle' ? this.IDLE_SPEED : this.CLIMB_SPEED)
    }

    const speed = state === 'idle' ? this.IDLE_SPEED : this.CLIMB_SPEED
    actor.animTimer += deltaMs
    if (actor.animTimer >= speed) {
      actor.animTimer = 0
      actor.animFrame = (actor.animFrame + 1) % sheet.totalFrames
      this._setFrame(actor.sprite, sheet, actor.animFrame)
      const size = this.layoutManager.getLayoutParams().ninjaDisplaySize
      const scale = (size / sheet.frameHeight) * (this._placementFor(actor)?.scale ?? 1)
      actor.sprite.scale.set(scale * actor.facing, scale)
    }
  }

  private async _loadSheet(path: string, expectedFrames: number): Promise<SpriteSheet | null> {
    try {
      const texture = await PIXI.Assets.load(path)
      const frameWidth = texture.width / expectedFrames
      const frameHeight = texture.height
      return { texture, frameWidth, frameHeight, totalFrames: expectedFrames }
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
  }
}
