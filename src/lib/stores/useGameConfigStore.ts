import { create } from 'zustand';
import { GameConfig } from '@/lib/pixi-engine/config/GameConfig';

interface GameConfigState {
  config: GameConfig | null;
  setConfig: (config: GameConfig) => void;
}

export const useGameConfigStore = create<GameConfigState>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
})); 