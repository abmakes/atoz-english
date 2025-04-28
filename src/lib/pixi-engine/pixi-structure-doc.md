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
    *   `GameSetupPanel` displays configuration options (Team names, Theme selector, Intensity timer buttons, **Game Features (Basic/Boosted)**, Limited guesses options, Powerup toggles, etc.).
    *   User interacts with `GameSetupPanel`, updating its internal state (e.g., adds team "Eagles", selects "Forest" theme, chooses 10s intensity, **selects "Boosted" features**).
    *   User clicks the "Play" button in `GameSetupPanel`.

3.  **Configuration Handoff (`GameSetupPanel` -> `GameContainer`)**
    *   `GameSetupPanel.handlePlayGame` executes:
        *   It gathers the user's selections into a `setupConfig` object (matching `Omit<GameSetupData, 'quizId' | 'gameSlug'>`, **including `gameFeatures`**).
        *   It calls the `onStartGame` prop (provided by `GameContainer`) passing this `setupConfig` object.

4.  **Engine Configuration Assembly (`GameContainer`)**
    *   `GameContainer.handleStartGame(setupData)` executes:
        *   **Fetches Quiz Details:** Makes an API call `GET /api/quizzes/quiz-123` to retrieve the full quiz data.
        *   **Loads Base `GameConfig`:** Retrieves a template or default configuration structure.
        *   **Constructs `GameConfig`:** Merges `setupData` and quiz details into the base config. **Sets `initialMusicMuted` and `initialSfxMuted` based on `setupData.settings`.**
        *   **Dynamically Configures Rules:** Specifically finds the scoring rule(s) (e.g., for correct answers) and modifies the `params` of the `modifyScore` action based on `setupData.gameFeatures`:
            *   If 'Boosted', sets mode to `progressive`, adds `timerId` and `pointsPerSecond`.
            *   If 'Basic', sets mode to `fixed`, adds `points`.
        *   Updates its internal state: `setGameConfig(fullEngineConfig)`.
        *   Updates theme state: `setThemeClassName(...)` based on `setupData.theme`.
        *   Updates view state: `setCurrentView('playing')`.

5.  **Engine Initialization (`GameContainer` -> `GameplayView` -> `PixiEngine`)**
    *   `GameContainer` re-renders, showing `GameplayView` with the dynamically adjusted `gameConfig`.
    *   `GameplayView` mounts, creates `PixiEngine`, calls `pixiEngine.init(gameConfig, gameFactory)`.
    *   `PixiEngine.init(config, factory)` executes:
        *   Initializes `PixiApplication`.
        *   Initializes core managers (`EventBus`, `StorageManager`, etc.).
        *   **Initializes `AudioManager`, using theme/config path and initial mute states.**
        *   Configures other managers (`ScoringManager`, `ControlsManager`, `RuleEngine`, `PowerUpManager`) using `config`.
        *   **Creates the `TransitionScreen` instance within `BaseGame`.**
        *   Loads/Preloads assets.
        *   Calls `gameFactory` -> `new MultipleChoiceGame(config, managers)`.
        *   Adds game view to stage.
        *   Calls `currentGame.init()`.
            *   `MultipleChoiceGame.initImplementation()`:
                *   **Calls `this.showTransition({ type: 'loading', ... })`**.
                *   Loads game data (questions, media).
                *   **Calls `this.hideTransition()`**.
                *   Sets up UI, binds events.
                *   Shows first question.
        *   Starts Pixi ticker.
    *   `GameplayView` attaches listeners.

6.  **Gameplay Loop (`PixiEngine` & `MultipleChoiceGame`)**
    *   `PixiEngine.update(deltaTime)` runs each frame via the ticker.
    *   Calls `this.currentGame.update(deltaTime)`.
    *   `MultipleChoiceGame.update(deltaTime)` handles game-specific logic:
        *   Updates animations, timers (via `TimerManager`), UI elements within the Pixi canvas.
        *   Renders the current question and answer options (managed perhaps by a `QuestionScene` helper class).
    *   `GameplayView` (React) passively displays overlays like scores, menus. It only updates when its state changes (e.g., due to an engine event).

7.  **User Interaction & Event Flow (Example: Correct Answer in Boosted Mode)**
    *   User clicks correct answer in `MultipleChoiceGame`.
    *   `_handleAnswerSelected`:
        *   Gets `remainingTimeMs`.
        *   **Calls `_processAnswerSelection`:**
            *   Shows visual feedback.
            *   Emits `GAME_EVENTS.ANSWER_SELECTED` (with `isCorrect: true`, `teamId`, `remainingTimeMs`).
            *   Removes the question timer.
    *   `RuleEngine` receives event:
        *   Processes `score-correct-answer` rule:
            *   Condition matches.
            *   Executes `modifyScore` action (progressive mode): Calculates points using `remainingTimeMs` from payload, calls `scoringManager.addScore()`.
        *   Processes `play-correct-sound` rule:
            *   Condition matches.
            *   Executes `playSound` action.
            *   `RuleEngine` calls `audioManager.play('correct-sound')`.
            *   `AudioManager` plays the sound.
    *   `ScoringManager` emits `SCORING_EVENTS.SCORE_UPDATED`.
    *   `GameplayView` updates score display.
    *   (Back in `_handleAnswerSelected` after delay):
        *   If game not over, determines next team.
        *   **Calls `this.showTransition({ type: 'turn', ... })` to show next team's turn.**
        *   After transition hides (auto or manual), calls `_showQuestion()` for next turn.

8.  **Game End Condition**
    *   An end condition is met (e.g., `TimerManager` completes the main timer, `ScoringManager` detects zero lives, `MultipleChoiceGame` runs out of questions).
    *   The relevant component/manager emits an event signifying the end (e.g., `GAME_EVENTS.TIMER_COMPLETED`, `GAME_EVENTS.NO_MORE_QUESTIONS`).
    *   `RuleEngine` or `MultipleChoiceGame` logic handles this, potentially calling `gameStateManager.setPhase(GamePhase.GAME_OVER)`.
    *   `GameStateManager` emits `GAME_STATE_EVENTS.PHASE_CHANGED`. If appropriate, `GAME_STATE_EVENTS.GAME_ENDED` is also emitted (either by `GameStateManager` or the logic triggering the phase change).

9.  **Game Over Sequence (`GameplayView` -> `GameContainer` -> `GameOverScreen`)**
    *   `GameplayView` catches `GAME_ENDED` event.
    *   Gets final scores via `pixiEngine.getScoringManager().getAllTeamData()`.
    *   Calls `onGameOver` prop with `GameOverPayload`.
    *   `GameContainer.handleGameOver(payload)` updates state (`finalScores`, `winnerName`).
    *   `setCurrentView('gameover')`.
    *   `GameContainer` re-renders `GameOverScreen`.
    *   **`GameOverScreen` calculates the maximum score, identifies players with that score, and displays "{Winner} Wins!" or "It's a Tie!" accordingly. Highlights all winning players.**
    *   **Plays victory sound via `new Audio()` in `useEffect`.**

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
