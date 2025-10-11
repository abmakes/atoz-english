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

        console.log(`QuestionSequencer initialized: ${this._shuffledQuestions.length} questions, ${this._numTeams} teams, will ask ${this._totalQuestionsToAsk} questions`);
    }

    /**
     * Gets the next question in the sequence.
     * @returns The next question or null if no more questions.
     */
    public getNextQuestion(): QuestionData | null {
        if (this._currentIndex >= this._totalQuestionsToAsk) {
            return null;
        }

        const question = this._shuffledQuestions[this._currentIndex % this._shuffledQuestions.length];
        this._currentIndex++;
        return question;
    }

    /**
     * Gets the current question index in the sequence.
     */
    public getCurrentIndex(): number {
        return this._currentIndex;
    }

    /**
     * Checks if there are more questions in the sequence.
     */
    public hasMoreQuestions(): boolean {
        return this._currentIndex < this._totalQuestionsToAsk;
    }

    /**
     * Resets the sequence to the beginning.
     */
    public reset(): void {
        this._currentIndex = 0;
    }

    /**
     * Gets the total number of questions that will be asked.
     */
    public getTotalQuestionsToAsk(): number {
        return this._totalQuestionsToAsk;
    }

    /**
     * Gets the total number of questions available.
     */
    public getTotalQuestionsAvailable(): number {
        return this._shuffledQuestions.length;
    }

    /**
     * Shuffles an array using the Fisher-Yates algorithm.
     */
    private _shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
