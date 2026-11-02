export type QuestionMediaPixelSize = {
  width: number
  height: number
}

export type QuestionImageFallbackSlot = {
  /** Fraction of the canvas (0–1). */
  top: number
  left: number
  width: number
  height: number
}

const PLACEHOLDER_SUFFIX = '/placeholder.webp'

export function isPlaceholderQuestionImage(
  imageUrl: string | null | undefined
): boolean {
  if (typeof imageUrl !== 'string') return true
  const trimmed = imageUrl.trim()
  if (!trimmed) return true
  return trimmed.endsWith(PLACEHOLDER_SUFFIX)
}

/** Giphy CDN or a .gif URL — HTML <img> can animate these; Pixi fetch often cannot on iOS. */
export function isAnimatedQuestionImageUrl(
  imageUrl: string | null | undefined
): boolean {
  if (typeof imageUrl !== 'string') return false
  const trimmed = imageUrl.trim()
  if (!trimmed) return false
  if (/\.gif($|\?)/i.test(trimmed)) return true
  return /(?:^|\.)giphy\.com\//i.test(trimmed)
}

/**
 * Read display size without treating texture.orig.width === 0 as “real”.
 * `0 ?? sprite.width` is 0, which hid GIFs on tablets after layout.
 */
export function questionMediaPixelSize(
  media:
    | {
        width?: number
        height?: number
        texture?: { orig?: { width?: number; height?: number } | null } | null
      }
    | null
    | undefined
): QuestionMediaPixelSize {
  if (!media) return { width: 0, height: 0 }
  const origW = media.texture?.orig?.width ?? 0
  const origH = media.texture?.orig?.height ?? 0
  const width = origW > 0 ? origW : Number(media.width) || 0
  const height = origH > 0 ? origH : Number(media.height) || 0
  return { width, height }
}

export function isPixiQuestionMediaReady(
  media: { visible?: boolean } | null | undefined,
  pixelSize: QuestionMediaPixelSize
): boolean {
  if (!media) return false
  if (media.visible === false) return false
  return pixelSize.width > 0 && pixelSize.height > 0
}

export function isCoarsePointerDevice(
  matchMedia: ((query: string) => { matches: boolean }) | undefined = globalThis.matchMedia
): boolean {
  if (typeof matchMedia !== 'function') return false
  try {
    return matchMedia('(pointer: coarse)').matches
  } catch {
    return false
  }
}

/**
 * Use the generation-style HTML <img> when Pixi has nothing to show, or on
 * tablets (coarse pointer) for GIF/Giphy URLs even if a sprite exists.
 */
export function needsHtmlQuestionImageFallback(options: {
  imageUrl: string | null | undefined
  pixiReady: boolean
  preferHtmlForAnimated: boolean
}): boolean {
  if (isPlaceholderQuestionImage(options.imageUrl)) return false
  if (!options.pixiReady) return true
  if (options.preferHtmlForAnimated && isAnimatedQuestionImageUrl(options.imageUrl)) {
    return true
  }
  return false
}

export function mediaBoundsToSlot(
  bounds: { x: number; y: number; width: number; height: number } | null | undefined,
  screen: { width: number; height: number }
): QuestionImageFallbackSlot | null {
  if (!bounds || screen.width <= 0 || screen.height <= 0) return null
  if (bounds.width <= 0 || bounds.height <= 0) return null
  return {
    top: bounds.y / screen.height,
    left: bounds.x / screen.width,
    width: bounds.width / screen.width,
    height: bounds.height / screen.height,
  }
}
