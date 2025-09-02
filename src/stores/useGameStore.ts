import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { QuizListItem } from '@/types/gameTypes'; // Import the type

// Define the state structure
interface GameState {
  quizzes: QuizListItem[]; // Add quizzes array
  selectedQuizId: string | null;
  selectedQuizTitle: string | null;
  selectedQuiz: QuizListItem | null; // Add selected quiz object
  // Add other global states later (like userId, isAuthenticated)

  // Actions to modify the state
  setQuizzes: (quizzes: QuizListItem[]) => void; // Add action to set quizzes
  setSelectedQuiz: (id: string | null) => void; // title is no longer needed
  clearSelectedQuiz: () => void;
}

// Create the store hook
export const useGameStore = create<GameState>()(devtools((set, get) => ({
  // Initial state
  quizzes: [],
  selectedQuizId: null,
  selectedQuizTitle: null,
  selectedQuiz: null,

  // Actions implementation
  setQuizzes: (quizzes) => set({ quizzes }),
  setSelectedQuiz: (id) => {
    const quizzes = get().quizzes;
    const selectedQuiz = quizzes.find(quiz => quiz.id === id) || null;
    set({ 
      selectedQuizId: id, 
      selectedQuiz: selectedQuiz,
      selectedQuizTitle: selectedQuiz?.title || null 
    });
  },
  clearSelectedQuiz: () => set({ 
    selectedQuizId: null, 
    selectedQuizTitle: null,
    selectedQuiz: null 
  }),
}), {
    name: 'game-store',
})); 