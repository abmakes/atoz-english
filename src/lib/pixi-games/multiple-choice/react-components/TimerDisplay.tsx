import React, { useCallback, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { extend } from '@pixi/react';
import { useGameDisplayStateStore } from '@/lib/stores/useGameDisplayStateStore';
import { useGameConfigStore } from '@/lib/stores/useGameConfigStore';

// Extend PIXI.Graphics for JSX usage
extend({ Graphics: PIXI.Graphics });

/**
 * Props for the TimerDisplay component
 */
interface TimerDisplayProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  textColor?: string | number;
  progressBarColor?: string | number;
  backgroundColor?: string | number;
  borderColor?: string | number;
  borderRadius?: number;
  showText?: boolean;
}

/**
 * A React-Pixi component for displaying a timer with progress bar
 * 
 * This component uses Zustand stores for game state:
 * - useGameDisplayStateStore: for currentTimeRemaining and initialDuration values
 * - useGameConfigStore: for game configuration (optional, for any time-related parameters)
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  x = 0,
  y = 0,
  width = 200,
  height = 30,
  textColor = 0xffffff,
  progressBarColor = 0x00ff00,
  backgroundColor = 0x333333,
  borderColor = 0x999999,
  borderRadius = 5,
  showText = true
}) => {
  // Subscribe to time values from the Zustand store
  const { currentTimeRemaining, initialDuration } = useGameDisplayStateStore(state => ({
    currentTimeRemaining: state.currentTimeRemaining,
    initialDuration: state.initialDuration
  }));

  // Optional: Access game config for any additional parameters
  const gameConfig = useGameConfigStore(state => state.config);

  // Create a text reference to update without re-drawing the graphics
  const textRef = useRef<PIXI.Text | null>(null);

  // Progress calculation function
  const calculateProgress = useCallback(() => {
    if (!initialDuration || !currentTimeRemaining || initialDuration <= 0) return 0;
    const progress = currentTimeRemaining / initialDuration;
    return Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1
  }, [currentTimeRemaining, initialDuration]);

  // Format time function
  const formatTime = useCallback((milliseconds: number | null) => {
    if (milliseconds === null) return "00:00";
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Graphics draw function
  const draw = useCallback((g: PIXI.Graphics) => {
    const progress = calculateProgress();
    
    // Clear previous drawing
    g.clear();
    
    // Draw border/background
    g.lineStyle(2, borderColor);
    g.beginFill(backgroundColor);
    g.drawRoundedRect(0, 0, width, height, borderRadius);
    g.endFill();
    
    // Draw progress bar
    if (progress > 0) {
      g.beginFill(progressBarColor);
      g.drawRoundedRect(2, 2, (width - 4) * progress, height - 4, borderRadius - 2);
      g.endFill();
    }
    
    // Create/update text if needed
    if (showText) {
      // Remove previous text if it exists
      if (textRef.current && textRef.current.parent === g) {
        g.removeChild(textRef.current);
        textRef.current.destroy();
      }
      
      // Create new text
      const timeText = formatTime(currentTimeRemaining);
      const text = new PIXI.Text({
        text: timeText,
        style: {
          fontFamily: 'Arial',
          fontSize: height * 0.6,
          fill: textColor,
          align: 'center' as PIXI.TextStyleAlign
        }
      });
      
      // Position text in the center
      text.anchor.set(0.5);
      text.x = width / 2;
      text.y = height / 2;
      
      // Add to graphics and save reference
      g.addChild(text);
      textRef.current = text;
    }
  }, [
    calculateProgress, 
    currentTimeRemaining, 
    backgroundColor, 
    borderColor, 
    borderRadius, 
    height, 
    progressBarColor, 
    showText, 
    textColor, 
    width,
    formatTime
  ]);
  
  // Position the component
  return (
    <pixiGraphics draw={draw} x={x} y={y} />
  );
}; 