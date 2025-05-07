# Multiple Choice Game - Application Flow and Component Purposes

This document outlines the typical execution flow and the responsibilities of the key files involved in the Multiple Choice PixiJS game application.

## Overall Application Flow

1.  **UI Initialization (`GameContainer.tsx`):**
    *   The React application starts with `GameContainer`.
    *   It initially displays the `GameSetupPanel`.
    *   User configures game settings (teams, theme, intensity, power-ups, audio).
    *   On "Start Game", `handleStartGame` is called.

2.  **Configuration Assembly (`GameContainer.tsx`):**
    *   `handleStartGame` assembles the complete `GameConfig` object based on user selections and default settings. This includes:
        *   Quiz ID, game slug, teams.
        *   Game mode settings (e.g., 'score').
        *   Power-up configuration (`PowerupConfig`).
        *   Scoring rules (`RuleConfig`).
        *   Control mappings (`ControlsConfig`).
        *   Asset bundles (`AssetConfig`).
        *   Audio settings and sounds (`AudioConfiguration`).
        *   Theme selection.
    *   The view switches to 'playing', and the `GameConfig` is stored in state.

3.  **Engine Initialization (`GameplayView.tsx` -> `PixiEngine.ts`):**
    *   `GameplayView` (React component) renders and is responsible for mounting the Pixi canvas.
    *   It creates and initializes the `PixiEngine` instance, passing the assembled `GameConfig` and the `gameFactory` function (which points to `MultipleChoiceGame`).
    *   `PixiEngine.constructor`: Initializes core components like `PixiApplication`, `EventBus`, `StorageManager`, `GameStateManager`, `TimerManager`, `ControlsManager`, `ScoringManager`.
    *   `PixiEngine.init()`:
        *   Initializes `PixiApplication` (canvas, renderer).
        *   Initializes `PIXI.Assets` using asset paths from `GameConfig`. Starts background loading of asset bundles.
        *   Initializes remaining managers that depend on `GameConfig`:
            *   `ControlsManager` (with key mappings).
            *   `ScoringManager` (with team/mode info).
            *   `AudioManager` (with sounds from config, handles initial mute state).
            *   `PowerUpManager` (with power-up definitions from config).
            *   `RuleEngine` (subscribes to events based on rules in config, links to other managers for condition evaluation/action execution).
        *   Emits `ENGINE_READY_FOR_GAME` event.
        *   Calls the `gameFactory` to create the `MultipleChoiceGame` instance, passing the `config` and all initialized `managers`.
        *   Adds the `MultipleChoiceGame` view to the stage.
        *   Calls `MultipleChoiceGame.init()`, passing the asset bundle loading promise.
        *   Starts the main update ticker (`handleUpdate`).

4.  **Game Initialization (`MultipleChoiceGame.ts`):**
    *   `MultipleChoiceGame.initImplementation()`:
        *   Waits for engine-level asset bundles (`engineAssetsPromise`) to load.
        *   Shows a loading transition screen.
        *   Initializes game-specific managers:
            *   `MultipleChoiceLayoutManager`: Calculates initial layout parameters based on screen size.
            *   `MultipleChoiceDataManager`: Instantiated with quiz ID and config. Calls `loadData()` to fetch questions from the API and preload associated media using `PIXI.Assets`. This promise (`gameDataPromise`) is awaited alongside `engineAssetsPromise`.
            *   `GameBackgroundManager`: Loads and displays the static background image, adding its view behind other game elements.
            *   `MultipleChoiceUIManager`: Creates the `QuestionSceneV2`, instantiates the reusable `PixiTimer` component (passing theme config), and connects answer button callbacks. Adds its view and the `PixiTimer` view to the game stage.
        *   Initializes the `QuestionSequencer` within the `DataManager`.
        *   Hides the loading transition.
        *   Calls `_showQuestion()` to display the first question.
        *   Binds event listeners (e.g., `TIMER_COMPLETED`, `GAME_PAUSED`, `GAME_RESUMED`).
        *   Sets game phase to 'playing'.

5.  **Gameplay Loop (`MultipleChoiceGame.ts`, `MultipleChoiceUIManager.ts`, `QuestionSceneV2.ts`, `PixiTimer.ts`, `PixiEngine Managers`):**
    *   `_showQuestion()`:
        *   Gets the next question from `DataManager`/`Sequencer`.
        *   Calls `UIManager.clearQuestionState()` -> `Scene.clearAnswerOptions()`.
        *   Calls `UIManager.updateQuestionContent()` -> `QuestionScene.updateQuestion()` (updates text, loads/displays media).
        *   Calls `UIManager.setupAnswerButtons()` (creates buttons, positions them based on layout params from `LayoutManager` via `UIManager._updateAndApplyLayout` -> `Scene.updateLayout`, attaches `_handleAnswerSelected` callback).
        *   Calls `_startQuestionTimer()` (uses `TimerManager` to start the countdown logic, updates the `PixiTimer` display initially via `UIManager.updateTimerDisplay` -> `PixiTimer.updateDisplay`).
    *   **Timer Ticking:**
        *   `TimerManager` uses `requestAnimationFrame` for its internal tick loop.
        *   On each tick, `TimerManager` emits `TIMER_EVENTS.TIMER_TICK` via `EventBus`.
        *   `MultipleChoiceUIManager._handleTimerTick` listens for this event and calls `PixiTimer.updateDisplay(remaining, duration)` to update the visual timer component.
    *   **User Action (Answer):** User clicks an answer button.
    *   `_handleAnswerSelected()`:
        *   Triggered by `UIManager` button callback.
        *   Disables buttons (`UIManager.setAnswerButtonsEnabled(false)`).
        *   Gets question data from `DataManager`.
        *   Calls `_processAnswerSelection()`:
            *   Gets remaining time from `TimerManager`.
            *   Checks for active power-ups (`PowerUpManager`).
            *   Calculates score multiplier (e.g., for double points).
            *   Shows feedback (`UIManager.showAnswerFeedback`).
            *   Emits `GAME_EVENTS.ANSWER_SELECTED` via `EventBus` (payload includes correctness, team ID, remaining time, score multiplier).
            *   Stops timer (`TimerManager.removeTimer`).
        *   Waits for feedback delay.
        *   Checks if game is over (`DataManager.isSequenceFinished()`).
        *   If not over:
            *   Determines next team, updates state.
            *   Shows turn transition screen (`showTransition`), potentially triggering power-up roll.
            *   Calls `_showQuestion()` for the next turn.
            *   Re-enables buttons (`UIManager.setAnswerButtonsEnabled(true)`).
    *   **Timer Runs Out:**
    *   `_handleTimerComplete()`:
        *   Triggered by `TimerManager` via `EventBus`.
        *   Disables buttons.
        *   Calls `_handleTimeUp()` -> `_showTimeUpFeedback()` (`UIManager` shows feedback). Emits `ANSWER_SELECTED` event with `isCorrect: false`.
        *   Waits for feedback delay.
        *   Checks if game is over.
        *   If not over, proceeds to next turn transition and `_showQuestion()` similar to `_handleAnswerSelected`.
    *   **User Action (Pause/Resume):** User clicks the Settings/Menu icon in `GameplayView`.
    *   `GameControlDropdown.handleOpenChange`:
      *   Triggered by the dropdown's open/close state change.
      *   If opening: Emits `GAME_STATE_EVENTS.GAME_PAUSED` via `EventBus`.
      *   If closing: Emits `GAME_STATE_EVENTS.GAME_RESUMED` via `EventBus`.
      *   `MultipleChoiceGame._handleGamePaused` / `_handleGameResumed`:
        *   Listens for pause/resume events.
        *   Calls `TimerManager.pauseTimer()` or `TimerManager.resumeTimer()` for the `QUESTION_TIMER_ID`.
    *   `MultipleChoiceUIManager._handleGamePaused` / `_handleGameResumed`:
      *   Listens for pause/resume events.
      *   Calls `PixiTimer.pause()` or `PixiTimer.resume()` to update the visual state of the timer component.
    *   **Rule Processing (`RuleEngine.ts`):**
      *   Listens for events (e.g., `ANSWER_SELECTED`, `ENGINE_READY_FOR_GAME`).
      *   When an event matches a rule's trigger:
          *   Evaluates conditions (checks event payload, game state via `GameStateManager`, timer status via `TimerManager`, power-up status via `PowerUpManager`).
          *   If conditions met, executes actions (calls methods on `ScoringManager`, `GameStateManager`, `AudioManager`, `PowerUpManager`, etc.). For `ANSWER_SELECTED`, the `modifyScore` action calculates points based on `mode` (fixed/progressive), `remainingTimeMs`, `pointsPerSecond`/`points`, and applies the `scoreMultiplier` from the event payload.\n    
          
    *   **Updates (`PixiEngine.ts`, `MultipleChoiceGame.ts`):**
      *   `PixiEngine.update()` calls `PowerUpManager.update()` (handles durations) and `MultipleChoiceGame.update()`.\n    
    *   **Resizing (`PixiEngine.ts`, `MultipleChoiceUIManager.ts`, `QuestionSceneV2.ts`, `GameBackgroundManager.ts`):**
      *   Browser resize triggers `PixiApplication`\'s resize handler.
      *   `PixiEngine.handleResize` emits `ENGINE_EVENTS.RESIZED`.
      *   `MultipleChoiceUIManager._handleResize` calls `_updateAndApplyLayout`.
      *   `_updateAndApplyLayout` gets new params from `LayoutManager`, calculates bounds, calls `QuestionScene.updateLayout`, repositions the `PixiTimer` instance and buttons, and redraws the background panel (`UIManager.drawBackgroundPanel` -> `QuestionScene.drawBackgroundPanel`).
      *   `GameBackgroundManager._handleResize` scales/positions the background sprite.\n\n6.  
    **Game Over (`MultipleChoiceGame.ts`, `GameContainer.tsx`):**
      *   `_triggerGameOver()` is called when the question sequence finishes or an error occurs.
      *   Sets state `hasTriggeredGameOver`, `phase: \'gameOver\'`.
      *   Emits `GAME_STATE_EVENTS.GAME_ENDED`.
      *   Calls `game.end()` -> `endImplementation` (stops timers, disables UI).
      *   `GameStateManager` (likely listening for `GAME_ENDED`) gathers final scores from `ScoringManager`.
      *   `GameStateManager` determines the winner and emits `GAME_EVENTS.GAME_OVER` with scores and winner.
      *   `GameContainer.handleGameOver` listens for this event.
      *   Sets final scores/winner state and changes view to \'gameover\', displaying `GameOverScreen`.\n\n7.  
    **Cleanup (`PixiEngine.ts`, `GameContainer.tsx`):**
      *   User exits or plays again.
      *   `GameContainer` resets its state.
      *   If exiting `GameplayView`, its cleanup mechanism likely calls `PixiEngine.destroy()`.
      *   `PixiEngine.destroy()`: Stops ticker, destroys `currentGame`, destroys managers (RuleEngine, PowerUpManager, ScoringManager, ControlsManager, AudioManager), destroys `PixiApplication`, clears references.
      
## File Purposes

*   **`src/components/game_ui/GameContainer.tsx`:** Top-level React component managing the game\'s UI lifecycle (setup -> playing -> gameover). Assembles the `GameConfig` based on user input and passes it down. Handles navigation and state transitions between views.\n*   
    **`src/components/game_ui/GameplayView.tsx`:** React component responsible for rendering the PixiJS canvas container (`pixiMountPointRef`) and associated UI overlays (scores, nav menu). Initializes and manages the `PixiEngine` instance. Listens for game over events from the engine. Manages the state for UI elements like the NavMenu and renders the `GameControlDropdown`.\n*   
    **`src/components/game_ui/GameControlDropdown.tsx`:** React component (likely using ShadCN/Radix) providing a dropdown menu for audio settings and game actions (restart, quit). It *listens for its own open/close state* and emits `GAME_PAUSED` / `GAME_RESUMED` events directly via the passed `EventBus` prop.\n*   
    **`src/lib/pixi-engine/core/PixiEngine.ts`:** The main orchestrator for the PixiJS game. Initializes the Pixi application (`PixiApplication`), core managers (`EventBus`, `GameStateManager`, `TimerManager`, etc.), and the specific game instance (`MultipleChoiceGame`). Manages the game loop and engine lifecycle (init, update, destroy). Provides access to managers for the game instance.\n*   
    **`src/lib/pixi-engine/core/EventBus.ts`:** A typed event emitter providing a central communication hub for different parts of the engine and game using predefined event types.\n*   
    **`src/lib/pixi-engine/core/RuleEngine.ts`:** Processes game rules defined in the configuration. Listens for events via the `EventBus`, evaluates conditions based on game state and event payloads (using other managers), and executes actions (calling methods on other managers like `ScoringManager`, `AudioManager`, `PowerUpManager`).\n*   
    **`src/lib/pixi-engine/game/TimerManager.ts`:** Manages the *logic* of countdowns/countups. Creates, starts, pauses, resumes, and removes timers. Uses `requestAnimationFrame` for internal ticking and emits `TIMER_TICK` and `TIMER_COMPLETED` events via the `EventBus`. Handles pause/resume commands triggered by `GAME_PAUSED`/`GAME_RESUMED` events.\n*   
    **`src/lib/pixi-games/multiple-choice/MultipleChoiceGame.ts`:** The core logic class for the Multiple Choice game mode, extending `BaseGame`. Manages the game flow (showing questions, handling answers/timeouts), initializes and coordinates its specific managers (`DataManager`, `UIManager`, `LayoutManager`, `BackgroundManager`), interacts with `PixiEngine` managers (scoring, timer, power-ups), and handles game state updates. Listens for `GAME_PAUSED`/`GAME_RESUMED` to command the `TimerManager`.\n*   
    **`src/lib/pixi-games/multiple-choice/managers/MultipleChoiceDataManager.ts`:** Responsible for fetching quiz data (questions, answers) from an API, preloading associated media assets (images, GIFs) using `PIXI.Assets`, and providing access to questions, potentially via a `QuestionSequencer` for managing question order and progression.\n*   
    **`src/lib/pixi-games/multiple-choice/managers/MultipleChoiceLayoutManager.ts`:** Determines responsive layout parameters (sizes, positions, padding, fonts) based on the current screen dimensions and aspect ratio. Defines different layout profiles (e.g., phone, tablet, desktop) and selects the appropriate one.\n*   
    **`src/lib/pixi-games/multiple-choice/managers/GameBackgroundManager.ts`:** Manages the static visual background for the game screen. Loads the background image asset and ensures it scales correctly to cover the screen during resize events.\n*   
    **`src/lib/pixi-games/multiple-choice/managers/MultipleChoiceUIManager.ts`:** Manages the user interface elements *excluding* the timer display. Creates and updates the `QuestionSceneV2` and answer buttons. Instantiates and positions the reusable `PixiTimer` component. Listens for `TIMER_TICK` events to update the `PixiTimer`\'s display. Listens for `GAME_PAUSED`/`GAME_RESUMED` events to visually pause/resume the `PixiTimer`. It retrieves layout parameters from the `LayoutManager` and applies them to elements in the `QuestionSceneV2`. Handles UI updates based on game events (resize) and user interactions (button presses).\n*   
    **`src/lib/pixi-games/multiple-choice/scenes/QuestionSceneV2.ts`:** A PIXI `Container` representing the visual scene for displaying a question. Holds the PIXI objects for the question text, media (image/GIF), answer button container, and background panel. It *receives* content updates and layout instructions from the `MultipleChoiceUIManager` and applies them to its child PIXI objects. Provides methods to update content and draw the background panel.\n*   
    **`src/lib/pixi-games/multiple-choice/ui/PixiTimer.ts`:** A reusable PIXI `Container` responsible *only* for the visual representation of a circular timer. It receives updates (`updateDisplay(remaining, duration)`) and draws the progress arc and text accordingly. It includes methods (`pause()`, `resume()`) to change its visual appearance when the game is paused/resumed, triggered by the `UIManager`. It does *not* handle timekeeping logic itself.\n
