import { describe, expect, it } from 'vitest'
import {
  isWebpBytes,
  scaledImageSize,
} from '@/lib/images/question-webp'

describe('scaledImageSize', () => {
  it('leaves small photos unchanged', () => {
    expect(scaledImageSize(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('shrinks the long edge to 1280 and keeps the ratio', () => {
    expect(scaledImageSize(2560, 1280)).toEqual({ width: 1280, height: 640 })
  })
})

describe('isWebpBytes', () => {
  it('recognizes a RIFF WebP header', () => {
    const bytes = new Uint8Array(12)
    bytes.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
    expect(isWebpBytes(bytes)).toBe(true)
  })

  it('rejects a PNG header', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(isWebpBytes(bytes)).toBe(false)
  })
})
