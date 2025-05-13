import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useApplication, extend } from '@pixi/react';
import { useGameConfigStore } from '@/lib/stores/useGameConfigStore';
import { getThemeConfig, PixiSpecificConfig } from '@/lib/themes';

// Extend PIXI.Graphics for JSX usage specifically within this component/module
extend({ Graphics: PIXI.Graphics });

export const GameBackground: React.FC = () => {
  const appService = useApplication();
  const gameConfig = useGameConfigStore(state => state.config);
  const [theme, setTheme] = useState<PixiSpecificConfig | null>(null);

  useEffect(() => {
    if (gameConfig) {
      const selectedTheme = getThemeConfig(gameConfig.theme || 'default');
      setTheme(selectedTheme.pixiConfig);
    }
  }, [gameConfig]);

  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear();
    // Access screen via appService.app.screen
    if (theme && appService?.app?.screen) {
      const bgColor = new PIXI.Color(theme.panelBg || '#000000').toNumber();
      g.rect(0, 0, appService.app.screen.width, appService.app.screen.height).fill(bgColor);
    } else if (appService?.app?.screen) {
      // Fallback if theme is not loaded yet or app is not fully available
      g.rect(0, 0, appService.app.screen.width, appService.app.screen.height).fill(0x1099bb);
    }
  }, [appService, theme]);

  if (!appService?.app?.screen) {
    return null; // Don't render if app screen is not available
  }

  // Use <Graphics /> directly, assuming it's extended globally or in a parent component context.
  // If this still causes issues, `extend` needs to be called in this file or a shared setup file.
  return <pixiGraphics draw={draw} />; 
}; 