import * as THREE from 'three'
import type { TugNinjaClip, TugSide } from './tugOfWarLogic'
import { TUG_NINJA_CLIPS } from './tugOfWarLogic'

export type { TugNinjaClip }

interface BonePose {
  px?: number
  py?: number
  pz?: number
  rx?: number
  ry?: number
  rz?: number
}

type BoneName =
  | 'hips'
  | 'torso'
  | 'head'
  | 'armL'
  | 'armR'
  | 'foreL'
  | 'foreR'
  | 'legL'
  | 'legR'
  | 'shinL'
  | 'shinR'
  | 'tailL'
  | 'tailR'

type Pose = Partial<Record<BoneName, BonePose>>

interface ClipKeyframe {
  t: number
  pose: Pose
  rootY?: number
}

interface ClipDefinition {
  durationMs: number
  loop: boolean
  holdAfter?: boolean
  frames: ClipKeyframe[]
}

interface PlayingClip {
  name: TugNinjaClip
  elapsed: number
  definition: ClipDefinition
}

const TEAM_COLORS: Record<
  TugSide,
  { gi: number; wrap: number; pants: number; band: number; trim: number }
> = {
  blue: {
    gi: 0x1e4e8c,
    wrap: 0x163b6b,
    pants: 0x0f2746,
    band: 0x2b6cb0,
    trim: 0x90cdf4,
  },
  red: {
    gi: 0x9b1c1c,
    wrap: 0x7b1414,
    pants: 0x4a0d0d,
    band: 0xc53030,
    trim: 0xfbd38d,
  },
}

const MASK = 0x1a202c
const EYE = 0xf7fafc
const ROPE_TAN = 0xc4a574

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function mixPose(a: Pose, b: Pose, t: number): Pose {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<BoneName>
  const out: Pose = {}
  keys.forEach((key) => {
    const from = a[key] ?? {}
    const to = b[key] ?? {}
    out[key] = {
      px: lerp(from.px ?? 0, to.px ?? 0, t),
      py: lerp(from.py ?? 0, to.py ?? 0, t),
      pz: lerp(from.pz ?? 0, to.pz ?? 0, t),
      rx: lerp(from.rx ?? 0, to.rx ?? 0, t),
      ry: lerp(from.ry ?? 0, to.ry ?? 0, t),
      rz: lerp(from.rz ?? 0, to.rz ?? 0, t),
    }
  })
  return out
}

const IDLE: Pose = {
  hips: { py: 0.02, rz: 0.22 },
  torso: { rz: 0.04 },
  head: { rz: -0.08 },
  armR: { rz: -0.55, rx: 0.08 },
  foreR: { rz: -0.15 },
  armL: { rz: -0.95, rx: -0.12 },
  foreL: { rz: -0.55 },
  legR: { rz: 0.35, rx: 0.08 },
  shinR: { rz: 0.55 },
  legL: { rz: 0.55, rx: -0.1 },
  shinL: { rz: 0.4 },
  tailL: { rz: 0.35 },
  tailR: { rz: -0.2 },
}

const HEAVE: Pose = {
  hips: { px: -0.08, py: -0.06, rz: 0.55 },
  torso: { rz: 0.12 },
  head: { rz: -0.18 },
  armR: { rz: -0.15 },
  foreR: { rz: -0.45 },
  armL: { rz: -0.35 },
  foreL: { rz: -0.7 },
  legR: { rz: 0.5, rx: 0.12 },
  shinR: { rz: 0.7 },
  legL: { px: -0.08, rz: 0.72, rx: -0.14 },
  shinL: { rz: 0.35 },
  tailL: { rz: 0.9 },
  tailR: { rz: 0.55 },
}

const STRAIN: Pose = {
  hips: { px: 0.06, py: 0.04, rz: -0.22 },
  torso: { rz: -0.18 },
  head: { rz: -0.28 },
  armR: { rz: -1.05 },
  foreR: { rz: -0.05 },
  armL: { rz: -1.15 },
  foreL: { rz: -0.08 },
  legR: { rz: 0.18, rx: 0.16 },
  shinR: { rz: 0.35 },
  legL: { rz: 0.28, rx: -0.18 },
  shinL: { rz: 0.22 },
  tailL: { rz: -0.4 },
  tailR: { rz: -0.55 },
}

const SLIP: Pose = {
  hips: { px: 0.1, py: -0.04, rz: -0.05, ry: 0.25 },
  torso: { rz: -0.12, ry: 0.2 },
  head: { rz: 0.15, ry: 0.3 },
  armR: { rz: -0.2, rx: 0.8 },
  foreR: { rz: -0.9 },
  armL: { rz: -1.05 },
  foreL: { rz: -0.1 },
  legR: { rz: 0.15, rx: 0.35 },
  shinR: { rz: 0.2 },
  legL: { rz: 0.85, rx: -0.25 },
  shinL: { rz: 0.15 },
  tailL: { rz: 0.7 },
  tailR: { rz: -0.7 },
}

const CHEER: Pose = {
  hips: { py: 0.12, rz: 0 },
  torso: { rz: 0.05 },
  head: { rz: 0.1 },
  armR: { rz: 2.4, rx: 0.2 },
  foreR: { rz: 0.15 },
  armL: { rz: 2.2, rx: -0.2 },
  foreL: { rz: 0.2 },
  legR: { rz: 0.08 },
  shinR: { rz: 0.05 },
  legL: { rz: 0.12 },
  shinL: { rz: 0.08 },
  tailL: { rz: 0.8 },
  tailR: { rz: -0.8 },
}

const FALL: Pose = {
  hips: { px: -0.35, py: -0.42, rz: 1.15 },
  torso: { rz: 0.25 },
  head: { rz: 0.35 },
  armR: { rz: 1.4, rx: 0.4 },
  foreR: { rz: 0.3 },
  armL: { rz: 1.1, rx: -0.35 },
  foreL: { rz: 0.4 },
  legR: { rz: -0.55, rx: 0.2 },
  shinR: { rz: 0.7 },
  legL: { rz: -0.35, rx: -0.25 },
  shinL: { rz: 0.85 },
  tailL: { rz: -0.2 },
  tailR: { rz: 0.15 },
}

const CHARGE: Pose = {
  hips: { py: -0.14, rz: 0.4 },
  torso: { rz: 0.18 },
  head: { rz: -0.05 },
  armR: { rz: -0.7 },
  foreR: { rz: -0.4 },
  armL: { rz: -0.85 },
  foreL: { rz: -0.5 },
  legR: { rz: 0.7 },
  shinR: { rz: 0.85 },
  legL: { rz: 0.78 },
  shinL: { rz: 0.7 },
  tailL: { rz: 0.15 },
  tailR: { rz: -0.1 },
}

function overlay(base: Pose, patch: Pose): Pose {
  return { ...base, ...patch }
}

const CLIPS: Record<TugNinjaClip, ClipDefinition> = {
  idle_hold: {
    durationMs: 2000,
    loop: true,
    frames: [
      { t: 0, pose: IDLE },
      { t: 0.5, pose: overlay(IDLE, { hips: { py: 0.045, rz: 0.24 } }) },
      { t: 1, pose: IDLE },
    ],
  },
  pull_heave: {
    durationMs: 700,
    loop: false,
    frames: [
      { t: 0, pose: IDLE },
      { t: 0.45, pose: HEAVE },
      { t: 1, pose: IDLE },
    ],
  },
  strain_lose: {
    durationMs: 1000,
    loop: true,
    frames: [
      { t: 0, pose: STRAIN },
      {
        t: 0.5,
        pose: overlay(STRAIN, { hips: { px: 0.1, py: 0.01, rz: -0.22 }, shinR: { rz: 0.5 } }),
      },
      { t: 1, pose: STRAIN },
    ],
  },
  stumble_slip: {
    durationMs: 900,
    loop: false,
    frames: [
      { t: 0, pose: IDLE },
      { t: 0.4, pose: SLIP },
      { t: 1, pose: IDLE },
    ],
  },
  victory_cheer: {
    durationMs: 1600,
    loop: true,
    frames: [
      { t: 0, pose: CHEER, rootY: 0 },
      { t: 0.25, pose: CHEER, rootY: 0.22 },
      { t: 0.5, pose: overlay(CHEER, { armL: { rz: 2.0, rx: -0.2 } }), rootY: 0 },
      { t: 0.75, pose: CHEER, rootY: 0.2 },
      { t: 1, pose: CHEER, rootY: 0 },
    ],
  },
  defeat_fall: {
    durationMs: 1200,
    loop: false,
    holdAfter: true,
    frames: [
      { t: 0, pose: IDLE },
      { t: 0.55, pose: FALL },
      {
        t: 1,
        pose: overlay(FALL, { hips: { px: -0.35, py: -0.4, rz: 1.12 } }),
      },
    ],
  },
  charge_up: {
    durationMs: 800,
    loop: true,
    frames: [
      { t: 0, pose: CHARGE },
      {
        t: 0.5,
        pose: overlay(CHARGE, { hips: { px: 0.02, py: -0.12, rz: 0.4 } }),
      },
      { t: 1, pose: CHARGE },
    ],
  },
}

export interface NinjaActorOptions {
  side: TugSide
  slot: number
  /** World X of the ninja's rest position. */
  restX: number
  restZ?: number
}

/**
 * Procedural placeholder ninja. Pose clips are named to match the GLB
 * animation contract in TUG_OF_WAR_NINJA_ASSET_SPEC.md so a later art swap
 * can reuse the same `play()` calls.
 */
export class NinjaActor {
  public readonly group = new THREE.Group()
  public readonly gripL = new THREE.Object3D()
  public readonly gripR = new THREE.Object3D()
  public readonly side: TugSide
  public readonly slot: number
  public readonly restX: number

  private readonly bones = new Map<BoneName, THREE.Object3D>()
  private readonly rest = new Map<BoneName, THREE.Vector3>()
  private playing: PlayingClip | null = null
  private queuedIdle = false
  private restY = 0

  constructor(options: NinjaActorOptions) {
    this.side = options.side
    this.slot = options.slot
    this.restX = options.restX
    this.group.name = `ninja-${options.side}-${options.slot}`
    this.group.position.set(options.restX, 0, options.restZ ?? 0)
    if (options.side === 'red') {
      this.group.rotation.y = Math.PI
    }
    this._buildBody()
    this.play('idle_hold')
  }

  public play(clip: TugNinjaClip): void {
    const definition = CLIPS[clip]
    this.playing = { name: clip, elapsed: 0, definition }
    this.queuedIdle = !definition.loop && !definition.holdAfter
    this._applyClip(0)
  }

  public get currentClip(): TugNinjaClip | null {
    return this.playing?.name ?? null
  }

  public update(deltaMs: number): void {
    if (!this.playing) return
    const { definition } = this.playing
    this.playing.elapsed += deltaMs
    let t = this.playing.elapsed / definition.durationMs
    if (definition.loop) {
      t = t % 1
      this.playing.elapsed = t * definition.durationMs
    } else if (t >= 1) {
      t = 1
      this._applyClip(1)
      if (this.queuedIdle) {
        this.play('idle_hold')
      }
      return
    }
    this._applyClip(t)
  }

  public setWorldX(x: number): void {
    this.group.position.x = x
  }

  public dispose(): void {
    this.playing = null
    this.bones.clear()
  }

  private _applyClip(t: number): void {
    if (!this.playing) return
    const frames = this.playing.definition.frames
    let i = 0
    while (i < frames.length - 2 && frames[i + 1].t < t) i += 1
    const a = frames[i]
    const b = frames[Math.min(i + 1, frames.length - 1)]
    const span = Math.max(0.0001, b.t - a.t)
    const local = Math.max(0, Math.min(1, (t - a.t) / span))
    const pose = mixPose(a.pose, b.pose, local)
    this._applyPose(pose)
    const rootY = lerp(a.rootY ?? 0, b.rootY ?? 0, local)
    this.group.position.y = this.restY + rootY
  }

  private _applyPose(pose: Pose): void {
    this.bones.forEach((bone, name) => {
      const rest = this.rest.get(name)
      const p = pose[name]
      bone.position.set(
        (rest?.x ?? 0) + (p?.px ?? 0),
        (rest?.y ?? 0) + (p?.py ?? 0),
        (rest?.z ?? 0) + (p?.pz ?? 0)
      )
      bone.rotation.set(p?.rx ?? 0, p?.ry ?? 0, p?.rz ?? 0)
    })
  }

  private _buildBody(): void {
    const colors = TEAM_COLORS[this.side]
    const gi = mat(colors.gi, 0.72)
    const wrap = mat(colors.wrap, 0.8)
    const pants = mat(colors.pants, 0.78)
    const band = mat(colors.band, 0.55)
    const mask = mat(MASK, 0.45)
    const eye = new THREE.MeshBasicMaterial({ color: EYE })
    const rope = mat(ROPE_TAN, 0.9)

    const hips = this._bone('hips')
    this.group.add(hips)

    const pelvis = box(0.38, 0.22, 0.24, wrap)
    pelvis.position.y = 0.55
    hips.add(pelvis)

    const torso = this._bone('torso')
    torso.position.y = 0.68
    hips.add(torso)
    const chest = box(0.42, 0.42, 0.28, gi)
    chest.position.y = 0.22
    torso.add(chest)
    const sash = box(0.44, 0.08, 0.3, band)
    sash.position.y = 0.02
    torso.add(sash)

    const head = this._bone('head')
    head.position.y = 0.52
    torso.add(head)
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mask)
    skull.position.y = 0.16
    skull.castShadow = true
    head.add(skull)
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.175, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      gi
    )
    hood.position.set(0, 0.24, 0)
    head.add(hood)
    const bandMesh = box(0.46, 0.07, 0.32, band)
    bandMesh.position.set(0, 0.2, 0.02)
    head.add(bandMesh)
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), eye)
    eyeL.position.set(0.12, 0.16, 0.16)
    eyeL.scale.set(1.2, 0.45, 0.4)
    head.add(eyeL)
    const eyeR = eyeL.clone()
    eyeR.position.x = -0.12
    head.add(eyeR)

    const tailL = this._bone('tailL')
    tailL.position.set(-0.16, 0.22, -0.12)
    head.add(tailL)
    const tailMeshL = box(0.05, 0.28, 0.04, band)
    tailMeshL.position.y = -0.12
    tailL.add(tailMeshL)
    const tailR = this._bone('tailR')
    tailR.position.set(-0.1, 0.22, -0.14)
    head.add(tailR)
    const tailMeshR = box(0.04, 0.22, 0.035, band)
    tailMeshR.position.y = -0.1
    tailR.add(tailMeshR)

    this._arm('R', 0.22, gi, wrap, rope, 1)
    this._arm('L', -0.22, gi, wrap, rope, -1)
    this._leg('R', 0.11, pants)
    this._leg('L', -0.11, pants)
    this._captureRest()
  }

  private _arm(
    side: 'L' | 'R',
    x: number,
    gi: THREE.Material,
    wrap: THREE.Material,
    rope: THREE.Material,
    dir: number
  ): void {
    const upperName = side === 'R' ? 'armR' : 'armL'
    const foreName = side === 'R' ? 'foreR' : 'foreL'
    const torso = this.bones.get('torso')!
    const arm = this._bone(upperName)
    arm.position.set(x, 0.38, 0)
    torso.add(arm)
    const upper = box(0.12, 0.28, 0.12, gi)
    upper.position.y = -0.14
    arm.add(upper)
    const fore = this._bone(foreName)
    fore.position.set(0, -0.28, 0)
    arm.add(fore)
    const lower = box(0.11, 0.26, 0.11, wrap)
    lower.position.y = -0.12
    fore.add(lower)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), wrap)
    hand.position.y = -0.26
    hand.castShadow = true
    fore.add(hand)
    const grip = side === 'R' ? this.gripR : this.gripL
    grip.position.set(dir * 0.04, 0, 0.04)
    hand.add(grip)
    const ropeBit = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 8), rope)
    ropeBit.rotation.z = Math.PI / 2
    hand.add(ropeBit)
  }

  private _leg(side: 'L' | 'R', x: number, pants: THREE.Material): void {
    const thighName = side === 'R' ? 'legR' : 'legL'
    const shinName = side === 'R' ? 'shinR' : 'shinL'
    const hips = this.bones.get('hips')!
    const thigh = this._bone(thighName)
    thigh.position.set(x, 0.44, 0)
    hips.add(thigh)
    const thighMesh = box(0.16, 0.32, 0.16, pants)
    thighMesh.position.y = -0.16
    thigh.add(thighMesh)
    const shin = this._bone(shinName)
    shin.position.set(0, -0.32, 0)
    thigh.add(shin)
    const shinMesh = box(0.14, 0.28, 0.14, pants)
    shinMesh.position.y = -0.14
    shin.add(shinMesh)
    const foot = box(0.16, 0.08, 0.28, mat(0x1a202c, 0.85))
    foot.position.set(0.02, -0.3, 0.06)
    shin.add(foot)
  }

  private _bone(name: BoneName): THREE.Group {
    const bone = new THREE.Group()
    bone.name = name
    this.bones.set(name, bone)
    return bone
  }

  private _captureRest(): void {
    this.bones.forEach((bone, name) => {
      this.rest.set(name, bone.position.clone())
    })
  }
}

function mat(color: number, roughness: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.05,
  })
}

function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function isTugNinjaClip(value: string): value is TugNinjaClip {
  return (TUG_NINJA_CLIPS as readonly string[]).includes(value)
}
