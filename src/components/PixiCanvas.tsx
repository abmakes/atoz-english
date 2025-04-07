'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { PixiEngine } from '@/lib/pixi-engine/core/PixiEngine';
import { Assets, Sprite } from 'pixi.js';
import { ResponsiveCanvas, ResponsiveCanvasOptions } from '@/lib/pixi-engine/utils/ResponsiveCanvas';

// Extended ResponsiveCanvasOptions interface with our additional properties
export interface PixiCanvasProps {
  onInit?: (engine: PixiEngine) => void;
  onResize?: (width: number, height: number) => void;
  backgroundColor?: string;
  debug?: boolean;
  className?: string;
  aspectRatio?: number;
  maintainAspectRatio?: boolean;
  fitHeight?: boolean;
  centerCanvas?: boolean;
  enableFullScreen?: boolean;
  autoResize?: boolean;
}

export const PixiCanvas: FC<PixiCanvasProps> = (props) => {
  const {
    onInit,
    onResize,
    backgroundColor = '#1099bb',
    debug = false,
    className = '',
    aspectRatio = 16/9,
    maintainAspectRatio = true,
    fitHeight = true,
    centerCanvas = true,
    enableFullScreen = false,
    autoResize = true,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PixiEngine | null>(null);
  const responsiveCanvasRef = useRef<ResponsiveCanvas | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [isSized, setIsSized] = useState(false);

  // Initialize PixiJS
  useEffect(() => {
    // Prevent double initialization
    if (initializing || isInitialized || !containerRef.current) return;
    
    setInitializing(true);
    
    const initPixi = async () => {
      try {
        console.log('Initializing PixiCanvas...');
        
        // Create a new PixiEngine instance
        const engine = new PixiEngine({
          parent: containerRef.current!,
          backgroundColor,
          debug,
          autoResize: false, // We'll handle resize with ResponsiveCanvas
        });
        
        // Initialize the engine
        await engine.init();
        console.log('PixiEngine initialized');
        
        // Store engine reference
        engineRef.current = engine;
        
        // Create a responsive canvas manager with options
        const responsiveOptions: ResponsiveCanvasOptions = {
          app: engine.getApp().getApp(),
          canvas: engine.getApp().getCanvas(),
          parent: containerRef.current!,
          aspectRatio,
          maintainAspectRatio,
          fitHeight,
          centerCanvas,
          autoResize,
        };
        
        console.log('Creating ResponsiveCanvas with options:', responsiveOptions);
        const responsiveCanvas = new ResponsiveCanvas(responsiveOptions);
        responsiveCanvasRef.current = responsiveCanvas;
        
        // Add a resize listener manually since ResponsiveCanvas doesn't have an onResize method
        const resizeListener = (e: CustomEvent) => {
          console.log('Canvas resized:', e.detail);
          
          // Resize the PixiJS application
          engine.getApp().resize(e.detail.canvasWidth, e.detail.canvasHeight);
          
          // Set sizing as complete after first resize
          if (!isSized) {
            setIsSized(true);
          }
          
          // Call the onResize prop if provided
          if (onResize) {
            onResize(e.detail.canvasWidth, e.detail.canvasHeight);
          }
        };
        
        // Add event listener for custom resize event
        engine.getApp().getCanvas().addEventListener('canvasresize', resizeListener as EventListener);
        
        // Add a test bunny sprite if in debug mode and 
        // there is no onInit handler
        if (debug && !onInit) {
          try {
            console.log('Creating debug bunny sprite');
            const bunnyTexture = await Assets.load('https://pixijs.com/assets/bunny.png');
            const bunny = new Sprite(bunnyTexture);
            
            // Center the sprite's anchor point
            bunny.anchor.set(0.5);
            
            // Move the sprite to the center of the screen
            bunny.x = engine.getApp().getApp().screen.width / 2;
            bunny.y = engine.getApp().getApp().screen.height / 2;
            
            // Set a bright color tint for visibility
            bunny.tint = 0xff0000;
            
            // Scale up for visibility
            bunny.scale.set(3);
            
            // Add to the stage
            engine.getApp().getStage().addChild(bunny);
            
            // Set up a simple animation for the bunny
            engine.onUpdate((deltaTime) => {
              // Rotate the bunny
              bunny.rotation += 0.1 * deltaTime;
            });
            
            console.log('Debug bunny added to stage');
          } catch (error) {
            console.error('Error creating debug bunny:', error);
          }
        }
        
        // Call the onInit prop if provided
        if (onInit) {
          console.log('Calling onInit handler');
          onInit(engine);
        }
        
        // Force an initial resize
        responsiveCanvas.resize();
        
        setIsInitialized(true);
        console.log('PixiCanvas initialization complete');
        
        // Return cleanup function to remove the event listener
        return () => {
          engine.getApp().getCanvas().removeEventListener('canvasresize', resizeListener as EventListener);
        };
      } catch (error) {
        console.error('Error initializing PixiCanvas:', error);
        setLoadError(error instanceof Error ? error.message : String(error));
      } finally {
        setInitializing(false);
      }
    };
    
    initPixi();
    
    // Cleanup on unmount
    return () => {
      console.log('Cleaning up PixiCanvas');
      
      // Destroy the responsive canvas manager
      if (responsiveCanvasRef.current) {
        responsiveCanvasRef.current.destroy();
        responsiveCanvasRef.current = null;
      }
      
      // Destroy the PixiJS engine
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      
      setIsInitialized(false);
    };
  }, [
    backgroundColor, 
    debug, 
    onInit, 
    onResize, 
    aspectRatio, 
    maintainAspectRatio,
    fitHeight,
    centerCanvas,
    enableFullScreen,
    autoResize,
    initializing,
    isInitialized,
    isSized
  ]);

  return (
    <div 
      ref={containerRef} 
      className={`pixi-canvas-container ${className}`} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative', 
        overflow: 'hidden',
        visibility: (isInitialized && isSized) ? 'visible' : 'hidden'
      }}
    >
      {loadError && (
        <div className="error-message" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          backgroundColor: 'rgba(255, 0, 0, 0.7)',
          padding: '1rem',
          borderRadius: '0.5rem',
          zIndex: 10,
        }}>
          <h3>Error loading PixiJS</h3>
          <p>{loadError}</p>
        </div>
      )}
      {initializing && !isInitialized && (
        <div className="loading-message" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '1rem',
          borderRadius: '0.5rem',
          zIndex: 10,
        }}>
          <h3>Initializing PixiJS...</h3>
        </div>
      )}
    </div>
  );
}; 