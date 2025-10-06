import { QuestionData } from '@/types';
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';
import { QuestionHandlingConfig } from '@/lib/pixi-engine/config/GameConfig';
import * as PIXI from 'pixi.js';

/**
 * Data manager for SplashDashGame.
 * Handles question loading, sequencing, and media preloading.
 */
export class SplashDashDataManager {
    private quizId: string;
    private questionHandling: QuestionHandlingConfig;
    private assetLoader: typeof AssetLoader;
    private questions: QuestionData[] = [];
    private currentIndex: number = 0;
    private sequencer: QuestionSequencer | null = null;

    constructor(
        quizId: string,
        questionHandling: QuestionHandlingConfig,
        assetLoader: typeof AssetLoader
    ) {
        this.quizId = quizId;
        this.questionHandling = questionHandling;
        this.assetLoader = assetLoader;
    }

    /**
     * Loads quiz data from the API and preloads associated media
     */
    async loadData(): Promise<void> {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[SplashDashDataManager] Loading data for quiz: ${this.quizId} (attempt ${attempt}/${maxRetries})`);
                
                // Use the same API endpoint as MultipleChoiceGame
                const apiUrl = `/api/quizzes/${this.quizId}`;
                console.log(`[SplashDashDataManager] Fetching questions from ${apiUrl}`);
                
                // Add timeout to prevent hanging requests
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorText = await response.text();
                    if (response.status === 404) {
                       console.error(`[SplashDashDataManager] Quiz not found (404) for ID: ${this.quizId}`);
                       throw new Error(`Quiz not found for ID: ${this.quizId}`);
                    }
                    
                    // Check if it's a connection pool timeout (500 error)
                    if (response.status === 500 && errorText.includes('connection pool')) {
                        console.warn(`[SplashDashDataManager] Database connection pool timeout (attempt ${attempt}/${maxRetries})`);
                        if (attempt < maxRetries) {
                            console.log(`[SplashDashDataManager] Retrying in ${retryDelay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                            continue;
                        }
                    }
                    
                    throw new Error(`API Error fetching quiz: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const quizData = await response.json();
                console.log("[SplashDashDataManager] quizData:", quizData);
                const potentialQuestions = quizData?.data?.questions ?? quizData?.questions;

                if (!potentialQuestions || !Array.isArray(potentialQuestions)) {
                   console.error("[SplashDashDataManager] Invalid quiz data format received:", quizData);
                   throw new Error("Invalid quiz data format received.");
                }

                this.questions = potentialQuestions as QuestionData[];
                console.log(`[SplashDashDataManager] Loaded ${this.questions.length} questions`);
                
                // Preload media assets for all questions
                await this.preloadMediaAssets();
                
                // Success - break out of retry loop
                return;
                
            } catch (error) {
                console.error(`[SplashDashDataManager] Error loading data (attempt ${attempt}/${maxRetries}):`, error);
                
                // If it's the last attempt or not a retryable error, throw
                if (attempt === maxRetries || !this.isRetryableError(error)) {
                    throw error;
                }
                
                // Wait before retrying
                console.log(`[SplashDashDataManager] Retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }
    
    /**
     * Determines if an error is retryable
     */
    private isRetryableError(error: unknown): boolean {
        if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return true; // Timeout
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
            if (error.message.includes('connection pool')) return true; // DB connection issues
            if (error.message.includes('fetch')) return true; // Network issues
        }
        return false;
    }

    /**
     * Preloads media assets for all questions
     */
    private async preloadMediaAssets(): Promise<void> {
        const imageUrls: string[] = [];
        
        for (const question of this.questions) {
            if (question.imageUrl) {
                imageUrls.push(question.imageUrl);
            }
        }
        
        if (imageUrls.length === 0) {
            console.log('[SplashDashDataManager] No media assets to preload');
            return;
        }
        
        try {
            console.log(`[SplashDashDataManager] Preloading ${imageUrls.length} media assets...`);
            // Preload images using PIXI.Assets.load for proper GIF support
            await PIXI.Assets.load(imageUrls);
            console.log('[SplashDashDataManager] All media assets preloaded successfully');
        } catch (error) {
            console.error('[SplashDashDataManager] Error preloading media assets:', error);
            // Don't throw - let the game continue even if some images fail to load
        }
    }

    /**
     * Initializes the question sequencer
     */
    initializeSequencer(numTeams: number): void {
        this.sequencer = new QuestionSequencer(this.questions, numTeams);
        console.log(`[SplashDashDataManager] Sequencer initialized for ${numTeams} teams`);
    }

    /**
     * Gets the next question in sequence
     */
    getNextQuestion(): QuestionData | null {
        if (!this.sequencer) {
            throw new Error('Sequencer not initialized. Call initializeSequencer() first.');
        }
        
        console.log(`[SplashDashDataManager] getNextQuestion: Current index: ${this.currentIndex}, Total questions: ${this.questions.length}`);
        const question = this.sequencer.getNextQuestion();
        console.log(`[SplashDashDataManager] getNextQuestion: Question returned:`, question);
        
        if (question) {
            this.currentIndex++;
        }
        
        return question;
    }

    /**
     * Gets a question by ID
     */
    getQuestionById(questionId: string): QuestionData | null {
        return this.questions.find(q => q.id === questionId) || null;
    }

    /**
     * Gets a question by index
     */
    getQuestionByIndex(index: number): QuestionData | null {
        return this.questions[index] || null;
    }

    /**
     * Gets all questions
     */
    getAllQuestions(): QuestionData[] {
        return [...this.questions];
    }

    /**
     * Gets the current progress index
     */
    getCurrentProgressIndex(): number {
        return this.currentIndex;
    }

    /**
     * Gets the total number of questions to ask
     */
    getTotalQuestionsToAsk(): number {
        return this.sequencer ? this.sequencer.getTotalQuestions() : this.questions.length;
    }

    /**
     * Checks if the sequence is finished
     */
    isSequenceFinished(): boolean {
        return this.sequencer ? this.sequencer.isFinished() : this.currentIndex >= this.questions.length;
    }

    /**
     * Resets the sequencer to the beginning
     */
    reset(): void {
        this.currentIndex = 0;
        if (this.sequencer) {
            this.sequencer.reset();
        }
    }
}

/**
 * Question sequencer for managing question order and progression
 */
class QuestionSequencer {
    private questions: QuestionData[];
    private numTeams: number;
    private currentIndex: number = 0;
    private totalQuestions: number;

    constructor(questions: QuestionData[], numTeams: number) {
        this.questions = [...questions];
        this.numTeams = numTeams;
        this.totalQuestions = questions.length;
    }

    /**
     * Gets the next question in sequence
     */
    getNextQuestion(): QuestionData | null {
        if (this.isFinished()) {
            return null;
        }
        
        const question = this.questions[this.currentIndex];
        this.currentIndex++;
        return question;
    }

    /**
     * Checks if the sequence is finished
     */
    isFinished(): boolean {
        return this.currentIndex >= this.questions.length;
    }

    /**
     * Gets the total number of questions
     */
    getTotalQuestions(): number {
        return this.totalQuestions;
    }

    /**
     * Resets the sequencer to the beginning
     */
    reset(): void {
        this.currentIndex = 0;
    }
}
