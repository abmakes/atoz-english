const MAX_EDGE = 720
const MAX_DATA_URL = 400_000

/**
 * Shrink a camera or uploaded picture so it can sit behind the face
 * and travel with the submission without a multi-megabyte payload.
 */
export async function photoFileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not read that picture.')
    ctx.drawImage(bitmap, 0, 0, width, height)
    let quality = 0.82
    let url = canvas.toDataURL('image/jpeg', quality)
    while (url.length > MAX_DATA_URL && quality > 0.5) {
      quality -= 0.12
      url = canvas.toDataURL('image/jpeg', quality)
    }
    if (url.length > MAX_DATA_URL) throw new Error('That picture is too large.')
    return url
  } finally {
    bitmap.close()
  }
}
