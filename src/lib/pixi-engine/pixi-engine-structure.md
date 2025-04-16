**Game Flow from "Play" to Answer Selection:**

1.  **User Action:** The user configures the game settings (teams, theme, options) in the `GameSetupPanel` component (`src/components/game_ui/GameSetupPanel.tsx`).
2.  **Initiate Game:** The user clicks the "Play" button.
3.  **`handlePlayGame` Triggered:** This function within `GameSetupPanel` executes.
    *   It gathers all the selected settings (teams, theme, intensity, powerups, etc.) into a `config` object.
    *   Crucially, it calls the `onStartGame` prop function, passing this `config` object upwards to the parent component that rendered `GameSetupPanel`.
4.  **Parent Component (e.g., `GameManager` / Page):** A higher-level component receives the `config` via the `onStartGame` callback. This component is responsible for managing the transition from UI setup to the actual game engine.
    *   **Game Initialization:** This parent component likely initializes the PixiJS game instance. This might involve:
        *   Fetching the selected quiz data (questions, answers, media URLs) based on `initialGameSlug` or another identifier.
        *   Instantiating the core PixiJS engine logic (potentially a class wrapping PIXI.Application or a specific game controller like `MultipleChoiceGame`).
        *   Loading necessary game assets (images, sounds, fonts) using `PIXI.Assets`.
        *   Creating instances of necessary game scenes, including `QuestionScene` (`src/lib/pixi-games/multiple-choice/scenes/QuestionScene.ts`). Note that `QuestionScene` now takes dependencies like `EventBus` in its constructor, which would be provided during this initialization.
    *   **Mounting Pixi:** The parent component mounts the PixiJS canvas onto the DOM.
5.  **First Question Setup:** The game logic (within the parent component or a dedicated game controller) takes the loaded quiz data and the `config`.
    *   It selects the first question to display.
    *   It calls `QuestionScene.updateQuestion()`, passing the question text and the URL of any associated media (image/GIF).
6.  **`QuestionScene` Update:** Inside `updateQuestion`:
    *   The `questionText` element is updated.
    *   If media exists, the previous media (`questionMedia`) is destroyed.
    *   The new media is loaded (using `PIXI.Assets.get` - ideally preloaded) and displayed (as `PIXI.Sprite` or `PIXI.AnimatedSprite` via `createAnimatedFallback`).
    *   `_positionElements` is called to arrange the text and media.
7.  **Answer Options Display:** The game logic component is responsible for creating the interactive answer options.
    *   It iterates through the answer choices for the current question.
    *   For each choice, it likely creates a PIXI display object (e.g., a `PIXI.Container` with a background `PIXI.Graphics` and a `PIXI.Text` label).
    *   These answer option objects are made interactive (`interactive = true`).
    *   Event listeners (e.g., `'pointerdown'` or `'click'`) are attached to each answer option.
    *   These fully constructed answer options are added as children to the `answerOptionsContainer` obtained via `QuestionScene.getAnswerOptionContainer()`.
8.  **User Action:** The user clicks/taps on one of the displayed answer option objects within the `QuestionScene`.
9.  **Answer Selection Event:**
    *   The event listener attached to the clicked answer option fires.
    *   The handler function (defined by the game logic component) executes.
    *   This handler typically emits a custom event via the `EventBus` (e.g., `'answerSelected'`), passing data identifying the chosen answer.
10. **Game Logic Response:** The main game logic listens for the `'answerSelected'` event on the `EventBus`. When received, it processes the answer: checks correctness, updates scores, provides feedback (visual/audio), and prepares to load the next question or end the game state.

**`src/lib` File Structure:**

Key directories for the game flow described are:

*   `pixi-engine/`: Likely contains the core PixiJS setup, asset loading, scene management, and potentially the `EventBus`.
*   `pixi-games/`: Contains game-specific logic, like the `multiple-choice` game type and its scenes (`QuestionScene`).

File structure to consider for problem solving:

src/lib/
├── pixi-engine/
│   ├── core/
│   │   ├── PixiEngine.ts
│   │   ├── PixiApplication.ts
│   │   ├── EventBus.ts
│   │   ├── EventTypes.ts
│   │   ├── GameStateManager.ts
│   │   ├── RuleEngine.ts
│   │   ├── ControlsManager.ts
│   │   ├── StorageManager.ts
│   ├── utils/
│   │   ├── index.ts
│   │   ├── ResponsiveCanvas.ts
│   ├── ui/
│   │   └── index.ts
│   ├── assets/
│   │   └── AssetLoader.ts
│   ├── game/
│   │   ├── ScoringManager.ts
│   │   ├── PowerUpManager.ts
│   │   ├── BaseGame.ts
│   │   ├── TimerManager.ts
│   ├── config/
│   │   └── GameConfig.ts
│   └── index.ts
├── pixi-games/
│   └── multiple-choice/
│       ├── ui/
│       │   └── PixiTimer.ts
│       ├── scenes/
│       │   └── QuestionScene.ts
│       ├── MultipleChoiceGame.ts
│       └── game-context.mdc
├── README.md
├── api-utils.ts
├── formDataUtils.ts
├── db.ts
├── schemas.ts
├── prisma.ts
└── utils.ts