import * as THREE from 'three'

export interface ThreeWorldOptions {
  antialias?: boolean
  maxPixelRatio?: number
  clearColor?: THREE.ColorRepresentation
}

/**
 * Owns the Three scene, camera, renderer and canvas. It deliberately contains
 * no quiz or scoring logic.
 */
export class ThreeWorld {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200)
  private renderer: THREE.WebGLRenderer | null = null
  private mount: HTMLElement | null = null
  private initialized = false

  constructor(private readonly options: ThreeWorldOptions = {}) {}

  public async init(mount: HTMLElement): Promise<void> {
    if (this.initialized) {
      throw new Error('ThreeWorld is already initialized.')
    }

    this.mount = mount
    const renderer = new THREE.WebGLRenderer({
      antialias: this.options.antialias ?? true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(this.options.clearColor ?? 0xbfe9ff)

    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      this.options.maxPixelRatio ?? 1.75
    )
    renderer.setPixelRatio(pixelRatio)
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.inset = '0'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    renderer.domElement.setAttribute('aria-label', '3D quiz game')

    this.renderer = renderer
    mount.appendChild(renderer.domElement)

    const bounds = mount.getBoundingClientRect()
    this.resize(bounds.width || window.innerWidth, bounds.height || window.innerHeight)
    this.initialized = true
  }

  public resize(width: number, height: number): void {
    if (!this.renderer) return
    const safeWidth = Math.max(1, width)
    const safeHeight = Math.max(1, height)
    this.camera.aspect = safeWidth / safeHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(safeWidth, safeHeight, false)
  }

  public render(): void {
    this.renderer?.render(this.scene, this.camera)
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getRenderer(): THREE.WebGLRenderer {
    if (!this.renderer) {
      throw new Error('ThreeWorld renderer is unavailable before init().')
    }
    return this.renderer
  }

  public getCanvas(): HTMLCanvasElement {
    return this.getRenderer().domElement
  }

  public destroy(): void {
    if (!this.renderer && !this.initialized) return
    disposeObject3D(this.scene)

    if (this.renderer) {
      this.renderer.renderLists.dispose()
      this.renderer.dispose()
      this.renderer.forceContextLoss()
      this.renderer.domElement.remove()
      this.renderer = null
    }

    this.mount = null
    this.initialized = false
  }
}

/** Deterministically releases GPU-backed resources beneath an Object3D. */
export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh
    mesh.geometry?.dispose()

    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : []

    materials.forEach((material) => {
      disposeMaterialTextures(material)
      material.dispose()
    })
  })
  root.clear()
}

function disposeMaterialTextures(material: THREE.Material): void {
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) {
      value.dispose()
    }
  })
}
