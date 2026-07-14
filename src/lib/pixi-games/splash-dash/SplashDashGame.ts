import { BaseGame, BaseGameState, GameState } from '@/lib/pixi-engine/game/BaseGame';
import { PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine';
import { GameConfig } from '@/lib/pixi-engine/config/GameConfig';
import { GAME_STATE_EVENTS, TIMER_EVENTS, TimerEventPayload, CONTROLS_EVENTS, ControlsPlayerActionPayload, TRANSITION_EVENTS } from '@/lib/pixi-engine/core/EventTypes';
import { TimerType } from '@/lib/pixi-engine/game/TimerManager';
import { GameSetupData as SplashDashGameConfig } from '@/types/gameTypes';
import { QuestionData } from '@/types';
import { SplashDashDataManager } from './managers/SplashDashDataManager';
import { SplashDashUIManager } from './managers/SplashDashUIManager';
import { SplashDashBackgroundManager } from './managers/SplashDashBackgroundManager';
import { SplashDashLayoutManager } from './managers/SplashDashLayoutManager';
import { SplashDashPlayerManager } from './managers/SplashDashPlayerManager';
import { GifAsset } from 'pixi.js/gif';
import { ensureFontIsLoaded } from '@/lib/pixi-engine/utils/ensureFontIsLoaded';
import {
    DEFAULT_SPLASH_POWERUPS,
    getEnabledSplashPickupTypes,
    SplashPowerupId,
    SplashPowerupsConfig,
} from './splashPowerups';

/**
 * Custom game state interface for SplashDashGame.
 * Extends BaseGameState with game-specific properties.
 */
interface SplashDashGameState extends BaseGameState {
    currentQuestionIndex: number;
    activeTeamIndex: number;
    activeTeam: string | number;
    timerCompleteCount: number;
    hasTriggeredGameOver: boolean;
    phase: 'loading' | 'playing' | 'gameOver';
    players: Array<{
        id: string;
        x: number;
        y: number;
        rotation: number;
        score: number;
        isMoving: boolean;
        isAtAnswer: boolean;
        currentAnswerId?: string;
        /** Game-elapsed ms when radioactive buff ends. */
        radioactiveUntilMs?: number;
        /** Game-elapsed ms when immunity buff ends. */
        immunityUntilMs?: number;
    }>;
    currentQuestion: QuestionData | null;
    answerCircles: Array<{
        id: string;
        x: number;
        y: number;
        answer: string;
        isCorrect: boolean;
    }>;
    gamePhase: 'playing' | 'questionComplete' | 'gameOver';
    feedback: {
        show: boolean;
        x: number;
        y: number;
        correct: boolean;
        timer: number;
    };
    firstCorrectAnswerer: string | null; // Track who answered correctly first per question
}

/**
 * SplashDashGame - A two-player competitive quiz game where players control
 * capybara characters swimming to reach correct answer circles.
 */
export class SplashDashGame extends BaseGame<SplashDashGameState> {
    private dataManager!: SplashDashDataManager;
    private uiManager!: SplashDashUIManager;
    private backgroundManager!: SplashDashBackgroundManager;
    private layoutManager!: SplashDashLayoutManager;
    private playerManager!: SplashDashPlayerManager;
    private readonly QUESTION_TIMER_ID = 'splashDashQuestionTimer';
    private readonly MOVEMENT_TIMER_ID = 'splashDashMovementTimer';
    
    private readonly SCORING = {
        FIRST_CORRECT_BONUS: 5,
        INCORRECT_PENALTY: -3,
        TIMEOUT_PENALTY: -1
    };

    /** Sync first-correct tracker — setState alone can race same-frame dual collisions. */
    private firstCorrectTeamId: string | null = null;

    private gameElapsedMs = 0;
    private nextPickupAtMs = 0;
    private pickupSpawnInFlight = false;
    private splashPowerupsConfig: SplashPowerupsConfig = { ...DEFAULT_SPLASH_POWERUPS };
    private readonly RADIOACTIVE_DURATION_MS = 60_000;
    private readonly IMMUNITY_DURATION_MS = 30_000;
    
    constructor(config: GameConfig, managers: PixiEngineManagers) {
        super(config, managers);

        console.log("SplashDashGame constructor - Config received:", this.config);

        if (this.config.splashPowerups) {
            this.splashPowerupsConfig = {
                ...DEFAULT_SPLASH_POWERUPS,
                ...this.config.splashPowerups,
            };
        }
        const intervalMs = this.splashPowerupsConfig.intervalSeconds * 1000;
        this.nextPickupAtMs = intervalMs;

        if (typeof GifAsset !== 'undefined') {
            console.log("GIF Asset handler registered.");
        }
    }

    /**
     * Creates initial game state for SplashDashGame
     * @returns The initial SplashDashGameState
     */
    protected createInitialState(): SplashDashGameState {
        const firstTeamId = this.config.teams.length > 0 ? this.config.teams[0].id : 'unknown';
        
        const { width, height } = this.pixiApp.getScreenSize();
        
        console.log(`[SplashDashGame] createInitialState: Screen size: ${width}x${height}`);
        console.log(`[SplashDashGame] createInitialState: Teams:`, this.config.teams);
        
        return {
            currentQuestionIndex: 0,
            activeTeamIndex: 0, 
            activeTeam: firstTeamId,
            timerCompleteCount: 0,
            hasTriggeredGameOver: false,
            phase: 'loading',
            scores: {},
            players: [
                { 
                    id: String(this.config.teams[0]?.id || 'player1'),
                    x: width * 0.25, 
                    y: height * (2/3), // 1/3 up from bottom
                    rotation: -Math.PI/2, 
                    score: 0, 
                    isMoving: false,
                    isAtAnswer: false
                },
                { 
                    id: String(this.config.teams[1]?.id || 'player2'),
                    x: width * 0.75, 
                    y: height * (2/3), // 1/3 up from bottom
                    rotation: -Math.PI/2, 
                    score: 0, 
                    isMoving: false,
                    isAtAnswer: false
                }
            ],
            currentQuestion: null,
            answerCircles: [],
            gamePhase: 'playing',
            feedback: { show: false, x: 0, y: 0, correct: false, timer: 0 },
            firstCorrectAnswerer: null
        };
    }

    /**
     * Game-specific initialization implementation.
     * Loads questions, preloads media, sets up UI elements, binds events.
     * @param engineAssetsPromise - A promise that resolves when engine-level assets (like bundles) are loaded.
     */
    protected async initImplementation(engineAssetsPromise: Promise<unknown>): Promise<void> {
        try {
            console.log("[SplashDashGame] initImplementation: Starting...");
            
            // Show initial loading transition
            await this.showTransition({ type: 'loading', message: 'Getting Ready...', autoHide: false });

            // Initialize Layout Manager first
            const { width, height } = this.pixiApp.getScreenSize();
            this.layoutManager = new SplashDashLayoutManager(width, height);
            console.log("[SplashDashGame] Layout Manager initialized with screen size:", width, "x", height);

            // Initialize Data Manager
            if (!this.config.questionHandling) {
                throw new Error("Question handling configuration is missing in GameConfig.");
            }
            if (!this.config.quizId) {
                throw new Error("Quiz ID is missing in GameConfig.");
            }

            this.dataManager = new SplashDashDataManager(
                this.config.quizId, 
                this.config.questionHandling,
                this.assetLoader 
            );

            const gameDataPromise = this.dataManager.loadData();

            // Wait for both engine assets AND game data to load concurrently
            await Promise.all([engineAssetsPromise, gameDataPromise]);
            console.log("[SplashDashGame] All assets/data loaded.");

            // Load Grandstander font
            await ensureFontIsLoaded('Grandstander');

            // Hide loading transition
            this.hideTransition();

            // Show get ready transition screen (both teams play simultaneously)
            await this.showTransition({ 
                type: 'loading', 
                message: 'Get Ready!', 
                duration: 2000, 
                autoHide: true 
            });



            // Initialize Background Manager
            this.backgroundManager = new SplashDashBackgroundManager(this.pixiApp.getApp(), this.themeConfig as unknown as Record<string, unknown>, this.eventBus, this.assetLoader, this.layoutManager);
            this.view.addChildAt(this.backgroundManager.getView(), 0);

            // Initialize Player Manager
            this.playerManager = new SplashDashPlayerManager(
                this.pixiApp,
                this.eventBus,
                this.assetLoader,
                this.layoutManager
            );
            this.view.addChild(this.playerManager.getView());

            // Initialize UI Manager
            this.uiManager = new SplashDashUIManager(
                this.pixiApp,
                this.eventBus,
                this.assetLoader,
                this.themeConfig.pixiConfig as unknown as Record<string, unknown>,
                this.layoutManager,
                this.controlsManager
            );
            this.view.addChild(this.uiManager.getView());

            // Initialize players with sprites
            await this.playerManager.initializePlayers(this.getState().players);
            console.log("[SplashDashGame] Players initialized with sprites.");

            this.dataManager.initializeSequencer(this.config.teams.length);

            // Show the first question with transition
            await this._showQuestionWithTransition();

            // Bind game-specific events
            this._bindGameEvents();

            this.setState({ phase: 'playing' }); 
            
            console.log(`${this.constructor.name}: Initialized successfully.`);

        } catch (error) {
            console.error(`Error initializing ${this.constructor.name}:`, error);
            this.hideTransition(); 
            this.setState({ hasTriggeredGameOver: true, phase: 'gameOver' });
            this._unbindGameEvents();
            this.uiManager?.destroy();
            this.backgroundManager?.destroy();
            this.playerManager?.destroy();
            throw error;
        }
    }

    /**
     * Binds event listeners for game events
     */
    private _bindGameEvents(): void {
        console.log("[SplashDashGame] _bindGameEvents: Registering listeners...");
        this.registerEventListener(TIMER_EVENTS.TIMER_COMPLETED, this._handleTimerComplete.bind(this));
        this.registerEventListener(GAME_STATE_EVENTS.GAME_PAUSED, this._handleGamePaused.bind(this));
        this.registerEventListener(GAME_STATE_EVENTS.GAME_RESUMED, this._handleGameResumed.bind(this));
        this.registerEventListener(CONTROLS_EVENTS.PLAYER_ACTION, this._handlePlayerAction.bind(this));
        this.registerEventListener(TRANSITION_EVENTS.GO_SHOWN, this._handleGoShown.bind(this));
        console.log("[SplashDashGame] _bindGameEvents: Listeners registered.");
    }

    /**
     * Unbinds all event listeners
     */
    private _unbindGameEvents(): void {
        this.unregisterEventListener(TIMER_EVENTS.TIMER_COMPLETED, this._handleTimerComplete.bind(this));
        this.unregisterEventListener(GAME_STATE_EVENTS.GAME_PAUSED, this._handleGamePaused.bind(this));
        this.unregisterEventListener(GAME_STATE_EVENTS.GAME_RESUMED, this._handleGameResumed.bind(this));
        this.unregisterEventListener(CONTROLS_EVENTS.PLAYER_ACTION, this._handlePlayerAction.bind(this));
        this.unregisterEventListener(TRANSITION_EVENTS.GO_SHOWN, this._handleGoShown.bind(this));
    }

    /**
     * Start gameplay after initialization
     */
    public start(): void {
        if (this.gameState !== GameState.INITIALIZED) {
            console.warn("Cannot start game that is not initialized");
            return;
        }

        this.gameState = GameState.STARTED;
        // Pickup schedule is wall-clock of the whole match (not per question).
        this.gameElapsedMs = 0;
        this.nextPickupAtMs = this.splashPowerupsConfig.intervalSeconds * 1000;
        this.pickupSpawnInFlight = false;
        console.log(
            `${this.constructor.name}: Game started (splash pickups every ${this.splashPowerupsConfig.intervalSeconds}s)`,
            this.splashPowerupsConfig
        );
        
        // Start the movement timer for continuous updates
        this._startMovementTimer();
    }

    /**
     * Handles when GO! appears in transition screen - starts the question timer
     */
    private _handleGoShown(): void {
        console.log("[SplashDashGame] GO! shown - starting question timer");
        this._startQuestionTimer();
    }

    /**
     * Update game logic each frame
     * @param delta Time elapsed since last frame in milliseconds (from PixiEngine)
     */
    public update(delta: number): void {
        // Engine already updates powerUpManager; delta is milliseconds.
        if (this.gameState === GameState.STARTED) {
            this.gameElapsedMs += delta;
        }

        // Update transition screen
        if (this.transitionScreen) {
            this.transitionScreen.update(delta);
        }

        // Update player positions and animations
        this._updatePlayerMovement(delta);
        this.playerManager?.update(delta, this.getState().players, this.gameElapsedMs);

        // Floating Splash Dash pickups (match-elapsed, not per-question)
        this._updateSplashPowerupSpawns();
        this._checkPowerupCollisions();

        // Check for collisions with answer circles
        this._checkAnswerCollisions();

        // Update UI proximity highlighting
        this.uiManager?.updateAnswerProximity(this.getState().players);

        // Update background effects (water animation)
        this.backgroundManager?.update();
    }

    /**
     * Render game elements
     */
    public render(): void {
        // All rendering is handled by PIXI automatically
        // Custom rendering logic could be added here if needed
    }

    /**
     * Clean up resources during game end
     */
    protected endImplementation(): void {
        console.log(`${this.constructor.name}: End implementation`);
        
        // Remove timers
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.removeTimer(this.QUESTION_TIMER_ID);
        }
        // Movement updates are handled in main update loop, no timer to remove

        // Disable player controls
        this.playerManager?.setControlsEnabled(false);
        
        // Clear UI state
        this.uiManager?.clearQuestionState();
        this.uiManager?.clearPowerupPickup();
    }

    /**
     * Clean up all resources during game destruction
     */
    protected destroyImplementation(): void {
        console.log(`${this.constructor.name}: Destroying...`);
        this._unbindGameEvents();

        // Remove timers
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.removeTimer(this.QUESTION_TIMER_ID);
        }
        // Movement updates are handled in main update loop, no timer to remove

        // Destroy managers
        this.uiManager?.destroy();
        this.backgroundManager?.destroy();
        this.playerManager?.destroy();

        this.view.removeChildren();
        console.log(`${this.constructor.name}: Destroy complete.`);
    }

    /**
     * Shows the next question with transition screen preview
     */
    private async _showQuestionWithTransition(): Promise<void> {
        if (!this.dataManager || !this.uiManager) {
            console.error("Cannot show question: Managers not initialized.");
            this._triggerGameOver();
            return;
        }

        console.log("[SplashDashGame] _showQuestionWithTransition: Getting next question...");
        const question = this.dataManager.getNextQuestion();
        console.log("[SplashDashGame] _showQuestionWithTransition: Question received:", question);
        
        if (!question) {
            console.log("[SplashDashGame] _showQuestionWithTransition: DataManager indicates sequence finished.");
            if (!this.getState().hasTriggeredGameOver) {
                this._triggerGameOver();
            }
            return;
        }

        // Show transition screen with question preview and countdown
        await this.showTransition({
            type: 'question_preview',
            question: question as unknown as { question: string; imageUrl?: string; [key: string]: unknown },
            showCountdown: true,
            autoHide: false
        });

        // After transition completes, show the actual question
        await this._showQuestion(question);
    }

    /**
     * Shows the next question using Data and UI Managers.
     */
    private async _showQuestion(question?: QuestionData): Promise<void> {
        if (!this.dataManager || !this.uiManager) {
            console.error("Cannot show question: Managers not initialized.");
            this._triggerGameOver();
            return;
        }

        // If no question provided, get the next one
        if (!question) {
            console.log("[SplashDashGame] _showQuestion: Getting next question...");
            const nextQuestion = this.dataManager.getNextQuestion();
            console.log("[SplashDashGame] _showQuestion: Question received:", nextQuestion);
            question = nextQuestion || undefined;
        }
        
        if (!question) {
            console.log("[SplashDashGame] _showQuestion: DataManager indicates sequence finished.");
            if (!this.getState().hasTriggeredGameOver) {
                this._triggerGameOver();
            }
            return;
        }
        
        // Clear old state
        this.uiManager.clearQuestionState();
        
        // Reset player positions and states for new question
        const { width, height } = this.pixiApp.getScreenSize();
        const startPositions = [
            { x: width * 0.25, y: height * (2/3) }, // 1/3 up from bottom
            { x: width * 0.75, y: height * (2/3) }  // 1/3 up from bottom
        ];
        
        console.log(`[SplashDashGame] Resetting players to positions:`, startPositions);
        
        const players = [...this.getState().players];
        const resetPlayers = players.map((player, index) => {
            const newPlayer = {
                ...player,
                x: startPositions[index].x,
                y: startPositions[index].y,
                isMoving: false,
                isAtAnswer: false,
                currentAnswerId: undefined
            };
            console.log(`[SplashDashGame] Player ${player.id} reset from (${player.x}, ${player.y}) to (${newPlayer.x}, ${newPlayer.y})`);
            return newPlayer;
        });
        this.setState({ players: resetPlayers });
        
        // Reset the visual positions in the player manager to match the game state
        this.playerManager.resetPlayerPositions();

        // Update question content
        this.uiManager.updateQuestionContent(question);

        // Create answer circles
        const answerCircles = this._createAnswerCircles(question);
        
        // Update state with new question
        this.setState({ 
            currentQuestionIndex: this.dataManager.getCurrentProgressIndex() - 1,
            currentQuestion: question,
            answerCircles: answerCircles,
            firstCorrectAnswerer: null // Reset first correct answerer for new question
        });
        this.firstCorrectTeamId = null;

        // Setup answer rectangles in UI
        await this.uiManager.setupAnswerRectangles(question.id, answerCircles);

        // Update question counter
        const currentIndex = this.getState().currentQuestionIndex;
        const totalQuestions = this.dataManager.getTotalQuestionsToAsk();
        this.uiManager.updateQuestionCounter(currentIndex, totalQuestions);
        
        console.log(`[SplashDashGame] Showing question index ${this.getState().currentQuestionIndex} ...`);
    }

    /**
     * Creates answer circles positioned randomly on screen
     */
    private _createAnswerCircles(question: QuestionData) {
        const { width, height } = this.pixiApp.getScreenSize();
        const answers = question.answers as string[];
        
        return answers.map((answerText: string, i: number) => {
            const isCorrect = answerText === question.correctAnswer;
            return {
                id: `${question.id}-answer-${i}`,
                x: 100 + Math.random() * (width - 200),
                y: 100 + Math.random() * (height - 200),
                text: answerText, // Changed from 'answer' to 'text' to match UI manager
                answer: answerText,
                isCorrect: isCorrect
            };
        });
    }

    /**
     * Starts the question timer
     */
    private _startQuestionTimer(): void {
        const specificConfig = this.config as unknown as SplashDashGameConfig;
        const questionDuration = specificConfig.intensityTimeLimit * 1000;

        this.timerManager.createTimer(this.QUESTION_TIMER_ID, questionDuration, TimerType.COUNTDOWN);
        this.timerManager.startTimer(this.QUESTION_TIMER_ID);

        // Update UI timer display
        this.uiManager?.updateTimerDisplay(questionDuration);

        console.log(`Created and started timer ${this.QUESTION_TIMER_ID} for ${questionDuration}ms`);
    }

    /**
     * Starts the movement timer for continuous game updates
     */
    private _startMovementTimer(): void {
        // For continuous movement updates, we'll use the main update loop instead of a timer
        // This is more efficient for high-frequency updates
        console.log('[SplashDashGame] Movement updates will be handled in main update loop');
    }

    /**
     * Handles when a player reaches an answer circle
     */
    private async _handleAnswerReached(playerId: string, answerCircleId: string): Promise<void> {
        console.log(`[SplashDashGame] _handleAnswerReached: Player ${playerId} reached answer ${answerCircleId}`);
        
        if (this.getState().hasTriggeredGameOver) { return; }

        // Use the current question data from state instead of looking it up by ID
        const currentQuestion = this.getState().currentQuestion;
        if (!currentQuestion) {
            console.error("_handleAnswerReached: Could not find current question data");
            return;
        }

        const answerCircle = this.getState().answerCircles.find(circle => circle.id === answerCircleId);
        if (!answerCircle) {
            console.error("_handleAnswerReached: Could not find answer circle");
            return;
        }

        const isCorrect = answerCircle.isCorrect;
        const currentTeamId = playerId;

        // Mark player as at answer to prevent further movement
        const players = [...this.getState().players];
        const playerIndex = players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            players[playerIndex] = { 
                ...players[playerIndex], 
                isAtAnswer: true, 
                isMoving: false,
                currentAnswerId: answerCircleId
            };
            this.setState({ players });
        }

        // Process the answer
        this._processAnswerSelection(currentQuestion, answerCircle, isCorrect, currentTeamId);

        // Check if all players have answered or if we should wait for more answers
        const allPlayersAnswered = this.getState().players.every(player => player.isAtAnswer);
        
        if (allPlayersAnswered) {
            // All players have answered, remove timer and wait for feedback then move to next question
            if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
                this.timerManager.removeTimer(this.QUESTION_TIMER_ID);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Longer feedback time
            
            if (this.getState().hasTriggeredGameOver) { return; }

            // Check if game is over
            const isSequenceFinished = this.dataManager.isSequenceFinished();
            console.log(`[SplashDashGame] _handleAnswerReached: All players answered. Sequence finished: ${isSequenceFinished}`);

            if (isSequenceFinished) {
                this._triggerGameOver();
            } else {
                // Move to next question with transition
                await this._showQuestionWithTransition();
            }
        } else {
            // Some players haven't answered yet, just show feedback for this player
            console.log(`[SplashDashGame] _handleAnswerReached: Player ${playerId} answered, waiting for other players...`);
        }
    }

    /**
     * Handles player movement input
     */
    private _handlePlayerMovement(playerId: string, isMoving: boolean): void {
        const players = this.getState().players;
        const playerIndex = players.findIndex(p => p.id === playerId);
        
        if (playerIndex !== -1) {
            const updatedPlayers = [...players];
            updatedPlayers[playerIndex].isMoving = isMoving;
            this.setState({ players: updatedPlayers });
        }
    }

    /**
     * Updates player positions in the game state
     */
    private _updatePlayerPositions(players: Array<{id: string, x: number, y: number, rotation: number}>): void {
        const currentPlayers = this.getState().players;
        const updatedPlayers = currentPlayers.map(player => {
            const updatedPlayer = players.find(p => p.id === player.id);
            if (updatedPlayer) {
                return {
                    ...player,
                    x: updatedPlayer.x,
                    y: updatedPlayer.y,
                    rotation: updatedPlayer.rotation
                };
            }
            return player;
        });
        
        this.setState({ players: updatedPlayers });
    }

    /**
     * Process a player's answer selection
     */
    private _processAnswerSelection(
        question: QuestionData,
        answerCircle: { id: string; answer: string; isCorrect: boolean },
        isCorrect: boolean,
        teamId: string
    ): void {
        console.log(`Answer reached: ${answerCircle.id}, Correct: ${isCorrect}, Team: ${teamId}`);

        // Get remaining time
        let remainingTimeMs = 0;
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            remainingTimeMs = this.timerManager.getTimeRemaining(this.QUESTION_TIMER_ID);
        }

        // Calculate score based on new system
        const players = [...this.getState().players];
        const playerIndex = players.findIndex(p => p.id === teamId);
        let pointsEarned = 0;
        let wasFirst = false;

        if (playerIndex !== -1) {
            if (isCorrect) {
                // Sync first-correct check (same-frame safe)
                if (this.firstCorrectTeamId === null) {
                    this.firstCorrectTeamId = teamId;
                    this.setState({ firstCorrectAnswerer: teamId });
                    wasFirst = true;
                }

                // Score: remaining seconds, then +5 first-correct as separate add for clarity
                const remainingSeconds = Math.floor(remainingTimeMs / 1000);
                this.scoringManager.addScore(teamId, remainingSeconds);
                if (wasFirst) {
                    this.scoringManager.addScore(teamId, this.SCORING.FIRST_CORRECT_BONUS);
                }
                pointsEarned = remainingSeconds + (wasFirst ? this.SCORING.FIRST_CORRECT_BONUS : 0);

                // Update local state for consistency
                players[playerIndex] = { ...players[playerIndex], score: this.scoringManager.getScore(teamId) };
                console.log(`[SplashDashGame] Player ${teamId} score increased by ${pointsEarned} (${remainingSeconds}s + ${wasFirst ? this.SCORING.FIRST_CORRECT_BONUS : 0} bonus) to ${players[playerIndex].score}`);
            } else {
                // Incorrect answer - use subtractScore for negative values
                pointsEarned = this.SCORING.INCORRECT_PENALTY;
                this.scoringManager.subtractScore(teamId, Math.abs(pointsEarned));
                
                // Update local state for consistency
                players[playerIndex] = { ...players[playerIndex], score: this.scoringManager.getScore(teamId) };
                console.log(`[SplashDashGame] Player ${teamId} score decreased by ${Math.abs(pointsEarned)} to ${players[playerIndex].score} (incorrect answer)`);
            }
            this.setState({ players });
        }

        // Show visual feedback with point values
        this.uiManager?.showAnswerFeedback(answerCircle.id, isCorrect, pointsEarned, wasFirst);

        // Note: We handle scoring directly through ScoringManager, no need to emit ANSWER_SELECTED event
        // which would trigger RuleEngine scoring logic and cause double-scoring

        // Note: Timer removal moved to _handleAnswerReached after all players check

        console.log(`[SplashDashGame] _processAnswerSelection finished.`);
    }

    /**
     * Handles timer completion
     */
    private async _handleTimerComplete(payload: TimerEventPayload): Promise<void> {
        console.log(`[SplashDashGame] _handleTimerComplete: Timer ${payload.timerId}`);

        if (payload.timerId === this.QUESTION_TIMER_ID) {
            // Question timer expired
            await this._handleTimeUp();
        }
    }

    /**
     * Handles when time runs out
     */
    private async _handleTimeUp(): Promise<void> {
        if (!this.dataManager || !this.uiManager) return;

        const currentQuestion = this.getState().currentQuestion;
        if (!currentQuestion) return;
        
        console.log(`[SplashDashGame] _handleTimeUp: Time up for question ${currentQuestion.id}`);

        // Apply penalty to players who haven't answered yet
        const players = [...this.getState().players];
        let anyPlayerPenalized = false;
        
        players.forEach((player, index) => {
            if (!player.isAtAnswer) {
                // Use ScoringManager to subtract points for timeout
                this.scoringManager.subtractScore(player.id, Math.abs(this.SCORING.TIMEOUT_PENALTY));
                
                players[index] = { 
                    ...player, 
                    score: this.scoringManager.getScore(player.id),
                    isAtAnswer: true // Mark as answered to prevent further movement
                };
                anyPlayerPenalized = true;
                console.log(`[SplashDashGame] Player ${player.id} penalized for timeout: score = ${players[index].score}`);
            }
        });
        
        if (anyPlayerPenalized) {
            this.setState({ players });
        }

        // Show time up feedback
        this.uiManager?.showAnswerFeedback(null, false, this.SCORING.TIMEOUT_PENALTY, false);

        // Wait for feedback delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (this.getState().hasTriggeredGameOver) { return; }

        // Check if game is over
        const isSequenceFinished = this.dataManager.isSequenceFinished();
        console.log(`[SplashDashGame] _handleTimeUp: Sequence finished: ${isSequenceFinished}`);

        if (isSequenceFinished) {
            this._triggerGameOver();
        } else {
            // Move to next question with transition
            await this._showQuestionWithTransition();
        }
    }

    /**
     * Triggers game over
     */
    private _triggerGameOver(): void {
        if (this.getState().hasTriggeredGameOver) {
            console.log("triggerGameOver: Already triggered. Skipping.");
            return;
        }
        
        this.hideTransition();

        this.setState({ 
            hasTriggeredGameOver: true,
            phase: 'gameOver'
        });

        console.log("Triggering Game Over");
        this.playerManager?.setControlsEnabled(false);

        // Emit game ended event
        this.emitEvent(GAME_STATE_EVENTS.GAME_ENDED);
        this.end();
        this.uiManager?.clearQuestionState();
    }

    /**
     * Handles game pause
     */
    private _handleGamePaused(): void {
        console.log("[SplashDashGame] Received GAME_PAUSED. Pausing timers.");
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.pauseTimer(this.QUESTION_TIMER_ID);
        }
        // Movement updates are handled in main update loop, no timer to pause
    }

    /**
     * Handles game resume
     */
    private _handleGameResumed(): void {
        console.log("[SplashDashGame] Received GAME_RESUMED. Resuming timers.");
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.resumeTimer(this.QUESTION_TIMER_ID);
        }
        // Movement updates are handled in main update loop, no timer to resume
    }

    /**
     * Updates player movement and rotation each frame
     */
    private _updatePlayerMovement(delta: number): void {
        const players = [...this.getState().players];
        const { width, height } = this.pixiApp.getScreenSize();
        const ROTATION_SPEED = (Math.PI * 2) / 160; // Full rotation in ~2.67 seconds (50% faster)
        const MOVEMENT_SPEED = width / (7 * 60); // Move across screen in 7 seconds at 60fps
        const PLAYER_SIZE = 30;
        const now = this.gameElapsedMs;

        players.forEach((player, index) => {
            let { x, y, rotation } = player;
            const { isMoving } = player;
            const radioactive =
                typeof player.radioactiveUntilMs === 'number' && now < player.radioactiveUntilMs;
            const rotMul = radioactive ? 1.5 : 1;
            const speedMul = radioactive ? 1.2 : 1;

            if (!isMoving) {
                // Rotate continuously when not moving
                rotation += ROTATION_SPEED * rotMul * (delta / 16.66);
            } else {
                // Move forward when moving
                x += Math.cos(rotation) * MOVEMENT_SPEED * speedMul * (delta / 16.66);
                y += Math.sin(rotation) * MOVEMENT_SPEED * speedMul * (delta / 16.66);

                // Keep player within bounds - prevent going under question area
                const BOTTOM_UI_HEIGHT = 150; // Height of bottom question area
                const minY = PLAYER_SIZE;
                const maxY = height - BOTTOM_UI_HEIGHT - PLAYER_SIZE; // Don't go under question area
                
                x = Math.max(PLAYER_SIZE, Math.min(width - PLAYER_SIZE, x));
                y = Math.max(minY, Math.min(maxY, y));
            }

            // Update player state
            players[index] = { ...player, x, y, rotation };
        });

        // Update the game state with new player positions
        this.setState({ players });
    }

    /**
     * Handles player action events (movement controls)
     */
    private _handlePlayerAction(payload: ControlsPlayerActionPayload): void {
        const players = [...this.getState().players];
        let playerIndex = -1;
        
        console.log(`[SplashDashGame] _handlePlayerAction:`, payload);
        console.log(`[SplashDashGame] _handlePlayerAction: Current players:`, players);

        // Handle splash-dash specific control actions
        console.log(`[SplashDashGame] Expected team IDs:`, this.config.teams.map(t => t.id));
        console.log(`[SplashDashGame] Payload playerId:`, payload.playerId);
        console.log(`[SplashDashGame] Payload action:`, payload.action);
        
        if (payload.action === 'MOVE_PLAYER1') {
            playerIndex = 0;
            console.log(`[SplashDashGame] MOVE_PLAYER1 detected, setting playerIndex to 0`);
        } else if (payload.action === 'MOVE_PLAYER2') {
            playerIndex = 1;
            console.log(`[SplashDashGame] MOVE_PLAYER2 detected, setting playerIndex to 1`);
        }

        if (playerIndex !== -1) {
            const player = players[playerIndex];
            if (!player.isAtAnswer) { // Only allow movement if not already at an answer
                players[playerIndex] = { ...player, isMoving: payload.value as boolean };
                this.setState({ players: players });
            }
        }
    }

    /**
     * Checks for collisions between players and answer rectangles
     */
    private _checkAnswerCollisions(): void {
        const players = this.getState().players;
        const answerRectangles = this.uiManager?.getAnswerRectangles() || [];
        const answerCircles = this.getState().answerCircles;
        const now = this.gameElapsedMs;

        players.forEach(player => {
            if (player.isAtAnswer) return; // Already at an answer

            const immunityActive =
                typeof player.immunityUntilMs === 'number' && now < player.immunityUntilMs;

            answerRectangles.forEach(answerRect => {
                // Check if player is within the rectangle bounds
                const playerRadius = 30; // Player collision radius
                const rectLeft = answerRect.x;
                const rectRight = answerRect.x + answerRect.width;
                const rectTop = answerRect.y;
                const rectBottom = answerRect.y + answerRect.height;

                // Expand rectangle by player radius for collision detection
                const expandedLeft = rectLeft - playerRadius;
                const expandedRight = rectRight + playerRadius;
                const expandedTop = rectTop - playerRadius;
                const expandedBottom = rectBottom + playerRadius;

                // Check if player center is within expanded rectangle
                if (player.x >= expandedLeft && player.x <= expandedRight &&
                    player.y >= expandedTop && player.y <= expandedBottom) {
                    const circle = answerCircles.find(c => c.id === answerRect.id);
                    // Immunity: pass through wrong answers without locking
                    if (immunityActive && circle && !circle.isCorrect) {
                        return;
                    }
                    this._handleAnswerReached(player.id, answerRect.id);
                }
            });
        });
    }

    private _updateSplashPowerupSpawns(): void {
        const types = getEnabledSplashPickupTypes(this.splashPowerupsConfig);
        if (types.length === 0) return;
        if (this.gameState !== GameState.STARTED) return;
        if (!this.uiManager) return;
        if (this.pickupSpawnInFlight) return;
        if (this.uiManager.getPowerupPickup()) return;
        if (this.gameElapsedMs < this.nextPickupAtMs) return;

        const type = types[Math.floor(Math.random() * types.length)] as SplashPowerupId;
        const pickupW = 96;
        const pickupH = 96;
        const position = this._findClearPickupPosition(pickupW, pickupH);
        if (!position) {
            // Crowded board — try again next frame without advancing the schedule
            return;
        }

        this.pickupSpawnInFlight = true;
        this.nextPickupAtMs = this.gameElapsedMs + this.splashPowerupsConfig.intervalSeconds * 1000;
        console.log(
            `[SplashDashGame] Spawning ${type} pickup at (${position.x.toFixed(0)}, ${position.y.toFixed(0)}) ` +
            `t=${(this.gameElapsedMs / 1000).toFixed(1)}s; next at ${(this.nextPickupAtMs / 1000).toFixed(1)}s`
        );

        void this.uiManager
            .spawnPowerupPickup(type, position.x, position.y, pickupW, pickupH)
            .catch((err) => {
                console.error('[SplashDashGame] Failed to spawn power-up pickup:', err);
            })
            .finally(() => {
                this.pickupSpawnInFlight = false;
            });
    }

    /**
     * Finds a spawn point in the playable water that clears answer crates, top-left UI,
     * and player spawn pads. Returns null if no clear spot is found this frame.
     */
    private _findClearPickupPosition(
        pickupW: number,
        pickupH: number
    ): { x: number; y: number } | null {
        const { width, height } = this.pixiApp.getScreenSize();
        const BOTTOM_UI_HEIGHT = 150;
        const margin = 48;
        const clearance = 28; // gap between pickup and answer crate edges
        const playerClearance = 80;
        const spawnPadClearance = 130; // keep off default capybara spawn pads

        // Top-left score / leaf UI reserved zone (matches answer-layout reservation)
        const topLeftUi = {
            x: 0,
            y: 0,
            width: Math.min(320, width * 0.32),
            height: 140,
        };

        const spawnPads = [
            { x: width * 0.25, y: height * (2 / 3) },
            { x: width * 0.75, y: height * (2 / 3) },
        ];

        const areaX = margin;
        // Start below top UI band globally (not only top-left), then also reject top-left AABB
        const areaY = Math.max(margin, topLeftUi.height + 12);
        const areaW = Math.max(0, width - pickupW - margin * 2);
        const areaH = Math.max(0, height - BOTTOM_UI_HEIGHT - pickupH - areaY - margin);
        if (areaW <= 0 || areaH <= 0) return null;

        const answers = this.uiManager?.getAnswerRectangles() ?? [];
        const players = this.getState().players;

        const overlapsRect = (
            x: number,
            y: number,
            rect: { x: number; y: number; width: number; height: number },
            pad: number
        ): boolean => {
            const left = x - pad;
            const right = x + pickupW + pad;
            const top = y - pad;
            const bottom = y + pickupH + pad;
            return (
                left < rect.x + rect.width &&
                right > rect.x &&
                top < rect.y + rect.height &&
                bottom > rect.y
            );
        };

        const overlapsAnswer = (x: number, y: number): boolean =>
            answers.some((ar) => overlapsRect(x, y, ar, clearance));

        const overlapsTopLeftUi = (x: number, y: number): boolean =>
            overlapsRect(x, y, topLeftUi, 8);

        const tooCloseToPoint = (
            x: number,
            y: number,
            px: number,
            py: number,
            radius: number
        ): boolean => {
            const cx = x + pickupW / 2;
            const cy = y + pickupH / 2;
            const dx = px - cx;
            const dy = py - cy;
            return dx * dx + dy * dy < radius * radius;
        };

        const tooCloseToPlayers = (x: number, y: number): boolean =>
            players.some((p) => tooCloseToPoint(x, y, p.x, p.y, playerClearance));

        const tooCloseToSpawnPads = (x: number, y: number): boolean =>
            spawnPads.some((pad) =>
                tooCloseToPoint(x, y, pad.x, pad.y, spawnPadClearance)
            );

        const isBlocked = (x: number, y: number, includePlayers: boolean): boolean => {
            if (overlapsTopLeftUi(x, y)) return true;
            if (overlapsAnswer(x, y)) return true;
            if (tooCloseToSpawnPads(x, y)) return true;
            if (includePlayers && tooCloseToPlayers(x, y)) return true;
            return false;
        };

        // Prefer fully clear spots (answers + UI + spawn pads + live players)
        const maxAttempts = 50;
        for (let i = 0; i < maxAttempts; i++) {
            const x = areaX + Math.random() * areaW;
            const y = areaY + Math.random() * areaH;
            if (!isBlocked(x, y, true)) return { x, y };
        }

        // Fallback: still avoid UI, answers, and spawn pads (players move)
        for (let i = 0; i < 30; i++) {
            const x = areaX + Math.random() * areaW;
            const y = areaY + Math.random() * areaH;
            if (!isBlocked(x, y, false)) return { x, y };
        }

        // Last resort: farthest from answers + spawn pads, still outside top-left UI
        let best: { x: number; y: number; score: number } | null = null;
        for (let i = 0; i < 32; i++) {
            const x = areaX + Math.random() * areaW;
            const y = areaY + Math.random() * areaH;
            if (overlapsTopLeftUi(x, y)) continue;
            const cx = x + pickupW / 2;
            const cy = y + pickupH / 2;
            let minDist = Infinity;
            for (const ar of answers) {
                minDist = Math.min(
                    minDist,
                    Math.hypot(cx - (ar.x + ar.width / 2), cy - (ar.y + ar.height / 2))
                );
            }
            for (const pad of spawnPads) {
                minDist = Math.min(minDist, Math.hypot(cx - pad.x, cy - pad.y));
            }
            if (!best || minDist > best.score) {
                best = { x, y, score: minDist };
            }
        }
        return best ? { x: best.x, y: best.y } : null;
    }

    private _checkPowerupCollisions(): void {
        const pickup = this.uiManager?.getPowerupPickup();
        if (!pickup) return;

        const players = [...this.getState().players];
        const playerRadius = 30;
        let claimed = false;

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.isAtAnswer) continue;

            const cx = pickup.x + pickup.width / 2;
            const cy = pickup.y + pickup.height / 2;
            const dx = player.x - cx;
            const dy = player.y - cy;
            const hitR = playerRadius + Math.min(pickup.width, pickup.height) / 2;
            if (dx * dx + dy * dy > hitR * hitR) continue;

            if (pickup.type === 'radioactive') {
                players[i] = {
                    ...player,
                    radioactiveUntilMs: this.gameElapsedMs + this.RADIOACTIVE_DURATION_MS,
                };
            } else {
                players[i] = {
                    ...player,
                    immunityUntilMs: this.gameElapsedMs + this.IMMUNITY_DURATION_MS,
                };
            }
            claimed = true;
            break;
        }

        if (claimed) {
            this.setState({ players });
            this.uiManager?.clearPowerupPickup();
        }
    }

}
