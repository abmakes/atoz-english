# PixiEngine Refactoring Plan: Integrating @pixi/react and Zustand

## 1. Introduction

This document outlines a plan to refactor the PixiEngine framework to integrate `@pixi/react` for rendering and Zustand for global state management. The goal is to leverage React's declarative UI capabilities and Zustand's simple state management while retaining the robust core logic encapsulated within the existing PixiEngine managers. This refactor aims for an incremental approach, minimizing disruption and allowing for phased implementation and testing.

This integration addresses the limitations of managing complex UI states imperatively with PixiJS and aims to improve developer experience, maintainability, and testability by adopting React's component model and a dedicated state management library.

This plan draws upon the capabilities documented in [`pixi-react-docs.md`](mdc:project_docs/pixi-react-docs.md) and follows the integration strategy outlined in [`pixi-react-migration-guide.md`](mdc:project_docs/pixi-react-migration-guide.md).

## 2. Current Architecture & Flow

*   **`PixiEngine.ts`**: The central orchestrator. Initializes `PixiApplication`, creates and manages core engine managers (`GameStateManager`, `ScoringManager`, `TimerManager`, `AudioManager`, `ControlsManager`, `StorageManager`, `RuleEngine`, `PowerUpManager`), manages the `BaseGame` lifecycle (`init`, `destroy`), and provides access to managers.
*   **`PixiApplication.ts`**: A wrapper around the native `PIXI.Application`, handling canvas setup, resizing, and the main ticker loop.
*   **`BaseGame.ts` (e.g., `MultipleChoiceGame.ts`)**: Abstract class and specific implementations. Currently responsible for game-specific logic *and* coordinating rendering via its own specific managers (like `MultipleChoiceUIManager`). Holds the root PIXI `Container` (`this.view`) for the game scene.
*   **Core Managers (`src/lib/pixi-engine/core/` & `/game/`)**: Handle specific domains (state, scoring, timing, audio, input, storage, rules, powerups). Interact via the `EventBus`. These represent the core, reusable game logic engine.
*   **Game-Specific Managers (e.g., `src/lib/pixi-games/multiple-choice/managers/`)**:
    *   `MultipleChoiceDataManager.ts`: Loads and manages question data, sequences questions.
    *   `MultipleChoiceUIManager.ts` & `QuestionScene.ts`: **Currently handle direct PIXI rendering** of the question, answers, media, timer display, etc. This tightly couples game logic (displaying a question) with specific rendering code.
    *   `MultipleChoiceLayoutManager.ts`: Calculates positions and sizes.
    *   `GameBackgroundManager.ts`: Manages the background rendering.
*   **`EventBus.ts` & `EventTypes.ts`**: Facilitate decoupled communication between managers and the game. Essential for maintaining separation of concerns.
*   **React UI (`src/components/game_ui/`)**:
    *   `GameContainer.tsx`: Top-level React component, sets up game config, manages high-level view state (setup, playing, gameover).
    *   `GameplayView.tsx`: Mounts the `PixiEngine`'s canvas (`pixiMountPointRef`), renders overlay React UI (`PlayerScore`, `NavMenu`), and listens to engine events to update its React state. This acts as the current bridge but has limitations in controlling the Pixi scene directly.
    *   Overlay Components (`PlayerScore.tsx`, `GameOverScreen.tsx`, `NavMenu.tsx`, `dropdown-menu.tsx`): Standard React components for UI overlays, currently reactive only to events propagated manually into React state.

**Current Flow (Simplified):** `GameContainer` -> `GameplayView` -> Initializes `PixiEngine` -> `PixiEngine` initializes `PixiApplication` & Managers -> `PixiEngine` creates `MultipleChoiceGame` -> `MultipleChoiceGame` initializes its managers (`UIManager`, `DataManager`, etc.) -> `UIManager`/`QuestionScene` perform PIXI rendering within `MultipleChoiceGame.view` -> `GameplayView` listens to `EventBus` to update overlay React state. *Limitation: React UI overlays are reactive, but the core Pixi scene rendering is imperative and less integrated with React's state model.*

## 3. Target Architecture & Flow (Post-Refactor)

*   **`PixiEngine.ts`**: Role shifts to **bootstrapper**. Still initializes core managers but *does not* directly create `PixiApplication`. Its primary role becomes setting up the non-rendering backend (managers) and providing these instances and the initial `GameConfig` to the React/Zustand layer. Manager cleanup logic in `destroy` remains essential.
*   **`PixiApplication.ts`**: Largely **deprecated**. `@pixi/react`'s `<Application />` component, managed within the React component tree, takes over the responsibility of managing the `PIXI.Application` instance, its lifecycle, and ticker integration (`useTick` hook).
*   **`BaseGame.ts` (`MultipleChoiceGame.ts`)**: Becomes a **thin bridge or logic orchestrator**. It loses its direct PIXI rendering responsibility (`this.view` becomes irrelevant for direct rendering). It may still handle high-level game flow logic triggered by events (starting timers via `TimerManager`, processing answers based on `EventBus` events) but delegates all scene graph manipulation to React components. `initImplementation` focuses on manager readiness and potentially setting up initial Zustand state links. `update`/`render` become minimal/no-ops.
*   **Core Managers**: **Largely unchanged** internally. They remain the source of truth for their respective domains (game state logic, scoring rules, timing, etc.). They continue to emit events via `EventBus` upon state changes. Their methods might now be invoked indirectly via Zustand actions initiated by the UI.
*   **Game-Specific Managers**:
    *   `MultipleChoiceDataManager.ts`: Remains, providing question data and sequencing logic. Accessed via Zustand.
    *   `MultipleChoiceLayoutManager.ts`: Remains, its layout calculation logic is consumed by React-Pixi components via Zustand.
    *   `MultipleChoiceUIManager.ts` & `QuestionScene.ts`: **Replaced** by the new React-Pixi component structure. Their responsibilities (creating PIXI objects, positioning, handling visual updates) are now handled declaratively in JSX.
    *   `GameBackgroundManager.ts`: **Replaced** by a dedicated `<GameBackground />` React-Pixi component.
*   **`EventBus.ts` & `EventTypes.ts`**: Remain central for communication between managers and potentially between managers and Zustand stores.
*   **React UI (`GameContainer`, `GameplayView`)**:
    *   `GameplayView.tsx` now renders the `@pixi/react <Application />` component. It orchestrates the rendering of the main React-Pixi scene components (like `<CurrentQuestionDisplayScene />`) inside `<Application />`. It continues to render overlay React UI (`<PlayerScore />`), but now sources data for *both* overlays and the Pixi scene from Zustand stores.
*   **React-Pixi Components (`src/lib/pixi-games/multiple-choice/react-components/`)**: (New) These components are responsible for *all* PIXI rendering using JSX syntax (e.g., `<GameBackground />`, `<TimerDisplay />`, `<CurrentQuestionDisplayScene />` containing `<QuestionText />`, `<QuestionMedia />`, `<AnswerOptionsPanel />`). They subscribe to Zustand stores for data (`GameConfig`, manager access, display state) and use hooks like `useTick` for animations.
*   **Zustand Stores (`src/lib/stores/`)**: (New) Act as the central hub for shared state within the React ecosystem.
    *   Provide global, reactive access to `GameConfig` and manager instances.
    *   Hold derived/reflected game state (phase, scores, current question) by listening to the `EventBus`.
    *   Define actions that serve as a clean API for UI components to trigger changes in the core managers.

**Future Flow (Simplified):** `GameContainer` -> `GameplayView` -> Initializes `PixiEngine` (Managers only) -> Sets up Zustand Stores (Config, Managers, DisplayState reflecting manager state) -> Renders `<Application />` -> React-Pixi Components render the scene declaratively, subscribing to Zustand Stores for data -> UI Overlays also subscribe to Zustand Stores -> UI Events trigger Zustand Actions -> Zustand Actions call appropriate Manager Methods -> Managers update internal state & emit Events via `EventBus` -> Zustand Stores listen to `EventBus` & update their reflected state -> React Components (both Pixi scene and overlays) re-render based on updated Zustand state. *Benefit: Unified reactive state model for both Pixi scene and overlay UI, driven by core logic managers.*

## 4. Proposed File Structure

*   **Core Engine:** `src/lib/pixi-engine/` (Unchanged, except `PixiApplication.ts` becomes obsolete)
*   **Core Game Logic (MC):** `src/lib/pixi-games/multiple-choice/`
    *   `MultipleChoiceGame.ts` (Refactored to be leaner, less rendering focus)
    *   `managers/MultipleChoiceDataManager.ts` (Remains)
    *   `managers/MultipleChoiceLayoutManager.ts` (Remains)
    *   `managers/MultipleChoiceUIManager.ts` (**Removed/Deprecated**)
    *   `managers/GameBackgroundManager.ts` (**Removed/Deprecated**)
    *   `scenes/QuestionScene.ts` (**Removed/Deprecated**)
    *   **`react-components/`** (New Directory)
        *   `GameBackground.tsx`
        *   `TimerDisplay.tsx`
        *   `QuestionText.tsx`
        *   `QuestionMedia.tsx`
        *   `AnswerButton.tsx`
        *   `AnswerOptionsPanel.tsx`
        *   `CurrentQuestionDisplayScene.tsx` (Orchestrator)
        *   ... (other scene elements as components)
*   **React UI:** `src/components/game_ui/` (Existing components adapted to use Zustand for state)
*   **Zustand Stores:** `src/lib/stores/` (New Directory)
    *   `useGameConfigStore.ts`
    *   `useManagersStore.ts`
    *   `useGameDisplayStateStore.ts` (Reflects core game state like phase, score, active team)
    *   `useCurrentQuestionStore.ts` (Reflects current question, options)
    *   `useAudioSettingsStore.ts` (Reflects audio settings)
    *   `useGameActionsStore.ts` (Optional, for centralizing UI-triggered actions)

## 5. Refactoring Phases & Detailed Steps

**Phase 1: Setup Zustand, Bridge Engine to React, Convert Background**

*   **Goal:** Establish the `@pixi/react` rendering environment, create foundational Zustand stores for global access to configuration and managers, and convert the simplest visual piece (`GameBackground`) to validate the setup. This phase focuses on reading data from Zustand.
*   **Rationale:** This isolates the initial setup of `@pixi/react` and Zustand, ensuring the core engine can still provide necessary context without major changes to its logic. Converting the background is low-risk and verifies the basic rendering pipeline.
*   **Steps:**
    1.  **Dependencies:** Install `pixi.js`, `@pixi/react`, `zustand`.
    2.  **`@pixi/react` Setup in `GameplayView.tsx`:**
        *   Import and render `<Application />` from `@pixi/react` inside the `pixiMountPointRef` div. Pass necessary props (`width`, `height`, etc.).
        *   Call `extend` (from `@pixi/react`) for common PIXI classes (e.g., `Container`, `Sprite`, `Graphics`). This teaches `@pixi/react` how to render these as JSX.
    3.  **`PixiEngine` Adaptation:** Modify `PixiEngine.init` to *not* create its own `PixiApplication`. Ensure `destroy` still cleans up managers.
    4.  **Zustand Stores (Foundation):**
        *   Create `src/lib/stores/useGameConfigStore.ts`: Holds `GameConfig`. Populate in `GameplayView.tsx`. *Benefit: Global config access for any component.*
        *   Create `src/lib/stores/useManagersStore.ts`: Holds references to core *and* game-specific managers (`multipleChoiceDataManager`, `multipleChoiceLayoutManager`). Populate in `GameplayView.tsx` after `PixiEngine` init. *Benefit: Eliminates prop drilling for manager access.*
        *   Create `src/lib/stores/useGameDisplayStateStore.ts` (Reflecting Store):
            *   Initial state: `{ currentPhase: GamePhase.LOADING, activeTeamId: null, teamScores: {} }`.
            *   Implement `EventBus` listeners (`PHASE_CHANGED`, `ACTIVE_TEAM_CHANGED`, `SCORE_UPDATED`) to update the store's state. *Rationale: Decouples UI from managers; UI reacts to store changes triggered by events.*
    5.  **`GameplayView.tsx` Adaptation:** Use `useEffect` for `PixiEngine` init and Zustand population. Source overlay state (`playerScores`, `activeTeamId`) from `useGameDisplayStateStore`.
    6.  **Refactor Background:**
        *   Create `src/lib/pixi-games/multiple-choice/react-components/GameBackground.tsx`.
        *   Use stores (`useGameConfigStore`, `useManagersStore`) for data/theme.
        *   Use `<pixiSprite>` or `<pixiGraphics>`. Handle texture loading.
        *   Render `<GameBackground />` inside `<Application />`.
        *   Remove `GameBackgroundManager.ts` and its usage.
    7.  **Address "State in Two Places":** Explicitly acknowledge that managers remain the source of truth; Zustand stores reflect this state for UI consumption via events. This mirroring is key to the incremental approach.

**Phase 2: Convert Timer Display and Refine `MultipleChoiceGame` Logic**

*   **Goal:** Convert another UI element (`TimerDisplay`) to React-Pixi, ensuring it reacts to state changes originating from a core manager (`TimerManager`) via Zustand. Begin simplifying the `MultipleChoiceGame` by removing its direct UI update responsibilities.
*   **Rationale:** This step tests the reactive loop (Manager Event -> Zustand Update -> React-Pixi Component Update) for dynamic data and starts offloading responsibilities from the old game class.
*   **Steps:**
    1.  **Refactor Timer Display:**
        *   Create `src/lib/pixi-games/multiple-choice/react-components/TimerDisplay.tsx`.
        *   Use `<pixiGraphics />`/`<pixiText />`.
        *   Add `currentTimeRemaining`, `initialDuration` to `useGameDisplayStateStore`. The store listens to `TIMER_EVENTS.TIMER_TICK` to update these.
        *   `<TimerDisplay />` subscribes to the store and gets layout parameters from `useManagersStore` (LayoutManager).
        *   Render `<TimerDisplay />` inside `<Application />`.
        *   Remove timer rendering code from `MultipleChoiceUIManager.ts`/`QuestionScene.ts`.
        *   `MultipleChoiceGame` still uses `TimerManager` for the timer's *logic* (create/start/stop/pause/resume).
    2.  **Refine `MultipleChoiceGame.ts`:**
        *   Review `_handleTimerComplete`, `_processAnswerSelection`. Remove direct UI calls (e.g., updating text, showing feedback). Ensure focus is on game logic (scoring, state changes, events).
        *   Keep transition logic (`this.showTransition`) for now.

**Phase 3: Tackle the Core Question Scene and Answer Interaction**

*   **Goal:** Replace the most complex part of the imperative rendering (`QuestionScene`, `MultipleChoiceUIManager`) with a hierarchy of React-Pixi components driven by a dedicated Zustand store for the current question state. Handle user interaction (answer selection) via Zustand actions.
*   **Rationale:** This moves the core interactive game scene into the declarative React model, leveraging component composition and state management for complex elements like questions with media and interactive answers.
*   **Steps:**
    1.  **Create React-Pixi Scene Components:** Build `QuestionText.tsx`, `QuestionMedia.tsx`, `AnswerButton.tsx`, `AnswerOptionsPanel.tsx`, and the orchestrator `CurrentQuestionDisplayScene.tsx`. Get data/theme/layout via Zustand hooks.
    2.  **Create `useCurrentQuestionStore`:**
        *   **State:** `currentQuestionData`, `currentAnswerOptions`, `isAnswerSubmitted`.
        *   **Action:** `fetchAndSetQuestion()`: Accesses `multipleChoiceDataManager` (via `useManagersStore`), gets next question, handles 50/50 power-up logic (checks & interacts with `powerUpManager` via `useManagersStore`), updates store state.
        *   **Action:** `submitAnswer(optionId: string)`: Sets `isAnswerSubmitted`, gets `eventBus` (via `useManagersStore`), emits `GAME_EVENTS.ANSWER_SELECTED`. *Rationale: Keeps game logic (processing the answer) decoupled in `MultipleChoiceGame` which listens for the event.*
    3.  **Trigger Question Updates:** Modify `MultipleChoiceGame._showQuestion` to trigger the `fetchAndSetQuestion` action (e.g., via a new `EventBus` event like `NEW_QUESTION_READY` that the store listens to).
    4.  **Integrate Scene Component:** Render `<CurrentQuestionDisplayScene />` inside `<Application />`. It subscribes to `useCurrentQuestionStore`. `AnswerButton`'s `onClick` calls the store's `submitAnswer` action.
    5.  **Deprecate/Remove Old Managers:** Remove `MultipleChoiceUIManager.ts` and `QuestionScene.ts`.

**Phase 4: Final Integration & Cleanup**

*   **Goal:** Ensure all remaining React UI overlays use Zustand, finalize the slimming down of `MultipleChoiceGame`, and review the overall architecture.
*   **Rationale:** This completes the integration, ensuring a consistent state management approach across all UI elements (both overlays and Pixi scene) and solidifying the new roles of the core engine classes.
*   **Steps:**
    1.  **Connect UI Overlays:** Ensure `PlayerScore.tsx`, `NavMenu.tsx`, `GameControlDropdown.tsx` read state from and write changes via Zustand stores/actions (e.g., audio settings changes trigger Zustand actions -> emit `SETTINGS_EVENTS`).
    2.  **Finalize `MultipleChoiceGame.ts`:** Remove any residual rendering logic. Confirm its focus is on data/sequence management, handling core logic events, and phase orchestration.
    3.  **Review `BaseGame.ts` & `PixiEngine.ts`:** Ensure abstractions are clean and roles align with the new architecture (bootstrapping, manager hosting).

## 6. Handling State During Transition (Recap)

*   **Manager Responsibility:** Core managers (`GameStateManager`, `ScoringManager`, `TimerManager`, `MultipleChoiceDataManager`, etc.) remain the **source of truth** for their respective domains' logic and state changes. They modify their internal state and **emit events** via the `EventBus` when significant changes occur. This maintains encapsulation and testability of core game logic.
*   **Zustand Store Responsibility:** Stores act as a **reactive layer or cache** specifically for the UI (both React overlays and React-Pixi components).
    *   They hold references to managers (`useManagersStore`) and configuration (`useGameConfigStore`) for easy access.
    *   They **listen to `EventBus` events** originating from the managers and update their *own* state to reflect the authoritative state (`useGameDisplayStateStore`, `useCurrentQuestionStore`). This creates the temporary, but necessary, "state in two places" where Zustand mirrors the manager's state for efficient UI consumption.
    *   They provide **actions** that UI components call. These actions serve as a clean interface, typically interacting with the managers (calling methods or emitting events) to *request* state changes, rather than modifying state directly.
*   **React Component Responsibility:** Components (both standard React and React-Pixi) **read state** primarily from Zustand stores using hooks. They trigger changes by calling **Zustand actions**. They render the UI declaratively.

**Data Flow Summary:** This architecture promotes a primarily **one-way data flow** for state updates visible to the UI: `Manager Logic -> EventBus Event -> Zustand Store Update -> React Component Re-render`. UI interactions follow a clear path: `React UI Event -> Zustand Action -> Manager Method Call (or EventBus Event)`. This makes state changes predictable and easier to debug.

## 7. Conclusion

This incremental refactoring plan allows for a controlled transition to a modern architecture leveraging `@pixi/react` and Zustand. It prioritizes separating rendering concerns from core game logic, improving UI development velocity, maintainability, and testability. The "state in two places" strategy during the transition is a key element of this incremental approach, ensuring core logic remains stable while the UI becomes reactive via Zustand. Key considerations during implementation include careful management of the React/Pixi bridge, performance monitoring, and ensuring clear, well-defined data flow between managers, Zustand stores, and React components.
