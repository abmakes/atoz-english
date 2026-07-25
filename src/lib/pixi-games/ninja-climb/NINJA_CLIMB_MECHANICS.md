# Ninja Climb Mechanics

## Overview

Two teams alternate answering multiple-choice questions. Correct answers award climb points. Positions quantize to shared switchback waypoints with `POINTS_PER_STEP = 40`. First to the summit wins; otherwise highest climber after all questions.

## Scoring

### Summit

`SUMMIT_POINTS = max(400, questionsPerTeam * 80)`

`totalSteps = ceil(SUMMIT_POINTS / POINTS_PER_STEP)`

### Correct answer

- **Basic:** flat `60` (~1–2 hops)
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
| `rope` | Kunai Rope | Opponent −50; actor +50% on next 3 scoring answers |
| `smoke` | Smoke Bomb | Opponent −30% on next 2 scoring answers |

Playable on your turn before answering (`Z` / `X` / `C` or per-team tray buttons). Inactive team's tray is dimmed but visible.

## Shortcuts

Nodes at 25% / 45% / 70% / 85% of summit (anchored to step indices), alternating Dark Forest and Cave.

| Kind | Ladder | Snake |
|------|--------|-------|
| Forest | 60% → +90 | 40% → −60 |
| Cave | 40% → +160 | 60% → −100 |

Opt-in prompt with odds shown (8s auto-skip; timer cleared on resolve/destroy). Each node once per team.

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

- Team reaches summit → celebrate at peak → `GAME_ENDED`
- Or question pool exhausted → highest score celebrates
