# AtoZ PixiJS Game Platform

AtoZ PixiJS Game Platform is an interactive educational web application built with Next.js, TypeScript, and PixiJS v8. It provides engaging quiz-based games designed for rich animations and visual elements, aiming to make learning fun and effective.

## Vision

To create an interactive, engaging educational platform that transforms traditional quiz-based learning into immersive game experiences using PixiJS for advanced 2D graphics and animation, combined with the robust architecture of Next.js.

## Core Features

*   **Multiple-Choice Quiz Games:** Interactive quizzes with animated elements, visual feedback, timers, and scoring via a flexible PixiJS engine.
*   **Modular PixiJS Engine Core:**
    *   Centralized game state management (`GameStateManager`).
    *   Flexible scoring/lives logic (`ScoringManager`).
    *   Robust timer control (`TimerManager`).
    *   Pluggable power-up system (`PowerUpManager`).
    *   Unified asset loading (`AssetLoader`).
    *   Event-driven communication (`EventBus`).
    *   Configurable rules (`RuleEngine`) and controls (`ControlsManager`).
    *   Standardized `BaseGame` interface for diverse game types.
*   **Responsive UI:** Designed for various devices with smooth animations.
*   **Data Management:** Utilizes Prisma and tRPC for fetching and managing quiz data.

## Tech Stack

*   **Framework:** Next.js (v14.2.26+)
*   **Language:** TypeScript
*   **UI Library:** React
*   **UI Components (non-canvas):** shadcn/ui, Tailwind CSS
*   **Game Engine:** PixiJS v8
*   **Event Handling:** EventEmitter3 (via `EventBus`)
*   **Database/ORM:** Prisma (connecting to PostgreSQL)
*   **API:** tRPC
*   **Testing:** Jest

## Getting Started

1.  Clone the repository:
    ```bash
    git clone https://github.com/abmakes/atoz-english.git # TODO: Update repo URL if different
    cd atoz-english
    ```
2.  Set up environment variables (e.g., database connection string). Create a `.env` file based on `.env.example` if provided.
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Initialize/migrate the database:
    ```bash
    npx prisma migrate dev
    # Optional: Seed database if seed script exists
    # npx prisma db seed
    ```
5.  Run the development server:
    ```bash
    npm run dev
    ```
6.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

*   `/prisma/` - Prisma schema and migration files.
*   `/public/` - Static assets (images, fonts).
*   `/scripts/` - Utility scripts (e.g., PRD source).
*   `/src/app/` - Next.js App Router pages and API routes (including tRPC).
*   `/src/components/` - Reusable React UI components (page layouts, forms, game UI wrappers).
*   `/src/lib/` - Core application logic.
    *   `/lib/pixi-engine/` - The core PixiJS game engine modules.
        *   `/core/` - Main engine class, EventBus, managers (State, Rules, Controls, Storage).
        *   `/config/` - TypeScript interfaces for game configuration.
        *   `/game/` - BaseGame class, specific managers (Scoring, Timer, PowerUp).
        *   `/assets/` - AssetLoader module.
        *   `/ui/` - Reusable PixiJS UI components.
        *   `/utils/` - Engine-specific utility functions.
    *   `/lib/games/` - Implementations for specific game types (e.g., `MultipleChoiceGame`).
    *   `/lib/prisma.ts` - Prisma client instance.
    *   `/lib/trpc/` - tRPC router setup.
    *   `/lib/utils/` - General utility functions.
*   `/src/styles/` - Global styles, Tailwind CSS configuration.
*   `/src/types/` - Shared TypeScript type definitions.
*   `/tests/` - Unit and integration tests (Jest).
*   `/project_docs/` - Detailed planning and architecture documents.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Ensure code follows existing patterns and includes relevant tests.

## License

This project is licensed under the MIT License.