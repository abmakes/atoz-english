import * as THREE from 'three'
import type { TugNinjaClip, TugSide } from './tugOfWarLogic'
import { TUG_NINJA_CLIPS } from './tugOfWarLogic'
import { createCutoutMaterial } from './tugMaterials'
import { TUG_NINJA_SPRITE, tugNinjaPx } from './tugStageLayout'

export type { TugNinjaClip }

export type TugNinjaPose = 'pull' | 'cheer' | 'fallen'

export type TugNinjaTextures = Record<TugNinjaPose, THREE.Texture>

/**
 * One sampled moment of a clip. Distances are in world units at sprite scale
 * 1 and signed toward the rope centre (the ninja's facing direction).
 */
interface ClipState {
  pose: TugNinjaPose
  /** Horizontal shear of the sprite top; negative leans away from the rope. */
  lean: number
  shift: number
  lift: number
  squash: number
  wobble: number
}

interface ClipDefinition {
  durationMs: number
  loop: boolean
  holdAfter?: boolean
  sample(t: number, phase: number): ClipState
}

const TAU = Math.PI * 2
const IDLE_LEAN = -0.1

function ease(t: number): number {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}

function pulse(t: number, peak: number): number {
  return t < peak ? ease(t / peak) : 1 - ease((t - peak) / (1 - peak))
}

function state(partial: Partial<ClipState>): ClipState {
  return {
    pose: 'pull',
    lean: IDLE_LEAN,
    shift: 0,
    lift: 0,
    squash: 0,
    wobble: 0,
    ...partial,
  }
}

const CLIPS: Record<TugNinjaClip, ClipDefinition> = {
  idle_hold: {
    durationMs: 1800,
    loop: true,
    sample: (t, phase) =>
      state({ lean: IDLE_LEAN + 0.035 * Math.sin(TAU * t + phase) }),
  },
  pull_heave: {
    durationMs: 720,
    loop: false,
    sample: (t) => {
      const p = pulse(t, 0.35)
      return state({ lean: IDLE_LEAN - 0.26 * p, shift: -0.14 * p })
    },
  },
  strain_lose: {
    durationMs: 900,
    loop: true,
    sample: (t, phase) =>
      state({
        lean: 0.12 + 0.05 * Math.sin(TAU * t + phase),
        shift: 0.012 * Math.sin(TAU * 11 * t),
      }),
  },
  stumble_slip: {
    durationMs: 900,
    loop: false,
    sample: (t) => {
      const p = pulse(t, 0.3)
      return state({
        lean: IDLE_LEAN + 0.4 * p,
        shift: 0.2 * p,
        lift: -0.03 * p,
      })
    },
  },
  victory_cheer: {
    durationMs: 1100,
    loop: true,
    sample: (t, phase) => {
      const hop = t < 0.7 ? 4 * (t / 0.7) * (1 - t / 0.7) : 0
      const land = t >= 0.7 ? Math.sin(((t - 0.7) / 0.3) * Math.PI) : 0
      return state({
        pose: 'cheer',
        lean: 0,
        lift: 0.42 * hop,
        squash: -0.07 * land,
        wobble: 0.06 * Math.sin(TAU * t + phase),
      })
    },
  },
  defeat_fall: {
    durationMs: 1100,
    loop: false,
    holdAfter: true,
    sample: (t) => {
      if (t < 0.25) {
        const p = ease(t / 0.25)
        return state({ lean: IDLE_LEAN + 0.5 * p, shift: 0.26 * p })
      }
      const f = (t - 0.25) / 0.75
      const bounce = f < 0.45 ? Math.sin((f / 0.45) * Math.PI) : 0
      const land = f >= 0.45 && f < 0.7 ? Math.sin(((f - 0.45) / 0.25) * Math.PI) : 0
      return state({
        pose: 'fallen',
        lean: 0,
        shift: 0.26 + 0.12 * ease(f),
        lift: 0.14 * bounce,
        squash: -0.06 * land,
      })
    },
  },
  charge_up: {
    durationMs: 700,
    loop: true,
    sample: (t, phase) =>
      state({
        lean: -0.2 + 0.05 * Math.sin(TAU * t + phase),
        shift: -0.03 * Math.sin(TAU * t + phase),
      }),
  },
}

const SHADOW_BY_POSE: Record<TugNinjaPose, { x: number; width: number }> = {
  pull: { x: 0.12, width: 1.8 },
  cheer: { x: 0.02, width: 1.05 },
  fallen: { x: 0.18, width: 1.95 },
}

export interface NinjaActorOptions {
  side: TugSide
  slot: number
  textures: TugNinjaTextures
  /** World X of the ninja's rest position. */
  restX: number
  baselineY?: number
  spriteScale?: number
  shadowTexture?: THREE.Texture
  renderOrder?: number
}

/**
 * Illustrated ninja sprite. Pose clips keep the names from the GLB animation
 * contract in TUG_OF_WAR_NINJA_ASSET_SPEC.md so a later rigged-model swap can
 * reuse the same `play()` calls. Leans are horizontal shears anchored at the
 * feet, which keeps the painted rope in the hands level with the scene rope.
 */
export class NinjaActor {
  public readonly group = new THREE.Group()
  public readonly side: TugSide
  public readonly slot: number
  public restX: number

  private readonly facing: 1 | -1
  private readonly textures: TugNinjaTextures
  private readonly geometry: THREE.PlaneGeometry
  private readonly material: THREE.MeshBasicMaterial
  private readonly body: THREE.Mesh
  private readonly shadow: THREE.Mesh | null
  private readonly phase: number
  private playing: { name: TugNinjaClip; elapsed: number } | null = null
  private queuedIdle = false
  private spriteScale: number
  private baselineY: number
  private worldX: number
  private pose: TugNinjaPose = 'pull'

  constructor(options: NinjaActorOptions) {
    this.side = options.side
    this.slot = options.slot
    this.restX = options.restX
    this.worldX = options.restX
    this.textures = options.textures
    this.facing = options.side === 'blue' ? 1 : -1
    this.spriteScale = options.spriteScale ?? 1
    this.baselineY = options.baselineY ?? 0
    this.phase = options.slot * 1.1 + (options.side === 'red' ? 0.6 : 0)
    this.group.name = `ninja-${options.side}-${options.slot}`

    this.geometry = new THREE.PlaneGeometry(1, 1)
    this.material = createCutoutMaterial(options.textures.pull)
    this.body = new THREE.Mesh(this.geometry, this.material)
    this.body.name = 'ninja-sprite'
    this.body.renderOrder = options.renderOrder ?? 10
    this.group.add(this.body)

    if (options.shadowTexture) {
      this.shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        createCutoutMaterial(options.shadowTexture)
      )
      this.shadow.name = 'ninja-shadow'
      this.shadow.renderOrder = 2
      this.group.add(this.shadow)
    } else {
      this.shadow = null
    }

    this.play('idle_hold')
  }

  public play(clip: TugNinjaClip): void {
    const definition = CLIPS[clip]
    this.playing = { name: clip, elapsed: 0 }
    this.queuedIdle = !definition.loop && !definition.holdAfter
    this._apply(definition.sample(0, this.phase))
  }

  public get currentClip(): TugNinjaClip | null {
    return this.playing?.name ?? null
  }

  public get currentPose(): TugNinjaPose {
    return this.pose
  }

  public update(deltaMs: number): void {
    if (!this.playing) return
    const definition = CLIPS[this.playing.name]
    this.playing.elapsed += deltaMs
    let t = this.playing.elapsed / definition.durationMs
    if (definition.loop) {
      t %= 1
      this.playing.elapsed = t * definition.durationMs
    } else if (t >= 1) {
      this._apply(definition.sample(1, this.phase))
      if (this.queuedIdle) this.play('idle_hold')
      return
    }
    this._apply(definition.sample(t, this.phase))
  }

  public setWorldX(x: number): void {
    this.worldX = x
    this.group.position.x = x
  }

  public setLayout(layout: {
    restX: number
    spriteScale: number
    baselineY: number
  }): void {
    this.restX = layout.restX
    this.spriteScale = layout.spriteScale
    this.baselineY = layout.baselineY
    if (this.playing) {
      const definition = CLIPS[this.playing.name]
      const t = Math.min(1, this.playing.elapsed / definition.durationMs)
      this._apply(definition.sample(t, this.phase))
    }
  }

  public dispose(): void {
    this.playing = null
  }

  private _apply(clip: ClipState): void {
    if (clip.pose !== this.pose) {
      this.pose = clip.pose
      this.material.map = this.textures[clip.pose]
      this.material.needsUpdate = true
    }

    const s = this.spriteScale
    const width = tugNinjaPx(TUG_NINJA_SPRITE.canvasWidthPx, s)
    const height = tugNinjaPx(TUG_NINJA_SPRITE.canvasHeightPx, s)
    const left = -tugNinjaPx(TUG_NINJA_SPRITE.anchorXPx, s)
    const bottom = -tugNinjaPx(
      TUG_NINJA_SPRITE.canvasHeightPx - TUG_NINJA_SPRITE.baselineYPx,
      s
    )
    const top = bottom + height
    const shear = clip.lean * this.facing * s
    const position = this.geometry.attributes.position as THREE.BufferAttribute
    // PlaneGeometry vertex order: top-left, top-right, bottom-left, bottom-right.
    position.setXYZ(0, left + shear, top, 0)
    position.setXYZ(1, left + width + shear, top, 0)
    position.setXYZ(2, left, bottom, 0)
    position.setXYZ(3, left + width, bottom, 0)
    position.needsUpdate = true
    this.geometry.computeBoundingSphere()

    this.body.position.set(clip.shift * this.facing * s, clip.lift * s, 0)
    this.body.scale.set(1 - clip.squash * 0.5, 1 + clip.squash, 1)
    this.body.rotation.z = -clip.wobble * this.facing

    if (this.shadow) {
      const spec = SHADOW_BY_POSE[clip.pose]
      const airborne = Math.max(0.55, 1 - clip.lift * 0.9)
      this.shadow.position.set(
        (spec.x + clip.shift) * this.facing * s,
        -0.02 * s,
        -0.001
      )
      this.shadow.scale.set(spec.width * s * airborne, 0.32 * s * airborne, 1)
    }

    this.group.position.set(this.worldX, this.baselineY, this.group.position.z)
  }
}

export function isTugNinjaClip(value: string): value is TugNinjaClip {
  return (TUG_NINJA_CLIPS as readonly string[]).includes(value)
}
