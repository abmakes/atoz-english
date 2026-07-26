# Ninja Climb Mechanics

## Overview

Two teams alternate answering multiple-choice questions. Correct answers award climb points. Positions quantize to shared switchback waypoints with `POINTS_PER_STEP = 40`. Highest score wins after a fair finish (see Win).

## Scoring

### Summit

`SUMMIT_POINTS = max(400, questionsPerTeam * 80)`

`totalSteps = ceil(SUMMIT_POINTS / POINTS_PER_STEP)`

### Correct answer (always includes a time bonus)

- **Basic:** `50 + round(25 * remainingTimeFraction)` → range 50–75
- **Boosted:** `50 + round(50 * remainingTimeFraction)` → range 50–100
- **Wrong / timeout:** `0` (no reverse climb; does not burn rope/smoke charges)

### Gain pipeline

For any positive point gain:

1. Rope boost ×1.5 (if actor has charges remaining)
2. Smoke ×0.7 (if actor is smoked)
3. Opponent barrier clamp by **step index** (cannot pass barrier step; excess discarded; barrier shatters)
4. Apply via `ScoringManager` / race state

Teleport and ladder gains use the same barrier clamp.

## Power-ups (one charge each at start)

| Id | Name | Effect |
|----|------|--------|
| `teleport` | Shadow Teleport | +120 instantly; drop barrier at new **step** |
| `rope` | Kunai Rope | Opponent −50; actor +50% on next 3 scoring answers. VFX: shared `RopeProjectile` extends tip A→B, grabs, retracts while opponent hops back. |
| `smoke` | Smoke Bomb | Opponent −30% on next 2 scoring answers |

Playable on your turn before answering (`Z` / `X` / `C` or per-team tray buttons). Inactive team's tray is dimmed but visible.

## Shortcuts

Only **two** well-spaced nodes (≈40% and ≈75% of the trail) so you cannot chain gates to the summit.

| Kind | Forward | Back |
|------|---------|------|
| Forest | 60% → +60 | 40% → −40 |
| Cave | 45% → +80 | 55% → −50 |

Prompt shows a small pie chart (green = forward, red = back), “Take a chance?”, and green ✓ / red ✕ circles (8s auto-skip). Each node once per team.

## Trail & occupancy

- One shared switchback trail (`mountainPath.buildPath`).
- Characters hop arc between waypoints and face travel direction.
- Same ledge → `plateauSlots.layoutOccupants` places 2 side-by-side (air gap) or 3–4 magazine-rack fan with pose variants + phase offsets.

## Camera

Fit-zoom on both climbers: midpoint in the play window (between sky band and bottom bar), zoom clamped to `[0.45, 1]`, eased per frame.

## UI regions

- **Top ~38% sky:** answer clouds (no added numbering), ambient clouds, timer
- **Middle play window:** tiled mountain world
- **Bottom bar:** Splash Dash pattern — question image, text, counter, two corner power trays

## Turn model

Same as Team Quiz: after each answer/timeout, rotate `activeTeamIndex`, show turn banner, next question.

## Win

- If the **first** team of a round reaches the summit, later teams still get **one more answer** (catch-up turn).
- After that catch-up (or if the **last** team of the round summits), **highest score** wins.
- Or question pool exhausted → highest score celebrates.
