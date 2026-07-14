# AtoZ PixiJS Game Platform

Interactive educational quiz games built with **Next.js 15**, **React 19**, **TypeScript**, and **PixiJS v8**. Teachers create quizzes; students play them as animated classroom games.

## Features

- **Multiple-choice** and **Splash Dash** PixiJS games (timers, scoring, power-ups, teams)
- Modular engine: `EventBus`, `RuleEngine`, `ScoringManager`, `TimerManager`, `PowerUpManager`, `AssetLoader`
- Quiz CRUD with Zod-validated REST APIs and Prisma/PostgreSQL
- Optional **Clerk** auth (UI + mutating API routes)
- AI question generation via Google Gemini
- Image search/caching (Pixabay → Vercel Blob)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui |
| Games | PixiJS 8, Howler |
| State | Zustand (quiz selection), Pixi managers (gameplay) |
| Database | Prisma → PostgreSQL (Neon-friendly) |
| Auth | Clerk (optional via env) |
| API | REST routes under `src/app/api/` |
| Validation | Zod |
| Tests | Vitest |

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and fill in values:
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client and migrate:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).

Without Clerk keys, auth falls back to a local `"admin"` user so you can develop offline.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Prisma generate + production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run verify-assets` | Check required `public/` files |

## Project Structure

```
prisma/                 Schema and migrations
public/                 Static assets (see public/ASSETS.md)
scripts/                CI helpers (e.g. verify-assets)
src/app/                App Router pages + REST API routes
src/components/         React UI (game shell, quiz management, shadcn)
src/lib/
  pixi-engine/          Core Pixi engine (BaseGame, managers, UI)
  pixi-games/           Game implementations (multiple-choice, splash-dash)
  auth.ts               Clerk requireAuth helper
  schemas.ts            Shared Zod schemas
  prisma.ts             Prisma client + retry helpers
src/stores/             Zustand stores
src/types/              Shared TypeScript types
tests/                  Vitest unit tests
```

## Adding a Game

1. Implement a class extending `BaseGame` under `src/lib/pixi-games/<slug>/`.
2. Register it in the `gameFactory` switch in `src/components/game_ui/GameContainer.tsx`.
3. Follow `.cursor/rules/GAME_STARTUP_FLOW.mdc` for init order.

## Docs

**Start here:** [CONTEXT.md](CONTEXT.md) — stack snapshot, directory map, and links to all canon docs.

| Doc | Purpose |
|-----|---------|
| [CONTEXT.md](CONTEXT.md) | Project hub for agents/contributors |
| [project_docs/DOCUMENTATION_MAINTENANCE.md](project_docs/DOCUMENTATION_MAINTENANCE.md) | How to update docs after commits |
| [project_docs/lessons-learned.md](project_docs/lessons-learned.md) | Pixi / TS hard lessons |
| [project_docs/game-development-guide.md](project_docs/game-development-guide.md) | Adding a new game |
| [src/lib/pixi-engine/engineHelperDoc.md](src/lib/pixi-engine/engineHelperDoc.md) | Engine architecture |
| [src/styles/stylingGuide.md](src/styles/stylingGuide.md) | React + Pixi theming |
| [public/ASSETS.md](public/ASSETS.md) | Asset strategy |
| [AI_QUIZ_GENERATOR_SETUP.md](AI_QUIZ_GENERATOR_SETUP.md) | Gemini setup |

## License

MIT
