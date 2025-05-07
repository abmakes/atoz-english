// import * as PIXI from 'pixi.js'; // No longer needed here

/**
 * Central configuration for game themes.
 * Maps theme IDs to their respective asset paths and PixiJS configurations.
 */

// --- RESTORED OLD Interfaces --- (Will be populated differently later)

export interface PixiSpecificConfig {
  // Colors (as CSS strings - hex recommended for consistency)
  primaryBg: string;
  secondaryBg: string;
  panelBg: string; // Use panel-bg-theme? Needs alpha handling if so. Let's use white for now.
  textColor: string;
  textLight: string;
  headingColor: string;
  primaryAccent: string;
  primaryAccentHover: string;
  inputBg: string;
  inputBorder: string;
  buttonTextLight: string;
  buttonTextDark: string;
  // Fonts
  fontFamily: string; // Should match the name used in PIXI.Text
  fontFamilyTheme: string; // Specific theme font if needed
  // Add other values as needed...
  timerColor: string;
  questionTextColor: string;
  buttonFillColor: string;
  buttonTextColor: string;
  buttonBorderColor?: string; // Optional border color
}

export interface PixiThemeConfig {
  /** Base path relative to /public for audio assets */
  soundsBasePath: string;
  /** Base path relative to /public for image assets */
  imagesBasePath: string;
  /** Optional CSS module class name from themes.module.css (for React components) */
  cssModuleClass?: string; // Keep this for React side
  /** Static PixiJS theme values */
  pixiConfig: PixiSpecificConfig;
}

// --- REMOVE NEW Interfaces (Interfaces related to PixiVariableMap and ThemeDefinition) ---
// interface PixiVariableMap { ... }
// export interface ThemeDefinition { ... }


// --- Themes Definition (Back to old structure for now) ---
export const THEMES: Record<string, PixiThemeConfig> = {
  default: {
    soundsBasePath: '/audio/default/',
    imagesBasePath: '/images/default/', // Placeholder
    cssModuleClass: 'themeBasic',
    pixiConfig: {
      primaryBg: '#ffffff',           // blue-100
      secondaryBg: '#bfdbfe',         // blue-200
      panelBg: '#e0f2fe',          // white
      textColor: '#114257',           // gray-700 custom
      textLight: '#175975',          // gray-500 custom
      headingColor: '#114257',        // gray-600 custom
      primaryAccent: '#49C8FF',       // blue-400
      primaryAccentHover: '#2DA4D8',   // blue-600 custom
      inputBg: '#ffffff',
      inputBorder: '#d1d5db',         // gray-300
      buttonTextLight: '#ffffff',
      buttonTextDark: '#114257',
      fontFamily: 'Poppins', // Default sans
      fontFamilyTheme: 'Grandstander', // Theme font
      timerColor: '#114257',
      questionTextColor: '#114257',
      buttonFillColor: '#ffffff',
      buttonTextColor: '#114257',
      buttonBorderColor: '#d1d5db',
    },
  },
  dark: {
      soundsBasePath: '/audio/default/',
      imagesBasePath: '/images/dark/',
      cssModuleClass: 'themeDark',
      pixiConfig: {
          primaryBg: '#1f2937',           // gray-800
          secondaryBg: '#111827',         // gray-900
          panelBg: '#374151',           // gray-700
          textColor: '#d1d5db',           // gray-300
          textLight: '#9ca3af',          // gray-400
          headingColor: '#f3f4f6',         // gray-100
          primaryAccent: '#49C8FF',       // blue-400
          primaryAccentHover: '#2DA4D8',   // blue-500 custom
          inputBg: '#374151',           // gray-700
          inputBorder: '#4b5563',         // gray-600
          buttonTextLight: '#111827',     // Dark text
          buttonTextDark: '#d1d5db',      // Light text
          fontFamily: 'Poppins',
          fontFamilyTheme: 'Grandstander',
          timerColor: '#d1d5db',
          questionTextColor: '#d1d5db',
          buttonFillColor: '#4b5563',
          buttonTextColor: '#d1d5db',
          buttonBorderColor: '#556170',
      },
  },
  forest: {
      soundsBasePath: '/audio/default/',
      imagesBasePath: '/images/default/',
      cssModuleClass: 'themeForest',
      pixiConfig: {
          primaryBg: '#d4e9d7',
          secondaryBg: '#a3c9a8',
          panelBg: '#f0fff0',
          textColor: '#2f4f4f',
          textLight: '#556b2f',
          headingColor: '#006400',
          primaryAccent: '#556b2f',
          primaryAccentHover: '#6b8e23',
          inputBg: '#f5fff5',
          inputBorder: '#a3c9a8',
          buttonTextLight: '#ffffff',
          buttonTextDark: '#2f4f4f',
          fontFamily: 'Poppins',
          fontFamilyTheme: 'Grandstander',
          timerColor: '#2f4f4f',
          questionTextColor: '#2f4f4f',
          buttonFillColor: '#ffffff',
          buttonTextColor: '#2f4f4f',
          buttonBorderColor: '#a3c9a8',
      },
  },
};

// Function to get a specific theme's config, handling defaults
// RESTORED to return old structure temporarily
export function getThemeConfig(themeId: string | null | undefined): PixiThemeConfig {
  const id = themeId && THEMES[themeId] ? themeId : 'default';
  // TODO LATER: Replace this direct return with logic that:
  // 1. Gets the themeClassName (e.g., THEMES[id].cssModuleClass)
  // 2. Uses a runtime CSS variable reader (to be created) to get computed values
  // 3. Constructs a PixiSpecificConfig object from those computed values
  // 4. Returns a PixiThemeConfig object containing paths and the dynamically constructed pixiConfig
  return THEMES[id] || THEMES['default']; // Return hardcoded value for now
}

// Restore this helper function as it was likely used elsewhere
export function getPixiThemeConfig(themeId: string | null | undefined): PixiSpecificConfig {
    return getThemeConfig(themeId).pixiConfig;
}
