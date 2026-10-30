# Thoughts facial asset pack

Generated 2026-10-30 with the built-in image_gen tool. Original generated art, not photographs of identifiable people. Exact prompts: `generation-prompts.json`. No runtime face generation.

## Contents

- 12 talking mouths: 4 photo cutouts, 4 cartoons, 4 pencil sketches; 5 amplitude frames each.
- 12 blinking single eyes: 4 per style; 4 blink frames each.
- 60 static accessories: each style has 5 hair pieces, 5 single ears, 5 noses, and 5 extras (glasses, hat, bow, mustache, eyebrow).
- 4 blank head bases: potato, toast, moon, robot.
- Total: 88 selectable parts, 172 frames, 10 transparent PNG atlases.

All parts are available immediately. Make eye or ear pairs with two placements and horizontal mirroring, or mix styles.

## Files and rendering

For each of `photo`, `cartoon`, `sketch`, `STYLE-mouths.png` has four identities in rows and five increasing-openness poses in columns. `STYLE-eyes.png` has four identities in rows and open / half / shut / half in columns. `STYLE-parts.png` has hair, ears, noses, extras in rows, five choices per row. `heads.png` has potato / toast above moon / robot.

`manifest.json` contains stable IDs, actual sheet dimensions, per-frame pixel rectangles, categories, styles, layers, mirroring support, default placements, and animation metadata. PNG originals are unchanged. These are atlases rather than one image per part.

Use explicit frame rectangles, not fixed tile assumptions: generated spacing is not perfectly uniform. Render with `drawImage(image, frame.x, frame.y, frame.width, frame.height, dx, dy, width, height)`, preserving aspect ratio and centering around the normalized pivot. Avoid independently trimming animation frames. Generated frames have natural shape variation; assess playback at the intended display size during integration.

Mouth selector: `Math.round(Math.max(0, Math.min(1, amplitude)) * 4)`. Sanitize non-finite amplitude to zero. Silence uses frame 0; smooth amplitude before selection.

Blink: rest on frame 0 for a random 2400–5200 ms; then frames 1, 2, 3, 0 for 60, 70, 60, 90 ms respectively. Blink independently from speech and honor reduced-motion preferences.

Layer order: ears, head, hair, eyes, nose, mouth, extras. Photo glasses have frosted-looking lenses. Each placed instance needs a distinct ID, normalized placement, scale, rotation, and optional horizontal mirroring.

Sketch straight-line, smile-line, and zigzag mouths are animated presets. An arbitrary student-drawn line opening into a mouth requires a separate procedural renderer. This pack does not implement the Thoughts UI, recording flow, or that renderer.

## Validation

Run `node scripts/build-thoughts-asset-manifest.mjs` from the repository root (uses installed `sharp`). The script reads pixels without changing PNGs, finds nearby gutters, and checks transparency, nonempty frames, frame bounds, and unique IDs. Sheets were visually inspected for content and frame order; they are not pixel-perfect hand-rigged animation.
