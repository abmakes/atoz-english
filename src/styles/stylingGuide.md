# Styling and Theming Guide

This document outlines the styling approach used in the application, combining Tailwind CSS, global CSS variables, CSS Modules, and direct PixiJS styling configuration. Understanding this structure helps determine where to make changes when modifying the visual appearance of different parts of the application.

## Core Styling Technologies

1.  **Tailwind CSS:**
    *   **Role:** The **primary tool** for styling **React components** (`.tsx` files). Used for layout, spacing, typography, responsive design, and applying visual styles directly via utility classes.
    *   **Theming:** Tailwind utilities frequently reference CSS variables defined in `src/styles/globals.css` to apply theme-specific styles (e.g., `bg-[var(--primary-bg)]`, `text-[var(--text-color)]`).
    *   **Configuration:** Setup in `tailwind.config.ts`. Uses base variables and theme definitions from `src/styles/globals.css`.
    *   **Usage:** Applied directly as class names in JSX elements (e.g., `<div className="flex items-center p-4 bg-[var(--panel-bg)] rounded-[var(--border-radius-lg)]">`).

2.  **CSS Variables (`src/styles/globals.css`):**
    *   **Role:** The **central hub for theme definition** for the React application. Defines base CSS variables under `:root` and theme-specific overrides under corresponding classes (e.g., `.dark`, `.themeForest`).
    *   **Usage:** These variables are primarily consumed by Tailwind utility classes within React components. They can also be referenced by CSS rules in `themes.module.css`.
    *   **Consolidation:** **Note:** Ensure that all relevant base styles and theme variables are consolidated into `src/styles/globals.css` and remove potential duplication from `src/app/globals.css`.

3.  **CSS Modules (`src/styles/themes/themes.module.css`):**
    *   **Role:**
        *   **Theme Application:** Provides theme wrapper classes (e.g., `.themeBasic`, `.themeDark`, `.themeForest`). These classes are dynamically applied to high-level React wrapper components (like in `GameSetupPanel.tsx`, and potentially `GameContainer` or `GameplayView`). Applying these classes activates the corresponding CSS variable overrides defined in `globals.css`.
        *   **Component Styles:** Contains *some* reusable, scoped CSS classes for specific React component structures (e.g., `.panelWrapper`, `.optionBox`, `.teamListItem`, `.buttonChoice`) that might be more complex or less convenient to achieve purely with Tailwind utilities. These are primarily used in components like `GameSetupPanel.tsx`.
    *   **Current Status:** While many newer or refactored components may rely solely on Tailwind + CSS Variables, this file is still **actively used** for applying the theme context and for styling specific parts of certain components. It is less central than before but still relevant.
    *   **Usage:** Imported into React components (e.g., `import styles from '@/styles/themes/themes.module.css';`) and applied via the `styles` object (e.g., `<div className={`${styles.panelWrapper} ${themeClassName}`}>`).

4.  **Theme Configuration (`src/lib/themes.ts`):**
    *   **Role:** Central JavaScript/TypeScript configuration for themes, specifically bridging the gap between the web styling system and the **PixiJS engine**.
    *   **Structure:** Defines theme IDs and maps them to:
        *   Paths for theme-specific assets (sounds, images).
        *   The `cssModuleClass` name (used by React components like `GameSetupPanel` to apply the theme context from `themes.module.css`).
        *   A `PixiSpecificConfig` object: This holds **concrete style values** (e.g., hex color codes like `#ffffff`, font family names like `'Grandstander'`) needed by the PixiJS engine.
    *   **Importance:** This is crucial because **PixiJS cannot directly read CSS variables** or Tailwind classes. It needs explicit values.
    *   **Usage:** Functions like `getThemeConfig` and `getPixiThemeConfig` retrieve the appropriate configuration. The `PixiSpecificConfig` object is passed down through the React component hierarchy into the PixiJS game instance (`MultipleChoiceGame`) and used by its managers (`MultipleChoiceUIManager`) and scenes (`QuestionScene`).

5.  **PixiJS Styling (In TypeScript):**
    *   **Role:** Styles applied directly to PixiJS objects (e.g., `PIXI.Text`, `PIXI.Graphics`, `PIXI.Sprite`) within the game engine's TypeScript code (located in `src/lib/pixi-games/`, `src/lib/pixi-engine/`).
    *   **Usage:** Achieved by setting properties on Pixi objects and referencing values from the `PixiSpecificConfig` object obtained via `themes.ts`.
        *   Example: `text.style = new PIXI.TextStyle({ fill: this.themeConfig.textColor, fontFamily: this.themeConfig.fontFamilyTheme })`
        *   Example: `graphics.fill(this.themeConfig.panelBg)`
        *   Example: `sprite.tint = this.themeConfig.primaryAccent` (Note: Tint requires numeric color, conversion might be needed if hex strings are used).

## Where to Modify Styles

*   **React UI Components (Layout, Buttons, Panels, Overlays - e.g., `GameSetupPanel`, `PlayerScore`, `NavMenu`, game selection `page.tsx`):**
    *   **Primary Method:** Use **Tailwind CSS** utility classes directly in the `.tsx` file's JSX. Reference CSS variables from `globals.css` using `var()` syntax (e.g., `className="bg-[var(--panel-bg)] text-[var(--text-color)]"`).
    *   **Reusable/Complex Component Styles:** If a complex style structure is needed, or if modifying existing components like `GameSetupPanel`, check if a suitable class exists in **`themes.module.css`**. Use or modify these classes. Consider migrating them to Tailwind if feasible for consistency.
    *   **Theme-Specific React Styles:** Modify the CSS variables under the theme classes (e.g., `.dark`) within **`globals.css`**.

*   **Activating Theme Variables for React:** Ensure the correct theme class (e.g., `styles.themeDark`) from **`themes.module.css`** is applied to a parent wrapper element in the React component tree (like in `GameSetupPanel` or potentially `GameContainer`).

*   **PixiJS Game Elements (Question Text, Answer Buttons visuals, Timer Graphics, Scene Backgrounds, etc.):**
    *   **Appearance (Colors, Fonts, Fills):** Modify the **TypeScript code** where PixiJS objects are styled (e.g., `MultipleChoiceUIManager`, `QuestionScene`, `PixiTimer`). Ensure styles use values from the `PixiSpecificConfig` object received from `themes.ts`.
    *   **Theme-Specific Pixi Values:** Update the *concrete values* (hex codes, font names) within the `PixiSpecificConfig` object for the relevant theme in **`themes.ts`**.

*   **Global Styles & Fonts:**
    *   **Base HTML/Body Styles, Font Loading (`@font-face`), CSS Variable Definitions:** Modify **`src/styles/globals.css`**. Consolidate any global styles here.
    *   **Font Application (Tailwind):** Tailwind uses font utility classes which often rely on variables like `--font-sans`, `--font-theme` defined in `globals.css`.

## Summary Flow

1.  **Theme Selection (React):** User selects theme (or default used).
2.  **Theme Context Application (React):** A wrapper component (e.g., `GameSetupPanel`, `GameContainer`) uses the selected theme ID to apply the corresponding theme class (e.g., `styles.themeDark`) from `themes.module.css` to its container div.
3.  **CSS Variable Activation:** Applying the theme class activates the theme-specific CSS variable overrides defined in `globals.css` for all descendant elements.
4.  **React Component Styling:** React components render using Tailwind utilities. These utilities read the currently active CSS variables from `globals.css` (e.g., `bg-[var(--panel-bg)]` uses the panel background color defined for the active theme). Some specific components might also use classes directly from `themes.module.css`.
5.  **Pixi Config Retrieval (React -> Pixi):** Separately, the `PixiSpecificConfig` object (containing *concrete* values like `#FFFFFF`) for the selected theme is retrieved from `themes.ts` and passed down into the PixiJS engine instance.
6.  **PixiJS Styling:** PixiJS TypeScript code uses the values from the passed `PixiSpecificConfig` object to style Pixi objects directly (e.g., `graphics.fill(this.themeConfig.panelBg)` uses the specific hex code passed for the panel background).

This mixed approach allows leveraging Tailwind's utility-first workflow for most React components while maintaining a separate, explicit configuration system for PixiJS and using CSS Modules for theme activation and some specific component structures.
