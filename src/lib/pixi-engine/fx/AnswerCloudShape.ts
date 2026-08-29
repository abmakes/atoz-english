import * as PIXI from 'pixi.js'

export interface AnswerCloudShapeOptions {
  width: number
  height: number
  /** Seed for deterministic puff layout (default 0). */
  seed?: number
}

/**
 * Cumulus answer badge: overlapping puffs flattened to one silhouette, then
 * blurred as a whole so edges match the atmospheric bank. A solid white core
 * keeps labels readable. Never draw per-puff alpha — parent fade would show
 * the individual circles.
 */
export class AnswerCloudShape extends PIXI.Container {
  readonly cloudWidth: number
  readonly cloudHeight: number
  readonly textSafeWidth: number
  readonly textSafeHeight: number

  constructor(options: AnswerCloudShapeOptions) {
    super()
    this.cloudWidth = options.width
    this.cloudHeight = options.height
    this.textSafeWidth = options.width * 0.62
    this.textSafeHeight = options.height * 0.42

    const w = this.cloudWidth
    const h = this.cloudHeight

    const puffs = new PIXI.Graphics()
    this._drawPuffs(puffs, options.seed ?? 0)

    // Flatten first so overlapping ellipses become one opaque sprite. Then blur
    // that silhouette — not each circle — so seams cannot reappear if the
    // parent is ever faded.
    const flat = new PIXI.Container()
    flat.addChild(puffs)
    flat.cacheAsTexture(true)

    const bank = new PIXI.Container()
    bank.addChild(flat)
    bank.filterArea = new PIXI.Rectangle(-w, -h, w * 2, h * 2)
    try {
      bank.filters = [
        new PIXI.BlurFilter({
          strength: 12,
          quality: 3,
          padding: 24,
        }),
      ]
    } catch (e) {
      console.warn('AnswerCloudShape: BlurFilter unavailable', e)
    }
    this.addChild(bank)

    const core = new PIXI.Graphics()
    core.ellipse(0, 0.04 * h, w * 0.38, h * 0.3).fill({ color: 0xffffff, alpha: 1 })
    this.addChild(core)
  }

  private _drawPuffs(g: PIXI.Graphics, seed: number): void {
    const w = this.cloudWidth
    const h = this.cloudHeight
    const rnd = mulberry32(seed + 11)

    // Relative puffs: [cx, cy, rx, ry] in fractions of width/height.
    const puffs: Array<[number, number, number, number]> = [
      [0.0, 0.18, 0.42, 0.32],
      [-0.28, 0.12, 0.26, 0.28],
      [0.28, 0.14, 0.27, 0.27],
      [-0.16, -0.18, 0.24, 0.3],
      [0.14, -0.22, 0.27, 0.32],
      [0.0, -0.08, 0.3, 0.28],
      [-0.36, -0.02, 0.18, 0.22],
      [0.36, 0.0, 0.19, 0.22],
      [-0.08, 0.28, 0.22, 0.2],
      [0.18, 0.26, 0.2, 0.18],
    ]

    const jittered = puffs.map(([cx, cy, rx, ry]) => {
      const jx = (rnd() - 0.5) * 0.06
      const jy = (rnd() - 0.5) * 0.05
      const js = 0.92 + rnd() * 0.16
      return [cx + jx, cy + jy, rx * js, ry * js] as const
    })

    for (const [cx, cy, rx, ry] of jittered) {
      g.ellipse(cx * w, cy * h, rx * w, ry * h).fill({ color: 0xffffff, alpha: 1 })
    }
    g.ellipse(0, 0.04 * h, w * 0.36, h * 0.28).fill({ color: 0xffffff, alpha: 1 })
  }
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
