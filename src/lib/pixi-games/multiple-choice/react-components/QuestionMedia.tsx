import React, { useCallback, useEffect, useState, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { GifSprite } from 'pixi.js/gif';
import { extend } from '@pixi/react';
import { useCurrentQuestionStore } from '@/lib/stores/useCurrentQuestionStore';
import { useManagersStore } from '@/lib/stores/useManagersStore';
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';

// Extend PIXI components for JSX usage
extend({ 
  Container: PIXI.Container
});

interface QuestionMediaProps {
  x?: number;
  y?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const QuestionMedia: React.FC<QuestionMediaProps> = ({
  x = 0,
  y = 0,
  maxWidth = 400,
  maxHeight = 300
}) => {
  const { currentQuestionData } = useCurrentQuestionStore(state => ({
    currentQuestionData: state.currentQuestionData
  }));
  
  const layoutManager = useManagersStore(state => state.multipleChoiceLayoutManager);
  const [mediaDimensions, setMediaDimensions] = useState<{ width: number, height: number, scale: number }>({
    width: 0,
    height: 0,
    scale: 1
  });
  
  // Use a ref to access the container in useEffect
  const containerRef = useRef<PIXI.Container>(null);

  // Load and prepare media
  useEffect(() => {
    // If no container ref, exit early
    if (!containerRef.current) return;
    
    // Clean up previous container children
    containerRef.current.removeChildren();

    // If no question data or no image URL, don't try to load anything
    if (!currentQuestionData || !currentQuestionData.imageUrl) {
      return;
    }

    const imageUrl = currentQuestionData.imageUrl;
    
    // Get display object from AssetLoader
    try {
      const displayObject = AssetLoader.getDisplayObject(imageUrl);
      
      if (displayObject) {
        // Calculate dimensions and scale
        const mediaOrigWidth = displayObject.texture?.orig.width ?? displayObject.width;
        const mediaOrigHeight = displayObject.texture?.orig.height ?? displayObject.height;
        
        if (mediaOrigWidth <= 0 || mediaOrigHeight <= 0) {
          console.warn("Media has invalid dimensions:", mediaOrigWidth, mediaOrigHeight);
          return;
        }
        
        // Calculate scale based on available dimensions
        let scale = 1;
        
        if (mediaOrigHeight > maxHeight && maxHeight > 0) {
          scale = maxHeight / mediaOrigHeight;
        }
        
        if (mediaOrigWidth * scale > maxWidth && maxWidth > 0) {
          scale = Math.min(scale, maxWidth / mediaOrigWidth);
        }
        
        setMediaDimensions({
          width: mediaOrigWidth * scale,
          height: mediaOrigHeight * scale,
          scale
        });
        
        // Set anchor point to center
        displayObject.anchor.set(0.5);
        
        // Apply scale
        displayObject.scale.set(scale);
        
        // Start animation if it's an animated sprite
        if (displayObject instanceof PIXI.AnimatedSprite || displayObject instanceof GifSprite) {
          setTimeout(() => {
            if (!displayObject.destroyed) {
              displayObject.play();
            }
          }, 50);
        }
        
        // Add to container
        containerRef.current.addChild(displayObject);
      }
    } catch (error) {
      console.error(`Error loading media from ${imageUrl}:`, error);
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        // Remove and destroy all children when component unmounts or on data change
        containerRef.current.removeChildren();
      }
    };
  }, [currentQuestionData, maxWidth, maxHeight]);

  // Use Container to position the media sprite
  return (
    <pixiContainer 
      x={x} 
      y={y} 
      ref={containerRef}
    />
  );
}; 