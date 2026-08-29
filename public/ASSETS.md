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
| `images/ninja-climb/ninja_blue_idle.webp` | Ninja Climb blue team |
| `images/ninja-climb/ninja_red_idle.webp` | Ninja Climb red team |
| `images/ninja-climb/ninja_blue_idle_b.webp` | Ninja Climb blue idle pose B |
| `images/ninja-climb/ninja_red_idle_b.webp` | Ninja Climb red idle pose B |
| `images/ninja-climb/sky.webp` | Ninja Climb sky |
| `images/ninja-climb/cliff_a.webp` | Ninja Climb cliff tile A |
| `images/ninja-climb/summit.webp` | Ninja Climb summit tile |
| `images/shared/kunai_tip.png` | Shared rope projectile tip |
| `images/shared/rope_segment.png` | Shared rope body tile |
| `images/marketing/ninjaclimb_thumb.png` | Mode picker thumbnail |
| `fonts/GrandstanderVF.ttf` | Game UI font |
| `fonts/InclusiveSansVF.ttf` | Game UI font |
| `quiz_template.csv` | CSV quiz upload template |

## Splash Dash notes

- Crate texture path is **`/images/splash-dash/crate_5_4.png`** (not `crate_square.png`).
- Optional extras (e.g. `crate_square.png`) may exist for prototyping but are not referenced by production code.

## Ninja Climb notes

- Character strips: `ninja_{blue|red}_idle.webp` / `idle_b.webp` (2 frames each), `ninja_{blue|red}_climb.png` (4 frames), `ninja_{blue|red}_rope.webp` (action).
- Mountain tiles: `cliff_{a|b|c}.webp`, `plateau_{1|2|3}.webp`, `summit.webp` (transparent; no band_* art).
- UI: procedural `AnswerCloudShape` for sky answers; `deco_{tree|bush|hut}.webp` for sparse ledge props.
- Shared rope VFX: `images/shared/kunai_tip.png`, `images/shared/rope_segment.png` (used by `RopeProjectile`).
- Mode picker thumb: `public/images/marketing/ninjaclimb_thumb.png`.

## Verify locally

```bash
npm run verify-assets
```
