import * as THREE from 'three'
import { TUG_FLAG_CANVAS } from './tugCanvasTextures'
import { createCutoutMaterial } from './tugMaterials'
import {
  TUG_ROPE_STRIP,
  sampleTugRope,
  tugNinjaPx,
  tugRopeThickness,
} from './tugStageLayout'

const FLAG_WIDTH = 0.66
const FLAG_HEIGHT =
  (FLAG_WIDTH * TUG_FLAG_CANVAS.heightPx) / TUG_FLAG_CANVAS.widthPx
/** How far the banner's top edge rises above the rope centre line. */
const FLAG_TOP_ABOVE_ROPE = 0.19
const FLAG_PIVOT_OFFSET =
  FLAG_TOP_ABOVE_ROPE +
  (FLAG_HEIGHT * TUG_FLAG_CANVAS.topPx) / TUG_FLAG_CANVAS.heightPx
/** A dropped rope foreshortens the banner as if it lay on the dirt. */
const FLAG_SLACK_FLATTEN = 0.35
const SLACK_SPEED = 3.2

/**
 * Painted-style rope ribbon textured with a strip cut from the ninja pull
 * pose, plus the centre banner. The group's x follows the tug offset.
 */
export class TugRope {
  public readonly group = new THREE.Group()

  private readonly geometry = new THREE.BufferGeometry()
  private readonly mesh: THREE.Mesh
  private readonly flagPivot = new THREE.Group()
  private readonly flag: THREE.Mesh
  private spriteScale = 1
  private layoutScaleX = 1
  private slack = 0
  private targetSlack = 0
  private centerY = 0
  private elapsedMs = 0

  constructor(ropeTexture: THREE.Texture, flagTexture: THREE.Texture) {
    this.group.name = 'tug-rope'
    ropeTexture.wrapS = THREE.RepeatWrapping
    ropeTexture.wrapT = THREE.ClampToEdgeWrapping
    ropeTexture.needsUpdate = true
    this.mesh = new THREE.Mesh(this.geometry, createCutoutMaterial(ropeTexture))
    this.mesh.name = 'tug-rope-ribbon'
    this.mesh.renderOrder = 4
    this.group.add(this.mesh)

    const flagGeometry = new THREE.PlaneGeometry(FLAG_WIDTH, FLAG_HEIGHT)
    flagGeometry.translate(0, -FLAG_HEIGHT / 2, 0)
    this.flag = new THREE.Mesh(flagGeometry, createCutoutMaterial(flagTexture))
    this.flag.name = 'tug-center-flag'
    this.flag.renderOrder = 5
    this.flagPivot.add(this.flag)
    this.group.add(this.flagPivot)
    this._rebuild()
  }

  public setLayout(spriteScale: number, layoutScaleX: number): void {
    this.spriteScale = spriteScale
    this.layoutScaleX = layoutScaleX
    this._rebuild()
  }

  /** 0 = taut in the ninjas' hands, 1 = dropped on the dirt. */
  public setSlack(target: number): void {
    this.targetSlack = Math.max(0, Math.min(1, target))
  }

  public get slackAmount(): number {
    return this.slack
  }

  public update(deltaMs: number): void {
    this.elapsedMs += deltaMs
    if (this.slack !== this.targetSlack) {
      const stepAmount = (SLACK_SPEED * deltaMs) / 1000
      const diff = this.targetSlack - this.slack
      this.slack =
        Math.abs(diff) <= stepAmount
          ? this.targetSlack
          : this.slack + Math.sign(diff) * stepAmount
      this._rebuild()
    }
    const sway = Math.sin(this.elapsedMs / 420) * 0.045 * (1 - this.slack)
    this.flagPivot.rotation.z = sway
  }

  public dispose(): void {
    this.geometry.dispose()
  }

  private _rebuild(): void {
    const points = sampleTugRope({
      spriteScale: this.spriteScale,
      layoutScaleX: this.layoutScaleX,
      slack: this.slack,
    })
    const half = tugRopeThickness(this.spriteScale) / 2
    const repeatLength = tugNinjaPx(TUG_ROPE_STRIP.widthPx, this.spriteScale)
    const vertexCount = points.length * 2
    let position = this.geometry.getAttribute('position') as
      | THREE.BufferAttribute
      | undefined
    let uv = this.geometry.getAttribute('uv') as THREE.BufferAttribute | undefined

    if (!position || !uv || position.count !== vertexCount) {
      // Frees the old GPU buffers; the geometry re-uploads on the next render.
      this.geometry.dispose()
      position = new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3)
      uv = new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2)
      const indices: number[] = []
      for (let i = 0; i < points.length - 1; i++) {
        const a = i * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
      this.geometry.setAttribute('position', position)
      this.geometry.setAttribute('uv', uv)
      this.geometry.setIndex(indices)
    }

    let distance = 0
    let centerY = points[0]?.y ?? 0
    let bestCenter = Infinity
    for (let i = 0; i < points.length; i++) {
      const prev = points[Math.max(0, i - 1)]
      const next = points[Math.min(points.length - 1, i + 1)]
      const tx = next.x - prev.x
      const ty = next.y - prev.y
      const len = Math.hypot(tx, ty) || 1
      const nx = -ty / len
      const ny = tx / len
      if (i > 0) {
        distance += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
      }
      const p = points[i]
      position.setXYZ(i * 2, p.x + nx * half, p.y + ny * half, 0)
      position.setXYZ(i * 2 + 1, p.x - nx * half, p.y - ny * half, 0)
      const u = distance / repeatLength
      uv.setXY(i * 2, u, 1)
      uv.setXY(i * 2 + 1, u, 0)
      if (Math.abs(p.x) < bestCenter) {
        bestCenter = Math.abs(p.x)
        centerY = p.y
      }
    }
    position.needsUpdate = true
    uv.needsUpdate = true
    this.geometry.computeBoundingSphere()

    this.centerY = centerY
    const s = this.spriteScale
    this.flagPivot.position.set(0, centerY + FLAG_PIVOT_OFFSET * s, 0.002)
    this.flag.scale.set(s, s * (1 - FLAG_SLACK_FLATTEN * this.slack), 1)
  }

  public get ropeCenterY(): number {
    return this.centerY
  }
}
