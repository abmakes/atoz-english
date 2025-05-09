import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { GAME_EVENTS } from '@/lib/pixi-engine/core/EventTypes';
import { QuestionHandlingConfig } from '@/lib/pixi-engine/config/GameConfig';
import { QuestionData } from '@/types';
import { QuestionType } from '@/types/question_types';
import { QuestionSequencer } from '@/lib/pixi-engine/game/QuestionSequencer';
import { Assets } from 'pixi.js';

// Define custom events for the MultipleChoiceDataManager
const DATA_MANAGER_EVENTS = {
    QUESTIONS_LOADED: 'dataManager:questionsLoaded',
    QUESTION_SHOWN: 'dataManager:questionShown'
};

/**
 * MultipleChoiceDataManager - Manages loading and sequencing of multiple choice questions
 */
export class MultipleChoiceDataManager {
    private questions: QuestionData[] = [];
    private currentQuestionIndex: number = -1;
    private sequencer: QuestionSequencer | null = null;
    private eventBus: EventBus | null = null;
    
    constructor(
        private readonly quizId: string,
        private readonly questionHandling: QuestionHandlingConfig,
        private readonly assetLoader: typeof AssetLoader,
        eventBus?: EventBus
    ) {
        console.log("DataManager initialized with quizId:", quizId);
        this.eventBus = eventBus || null;
    }
    
    /**
     * Loads question data from the API and preloads associated media assets
     */
    public async loadData(): Promise<void> {
        try {
            console.log("DataManager: Loading data for quiz ID:", "cm2stgdgd0000a2osu3lsvlha - HARDCODED FOR NOW");
            
            // First try to load from real API if in production environment
            try {
                const response = await fetch(`/api/quizzes/cm2stgdgd0000a2osu3lsvlha/questions`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
                        this.questions = data.questions;
                        console.log("DataManager: Loaded questions from API:", this.questions.length);
                    } else {
                        throw new Error("Invalid response format or empty questions array");
                    }
                } else {
                    throw new Error(`API returned status: ${response.status}`);
                }
            } catch (apiError) {
                console.warn("Failed to load from API, using mock data:", apiError);
                // Fall back to mock data
                this.questions = this.getMockQuestions();
                console.log("DataManager: Using mock questions:", this.questions.length);
            }
            
            // Apply question handling options
            if (this.questionHandling.randomizeOrder) {
                this.questions = this.shuffleArray([...this.questions]);
                console.log("DataManager: Randomized question order");
            }
            
            // Shuffle options if configured - the property is randomizeOrder, there is no randomizeOptions
            if (this.questionHandling.randomizeOrder) {
                this.questions = this.questions.map(q => {
                    // Handle different question data formats
                    if (q.answers && Array.isArray(q.answers)) {
                        return {
                            ...q,
                            answers: this.shuffleArray([...q.answers])
                        };
                    }
                    return q;
                });
                console.log("DataManager: Randomized answer options");
            }
            
            // Preload media assets for smoother experience
            await this.preloadQuestionMedia();
            
            // Notify that questions are loaded via event bus if available
            if (this.eventBus) {
                // Use a direct emit (not typechecked to avoid EventBus typing issues)
                const customEvent = {
                    type: 'dataManager:questionsLoaded',
                    payload: {
                        quizId: this.quizId,
                        questionCount: this.questions.length
                    }
                };
                // @ts-ignore - We're deliberately emitting a custom event
                this.eventBus.emit(customEvent.type, customEvent.payload);
            }
            
            console.log("DataManager: Data loaded successfully:", this.questions.length, "questions");
        } catch (error) {
            console.error("DataManager: Error loading data:", error);
            throw new Error(`Failed to load quiz data: ${error}`);
        }
    }
    
    /**
     * Preload all media assets for questions
     */
    private async preloadQuestionMedia(): Promise<void> {
        try {
            // Collect all unique image URLs
            const mediaUrls: string[] = [];
            this.questions.forEach(q => {
                if (q.imageUrl && !mediaUrls.includes(q.imageUrl)) {
                    mediaUrls.push(q.imageUrl);
                }
            });
            
            if (mediaUrls.length === 0) {
                console.log("DataManager: No media assets to preload");
                return;
            }
            
            console.log("DataManager: Preloading media assets:", mediaUrls.length, "files");
            
            // Use both AssetLoader and direct PIXI Assets for better compatibility
            const assetMap: Record<string, string> = {};
            mediaUrls.forEach(url => {
                // Create a unique asset key based on the URL
                const key = `asset-${url.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '') || Math.random().toString(36).substring(2, 10)}`;
                assetMap[key] = url;
            });
            
            // Register with PIXI Assets
            Assets.addBundle('questionMedia', assetMap);
            
            // Load both ways for maximum compatibility
            const [assetLoaderPromise, pixiPromise] = await Promise.allSettled([
                // 1. Load through our AssetLoader
                this.assetLoader.preloadAssets(mediaUrls),
                // 2. Load through PIXI Assets directly
                Assets.loadBundle('questionMedia')
            ]);
            
            // Log results
            if (assetLoaderPromise.status === 'fulfilled') {
                console.log("DataManager: Assets loaded through AssetLoader");
            } else {
                console.warn("DataManager: AssetLoader loading encountered an issue:", assetLoaderPromise.reason);
            }
            
            if (pixiPromise.status === 'fulfilled') {
                console.log("DataManager: Assets loaded through PIXI Assets");
            } else {
                console.warn("DataManager: PIXI Assets loading encountered an issue:", pixiPromise.reason);
            }
            
        } catch (error) {
            console.error("DataManager: Error preloading media:", error);
            // Continue execution even if preloading fails
        }
    }
    
    /**
     * Initializes the question sequencer
     */
    public initializeSequencer(numTeams: number): void {
        this.sequencer = new QuestionSequencer(
            this.questions, 
            numTeams,
            this.questionHandling
        );
        this.currentQuestionIndex = 0;
        console.log("DataManager: Sequencer initialized with", numTeams, "teams");
    }
    
    /**
     * Gets the next question from the sequencer
     */
    public getNextQuestion(): QuestionData | null {
        if (!this.sequencer) {
            console.error("DataManager: Sequencer not initialized before getNextQuestion call");
            return null;
        }
        
        const nextQuestion = this.sequencer.getNextQuestion();
        if (nextQuestion) {
            console.log("DataManager: Retrieved next question:", nextQuestion.id);
            // Emit event if event bus available
            if (this.eventBus) {
                // Use a direct emit (not typechecked to avoid EventBus typing issues)
                const customEvent = {
                    type: 'dataManager:questionShown',
                    payload: {
                        questionId: nextQuestion.id,
                        questionIndex: this.sequencer.getCurrentProgressIndex(),
                        totalQuestions: this.questions.length
                    }
                };
                // @ts-ignore - We're deliberately emitting a custom event
                this.eventBus.emit(customEvent.type, customEvent.payload);
            }
        } else {
            console.log("DataManager: No more questions available");
        }
        
        return nextQuestion;
    }
    
    /**
     * Checks if the question sequence is finished
     */
    public isSequenceFinished(): boolean {
        return this.sequencer ? this.sequencer.isFinished() : true;
    }
    
    /**
     * Gets all questions (for reference)
     */
    public getAllQuestions(): QuestionData[] {
        return [...this.questions];
    }

    /**
     * Gets the total number of questions
     */
    public getQuestionCount(): number {
        return this.questions.length;
    }

    /**
     * Gets a specific question by index
     */
    public getQuestionByIndex(index: number): QuestionData | null {
        if (index >= 0 && index < this.questions.length) {
            return this.questions[index];
        }
        return null;
    }
    
    /**
     * Helper method to shuffle an array
     */
    private shuffleArray<T>(array: T[]): T[] {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    /**
     * Generates mock question data for demonstration
     */
    private getMockQuestions(): QuestionData[] {
        return [
            {
                id: "q1",
                question: "What is the capital of France?",
                answers: ["Paris", "London", "Berlin", "Madrid"],
                correctAnswer: "Paris",
                imageUrl: "/images/gameover/bg1.webp", // Use local image for better caching
                type: QuestionType.MULTIPLE_CHOICE
            },
            {
                id: "q2",
                question: "Which planet is known as the Red Planet?",
                answers: ["Venus", "Mars", "Jupiter", "Saturn"],
                correctAnswer: "Mars",
                imageUrl: "/images/gameover/bg2.webp", // Use local image for better caching
                type: QuestionType.MULTIPLE_CHOICE
            },
            {
                id: "q3",
                question: "What is the largest mammal in the world?",
                answers: ["Elephant", "Giraffe", "Blue Whale", "Polar Bear"],
                correctAnswer: "Blue Whale",
                imageUrl: "/images/gameover/bg2.webp", // Use local image for better caching
                type: QuestionType.MULTIPLE_CHOICE
            },
            {
                id: "q4",
                question: "Who painted the Mona Lisa?",
                answers: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
                correctAnswer: "Leonardo da Vinci",
                imageUrl: "/images/gameover/bg3.webp", // Use local image for better caching
                type: QuestionType.MULTIPLE_CHOICE
            },
            {
                id: "q5",
                question: "What is the chemical symbol for water?",
                answers: ["WA", "H2O", "CO2", "O2"],
                correctAnswer: "H2O",
                imageUrl: "/images/gameover/bg4.webp", // Use local image for better caching
                type: QuestionType.MULTIPLE_CHOICE
            }
        ];
    }
} 