# Ninja Climb Integration

> Hub: [CONTEXT.md](../../../../CONTEXT.md) · Mechanics: [NINJA_CLIMB_MECHANICS.md](./NINJA_CLIMB_MECHANICS.md)

## Overview

Turn-based two-team mountain race. Quiz points convert to climb distance. Each team starts with one charge of Shadow Teleport, Kunai Rope, and Smoke Bomb. Optional forest/cave shortcut nodes act like snakes and ladders.

## Architecture

1. **NinjaClimbGame.ts** — `BaseGame` subclass; turn rotation, scoring sync, power-ups, shortcuts, game over
2. **managers/**
   - `NinjaClimbDataManager` — `BaseQuizDataManager` wrapper
   - `NinjaClimbRaceManager` — pure race rules (gain pipeline, barriers, shortcuts)
   - `NinjaClimbMountainManager` — sky, parallax bands, gates, barriers, camera
   - `NinjaClimbPlayerManager` — ninja sprite strips + action poses
   - `NinjaClimbUIManager` — question card, answers, timer, power buttons, shortcut prompt
   - `NinjaClimbLayoutManager` — responsive layout profile
3. **ninjaPowerups.ts** — setup/runtime power-up config

## Wiring checklist

- [x] Folder under `src/lib/pixi-games/ninja-climb/`
- [x] Factory branch in `GameContainer.tsx`
- [x] Eligibility in `game-mode-eligibility.ts`
- [x] Mode picker card
- [x] Setup panel (2 teams, power toggles, shortcuts)
- [x] Asset warmup + `verify-assets.mjs` + `ASSETS.md`
- [x] Vitest coverage for race manager + eligibility
