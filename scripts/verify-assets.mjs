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
  'public/images/default/bg_image.png',
  'public/images/dark/bg_image.png',
  'public/images/forest/bg_image.png',
  'public/images/placeholder.webp',
  // Splash Dash
  'public/images/splash-dash/crate_5_4.png',
  'public/images/splash-dash/capy_spritesheet.png',
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
