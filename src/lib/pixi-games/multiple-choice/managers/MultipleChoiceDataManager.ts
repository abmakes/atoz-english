import * as PIXI from 'pixi.js'; // Needed for Assets
import { QuestionData } from '@/types';
import { QuestionSequencer } from '@/lib/pixi-engine/game/QuestionSequencer';
import { QuestionHandlingConfig } from '@/lib/pixi-engine/config/GameConfig';
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader'; // Assuming AssetLoader is needed for preload

export class MultipleChoiceDataManager {
    private questionsData: QuestionData[] = [];
    private questionSequencer?: QuestionSequencer;
    private preloadedMediaUrls: string[] = [];
    // Store config needed for loading/sequencing
    private quizId: string;
    private questionHandlingConfig: QuestionHandlingConfig;
    private assetLoader: typeof AssetLoader; // Assuming it's passed if needed

    constructor(quizId: string, questionHandlingConfig: QuestionHandlingConfig, assetLoader: typeof AssetLoader) {
        console.log('[DataManager] Constructor START'); // Log start
        console.log('[DataManager] Received quizId:', quizId);
        console.log('[DataManager] Received questionHandlingConfig:', questionHandlingConfig);
        console.log('[DataManager] Received assetLoader:', assetLoader ? 'Exists' : 'Missing');

        if (!quizId) {
            console.error('[DataManager] Constructor ERROR: Quiz ID is missing!');
            throw new Error("Quiz ID is required for DataManager.");
        }
        if (!questionHandlingConfig) {
            console.error('[DataManager] Constructor ERROR: Question Handling Config is missing!');
            throw new Error("Question Handling Config is required for DataManager.");
        }
        this.quizId = quizId;
        this.questionHandlingConfig = questionHandlingConfig;
        this.assetLoader = assetLoader;
        console.log('[DataManager] Constructor END'); // Log successful completion
    }

    /**
     * Loads question data from the API and preloads associated media.
     */
    public async loadData(): Promise<void> {
        try {
            await this._loadQuestionData();
            await this._preloadQuestionMedia(this.questionsData);
            if (this.questionsData.length === 0) {
                 console.warn("DataManager: No questions were loaded.");
                 // Decide if this should be an error or just a warning
            }
        } catch (error) {
             console.error("DataManager: Failed to load critical game data.", error);
             // Re-throw or handle as needed for the game's initialization flow
             throw error; 
        }
    }
    
    /**
     * Initializes the question sequencer after data is loaded.
     * @param numTeams - The number of teams playing.
     */
    public initializeSequencer(numTeams: number): void {
        if (this.questionsData.length === 0) {
            console.error("DataManager: Cannot initialize sequencer, no questions loaded.");
            return;
            // Consider throwing an error if sequencer is essential
        }
        if (numTeams <= 0) {
            console.error("DataManager: Cannot initialize sequencer, invalid number of teams:", numTeams);
            return;
        }
        
        this.questionSequencer = new QuestionSequencer(
            this.questionsData,
            numTeams,
            this.questionHandlingConfig
        );
        console.log("DataManager: Question Sequencer initialized.");
    }

    // --- Private loading methods moved from MultipleChoiceGame ---
    private async _loadQuestionData(): Promise<void> {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const apiUrl = `/api/quizzes/${this.quizId}`;
                console.log(`DataManager: Fetching questions from ${apiUrl} (attempt ${attempt}/${maxRetries})`);
                
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
                       console.error(`DataManager: Quiz not found (404) for ID: ${this.quizId}`);
                       throw new Error(`Quiz not found for ID: ${this.quizId}`);
                    }
                    
                    // Check if it's a connection pool timeout (500 error)
                    if (response.status === 500 && errorText.includes('connection pool')) {
                        console.warn(`DataManager: Database connection pool timeout (attempt ${attempt}/${maxRetries})`);
                        if (attempt < maxRetries) {
                            console.log(`DataManager: Retrying in ${retryDelay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                            continue;
                        }
                    }
                    
                    throw new Error(`API Error fetching quiz: ${response.status} ${response.statusText} - ${errorText}`);
                 }

                 const quizData = await response.json();
                 console.log("MINIMAL TEST - quizData:", quizData);
                 const potentialQuestions = quizData?.data?.questions ?? quizData?.questions;

                 if (!potentialQuestions || !Array.isArray(potentialQuestions)) {
                    console.error("DataManager: Invalid quiz data format received:", quizData);
                    throw new Error("Invalid quiz data format received.");
                 }

                 this.questionsData = potentialQuestions as QuestionData[];
                 console.log(`DataManager: Loaded ${this.questionsData.length} questions.`);
                 
                 // Success - break out of retry loop
                 return;

             } catch (error) {
                console.error(`DataManager: Failed during _loadQuestionData (attempt ${attempt}/${maxRetries}):`, error);
                
                // If it's the last attempt or not a retryable error, throw
                if (attempt === maxRetries || !this.isRetryableError(error)) {
                    this.questionsData = []; // Ensure it's empty on error
                    throw error; // Re-throw to be caught by loadData
                }
                
                // Wait before retrying
                console.log(`DataManager: Retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }
    
    /**
     * Determines if an error is retryable
     */
    private isRetryableError(error: any): boolean {
        if (error.name === 'AbortError') return true; // Timeout
        if (error.message?.includes('connection pool')) return true; // DB connection issues
        if (error.message?.includes('fetch')) return true; // Network issues
        return false;
    }

    private async _preloadQuestionMedia(questions: QuestionData[]): Promise<void> {
        const imageUrls = questions.map(q => q.imageUrl).filter((url): url is string =>
            typeof url === 'string' && url.length > 0);
        const uniqueImageUrls = Array.from(new Set(imageUrls));

        this.preloadedMediaUrls = uniqueImageUrls;

        if (uniqueImageUrls.length === 0) {
             console.log("DataManager: No unique media URLs to preload.");
             return;
         }
        
        console.log(`DataManager: Preloading ${uniqueImageUrls.length} unique media assets...`);

        try {
             // Use the static AssetLoader passed in constructor if needed, or PIXI.Assets directly
             // Assuming PIXI.Assets is sufficient here
             console.log("DataManager: Starting PIXI.Assets.load for:", uniqueImageUrls);
             
             // Load images individually to handle failures gracefully
             const loadPromises = uniqueImageUrls.map(async (url) => {
                 try {
                     await PIXI.Assets.load(url);
                     console.log(`DataManager: Successfully loaded image: ${url}`);
                 } catch (error) {
                     console.warn(`DataManager: Failed to load image ${url}:`, error);
                     // Don't throw - continue with other images
                 }
             });
             
             await Promise.allSettled(loadPromises);
             console.log("DataManager: Question media preloading completed (some may have failed).");

         } catch (error) {
             console.error("DataManager: Error during PIXI.Assets.load for question media:", error);
             // Attempt to unload failed assets
             uniqueImageUrls.forEach(url => PIXI.Assets.unload(url).catch(unloadErr => console.warn(`DataManager: Failed to unload ${url} after load error`, unloadErr)));
             // Don't throw - allow game to continue even if some images fail to load
         }
    }
    
    // --- Sequencer Accessors ---
    
    public getNextQuestion(): QuestionData | null {
        if (!this.questionSequencer) {
            console.error("DataManager: Sequencer not initialized when calling getNextQuestion.");
            return null;
        }
        return this.questionSequencer.getNextQuestion();
    }

    public isSequenceFinished(): boolean {
        return this.questionSequencer?.isFinished() ?? true; // Default to true if sequencer not init
    }

    public getCurrentProgressIndex(): number {
         return this.questionSequencer?.getCurrentProgressIndex() ?? 0;
    }

    public getTotalQuestionsToAsk(): number {
         return this.questionSequencer?.getTotalQuestionsToAsk() ?? 0;
    }

    // --- Question Data Accessors ---
    
    public getQuestionById(id: string): QuestionData | undefined {
        return this.questionsData.find(q => q.id === id);
    }

    public getAllQuestions(): readonly QuestionData[] {
        // Return a readonly copy to prevent external modification
        return Object.freeze([...this.questionsData]);
    }
    
    public getPreloadedMediaUrls(): readonly string[] {
        return Object.freeze([...this.preloadedMediaUrls]);
    }

    public getTotalLoadedQuestions(): number {
        return this.questionsData.length;
    }
}
