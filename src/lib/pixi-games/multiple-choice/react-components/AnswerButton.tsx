import React, { useCallback, useState, useMemo } from 'react';
import * as PIXI from 'pixi.js';
import { extend } from '@pixi/react';
import { useGameConfigStore } from '@/lib/stores/useGameConfigStore';
import { getThemeConfig } from '@/lib/themes';
import { useCurrentQuestionStore } from '@/lib/stores/useCurrentQuestionStore';

// Extend PIXI components for JSX usage
extend({ 
  Container: PIXI.Container,
  Graphics: PIXI.Graphics,
  Text: PIXI.Text
});

// Define missing theme properties as fallbacks
const themeDefaults = {
  correctAnswerColor: 0x4ade80, // Green color
  incorrectAnswerColor: 0xef4444, // Red color
  correctBorderColor: 0x16a34a, // Darker green
  incorrectBorderColor: 0xb91c1c, // Darker red
  answerSelectedTextColor: 0xffffff, // White
  answerSelectedColor: 0x2563eb, // Blue
  buttonDisabledColor: 0xd1d5db, // Gray
  buttonDisabledTextColor: 0x6b7280, // Darker gray
  buttonPressedColor: 0x60a5fa, // Light blue
  buttonHoverColor: 0x93c5fd, // Very light blue
  shadowColor: 0x000000 // Black with transparency
};

interface AnswerButtonProps {
  id: string;
  text: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isCorrect?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  showCorrectness?: boolean;
  onSelect?: (id: string) => void;
  fontSize?: number;
}

export const AnswerButton: React.FC<AnswerButtonProps> = ({
  id,
  text,
  x = 0,
  y = 0,
  width = 300,
  height = 80,
  isCorrect = false,
  isSelected = false,
  isDisabled = false,
  showCorrectness = false,
  onSelect,
  fontSize = 24
}) => {
  // Button visual states
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Get theme configuration
  const gameConfig = useGameConfigStore(state => state.config);
  const theme = getThemeConfig(gameConfig?.theme || 'default').pixiConfig;
  
  // Get answer submission state
  const isAnswerSubmitted = useCurrentQuestionStore(state => state.isAnswerSubmitted);
  
  // Derived state for button visuals (color, border, etc.)
  const buttonState = useMemo(() => {
    // Determine the visual state of the button
    if (isDisabled || isAnswerSubmitted) {
      if (showCorrectness) {
        return {
          fillColor: isCorrect ? themeDefaults.correctAnswerColor : themeDefaults.incorrectAnswerColor,
          borderColor: isCorrect ? themeDefaults.correctBorderColor : themeDefaults.incorrectBorderColor,
          textColor: themeDefaults.answerSelectedTextColor
        };
      } else if (isSelected) {
        return {
          fillColor: themeDefaults.answerSelectedColor,
          borderColor: theme.primaryAccent,
          textColor: themeDefaults.answerSelectedTextColor
        };
      } else {
        return {
          fillColor: themeDefaults.buttonDisabledColor,
          borderColor: theme.buttonBorderColor,
          textColor: themeDefaults.buttonDisabledTextColor
        };
      }
    } else if (isPressed) {
      return {
        fillColor: themeDefaults.buttonPressedColor,
        borderColor: theme.primaryAccentHover,
        textColor: theme.buttonTextColor
      };
    } else if (isHovered) {
      return {
        fillColor: themeDefaults.buttonHoverColor,
        borderColor: theme.primaryAccentHover,
        textColor: theme.buttonTextColor
      };
    } else {
      return {
        fillColor: theme.buttonFillColor,
        borderColor: theme.buttonBorderColor,
        textColor: theme.buttonTextColor
      };
    }
  }, [
    isDisabled, isAnswerSubmitted, showCorrectness, isCorrect, isSelected, 
    isPressed, isHovered, theme
  ]);
  
  // Event handlers
  const handlePointerOver = useCallback(() => {
    if (!isDisabled && !isAnswerSubmitted) setIsHovered(true);
  }, [isDisabled, isAnswerSubmitted]);
  
  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);
  
  const handlePointerDown = useCallback(() => {
    if (!isDisabled && !isAnswerSubmitted) setIsPressed(true);
  }, [isDisabled, isAnswerSubmitted]);
  
  const handlePointerUp = useCallback(() => {
    if (isPressed && !isDisabled && !isAnswerSubmitted && onSelect) {
      onSelect(id);
    }
    setIsPressed(false);
  }, [id, isPressed, isDisabled, isAnswerSubmitted, onSelect]);
  
  // Graphics drawing function for the button background and border
  const drawButton = useCallback((g: PIXI.Graphics) => {
    g.clear();
    
    const borderRadius = 16;
    const borderWidth = 3;
    const shadowOffsetX = 4;
    const shadowOffsetY = 6;
    
    // Draw shadow if not disabled
    if (!isDisabled) {
      g.beginFill(themeDefaults.shadowColor);
      g.drawRoundedRect(shadowOffsetX, shadowOffsetY, width, height, borderRadius);
      g.endFill();
    }
    
    // Draw border
    g.lineStyle(borderWidth, buttonState.borderColor);
    g.beginFill(buttonState.fillColor);
    g.drawRoundedRect(0, 0, width, height, borderRadius);
    g.endFill();
    
  }, [width, height, isDisabled, buttonState]);
  
  // Text style for the button
  const textStyle = useMemo(() => {
    return {
      fontFamily: theme.fontFamilyTheme || 'Arial',
      fontSize: fontSize,
      fill: buttonState.textColor,
      align: 'center' as PIXI.TextStyleAlign,
      wordWrap: true,
      wordWrapWidth: width - 40
    };
  }, [width, buttonState.textColor, theme.fontFamilyTheme, fontSize]);
  
  return (
    <pixiContainer 
      x={x} 
      y={y}
      eventMode={isDisabled ? 'none' : 'static'}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerUpOutside={handlePointerOut}
      cursor={isDisabled ? 'default' : 'pointer'}
    >
      <pixiGraphics draw={drawButton} />
      <pixiText 
        text={text}
        x={width / 2}
        y={height / 2}
        anchor={0.5}
        style={textStyle}
      />
    </pixiContainer>
  );
}; 