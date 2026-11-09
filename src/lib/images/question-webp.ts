/** Longest edge kept for a question photo so classroom play stays light. */
export const QUESTION_IMAGE_MAX_EDGE = 1280
export const QUESTION_IMAGE_MAX_BYTES = 8 * 1024 * 1024
export const QUESTION_IMAGE_WEBP_QUALITY = 0.8

export function scaledImageSize(
  width: number,
  height: number,
  maxEdge = QUESTION_IMAGE_MAX_EDGE
): { width: number; height: number } {
  const safeWidth = Math.max(1, Math.round(width))
  const safeHeight = Math.max(1, Math.round(height))
  const longest = Math.max(safeWidth, safeHeight)
  if (longest <= maxEdge) {
    return { width: safeWidth, height: safeHeight }
  }
  const scale = maxEdge / longest
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  }
}

export function isWebpBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false
  const riff =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  const webp =
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  return riff && webp
}
