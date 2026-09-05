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
  // Ninja Climb (critical sprites)
  'public/images/ninja-climb/ninja_blue_idle.webp',
  'public/images/ninja-climb/ninja_red_idle.webp',
  'public/images/ninja-climb/ninja_blue_idle_b.webp',
  'public/images/ninja-climb/ninja_red_idle_b.webp',
  'public/images/ninja-climb/ninja_blue_climb.png',
  'public/images/ninja-climb/ninja_red_climb.png',
  'public/images/ninja-climb/sky.webp',
  'public/images/ninja-climb/cliff_foot.webp',
  'public/images/ninja-climb/cliff_mid_brown.webp',
  'public/images/ninja-climb/cliff_mid_tone_a.webp',
  'public/images/ninja-climb/cliff_mid_tone_b.webp',
  'public/images/ninja-climb/cliff_top.webp',
  'public/images/ninja-climb/cliff_a.webp',
  'public/images/ninja-climb/cliff_b.webp',
  'public/images/ninja-climb/cliff_c.webp',
  'public/images/ninja-climb/plateau_1.webp',
  'public/images/ninja-climb/plateau_2.webp',
  'public/images/ninja-climb/plateau_3.webp',
  'public/images/ninja-climb/summit.webp',
  'public/images/ninja-climb/icon_teleport.png',
  'public/images/ninja-climb/icon_rope.png',
  'public/images/ninja-climb/icon_smoke.png',
  'public/images/shared/kunai_tip.png',
  'public/images/shared/rope_segment.png',
  'public/images/marketing/ninjaclimb_thumb.png',
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
