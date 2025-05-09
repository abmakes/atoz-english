import React, { useCallback, useEffect, useState } from 'react';
import { extend } from '@pixi/react';
import { Graphics as PixiGraphics, TextStyle, Texture, Container, Graphics, Sprite, Text, Assets } from 'pixi.js';
import { PixiSpecificConfig } from '@/lib/themes';
import { QuestionData } from '@/types';
import { LayoutParameters } from '../managers/MultipleChoiceLayoutManager';
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';

// Extend pixi/react with our components
extend({ Graphics, Container, Sprite, Text });

interface QuestionDisplayProps {
  question: QuestionData | null;
  layoutParams: LayoutParameters;
  screenWidth: number;
  screenHeight: number;
  themeConfig: PixiSpecificConfig;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  layoutParams,
  screenWidth,
  screenHeight,
  themeConfig
}) => {
  const [mediaTexture, setMediaTexture] = useState<Texture | null>(null);
  const [mediaScale, setMediaScale] = useState(1);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  // Get media element when question changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingMedia(true);
    setMediaError(null);
    
    const loadMedia = async () => {
      if (!question?.imageUrl) {
        setMediaTexture(null);
        setIsLoadingMedia(false);
        return;
      }
      
      try {
        // First try to load from PIXI Assets cache (may have been preloaded)
        const assetKey = `asset-${question.imageUrl.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '')}`;
        let texture: Texture | null = null;
        
        // Try multiple loading methods for maximum compatibility
        try {
          // First check if it's in the PIXI cache already
          if (Assets.cache.has(question.imageUrl)) {
            texture = Assets.cache.get(question.imageUrl);
            console.log("Found texture in Assets cache:", question.imageUrl);
          } 
          // Then try with the asset key
          else if (Assets.cache.has(assetKey)) {
            texture = Assets.cache.get(assetKey);
            console.log("Found texture in Assets cache with key:", assetKey);
          } 
          // Try loading directly with PIXI Assets
          else {
            console.log("Loading image directly with Assets.load:", question.imageUrl);
            texture = await Assets.load(question.imageUrl);
          }
        } catch (err) {
          console.warn("PIXI Assets loading failed, trying AssetLoader:", err);
          // Fall back to AssetLoader
          const displayObject = await AssetLoader.getDisplayObject(question.imageUrl);
          if (displayObject?.texture) {
            texture = displayObject.texture;
          }
        }
        
        // If all methods failed, throw an error to be caught by the outer catch
        if (!texture) {
          throw new Error("Failed to load image with all methods");
        }
        
        if (isMounted) {
          setMediaTexture(texture);
          
          // Calculate scale based on texture dimensions
          const mediaWidth = texture.width || 0;
          const mediaHeight = texture.height || 0;
          
          if (mediaWidth <= 0 || mediaHeight <= 0) {
            setMediaScale(1);
            return;
          }
          
          // Calculate available space based on layout
          const imageTopBound = layoutParams.topPadding;
          const imageBottomBound = screenHeight * layoutParams.questionYMultiplier - 100;
          const availableHeightForMedia = Math.max(10, imageBottomBound - imageTopBound);
          
          // Calculate scale
          let scale = 1;
          if (mediaHeight > availableHeightForMedia && availableHeightForMedia > 0) {
            scale = availableHeightForMedia / mediaHeight;
          }
          
          // Optional width constraint
          const availableWidthForMedia = screenWidth - 2 * layoutParams.sidePadding;
          if (mediaWidth * scale > availableWidthForMedia && availableWidthForMedia > 0) {
            scale = Math.min(scale, availableWidthForMedia / mediaWidth);
          }
          
          if (scale <= 0 || !isFinite(scale)) {
            scale = 1;
          }
          
          if (isMounted) {
            setMediaScale(scale);
          }
        }
      } catch (error) {
        console.error("Error loading media for question:", error);
        if (isMounted) {
          setMediaTexture(null);
          setMediaError(`Failed to load image: ${error}`);
        }
      } finally {
        if (isMounted) {
          setIsLoadingMedia(false);
        }
      }
    };
    
    loadMedia();
    return () => { isMounted = false; };
  }, [question, layoutParams, screenWidth, screenHeight]);
  
  // Draw the background panel
  const drawBackgroundPanel = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Define dimensions
    const x = layoutParams.sidePadding;
    const width = screenWidth - (2 * layoutParams.sidePadding);
    const height = screenHeight - layoutParams.topPadding - layoutParams.bottomPadding;
    const y = layoutParams.topPadding;
    const radius = 20;
    
    // Draw rounded rectangle
    g.roundRect(x, y, width, height, radius)
      .fill({ color: parseInt(themeConfig.panelBg.replace('#', '0x'), 16) });
  }, [layoutParams, screenWidth, screenHeight, themeConfig.panelBg]);
  
  // Determine text position - move up if no media is shown
  const textPosition: [number, number] = [
    screenWidth / 2,
    !mediaTexture ? screenHeight * 0.4 : screenHeight * layoutParams.questionYMultiplier
  ];
  
  // Determine media position
  const mediaPosition: [number, number] = [
    screenWidth / 2,
    layoutParams.topPadding + (screenHeight * layoutParams.questionYMultiplier - layoutParams.topPadding) / 2
  ];
  
  // Text style based on layout
  const textStyle = new TextStyle({
    fontFamily: themeConfig.fontFamilyTheme,
    fontSize: layoutParams.questionFontSize,
    fill: parseInt(themeConfig.questionTextColor.replace('#', '0x'), 16),
    align: 'center',
    wordWrap: true,
    wordWrapWidth: screenWidth * layoutParams.questionWrapMultiplier
  });
  
  // Style for loading/error text
  const infoTextStyle = new TextStyle({
    fontFamily: themeConfig.fontFamilyTheme,
    fontSize: 18,
    fill: 0xaaaaaa,
    align: 'center'
  });
  
  return (
    <pixiContainer>
      {/* Background panel */}
      <pixiGraphics draw={drawBackgroundPanel} />
      
      {/* Question text */}
      <pixiText 
        text={question?.question || ''}
        position={{ x: textPosition[0], y: textPosition[1] }}
        anchor={0.5}
        style={textStyle}
      />
      
      {/* Loading state */}
      {isLoadingMedia && (
        <pixiText 
          text="Loading image..."
          position={{ x: mediaPosition[0], y: mediaPosition[1] }}
          anchor={0.5}
          style={infoTextStyle}
        />
      )}
      
      {/* Error state */}
      {mediaError && (
        <pixiText 
          text="Image not available"
          position={{ x: mediaPosition[0], y: mediaPosition[1] }}
          anchor={0.5}
          style={infoTextStyle}
        />
      )}
      
      {/* Question media (if available) */}
      {mediaTexture && !isLoadingMedia && !mediaError && (
        <pixiSprite 
          texture={mediaTexture}
          position={{ x: mediaPosition[0], y: mediaPosition[1] }}
          anchor={0.5}
          scale={mediaScale}
        />
      )}
    </pixiContainer>
  );
}; 