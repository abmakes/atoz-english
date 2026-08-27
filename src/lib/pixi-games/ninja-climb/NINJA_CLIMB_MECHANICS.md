# Ninja Climb Mechanics

## Overview

Two teams alternate answering multiple-choice questions. Correct answers award climb points. Positions quantize to shared switchback waypoints with `POINTS_PER_STEP = 40`. Highest score wins after a fair finish (see Win).

## Scoring

### Summit

`SUMMIT_POINTS = max(480, uniqueQuestions * 80)`

`totalSteps = ceil(SUMMIT_POINTS / POINTS_PER_STEP)`

The 480 floor keeps climbs long enough for rope/teleport fights to matter.

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

## Power-ups

**Each team starts with one random** enabled power-up. Every **2 correct answers** grants **another** random enabled power-up.

| Id | Name | Effect |
|----|------|--------|
| `teleport` | Shadow Teleport | +120 instantly; drop barrier at new **step** |
| `rope` | Kunai Rope | Opponent −50; actor +50% on next 3 scoring answers. VFX: shared `RopeProjectile` extends tip A→B, grabs, retracts while opponent hops back. |
| `smoke` | Smoke Bomb | Opponent −30% on next 2 scoring answers |

Playable on your turn before answering (`Z` / `X` / `C` or per-team tray buttons). Inactive team's tray is dimmed but visible.

## Shortcuts

Only **two** well-spaced nodes (≈40% and ≈75%). **High risk** — snake is more likely than ladder.

| Kind | Forward | Back |
|------|---------|------|
| Forest | 35% → +60 | 65% → −50 |
| Cave | 30% → +80 | 70% → −70 |

Prompt shows a pie chart (green = forward, red = back), “Take a chance?”, and green ✓ / red ✕ circles (8s auto-skip). Each node once per team.

## Questions

When the quiz pool is short relative to summit height, questions **recycle in coverage cycles**:

1. Each unique question is answered by **each team** once per cycle (turn order A→B→A→B maps to Q,Q, nextQ, nextQ, …).
2. Within a cycle, the same team never sees the same question twice.
3. Extra cycles are scheduled so there are enough turns for a typical climb to 480+.

## Trail & occupancy

- One shared switchback trail (`mountainPath.buildPath`).
- Characters hop arc between waypoints and face travel direction.
- Same ledge → `plateauSlots.layoutOccupants` places 2 side-by-side (air gap) or 3–4 magazine-rack fan with pose variants + phase offsets.

## Camera

Fit-zoom on both climbers: midpoint in the play window (between sky band and bottom bar), zoom clamped to `[0.45, 1]`, eased per frame.

## UI regions

- **Top sky band:** answer clouds clustered mid-screen (clear of the score panel and nav/timer), staggered rows that may overlap slightly, drifting side to side. No ambient clouds.
- **Timer:** enlarged ring on a solid white disc, dropped below the React nav cluster (right side)
- **Middle play window:** tiled mountain world, camera fits climbers at 1.3× so characters read larger
- **Bottom bar:** Splash Dash pattern — question image up to 200×200 (overlaps the play window), 20px gap to the question text, two corner power trays. Extra padding between Team 1 powers and the photo.

## Turn model

After each answer/timeout, rotate `activeTeamIndex`, show turn banner, next question.

## Win

- If the **first** team of a round reaches the summit, later teams still get **one more answer** (catch-up turn).
- After that catch-up (or if the **last** team of the round summits), **highest score** wins.
- Or question schedule exhausted → highest score celebrates
