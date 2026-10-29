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
  'public/images/sentence-builder/maya-apple.jpg',
  'public/images/sentence-builder/leo-bike.jpg',
  'public/images/sentence-builder/sara-book.jpg',
  'public/images/sentence-builder/omar-cook.jpg',
  'public/images/sentence-builder/kids-soccer.jpg',
  'public/images/sentence-builder/nina-water.jpg',
  'public/images/sentence-builder/ben-letter.jpg',
  'public/images/sentence-builder/ms-lee-class.jpg',
  'public/images/sentence-builder/ami-sleep.jpg',
  'public/images/sentence-builder/kai-run.jpg',
  'public/images/sentence-builder/lena-car.jpg',
  'public/images/sentence-builder/paulo-dishes.jpg',
  'public/images/sentence-builder/twins-draw.jpg',
  'public/images/sentence-builder/noah-guitar.jpg',
  'public/images/sentence-builder/hana-teeth.jpg',
  'public/images/sentence-builder/family-breakfast.jpg',
  'public/images/sentence-builder/sam-dog.jpg',
  'public/images/sentence-builder/lina-swim.jpg',
  'public/images/sentence-builder/jo-dance.jpg',
  'public/images/sentence-builder/eli-door.jpg',
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
