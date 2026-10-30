# AtoZ Pixi — Project Context Hub

**Start here** for agent and contributor context. This file is the map; deep docs live next to the code they describe.

Human install/run instructions: [README.md](README.md)  
How to keep docs honest after changes: [project_docs/DOCUMENTATION_MAINTENANCE.md](project_docs/DOCUMENTATION_MAINTENANCE.md)

---

## What this product is

Teacher-centric quiz platform: create quizzes (form, CSV, AI), then play them as classroom games — PixiJS 2D (Team Quiz, Splash Dash, Ninja Climb) and Three.js 3D (Tug of War) — with teams, timers, scoring, themes, and power-ups.

**Practice** (`/practice`, public): single-player games that do not need a teacher quiz. First game is **Sentence Builder** at `/practice/sentence-builder` — pick one grammar structure, then build picture sentences for that structure only.

**Teacher Tools** (`/tools`, signed-in only): small classroom helpers. **Story Creator** — AI-generated 4-picture stories (Gemini text + image), a printable 2×2 worksheet, a public student link for per-picture voice recording, and a live lip-synced "movie" player (canvas virtual camera; no video files are generated). Plan/architecture: [TEACHER_TOOLS_STORY_CREATOR_PLAN.md](TEACHER_TOOLS_STORY_CREATOR_PLAN.md). **Thoughts** — a class speaking wall: students open a share link, decorate a sticker face from `public/images/thoughts/`, and record a short answer. The face talks from the amplitude envelope. Teachers approve which clips the class can watch. Student audio is stored in the public Vercel Blob store (unguessable path) and streamed through an access check. The file URL is never sent to the browser. Also includes a **temporary Image curator** (`/tools/image-curator`) that saves Pixabay photos into the quiz image library by CEFR word until a full collection exists.

## Stack snapshot (working)

| Layer | Technology |
|-------|------------|
| Runtime | **Node.js 24 LTS** (22.23.4+ required; Node 20 is EOL) |
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind, shadcn/ui |
| Games | **PixiJS v8** (2D class engine) + **Three.js** (3D class runtime), Howler |
| State | Zustand (`useGameStore` for quiz selection); React local state for game shell; Pixi managers for gameplay |
| Data | Prisma → PostgreSQL; Zod validation |
| Auth | Clerk (optional; falls back to local `"admin"`) |
| Tests | **Vitest** (`tests/`) |
| AI / media | Google Gemini teacher-first quiz brief + soft lexicon audit; OpenRouter (`OPENROUTER_API_KEY` / `OPENROUTER_MODEL`) for Story Creator panel images (Gemini Flash Image); Giphy / Pixabay + Vercel Blob |

### Explicit non-goals (do not revive)

- **Not** `@pixi/react` — React owns engine lifecycle in `GameplayView`; game rendering is class-based Pixi
- **Not** Phaser
- **Not** Taskmaster / Jest (removed from project context)

---

## Architecture in one paragraph

`GameSetupPanel` collects setup → `GameContainer` builds `GameConfig` and resolves the slug in `gameModeRegistry` → `GameplayView` creates/destroys one `GameRuntime` (Pixi adapter or Three) → `GameSession` inits managers (EventBus, timers, scoring, audio, RuleEngine last) → Pixi `BaseGame` (`MultipleChoiceGame`, `SplashDashGame`, `NinjaClimbGame`) or Three `ThreeGame`. React HUD listens on the EventBus; scoring normally goes through RuleEngine rules (Ninja Climb is an exception: race pipeline scores via `ScoringManager` directly).

Canonical init sequence: [.cursor/rules/GAME_STARTUP_FLOW.mdc](.cursor/rules/GAME_STARTUP_FLOW.mdc)

---

## Directory map

```
prisma/                 Schema (source of truth for DB)
lexicon/                Open lexical sources, provenance, curation, and build pipeline
public/                 Static assets — see public/ASSETS.md
scripts/                CI helpers (verify-assets)
src/app/                Pages + REST API routes
src/components/game_ui/ React game shell (GameContainer, GameplayView, setup, HUD overlays)
src/lib/game-engine/    Renderer-neutral session, runtime, quiz source, mode registry
src/lib/pixi-engine/    Shared 2D engine (PixiEngine, BaseGame, managers)
src/lib/pixi-games/     2D game implementations (multiple-choice, splash-dash, ninja-climb, sentence-builder)
src/lib/three-engine/   Three.js world + runtime + ThreeGame contract
src/lib/three-games/    3D game implementations (quiz-room, tug-of-war)
src/lib/schemas.ts      Zod schemas
src/lib/prisma.ts       Prisma client
src/lib/ai/              GenerationBrief, teacher-first prompts, lesson-image helpers
src/lib/lexicon/         Open lexicon resolver + soft language audit
src/lib/taxonomy/        Discovery tags + AI-only generation controls
src/lib/stories/         Story Creator: schemas, prompts, Gemini image gen, timeline, lip-sync
src/components/story_creator/  Story Creator UI (brief form, editor, recorder, movie player)
src/lib/thoughts/        Thoughts: sticker catalog, lip-sync, private audio, class access
src/components/thoughts/ Thoughts UI (face builder, recorder, teacher review)
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
| **PixiJS 8.17 migration** | [project_docs/PIXIJS_8_17_MIGRATION_GUIDE.md](project_docs/PIXIJS_8_17_MIGRATION_GUIDE.md) | Runtime upgrade, GIF validation, optional Layout and AI skills |
| **Pixi / TS lessons** | [project_docs/lessons-learned.md](project_docs/lessons-learned.md) | GIFs, Assets.unload, React↔Pixi pitfalls |
| **Adding a 3D game** | [project_docs/3D_GAME_REQUIREMENTS.md](project_docs/3D_GAME_REQUIREMENTS.md) | ThreeGame contract, events, managers, prohibitions |
| **Tug of War ninjas** | [project_docs/TUG_OF_WAR_NINJA_ASSET_SPEC.md](project_docs/TUG_OF_WAR_NINJA_ASSET_SPEC.md) | Pose clips, painted sprite canvas rules, GLB delivery |
| **Splash Dash behavior** | [src/lib/pixi-games/splash-dash/SPLASH_DASH_MECHANICS.md](src/lib/pixi-games/splash-dash/SPLASH_DASH_MECHANICS.md) | SD scoring/timer/movement |
| **Splash Dash integration** | [src/lib/pixi-games/splash-dash/README.md](src/lib/pixi-games/splash-dash/README.md) | SD wiring checklist |
| **Ninja Climb behavior** | [src/lib/pixi-games/ninja-climb/NINJA_CLIMB_MECHANICS.md](src/lib/pixi-games/ninja-climb/NINJA_CLIMB_MECHANICS.md) | NC race/power-ups/shortcuts |
| **Ninja Climb integration** | [src/lib/pixi-games/ninja-climb/README.md](src/lib/pixi-games/ninja-climb/README.md) | NC wiring checklist |
| **Multiple-choice flow** | [src/lib/pixi-games/multiple-choice/MultipleChoiceFlow.md](src/lib/pixi-games/multiple-choice/MultipleChoiceFlow.md) | MC-specific deep dive |
| **Sentence Builder** | [src/lib/pixi-games/sentence-builder/README.md](src/lib/pixi-games/sentence-builder/README.md) | Built-in picture sentence practice |
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
3. **React bridge:** One `GameRuntime` in `GameplayView` `useEffect`; guard double-init; destroy on unmount (Strict Mode / async races). For React HUD overlays, call `runtime.start()` only after `runtimeReady` so child listeners attach before the first `QUESTION_SHOWN`.
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
3. Follow GAME_STARTUP_FLOW + [game-development-guide.md](project_docs/game-development-guide.md).
4. A fixed practice set (Sentence Builder) can own one `PIXI.Application` in its screen component.

**3D (Three):**
1. Implement `ThreeGame` under `src/lib/three-games/<slug>/`.
2. Register in the same mode registry (`renderer: 'three'`, `ThreeRuntime`). Optional `hud` flags mount React overlays in `GameplayView`.
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

### Thoughts (2026-10-30)

Teacher tool at `/tools/thoughts`. Students use `/thoughts/{shareToken}`. Facial parts are the atlases in `public/images/thoughts/` (`manifest.json` has frame rectangles). Recordings use the existing public Vercel Blob store (`access: 'public'`, random suffix). The URL stays on the server and playback goes through the approval check. Rebuild atlas metadata with `node scripts/build-thoughts-asset-manifest.mjs`.
