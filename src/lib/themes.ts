/**
 * Central configuration for game themes.
 * Maps theme IDs to their respective asset paths and potentially static PixiJS configurations.
 */

// TODO: Define or import the PixiTheme interface from src/lib/pixi-engine/config/PixiTheme.ts if needed
// For now, we'll use an inline type for simplicity.
interface PixiThemeConfig {
  /** Base path relative to /public for audio assets */
  soundsBasePath: string;
  /** Base path relative to /public for image assets */
  imagesBasePath: string;
  /** Optional CSS module class name from themes.module.css (for React components) */
  cssModuleClass?: string;
  /** Optional object for static PixiJS theme values (e.g., tints, fonts) */
  pixiConfig?: {
    // Example: backgroundTint?: number;
    // Example: defaultFont?: string;
    [key: string]: unknown; // Allow arbitrary static PixiJS values
  };
}

export const THEMES: Record<string, PixiThemeConfig> = {
  default: {
    soundsBasePath: '/audio/default/',
    imagesBasePath: '/images/default/', // Placeholder for default images
    // No specific CSS module or Pixi config needed for the base 'default' theme yet
  },
  // --- Add other themes below ---
  // Example:
  // forest: {
  //   soundsBasePath: '/audio/forest/',
  //   imagesBasePath: '/images/forest/',
  //   cssModuleClass: 'styles.themeForest', // Assuming styles are imported
  //   pixiConfig: {
  //     backgroundTint: 0x109910,
  //   }
  // },
};

// Optional: Function to get a specific theme's config, handling defaults
export function getThemeConfig(themeId: string | null | undefined): PixiThemeConfig {
  const id = themeId || 'default';
  return THEMES[id] || THEMES['default'];
}
