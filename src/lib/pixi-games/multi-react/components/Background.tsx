import React, { useCallback } from 'react';
import { extend } from '@pixi/react';
import { Graphics as PixiGraphics, Container, Graphics } from 'pixi.js';
import { PixiSpecificConfig } from '@/lib/themes';

// Extend with necessary PIXI components
extend({ Graphics, Container });

interface BackgroundProps {
  themeConfig: PixiSpecificConfig;
  width: number;
  height: number;
}

export const Background: React.FC<BackgroundProps> = ({
  themeConfig,
  width,
  height
}) => {
  // Draw the background
  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Convert theme color (CSS string) to a number
    const bgColor = parseInt(themeConfig.primaryBg.replace('#', '0x'), 16);
    
    // Draw full screen background
    g.rect(0, 0, width, height)
      .fill({ color: bgColor });
    
  }, [themeConfig.primaryBg, width, height]);
  
  return (
    <pixiContainer>
      <pixiGraphics draw={drawBackground} />
    </pixiContainer>
  );
}; 