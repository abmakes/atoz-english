# PixiEngine & @pixi/react Integration Guide

This guide outlines best practices for integrating the `@pixi/react` library with the existing PixiEngine framework, enabling the use of React components for rendering PixiJS scenes. It also provides recommendations for potential improvements to the engine and project structure.

## 1. Introduction

`@pixi/react` allows developers to build PixiJS applications using React's declarative component model. This can simplify UI development, state management for view components, and leverage the React ecosystem. This guide focuses on integrating this approach with our established PixiEngine architecture.

The core idea is to use a lightweight `BaseGame` implementation (like `DummyGame` in `react-test/page.tsx`) that delegates rendering to a main React component (e.g., `MultipleChoiceReactApp`). This React component then uses `@pixi/react` to render the actual game scene.

## 2. Core Concepts of @pixi/react

Refer to the [official @pixi/react documentation](mdc:project_docs/pixi-react-docs.md) for foundational concepts. Key takeaways relevant to our integration:

*   **`<Application>` Component:** The root of a `@pixi/react` scene. It provides the PixiJS `Application` context.
*   **`extend` API:** Crucial for informing `@pixi/react` about the PixiJS classes you intend to use as JSX components (e.g., `Container`, `Sprite`, `Graphics`, `Text`).
*   **JSX for PIXI Components:** After extending, you can use PIXI classes as React components (e.g., `<pixiSprite />`, `<pixiGraphics />`). Props on these components map to the properties of their corresponding PIXI instances.
*   **Hooks:**
    *   `useApplication()`: Access the underlying PIXI `Application`.
    *   `useTick()`: Attach callbacks to the application's ticker for animations.
    *   `useExtend()`: A hook version of `extend`, typically used within components if `extend` wasn't called globally or at the module level. For consistency and clarity, module-level `extend` is often preferred.

## 3. Integrating with PixiEngine

This section details how to structure the integration.

### 3.1. Project Setup

1.  **Installation:**
    ```bash
    npm install pixi.js @pixi/react
    ```
    Ensure versions are compatible (e.g., `pixi.js@^8.x.x`, `@pixi/react` appropriate beta or stable version).

2.  **Global PIXI Component Registration (Optional but Recommended for Common Classes):**
    You can create a central file (e.g., `src/lib/pixi-react-extensions.ts`) to register all commonly used PIXI classes:
    ```typescript
    // src/lib/pixi-react-extensions.ts
    import { extend } from '@pixi/react';
    import { Container, Graphics, Sprite, Text, BitmapText, TilingSprite, AnimatedSprite } from 'pixi.js';

    extend({
      Container,
      Graphics,
      Sprite,
      Text,
      BitmapText,
      TilingSprite,
      AnimatedSprite
      // Add other frequently used PIXI classes
    });
    ```
    Then, import this file once in your main application entry point or the top-level React component that initializes the Pixi context. Alternatively, use per-file `extend` calls as shown in the component examples below.

### 3.2. Bootstrapping the React-Pixi Game

*   **`pages.tsx` (e.g., `react-test/page.tsx`):**
    *   This file acts as the entry point for the React-based game.
    *   It initializes the `PixiEngine` with a `DummyGame` factory. The `DummyGame` itself does minimal work, serving as a bridge.
    *   It fetches necessary initial data (like quiz lists).
    *   Upon user action (e.g., selecting a quiz), it sets up the `GameConfig`.
    *   It renders the main React game component (e.g., `MultipleChoiceReactApp`), passing the `PixiEngine` instance (or its managers) and `GameConfig`.

    ```typescript
    // Simplified example from src/app/games/react-test/page.tsx
    // ...
    const engine = new PixiEngine();
    await engine.init(testConfig, createDummyGame); // createDummyGame returns new DummyGame()

    setPixiEngine(engine);
    setGameConfig(testConfig);
    setGameStarted(true);
    // ...
    if (gameStarted && pixiEngine && gameConfig) {
      return (
        <MultipleChoiceReactApp
          config={gameConfig}
          pixiEngine={pixiEngine} // Pass the whole engine or just managers
          onGameOver={handleGameOver}
        />
      );
    }
    ```

### 3.3. Main React Game Component (e.g., `MultipleChoiceReact.tsx`)

*   This component is the primary container for your React-Pixi scene.
*   **Wrapper:** It uses the `<Application>` component from `@pixi/react` to set up the Pixi rendering context.
    ```typescript
    // src/lib/pixi-games/multi-react/MultipleChoiceReact.tsx
    import { Application } from '@pixi/react';
    // ...

    export const MultipleChoiceReactApp: React.FC<AppProps> = ({ config, pixiEngine, onGameOver }) => {
      return (
        <Application width={window.innerWidth} height={window.innerHeight} resolution={window.devicePixelRatio || 1} autoDensity={true}>
          <MultipleChoiceReact
            config={config}
            managers={pixiEngine.getManagers()} // Pass managers down
            onGameOver={onGameOver}
          />
        </Application>
      );
    };
    ```
*   **Core Logic Component (`MultipleChoiceReact`):**
    *   Receives `config` (GameConfig) and `managers` (PixiEngineManagers).
    *   May initialize React-specific layout managers (e.g., `MultipleChoiceLayoutManager`) or data managers (`MultipleChoiceDataManager` specific to the React view).
    *   Handles overall game flow within the React paradigm (e.g., loading, ready, playing, game over states).
    *   Orchestrates and renders child React-Pixi components (Background, QuestionDisplay, Timer, AnswerButtons).
    *   Uses `useEffect` for setup, teardown, and event bus subscriptions.
    *   `extend({ Text, Container: PixiContainer, Graphics: PixiGraphics });` is used here to register components for use within this file and its children if not done globally.

### 3.4. Creating React-Pixi Components (e.g., `Timer.tsx`, `QuestionDisplay.tsx`)

These are fine-grained components responsible for rendering specific parts of the scene.

*   **`extend` Call:** Each component file should call `extend` at the top to register the PIXI classes it uses. This ensures the component is self-contained in terms of its PIXI dependencies for `@pixi/react`.
    ```typescript
    // src/lib/pixi-games/multi-react/components/Timer.tsx
    import { extend } from '@pixi/react';
    import { Graphics as PixiGraphics, TextStyle, Container, Text, Color } from 'pixi.js';

    extend({ Graphics, Container, Text }); // Register PIXI classes used in this component

    // ... component definition
    ```
*   **Props:** Components receive props for data, layout parameters, theme configuration, and event handlers.
    ```typescript
    interface TimerProps {
      remaining: number;
      duration: number;
      position: [number, number]; // Or a PIXI.PointData type
      themeConfig: PixiSpecificConfig;
    }
    ```
*   **JSX for PIXI Elements:** Use `<pixiGraphics>`, `<pixiText>`, `<pixiSprite>`, etc., to build the visual structure.
    *   The `draw` prop for `<pixiGraphics>` is particularly useful for custom drawing logic. Use `useCallback` to memoize the draw function if its dependencies don't change often.
*   **Color Handling (PixiJS v8+):**
    *   PixiJS v8 introduces `PIXI.Color` and the `ColorSource` type. A `ColorSource` can be a hex string (e.g., `'#FF0000'`, `'#RRGGBBAA'`), a color name (`'white'`), a number, an array, or a `PIXI.Color` object. Refer to the [PixiJS Color documentation](https://pixijs.download/release/docs/color.Color.html).
    *   Many PIXI properties (e.g., `Graphics.fill()`, `TextStyle.fill`) now accept a `ColorSource` directly.
    *   **Preferred Method:** Pass hex strings from your `themeConfig` (which originates from `globals.css`) directly to PIXI properties that accept `ColorSource`.
        ```typescript
        // Example with Graphics, assuming themeConfig.panelBg = '#374151'
        g.rect(x, y, width, height).fill(themeConfig.panelBg);

        // Example with TextStyle
        const textStyle = new TextStyle({
          fill: themeConfig.textColor, // e.g., '#D1D5DB'
          // ... other style properties
        });
        ```
    *   **Conversion (If Strictly Numerical Color is Required):** If a specific PIXI property or older utility requires a numerical color representation, use `new Color(source).toNumber()`:
        ```typescript
        import { Color } from 'pixi.js';

        const hexString = themeConfig.primaryAccent; // e.g., '#49C8FF'
        const colorNumber = new Color(hexString).toNumber(); // Converts to 0x49C8FF
        // Use colorNumber where a number is explicitly needed
        ```
        However, always check if the PIXI property directly supports `ColorSource` first, as this is often cleaner.
*   **Event Handling (for interactive elements):** Standard React event handlers like `onClick`, `onPointerDown` can be used on interactive PIXI components. Ensure `interactive={true}` is set on the component.

### 3.5. State Management

*   **React State (`useState`, `useEffect`, `useMemo`):** Use for UI-specific state within your React-Pixi components (e.g., visibility of an element, current input value, animation state local to the component).
*   **PixiEngine Managers:** For core game logic and state (e.g., current game phase, scores, active team), interact with the existing PixiEngine managers passed down as props.
    *   Example: `gameStateManager.setPhase(GamePhase.PLAYING);`
    *   Example: `scoringManager.init(config.teams, config.gameMode);`

### 3.6. Event Handling (PixiEngine EventBus)

*   React components can subscribe to and emit events via the PixiEngine `EventBus`.
*   **Subscribing:** Use `useEffect` to subscribe on component mount and unsubscribe on unmount.
    ```typescript
    useEffect(() => {
      const handleTimerTick = (payload: any) => { /* ... */ };
      eventBus.on(TIMER_EVENTS.TIMER_TICK, handleTimerTick);
      return () => {
        eventBus.off(TIMER_EVENTS.TIMER_TICK, handleTimerTick);
      };
    }, [eventBus]);
    ```
*   **Emitting:** Call `eventBus.emit()` to trigger game logic handled by PixiEngine systems or other React components.

### 3.7. Asset Management

*   **Data Managers (e.g., `MultipleChoiceDataManager`):** Centralize data fetching and asset preloading.
    *   Use `PIXI.Assets.load()` or `PIXI.Assets.loadBundle()` for robust asset loading. This integrates with Pixi's caching mechanisms.
    *   The `preloadQuestionMedia` method in `MultipleChoiceDataManager.ts` (from our discussion) demonstrates preloading images and registering them with `PIXI.Assets`.
*   **Component-Level Loading (e.g., `QuestionDisplay.tsx`):**
    *   Components can attempt to load assets, preferably by first checking the `PIXI.Assets.cache`.
    *   Implement fallback loading (e.g., direct `PIXI.Assets.load(url)`) with proper error handling and loading states for a better user experience.
    *   Pass loaded `Texture` objects as props to `<pixiSprite>` components.

### 3.8. Theming

*   The `GameConfig` should provide a `theme` identifier.
*   A `getThemeConfig` function (as in `src/lib/themes.ts`) can retrieve the specific theme configuration.
*   Pass the `themeConfig.pixiConfig` (which is of type `PixiSpecificConfig`) to React-Pixi components that need theme information (colors, fonts). Hex strings from `globals.css` are suitable here.
*   Ensure `PixiSpecificConfig` contains all necessary properties for styling PIXI elements directly (e.g., `timerColor`, `panelBg`, `questionTextColor`).

### 3.9. Layout

*   A dedicated layout manager (e.g., `MultipleChoiceLayoutManager.ts`) can calculate positions, sizes, and other layout parameters based on screen dimensions and game design.
*   This manager can be instantiated in the main React game component and its parameters passed down as props to child components.
*   Components then use these layout parameters to position and size their PIXI elements.

## 4. Recommendations for Improvement

### 4.1. PixiEngine Enhancements for @pixi/react

1.  **Dedicated React Context Providers for Managers:**
    *   Instead of passing `managers` down through props, PixiEngine could provide React Contexts for key managers (`EventBus`, `GameStateManager`, `TimerManager`, `ScoringManager`, etc.).
    *   React-Pixi components could then use hooks like `useEventBus()`, `useGameStateManager()` to access these managers directly, reducing prop drilling and making components more decoupled.
    *   This would require a top-level Provider component set up by `PixiEngine` when a React-based game is initialized.

2.  **State Subscription Hooks:**
    *   Provide custom React hooks to subscribe to specific pieces of state within PixiEngine managers.
    *   Example: `const currentPhase = useGamePhase(gameStateManager);` or `const score = useTeamScore(scoringManager, 'team1');`.
    *   These hooks would internally use `EventBus` or other mechanisms to update the component when the subscribed state changes.

3.  **Standardized Asset Handling for React:**
    *   While `PIXI.Assets` is powerful, a slightly higher-level abstraction or hook within the PixiEngine-React bridge could simplify texture loading and error handling within components.
    *   Example: `const { texture, isLoading, error } = usePixiTexture(imageUrl);`

4.  **Simplified `GameConfig` Access:**
    *   Similar to managers, provide `GameConfig` (or relevant parts of it like `themeConfig.pixiConfig`) via React Context.

### 4.2. Configuration (`GameConfig` & Theming)

1.  **`PixiSpecificConfig` Review:**
    *   Ensure `PixiSpecificConfig` in `src/lib/themes.ts` stores colors as hex strings (e.g., `'#RRGGBB'`) consistent with `globals.css`. These can often be used directly as `ColorSource` in PIXI v8.
    *   The current `timerColor` vs. the linter errors for `timerBg`, `timerGreen` etc., highlighted this. Standardizing on defined hex strings in `PixiSpecificConfig` and using them directly or via `new PIXI.Color()` is the way forward.

2.  **Typed GameConfig for React Games:**
    *   If certain `GameConfig` properties are always required or have specific shapes for React-Pixi games, consider creating a more specific TypeScript interface that extends `GameConfig`.

### 4.3. File Structure & Imports

1.  **Component Organization:**
    *   The current structure of placing React-Pixi components in `src/lib/pixi-games/multi-react/components/` and managers in `src/lib/pixi-games/multi-react/managers/` is good. Maintain this separation.
2.  **`extend` Strategy:**
    *   **Per-File `extend`:** Placing `extend({ Sprite, Graphics, ... })` at the top of each `.tsx` file using these PIXI classes is good for modularity and clearly declares the component's PIXI dependencies for `@pixi/react`.
    *   **Global `extend` (Alternative):** A single, global `extend` call in a setup file (as mentioned in 3.1.2) can reduce boilerplate if many components share the same set of PIXI classes. Choose based on project preference for explicitness vs. conciseness.
3.  **Absolute Imports:** Continue using absolute imports (`@/lib/...`) for better maintainability.

### 4.4. TypeScript and @pixi/react

*   **`PixiElements` Interface:** If you create custom wrapper components that are not direct mappings of PIXI classes but still render PIXI objects and need to be used in JSX (e.g., `<MyCustomPixiButton />`), you'll need to augment the `PixiElements` interface in a `global.d.ts` file as per the `@pixi/react` documentation. This allows TypeScript to recognize these custom components and their props.
    ```typescript
    // global.d.ts
    import { type Viewport } from 'pixi-viewport'; // Example
    import { type PixiReactElementProps } from '@pixi/react';

    declare module '@pixi/react' {
      interface PixiElements {
        // Example for a custom viewport component
        // viewport: PixiReactElementProps<typeof Viewport>;

        // Add your custom React-Pixi components here if they are not direct PIXI classes
        // myCustomButton: PixiReactElementProps<typeof MyCustomButton>;
      }
    }
    ```
    For the components we've built so far (like `Timer`, `Background`), which directly use `<pixiGraphics>`, `<pixiText>`, etc., this step is not strictly necessary as these are mapped from standard PIXI classes already known by `@pixi/react` once `extend` is called.

## 5. Common Pitfalls & Solutions from This Project

1.  **Incorrect `extend` Usage:**
    *   **Pitfall:** Initially, `useExtend` was used in some places, or `extend` was missing or incomplete.
    *   **Solution:** Ensure `extend` is called with all necessary PIXI classes (e.g., `Container`, `Graphics`, `Text`, `Sprite`) at the module level (top of the file) for components used within that file. This correctly registers them with `@pixi/react`.

2.  **Asset Loading and Caching:**
    *   **Pitfall:** Warnings like "Asset id ... was not found in the Cache."
    *   **Solution:**
        *   Preload assets using `PIXI.Assets.load()` or `PIXI.Assets.loadBundle()` in a data manager (e.g., `MultipleChoiceDataManager`).
        *   In components, attempt to retrieve from `PIXI.Assets.cache` first.
        *   Implement fallback loading (e.g., direct `PIXI.Assets.load(url)`) with proper error handling and loading states in components like `QuestionDisplay.tsx`.
        *   Ensure asset keys/URLs are consistent between preloading and retrieval.
        *   For external URLs (like Giphy), direct preloading with `PIXI.Assets.addBundle` and `Assets.loadBundle` using unique keys for each URL is a robust approach. Local image copies are even better for reliability.

3.  **Color Format Mismatches (and v8 solution):**
    *   **Pitfall:** Passing CSS color strings (e.g., `'#FF0000'`) directly to PIXI properties expecting numerical values, or using manual parsing (`parseInt(hex.replace('#', '0x'))`).
    *   **Solution (PixiJS v8+):**
        *   Utilize `ColorSource` where accepted. Many PIXI v8 properties (like `Graphics.fill`, `TextStyle.fill`) accept hex strings directly.
        *   If a numerical representation is absolutely required, use `new PIXI.Color('#RRGGBB').toNumber()`.
        *   Store colors as hex strings in `PixiSpecificConfig` as they are in `globals.css`.

4.  **TypeScript Errors with Theme/Props:**
    *   **Pitfall:** `PixiSpecificConfig` missing properties or components trying to access non-existent theme properties.
    *   **Solution:**
        *   Ensure `PixiSpecificConfig` is accurate and complete.
        *   Components should correctly access the defined theme properties.
        *   Verify prop types in components match what's being passed.

5.  **Component Positioning/Props:**
    *   **Pitfall:** Type error for `position` prop (e.g., `Type '[number, number]' is not assignable to type 'PointData'`).
    *   **Solution:** Pass position as an object: `position={{ x: x, y: y }}`.

By following this guide and considering these recommendations, the integration of `@pixi/react` can be made smoother, more maintainable, and leverage the strengths of both React and PixiJS within the PixiEngine framework.
