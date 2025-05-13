import { create } from 'zustand';
import { MultipleChoiceDataManager } from '@/lib/pixi-games/multiple-choice/managers/MultipleChoiceDataManager';
import { MultipleChoiceLayoutManager } from '@/lib/pixi-games/multiple-choice/managers/MultipleChoiceLayoutManager';
import type { PowerUpManager } from '@/lib/pixi-engine/game/PowerUpManager';
import type { GameStateManager } from '@/lib/pixi-engine/core/GameStateManager';
import type { TimerManager } from '@/lib/pixi-engine/game/TimerManager';
import type { ScoringManager } from '@/lib/pixi-engine/game/ScoringManager';

export interface ManagersState {
  // Multiple Choice managers
  multipleChoiceDataManager: MultipleChoiceDataManager | null;
  multipleChoiceLayoutManager: MultipleChoiceLayoutManager | null;
  
  // Core engine managers
  powerUpManager: PowerUpManager | null;
  gameStateManager: GameStateManager | null;
  timerManager: TimerManager | null;
  scoringManager: ScoringManager | null;
  
  // Actions
  setMultipleChoiceDataManager: (manager: MultipleChoiceDataManager | null) => void;
  setMultipleChoiceLayoutManager: (manager: MultipleChoiceLayoutManager | null) => void;
  setPowerUpManager: (manager: PowerUpManager | null) => void;
  setGameStateManager: (manager: GameStateManager | null) => void;
  setTimerManager: (manager: TimerManager | null) => void;
  setScoringManager: (manager: ScoringManager | null) => void;
  setAllEngineManagers: (managers: {
    powerUpManager?: PowerUpManager | null;
    gameStateManager?: GameStateManager | null;
    timerManager?: TimerManager | null;
    scoringManager?: ScoringManager | null;
  }) => void;
  resetManagers: () => void;
}

export const useManagersStore = create<ManagersState>((set) => ({
  // Multiple Choice managers
  multipleChoiceDataManager: null,
  multipleChoiceLayoutManager: null,
  
  // Core engine managers
  powerUpManager: null,
  gameStateManager: null,
  timerManager: null,
  scoringManager: null,
  
  // Actions
  setMultipleChoiceDataManager: (manager) => set({ multipleChoiceDataManager: manager }),
  setMultipleChoiceLayoutManager: (manager) => set({ multipleChoiceLayoutManager: manager }),
  setPowerUpManager: (manager) => set({ powerUpManager: manager }),
  setGameStateManager: (manager) => set({ gameStateManager: manager }),
  setTimerManager: (manager) => set({ timerManager: manager }),
  setScoringManager: (manager) => set({ scoringManager: manager }),
  
  setAllEngineManagers: (managers) => set((state) => ({
    powerUpManager: managers.powerUpManager ?? state.powerUpManager,
    gameStateManager: managers.gameStateManager ?? state.gameStateManager,
    timerManager: managers.timerManager ?? state.timerManager,
    scoringManager: managers.scoringManager ?? state.scoringManager
  })),
  
  resetManagers: () => set({
    multipleChoiceDataManager: null,
    multipleChoiceLayoutManager: null,
    powerUpManager: null,
    gameStateManager: null,
    timerManager: null,
    scoringManager: null
  })
})); 