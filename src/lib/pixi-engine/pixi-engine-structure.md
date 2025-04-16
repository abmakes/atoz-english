**Game Flow from "Play" to Answer Selection:**

1.  **User Action:** The user configures the game settings (teams, theme, options) in a UI component (e.g., `GameSetupPanel` - likely outside `src/lib`).
2.  **Initiate Game:** The user clicks the "Play" button.
3.  **`handlePlayGame` Triggered:** A function in the UI component executes.
    *   It gathers settings (teams, theme, intensity, powerups, etc.) into a `config` object (potentially matching `src/lib/pixi-engine/config/GameConfig.ts`).
    *   It calls a function (e.g., `onStartGame`) to pass this `config` to a higher-level controller or page component.
4.  **Game Management Layer (e.g., Page Component):** This component receives the `config`.
    *   **Game Initialization:** It likely initializes the core PixiJS engine (e.g., `src/lib/pixi-engine/core/PixiEngine.ts` or `src/lib/pixi-engine/core/PixiApplication.ts`). This involves:
        *   Fetching quiz data based on user selection.
        *   Instantiating the specific game controller (e.g., `src/lib/pixi-games/multiple-choice/MultipleChoiceGame.ts`).
        *   Loading assets via `src/lib/pixi-engine/assets/AssetLoader.ts` (using `PIXI.Assets`).
        *   Instantiating necessary scenes, like `src/lib/pixi-games/multiple-choice/scenes/QuestionScene.ts`, providing dependencies like the `EventBus` (`src/lib/pixi-engine/core/EventBus.ts`).
        *   Initializing managers like `ScoringManager` (`src/lib/pixi-engine/game/ScoringManager.ts`), `TimerManager` (`src/lib/pixi-engine/game/TimerManager.ts`), `RuleEngine` (`src/lib/pixi-engine/core/RuleEngine.ts`).
    *   **Mounting Pixi:** The component mounts the PixiJS canvas onto the DOM.
5.  **First Question Setup (within `MultipleChoiceGame` or similar):**
    *   Selects the first question from the loaded data.
    *   Calls `QuestionScene.updateQuestion()`, passing question text and media URL.
6.  **`QuestionScene` Update (`src/lib/pixi-games/multiple-choice/scenes/QuestionScene.ts`):**
    *   Updates the question text element.
    *   Handles media display (loading via `PIXI.Assets`, displaying as `Sprite` or `AnimatedSprite`).
    *   Positions elements on the scene.
7.  **Answer Options Display (within `MultipleChoiceGame` or `QuestionScene`):**
    *   Iterates through answer choices for the current question.
    *   Creates interactive PIXI display objects for each answer.
    *   Attaches event listeners (e.g., `'pointerdown'`) to each answer option.
    *   Adds answer options to the `answerOptionsContainer` provided by `QuestionScene.getAnswerOptionContainer()`.
8.  **User Action:** User clicks/taps an answer option.
9.  **Answer Selection Event:**
    *   The event listener fires.
    *   The handler emits an event via the `EventBus` (e.g., `'answerSelected'`, defined in `src/lib/pixi-engine/core/EventTypes.ts`), passing necessary data (chosen answer, question details).
10. **Game Logic Response (e.g., in `MultipleChoiceGame`):**
    *   Listens for the `'answerSelected'` event on the `EventBus`.
    *   Uses the `RuleEngine` (`src/lib/pixi-engine/core/RuleEngine.ts`) to evaluate the selected answer against game rules (correctness, timing).
    *   Updates score via `ScoringManager` (`src/lib/pixi-engine/game/ScoringManager.ts`).
    *   Provides feedback (visual/audio).
    *   Manages game state transition (next question or end game) via `GameStateManager` (`src/lib/pixi-engine/core/GameStateManager.ts`).

**`src/lib` File Structure:**

Key directories for the game flow described are:

*   `pixi-engine/`: Contains the core PixiJS setup, asset loading, scene management, event bus, core managers (`RuleEngine`, `GameStateManager`, `ScoringManager`, `TimerManager`).
*   `pixi-games/`: Contains game-specific logic, like the `multiple-choice` game type and its scenes (`QuestionScene`).

File structure to consider for problem solving:

rc/lib/
├── pixi-engine/
│ ├── core/
│ │ ├── PixiEngine.ts # Main engine setup/wrapper
│ │ ├── PixiApplication.ts # PIXI.Application specific setup
│ │ ├── EventBus.ts # Central event hub
│ │ ├── EventTypes.ts # Definitions for events
│ │ ├── GameStateManager.ts # Manages game states (loading, playing, score)
│ │ ├── RuleEngine.ts # Evaluates game rules and conditions
│ │ ├── ControlsManager.ts # Handles user input mapping (optional)
│ │ ├── StorageManager.ts # Handles local/session storage (optional)
│ │ └── index.ts
│ ├── utils/
│ │ ├── index.ts
│ │ ├── ResponsiveCanvas.ts # Handles canvas resizing
│ │ └── # other utility functions...
│ ├── ui/ # Reusable Pixi UI components (Buttons, Labels)
│ │ └── index.ts
│ ├── assets/
│ │ └── AssetLoader.ts # Manages loading game assets
│ ├── game/
│ │ ├── ScoringManager.ts # Tracks and updates scores
│ │ ├── PowerUpManager.ts # Manages power-up logic (if any)
│ │ ├── BaseGame.ts # Abstract class for common game logic
│ │ ├── TimerManager.ts # Manages game/question timers
│ │ └── index.ts
│ ├── config/
│ │ ├── GameConfig.ts # Defines game configuration structure
│ │ └── index.ts
│ └── index.ts # Exports core engine functionalities
├── pixi-games/
│ └── multiple-choice/ # Specific game type logic
│ ├── ui/
│ │ └── PixiTimer.ts # Visual timer display component for this game
│ ├── scenes/
│ │ └── QuestionScene.ts # Scene for displaying questions/answers
│ ├── MultipleChoiceGame.ts # Controller logic for this game mode
│ ├── game-context.mdc # Specific rules/context for this game type
│ └── index.ts
├── README.md # Overall library README
├── api-utils.ts # Utilities for API calls (if needed within lib)
├── formDataUtils.ts # Utilities for form data (if needed within lib)
├── db.ts # Database client (if needed within lib)
├── schemas.ts # Data validation schemas (Zod, etc.)
├── prisma.ts # Prisma client instance (if used directly in lib)
└── utils.ts # General utility functions