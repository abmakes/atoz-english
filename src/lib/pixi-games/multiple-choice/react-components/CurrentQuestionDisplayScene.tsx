import React, { useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { extend } from '@pixi/react';
import { useCurrentQuestionStore } from '@/lib/stores/useCurrentQuestionStore';
import { useManagersStore } from '@/lib/stores/useManagersStore';
import { useGameConfigStore } from '@/lib/stores/useGameConfigStore';
import { usePixiAppStore } from '@/lib/stores/usePixiAppStore';
import { getThemeConfig } from '@/lib/themes';
import { QuestionText } from './QuestionText';
import { QuestionMedia } from './QuestionMedia';
import { AnswerOptionsPanel } from './AnswerOptionsPanel';
import { TimerDisplay } from './TimerDisplay';

// Extend PIXI components for JSX usage
extend({ 
  Container: PIXI.Container,
  Graphics: PIXI.Graphics
});

interface CurrentQuestionDisplaySceneProps {
  x?: number;
  y?: number;
}

export const CurrentQuestionDisplayScene: React.FC<CurrentQuestionDisplaySceneProps> = ({
  x = 0,
  y = 0
}) => {
  // Get layout manager and logical dimensions
  const layoutManager = useManagersStore(state => state.multipleChoiceLayoutManager);
  const layoutParams = layoutManager?.getLayoutParams();
  const { width: logicalWidth, height: logicalHeight } = layoutManager?.getLogicalDimensions?.() || { width: 1280, height: 720 };

  // Get theme configuration
  const gameConfig = useGameConfigStore(state => state.config);
  const theme = getThemeConfig(gameConfig?.theme || 'default').pixiConfig;

  // Get question data
  const questionData = useCurrentQuestionStore(state => state.currentQuestionData);

  // If no layoutParams or questionData, don't render
  if (!layoutParams || !questionData) return null;

  // Calculate positions and dimensions in logical units
  const contentWidth = logicalWidth - (2 * layoutParams.sidePadding);

  // Background drawing function (PixiJS v8 API)
  const drawBackground = useCallback((g: PIXI.Graphics) => {
    const bgColor = theme.panelBg || 0x1099bb;
    const borderColor = theme.primaryAccent || 0x555555;
    const borderRadius = 16;
    const borderWidth = 3;
    g.clear();
    g.roundRect(0, 0, logicalWidth, logicalHeight, borderRadius).stroke({ width: borderWidth, color: borderColor }).fill(bgColor);
  }, [logicalWidth, logicalHeight, theme]);

  // Timer position
  const timerWidth = contentWidth;
  const timerHeight = 30;
  const timerX = layoutParams.sidePadding;
  const timerY = layoutParams.topPadding;

  // Media position
  const mediaX = logicalWidth / 2;
  const mediaY = layoutParams.imageY;
  const mediaMaxHeight = layoutParams.imageMaxHeight;

  // Question text position
  const textX = layoutParams.sidePadding;
  const textY = layoutParams.questionY;

  // Answer panel position and dimensions
  const answerPanelX = layoutParams.sidePadding;
  const answerPanelY = layoutParams.answerContainerY;
  const answerPanelWidth = contentWidth;
  const answerPanelHeight = layoutParams.answerContainerHeight;

  return (
    <pixiContainer x={x} y={y}>
      {/* Background */}
      <pixiGraphics draw={drawBackground} />

      {/* Timer */}
      <TimerDisplay
        x={timerX}
        y={timerY}
        width={timerWidth}
        height={timerHeight}
        backgroundColor={theme.secondaryBg || 0x333333}
        progressBarColor={theme.timerColor || theme.primaryAccent || 0x00ff00}
        borderColor={theme.inputBorder || theme.primaryAccent || 0x999999}
      />

      {/* Question Text */}
      <QuestionText
        x={textX}
        y={textY}
        width={contentWidth}
      />

      {/* Question Media (if available) */}
      {questionData.imageUrl && (
        <QuestionMedia
          x={mediaX}
          y={mediaY}
          maxWidth={contentWidth * 0.8}
          maxHeight={mediaMaxHeight}
        />
      )}

      {/* Answer Options Panel */}
      <AnswerOptionsPanel
        x={answerPanelX}
        y={answerPanelY}
        width={answerPanelWidth}
        height={answerPanelHeight}
        columns={layoutParams.answerColumns}
        gap={layoutParams.answerButtonGap}
      />
    </pixiContainer>
  );
}; 