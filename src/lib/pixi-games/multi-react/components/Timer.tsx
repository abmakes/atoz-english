import React, { useCallback } from 'react';
import { extend } from '@pixi/react';
import { Graphics as PixiGraphics, TextStyle, Container, Graphics, Text } from 'pixi.js';
import { PixiSpecificConfig } from '@/lib/themes';

// Extend pixi/react with our components
extend({ Graphics, Container, Text });

interface TimerProps {
  remaining: number;
  duration: number;
  position: [number, number];
  themeConfig: PixiSpecificConfig;
}

export const Timer: React.FC<TimerProps> = ({
  remaining,
  duration,
  position,
  themeConfig
}) => {
  const radius = 40;
  const thickness = 8;
  const percentage = duration > 0 ? remaining / duration : 0;
  
  // Draw function for the timer
  const drawTimer = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Draw background circle
    g.circle(0, 0, radius)
      .fill({ color: 0x333333, alpha: 0.3 });
    
    // Draw progress arc
    if (percentage > 0) {
      const startAngle = -Math.PI / 2; // Start at 12 o'clock
      const endAngle = startAngle + (percentage * Math.PI * 2);
      
      g.arc(0, 0, radius, startAngle, endAngle)
        .stroke({ 
          width: thickness, 
          color: getTimerColor(percentage), 
          alignment: 0, // inside
          cap: 'round'
        });
    }
  }, [percentage, radius, thickness]);
  
  // Get timer color based on remaining time percentage
  const getTimerColor = (percentage: number): number => {
    // Convert theme color (CSS string) to a number if it exists
    const baseColor = parseInt(themeConfig.timerColor.replace('#', '0x'), 16);
    
    if (percentage > 0.6) {
      return 0x4caf50; // Green
    } else if (percentage > 0.3) {
      return 0xffc107; // Yellow
    } else {
      return 0xf44336; // Red
    }
  };
  
  // Format time as MM:SS
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Text style for timer text
  const textStyle = new TextStyle({
    fontFamily: themeConfig.fontFamilyTheme || 'Arial',
    fontSize: 24,
    fontWeight: 'bold',
    fill: themeConfig.textColor || 0xFFFFFF,
    align: 'center'
  });
  
  return (
    <pixiContainer position={{ x: position[0], y: position[1] }}>
      {/* Timer Circle */}
      <pixiGraphics draw={drawTimer} />
      
      {/* Timer Text */}
      <pixiText 
        text={formatTime(remaining)}
        anchor={0.5}
        style={textStyle}
      />
    </pixiContainer>
  );
}; 