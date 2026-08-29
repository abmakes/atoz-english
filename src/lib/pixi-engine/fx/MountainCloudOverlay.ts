import * as PIXI from 'pixi.js'

export interface MountainCloudOverlayOptions {
  /** Fraction of screen height the cloud bank occupies (default 0.62). */
  coverage?: number
  /** Overall opacity multiplier 0..1 (default 1). */
  intensity?: number
}

interface CloudLayerSpec {
  /** Vertical band inside the overlay (fractions of cloud height). */
  bandTop: number
  bandBottom: number
  /** Number of cloud masses. */
  masses: number
  /** Blob alpha range. */
  alphaMin: number
  alphaMax: number
  /** Blob tint — whiter for the dense ceiling, grayer for low haze. */
  color: number
  blurStrength: number
  noise: number
  /** Horizontal drift amplitude in px and phase speed. */
  driftAmpX: number
  driftAmpY: number
  driftSpeed: number
  driftPhase: number
}

/**
 * Persistent atmospheric cloud bank pinned to the top of the viewport.
 *
 * Three independently drifting layers (dense / wispy / faint) built from
 * blurred ellipse blobs, softened with noise, slowly deformed by a
 * displacement filter, and faded out vertically by a gradient alpha mask so
 * the mountain below stays readable while the summit feels hidden.
 *
 * Screen-space: add above the game world, below the HUD.
 */
export class MountainCloudOverlay extends PIXI.Container {
  private screenW: number
  private screenH: number
  private coverage: number
  private cloudHeight: number

  private layersRoot: PIXI.Container
  private layers: PIXI.Container[] = []
  private maskSprite: PIXI.Sprite | null = null
  private displacementSprite: PIXI.Sprite | null = null
  private generatedTextures: PIXI.Texture[] = []
  private time = 0

  private static readonly LAYER_SPECS: CloudLayerSpec[] = [
    // Dense ceiling — near-solid white, slow.
    {
      bandTop: 0.0,
      bandBottom: 0.48,
      masses: 7,
      alphaMin: 0.72,
      alphaMax: 0.95,
      color: 0xffffff,
      blurStrength: 20,
      noise: 0.06,
      driftAmpX: 8,
      driftAmpY: 0,
      driftSpeed: 0.0001,
      driftPhase: 0,
    },
    // Broken wisps — medium, drifts opposite.
    {
      bandTop: 0.28,
      bandBottom: 0.72,
      masses: 5,
      alphaMin: 0.2,
      alphaMax: 0.38,
      color: 0xf7f9fa,
      blurStrength: 14,
      noise: 0.06,
      driftAmpX: 16,
      driftAmpY: 0,
      driftSpeed: 0.00019,
      driftPhase: Math.PI,
    },
    // Faint low wisps — creep slowly upward.
    {
      bandTop: 0.52,
      bandBottom: 0.95,
      masses: 3,
      alphaMin: 0.06,
      alphaMax: 0.13,
      color: 0xe9eef1,
      blurStrength: 9,
      noise: 0.05,
      driftAmpX: 6,
      driftAmpY: 8,
      driftSpeed: 0.00026,
      driftPhase: Math.PI / 2,
    },
  ]

  constructor(screenWidth: number, screenHeight: number, options: MountainCloudOverlayOptions = {}) {
    super()
    this.screenW = screenWidth
    this.screenH = screenHeight
    this.coverage = options.coverage ?? 0.62
    this.cloudHeight = screenHeight * this.coverage

    this.layersRoot = new PIXI.Container()
    this.addChild(this.layersRoot)
    this.layersRoot.alpha = options.intensity ?? 1

    // Overlay is atmosphere only — never block answer clicks.
    this.eventMode = 'none'
    this.interactiveChildren = false

    this._build()
  }

  /** 0 = clear sky, 1 = full cloud bank. Handy for storms / summit reveals. */
  public setIntensity(value: number): void {
    this.layersRoot.alpha = Math.max(0, Math.min(1, value))
  }

  public update(deltaMs: number): void {
    this.time += deltaMs

    for (let i = 0; i < this.layers.length; i++) {
      const spec = MountainCloudOverlay.LAYER_SPECS[i]
      const t = this.time * spec.driftSpeed + spec.driftPhase
      this.layers[i].x = Math.sin(t) * spec.driftAmpX
      if (spec.driftAmpY > 0) {
        // Faint layer creeps upward and re-settles, like rising haze.
        this.layers[i].y = -((this.time * 0.002) % spec.driftAmpY) + Math.sin(t) * 2
      }
    }

    if (this.displacementSprite) {
      this.displacementSprite.x = Math.sin(this.time * 0.0004) * 24
      this.displacementSprite.y = Math.cos(this.time * 0.0003) * 12
    }
  }

  public resize(width: number, height: number): void {
    this.screenW = width
    this.screenH = height
    this.cloudHeight = height * this.coverage
    this._clear()
    this._build()
  }

  public override destroy(options?: PIXI.DestroyOptions): void {
    this._clear()
    super.destroy(options)
  }

  private _clear(): void {
    this.layersRoot.mask = null
    this.layersRoot.filters = []
    for (const layer of this.layers) {
      layer.filters = []
    }
    this.layersRoot.removeChildren().forEach((c) => c.destroy({ children: true }))
    this.layers = []
    if (this.maskSprite) {
      this.removeChild(this.maskSprite)
      this.maskSprite.destroy()
      this.maskSprite = null
    }
    if (this.displacementSprite) {
      this.removeChild(this.displacementSprite)
      this.displacementSprite.destroy()
      this.displacementSprite = null
    }
    for (const tex of this.generatedTextures) {
      tex.destroy(true)
    }
    this.generatedTextures = []
  }

  private _build(): void {
    this._attachCeilingSheet()

    for (const spec of MountainCloudOverlay.LAYER_SPECS) {
      const layer = this._buildLayer(spec)
      this.layers.push(layer)
      this.layersRoot.addChild(layer)
    }

    this._attachDisplacement()
    this._attachFadeMask()
  }

  /**
   * Solid white sheet across the very top of the bank so the ceiling reads
   * almost opaque white, dissolving into the drifting blobs below it.
   */
  private _attachCeilingSheet(): void {
    const tex = this._makeCeilingTexture()
    if (!tex) return
    this.generatedTextures.push(tex)
    const sheet = new PIXI.Sprite(tex)
    sheet.width = this.screenW
    // Cover most of the upper bank so the top reads as a white ceiling.
    sheet.height = this.cloudHeight * 0.58
    this.layersRoot.addChild(sheet)
  }

  private _buildLayer(spec: CloudLayerSpec): PIXI.Container {
    const layer = new PIXI.Container()
    const w = this.screenW
    const bandTop = spec.bandTop * this.cloudHeight
    const bandH = (spec.bandBottom - spec.bandTop) * this.cloudHeight

    const g = new PIXI.Graphics()
    for (let m = 0; m < spec.masses; m++) {
      // Masses tile across the width with jitter and heavy overlap.
      const cx = w * ((m + 0.5) / spec.masses + (Math.random() - 0.5) * 0.18)
      const cy = bandTop + bandH * (0.3 + Math.random() * 0.4)
      const massW = w * (0.34 + Math.random() * 0.2)
      const massH = bandH * (0.55 + Math.random() * 0.35)

      const blobs = 7 + Math.floor(Math.random() * 6)
      for (let i = 0; i < blobs; i++) {
        const px = cx + massW * (Math.random() - 0.5) * 0.9
        const py = cy + massH * (Math.random() - 0.5) * 0.6
        const rx = massW * (0.12 + Math.random() * 0.2)
        const ry = massH * (0.25 + Math.random() * 0.35)
        g.ellipse(px, py, rx, ry).fill({
          color: spec.color,
          alpha: spec.alphaMin + Math.random() * (spec.alphaMax - spec.alphaMin),
        })
      }

      // Broad haze pad under each mass keeps blobs reading as one cloud.
      g.ellipse(cx, cy + massH * 0.2, massW * 0.75, massH * 0.5).fill({
        color: spec.color,
        alpha: spec.alphaMin * 0.6,
      })
    }
    layer.addChild(g)

    layer.filters = [
      new PIXI.BlurFilter({ strength: spec.blurStrength, quality: 3 }),
      new PIXI.NoiseFilter({ noise: spec.noise }),
    ]
    return layer
  }

  private _attachDisplacement(): void {
    const noiseTex = this._makeValueNoiseTexture(256, 8)
    if (!noiseTex) return
    this.generatedTextures.push(noiseTex)
    try {
      noiseTex.source.style.addressMode = 'repeat'
    } catch {
      /* wrap unsupported — bounded drift keeps sampling in range */
    }

    const sprite = new PIXI.Sprite(noiseTex)
    sprite.width = this.screenW
    sprite.height = this.cloudHeight
    sprite.renderable = false
    this.addChild(sprite)
    this.displacementSprite = sprite

    // Gentle deformation — atmospheric crawl, not boiling water.
    this.layersRoot.filters = [
      new PIXI.DisplacementFilter({ sprite, scale: 14 }),
    ]
  }

  private _attachFadeMask(): void {
    const gradientTex = this._makeGradientTexture()
    if (!gradientTex) return
    this.generatedTextures.push(gradientTex)

    const mask = new PIXI.Sprite(gradientTex)
    mask.width = this.screenW
    mask.height = this.cloudHeight
    this.addChild(mask)
    this.maskSprite = mask
    // Sprite masks alpha-mask in Pixi v8 (Graphics masks are binary stencil).
    this.layersRoot.mask = mask
  }

  /** Opaque white at the very top, dissolving to nothing by mid-bank. */
  private _makeCeilingTexture(): PIXI.Texture | null {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 4
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.28, 'rgba(255,255,255,0.98)')
    grad.addColorStop(0.55, 'rgba(255,255,255,0.72)')
    grad.addColorStop(0.82, 'rgba(255,255,255,0.22)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return PIXI.Texture.from(canvas)
  }

  /** Vertical alpha gradient: solid ceiling → broken middle → clear bottom. */
  private _makeGradientTexture(): PIXI.Texture | null {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 4
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    // Hold full opacity longer so the top third stays a white cloud bank.
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.55, 'rgba(255,255,255,1)')
    grad.addColorStop(0.74, 'rgba(255,255,255,0.5)')
    grad.addColorStop(0.9, 'rgba(255,255,255,0.12)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return PIXI.Texture.from(canvas)
  }

  /**
   * Smooth value-noise texture for the displacement filter.
   * Red/green channels displace x/y; mid-gray is neutral.
   */
  private _makeValueNoiseTexture(size: number, cells: number): PIXI.Texture | null {
    if (typeof document === 'undefined') return null
    const small = document.createElement('canvas')
    small.width = cells
    small.height = cells
    const sctx = small.getContext('2d')
    if (!sctx) return null
    const img = sctx.createImageData(cells, cells)
    for (let i = 0; i < cells * cells; i++) {
      const r = 96 + Math.floor(Math.random() * 64)
      const g = 96 + Math.floor(Math.random() * 64)
      img.data[i * 4] = r
      img.data[i * 4 + 1] = g
      img.data[i * 4 + 2] = 128
      img.data[i * 4 + 3] = 255
    }
    sctx.putImageData(img, 0, 0)

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(small, 0, 0, size, size)
    return PIXI.Texture.from(canvas)
  }
}
