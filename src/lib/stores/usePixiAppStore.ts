import { create } from 'zustand';
// Correctly import the Application type from @pixi/react
import * as PIXI from 'pixi.js'; // Still needed if PIXI.Application is used elsewhere or for comparison
import { type Application as PixiReactApplication } from '@pixi/react';

// Store the actual PIXI.js Application instance, not the React component
interface PixiAppState {
  app: PIXI.Application | null;
  setApp: (app: PIXI.Application) => void;
}

export const usePixiAppStore = create<PixiAppState>((set) => ({
  app: null,
  setApp: (appInstance: PIXI.Application) => {
    console.log("[usePixiAppStore] Setting PIXI.js Application instance:", appInstance);
    set({ app: appInstance });
  },
})); 