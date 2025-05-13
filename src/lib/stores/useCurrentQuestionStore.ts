import { create } from 'zustand';
import { QuestionData } from '@/types';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { GAME_EVENTS, AnswerSelectedPayload, QuestionChangedPayload, NewQuestionReadyPayload } from '@/lib/pixi-engine/core/EventTypes';
import { useManagersStore } from './useManagersStore';
import { useGameDisplayStateStore } from './useGameDisplayStateStore';

export interface CurrentQuestionState {
  currentQuestionData: QuestionData | null;
  currentAnswerOptions: Array<{
    id: string;
    text: string;
    isCorrect?: boolean;
    length: number;
  }> | null;
  isAnswerSubmitted: boolean;
  eventBusInstance: EventBus | null;
  
  // Actions
  setEventBus: (eventBus: EventBus) => void;
  fetchAndSetQuestion: () => Promise<boolean>;
  submitAnswer: (optionId: string) => void;
  resetAnswerSubmitted: () => void;
  cleanupListeners: () => void;
  handleQuestionChanged: (payload: QuestionChangedPayload) => void;
  handleNewQuestionReady: (payload: NewQuestionReadyPayload) => void;
}

export const useCurrentQuestionStore = create<CurrentQuestionState>((set, get) => ({
  currentQuestionData: null,
  currentAnswerOptions: null,
  isAnswerSubmitted: false,
  eventBusInstance: null,
  
  setEventBus: (eventBus) => {
    const currentEventBus = get().eventBusInstance;
    if (currentEventBus) {
      currentEventBus.off(GAME_EVENTS.QUESTION_CHANGED, get().handleQuestionChanged);
      currentEventBus.off(GAME_EVENTS.NEW_QUESTION_READY, get().handleNewQuestionReady);
    }
    
    set({ eventBusInstance: eventBus });
    
    eventBus.on(GAME_EVENTS.QUESTION_CHANGED, get().handleQuestionChanged);
    eventBus.on(GAME_EVENTS.NEW_QUESTION_READY, get().handleNewQuestionReady);
  },
  
  fetchAndSetQuestion: async () => {
    try {
      const dataManager = useManagersStore.getState().multipleChoiceDataManager;
      if (!dataManager) {
        console.error("fetchAndSetQuestion: No dataManager available in store");
        return false;
      }
      
      const question = dataManager.getNextQuestion();
      if (!question) {
        console.log("fetchAndSetQuestion: No more questions available");
        return false;
      }
      
      // Create answer options
      const answerOptions = (question.answers as string[]).map((text, i) => {
        const id = `${question.id}-opt-${i}`;
        const isCorrect = text === question.correctAnswer;
        return { id, text, isCorrect, length: text.length };
      });
      
      set({ 
        currentQuestionData: question,
        currentAnswerOptions: answerOptions,
        isAnswerSubmitted: false
      });
      
      // Apply 50/50 power-up if active
      const powerUpManager = useManagersStore.getState().powerUpManager;
      const gameStateManager = useManagersStore.getState().gameStateManager;
      // Cast to string | number to ensure compatibility with the power-up manager
      const currentTeamId = gameStateManager?.getActiveTeamId() || undefined;
      
      if (powerUpManager && currentTeamId && 
          powerUpManager.isPowerUpActiveForTarget('fifty_fifty', currentTeamId)) {
        
        const options = [...answerOptions];
        const correctOption = options.find(opt => opt.isCorrect);
        const incorrectOptions = options.filter(opt => !opt.isCorrect);
        
        if (correctOption && incorrectOptions.length > 1) {
          const incorrectToKeep = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
          const reducedOptions = [correctOption, incorrectToKeep].sort(() => Math.random() - 0.5);
          set({ currentAnswerOptions: reducedOptions });
        }
        
        // Deactivate the power-up after use
        powerUpManager.deactivatePowerUpByTypeAndTarget('fifty_fifty', currentTeamId);
      }
      
      return true;
    } catch (error) {
      console.error("Error in fetchAndSetQuestion:", error);
      return false;
    }
  },
  
  submitAnswer: (optionId) => {
    const { eventBusInstance, currentQuestionData, currentAnswerOptions } = get();
    set({ isAnswerSubmitted: true });
    
    if (eventBusInstance && currentQuestionData) {
      // Find the selected option to determine if it's correct
      const selectedOption = currentAnswerOptions?.find(opt => opt.id === optionId);
      const isCorrect = selectedOption?.isCorrect || false;
      
      // Get the current team ID, handling null case
      const gameStateManager = useManagersStore.getState().gameStateManager;
      const activeTeamId = gameStateManager?.getActiveTeamId();
      // Only use the team ID if it's not null
      const teamId = activeTeamId && typeof activeTeamId !== 'object' ? activeTeamId : undefined;
      
      // Create a properly formatted payload
      const payload: AnswerSelectedPayload = {
        questionId: currentQuestionData.id,
        selectedOptionId: optionId,
        isCorrect: isCorrect,
        teamId,
        remainingTimeMs: 0 // Default value
      };
      
      eventBusInstance.emit(GAME_EVENTS.ANSWER_SELECTED, payload);
    } else {
      console.error("submitAnswer: Missing eventBus or questionData");
    }
  },
  
  resetAnswerSubmitted: () => set({ isAnswerSubmitted: false }),
  
  handleQuestionChanged: (payload: QuestionChangedPayload) => {
    set({ 
      currentQuestionData: payload.question,
      isAnswerSubmitted: false 
    });
    
    // Process answer options if they exist
    if (payload.question && Array.isArray(payload.question.answers)) {
      const answerOptions = (payload.question.answers as string[]).map((text, i) => {
        const id = `${payload.question.id}-opt-${i}`;
        const isCorrect = text === payload.question.correctAnswer;
        return { id, text, isCorrect, length: text.length };
      });
      
      set({ currentAnswerOptions: answerOptions });
    }
  },
  
  handleNewQuestionReady: (payload: NewQuestionReadyPayload) => {
    const { question } = payload;
    if (!question) return;

    const answerOptions = (question.answers as string[] ?? []).map((answerText: string, i: number) => ({
      id: `${question.id}-opt-${i}`,
      text: answerText,
      isCorrect: answerText === question.correctAnswer,
      length: answerText.length // This seems redundant with text, but keeping if used elsewhere
    }));

    // Check for 50/50 power-up (simplified version, assuming PowerUpManager access via useManagersStore)
    // This logic might need refinement based on how power-ups are managed and when they apply
    let finalAnswerOptions = answerOptions;
    const { powerUpManager } = useManagersStore.getState();
    const activeTeamId = useGameDisplayStateStore.getState().activeTeamId; // Need active team to check powerups

    if (activeTeamId && powerUpManager?.isPowerUpActiveForTarget('fifty_fifty', activeTeamId)) {
      const correctAnswer = finalAnswerOptions.find(opt => opt.isCorrect);
      const incorrectOptions = finalAnswerOptions.filter(opt => !opt.isCorrect);
      if (correctAnswer && incorrectOptions.length > 0) {
        const randomIncorrect = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
        finalAnswerOptions = [correctAnswer, randomIncorrect].sort(() => Math.random() - 0.5);
        powerUpManager.deactivatePowerUpByTypeAndTarget('fifty_fifty', activeTeamId);
      }
    }

    set({
      currentQuestionData: question,
      currentAnswerOptions: finalAnswerOptions,
      isAnswerSubmitted: false, // Reset submission state for new question
    });

    // Optionally, emit QUESTION_CHANGED if other parts of the system listen to it for UI updates
    // get().eventBusInstance?.emit(GAME_EVENTS.QUESTION_CHANGED, { question });
  },
  
  cleanupListeners: () => {
    const eventBus = get().eventBusInstance;
    if (eventBus) {
      eventBus.off(GAME_EVENTS.QUESTION_CHANGED, get().handleQuestionChanged);
      eventBus.off(GAME_EVENTS.NEW_QUESTION_READY, get().handleNewQuestionReady);
    }
    set({ eventBusInstance: null });
  }
})); 