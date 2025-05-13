import React, { useCallback, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { extend } from '@pixi/react';
import { useCurrentQuestionStore } from '@/lib/stores/useCurrentQuestionStore';
import { useManagersStore } from '@/lib/stores/useManagersStore';
import { AnswerButton } from './AnswerButton';

// Extend PIXI components for JSX usage
extend({ Container: PIXI.Container });

interface AnswerOptionsPanelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  columns?: number;
  gap?: number;
}

export const AnswerOptionsPanel: React.FC<AnswerOptionsPanelProps> = ({
  x = 0,
  y = 0,
  width = 800,
  height = 400,
  columns = 2,
  gap = 20
}) => {
  // Get answer options and submission state from store
  const { 
    answerOptions, 
    isAnswerSubmitted, 
    submitAnswer 
  } = useCurrentQuestionStore(state => ({
    answerOptions: state.currentAnswerOptions || [],
    isAnswerSubmitted: state.isAnswerSubmitted,
    submitAnswer: state.submitAnswer
  }));
  
  // Layout manager for positioning
  const layoutManager = useManagersStore(state => state.multipleChoiceLayoutManager);
  const layoutParams = layoutManager?.getLayoutParams();
  
  // Local state for selected answer (before submission)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  
  // Reset selected option when question changes
  useEffect(() => {
    setSelectedOptionId(null);
  }, [answerOptions]);
  
  // Handle answer button selection
  const handleSelectAnswer = useCallback((optionId: string) => {
    if (!isAnswerSubmitted) {
      setSelectedOptionId(optionId);
      submitAnswer(optionId);
    }
  }, [isAnswerSubmitted, submitAnswer]);
  
  // Calculate button dimensions based on available space and number of options
  const buttonLayout = useCallback(() => {
    const numOptions = answerOptions.length;
    if (numOptions === 0) return { width: 0, height: 0 };
    
    // Determine actual columns based on options count and max columns
    const actualColumns = Math.min(columns, numOptions);
    const rows = Math.ceil(numOptions / actualColumns);
    
    // Calculate available space for buttons after accounting for gaps
    const availableWidth = width - (gap * (actualColumns - 1));
    const availableHeight = height - (gap * (rows - 1));
    
    // Calculate button dimensions
    const buttonWidth = Math.floor(availableWidth / actualColumns);
    const buttonHeight = Math.floor(availableHeight / rows);
    
    return { width: buttonWidth, height: buttonHeight };
  }, [answerOptions.length, width, height, columns, gap]);
  
  // No answers to display
  if (answerOptions.length === 0) {
    return null;
  }
  
  const { width: buttonWidth, height: buttonHeight } = buttonLayout();
  
  return (
    <pixiContainer x={x} y={y}>
      {answerOptions.map((option, index) => {
        // Calculate position in the grid
        const col = index % columns;
        const row = Math.floor(index / columns);
        
        // Calculate button position including gaps
        const buttonX = col * (buttonWidth + gap);
        const buttonY = row * (buttonHeight + gap);
        
        return (
          <AnswerButton
            key={option.id}
            id={option.id}
            text={option.text}
            x={buttonX}
            y={buttonY}
            width={buttonWidth}
            height={buttonHeight}
            fontSize={layoutParams?.answerButtonFontSize || 24}
            isCorrect={option.isCorrect}
            isSelected={selectedOptionId === option.id}
            isDisabled={isAnswerSubmitted}
            showCorrectness={isAnswerSubmitted}
            onSelect={handleSelectAnswer}
          />
        );
      })}
    </pixiContainer>
  );
}; 