# Tug of War — Ninja Asset Spec

Placeholder procedural ninjas in `src/lib/three-games/tug-of-war/NinjaActor.ts` implement these clip names in code. Commissioned GLB characters must use the **same clip names** so `NinjaActor.play(clip)` can swap from primitives to `AnimationMixer` without game-code changes.

Hub: [CONTEXT.md](../CONTEXT.md). Integration: [3D_GAME_REQUIREMENTS.md](3D_GAME_REQUIREMENTS.md).

---

## Delivery

| Item | Requirement |
|------|-------------|
| File | One GLB per ninja (or one GLB with blue/red material variants) |
| Rig | Humanoid, Y-up, meters. Root at the feet. |
| Facing | Bind pose faces **+X** (toward rope center). Red team is instanced with `rotation.y = π`. |
| Attachments | Empties named `grip_L` and `grip_R` on the palms, at rope height (~1.05 m in world when idle). |
| Scale | Chibi proportions, overall height **1.4–1.6 m**. Head : body ≈ 1 : 1.5. |
| Budget | ≤ 12k triangles, one 1k–2k atlas, no extra skeletons. |
| Materials | Team color is a material swap only (blue gi / red gi). Mask, wraps, and metal bits stay shared. |
| Export | glTF 2.0 binary, baked animations, no root motion except `victory_cheer` vertical hops (root Y only). |

Clip names are case-sensitive and must match exactly:

`idle_hold`, `pull_heave`, `strain_lose`, `stumble_slip`, `victory_cheer`, `defeat_fall`, `charge_up`

---

## Shared stance (all rope clips)

Unless a clip says the hands leave the rope:

- Feet staggered on the dirt: **front foot toward the center**, rear foot planted wide.
- Knees bent, hips dropped.
- Both hands on the rope at **chest height**. Front arm (toward center) more extended; rear arm bent with the elbow near the ribs.
- Torso leaned **away** from the rope (against the pull).
- Headband tails hang behind the head; they should have enough vertices to whip.

Blue team stands on −X; red on +X after the 180° instance.

---

## Clips

### `idle_hold` — loop, 2.0 s

Braced tug stance. Knees ~40°, torso leaned back ~15°, hands locked on the rope. Subtle breathing bob in the hips and chest (a few centimeters). Tails drift slowly. This is the default while a question is on screen.

### `pull_heave` — one-shot, 0.7 s

Triggered when **this team** answers correctly (they gain rope). Drop the hips, lean back to ~35°, drag both arms toward the hip, take **one small backward step**. Headband tails whip **forward** (toward the opponent). Settles back into `idle_hold`. The game queues idle automatically after a non-looping clip unless `holdAfter` is set.

### `strain_lose` — loop, 1.0 s

Played on the team being dragged. Torso pitched **forward** ~20° toward the rope, arms fully extended, heels skidding with stutter steps, head down. Use this while the marker is moving away from the team.

### `stumble_slip` — one-shot, 0.9 s

Triggered on **this team’s** wrong answer. Rear foot slips, one arm flails off the rope then re-grips, quick recovery into `idle_hold`. Do not let the character travel more than ~0.3 m.

### `victory_cheer` — loop, 1.6 s

Round or match win. Release the rope, both arms thrust up, **two small jumps**, tails bounce. Root may hop on Y; do not drift on X/Z.

### `defeat_fall` — one-shot 1.2 s, then hold

Round or match loss. Release the rope, fall backward onto the seat, legs up, settle slumped with head down. Hold the slumped pose after the last frame (`holdAfter`). A tiny idle sway in the hold is optional.

### `charge_up` — loop, 0.8 s (reserved)

Not triggered in v1. Deep crouch, vibrating shake, telegraphing a future power-up boosted pull. Keep it in the file so the mixer contract stays complete.

---

## Runtime mapping

`TugOfWar3DGame` calls `NinjaActor.play()`:

| Situation | Blue / Red |
|-----------|------------|
| Question shown | both `idle_hold` |
| Active team correct | active `pull_heave`, opponent `strain_lose` |
| Active team wrong | active `stumble_slip`, opponent `pull_heave` |
| Timeout | active `strain_lose`, opponent `pull_heave` |
| Round / match win | winner `victory_cheer`, loser `defeat_fall` |

When a GLB lands, replace the procedural body inside `NinjaActor` and drive `THREE.AnimationMixer` with these clip names. Do not change `TugOfWar3DGame`.
