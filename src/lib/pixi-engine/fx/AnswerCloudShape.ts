import * as PIXI from 'pixi.js'

export interface AnswerCloudShapeOptions {
  width: number
  height: number
  /** Seed for deterministic puff layout (default 0). */
  seed?: number
}

/**
 * Cumulus answer badge: overlapping white puffs of mixed sizes (classic cloud
 * silhouette). Drawn solid, then softened as ONE shape so construction circles
 * never show through. No hard oval substitute — the lumpy puffs are the look.
 */
export class AnswerCloudShape extends PIXI.Container {
  readonly cloudWidth: number
  readonly cloudHeight: number
  readonly textSafeWidth: number
  readonly textSafeHeight: number
  private ownedTexture: PIXI.Texture | null = null

  constructor(options: AnswerCloudShapeOptions) {
    super()
    this.cloudWidth = options.width
    this.cloudHeight = options.height
    this.textSafeWidth = options.width * 0.62
    this.textSafeHeight = options.height * 0.42

    const seed = options.seed ?? 0
    const sprite = this._makeSoftPuffSprite(seed)
    if (sprite) {
      this.addChild(sprite)
      return
    }

    // SSR / no-canvas fallback: same overlapping puffs, no soft edge.
    const g = new PIXI.Graphics()
    this._drawPuffsOnGraphics(g, seed)
    this.addChild(g)
  }

  public override destroy(options?: PIXI.DestroyOptions): void {
    if (this.ownedTexture) {
      this.ownedTexture.destroy(true)
      this.ownedTexture = null
    }
    super.destroy(options)
  }

  /**
   * Paint overlapping puffs onto a canvas, blur the whole silhouette once, and
   * return a centered sprite. Every option gets the same soft-cloud treatment.
   */
  private _makeSoftPuffSprite(seed: number): PIXI.Sprite | null {
    if (typeof document === 'undefined') return null

    const blurPx = Math.max(6, Math.round(Math.min(this.cloudWidth, this.cloudHeight) * 0.07))
    const pad = blurPx * 2 + 8
    const cw = Math.max(8, Math.ceil(this.cloudWidth))
    const ch = Math.max(8, Math.ceil(this.cloudHeight))
    const tw = cw + pad * 2
    const th = ch + pad * 2

    const hard = document.createElement('canvas')
    hard.width = tw
    hard.height = th
    const hctx = hard.getContext('2d')
    if (!hctx) return null

    const ox = tw / 2
    const oy = th / 2
    const puffs = this._puffLayout(seed)
    hctx.fillStyle = '#ffffff'
    for (const [cx, cy, rx, ry] of puffs) {
      hctx.beginPath()
      hctx.ellipse(ox + cx * cw, oy + cy * ch, rx * cw, ry * ch, 0, 0, Math.PI * 2)
      hctx.fill()
    }

    // Soften the silhouette as a whole (not per circle).
    const soft = document.createElement('canvas')
    soft.width = tw
    soft.height = th
    const sctx = soft.getContext('2d')
    if (!sctx) return null
    sctx.filter = `blur(${blurPx}px)`
    sctx.drawImage(hard, 0, 0)
    sctx.filter = 'none'
    // Re-stamp solid puffs slightly smaller so the center stays readable white
    // while the outer knobs keep the soft cloud halo.
    sctx.fillStyle = '#ffffff'
    for (const [cx, cy, rx, ry] of puffs) {
      sctx.beginPath()
      sctx.ellipse(
        ox + cx * cw,
        oy + cy * ch,
        rx * cw * 0.88,
        ry * ch * 0.88,
        0,
        0,
        Math.PI * 2
      )
      sctx.fill()
    }

    const texture = PIXI.Texture.from(soft)
    this.ownedTexture = texture
    const sprite = new PIXI.Sprite(texture)
    sprite.anchor.set(0.5)
    return sprite
  }

  private _drawPuffsOnGraphics(g: PIXI.Graphics, seed: number): void {
    const w = this.cloudWidth
    const h = this.cloudHeight
    for (const [cx, cy, rx, ry] of this._puffLayout(seed)) {
      g.ellipse(cx * w, cy * h, rx * w, ry * h).fill({ color: 0xffffff, alpha: 1 })
    }
  }

  /** Relative puffs: [cx, cy, rx, ry] in fractions of width/height. */
  private _puffLayout(seed: number): Array<readonly [number, number, number, number]> {
    const rnd = mulberry32(seed + 11)
    const base: Array<[number, number, number, number]> = [
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
      // Dense center so answer text sits on solid white.
      [0.0, 0.04, 0.36, 0.28],
    ]

    return base.map(([cx, cy, rx, ry]) => {
      const jx = (rnd() - 0.5) * 0.06
      const jy = (rnd() - 0.5) * 0.05
      const js = 0.92 + rnd() * 0.16
      return [cx + jx, cy + jy, rx * js, ry * js] as const
    })
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
