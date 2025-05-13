import React, { useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { extend } from '@pixi/react';
import { useGameConfigStore } from '@/lib/stores/useGameConfigStore';
import { useCurrentQuestionStore } from '@/lib/stores/useCurrentQuestionStore';
import { useManagersStore } from '@/lib/stores/useManagersStore';
import { getThemeConfig } from '@/lib/themes';

// Extend PIXI.Text for JSX usage
extend({ Text: PIXI.Text });

interface QuestionTextProps {
  x?: number;
  y?: number;
  width?: number;
}

export const QuestionText: React.FC<QuestionTextProps> = ({
  x = 0,
  y = 0,
  width = 600
}) => {
  // Get current question from the store
  const { currentQuestionText } = useCurrentQuestionStore((state) => ({
    currentQuestionText: state.currentQuestionData?.question || ''
  }));

  // Get theme configuration from game config
  const gameConfig = useGameConfigStore(state => state.config);
  const themeName = gameConfig?.theme || 'default';
  const theme = getThemeConfig(themeName).pixiConfig;

  // Get layout manager from managers store to access layout parameters
  const layoutManager = useManagersStore(state => state.multipleChoiceLayoutManager);
  
  // Determine font size and other parameters from layout manager
  const params = layoutManager?.getLayoutParams() || {
    questionFontSize: 36,
    questionYMultiplier: 0.15
  };

  // Create text style based on theme and layout parameters
  const textStyle = useCallback(() => {
    return {
      fontFamily: theme.fontFamilyTheme || 'Arial',
      fontSize: params.questionFontSize,
      fill: theme.questionTextColor || 0xffffff,
      align: 'center' as PIXI.TextStyleAlign,
      wordWrap: true,
      wordWrapWidth: width
    };
  }, [theme, params.questionFontSize, width]);

  if (!currentQuestionText) {
    return null;
  }

  return (
    <pixiText
      text={currentQuestionText}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0.5 }}
      style={textStyle()}
    />
  );
}; 