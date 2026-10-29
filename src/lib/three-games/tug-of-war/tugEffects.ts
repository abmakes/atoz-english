import * as THREE from 'three'
import { createCutoutMaterial, setCutoutOpacity } from './tugMaterials'

interface Puff {
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  ageMs: number
  lifeMs: number
  vx: number
  vy: number
  size: number
}

/** Pooled dust puffs kicked up by the ninjas' feet. */
export class TugDust {
  public readonly group = new THREE.Group()
  private readonly puffs: Puff[] = []
  private readonly geometry = new THREE.PlaneGeometry(1, 1)
  private cursor = 0

  constructor(texture: THREE.Texture, poolSize = 36) {
    this.group.name = 'tug-dust'
    for (let i = 0; i < poolSize; i++) {
      const material = createCutoutMaterial(texture, 0)
      const mesh = new THREE.Mesh(this.geometry, material)
      mesh.visible = false
      mesh.renderOrder = 20
      this.group.add(mesh)
      this.puffs.push({ mesh, material, ageMs: 0, lifeMs: 1, vx: 0, vy: 0, size: 1 })
    }
  }

  /** `direction` is the way the dust should drift (−1 left, +1 right). */
  public spawn(x: number, y: number, direction: number, count: number, scale = 1): void {
    for (let i = 0; i < count; i++) {
      const puff = this.puffs[this.cursor]
      this.cursor = (this.cursor + 1) % this.puffs.length
      puff.ageMs = 0
      puff.lifeMs = 520 + Math.random() * 380
      puff.vx = direction * (0.5 + Math.random() * 0.9) * scale
      puff.vy = (0.12 + Math.random() * 0.3) * scale
      puff.size = (0.32 + Math.random() * 0.3) * scale
      puff.mesh.position.set(
        x + (Math.random() - 0.5) * 0.5 * scale,
        y + Math.random() * 0.08 * scale,
        0.3
      )
      puff.mesh.rotation.z = Math.random() * Math.PI
      puff.mesh.visible = true
    }
  }

  public update(deltaMs: number): void {
    const dt = deltaMs / 1000
    this.puffs.forEach((puff) => {
      if (!puff.mesh.visible) return
      puff.ageMs += deltaMs
      const t = puff.ageMs / puff.lifeMs
      if (t >= 1) {
        puff.mesh.visible = false
        return
      }
      puff.mesh.position.x += puff.vx * dt
      puff.mesh.position.y += puff.vy * dt
      puff.vx *= 0.94
      const grow = puff.size * (0.6 + t * 1.1)
      puff.mesh.scale.set(grow * 1.35, grow, 1)
      setCutoutOpacity(puff.material, 0.85 * (1 - t) * Math.min(1, t * 6))
    })
  }

  public dispose(): void {
    this.geometry.dispose()
  }
}

interface Petal {
  mesh: THREE.Mesh
  vx: number
  vy: number
  spin: number
  sway: number
  phase: number
}

/** A few cherry-blossom petals drifting across the arena. */
export class TugPetals {
  public readonly group = new THREE.Group()
  private readonly petals: Petal[] = []
  private readonly geometry = new THREE.PlaneGeometry(1, 1)
  private bounds = { halfWidth: 8, bottom: 0, top: 9 }
  private elapsed = 0

  constructor(texture: THREE.Texture, count = 16) {
    this.group.name = 'tug-petals'
    const material = createCutoutMaterial(texture, 0.92)
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.geometry, material)
      const size = 0.1 + Math.random() * 0.08
      mesh.scale.set(size, size, 1)
      mesh.renderOrder = i % 3 === 0 ? 8 : 30
      this.group.add(mesh)
      const petal: Petal = {
        mesh,
        vx: 0,
        vy: 0,
        spin: (Math.random() - 0.5) * 2.4,
        sway: 0.2 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
      }
      this._respawn(petal, true)
      this.petals.push(petal)
    }
  }

  public setBounds(halfWidth: number, bottom: number, top: number): void {
    this.bounds = { halfWidth, bottom, top }
  }

  public update(deltaMs: number): void {
    const dt = deltaMs / 1000
    this.elapsed += dt
    this.petals.forEach((petal) => {
      const m = petal.mesh
      m.position.x += (petal.vx + Math.sin(this.elapsed * 1.3 + petal.phase) * petal.sway) * dt
      m.position.y += petal.vy * dt
      m.rotation.z += petal.spin * dt
      const flutter = 0.55 + 0.45 * Math.abs(Math.sin(this.elapsed * 2.1 + petal.phase))
      m.scale.x = m.scale.y * flutter
      if (
        m.position.y < this.bounds.bottom - 0.3 ||
        Math.abs(m.position.x) > this.bounds.halfWidth + 0.6
      ) {
        this._respawn(petal, false)
      }
    })
  }

  public dispose(): void {
    this.geometry.dispose()
  }

  private _respawn(petal: Petal, scatter: boolean): void {
    const fromLeft = Math.random() < 0.5
    const { halfWidth, bottom, top } = this.bounds
    const x = fromLeft
      ? -halfWidth + Math.random() * halfWidth * 0.55
      : halfWidth - Math.random() * halfWidth * 0.55
    const y = scatter ? bottom + Math.random() * (top - bottom) : top - Math.random() * 1.5
    petal.mesh.position.set(x, y, 0.5)
    petal.vx = (fromLeft ? 1 : -1) * (0.25 + Math.random() * 0.45)
    petal.vy = -(0.35 + Math.random() * 0.4)
  }
}
