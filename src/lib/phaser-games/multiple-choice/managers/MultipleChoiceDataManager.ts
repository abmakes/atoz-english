import { QuestionData } from '@/types';
import { QuestionSequencer } from '@/lib/phaser-engine/game/QuestionSequencer';
import { QuestionHandlingConfig } from '@/lib/phaser-engine/config/GameConfig';

export class MultipleChoiceDataManager {
    private questionsData: QuestionData[] = [];
    private questionSequencer?: QuestionSequencer;
    private preloadedMediaUrls: string[] = [];
    // Store config needed for loading/sequencing
    private quizId: string;
    private questionHandlingConfig: QuestionHandlingConfig;
    constructor(quizId: string, questionHandlingConfig: QuestionHandlingConfig) {
        console.log('[PhaserDataManager] Constructor START');
        console.log('[PhaserDataManager] Received quizId:', quizId);
        console.log('[PhaserDataManager] Received questionHandlingConfig:', questionHandlingConfig);

        if (!quizId) {
            console.error('[PhaserDataManager] Constructor ERROR: Quiz ID is missing!');
            throw new Error("Quiz ID is required for DataManager.");
        }
        if (!questionHandlingConfig) {
            console.error('[PhaserDataManager] Constructor ERROR: Question Handling Config is missing!');
            throw new Error("Question Handling Config is required for DataManager.");
        }
        this.quizId = quizId;
        this.questionHandlingConfig = questionHandlingConfig;
        console.log('[PhaserDataManager] Constructor END');
    }

    /**
     * Loads question data from the API and preloads associated media.
     */
    public async loadData(): Promise<void> {
        try {
            await this._loadQuestionData();
            await this._preloadQuestionMedia(this.questionsData);
            if (this.questionsData.length === 0) {
                 console.warn("PhaserDataManager: No questions were loaded.");
            }
        } catch (error) {
             console.error("PhaserDataManager: Failed to load critical game data.", error);
             throw error; 
        }
    }
    
    /**
     * Initializes the question sequencer after data is loaded.
     * @param numTeams - The number of teams playing.
     */
    public initializeSequencer(numTeams: number): void {
        if (this.questionsData.length === 0) {
            console.error("PhaserDataManager: Cannot initialize sequencer, no questions loaded.");
            return;
        }
        if (numTeams <= 0) {
            console.error("PhaserDataManager: Cannot initialize sequencer, invalid number of teams:", numTeams);
            return;
        }
        
        this.questionSequencer = new QuestionSequencer(
            this.questionsData,
            numTeams,
            this.questionHandlingConfig
        );
        console.log("PhaserDataManager: Question Sequencer initialized.");
    }

    // --- Private loading methods ---
    private async _loadQuestionData(): Promise<void> {

        const maxRetries = 3;
        const retryDelay = 1000; // 1 second
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const apiUrl = `/api/quizzes/${this.quizId}`;
                console.log(`PhaserDataManager: Fetching questions from ${apiUrl} (attempt ${attempt}/${maxRetries})`);
                
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
                       console.error(`PhaserDataManager: Quiz not found (404) for ID: ${this.quizId}`);
                       throw new Error(`Quiz not found for ID: ${this.quizId}`);
                    }
                    
                    // Check if it's a connection pool timeout (500 error)
                    if (response.status === 500 && errorText.includes('connection pool')) {
                        console.warn(`PhaserDataManager: Database connection pool timeout (attempt ${attempt}/${maxRetries})`);
                        if (attempt < maxRetries) {
                            console.log(`PhaserDataManager: Retrying in ${retryDelay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                            continue;
                        }
                    }
                    
                    throw new Error(`API Error fetching quiz: ${response.status} ${response.statusText} - ${errorText}`);
                 }

                 const quizData = await response.json();
                 console.log("PhaserDataManager - quizData:", quizData);
                 const potentialQuestions = quizData?.data?.questions ?? quizData?.questions;

                 if (!potentialQuestions || !Array.isArray(potentialQuestions)) {
                    console.error("PhaserDataManager: Invalid quiz data format received:", quizData);
                    throw new Error("Invalid quiz data format received.");
                 }

                 this.questionsData = potentialQuestions as QuestionData[];
                 console.log(`PhaserDataManager: Loaded ${this.questionsData.length} questions.`);
                 
                 // Success - break out of retry loop
                 return;

             } catch (error) {
                console.error(`PhaserDataManager: Failed during _loadQuestionData (attempt ${attempt}/${maxRetries}):`, error);
                
                // If it's the last attempt or not a retryable error, throw
                if (attempt === maxRetries || !this.isRetryableError(error)) {
                    this.questionsData = []; // Ensure it's empty on error
                    throw error; // Re-throw to be caught by loadData
                }
                
                // Wait before retrying
                console.log(`PhaserDataManager: Retrying in ${retryDelay}ms...`);
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

    private async _preloadQuestionMedia(questions: QuestionData[]): Promise<void> {
        const imageUrls = questions.map(q => q.imageUrl).filter((url): url is string =>
            typeof url === 'string' && url.length > 0);
        const uniqueImageUrls = Array.from(new Set(imageUrls));

        this.preloadedMediaUrls = uniqueImageUrls;

        if (uniqueImageUrls.length === 0) {
             console.log("PhaserDataManager: No unique media URLs to preload.");
             return;
         }
        
        console.log(`PhaserDataManager: Found ${uniqueImageUrls.length} image URLs (preloading deferred to on-demand loading).`);
        // Preloading removed - images will be loaded on-demand when needed
    }
    
    // --- Sequencer Accessors ---
    
    public getNextQuestion(): QuestionData | null {
        if (!this.questionSequencer) {
            console.error("PhaserDataManager: Sequencer not initialized when calling getNextQuestion.");
            return null;
        }
        return this.questionSequencer.getNextQuestion();
    }

    public isSequenceFinished(): boolean {
        return !(this.questionSequencer?.hasMoreQuestions() ?? false); // Default to true if sequencer not init
    }

    public getCurrentProgressIndex(): number {
         return this.questionSequencer?.getCurrentIndex() ?? 0;
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

    public destroy(): void {
        console.log('PhaserDataManager: Destroying...');
        this.questionsData = [];
        this.preloadedMediaUrls = [];
        this.questionSequencer = undefined;
    }

}