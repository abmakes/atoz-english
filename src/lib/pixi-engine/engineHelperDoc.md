# PixiJS Game Engine - Architecture Overview & Context

This document provides a high-level overview of the PixiJS game engine architecture used in this project. Its purpose is to help understand the roles of different components and how they interact, aiding in debugging and expansion without needing to read the entire codebase for every query.

## Core Concepts

*   **Managers:** Self-contained classes responsible for specific domains (e.g., audio, scoring, timers, game state). They often interact via the EventBus.
*   **`PixiEngine`:** The central orchestrator that initializes and holds references to all managers and the current game instance.
*   **`PixiApplication`:** A wrapper around the core PixiJS `Application`, handling canvas setup, rendering loop (ticker), and resizing.
*   **`EventBus`:** A critical component for decoupled communication. Managers and game instances emit events, and others subscribe to react to those events. Event types are defined in `EventTypes.ts`.
*   **`BaseGame`:** An abstract class that specific game modes (like `MultipleChoiceGame`) extend. It defines the standard game lifecycle (`init`, `start`, `update`, `render`, `end`, `destroy`) and provides access to engine managers.
*   **Game Loop:** Managed by `PixiEngine` using the `PixiApplication` ticker. The engine calls the `update` and `render` methods of the current `BaseGame` instance each frame.
*   **Game State:** Primarily managed by `GameStateManager` (phases like 'loading', 'playing', 'gameOver') and the specific `BaseGame` implementation (e.g., current question, active team). React UI (`GameContainer`, `GameplayView`) also holds UI-related state.
*   **React UI (`GameContainer`, `GameplayView`):** Responsible for the overall application structure, setup screens, game over screens, and rendering the PixiJS canvas via `GameplayView`. It initializes the `PixiEngine` and listens for high-level engine events (like `GAME_ENDED`) via the `EventBus`.

## Component Breakdown & Interactions

1.  **`GameContainer.tsx` (React)**
    *   **Role:** Top-level UI component. Manages views (Setup, Playing, GameOver). Gathers user settings.
    *   **Interactions:**
        *   Receives user input from `GameSetupPanel`.
        *   Assembles the `GameConfig`.
        *   Renders `GameplayView` when switching to 'playing' state, passing the `GameConfig` and a `gameFactory`.
        *   Listens for game over events from `GameplayView` (which proxies them from `PixiEngine`) to switch to the 'gameover' view.
        *   Handles routing/cleanup when exiting the game.

2.  **`GameplayView.tsx` (React)**
    *   **Role:** Renders the actual gameplay UI overlays (scores, nav menu) and the PixiJS canvas mount point. Manages the `PixiEngine` lifecycle.
    *   **Interactions:**
        *   Receives `GameConfig` and `gameFactory` from `GameContainer`.
        *   Creates and initializes the `PixiEngine` instance (`engineInstanceRef`) within a `useEffect`.
        *   Passes the `pixiMountPointRef` to the engine for canvas mounting.
        *   Uses the engine's `EventBus` (`managersRef.current.eventBus`) to:
            *   Listen for `GAME_ENDED`, `SCORE_UPDATED`, `ACTIVE_TEAM_CHANGED` to update React state (scores, active player highlight).
            *   Listen for `SETTINGS_EVENTS` to sync local audio state (volume, mute) with `AudioManager`.
            *   Emit `SETTINGS_EVENTS` when UI controls (volume slider, mute toggles in `GameControlDropdown`) are changed.
        *   Renders child UI components like `PlayerScore`, `NavMenu`, `GameControlDropdown`, passing necessary data and callbacks (like `onExit`).
        *   Calls `PixiEngine.destroy()` during component unmount cleanup.

3.  **`GameControlDropdown.tsx` (React)**
    *   **Role:** UI component providing audio controls and game actions (Restart, Quit) within a dropdown.
    *   **Interactions:**
        *   Receives `EventBus` instance, audio state (`musicMuted`, `sfxMuted`), and action callbacks (`onMusicToggle`, etc.) from `GameplayView`.
        *   Uses `onOpenChange` (dropdown visibility change) to directly emit `GAME_PAUSED` and `GAME_RESUMED` events via the `eventBus`.
        *   Emits `SETTINGS_EVENTS` via `eventBus` when internal controls (volume slider, mute toggles) are changed.
        *   Calls action callbacks (`onRestartGame`, `onQuitGame`) passed from `GameplayView`.

4.  **`PixiEngine.ts` (Core Engine)**
    *   **Role:** Orchestrator. Initializes, holds, and provides access to all managers and the current game instance. Manages the main update loop.
    *   **Interactions:**
        *   Constructor: Initializes `PixiApplication`, `EventBus`, `StorageManager`, `GameStateManager`, `TimerManager`, `ControlsManager`, `ScoringManager`.
        *   `init()`: Initializes remaining managers (`AudioManager`, `PowerUpManager`, `RuleEngine`) using `GameConfig`. Calls the `gameFactory` to create the specific `BaseGame` instance. Initializes `PIXI.Assets`. Calls `currentGame.init()`. Starts the ticker (`handleUpdate`). Emits `ENGINE_READY_FOR_GAME`.
        *   `handleUpdate()`: Called by the ticker. Calculates delta time. Calls `PowerUpManager.update()` and `currentGame.update()`.
        *   `handleResize()`: Called by `PixiApplication`. Emits `ENGINE_EVENTS.RESIZED`. Calls `currentGame.onResize()`.
        *   `destroy()`: Stops ticker, calls `currentGame.destroy()`, calls `destroy()` on managers, destroys `PixiApplication`.
        *   Provides `getManagers()` for `BaseGame` access.

5.  **`PixiApplication.ts` (Core Engine)**
    *   **Role:** Wrapper for PixiJS `Application`. Handles canvas creation, appending to DOM (`targetElement`), renderer setup, ticker management, and resize events.
    *   **Interactions:**
        *   Initialized by `PixiEngine`.
        *   Provides the main `app.stage` container.
        *   Provides the `app.ticker` used by `PixiEngine` for the update loop.
        *   Handles window or target element resizing and calls the `onResize` callback provided by `PixiEngine`.

6.  **`EventBus.ts` (Core Engine)**
    *   **Role:** Central communication hub using `EventEmitter3`. Enforces typed events defined in `EventTypes.ts`.
    *   **Interactions:** Used by almost all components to emit and listen for events, decoupling direct dependencies.

7.  **`GameStateManager.ts` (Core Engine)**
    *   **Role:** Tracks the high-level game phase (Loading, Playing, Paused, GameOver, etc.).
    *   **Interactions:**
        *   Initialized by `PixiEngine`.
        *   `setPhase()` called by `BaseGame` or `RuleEngine` to change phase. Emits `GAME_STATE_EVENTS.PHASE_CHANGED`.
        *   `setActiveTeam()` called by `BaseGame` or `RuleEngine`. Emits `GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED`.
        *   Listened to by `RuleEngine` (for conditions) and potentially `BaseGame` implementations.

8.  **`BaseGame.ts` (Core Engine - Abstract)**
    *   **Role:** Defines the interface and common functionality for all game modes. Provides manager access to subclasses. Handles lifecycle and state management boilerplate. Manages transition screen.
    *   **Interactions:**
        *   Extended by specific games (e.g., `MultipleChoiceGame`).
        *   Receives manager instances from `PixiEngine`.
        *   Implements lifecycle methods called by `PixiEngine` (`init`, `update`, `render`, `end`, `destroy`, `onResize`, `pause`, `resume`). Subclasses override abstract methods (`initImplementation`, `start`, `update`, `render`, `endImplementation`, `destroyImplementation`, `createInitialState`).
        *   Provides `setState`, `getState` for subclasses.
        *   Provides event helpers (`registerEventListener`, `emitEvent`, `emitGameEvent`).
        *   Interacts with `TransitionScreen`.
        *   Listens for `TRANSITION_EVENTS.POWERUP_SELECTED` (subclasses override `_handlePowerupSelected`).

9.  **`MultipleChoiceGame.ts` (Game Logic)**
    *   **Role:** Implements the specific logic for the multiple-choice quiz game.
    *   **Interactions:**
        *   Extends `BaseGame`.
        *   `initImplementation`: Creates and initializes its specific managers (`DataManager`, `UIManager`, `LayoutManager`, `BackgroundManager`). Loads data. Shows first question. Binds game-specific event listeners (`TIMER_COMPLETED`, `GAME_PAUSED`, `GAME_RESUMED`).
        *   `_showQuestion`: Coordinates `DataManager` (get question), `UIManager` (display question/answers), `TimerManager` (start timer).
        *   `_handleAnswerSelected`: Handles callbacks from `UIManager`, processes answer logic, interacts with `TimerManager`, `ScoringManager` (indirectly via `ANSWER_SELECTED` event), `PowerUpManager`, emits `ANSWER_SELECTED`, manages turn progression and transitions.
        *   `_handleTimerComplete`: Handles `TIMER_COMPLETED` event, processes timeout logic, emits `ANSWER_SELECTED`, manages turn progression.
        *   `_handleGamePaused`/`_handleGameResumed`: Listens for events, calls `TimerManager.pauseTimer`/`resumeTimer`.
        *   `_handlePowerupSelected`: Overrides base method to activate power-ups using `PowerUpManager`.

10. **`MultipleChoiceDataManager.ts` (Game Logic)**
    *   **Role:** Fetches and manages question data and related media for the multiple-choice game.
    *   **Interactions:**
        *   Initialized by `MultipleChoiceGame`.
        *   `loadData`: Fetches quiz from API, calls `PIXI.Assets.load` for media URLs.
        *   `initializeSequencer`: Creates `QuestionSequencer`.
        *   Provides methods (`getNextQuestion`, `isSequenceFinished`, `getQuestionById`) used by `MultipleChoiceGame`.

11. **`MultipleChoiceLayoutManager.ts` (Game Logic)**
    *   **Role:** Calculates layout parameters (sizes, positions, fonts) based on screen dimensions.
    *   **Interactions:**
        *   Initialized by `MultipleChoiceGame`.
        *   `updateLayout`: Called by `MultipleChoiceUIManager` during resize/content updates.
        *   `getLayoutParams`: Called by `MultipleChoiceUIManager` to retrieve current parameters for applying layout.

12. **`MultipleChoiceUIManager.ts` (Game Logic)**
    *   **Role:** Manages the creation, update, and positioning of UI elements *within* the PixiJS scene for the multiple-choice game (question text/media, answer buttons, background panel). Applies layouts. Manages the reusable `PixiTimer` component.
    *   **Interactions:**
        *   Initialized by `MultipleChoiceGame`.
        *   Creates `QuestionSceneV2` and `PixiTimer`.
        *   Calls methods on `QuestionSceneV2` (`updateQuestion`, `clearAnswerOptions`, `drawBackgroundPanel`).
        *   Calls methods on `PixiTimer` (`updateDisplay`, `pause`, `resume`).
        *   Calls `LayoutManager.getLayoutParams()` to get layout rules.
        *   Calls `LayoutManager.updateLayout()` during resize.
        *   Listens for `TIMER_EVENTS.TIMER_TICK` to update `PixiTimer`.
        *   Listens for `GAME_STATE_EVENTS.GAME_PAUSED`/`GAME_RESUMED` to pause/resume `PixiTimer` visuals.
        *   Listens for `ENGINE_EVENTS.RESIZED` to trigger layout updates.
        *   Handles button clicks and calls back to `MultipleChoiceGame` (`gameRef.handleAnswerSelected`).

13. **`PixiTimer.ts` (Game UI Component)**
    *   **Role:** Reusable component to visually display a circular progress timer with text.
    *   **Interactions:**
        *   Instantiated by `MultipleChoiceUIManager`.
        *   `updateDisplay()`: Called by `UIManager` on timer ticks. Updates internal PIXI graphics/text.
        *   `pause()`/`resume()`: Called by `UIManager` on game pause/resume events to change visual style.

14. **`GameBackgroundManager.ts` (Game Logic)**
    *   **Role:** Manages the static background image.
    *   **Interactions:**
        *   Initialized by `MultipleChoiceGame`.
        *   Loads texture using `PIXI.Assets`.
        *   Listens for `ENGINE_EVENTS.RESIZED` to scale/position the background sprite.

15. **Other Managers (Core Engine):**
    *   **`TimerManager`:** Manages timekeeping logic. Creates/starts/stops/pauses/resumes timers. Emits `TIMER_TICK`, `TIMER_COMPLETED`, etc. Controlled by `MultipleChoiceGame`. Listened to by `MultipleChoiceUIManager` (for ticks) and `RuleEngine`.
    *   **`ScoringManager`:** Tracks scores/lives. Methods (`addScore`, `removeLives`) called by `RuleEngine` actions. Emits `SCORE_UPDATED`, `LIFE_LOST`, `TEAM_ELIMINATED`. Listened to by `GameplayView` (for display) and `RuleEngine`.
    *   **`PowerUpManager`:** Manages power-up definitions and active instances/durations. Methods (`activatePowerUp`, `isPowerUpActiveForTarget`, `update`) called by `BaseGame`/`MultipleChoiceGame` and `PixiEngine`. Emits `POWERUP_EVENTS`. Listened to by `RuleEngine`.
    *   **`RuleEngine`:** Listens for various events. Evaluates conditions using other managers. Executes actions by calling methods on other managers (`ScoringManager`, `AudioManager`, `PowerUpManager`, `GameStateManager`, `TimerManager`).
    *   **`AudioManager`:** Manages sound loading and playback via Howler.js. Controlled by `RuleEngine` (playSound action) and React UI (`GameControlDropdown` emits settings events).
    *   **`ControlsManager`:** Maps raw input (keyboard, potentially pointer later) to game actions. Emits `PLAYER_ACTION`. Listened to by `BaseGame` subclasses (though not explicitly shown in `MultipleChoiceGame` yet).

## Key Workflows

*   **Initialization:** `GameContainer` -> `GameplayView` -> `PixiEngine.init` -> Manager Inits -> `gameFactory` (`MultipleChoiceGame` constructor) -> `MultipleChoiceGame.initImplementation` -> Manager Inits (`DataManager`, `UIManager`, etc.) -> Load Data -> Show First Question.
*   **Gameplay Tick:** `PixiApplication` Ticker -> `PixiEngine.handleUpdate` -> `PowerUpManager.update`, `MultipleChoiceGame.update`.
*   **Timer Tick:** `TimerManager` (internal RAF) -> `EventBus.emit(TIMER_TICK)` -> `MultipleChoiceUIManager._handleTimerTick` -> `PixiTimer.updateDisplay`.
*   **Answer Selection:** Button Click -> `UIManager` Callback -> `MultipleChoiceGame._handleAnswerSelected` -> `_processAnswerSelection` -> `EventBus.emit(ANSWER_SELECTED)` -> `RuleEngine` processes rules (e.g., updates score via `ScoringManager`, plays sound via `AudioManager`) -> `MultipleChoiceGame` handles turn transition/next question.
*   **Pause/Resume:** `GameControlDropdown` `onOpenChange` -> `EventBus.emit(GAME_PAUSED/GAME_RESUMED)` -> `MultipleChoiceGame` calls `TimerManager.pause/resumeTimer` AND `MultipleChoiceUIManager` calls `PixiTimer.pause/resume`.
*   **Resize:** Window/Element Resize -> `PixiApplication` -> `PixiEngine.handleResize` -> `EventBus.emit(RESIZED)` -> `MultipleChoiceUIManager._handleResize` -> `_updateAndApplyLayout` -> `LayoutManager.getLayoutParams`, `QuestionScene.updateLayout`, `UIManager.drawBackgroundPanel`, `UIManager._positionTimerElements`. Also `GameBackgroundManager._handleResize`.

## Debugging Tips

*   **Component Boundaries:** Is the issue in React UI state (`GameplayView`), engine orchestration (`PixiEngine`), core logic (`MultipleChoiceGame`), a specific manager (`TimerManager`, `ScoringManager`), or visual rendering (`UIManager`, `QuestionSceneV2`, `PixiTimer`)?
*   **Event Flow:** Use `EventBus` debug logs (enable in constructor) to trace event emissions and check if the correct components are listening and reacting. Are events being emitted? Are the payloads correct? Are listeners being called?
*   **State Management:** Check game state in `MultipleChoiceGame.getState()` and phases in `GameStateManager.getCurrentPhase()`. Is the state transitioning as expected?
*   **Manager States:** Check the internal state of relevant managers (e.g., `TimerManager.getTimer`, `ScoringManager.getScore`, `PowerUpManager.getActivePowerupsForTarget`).
*   **Layout Issues:** Check `LayoutManager` parameter calculation (`_getLayoutParameters`). Check how `UIManager._updateAndApplyLayout` uses these params and applies them to `QuestionSceneV2` and `PixiTimer`. Use Pixi DevTools if possible to inspect element positions/sizes.
*   **Timing Issues:** Verify `TimerManager` is correctly creating/starting/pausing/resuming timers. Check if `TIMER_TICK` and `TIMER_COMPLETED` events are firing correctly. Ensure the `PixiTimer` is receiving `updateDisplay` calls.
*   **Rule Issues:** Check `RuleEngine` logs. Are rules being triggered by the correct events? Are conditions evaluating correctly (check manager states)? Are actions executing and calling the right manager methods?

## Expansion Guide

*   **New Game Mode:** Extend `BaseGame`. Implement its abstract methods. Create necessary game-specific Managers (like `DataManager`, `UIManager`). Create a new `gameFactory` function. Update UI (`GameContainer`/`GameSetupPanel`) to allow selection.
*   **New Power-up:** Define it in `PowerupConfig`. Implement its activation logic (often in `BaseGame._handlePowerupSelected` override) and its effect application logic (within the relevant `Game`/`UIManager` methods or `RuleEngine` actions/conditions).
*   **New UI Element (Pixi):** Create a new PIXI `Container` based component. Decide which Manager should create and manage it (often the game-specific `UIManager`). Update LayoutManager/UIManager if it affects layout.
*   **New Rule:** Define it in `GameConfig.rules`. Ensure necessary conditions/actions are implemented in `RuleEngine` and that it interacts correctly with the relevant Managers.
