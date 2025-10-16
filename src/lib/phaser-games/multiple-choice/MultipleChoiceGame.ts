import { BaseGame } from '@/lib/phaser-engine/game/BaseGame';
import { PhaserEngineManagers } from '@/lib/phaser-engine/core/PhaserEngine';
import { GameConfig } from '@/lib/phaser-engine/config/GameConfig';
import { MultipleChoiceDataManager } from './managers/MultipleChoiceDataManager';
import { MultipleChoiceUIManager } from './managers/MultipleChoiceUIManager';
import { GameBackgroundManager } from './managers/GameBackgroundManager';
import { MultipleChoiceLayoutManager } from './managers/MultipleChoiceLayoutManager';
import { GAME_EVENTS, TIMER_EVENTS, GAME_STATE_EVENTS, TimerEventPayload, TransitionPowerupSelectedPayload } from '@/lib/phaser-engine/core/EventTypes';
import { TimerType } from '@/lib/phaser-engine/game/TimerManager';
import { QuestionData } from '@/types';

interface MultipleChoiceGameState {
    currentQuestionIndex: number;
    activeTeamIndex: number;
    activeTeam: string | number;
    timerCompleteCount: number;
    hasTriggeredGameOver: boolean;
    phase: 'loading' | 'playing' | 'gameOver';
    scores: Record<string, number>;
    [key: string]: unknown; // Index signature for BaseGameState compatibility
}

interface AnswerOptionUIData {
    id: string;
    text: string;
    isCorrect: boolean;
    length: number;
}

export class MultipleChoiceGame extends BaseGame<MultipleChoiceGameState> {
    private dataManager!: MultipleChoiceDataManager;
    private uiManager!: MultipleChoiceUIManager;
    private backgroundManager!: GameBackgroundManager;
    private layoutManager!: MultipleChoiceLayoutManager;
    private currentAnswerOptions: AnswerOptionUIData[] = [];
    private currentQuestion: QuestionData | null = null;
    private readonly QUESTION_TIMER_ID = 'multipleChoiceQuestionTimer';

    constructor(config: GameConfig, managers: PhaserEngineManagers) {
        super(config, managers);
        console.log("MultipleChoiceGame constructor - Config received:", this.config);
    }

    protected createInitialState(): MultipleChoiceGameState {
        const firstTeamId = this.config.teams.length > 0 ? this.config.teams[0].id : 'unknown';
        return {
            currentQuestionIndex: 0,
            activeTeamIndex: 0,
            activeTeam: firstTeamId,
            timerCompleteCount: 0,
            hasTriggeredGameOver: false,
            phase: 'loading',
            scores: {}
        };
    }

    protected async initImplementation(engineAssetsPromise: Promise<unknown>): Promise<void> {
        console.log('MultipleChoiceGame: Initializing Phaser version...');
        
        // Show loading transition
        await this.showTransition({ 
            type: 'loading', 
            message: 'Getting Ready...', 
            autoHide: true,
            duration: 1000
        });

        // Get screen dimensions from Phaser scene
        const { width, height } = this.scale;

        // Initialize Layout Manager
        this.layoutManager = new MultipleChoiceLayoutManager(width, height);

        // Initialize Data Manager
        if (!this.config.questionHandling) {
            throw new Error("Question handling configuration is missing in GameConfig.");
        }
        if (!this.config.quizId) {
            throw new Error("Quiz ID is missing in GameConfig.");
        }

        this.dataManager = new MultipleChoiceDataManager(
            this.config.quizId,
            this.config.questionHandling
        );

        // Load data
        console.log('MultipleChoiceGame: About to load data...');
        try {
            await this.dataManager.loadData();
            console.log('MultipleChoiceGame: Data loaded successfully');
            
            // Check if we have questions
            if (this.dataManager.getTotalLoadedQuestions() === 0) {
                throw new Error('No questions found in quiz data');
            }
        } catch (error) {
            console.error('MultipleChoiceGame: Failed to load data:', error);
            await this.showTransition({ 
                type: 'custom', 
                message: 'Failed to load quiz data. Please try again.', 
                duration: 3000, 
                autoHide: true 
            });
            throw error;
        }

        // Get the actual scene from the Phaser game
        const scene = this; // This IS the scene
        if (!scene) {
            throw new Error('MainGameScene not found');
        }

        // Initialize Background Manager
        this.backgroundManager = new GameBackgroundManager(
            this,
            this.managers.eventBus
        );

        // Initialize UI Manager
        this.uiManager = new MultipleChoiceUIManager(
            this,
            this.managers.eventBus,
            width,
            height,
            this.layoutManager,
            {
                handleAnswerSelected: this._handleAnswerSelected.bind(this),
                isPowerUpActive: this._isPowerUpActive.bind(this),
                deactivatePowerUpInstance: (instanceId: string) => {
                    this.managers.powerUpManager.deactivatePowerUp(instanceId);
                },
                getPowerUpTargetId: () => this.getState()?.activeTeam,
                updateCurrentAnswerOptions: this.updateCurrentAnswerOptions.bind(this),
                powerUpManager: this.managers.powerUpManager
            }
        );

        // Initialize sequencer
        this.dataManager.initializeSequencer(this.config.teams.length);

        // Hide loading transition
        this.hideTransition();

        // Show turn transition
        const firstTeamName = this.config.teams[0]?.name || 'Team 1';
        await this.showTransition({ 
            type: 'turn', 
            message: `${firstTeamName}'s Turn!`, 
            duration: 2000, 
            autoHide: true 
        });

        // Show first question
        this._showQuestion();

        // Bind events
        this._bindGameEvents();

        this.setState({ phase: 'playing' });
    }

    protected updateImplementation(): void {
        // Update managers
        this.uiManager?.update();
        this.backgroundManager?.update();
        
        // Update power-ups
        this.managers.powerUpManager.update(16); // ~60fps
    }

    protected destroyImplementation(): void {
        this._unbindGameEvents();
        
        // Clean up timers
        if (this.managers.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.managers.timerManager.removeTimer(this.QUESTION_TIMER_ID);
        }

        // Destroy managers
        this.dataManager?.destroy();
        this.uiManager?.destroy();
        this.backgroundManager?.destroy();
    }

    public startImplementation(): void {
        console.log('MultipleChoiceGame: Starting...');
    }

    public endImplementation(): void {
        console.log('MultipleChoiceGame: Ending...');
        this.uiManager?.setAnswerButtonsEnabled(false);
        this.uiManager?.clearQuestionState();
    }

    private _bindGameEvents(): void {
        this.registerEventListener(TIMER_EVENTS.TIMER_COMPLETED, this._handleTimerComplete.bind(this));
        this.registerEventListener(GAME_STATE_EVENTS.GAME_PAUSED, this._handleGamePaused.bind(this));
        this.registerEventListener(GAME_STATE_EVENTS.GAME_RESUMED, this._handleGameResumed.bind(this));
    }

    private _unbindGameEvents(): void {
        // Note: BaseGame doesn't have unregisterEventListener, events are cleaned up automatically
        // when the game is destroyed
    }

    private _showQuestion(): void {
        if (!this.dataManager || !this.uiManager) {
            console.error("Cannot show question: Managers not initialized.");
            this._triggerGameOver();
            return;
        }

        const question = this.dataManager.getNextQuestion();
        if (!question) {
            console.log("DataManager indicates sequence finished.");
            if (!this.getState().hasTriggeredGameOver) {
                console.log("MultipleChoiceGame: No more questions, triggering game over from _showQuestion");
                this._triggerGameOver();
            }
            return;
        }

        // Clear previous state
        this.uiManager.clearQuestionState();
        this.currentAnswerOptions = [];

        // Store current question reference
        this.currentQuestion = question;

        // Update question content
        this.uiManager.updateQuestionContent(question);

        // Create answer options
        const generatedOptions = this._createAnswerOptions(question);
        this.currentAnswerOptions = generatedOptions;

        // Setup answer buttons
        this.uiManager.setupAnswerButtons(question.id, generatedOptions);

        // Start timer
        this._startQuestionTimer();

        // Update state
        this.setState({ 
            currentQuestionIndex: this.dataManager.getCurrentProgressIndex() - 1 
        });

        // Update question counter
        const currentIndex = this.getState().currentQuestionIndex;
        const totalQuestions = this.dataManager.getTotalQuestionsToAsk();
        this.uiManager.updateQuestionCounter(currentIndex, totalQuestions);
    }

    private _createAnswerOptions(question: QuestionData): AnswerOptionUIData[] {
        const answers = (question.answers as string[]) ?? [];
        
        const answerOptions = answers.map((answerText: string, i: number) => {
            const optionId = `${question.id}-opt-${i}`;
            const isCorrect = answerText === question.correctAnswer;
            return { id: optionId, text: answerText, isCorrect, length: answerText.length };
        });
        
        // Shuffle the options
        return this._shuffleArray([...answerOptions]);
    }

    private _shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    public updateCurrentAnswerOptions(options: AnswerOptionUIData[]): void {
        console.log(`Updating current answer options: ${options.length} options`);
        this.currentAnswerOptions = options;
    }

    private _startQuestionTimer(): void {
        let questionDuration = 30000; // 30 seconds per question
        const currentTeamId = this.getState().activeTeam;

        // Check for time extension power-up
        if (currentTeamId) {
            const timeExtensionActive = this._isPowerUpActive('time_extension', currentTeamId);
            if (timeExtensionActive) {
                const definition = this.managers.powerUpManager.getPowerupDefinition('time_extension');
                const extraTimeMs = (definition?.effectParams?.amount as number || 0) * 1000;
                questionDuration += extraTimeMs;
            }
        }

        this.managers.timerManager.createTimer(this.QUESTION_TIMER_ID, questionDuration, TimerType.COUNTDOWN);
        this.managers.timerManager.startTimer(this.QUESTION_TIMER_ID);

        // Update UI
        this.uiManager?.updateTimerDisplay(questionDuration);
    }

    private async _handleAnswerSelected(questionId: string, selectedGeneratedOptionId: string): Promise<void> {
        console.log(`Answer selected: Q:${questionId}, O:${selectedGeneratedOptionId}`);
        
        if (!this.dataManager || !this.uiManager) {
            console.error("Managers not ready.");
            return;
        }
        if (this.getState().hasTriggeredGameOver) return;

        // Disable buttons
        this.uiManager.setAnswerButtonsEnabled(false);

        if (!this.currentQuestion || this.currentQuestion.id !== questionId) {
            console.error(`Current question mismatch: expected ${questionId}, got ${this.currentQuestion?.id || 'null'}`);
            this.uiManager.setAnswerButtonsEnabled(true);
            return;
        }

        const selectedOption = this.currentAnswerOptions.find(o => o.id === selectedGeneratedOptionId);
        if (!selectedOption) {
            console.error(`Could not find selected option ID ${selectedGeneratedOptionId}`);
            this.uiManager.setAnswerButtonsEnabled(true);
            return;
        }

        // Process the answer
        this._processAnswerSelection(this.currentQuestion, selectedOption, this.currentAnswerOptions);

        // Wait for feedback
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (this.getState().hasTriggeredGameOver) return;

        const isSequenceFinished = this.dataManager.isSequenceFinished();

        if (isSequenceFinished) {
            this._triggerGameOver();
        } else {
            // Move to next team
            const currentTeamIndex = this.getState().activeTeamIndex;
            const nextTeamIndex = (currentTeamIndex + 1) % this.config.teams.length;
            const nextTeam = this.config.teams[nextTeamIndex];
            const nextTeamId = nextTeam?.id ?? 'unknown';
            const nextTeamName = nextTeam?.name || `Team ${nextTeamIndex + 1}`;

            // Update state
            this.setState({ 
                activeTeamIndex: nextTeamIndex,
                activeTeam: nextTeamId 
            });

            // Show turn transition
            await this.showTransition({ 
                type: 'turn', 
                message: `${nextTeamName}'s Turn!`,
                duration: 3000,
                autoHide: true,
                triggerPowerupRoll: this.config.powerups.powerupsEnabled && this.dataManager.getCurrentProgressIndex() >= this.config.teams.length
            });

            if (this.getState().hasTriggeredGameOver) return;

            // Show next question
            this._showQuestion();
            this.uiManager.setAnswerButtonsEnabled(true);
        }
    }

    private _processAnswerSelection(
        question: QuestionData,
        selectedOption: AnswerOptionUIData,
        generatedOptions: AnswerOptionUIData[]
    ): void {
        const isCorrect = !!selectedOption.isCorrect;
        const currentTeamId = this.getState().activeTeam;

        // Get remaining time
        let remainingTimeMs = 0;
        if (this.managers.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            remainingTimeMs = this.managers.timerManager.getTimeRemaining(this.QUESTION_TIMER_ID);
        }

        // Check for double points power-up
        let scoreMultiplier = 1;
        const doublePointsActive = currentTeamId && isCorrect ? this._isPowerUpActive('double_points', currentTeamId) : false;
        if (doublePointsActive) {
            scoreMultiplier = 2;
            // Deactivate the power-up
            if (currentTeamId) {
                const activeInstances = this.managers.powerUpManager.getActivePowerupsForTarget(currentTeamId)
                    .filter(p => p.id === 'double_points');
                if (activeInstances.length > 0) {
                    this.managers.powerUpManager.deactivatePowerUp(activeInstances[0].instanceId);
                }
            }
        }

        // Show visual feedback
        this.uiManager?.showAnswerFeedback(generatedOptions, selectedOption.id);

        // Emit event
        this.managers.eventBus.emit(GAME_EVENTS.ANSWER_SELECTED, {
            questionId: question.id,
            selectedOptionId: selectedOption.id,
            isCorrect,
            teamId: currentTeamId,
            remainingTimeMs,
            scoreMultiplier
        });

        // Remove timer
        if (this.managers.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.managers.timerManager.removeTimer(this.QUESTION_TIMER_ID);
        }
    }

    private _triggerGameOver(): void {
        console.log('MultipleChoiceGame: _triggerGameOver called');
        if (this.getState().hasTriggeredGameOver) {
            console.log('MultipleChoiceGame: Game over already triggered, returning');
            return;
        }

        console.log('MultipleChoiceGame: Triggering game over...');
        this.hideTransition();
        this.setState({ 
            hasTriggeredGameOver: true,
            phase: 'gameOver'
        });

        this.uiManager?.setAnswerButtonsEnabled(false);
        
        // Get final scores from ScoringManager
        const finalScores = this.config.teams.map(team => ({
            playerName: team.name || `Team ${team.id}`,
            score: this.managers.scoringManager.getScore(team.id)
        }));
        
        // Determine winner (team with highest score)
        const winner = finalScores.reduce((prev, current) => 
            (prev.score > current.score) ? prev : current
        );
        
        console.log('MultipleChoiceGame: Game over - Final scores:', finalScores, 'Winner:', winner.playerName);
        
        this.managers.eventBus.emit(GAME_STATE_EVENTS.GAME_ENDED, {
            scores: finalScores,
            winner: winner.playerName
        });
        this.end();
        this.uiManager?.clearQuestionState();
        this.currentQuestion = null;
    }

    private async _handleTimerComplete(payload: unknown): Promise<void> {
        if (!payload || typeof payload !== 'object' || !('timerId' in payload)) return;
        const timerPayload = payload as { timerId: string };
        if (timerPayload.timerId !== this.QUESTION_TIMER_ID) return;
        if (this.getState().hasTriggeredGameOver) return;

        this.setState({
            timerCompleteCount: this.getState().timerCompleteCount + 1
        });

        this.uiManager?.setAnswerButtonsEnabled(false);
        this._handleTimeUp();

        await new Promise(resolve => setTimeout(resolve, 1500));

        if (this.getState().hasTriggeredGameOver) return;

        const isSequenceFinished = this.dataManager.isSequenceFinished();
        console.log("MultipleChoiceGame: Timer complete - isSequenceFinished:", isSequenceFinished);

        if (isSequenceFinished) {
            console.log("MultipleChoiceGame: Sequence finished, triggering game over from _handleTimerComplete");
            this._triggerGameOver();
        } else {
            // Move to next team
            const currentTeamIndex = this.getState().activeTeamIndex;
            const nextTeamIndex = (currentTeamIndex + 1) % this.config.teams.length;
            const nextTeam = this.config.teams[nextTeamIndex];
            const nextTeamId = nextTeam?.id ?? 'unknown';
            const nextTeamName = nextTeam?.name || `Team ${nextTeamIndex + 1}`;

            this.setState({ 
                activeTeamIndex: nextTeamIndex,
                activeTeam: nextTeamId 
            });

            await this.showTransition({ 
                type: 'turn', 
                message: `${nextTeamName}'s Turn!`, 
                duration: 3000, 
                autoHide: true,
                triggerPowerupRoll: this.config.powerups.powerupsEnabled && this.dataManager.getCurrentProgressIndex() >= this.config.teams.length
            });

            if (this.getState().hasTriggeredGameOver) return;

            this._showQuestion();
            this.uiManager.setAnswerButtonsEnabled(true);
        }
    }

    private _handleTimeUp(): void {
        if (!this.dataManager || !this.uiManager) return;

        const currentTeamId = this.getState().activeTeam;

        if (this.currentQuestion) {
            this._showTimeUpFeedback(this.currentQuestion);

            // Emit timeout event
            this.managers.eventBus.emit(GAME_EVENTS.ANSWER_SELECTED, {
                questionId: this.currentQuestion.id,
                selectedOptionId: null,
                isCorrect: false,
                teamId: currentTeamId,
                remainingTimeMs: 0
            });
        }
    }

    private _showTimeUpFeedback(question: QuestionData): void {
        if (!this.uiManager) return;
        const generatedOptions = this._createAnswerOptions(question);
        this.uiManager.showAnswerFeedback(generatedOptions, null);
    }

    private _handleGamePaused(): void {
        if (this.managers.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.managers.timerManager.pauseTimer(this.QUESTION_TIMER_ID);
        }
    }

    private _handleGameResumed(): void {
        if (this.managers.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.managers.timerManager.resumeTimer(this.QUESTION_TIMER_ID);
        }
    }

    private _isPowerUpActive(powerUpId: string, targetId: string | number): boolean {
        return this.managers.powerUpManager.isPowerUpActiveForTarget(powerUpId, targetId);
    }
}