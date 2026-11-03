import { describe, expect, it } from 'vitest'
import { blinkFrame, mouthFrameIndex, stepAmplitude } from '@/lib/thoughts/animation'
import { classCanWatch, submissionsAccepted } from '@/lib/thoughts/access'
import {
  addCatalogPart,
  assembleRandomFace,
  normalizeCharacter,
  sanitizeBackground,
} from '@/lib/thoughts/character'
import { getPart, partsIn } from '@/lib/thoughts/catalog'
import { characterSchema } from '@/lib/thoughts/schemas'
import { resolveVoiceEffect } from '@/lib/thoughts/voices'

describe('mouth frames', () => {
  it('maps a loud level to the last frame', () => {
    expect(mouthFrameIndex(1)).toBe(4)
  })

  it('uses the closed frame for silence and bad numbers', () => {
    expect(mouthFrameIndex(0)).toBe(0)
    expect(mouthFrameIndex(Number.NaN)).toBe(0)
    const quiet = stepAmplitude(0, 0.02)
    expect(quiet.level).toBe(0)
    expect(mouthFrameIndex(quiet.level)).toBe(0)
  })

  it('eases upward instead of jumping on the first loud sample', () => {
    const first = stepAmplitude(0, 1)
    expect(first.level).toBeGreaterThan(0)
    expect(first.level).toBeLessThan(0.5)
  })
})

describe('blinks', () => {
  it('stays open when reduced motion is on', () => {
    expect(blinkFrame(10_000, 'eye-a', true)).toBe(0)
  })

  it('leaves the rest frame during the blink', () => {
    let blinked = false
    for (let time = 0; time < 8000; time += 10) {
      if (blinkFrame(time, 'eye-a', false) !== 0) blinked = true
    }
    expect(blinked).toBe(true)
  })
})

describe('characters', () => {
  it('starts with a head, two eyes, and a mouth', () => {
    let n = 0
    const face = assembleRandomFace(() => 0.2, () => `instance-${String(++n).padStart(8, '0')}`)
    const categories = face.parts.map((part) => getPart(part.partId)?.category)
    expect(categories.filter((category) => category === 'head')).toHaveLength(1)
    expect(categories.filter((category) => category === 'eyes')).toHaveLength(2)
    expect(categories.filter((category) => category === 'mouth')).toHaveLength(1)
    expect(categories.some((category) => category === 'hair' || category === 'ears' || category === 'nose')).toBe(false)
    expect(characterSchema.parse(face).parts).toHaveLength(4)
  })

  it('puts the unmirrored eye and ear on the right', () => {
    let n = 0
    const face = assembleRandomFace(() => 0.2, () => `instance-${String(++n).padStart(8, '0')}`)
    const eyes = face.parts.filter((part) => getPart(part.partId)?.category === 'eyes')
    expect(eyes.find((part) => part.x < 0.5)?.mirror).toBe(true)
    expect(eyes.find((part) => part.x > 0.5)?.mirror).toBe(false)

    const ear = partsIn('ears', 'cartoon')[0]
    const added = addCatalogPart(face, ear.id, () => `instance-${String(++n).padStart(8, '0')}`)
    expect('character' in added).toBe(true)
    if (!('character' in added)) return
    const ears = added.character.parts.filter((part) => part.partId === ear.id)
    expect(ears.find((part) => part.x < 0.5)?.mirror).toBe(true)
    expect(ears.find((part) => part.x > 0.5)?.mirror).toBe(false)
  })

  it('places new hair large enough to sit on the head', () => {
    let n = 0
    const face = assembleRandomFace(() => 0.2, () => `instance-${String(++n).padStart(8, '0')}`)
    const hair = partsIn('hair', 'cartoon')[0]
    const added = addCatalogPart(face, hair.id, () => `instance-${String(++n).padStart(8, '0')}`)
    expect('character' in added).toBe(true)
    if (!('character' in added)) return
    const placed = added.character.parts.find((part) => part.partId === hair.id)
    expect(placed?.scale).toBeGreaterThanOrEqual(0.85)
  })

  it('keeps a resized photo and rejects a remote picture', () => {
    let n = 0
    const face = assembleRandomFace(() => 0.2, () => `instance-${String(++n).padStart(8, '0')}`)
    const photo = `data:image/jpeg;base64,${'A'.repeat(32)}`
    expect(sanitizeBackground(photo)).toBe(photo)
    expect(characterSchema.parse({ ...face, background: photo }).background).toBe(photo)
    expect(characterSchema.safeParse({ ...face, background: 'https://example.com/photo.jpg' }).success).toBe(false)
    expect(characterSchema.parse({ ...face, background: photo, photoMode: 'face' }).photoMode).toBe('face')
    expect(normalizeCharacter({ ...face, background: photo, photoMode: 'face' }).photoMode).toBe('face')
    expect(normalizeCharacter({ ...face, photoMode: 'face' }).photoMode).toBeUndefined()
    expect(normalizeCharacter({ ...face, backdrop: 'sunset' }).backdrop).toBe('sunset')
    expect(normalizeCharacter({ ...face, backdrop: 'white' }).backdrop).toBeUndefined()
    expect(normalizeCharacter({ ...face, backdrop: 'nope' }).backdrop).toBeUndefined()
    const masked = normalizeCharacter({
      ...face,
      background: photo,
      photoMode: 'face',
      faceMask: 'square',
    })
    expect(masked.faceMask).toBe('square')
    expect(characterSchema.safeParse({ ...face, backdrop: 'plaid' }).success).toBe(false)
  })

  it('rejects an unknown sticker', () => {
    let n = 0
    const face = assembleRandomFace(() => 0.2, () => `instance-${String(++n).padStart(8, '0')}`)
    face.parts[1] = { ...face.parts[1], partId: 'not-a-part' }
    expect(characterSchema.safeParse(face).success).toBe(false)
  })

  it('stops adding eyes past the cap', () => {
    let face = assembleRandomFace(() => 0.2, (() => {
      let n = 0
      return () => `instance-${String(++n).padStart(8, '0')}`
    })())
    const eyeId = face.parts.find((part) => getPart(part.partId)?.category === 'eyes')?.partId
    expect(eyeId).toBeTruthy()
    const again = addCatalogPart(face, eyeId!, () => 'instance-extra1')
    expect('character' in again).toBe(true)
    if (!('character' in again)) return
    face = again.character
    const blocked = addCatalogPart(face, eyeId!, () => 'instance-extra2')
    expect(blocked).toEqual({ error: 'That is enough of those.' })
  })
})

describe('class access', () => {
  it('shows a clip only when the class link is open, the gallery is on, and the clip is approved', () => {
    expect(classCanWatch({
      challengeStatus: 'READY',
      showGallery: true,
      submissionStatus: 'APPROVED',
    })).toBe(true)
    expect(classCanWatch({
      challengeStatus: 'READY',
      showGallery: true,
      submissionStatus: 'SUBMITTED',
    })).toBe(false)
    expect(classCanWatch({
      challengeStatus: 'READY',
      showGallery: false,
      submissionStatus: 'APPROVED',
    })).toBe(false)
    expect(classCanWatch({
      challengeStatus: 'ARCHIVED',
      showGallery: true,
      submissionStatus: 'APPROVED',
    })).toBe(false)
  })

  it('closes recording without hiding an open gallery', () => {
    expect(submissionsAccepted('READY', false)).toBe(false)
    expect(submissionsAccepted('READY', true)).toBe(true)
    expect(submissionsAccepted('DRAFT', true)).toBe(false)
  })

  it('stores funny voices as original when the teacher turns them off', () => {
    expect(resolveVoiceEffect('robot', false)).toBe('original')
    expect(resolveVoiceEffect('tiny-alien', true)).toBe('tiny-alien')
  })
})
