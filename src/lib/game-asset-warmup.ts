import { Assets } from 'pixi.js'
// Registers GifAsset before any .gif loads
import { isUsableQuestionMedia } from '@/lib/pixi-engine/assets/AssetLoader'

let assetsInitPromise: Promise<void> | null = null

/** Splash Dash scene art — keep in sync with SplashDash managers. */
export function getSplashDashSceneAssetUrls(): string[] {
  const waterFrames = Array.from({ length: 40 }, (_, i) => {
    const frameNumber = i.toString().padStart(4, '0')
    return `/images/splash-dash/water/${frameNumber}.png`
  })

  return [
    ...waterFrames,
    '/images/splash-dash/topleft.png',
    '/images/splash-dash/topright.png',
    '/images/splash-dash/bottomleft.png',
    '/images/splash-dash/bottomright.png',
    '/images/splash-dash/crate_5_4.png',
    '/images/splash-dash/crate_square.png',
    '/images/splash-dash/capy_spritesheet.png',
  ]
}

/** Score Attack theme backgrounds used by GameBackgroundManager. */
export function getScoreAttackSceneAssetUrls(): string[] {
  return [
    '/images/default/bg_image.webp',
    '/images/dark/bg_image.webp',
    '/images/forest/bg_image.webp',
  ]
}

export function extractQuestionImageUrls(
  questions: Array<{ imageUrl?: string | null } | null | undefined> | null | undefined
): string[] {
  if (!questions?.length) return []
  const urls = questions
    .map((q) => q?.imageUrl)
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
  return Array.from(new Set(urls))
}

/**
 * Ensure Pixi Assets is initialized once per tab (safe to call from React before game start).
 */
export async function ensurePixiAssetsInitialized(): Promise<void> {
  if (!assetsInitPromise) {
    assetsInitPromise = (async () => {
      try {
        await Assets.init({})
      } catch (error) {
        // Already initialized in this tab (e.g. previous game session)
        const message = error instanceof Error ? error.message : String(error)
        if (!/already initialized|initialized/i.test(message)) {
          console.warn('ensurePixiAssetsInitialized:', error)
        }
      }
    })()
  }
  await assetsInitPromise
}

export type WarmupProgress = {
  loaded: number
  total: number
  fraction: number
}

async function loadUrlsWithProgress(
  urls: string[],
  onProgress?: (progress: WarmupProgress) => void
): Promise<{ ok: number; failed: string[] }> {
  const unique = Array.from(new Set(urls.filter(Boolean)))
  if (unique.length === 0) {
    onProgress?.({ loaded: 0, total: 0, fraction: 1 })
    return { ok: 0, failed: [] }
  }

  let loaded = 0
  const failed: string[] = []
  const total = unique.length
  onProgress?.({ loaded: 0, total, fraction: 0 })

  await Promise.all(
    unique.map(async (url) => {
      try {
        await Assets.load(url)
        const cached = Assets.get(url)
        if (!cached) {
          failed.push(url)
        } else if (url.match(/\.gif($|\?)/i) && !isUsableQuestionMedia(cached)) {
          failed.push(url)
          console.error(`Warmup: GIF not displayable after load: ${url}`, cached?.constructor?.name)
        }
      } catch (error) {
        failed.push(url)
        console.warn(`Warmup: failed to load ${url}`, error)
      } finally {
        loaded += 1
        onProgress?.({ loaded, total, fraction: loaded / total })
      }
    })
  )

  return { ok: total - failed.length, failed }
}

export async function warmQuizQuestionMedia(
  imageUrls: string[],
  onProgress?: (progress: WarmupProgress) => void
): Promise<{ ok: number; failed: string[] }> {
  await ensurePixiAssetsInitialized()
  return loadUrlsWithProgress(imageUrls, onProgress)
}

export async function warmSplashDashSceneAssets(
  onProgress?: (progress: WarmupProgress) => void
): Promise<{ ok: number; failed: string[] }> {
  await ensurePixiAssetsInitialized()
  return loadUrlsWithProgress(getSplashDashSceneAssetUrls(), onProgress)
}

export async function warmScoreAttackSceneAssets(
  onProgress?: (progress: WarmupProgress) => void
): Promise<{ ok: number; failed: string[] }> {
  await ensurePixiAssetsInitialized()
  return loadUrlsWithProgress(getScoreAttackSceneAssetUrls(), onProgress)
}

/**
 * Warm question images + mode-specific scene art. Returns overall progress via callback.
 */
export async function warmGameAssets(options: {
  gameSlug: 'multiple-choice' | 'splash-dash' | string
  questionImageUrls: string[]
  onProgress?: (progress: WarmupProgress) => void
}): Promise<{ ready: boolean; failed: string[] }> {
  await ensurePixiAssetsInitialized()

  const sceneUrls =
    options.gameSlug === 'splash-dash'
      ? getSplashDashSceneAssetUrls()
      : getScoreAttackSceneAssetUrls()

  const allUrls = [...options.questionImageUrls, ...sceneUrls]
  const result = await loadUrlsWithProgress(allUrls, options.onProgress)

  // Critical failures: question media that failed (scene art soft-fails except splash-dash empty water)
  const questionFailed = result.failed.filter((url) => options.questionImageUrls.includes(url))
  const splashCriticalFailed =
    options.gameSlug === 'splash-dash'
      ? result.failed.filter((url) => sceneUrls.includes(url))
      : []

  const blocking = [...questionFailed, ...splashCriticalFailed]
  return {
    ready: blocking.length === 0,
    failed: result.failed,
  }
}
