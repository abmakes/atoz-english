'use client';

import { useState } from 'react';
import { PixiCanvas } from '@/components/PixiCanvas';
import { PixiEngine } from '@/lib/pixi-engine/core/PixiEngine';

export default function PixiDemoPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [fps, setFps] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Handle PixiCanvas initialization
  const handleInit = (engine: PixiEngine) => {
    console.log('PixiEngine initialized from page component');
    setDebugInfo((prev) => [...prev, 'PixiEngine initialized']);

    // Attempt to load the bunny texture
    try {
      console.log('Loading bunny texture from page component');
      setDebugInfo((prev) => [...prev, 'Loading bunny texture']);

      // Log the parent element dimensions for debugging
      const canvas = engine.getApp().getCanvas();
      const parent = canvas.parentElement;
      if (parent) {
        console.log('Parent dimensions:', parent.clientWidth, 'x', parent.clientHeight);
        setDebugInfo((prev) => [...prev, `Parent dimensions: ${parent.clientWidth}x${parent.clientHeight}`]);
      }

      // Get the engine app for convenience
      const app = engine.getApp().getApp();

      // We'll let the PixiEngine create the bunny in debug mode
      console.log('Using debug mode to create bunny');
      setDebugInfo((prev) => [...prev, 'Using debug mode to create bunny']);

      // Setup FPS counter
      let frames = 0;
      const fpsCounter = () => {
        setFps(frames);
        frames = 0;
        setTimeout(fpsCounter, 1000);
      };
      setTimeout(fpsCounter, 1000);

      app.ticker.add(() => {
        frames++;
        // Additional per-frame logic can go here
      });

      setIsLoaded(true);
      setDebugInfo((prev) => [...prev, 'Scene setup complete']);
    } catch (error) {
      console.error('Error in PixiCanvas init:', error);
      setDebugInfo((prev) => [...prev, `Error: ${String(error)}`]);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gray-900 text-white">
      {/* Overlay with title */}
      <div className="absolute z-10 w-full py-4 pointer-events-none">
        <h1 className="text-center text-white text-3xl font-bold drop-shadow-lg">
          PixiJS Demo
        </h1>
      </div>

      {/* Main canvas container */}
      <div className="absolute inset-0">
        <PixiCanvas
          debug={true} // Set to false in production
          onInit={handleInit}
          aspectRatio={16 / 9}
          maintainAspectRatio={true}
          fitHeight={true}
          centerCanvas={true}
          enableFullScreen={false}
          autoResize={true}
          backgroundColor="#333366"
        />
      </div>

      {/* FPS counter and load status */}
      <div className="absolute bottom-0 left-0 p-4 z-10 pointer-events-none">
        <p className="text-white drop-shadow-lg">
          {isLoaded ? `FPS: ${fps} | Status: Loaded` : 'Loading...'}
        </p>
      </div>

      {/* Debug info panel */}
      {debugInfo.length > 0 && (
        <div className="absolute top-16 right-4 p-4 bg-black bg-opacity-50 text-white rounded-md max-w-xs max-h-96 overflow-auto">
          <h3 className="text-lg font-semibold mb-2">Debug Info</h3>
          <ul className="text-xs space-y-1">
            {debugInfo.map((info, index) => (
              <li key={index}>{info}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Add a full-screen loader that shows until isLoaded is true */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading PixiJS...</p>
          </div>
        </div>
      )}
    </div>
  );
} 