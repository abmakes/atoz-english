export const LESSON_IMAGE_MAX_BYTES = 8 * 1024 * 1024
export const LESSON_IMAGE_ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

export type LessonImageValidationResult =
  | { ok: true }
  | { ok: false; error: string }

export function validateLessonImageFile(input: {
  type: string
  size: number
}): LessonImageValidationResult {
  if (
    !(LESSON_IMAGE_ALLOWED_MIME as readonly string[]).includes(input.type)
  ) {
    return {
      ok: false,
      error: 'Only PNG, JPEG, and WebP images are supported.',
    }
  }

  if (input.size <= 0 || input.size > LESSON_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      error: 'Image must be between 1 byte and 8 MB.',
    }
  }

  return { ok: true }
}
