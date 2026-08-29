import * as PIXI from 'pixi.js'

export interface AnswerCloudShapeOptions {
  width: number
  height: number
  /** Seed for deterministic puff layout (default 0). */
  seed?: number
}

/**
 * Cartoon cumulus badge for answer text: overlapping puffs of mixed sizes,
 * not a blurred oval. The interior is solid white so labels stay readable.
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

    const g = new PIXI.Graphics()
    this._drawPuffs(g, options.seed ?? 0)
    this.addChild(g)
  }

  private _drawPuffs(g: PIXI.Graphics, seed: number): void {
    const w = this.cloudWidth
    const h = this.cloudHeight
    const rnd = mulberry32(seed + 11)

    // Relative puffs: [cx, cy, rx, ry] in fractions of width/height.
    // A lumpy cumulus: wide base, taller knobs along the top, extra side bumps.
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

    // Jitter so each option looks like a different cloud, not clones.
    const jittered = puffs.map(([cx, cy, rx, ry]) => {
      const jx = (rnd() - 0.5) * 0.06
      const jy = (rnd() - 0.5) * 0.05
      const js = 0.92 + rnd() * 0.16
      return [cx + jx, cy + jy, rx * js, ry * js] as const
    })

    // Fill first so overlaps stay solid white, then a thin rim on the outer puffs.
    for (const [cx, cy, rx, ry] of jittered) {
      g.ellipse(cx * w, cy * h, rx * w, ry * h).fill({ color: 0xffffff, alpha: 1 })
    }
    // Extra fill in the middle so the answer text sits on solid white.
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
