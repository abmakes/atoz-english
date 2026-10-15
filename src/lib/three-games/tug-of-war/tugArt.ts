import type { TugSide } from './tugOfWarLogic'

/**
 * Static art for the painted Tug of War stage (see public/ASSETS.md). Kept
 * free of Three imports so React HUD components can share the avatar URLs.
 */
const BASE = '/images/tug-of-war'

export const TUG_ART = {
  backdrop: `${BASE}/arena-backdrop.webp`,
  ropeStrip: `${BASE}/rope-strip.webp`,
  ninjas: {
    blue: {
      pull: `${BASE}/ninja-blue-pull.webp`,
      cheer: `${BASE}/ninja-blue-cheer.webp`,
      fallen: `${BASE}/ninja-blue-fallen.webp`,
    },
    red: {
      pull: `${BASE}/ninja-red-pull.webp`,
      cheer: `${BASE}/ninja-red-cheer.webp`,
      fallen: `${BASE}/ninja-red-fallen.webp`,
    },
  },
  avatars: {
    blue: `${BASE}/avatar-blue.webp`,
    red: `${BASE}/avatar-red.webp`,
  },
} as const satisfies {
  backdrop: string
  ropeStrip: string
  ninjas: Record<TugSide, Record<'pull' | 'cheer' | 'fallen', string>>
  avatars: Record<TugSide, string>
}
