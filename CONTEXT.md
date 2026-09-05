# AtoZ Pixi — Project Context Hub

**Start here** for agent and contributor context. This file is the map; deep docs live next to the code they describe.

Human install/run instructions: [README.md](README.md)  
How to keep docs honest after changes: [project_docs/DOCUMENTATION_MAINTENANCE.md](project_docs/DOCUMENTATION_MAINTENANCE.md)

---

## What this product is

Teacher-centric quiz platform: create quizzes (form, CSV, AI), then play them as classroom games — PixiJS 2D (Team Quiz, Splash Dash) and an experimental Three.js 3D Quiz Room — with teams, timers, scoring, themes, and power-ups.

## Stack snapshot (working)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind, shadcn/ui |
| Games | **PixiJS v8** (2D class engine) + **Three.js** (3D class runtime), Howler |
| State | Zustand (`useGameStore` for quiz selection); React local state for game shell; Pixi managers for gameplay |
| Data | Prisma → PostgreSQL; Zod validation |
| Auth | Clerk (optional; falls back to local `"admin"`) |
| Tests | **Vitest** (`tests/`) |
| AI / media | Google Gemini teacher-first quiz brief + soft lexicon audit; Giphy / Pixabay + Vercel Blob |

### Explicit non-goals (do not revive)

- **Not** `@pixi/react` — React owns engine lifecycle in `GameplayView`; game rendering is class-based Pixi
- **Not** Phaser
- **Not** Taskmaster / Jest (removed from project context)

---

## Architecture in one paragraph

`GameSetupPanel` collects setup → `GameContainer` builds `GameConfig` and resolves the slug in `gameModeRegistry` → `GameplayView` creates/destroys one `GameRuntime` (Pixi adapter or Three) → `GameSession` inits managers (EventBus, timers, scoring, audio, RuleEngine last) → Pixi `BaseGame` or Three `ThreeGame`. React HUD listens on the EventBus; scoring goes through RuleEngine rules, not ad-hoc `addScore` calls.

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
src/lib/game-engine/    Renderer-neutral session, runtime, quiz source, mode registry
src/lib/pixi-engine/    Shared 2D engine (PixiEngine, BaseGame, managers)
src/lib/pixi-games/     2D game implementations (multiple-choice, splash-dash)
src/lib/three-engine/   Three.js world + runtime + ThreeGame contract
src/lib/three-games/    3D game implementations (quiz-room)
src/lib/schemas.ts      Zod schemas
src/lib/prisma.ts       Prisma client
src/lib/ai/              GenerationBrief, teacher-first prompts, lesson-image helpers
src/lib/lexicon/         Open lexicon resolver + soft language audit
src/lib/taxonomy/        Discovery tags + AI-only generation controls
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
| **Adding a 3D game** | [project_docs/3D_GAME_REQUIREMENTS.md](project_docs/3D_GAME_REQUIREMENTS.md) | ThreeGame contract, events, managers, prohibitions |
| **Splash Dash behavior** | [src/lib/pixi-games/splash-dash/SPLASH_DASH_MECHANICS.md](src/lib/pixi-games/splash-dash/SPLASH_DASH_MECHANICS.md) | SD scoring/timer/movement |
| **Splash Dash integration** | [src/lib/pixi-games/splash-dash/README.md](src/lib/pixi-games/splash-dash/README.md) | SD wiring checklist |
| **Multiple-choice flow** | [src/lib/pixi-games/multiple-choice/MultipleChoiceFlow.md](src/lib/pixi-games/multiple-choice/MultipleChoiceFlow.md) | MC-specific deep dive |
| **API / Zod conventions** | [src/lib/README.md](src/lib/README.md) | API routes, schemas, responses |
| **Assets contract** | [public/ASSETS.md](public/ASSETS.md) | public/ files, CI verify |
| **AI quiz + lexicon setup** | [AI_QUIZ_GENERATOR_SETUP.md](AI_QUIZ_GENERATOR_SETUP.md) | Teacher brief, screenshot analysis, soft lexicon audit, review step |
| **Doc updates after commits** | [project_docs/DOCUMENTATION_MAINTENANCE.md](project_docs/DOCUMENTATION_MAINTENANCE.md) | After structural code changes |
| **Clerk** | [.cursor/rules/clerk_rules.mdc](.cursor/rules/clerk_rules.mdc) | Auth integration |
| **DB schema** | [prisma/schema.prisma](prisma/schema.prisma) | Data model (not a separate MD) |

---

## Critical Pixi gotchas (read before engine work)

1. **Themes:** Pixi cannot read CSS variables. React uses `globals.css` + Tailwind; Pixi needs concrete values from `src/lib/themes.ts` (`PixiSpecificConfig`).
2. **Init order:** Shared `GameSession` inits managers with **RuleEngine last**. Pixi: `PixiApplication` → `Assets` → session → `gameFactory` → `game.init(bundlePromise)` → ticker. Three: `ThreeWorld` → session → `ThreeGame.init` → one RAF loop. See GAME_STARTUP_FLOW.
3. **React bridge:** One `GameRuntime` in `GameplayView` `useEffect`; guard double-init; destroy on unmount (Strict Mode / async races).
4. **Assets cleanup:** Prefer `PIXI.Assets.unload(url)` for Assets-managed textures; don’t blindly `sprite.destroy({ texture: true })`. Three games use `disposeObject3D` + `renderer.dispose()`.
5. **GIFs:** Register `GifAsset` from `pixi.js/gif`; use project `AssetLoader` display helpers; don’t assume file extension means format.
6. **Scoring:** Emit game events; let RuleEngine apply `GameConfig.rules` (basic vs boosted).
7. **Timers:** `TimerManager` = logic; `PixiTimer` = visuals; pause both when pausing.

Official Pixi v8 API reference: https://pixijs.download/release/docs/index.html

---

## State model (current)

- **Zustand** (`src/stores/useGameStore.ts`): selected quiz id/title for navigation.
- **React local state:** `GameContainer` views (`setup` / `playing` / `gameover`), assembled `GameConfig`, HUD in `GameplayView`.
- **Pixi / Three managers:** phase, scores, timers, audio, power-ups, rules — owned by `GameSession`, communicate via EventBus.

---

## Adding a game (short)

**2D (Pixi):**
1. Extend `BaseGame` under `src/lib/pixi-games/<slug>/`.
2. Register in `src/lib/game-engine/modes/builtinGameModes.ts` (`renderer: 'pixi'`, `PixiRuntimeAdapter`).
3. Follow GAME_STARTUP_FLOW.

**3D (Three):**
1. Implement `ThreeGame` under `src/lib/three-games/<slug>/`.
2. Register in the same mode registry (`renderer: 'three'`, `ThreeRuntime`).
3. Follow [3D_GAME_REQUIREMENTS.md](project_docs/3D_GAME_REQUIREMENTS.md). Do not subclass `BaseGame` or call `addScore`.

---

## Doc ownership

| Change type | Update |
|-------------|--------|
| New/changed API route | `src/lib/README.md` if conventions change; else code + Zod schemas are enough |
| Schema change | `prisma/schema.prisma` only (no parallel schema MD) |
| Theme / styling approach | `src/styles/stylingGuide.md` |
| Engine init / manager order | `GAME_STARTUP_FLOW.mdc` + `engineHelperDoc.md` |
| New 3D game or Three runtime | `project_docs/3D_GAME_REQUIREMENTS.md` + this hub |
| New gotcha discovered | `project_docs/lessons-learned.md` |
| New game or mechanic | game folder README/mechanics + game-development-guide if pattern changes |
| Stack or folder layout | **This file (`CONTEXT.md`)** |

Full checklist: [DOCUMENTATION_MAINTENANCE.md](project_docs/DOCUMENTATION_MAINTENANCE.md)
