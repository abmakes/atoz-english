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
 * Light first version: blob alphas stay in the 0.06–0.50 range. Do not add
 * a solid white ceiling sheet — that hid the mountain.
 *
 * Screen-space: add above the game world, below the HUD.
 */
export class MountainCloudOverlay extends PIXI.Container {
  private screenW: number
  private screenH: number
  private coverage: number
  private cloudHeight: number

  /** Owns the fade mask so it is not combined with displacement on the same node. */
  private maskedBank: PIXI.Container
  private layersRoot: PIXI.Container
  private layers: PIXI.Container[] = []
  private maskSprite: PIXI.Sprite | null = null
  private displacementSprite: PIXI.Sprite | null = null
  private generatedTextures: PIXI.Texture[] = []
  private time = 0

  private static readonly LAYER_SPECS: CloudLayerSpec[] = [
    // Dense ceiling — slow.
    {
      bandTop: 0.0,
      bandBottom: 0.42,
      masses: 5,
      alphaMin: 0.3,
      alphaMax: 0.5,
      blurStrength: 18,
      noise: 0.08,
      driftAmpX: 10,
      driftAmpY: 0,
      driftSpeed: 0.00012,
      driftPhase: 0,
    },
    // Broken wisps — medium, drifts opposite.
    {
      bandTop: 0.28,
      bandBottom: 0.72,
      masses: 4,
      alphaMin: 0.14,
      alphaMax: 0.28,
      blurStrength: 13,
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
    this.label = 'MountainCloudOverlay'
    this.screenW = Math.max(1, screenWidth)
    this.screenH = Math.max(1, screenHeight)
    this.coverage = options.coverage ?? 0.62
    this.cloudHeight = this.screenH * this.coverage

    this.maskedBank = new PIXI.Container()
    this.layersRoot = new PIXI.Container()
    this.maskedBank.addChild(this.layersRoot)
    this.addChild(this.maskedBank)
    this.maskedBank.alpha = options.intensity ?? 1

    // Overlay is atmosphere only — never block answer clicks.
    this.eventMode = 'none'
    this.interactiveChildren = false

    this._build()
  }

  /** 0 = clear sky, 1 = full cloud bank. Handy for storms / summit reveals. */
  public setIntensity(value: number): void {
    this.maskedBank.alpha = Math.max(0, Math.min(1, value))
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
    this.screenW = Math.max(1, width)
    this.screenH = Math.max(1, height)
    this.cloudHeight = this.screenH * this.coverage
    this._clear()
    this._build()
  }

  public override destroy(options?: PIXI.DestroyOptions): void {
    this._clear()
    super.destroy(options)
  }

  private _filterArea(): PIXI.Rectangle {
    return new PIXI.Rectangle(0, 0, this.screenW, this.cloudHeight)
  }

  private _clear(): void {
    this.maskedBank.mask = null
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
    this.filterArea = this._filterArea()
    this.maskedBank.filterArea = this._filterArea()
    this.layersRoot.filterArea = this._filterArea()

    for (const spec of MountainCloudOverlay.LAYER_SPECS) {
      const layer = this._buildLayer(spec)
      this.layers.push(layer)
      this.layersRoot.addChild(layer)
    }

    this._attachDisplacement()
    this._attachFadeMask()
  }

  private _buildLayer(spec: CloudLayerSpec): PIXI.Container {
    const layer = new PIXI.Container()
    layer.filterArea = this._filterArea()
    const w = this.screenW
    const bandTop = spec.bandTop * this.cloudHeight
    const bandH = (spec.bandBottom - spec.bandTop) * this.cloudHeight

    const g = new PIXI.Graphics()
    // Near-invisible pad so BlurFilter's framebuffer covers the whole bank
    // instead of clipping to sparse ellipse bounds (which made the overlay vanish).
    g.rect(0, 0, w, this.cloudHeight).fill({ color: 0xf4f6f7, alpha: 0.02 })

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
          color: 0xf4f6f7,
          alpha: spec.alphaMin + Math.random() * (spec.alphaMax - spec.alphaMin),
        })
      }

      // Broad haze pad under each mass keeps blobs reading as one cloud.
      g.ellipse(cx, cy + massH * 0.2, massW * 0.75, massH * 0.5).fill({
        color: 0xe9eef1,
        alpha: spec.alphaMin * 0.6,
      })
    }
    layer.addChild(g)

    const filters: PIXI.Filter[] = []
    try {
      filters.push(
        new PIXI.BlurFilter({
          strength: spec.blurStrength,
          quality: 3,
          padding: spec.blurStrength * 2,
        })
      )
    } catch (e) {
      console.warn('MountainCloudOverlay: BlurFilter unavailable', e)
    }
    try {
      filters.push(new PIXI.NoiseFilter({ noise: spec.noise }))
    } catch (e) {
      console.warn('MountainCloudOverlay: NoiseFilter unavailable', e)
    }
    if (filters.length > 0) {
      layer.filters = filters
    }
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
    // DisplacementFilter also sets renderable=false; keep it in the tree for sampling.
    this.addChild(sprite)
    this.displacementSprite = sprite

    try {
      this.layersRoot.filters = [new PIXI.DisplacementFilter({ sprite, scale: 14 })]
    } catch (e) {
      console.warn('MountainCloudOverlay: DisplacementFilter unavailable', e)
    }
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
    // Mask the wrapper, not the displacement node — Pixi v8 drops filtered
    // content when mask + filters share the same container.
    this.maskedBank.mask = mask
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
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.45, 'rgba(255,255,255,1)')
    grad.addColorStop(0.7, 'rgba(255,255,255,0.45)')
    grad.addColorStop(0.88, 'rgba(255,255,255,0.12)')
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
