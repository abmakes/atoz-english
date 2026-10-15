import * as THREE from 'three'

/** Small procedural textures for the painted stage. Browser-only (canvas). */

function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas is unavailable.')
  draw(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.premultiplyAlpha = true
  texture.needsUpdate = true
  return texture
}

export function createShadowTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 64, (ctx) => {
    ctx.translate(64, 32)
    ctx.scale(1, 0.5)
    const gradient = ctx.createRadialGradient(0, 0, 4, 0, 0, 62)
    gradient.addColorStop(0, 'rgba(58, 38, 20, 0.62)')
    gradient.addColorStop(0.55, 'rgba(58, 38, 20, 0.34)')
    gradient.addColorStop(1, 'rgba(58, 38, 20, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, 62, 0, Math.PI * 2)
    ctx.fill()
  })
}

export function createDustTexture(): THREE.CanvasTexture {
  return canvasTexture(96, 96, (ctx) => {
    const puffs: Array<[number, number, number]> = [
      [48, 54, 30],
      [32, 58, 20],
      [64, 60, 22],
      [44, 40, 18],
      [58, 44, 16],
    ]
    puffs.forEach(([x, y, r]) => {
      const gradient = ctx.createRadialGradient(x, y, 1, x, y, r)
      gradient.addColorStop(0, 'rgba(240, 222, 190, 0.85)')
      gradient.addColorStop(0.6, 'rgba(226, 202, 160, 0.45)')
      gradient.addColorStop(1, 'rgba(226, 202, 160, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    })
  })
}

export function createPetalTexture(): THREE.CanvasTexture {
  return canvasTexture(48, 48, (ctx) => {
    ctx.translate(24, 24)
    ctx.rotate(-0.5)
    const gradient = ctx.createLinearGradient(-16, 0, 16, 0)
    gradient.addColorStop(0, '#ffd6e4')
    gradient.addColorStop(1, '#f48fb1')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(-16, 0)
    ctx.bezierCurveTo(-8, -12, 10, -12, 16, -2)
    ctx.lineTo(11, 0)
    ctx.lineTo(16, 2)
    ctx.bezierCurveTo(10, 12, -8, 12, -16, 0)
    ctx.fill()
  })
}

export const TUG_FLAG_CANVAS = { widthPx: 192, heightPx: 320, topPx: 20 } as const

/**
 * Centre marker hung over the rope: split blue/red swallowtail banner with a
 * white border.
 */
export function createFlagTexture(): THREE.CanvasTexture {
  const { widthPx, heightPx, topPx: top } = TUG_FLAG_CANVAS
  return canvasTexture(widthPx, heightPx, (ctx) => {
    const left = 24
    const right = 168
    const tail = 292
    const notch = 242
    const mid = (left + right) / 2

    ctx.lineJoin = 'round'
    const outline = new Path2D()
    outline.moveTo(left, top)
    outline.lineTo(right, top)
    outline.lineTo(right, tail)
    outline.lineTo(mid, notch)
    outline.lineTo(left, tail)
    outline.closePath()

    ctx.save()
    ctx.translate(4, 6)
    ctx.fillStyle = 'rgba(20, 30, 50, 0.25)'
    ctx.fill(outline)
    ctx.restore()

    ctx.strokeStyle = 'rgba(27, 47, 77, 0.55)'
    ctx.lineWidth = 12
    ctx.stroke(outline)

    ctx.save()
    ctx.clip(outline)
    const blue = ctx.createLinearGradient(0, top, 0, tail)
    blue.addColorStop(0, '#3f78e0')
    blue.addColorStop(1, '#2350b8')
    ctx.fillStyle = blue
    ctx.fillRect(left, top, mid - left, tail - top)
    const red = ctx.createLinearGradient(0, top, 0, tail)
    red.addColorStop(0, '#ef4b4b')
    red.addColorStop(1, '#c42a2f')
    ctx.fillStyle = red
    ctx.fillRect(mid, top, right - mid, tail - top)
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
      ctx.fillRect(left + ((i * 37) % (right - left)), top, 2 + (i % 3), tail - top)
    }
    const fold = ctx.createLinearGradient(0, top, 0, top + 60)
    fold.addColorStop(0, 'rgba(255,255,255,0.3)')
    fold.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = fold
    ctx.fillRect(left, top, right - left, 60)
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(mid - 1, top, 2, tail - top)
    ctx.restore()

    ctx.strokeStyle = '#f4f7fb'
    ctx.lineWidth = 8
    ctx.stroke(outline)
  })
}

/** Soft chalk stripe for each team's win line on the dirt. */
export function createChalkTexture(tint: string): THREE.CanvasTexture {
  return canvasTexture(32, 256, (ctx) => {
    for (let y = 0; y < 256; y += 2) {
      const fade = Math.sin((y / 255) * Math.PI)
      const alpha = 0.55 * fade * (0.7 + 0.3 * Math.sin(y * 1.7))
      ctx.fillStyle = tint
      ctx.globalAlpha = Math.max(0, alpha)
      const wobble = Math.sin(y * 0.21) * 2
      ctx.fillRect(9 + wobble, y, 14, 2)
    }
    ctx.globalAlpha = 1
  })
}
