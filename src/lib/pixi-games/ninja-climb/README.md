# Ninja Climb Integration

> Hub: [CONTEXT.md](../../../../CONTEXT.md) · Mechanics: [NINJA_CLIMB_MECHANICS.md](./NINJA_CLIMB_MECHANICS.md)

## Overview

Turn-based two-team mountain race. Quiz points convert to climb distance on a shared switchback trail. Each team starts with one charge of Shadow Teleport, Kunai Rope, and Smoke Bomb. Optional forest/cave shortcut nodes act like snakes and ladders.

## Architecture

1. **NinjaClimbGame.ts** — `BaseGame` subclass; turn rotation, scoring sync, power-ups, shortcuts, game over
2. **mountainPath.ts** / **plateauSlots.ts** — pure waypoint + occupancy math
3. **managers/**
   - `NinjaClimbDataManager` — `BaseQuizDataManager` wrapper
   - `NinjaClimbRaceManager` — pure race rules (`POINTS_PER_STEP`, barriers by step, shortcuts)
   - `NinjaClimbMountainManager` — tiled cliffs/plateaus, trail, gates, barrier, fit-zoom camera
   - `NinjaClimbPlayerManager` — arc hops, facing, occupancy, idle pose variants
   - `NinjaClimbUIManager` — bottom bar, sky answer clouds, dual power trays, shortcut prompt
   - `NinjaClimbLayoutManager` — sky band / bottom bar / cloud / tray profile
4. **ninjaPowerups.ts** — setup/runtime power-up config

## Wiring checklist

- [x] Folder under `src/lib/pixi-games/ninja-climb/`
- [x] Factory branch in `GameContainer.tsx`
- [x] Eligibility in `game-mode-eligibility.ts`
- [x] Mode picker card
- [x] Setup panel (2 teams, power toggles, shortcuts)
- [x] Asset warmup + `verify-assets.mjs` + `ASSETS.md`
- [x] Vitest coverage for path, slots, race manager + eligibility
