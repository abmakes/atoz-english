import { describe, expect, it } from 'vitest'
import {
  isAnimatedQuestionImageUrl,
  isCoarsePointerDevice,
  isPlaceholderQuestionImage,
  isPixiQuestionMediaReady,
  mediaBoundsToSlot,
  needsHtmlQuestionImageFallback,
  questionMediaPixelSize,
} from '@/lib/pixi-engine/game/questionImageFallback'

describe('questionImageFallback', () => {
  it('treats Giphy and .gif URLs as animated, and placeholders as empty', () => {
    expect(
      isAnimatedQuestionImageUrl(
        'https://media3.giphy.com/media/abc/giphy.gif?cid=x&rid=giphy.gif'
      )
    ).toBe(true)
    expect(isAnimatedQuestionImageUrl('https://i.giphy.com/abc123.gif')).toBe(
      true
    )
    expect(
      isAnimatedQuestionImageUrl(
        'https://blob.vercel-storage.com/question-images/cat.webp'
      )
    ).toBe(false)
    expect(isPlaceholderQuestionImage('/images/placeholder.webp')).toBe(true)
    expect(isPlaceholderQuestionImage('  ')).toBe(true)
    expect(isPlaceholderQuestionImage(undefined)).toBe(true)
  })

  it('does not treat texture.orig.width of 0 as a real size', () => {
    expect(
      questionMediaPixelSize({
        width: 320,
        height: 240,
        texture: { orig: { width: 0, height: 0 } },
      })
    ).toEqual({ width: 320, height: 240 })
    expect(
      questionMediaPixelSize({
        width: 0,
        height: 0,
        texture: { orig: { width: 480, height: 270 } },
      })
    ).toEqual({ width: 480, height: 270 })
    expect(questionMediaPixelSize(null)).toEqual({ width: 0, height: 0 })
  })

  it('falls back to HTML when Pixi media is missing or zero-size', () => {
    const giphy =
      'https://media.giphy.com/media/abc/giphy-downsized.gif'
    expect(
      needsHtmlQuestionImageFallback({
        imageUrl: giphy,
        pixiReady: false,
        preferHtmlForAnimated: false,
      })
    ).toBe(true)
    expect(
      needsHtmlQuestionImageFallback({
        imageUrl: giphy,
        pixiReady: true,
        preferHtmlForAnimated: false,
      })
    ).toBe(false)
    expect(
      needsHtmlQuestionImageFallback({
        imageUrl: giphy,
        pixiReady: true,
        preferHtmlForAnimated: true,
      })
    ).toBe(true)
    expect(
      needsHtmlQuestionImageFallback({
        imageUrl: '/images/placeholder.webp',
        pixiReady: false,
        preferHtmlForAnimated: true,
      })
    ).toBe(false)
  })

  it('reports coarse pointers and converts media bounds to a canvas slot', () => {
    expect(isCoarsePointerDevice(() => ({ matches: true }))).toBe(true)
    expect(isCoarsePointerDevice(() => ({ matches: false }))).toBe(false)
    expect(isCoarsePointerDevice(undefined)).toBe(false)
    expect(
      isPixiQuestionMediaReady({ visible: true }, { width: 10, height: 10 })
    ).toBe(true)
    expect(
      isPixiQuestionMediaReady({ visible: false }, { width: 10, height: 10 })
    ).toBe(false)
    expect(
      mediaBoundsToSlot(
        { x: 40, y: 20, width: 400, height: 200 },
        { width: 800, height: 400 }
      )
    ).toEqual({ top: 0.05, left: 0.05, width: 0.5, height: 0.5 })
  })
})
