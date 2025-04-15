import { create } from 'zustand';

// Define the state structure
interface GameState {
  selectedQuizId: string | null;
  selectedQuizTitle: string | null;
  // Add other global states later (like userId, isAuthenticated)

  // Actions to modify the state
  setSelectedQuiz: (id: string | null, title?: string | null) => void;
  clearSelectedQuiz: () => void;
}

// Create the store hook
export const useGameStore = create<GameState>((set) => ({
  // Initial state
  selectedQuizId: null,
  selectedQuizTitle: null,

  // Actions implementation
  setSelectedQuiz: (id, title = null) => set({ selectedQuizId: id, selectedQuizTitle: title }),
  clearSelectedQuiz: () => set({ selectedQuizId: null, selectedQuizTitle: null }),
})); 