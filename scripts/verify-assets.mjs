/**
 * Verifies that required public assets referenced by the game engine exist.
 * Used in CI and locally via `npm run verify-assets`.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const REQUIRED_ASSETS = [
  // Audio (default theme)
  'public/audio/default/correct-sound.mp3',
  'public/audio/default/incorrect-sound.mp3',
  'public/audio/default/crowd-cheering.mp3',
  'public/audio/default/background-music.mp3',
  // Theme backgrounds
  'public/images/default/bg_image.webp',
  'public/images/dark/bg_image.webp',
  'public/images/forest/bg_image.webp',
  'public/images/placeholder.webp',
  // Splash Dash
  'public/images/splash-dash/crate_5_4.png',
  'public/images/splash-dash/crate_square.png',
  'public/images/splash-dash/capy_spritesheet.png',
  // Tug of War painted stage (see src/lib/three-games/tug-of-war/tugArt.ts)
  'public/images/tug-of-war/arena-backdrop.webp',
  'public/images/tug-of-war/rope-strip.webp',
  'public/images/tug-of-war/ninja-blue-pull.webp',
  'public/images/tug-of-war/ninja-blue-cheer.webp',
  'public/images/tug-of-war/ninja-blue-fallen.webp',
  'public/images/tug-of-war/ninja-red-pull.webp',
  'public/images/tug-of-war/ninja-red-cheer.webp',
  'public/images/tug-of-war/ninja-red-fallen.webp',
  // Fonts
  'public/fonts/GrandstanderVF.ttf',
  'public/fonts/InclusiveSansVF.ttf',
  // Template
  'public/quiz_template.csv',
]

const root = process.cwd()
const missing = REQUIRED_ASSETS.filter((rel) => !existsSync(join(root, rel)))

if (missing.length > 0) {
  console.error('Missing required assets:')
  for (const path of missing) {
    console.error(`  - ${path}`)
  }
  console.error('\nSee public/ASSETS.md for the asset strategy.')
  process.exit(1)
}

console.log(`All ${REQUIRED_ASSETS.length} required assets present.`)
