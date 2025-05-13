'use client';

import React, { useEffect } from 'react';
import { useApplication } from '@pixi/react';

/**
 * A utility component that initializes Pixi Devtools when used inside a @pixi/react Application.
 * This component doesn't render anything visible but sets up devtools for the parent Application.
 * Only use this component in development mode to avoid including devtools in production builds.
 */
const PixiDevtoolsInitializer: React.FC = () => {
  const { app } = useApplication();

  useEffect(() => {
    if (app && process.env.NODE_ENV === 'development') {
      try {
        // Use dynamic import to only load devtools in development
        import('@pixi/devtools').then(({ initDevtools }) => {
          console.log('Initializing Pixi Devtools from React component');
          initDevtools({ app });
          console.log('Pixi Devtools initialized successfully');
        }).catch(error => {
          console.error('Failed to load Pixi Devtools:', error);
        });
      } catch (error) {
        console.error('Error initializing Pixi Devtools:', error);
      }
    }
  }, [app]);

  // This component doesn't render anything
  return null;
};

export default PixiDevtoolsInitializer; 