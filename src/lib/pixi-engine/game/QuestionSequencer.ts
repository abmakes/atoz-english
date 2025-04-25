import { QuestionData } from '@/types';
import { QuestionHandlingConfig } from '../config/GameConfig';

/**
 * Handles the sequencing and distribution of questions based on configuration.
 * Can shuffle questions and limit the total number asked for fairness.
 */
export class QuestionSequencer {
    private readonly _config: QuestionHandlingConfig;
    private readonly _numTeams: number;
    private _shuffledQuestions: QuestionData[];
    private _totalQuestionsToAsk: number;
    private _currentIndex: number = 0;

    /**
     * Creates an instance of QuestionSequencer.
     * @param questions - The array of original QuestionData objects.
     * @param numTeams - The number of teams participating.
     * @param config - The question handling configuration.
     */
    constructor(
        questions: Readonly<QuestionData[]>,
        numTeams: number,
        config: QuestionHandlingConfig
    ) {
        if (!questions || questions.length === 0) {
            throw new Error("QuestionSequencer requires a non-empty array of questions.");
        }
        if (numTeams <= 0) {
            throw new Error("QuestionSequencer requires at least one team.");
        }

        this._config = config;
        this._numTeams = numTeams;

        // Shuffle if configured, otherwise just copy
        if (this._config.randomizeOrder) {
            this._shuffledQuestions = this._shuffleArray([...questions]); // Shuffle a copy
        } else {
            this._shuffledQuestions = [...questions]; // Copy
        }

        // Calculate the total number of questions to ask
        if (this._config.distributionMode === 'sharedPool') {
            this._totalQuestionsToAsk = this._shuffledQuestions.length;
        } else { // distributionMode === 'perTeam'
            if (this._config.truncateForFairness) {
                this._totalQuestionsToAsk = this._numTeams * Math.floor(this._shuffledQuestions.length / this._numTeams);
            } else {
                this._totalQuestionsToAsk = this._shuffledQuestions.length;
            }
        }

        // Handle edge case where truncation results in zero questions
        if (this._totalQuestionsToAsk < 0) this._totalQuestionsToAsk = 0;

        console.log(`[QuestionSequencer] Initialized. Mode: ${config.distributionMode}, Randomize: ${config.randomizeOrder}, Truncate: ${config.truncateForFairness ?? 'N/A'}. Total questions available: ${questions.length}, Teams: ${numTeams}, Total questions to ask: ${this._totalQuestionsToAsk}`);
    }

    /**
     * Shuffles an array in place using the Fisher-Yates algorithm.
     * @param array - The array to shuffle.
     * @returns The shuffled array.
     */
    private _shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    /**
     * Gets the next question in the sequence.
     * @returns The next QuestionData object, or null if the sequence is finished.
     */
    public getNextQuestion(): QuestionData | null {
        if (this.isFinished()) {
            return null;
        }
        const question = this._shuffledQuestions[this._currentIndex];
        this._currentIndex++;
        return question;
    }
    
    /**
     * Gets the index of the next question to be retrieved.
     * Returns -1 if the sequence is finished.
     * Note: This is the index within the *shuffled* array.
     * @returns The index of the next question or -1 if finished.
     */
    public getNextQuestionIndex(): number {
        return this.isFinished() ? -1 : this._currentIndex;
    }

    /**
     * Checks if the question sequence has completed based on the configuration.
     * @returns True if all configured questions have been presented, false otherwise.
     */
    public isFinished(): boolean {
        return this._currentIndex >= this._totalQuestionsToAsk;
    }

    /**
     * Gets the total number of questions that will be asked in this sequence.
     * @returns The total number of questions.
     */
    public getTotalQuestionsToAsk(): number {
        return this._totalQuestionsToAsk;
    }
    
    /**
     * Gets the current index within the sequence (number of questions already retrieved).
     * @returns The current index.
     */
    public getCurrentProgressIndex(): number {
        return this._currentIndex;
    }
}
