import {
  QUESTION_IMAGE_MAX_BYTES,
  QUESTION_IMAGE_WEBP_QUALITY,
  scaledImageSize,
} from '@/lib/images/question-webp'

const SOURCE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export interface SavedQuestionImage {
  imageUrl: string
  imageFile: File | null
}

export function assertPastableImage(file: File): string | null {
  const type = file.type.toLowerCase()
  if (!SOURCE_TYPES.includes(type) && !type.startsWith('image/')) {
    return 'Please paste a PNG, JPEG, or WebP image.'
  }
  if (file.size <= 0 || file.size > QUESTION_IMAGE_MAX_BYTES) {
    return 'Image must be 8 MB or smaller.'
  }
  return null
}

export async function encodeImageFileAsWebp(
  file: File
): Promise<{ file: File; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  try {
    const size = scaledImageSize(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not prepare the image.')
    }
    context.drawImage(bitmap, 0, 0, size.width, size.height)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (result) => resolve(result),
        'image/webp',
        QUESTION_IMAGE_WEBP_QUALITY
      )
    })
    if (!blob) {
      throw new Error('This browser could not save the image as WebP.')
    }
    return {
      file: new File([blob], `question-${Date.now()}.webp`, {
        type: 'image/webp',
      }),
      width: size.width,
      height: size.height,
    }
  } finally {
    bitmap.close()
  }
}

export async function readClipboardImage(): Promise<File | null> {
  if (!navigator.clipboard?.read) return null
  try {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      const type = item.types.find((entry) => entry.startsWith('image/'))
      if (!type) continue
      const blob = await item.getType(type)
      return new File([blob], 'pasted-image', { type: blob.type || type })
    }
  } catch {
    return null
  }
  return null
}

/**
 * Shrink a pasted photo to WebP, store it, and return the URL the question should use.
 * If storage is unavailable, the WebP file stays on the question and is uploaded on publish.
 */
export async function savePastedQuestionImage(
  source: File,
  searchTerm?: string
): Promise<SavedQuestionImage> {
  const problem = assertPastableImage(source)
  if (problem) throw new Error(problem)

  const encoded = await encodeImageFileAsWebp(source)
  const body = new FormData()
  body.append('image', encoded.file)
  body.append('width', String(encoded.width))
  body.append('height', String(encoded.height))
  if (searchTerm?.trim()) {
    body.append('searchTerm', searchTerm.trim().slice(0, 80))
  }

  try {
    const response = await fetch('/api/images/upload', {
      method: 'POST',
      body,
    })
    if (response.ok) {
      const result = (await response.json()) as {
        success?: boolean
        image?: { blobUrl?: string }
      }
      if (result.success && result.image?.blobUrl) {
        return { imageUrl: result.image.blobUrl, imageFile: null }
      }
    }
  } catch {
    // Fall through and keep the WebP on the question until publish.
  }

  return {
    imageUrl: URL.createObjectURL(encoded.file),
    imageFile: encoded.file,
  }
}
