import {
  blinkFrame,
  idleBobPx,
  mouthFrameIndex,
} from '@/lib/thoughts/animation'
import {
  getPart,
  getSheet,
  type CatalogPart,
  type FrameRect,
} from '@/lib/thoughts/catalog'
import type { Character, PlacedPart } from '@/lib/thoughts/character'

export function partFrame(
  part: CatalogPart,
  amplitude: number,
  nowMs: number,
  instanceId: string,
  reducedMotion: boolean
): FrameRect {
  if (part.animation === 'mouth') {
    const index = mouthFrameIndex(amplitude, part.frames.length)
    return part.frames[Math.min(index, part.frames.length - 1)] ?? part.frames[0]
  }
  if (part.animation === 'eyes') {
    const index = blinkFrame(nowMs, instanceId, reducedMotion)
    return part.frames[Math.min(index, part.frames.length - 1)] ?? part.frames[0]
  }
  return part.frames[0]
}

export function partPixelSize(frame: FrameRect, scale: number, stage: number): {
  width: number
  height: number
} {
  const width = Math.max(1, scale * stage)
  const height = width * (frame.height / Math.max(1, frame.width))
  return { width, height }
}

export function orderedParts(character: Character): PlacedPart[] {
  return [...character.parts].sort((a, b) => {
    const layerA = getPart(a.partId)?.layer ?? 0
    const layerB = getPart(b.partId)?.layer ?? 0
    return layerA - layerB
  })
}

export function hitTestPart(
  character: Character,
  x: number,
  y: number,
  stage: number,
  bob: number
): PlacedPart | null {
  const frontFirst = orderedParts(character).reverse()
  for (const part of frontFirst) {
    const definition = getPart(part.partId)
    if (!definition) continue
    const frame = definition.frames[0]
    const { width, height } = partPixelSize(frame, part.scale, stage)
    const dx = x - part.x * stage
    const dy = y - bob - part.y * stage
    const rad = (-part.rotation * Math.PI) / 180
    const localX = dx * Math.cos(rad) - dy * Math.sin(rad)
    const localY = dx * Math.sin(rad) + dy * Math.cos(rad)
    if (Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2) return part
  }
  return null
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  character: Character,
  images: Map<string, CanvasImageSource>,
  options: {
    stage: number
    amplitude: number
    nowMs: number
    reducedMotion: boolean
    selectedId?: string | null
  }
): void {
  const bob = idleBobPx(options.nowMs, options.reducedMotion)
  ctx.clearRect(0, 0, options.stage, options.stage)
  ctx.save()
  ctx.translate(0, bob)
  for (const part of orderedParts(character)) {
    const definition = getPart(part.partId)
    if (!definition) continue
    const sheet = getSheet(definition.sheet)
    const image = sheet ? images.get(sheet.src) : undefined
    if (!image) continue
    const frame = partFrame(
      definition,
      options.amplitude,
      options.nowMs,
      part.instanceId,
      options.reducedMotion
    )
    const { width, height } = partPixelSize(frame, part.scale, options.stage)
    ctx.save()
    ctx.translate(part.x * options.stage, part.y * options.stage)
    ctx.rotate((part.rotation * Math.PI) / 180)
    if (part.mirror) ctx.scale(-1, 1)
    ctx.drawImage(
      image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      -width * definition.pivot.x,
      -height * definition.pivot.y,
      width,
      height
    )
    if (options.selectedId === part.instanceId) {
      ctx.strokeStyle = '#7c3aed'
      ctx.lineWidth = 3
      ctx.strokeRect(-width / 2, -height / 2, width, height)
    }
    ctx.restore()
  }
  ctx.restore()
}
