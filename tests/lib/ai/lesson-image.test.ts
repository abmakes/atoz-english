import { describe, expect, it } from 'vitest'
import { validateLessonImageFile } from '@/lib/ai/lesson-image'

describe('lesson image validation', () => {
  it('accepts png/jpeg/webp under 8 MB', () => {
    expect(validateLessonImageFile({ type: 'image/png', size: 1024 }).ok).toBe(true)
    expect(validateLessonImageFile({ type: 'image/jpeg', size: 1024 }).ok).toBe(true)
    expect(validateLessonImageFile({ type: 'image/webp', size: 1024 }).ok).toBe(true)
  })

  it('rejects unsupported types and oversized files', () => {
    expect(validateLessonImageFile({ type: 'image/gif', size: 1024 }).ok).toBe(false)
    expect(
      validateLessonImageFile({ type: 'image/png', size: 9 * 1024 * 1024 }).ok
    ).toBe(false)
    expect(validateLessonImageFile({ type: 'image/png', size: 0 }).ok).toBe(false)
  })
})
