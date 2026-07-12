/**
 * Ensures a CSS font family is available before Pixi text renders with it.
 */
export async function ensureFontIsLoaded(
  fontFamily: string,
  descriptor: string = '28px'
): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) {
    console.warn(`[ensureFontIsLoaded] document.fonts API not available. Skipping check for ${fontFamily}.`)
    return
  }

  const fontToCheck = `${descriptor} ${fontFamily}`
  try {
    await document.fonts.load(fontToCheck)
    if (document.fonts.check(fontToCheck)) {
      console.log(`[ensureFontIsLoaded] Font "${fontFamily}" is available.`)
    } else {
      console.warn(
        `[ensureFontIsLoaded] Font "${fontFamily}" loaded but check failed. Rendering may use fallback.`
      )
    }
  } catch (error) {
    console.error(`[ensureFontIsLoaded] Error loading font "${fontFamily}":`, error)
  }
}
