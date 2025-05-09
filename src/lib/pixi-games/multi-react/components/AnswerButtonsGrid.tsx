import React, { useCallback, useMemo } from 'react';
import { extend } from '@pixi/react';
import { Graphics as PixiGraphics, TextStyle, Container, Graphics, Text } from 'pixi.js';
import { PixiSpecificConfig } from '@/lib/themes';
import { LayoutParameters } from '../managers/MultipleChoiceLayoutManager';
import { AnswerOptionUIData } from '../MultipleChoiceReact';

// Extend @pixi/react with necessary Pixi.js components
extend({ Graphics, Container, Text });

interface AnswerButtonsGridProps {
  options: AnswerOptionUIData[];
  onSelect: (questionId: string, optionId: string) => void;
  layoutParams: LayoutParameters;
  screenWidth: number;
  screenHeight: number;
  themeConfig: PixiSpecificConfig;
  enabled: boolean;
  showAnswer: boolean;
  selectedId: string | null;
  questionId: string;
}

export const AnswerButtonsGrid: React.FC<AnswerButtonsGridProps> = ({
  options,
  onSelect,
  layoutParams,
  screenWidth,
  screenHeight,
  themeConfig,
  enabled,
  showAnswer,
  selectedId,
  questionId
}) => {
  // Calculate button dimensions and layout
  const buttonsLayout = useMemo(() => {
    const columns = layoutParams.answerColumns;
    const gap = layoutParams.answerButtonGap;
    const buttonWidth = screenWidth * layoutParams.answerButtonWidthMultiplier;
    const buttonHeight = layoutParams.answerButtonHeightMultiplier * screenHeight / 3;
    
    // Calculate button container bounds
    const containerWidth = screenWidth - 2 * layoutParams.sidePadding;
    const containerHeight = buttonHeight * Math.ceil(options.length / columns) + 
                           (Math.ceil(options.length / columns) - 1) * gap;
    const containerY = screenHeight - layoutParams.bottomPadding - containerHeight;
    
    // Calculate total width required for buttons in a row
    const numColumns = Math.min(columns, options.length);
    const totalButtonWidth = numColumns * buttonWidth;
    const totalGapWidth = Math.max(0, numColumns - 1) * gap;
    const totalGridWidth = totalButtonWidth + totalGapWidth;
    
    // Starting X position to center the grid
    const startX = (screenWidth - totalGridWidth) / 2;
    
    // Generate button positions
    const buttonPositions = options.map((_, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      
      const x = startX + (col * (buttonWidth + gap)) + buttonWidth / 2;
      const y = containerY + (row * (buttonHeight + gap)) + buttonHeight / 2;
      
      return {
        x,
        y,
        width: buttonWidth,
        height: buttonHeight
      };
    });
    
    return {
      buttonPositions,
      containerY,
      containerHeight,
      buttonWidth,
      buttonHeight,
      buttonFontSize: layoutParams.answerButtonFontSize
    };
  }, [options.length, layoutParams, screenWidth, screenHeight]);
  
  // Helper function to convert CSS color to PIXI number
  const colorToNumber = (cssColor: string): number => {
    return parseInt(cssColor.replace('#', '0x'), 16);
  };
  
  // Draw a button with the given style
  const drawButton = useCallback((
    g: PixiGraphics, 
    width: number, 
    height: number, 
    fillColor: string,
    borderColor: string,
    shadowColor: string,
    isSelected: boolean
  ) => {
    g.clear();
    
    const borderRadius = 16;
    const borderWidth = 3;
    const shadowOffsetX = 4;
    const shadowOffsetY = 6;
    
    // Convert colors to numbers
    const fillColorNumber = colorToNumber(fillColor);
    const borderColorNumber = colorToNumber(borderColor);
    const shadowColorNumber = colorToNumber(shadowColor);
    
    // Draw shadow/highlight first (below button)
    g.roundRect(
      shadowOffsetX, 
      shadowOffsetY, 
      width, 
      height, 
      borderRadius
    ).fill({ color: shadowColorNumber });
    
    // Draw button on top of shadow
    g.roundRect(0, 0, width, height, borderRadius)
      .fill({ color: fillColorNumber })
      .stroke({ 
        width: borderWidth, 
        color: borderColorNumber,
        alignment: 0 // Inside
      });
    
    // Draw selection indicator if needed
    if (isSelected) {
      g.roundRect(10, 10, width - 20, height - 20, borderRadius - 5)
        .stroke({ 
          width: 2, 
          color: borderColorNumber, 
          alignment: 0,
          alpha: 0.5
        });
    }
  }, []);
  
  return (
    <pixiContainer>
      {options.map((option, index) => {
        const buttonPos = buttonsLayout.buttonPositions[index];
        const isSelected = selectedId === option.id;
        const isCorrect = option.isCorrect === true;
        
        // Determine button colors based on state
        let fillColor = themeConfig.primaryAccent;
        let borderColor = themeConfig.primaryAccent;
        let textColor = themeConfig.buttonTextColor;
        let shadowColor = themeConfig.primaryAccentHover;
        
        if (showAnswer) {
          if (isCorrect) {
            // Correct answer
            fillColor = '#4caf50'; // Green
            borderColor = '#388e3c'; // Darker green
            shadowColor = '#1b5e20'; // Even darker green
          } else if (isSelected && !isCorrect) {
            // Selected but incorrect
            fillColor = '#f44336'; // Red
            borderColor = '#d32f2f'; // Darker red
            shadowColor = '#b71c1c'; // Even darker red
          }
        } else if (isSelected) {
          // Selected but answer not revealed yet
          fillColor = themeConfig.primaryAccentHover;
        }
        
        // Button position and dimensions
        const position: [number, number] = [buttonPos.x - buttonPos.width / 2, buttonPos.y - buttonPos.height / 2];
        
        const buttonStyle = new TextStyle({
          fontFamily: themeConfig.fontFamilyTheme,
          fontSize: buttonsLayout.buttonFontSize,
          fill: colorToNumber(textColor),
          align: 'center',
          wordWrap: true,
          wordWrapWidth: buttonPos.width - 20
        });
        
        // Calculate hitarea (for click events)
        const hitArea = {
          x: buttonPos.x - buttonPos.width / 2,
          y: buttonPos.y - buttonPos.height / 2,
          width: buttonPos.width,
          height: buttonPos.height
        };
        
        // Create click handler for this button
        const handleClick = enabled ? () => onSelect(questionId, option.id) : undefined;
        
        return (
          <pixiContainer 
            key={`option-${option.id}`}
            interactive={enabled}
            cursor={enabled ? 'pointer' : 'default'}
            eventMode={enabled ? 'static' : 'none'}
            position={{ x: hitArea.x, y: hitArea.y }}
            onClick={handleClick}
          >
            {/* Button background */}
            <pixiGraphics 
              draw={g => drawButton(
                g, 
                buttonPos.width, 
                buttonPos.height, 
                fillColor,
                borderColor, 
                shadowColor, 
                isSelected
              )}
            />
            
            {/* Button text */}
            <pixiText 
              text={option.text}
              anchor={0.5}
              position={{ x: buttonPos.width / 2, y: buttonPos.height / 2 }}
              style={buttonStyle}
            />
          </pixiContainer>
        );
      })}
    </pixiContainer>
  );
}; 