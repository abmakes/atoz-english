# AtoZ Pixi — Project Context Hub

**Start here** for agent and contributor context. This file is the map; deep docs live next to the code they describe.

Human install/run instructions: [README.md](README.md)  
How to keep docs honest after changes: [project_docs/DOCUMENTATION_MAINTENANCE.md](project_docs/DOCUMENTATION_MAINTENANCE.md)

---

## What this product is

Teacher-centric quiz platform: create quizzes (form, CSV, AI), then play them as classroom PixiJS games (multiple-choice and Splash Dash) with teams, timers, scoring, themes, and power-ups.

## Stack snapshot (working)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind, shadcn/ui |
| Games | **PixiJS v8** (imperative class engine), Howler |
| State | Zustand (`useGameStore` for quiz selection); React local state for game shell; Pixi managers for gameplay |
| Data | Prisma → PostgreSQL; Zod validation |
| Auth | Clerk (optional; falls back to local `"admin"`) |
| Tests | **Vitest** (`tests/`) |
| AI / media | Google Gemini + open young-learner lexicon guard; Giphy / Pixabay + Vercel Blob |

### Explicit non-goals (do not revive)

- **Not** `@pixi/react` — React owns engine lifecycle in `GameplayView`; game rendering is class-based Pixi
- **Not** Phaser
- **Not** Taskmaster / Jest (removed from project context)

---

## Architecture in one paragraph

`GameSetupPanel` collects setup → `GameContainer` builds `GameConfig` and switches views → `GameplayView` creates/destroys a single `PixiEngine` → engine inits managers (EventBus, timers, scoring, audio, RuleEngine last) → `gameFactory` creates a `BaseGame` subclass (`MultipleChoiceGame` or `SplashDashGame`). React HUD listens on the EventBus; scoring normally goes through RuleEngine rules, not ad-hoc `addScore` calls.

Canonical init sequence: [.cursor/rules/GAME_STARTUP_FLOW.mdc](.cursor/rules/GAME_STARTUP_FLOW.mdc)

---

## Directory map

```
prisma/                 Schema (source of truth for DB)
lexicon/                Open lexical sources, provenance, curation, and build pipeline
public/                 Static assets — see public/ASSETS.md
scripts/                CI helpers (verify-assets)
src/app/                Pages + REST API routes
src/components/game_ui/ React game shell (GameContainer, GameplayView, setup)
src/lib/pixi-engine/    Shared engine (PixiEngine, BaseGame, managers)
src/lib/pixi-games/     Game implementations (multiple-choice, splash-dash)
src/lib/schemas.ts      Zod schemas
src/lib/prisma.ts       Prisma client
src/stores/             Zustand stores
src/styles/             globals.css + stylingGuide.md
src/types/              Shared TS types
tests/                  Vitest unit tests
project_docs/           Active long-form guides only
CONTEXT.md              This hub
```

---

## Canon docs (linked system)

| Topic | Canonical file | When to open |
|-------|----------------|--------------|
| **Hub / stack / map** | [CONTEXT.md](CONTEXT.md) | Every non-trivial task |
| **Startup / config handoff** | [.cursor/rules/GAME_STARTUP_FLOW.mdc](.cursor/rules/GAME_STARTUP_FLOW.mdc) | Engine, games, game_ui changes |
| **Styling & themes** | [src/styles/stylingGuide.md](src/styles/stylingGuide.md) | React themes or Pixi colors/fonts |
| **Engine architecture** | [src/lib/pixi-engine/engineHelperDoc.md](src/lib/pixi-engine/engineHelperDoc.md) | Managers, EventBus, lifecycle |
| **Pixi / TS lessons** | [project_docs/lessons-learned.md](project_docs/lessons-learned.md) | GIFs, Assets.unload, React↔Pixi pitfalls |
| **Adding a game** | [project_docs/game-development-guide.md](project_docs/game-development-guide.md) | New game mode |
| **Splash Dash behavior** | [src/lib/pixi-games/splash-dash/SPLASH_DASH_MECHANICS.md](src/lib/pixi-games/splash-dash/SPLASH_DASH_MECHANICS.md) | SD scoring/timer/movement |
| **Splash Dash integration** | [src/lib/pixi-games/splash-dash/README.md](src/lib/pixi-games/splash-dash/README.md) | SD wiring checklist |
| **Multiple-choice flow** | [src/lib/pixi-games/multiple-choice/MultipleChoiceFlow.md](src/lib/pixi-games/multiple-choice/MultipleChoiceFlow.md) | MC-specific deep dive |
| **API / Zod conventions** | [src/lib/README.md](src/lib/README.md) | API routes, schemas, responses |
| **Assets contract** | [public/ASSETS.md](public/ASSETS.md) | public/ files, CI verify |
| **AI quiz + lexicon setup** | [AI_QUIZ_GENERATOR_SETUP.md](AI_QUIZ_GENERATOR_SETUP.md) | Gemini, open lexicon, language guard |
| **Doc updates after commits** | [project_docs/DOCUMENTATION_MAINTENANCE.md](project_docs/DOCUMENTATION_MAINTENANCE.md) | After structural code changes |
| **Clerk** | [.cursor/rules/clerk_rules.mdc](.cursor/rules/clerk_rules.mdc) | Auth integration |
| **DB schema** | [prisma/schema.prisma](prisma/schema.prisma) | Data model (not a separate MD) |

---

## Critical Pixi gotchas (read before engine work)

1. **Themes:** Pixi cannot read CSS variables. React uses `globals.css` + Tailwind; Pixi needs concrete values from `src/lib/themes.ts` (`PixiSpecificConfig`).
2. **Init order:** `PixiApplication` → `Assets` → managers → **RuleEngine last** → `gameFactory` → `game.init(bundlePromise)` → ticker. See GAME_STARTUP_FLOW.
3. **React bridge:** One engine in `GameplayView` `useEffect`; guard double-init; destroy on unmount (Strict Mode / async races).
4. **Assets cleanup:** Prefer `PIXI.Assets.unload(url)` for Assets-managed textures; don’t blindly `sprite.destroy({ texture: true })`.
5. **GIFs:** Register `GifAsset` from `pixi.js/gif`; use project `AssetLoader` display helpers; don’t assume file extension means format.
6. **Scoring:** Emit game events; let RuleEngine apply `GameConfig.rules` (basic vs boosted).
7. **Timers:** `TimerManager` = logic; `PixiTimer` = visuals; pause both when pausing.

Official Pixi v8 API reference: https://pixijs.download/release/docs/index.html

---

## State model (current)

- **Zustand** (`src/stores/useGameStore.ts`): selected quiz id/title for navigation.
- **React local state:** `GameContainer` views (`setup` / `playing` / `gameover`), assembled `GameConfig`, HUD in `GameplayView`.
- **Pixi managers:** phase, scores, timers, audio, power-ups, rules — communicate via EventBus.

---

## Adding a game (short)

1. Extend `BaseGame` under `src/lib/pixi-games/<slug>/`.
2. Register in `gameFactory` inside `src/components/game_ui/GameContainer.tsx`.
3. Follow GAME_STARTUP_FLOW + [game-development-guide.md](project_docs/game-development-guide.md).
4. Update this hub’s directory/game list if you add a new slug.

---

## Doc ownership

| Change type | Update |
|-------------|--------|
| New/changed API route | `src/lib/README.md` if conventions change; else code + Zod schemas are enough |
| Schema change | `prisma/schema.prisma` only (no parallel schema MD) |
| Theme / styling approach | `src/styles/stylingGuide.md` |
| Engine init / manager order | `GAME_STARTUP_FLOW.mdc` + `engineHelperDoc.md` |
| New gotcha discovered | `project_docs/lessons-learned.md` |
| New game or mechanic | game folder README/mechanics + game-development-guide if pattern changes |
| Stack or folder layout | **This file (`CONTEXT.md`)** |

Full checklist: [DOCUMENTATION_MAINTENANCE.md](project_docs/DOCUMENTATION_MAINTENANCE.md)
