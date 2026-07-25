# Ninja Climb Mechanics

## Overview

Two teams alternate answering multiple-choice questions. Correct answers award climb points that map 1:1 to height on a shared mountain track. First to the summit wins; otherwise highest climber after all questions.

## Scoring

### Summit

`SUMMIT_POINTS = max(400, questionsPerTeam * 80)`

### Correct answer

- **Basic:** flat `60`
- **Boosted:** `50 + round(50 * remainingTimeFraction)` → range 50–100
- **Wrong / timeout:** `0` (no reverse climb)

### Gain pipeline

For any positive point gain:

1. Rope boost ×1.5 (if actor has charges remaining)
2. Smoke ×0.7 (if actor is smoked)
3. Opponent barrier clamp (cannot pass barrier height; excess discarded; barrier shatters)
4. Apply via `ScoringManager` / race state

## Power-ups (one charge each at start)

| Id | Name | Effect |
|----|------|--------|
| `teleport` | Shadow Teleport | +120 instantly; drop barrier at new height |
| `rope` | Kunai Rope | Opponent −50; actor +50% on next 3 scoring answers |
| `smoke` | Smoke Bomb | Opponent −30% on next 2 scoring answers |

Playable on your turn before answering (`Z` / `X` / `C` or UI buttons).

## Shortcuts

Nodes at 25% / 45% / 70% / 85% of summit, alternating Dark Forest and Cave.

| Kind | Ladder | Snake |
|------|--------|-------|
| Forest | 60% → +90 | 40% → −60 |
| Cave | 40% → +160 | 60% → −100 |

Opt-in prompt with odds shown (8s, default Skip). Each node once per team.

## Turn model

Same as Team Quiz: after each answer/timeout, rotate `activeTeamIndex`, show turn banner, next question.

## Win

- Team reaches summit → celebrate at peak → `GAME_ENDED`
- Or question pool exhausted → highest score celebrates

## Layout

Half sky / half mountain feel via vertical camera following the leader. Question card top; answer banners + power-ups bottom.
