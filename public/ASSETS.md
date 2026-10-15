# Public Assets

> Hub: [CONTEXT.md](../CONTEXT.md)

Game and UI assets live under `public/` and are served statically by Next.js.

## Strategy

- **Commit gameplay-critical assets** (audio, splash-dash sprites, theme backgrounds, fonts) to this repo so CI and local clones work without a CDN.
- Large optional media may later move to Vercel Blob or a CDN; if so, update the manifest in `scripts/verify-assets.mjs` and this doc.
- Prefer stable filenames referenced by code. Do not rename without updating `GameContainer`, theme CSS, and the verify script.

## Required assets (CI-checked)

| Path | Used by |
|------|---------|
| `audio/default/*.mp3` | PixiEngine / GameContainer audio config |
| `images/default/bg_image.webp` | Default theme |
| `images/dark/bg_image.webp` | Dark theme |
| `images/forest/bg_image.webp` | Forest theme |
| `images/placeholder.webp` | Quiz/question fallbacks |
| `images/splash-dash/crate_5_4.png` | Splash Dash crates |
| `images/splash-dash/capy_spritesheet.png` | Splash Dash players |
| `images/tug-of-war/arena-backdrop.webp`, `rope-strip.webp`, `ninja-{blue,red}-{pull,cheer,fallen}.webp` | Tug of War painted stage (`tugArt.ts`) |
| `fonts/GrandstanderVF.ttf` | Game UI font |
| `fonts/InclusiveSansVF.ttf` | Game UI font |
| `quiz_template.csv` | CSV quiz upload template |

## Splash Dash notes

- Crate texture path is **`/images/splash-dash/crate_5_4.png`** (not `crate_square.png`).
- Optional extras (e.g. `crate_square.png`) may exist for prototyping but are not referenced by production code.

## Tug of War notes

- The arena plate is 1920×1080 and maps to the 16×9 world-unit stage; the feet line (`TUG_FEET_Y`) is measured on this painting, so repainting the ground means re-measuring it.
- Red ninjas are the blue art hue-shifted and mirrored. Every pose shares one 700×640 canvas and feet anchor — see [TUG_OF_WAR_NINJA_ASSET_SPEC.md](../project_docs/TUG_OF_WAR_NINJA_ASSET_SPEC.md).
- `avatar-{blue,red}.webp` are reserved for the team banners and are not CI-checked yet.

## Verify locally

```bash
npm run verify-assets
```
