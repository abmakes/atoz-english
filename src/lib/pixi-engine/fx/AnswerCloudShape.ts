import * as PIXI from 'pixi.js'

export interface AnswerCloudShapeOptions {
  width: number
  height: number
  /** Soft edge blur (default 10). */
  blurStrength?: number
  /** Noise breakup on soft edge (default 0.05). */
  noise?: number
  /** Seed for deterministic blob layout (default 0). */
  seed?: number
}

/**
 * Answer-option cloud badge matching the MountainCloudOverlay look:
 * soft blurred oval blobs around a solid white oval core so answer text stays readable.
 *
 * Filters only apply to the soft edge layer — the white core and any children
 * you add (labels) stay crisp.
 */
export class AnswerCloudShape extends PIXI.Container {
  readonly cloudWidth: number
  readonly cloudHeight: number
  /** Inset rectangle safe for text (inside the solid white core). */
  readonly textSafeWidth: number
  readonly textSafeHeight: number

  private softLayer: PIXI.Container
  private core: PIXI.Graphics

  constructor(options: AnswerCloudShapeOptions) {
    super()
    this.cloudWidth = options.width
    this.cloudHeight = options.height
    this.textSafeWidth = options.width * 0.72
    this.textSafeHeight = options.height * 0.55

    this.softLayer = new PIXI.Container()
    this.core = new PIXI.Graphics()
    this.addChild(this.softLayer)
    this.addChild(this.core)

    this._buildSoftHalo(options.seed ?? 0)
    this._buildWhiteCore()

    this.softLayer.filters = [
      new PIXI.BlurFilter({ strength: options.blurStrength ?? 10, quality: 3 }),
      new PIXI.NoiseFilter({ noise: options.noise ?? 0.05 }),
    ]
  }

  public override destroy(options?: PIXI.DestroyOptions): void {
    this.softLayer.filters = []
    super.destroy(options)
  }

  private _buildSoftHalo(seed: number): void {
    const g = new PIXI.Graphics()
    const w = this.cloudWidth
    const h = this.cloudHeight
    const rnd = mulberry32(seed + 1)

    // Main soft oval mass — slightly larger than the white core.
    g.ellipse(0, 0, w * 0.52, h * 0.48).fill({ color: 0xffffff, alpha: 0.55 })

    // Irregular overlapping blobs around the rim (same recipe as the bank).
    const blobs = 8 + Math.floor(rnd() * 4)
    for (let i = 0; i < blobs; i++) {
      const angle = (i / blobs) * Math.PI * 2 + rnd() * 0.4
      const dist = 0.28 + rnd() * 0.22
      const px = Math.cos(angle) * w * dist
      const py = Math.sin(angle) * h * dist * 0.85
      const rx = w * (0.16 + rnd() * 0.14)
      const ry = h * (0.22 + rnd() * 0.18)
      g.ellipse(px, py, rx, ry).fill({
        color: 0xffffff,
        alpha: 0.35 + rnd() * 0.3,
      })
    }

    // Extra top/side puffs so it reads as a cloud, not a plain oval.
    g.ellipse(-w * 0.22, -h * 0.12, w * 0.28, h * 0.32).fill({ color: 0xffffff, alpha: 0.45 })
    g.ellipse(w * 0.2, -h * 0.08, w * 0.26, h * 0.3).fill({ color: 0xffffff, alpha: 0.42 })
    g.ellipse(0, h * 0.18, w * 0.4, h * 0.28).fill({ color: 0xf4f6f7, alpha: 0.35 })

    this.softLayer.addChild(g)
  }

  private _buildWhiteCore(): void {
    // Opaque white oval — the readable answer plate.
    this.core
      .ellipse(0, 0, this.cloudWidth * 0.42, this.cloudHeight * 0.38)
      .fill({ color: 0xffffff, alpha: 0.97 })
  }
}

/** Small deterministic PRNG so clouds stay stable across rebuilds for a seed. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
