**VISION**

Our vision is a teacher-centric platform making quiz creation and delivery engaging. We'll start with interactive multiplayer multiple-choice games, evolving to include diverse, sprite-based mechanics with simple controls. A key feature will be AI-powered quiz generation, enabling teachers to quickly create content by providing topics and levels. Teachers can also manually craft and manage quizzes via an intuitive interface. The platform will feature authentication for teacher accounts and support basic visual theming for game customization. Our goal is an efficient, visually appealing tool for educators to create and deploy interactive learning experiences in the classroom.

Okay, let's map out the updated game flow incorporating the component interactions, the refactored PixiJS engine, API calls, and the new configuration naming (`GameSetupData`, `GameConfig`).

**Game Flow: From Quiz Selection to Game Over**

1.  **Quiz Selection (Hypothetical UI - Outside `GameContainer`)**
    *   User accesses a page displaying available quizzes.
    *   React component potentially fetches a list of quizzes: `GET /api/quizzes` (returns `QuizListItem[]`).
    *   User selects a quiz (e.g., "Vocabulary Basics").
    *   UI navigates the user to the game page, passing relevant IDs, e.g., `/play/multiple-choice/quiz-123`.

2.  **Game Setup (`GameContainer` & `GameSetupPanel`)**
    *   The game page mounts, rendering `GameContainer`. Props `quizId="quiz-123"` and `gameSlug="multiple-choice"` are passed to `GameContainer`.
    *   `GameContainer`'s initial `currentView` state is `'setup'`, so it renders `GameSetupPanel`.
    *   `GameSetupPanel` displays configuration options (Team names, Theme selector, Intensity timer buttons, Limited guesses options, Powerup toggles, etc.).
    *   User interacts with `GameSetupPanel`, updating its internal state (e.g., adds team "Eagles", selects "Forest" theme, chooses 10s intensity).
    *   User clicks the "Play" button in `GameSetupPanel`.

3.  **Configuration Handoff (`GameSetupPanel` -> `GameContainer`)**
    *   `GameSetupPanel.handlePlayGame` executes:
        *   It gathers the user's selections into a `setupConfig` object (matching `Omit<GameSetupData, 'quizId' | 'gameSlug'>`).
        *   It calls the `onStartGame` prop (provided by `GameContainer`) passing this `setupConfig` object.

4.  **Engine Configuration Assembly (`GameContainer`)**
    *   `GameContainer.handleStartGame(setupData)` executes:
        *   **Fetches Quiz Details:** Makes an API call `GET /api/quizzes/quiz-123` to retrieve the full quiz data (questions, answers, media URLs, etc.).
        *   **Constructs `GameConfig`:** This is the crucial step where `GameContainer` translates the user's `setupData` and the fetched quiz details into the precise structure the `PixiEngine` needs (`GameConfig` from `@/lib/pixi-engine/config/GameConfig`). This involves:
            *   Mapping `setupData.teams` to `GameConfig.teams`.
            *   Setting `GameConfig.quizId` and `GameConfig.gameSlug` from props.
            *   Determining `GameConfig.gameMode` (e.g., setting `type: 'score'` or `'lives'` based on `setupData.limitedGuesses`).
            *   Defining `GameConfig.rules` (e.g., selecting a predefined `RuleConfig` based on `gameSlug` or `setupData.gameFeatures`, like the rule to award 10 points for a correct answer).
            *   Defining `GameConfig.controls` (e.g., using default keyboard mappings).
            *   Defining `GameConfig.powerups` based on `setupData.powerups` toggles.
            *   Defining `GameConfig.assets` by combining default assets with any specific asset URLs fetched from the quiz data.
            *   Setting `GameConfig.intensityTimeLimit` from `setupData.intensityTimeLimit`.
        *   Updates its internal state: `setGameConfig(fullEngineConfig)`.
        *   Updates theme state: `setThemeClassName(...)` based on `setupData.theme`.
        *   Updates view state: `setCurrentView('playing')`.

5.  **Engine Initialization (`GameContainer` -> `GameplayView` -> `PixiEngine`)**
    *   `GameContainer` re-renders, now showing `GameplayView`. It passes the newly created `gameConfig`, `themeClassName`, callbacks (`onGameOver`, `onExit`), the `pixiMountPointRef`, and the `gameFactory` function as props.
    *   `GameplayView` mounts. Its `useEffect` hook runs:
        *   Creates a `new PixiEngine({ targetElement: pixiMountPointRef.current })`.
        *   Calls `pixiEngine.init(gameConfig, gameFactory)`.
    *   `PixiEngine.init(config, factory)` executes:
        *   Initializes `PixiApplication` (canvas, renderer).
        *   Initializes core managers (`EventBus`, `StorageManager`, `GameStateManager`, etc.).
        *   Configures managers using the provided `config` (`ScoringManager.init`, `ControlsManager.init`, `RuleEngine` reads rules, `PowerUpManager` reads available powerups).
        *   Uses `AssetLoader` (via `PIXI.Assets`) to load assets defined in `config.assets`.
        *   Calls `factory(config, this.getManagers())` which returns a `new MultipleChoiceGame(config, managers)`. Stores this as `this.currentGame`.
        *   Adds `currentGame.view` to the Pixi stage.
        *   Calls `this.currentGame.init()`.
        *   Starts the Pixi ticker, which calls `PixiEngine.update` each frame.
    *   Once `pixiEngine.init()` promise resolves, `GameplayView`'s `useEffect` attaches listeners to the engine's `eventBus` (e.g., for `SCORE_UPDATED`, `GAME_ENDED`).

6.  **Gameplay Loop (`PixiEngine` & `MultipleChoiceGame`)**
    *   `PixiEngine.update(deltaTime)` runs each frame via the ticker.
    *   Calls `this.currentGame.update(deltaTime)`.
    *   `MultipleChoiceGame.update(deltaTime)` handles game-specific logic:
        *   Updates animations, timers (via `TimerManager`), UI elements within the Pixi canvas.
        *   Renders the current question and answer options (managed perhaps by a `QuestionScene` helper class).
    *   `GameplayView` (React) passively displays overlays like scores, menus. It only updates when its state changes (e.g., due to an engine event).

7.  **User Interaction & Event Flow (Example: Correct Answer)**
    *   User clicks an interactive answer option (a PIXI object) in `MultipleChoiceGame`.
    *   The click handler within `MultipleChoiceGame` emits an event via the shared `EventBus`: `eventBus.emit(GAME_EVENTS.ANSWER_SELECTED, { teamId: 't1', answerValue: 'C', isCorrect: true, questionId: 'q5' })`.
    *   `RuleEngine` listens for `GAME_EVENTS.ANSWER_SELECTED`.
        *   It finds the rule defined in `GameConfig` ('score-correct-answer').
        *   It evaluates the rule's conditions against the event payload (e.g., `payload.isCorrect === true`). Condition matches.
        *   It executes the rule's actions: `modifyScore`.
        *   The `modifyScore` action handler within `RuleEngine` calls `scoringManager.addScore(payload.teamId, 10)`.
    *   `ScoringManager.addScore('t1', 10)` executes:
        *   Updates the score for team 't1' in its internal `scores` map.
        *   Saves updated scores via `StorageManager`.
        *   Emits `eventBus.emit(SCORING_EVENTS.SCORE_UPDATED, { teamId: 't1', currentScore: 110, previousScore: 100, delta: 10 })`.
    *   `GameplayView.handlePixiScoreUpdate` (React listener) catches the `SCORE_UPDATED` event.
        *   Calls `setPlayerScores(...)`, updating the React state.
        *   React re-renders the relevant `PlayerScore` component to show "110".
    *   `MultipleChoiceGame` (or potentially `RuleEngine` action) proceeds to the next question or game state logic.

8.  **Game End Condition**
    *   An end condition is met (e.g., `TimerManager` completes the main timer, `ScoringManager` detects zero lives, `MultipleChoiceGame` runs out of questions).
    *   The relevant component/manager emits an event signifying the end (e.g., `GAME_EVENTS.TIMER_COMPLETED`, `GAME_EVENTS.NO_MORE_QUESTIONS`).
    *   `RuleEngine` or `MultipleChoiceGame` logic handles this, potentially calling `gameStateManager.setPhase(GamePhase.GAME_OVER)`.
    *   `GameStateManager` emits `GAME_STATE_EVENTS.PHASE_CHANGED`. If appropriate, `GAME_STATE_EVENTS.GAME_ENDED` is also emitted (either by `GameStateManager` or the logic triggering the phase change).

9.  **Game Over Sequence (`GameplayView` -> `GameContainer` -> `GameOverScreen`)**
    *   `GameplayView.handlePixiGameOver` listener catches `GAME_STATE_EVENTS.GAME_ENDED`.
        *   It calls `pixiEngine.getScoringManager().getAllTeamData()` to get final scores and names.
        *   It calls the `onGameOver` prop (passed from `GameContainer`) with the `GameOverPayload`.
    *   `GameContainer.handleGameOver(payload)` executes:
        *   Updates state: `setFinalScores(payload.scores)`, `setWinnerName(payload.winner)`.
        *   Updates view state: `setCurrentView('gameover')`.
    *   `GameContainer` re-renders, now showing `GameOverScreen`, passing final scores, winner, and callbacks (`onPlayAgain`, `onExit`).

10. **Post-Game**
    *   User interacts with `GameOverScreen`, clicking "Play Again" or "Exit".
    *   `GameOverScreen` calls the appropriate callback (`onPlayAgain` or `onExit`).
    *   `GameContainer.handlePlayAgain` or `GameContainer.handleExit` executes:
        *   Resets `GameContainer` state (`setGameConfig(null)`, etc.).
        *   Uses `router` to navigate away (e.g., back to quiz selection).

11. **Cleanup**
    *   As `GameplayView` unmounts (due to navigation away), its `useEffect` cleanup function runs.
    *   Calls `pixiEngine.destroy()`.
    *   `PixiEngine.destroy()` stops the ticker, calls `currentGame.destroy()`, destroys the `PixiApplication`, and cleans up manager resources/listeners as needed.

File structure to consider for problem solving:


Okay, here is an up-to-date file structure based on our discussions and the files we've seen, excluding `/tests/`, `/docs/`, and any `/planning/` directory:

```
/c:/Users/LENOVO/Documents/PROGRAMMING/projects/atoz_pixi/
├── prisma/                   # Prisma schema, migrations
│   └── schema.prisma         # (Example file)
├── public/                   # Static assets (images, fonts)
│   └── images/
│       └── piggy.webp        # (Example file)
├── scripts/                  # Utility/build scripts
│   └── prd.txt               # Product Requirements Document source
├── src/
│   ├── app/                  # Next.js App Router: Pages and API Routes
│   │   ├── api/
│   │   │   ├── quizzes/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts # API for specific quiz
│   │   │   │   └── route.ts     # API for quizzes list
│   │   │   └── upload-quiz/
│   │   │       └── route.ts     # API for uploading quizzes
│   │   ├── games/              # Game selection/listing page(s) (example path)
│   │   │   └── page.tsx
│   │   ├── play/               # Game playing routes (example path)
│   │   │   └── [gameSlug]/
│   │   │       └── [quizId]/
│   │   │           └── page.tsx   # Renders GameContainer
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Root page (homepage)
│   ├── components/             # React UI Components
│   │   ├── game_ui/            # Components specific to the game interface
│   │   │   ├── GameContainer.tsx
│   │   │   ├── GameplayView.tsx
│   │   │   ├── GameSetupPanel.tsx
│   │   │   ├── GameSettingsPanel.tsx
│   │   │   ├── GameOverScreen.tsx
│   │   │   ├── MainMenuDropdown.tsx
│   │   │   ├── NavMenu.tsx
│   │   │   └── PlayerScore.tsx
│   │   └── ui/                 # shadcn/ui components (accordion, button, etc.)
│   │       ├── accordion.tsx   # (Example file)
│   │       └── button.tsx      # (Example file)
│   │       └── ...             # (Other shadcn components)
│   ├── lib/                    # Core libraries, utilities, engine
│   │   ├── pixi-engine/        # Core PixiJS Engine modules
│   │   │   ├── core/           # Engine core classes (PixiEngine, EventBus, Managers)
│   │   │   ├── config/         # Engine configuration interfaces (GameConfig)
│   │   │   ├── game/           # BaseGame class, game-related managers (Scoring, Timer)
│   │   │   ├── assets/         # AssetLoader
│   │   │   ├── ui/             # Reusable PixiJS UI components
│   │   │   ├── utils/          # Engine-specific utilities
│   │   │   ├── index.ts        # Engine entry point/exports
│   │   │   └── pixi-engine-structure.md # Documentation/Reference
│   │   ├── pixi-games/         # Specific game implementations
│   │   │   └── multiple-choice/ # Example: Multiple Choice Game
│   │   │       ├── MultipleChoiceGame.ts
│   │   │       └── ...         # (Scenes, UI specific to this game)
│   │   ├── trpc/               # tRPC setup (router, context, procedures) (Assuming exists)
│   │   ├── api-utils.ts        # Utilities for API responses/error handling
│   │   ├── db.ts               # Database interaction utilities (if any besides Prisma)
│   │   ├── formDataUtils.ts    # Utilities for handling FormData
│   │   ├── prisma.ts           # Prisma client instance and potentially helpers
│   │   ├── schemas.ts          # Zod or other validation schemas
│   │   ├── utils.ts            # General utility functions (e.g., cn for Tailwind)
│   │   └── README.md           # Readme for the lib directory
│   ├── stores/                 # State management stores (Zustand)
│   │   └── useGameStore.ts
│   ├── styles/                 # CSS styles
│   │   ├── globals.css
│   │   └── themes/
│   │       └── themes.module.css # Theme definitions
│   └── types/                  # Shared TypeScript types
│       ├── gameTypes.ts
│       └── question_types.ts
├── tasks/                    # Task Master files
│   ├── tasks.json            # Main task list file
│   ├── task_001.txt          # Individual task details
│   └── ...                   # (Other task files)
├── .env                      # Environment variables (local, not committed)
├── .gitignore
├── jest.config.js
├── jest.setup.js
├── next-env.d.ts
├── next.config.mjs           # Next.js configuration
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md                 # Project root README
```
