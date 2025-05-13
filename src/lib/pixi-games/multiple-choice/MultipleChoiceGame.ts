import { BaseGame, BaseGameState, GameState } from '@/lib/pixi-engine/game/BaseGame';
import { PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine';
import { GameConfig } from '@/lib/pixi-engine/config/GameConfig';
import { GAME_STATE_EVENTS, TIMER_EVENTS, TimerEventPayload, GAME_EVENTS, AnswerSelectedPayload, TransitionPowerupSelectedPayload } from '@/lib/pixi-engine/core/EventTypes';
import { TimerType } from '@/lib/pixi-engine/game/TimerManager';
import { GameSetupData as MultipleChoiceGameConfig } from '@/types/gameTypes';
import { QuestionData } from '@/types';
import { GifAsset } from 'pixi.js/gif';
import { MultipleChoiceDataManager } from './managers/MultipleChoiceDataManager';
import { MultipleChoiceUIManager, AnswerOptionUIData } from './managers/MultipleChoiceUIManager';
import { MultipleChoiceLayoutManager } from '@/lib/pixi-games/multiple-choice/managers/MultipleChoiceLayoutManager';
import { useApplication } from '@pixi/react';
import { PixiApplicationAdapter } from './adapters/PixiApplicationAdapter';

async function ensureFontIsLoaded(fontFamily: string, descriptor: string = '28px'): Promise<void> {
    const fontCheckString = `${descriptor} "${fontFamily}"`;
    try {
        if (!document.fonts.check(fontCheckString)) {
            console.log(`Waiting for font: ${fontFamily}...`);
            await document.fonts.load(fontCheckString);
            console.log(`Font ${fontFamily} loaded.`);
        } else {
             console.log(`Font ${fontFamily} was already loaded.`);
        }
    } catch (error) {
        console.error(`Failed to load font "${fontFamily}":`, error);
    }
}

/**
 * Custom game state interface for MultipleChoiceGame.
 * Extends BaseGameState with game-specific properties.
 */
interface MultipleChoiceGameState extends BaseGameState {
    currentQuestionIndex: number;
    activeTeamIndex: number;
    activeTeam: string | number;
    timerCompleteCount: number;
    hasTriggeredGameOver: boolean;
    phase: 'loading' | 'playing' | 'gameOver';
}

/**
 * MultipleChoiceGame - A quiz game that presents multiple choice questions
 * and tracks player/team scores based on correct answers.
 */
export class MultipleChoiceGame extends BaseGame<MultipleChoiceGameState> {
    private dataManager!: MultipleChoiceDataManager;
    private uiManager!: MultipleChoiceUIManager;
    private layoutManager!: MultipleChoiceLayoutManager;
    private readonly QUESTION_TIMER_ID = 'multipleChoiceQuestionTimer';
    
    constructor(
        config: GameConfig, 
        managers: PixiEngineManagers,
        initialDimensions?: { initialWidth: number; initialHeight: number }
    ) {
        super(config, managers, initialDimensions);

        console.log("MultipleChoiceGame constructor - Config received:", this.config);
        if (initialDimensions) {
            console.log(`MultipleChoiceGame constructor - Initial dimensions received: ${initialDimensions.initialWidth}x${initialDimensions.initialHeight}`);
        }

        if (typeof GifAsset !== 'undefined') {
            console.log("GIF Asset handler registered.");
        }
    }

    /**
     * Creates initial game state for MultipleChoiceGame
     * @returns The initial MultipleChoiceGameState
     */
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

    /**
     * Game-specific initialization implementation.
     * Loads questions, preloads media, sets up UI elements, binds events.
     * @param engineAssetsPromise - A promise that resolves when engine-level assets (like bundles) are loaded.
     */
    protected async initImplementation(engineAssetsPromise: Promise<unknown>): Promise<void> {
        try {
            console.log("[MultipleChoiceGame] initImplementation: Starting...");
            
            await this.showTransition({ type: 'loading', message: 'Getting Ready...', autoHide: false });
            console.log("[MultipleChoiceGame] initImplementation: AFTER await showTransition (loading) - Screen is visible.");

            const app = this.getPixiApp(); // Get app instance using the new method
            
            // First try to get dimensions from app.screen
            let width = 0; // Initialize to 0 to trigger fallbacks
            let height = 0;
            
            if (app && app.screen) { 
                // Attempt 1: Use app.screen if available and dimensions are valid
                if (typeof app.screen.width === 'number' && typeof app.screen.height === 'number') {
                    width = app.screen.width;
                    height = app.screen.height;
                    if (width === 0 || height === 0) {
                        console.warn(`[MultipleChoiceGame] PIXI App.screen dimensions are 0x0. Falling back.`);
                        width = 0;
                        height = 0; // Reset to trigger the next fallback
                    } else {
                        console.log(`[MultipleChoiceGame] Using app.screen dimensions: ${width}x${height}`);
                    }
                } else {
                    console.warn(`[MultipleChoiceGame] app.screen exists but width/height are not numbers. Falling back.`);
                }
            } else {
                console.warn(`[MultipleChoiceGame] PIXI App or App.screen not available. Falling back.`);
            }
            
            // Attempt 2: Use initialDimensions if app.screen didn't provide valid dimensions
            if (width === 0 || height === 0) {
                if (this.initialDimensions && this.initialDimensions.initialWidth > 0 && this.initialDimensions.initialHeight > 0) {
                    width = this.initialDimensions.initialWidth;
                    height = this.initialDimensions.initialHeight;
                    console.log(`[MultipleChoiceGame] Using initialDimensions from constructor: ${width}x${height}`);
                } else {
                    // Attempt 3: Fall back to hardcoded logical defaults
                    width = 1280;
                    height = 720;
                    console.warn(`[MultipleChoiceGame] Using hardcoded default logical dimensions: ${width}x${height}`);
                }
            }

            // Use the new logical-resolution-based layout manager
            this.layoutManager = new MultipleChoiceLayoutManager(width, height);
            // After app is available, always update to actual screen size
            this.layoutManager.updateScreenDimensions(width, height);
            console.log("[MultipleChoiceGame] Layout Manager initialized with logical screen size:", width, "x", height);

            // --- Instantiate and Load Data Manager ---
            console.log("[MultipleChoiceGame] Config check before DataManager:", { 
                quizId: this.config?.quizId, 
                questionHandling: this.config?.questionHandling,
                assetLoaderExists: !!this.assetLoader 
            }); // Log values being passed

            if (!this.config.questionHandling) {
                throw new Error("Question handling configuration is missing in GameConfig.");
            }
            if (!this.config.quizId) { // Add explicit check here too
                throw new Error("Quiz ID is missing in GameConfig.");
            }

            console.log("[MultipleChoiceGame] Attempting to instantiate DataManager...");
            this.dataManager = new MultipleChoiceDataManager(
                this.config.quizId, 
                this.config.questionHandling,
                this.assetLoader 
            );
            console.log("[MultipleChoiceGame] DataManager instantiated:", this.dataManager ? 'Success' : 'FAILED'); // Check if assigned

            // Check if it's defined RIGHT BEFORE using it
            if (!this.dataManager) {
                 throw new Error("[MultipleChoiceGame] CRITICAL ERROR: this.dataManager is still undefined after instantiation attempt!");
            }

            console.log("[MultipleChoiceGame] Attempting to call dataManager.loadData()...");
            const gameDataPromise = this.dataManager.loadData(); // Line 96 (approx) - Error source
            // --- End Data Manager Init ---

            // Wait for both engine assets AND game data to load concurrently
            console.log("[MultipleChoiceGame] initImplementation: Awaiting Promise.all for engine assets and game data...");
            await Promise.all([engineAssetsPromise, gameDataPromise]);
            console.log("[MultipleChoiceGame] initImplementation: Promise.all COMPLETED. All assets/data loaded.");

            // Now that loading is done, hide the transition screen
            console.log("[MultipleChoiceGame] initImplementation: Calling hideTransition()...");
            this.hideTransition();
            console.log("[MultipleChoiceGame] initImplementation: AFTER hideTransition(). Screen hidden.");

            // Proceed with UI setup using loaded data
            console.log("[MultipleChoiceGame] initImplementation: Ensuring font loaded...");
            await ensureFontIsLoaded('Grandstander');
            console.log("[MultipleChoiceGame] initImplementation: Setting up UI...");

            // --- Instantiate UI Manager ---
            console.log("[MultipleChoiceGame] Instantiating UIManager...");
            // Define the gameRef object with necessary callbacks/getters
             const gameRefForUIManager = {
                 handleAnswerSelected: this._handleAnswerSelected.bind(this),
                 isPowerUpActive: this.isPowerUpActive.bind(this), // Pass BaseGame method
                 // TODO: Refine how power-up deactivation is handled. Need instance ID.
                 deactivatePowerUpInstance: (instanceId: string) => {
                     console.warn(`[GameRef] Deactivate power-up instance ${instanceId} - Needs implementation in BaseGame/PowerUpManager`);
                     this.powerUpManager.deactivatePowerUp(instanceId); // Assuming BaseGame has powerUpManager
                 },
                 getPowerUpTargetId: () => this.getState()?.activeTeam,
                 powerUpManager: this.powerUpManager
             };
            const currentPixiApp = this.getPixiApp();
            if (!currentPixiApp) {
                throw new Error("[MultipleChoiceGame] Cannot initialize UIManager: PIXI Application not available from store.");
            }

            // Create an adapter that implements the PixiApplication interface
            const pixiAppAdapter = new PixiApplicationAdapter(currentPixiApp);

            this.uiManager = new MultipleChoiceUIManager(
                pixiAppAdapter, // Pass the adapter instead of PixiApplication
                this.eventBus,
                this.assetLoader,
                this.themeConfig.pixiConfig, // Pass the Pixi-specific theme part
                gameRefForUIManager, // Pass the callback reference object
                this.layoutManager // Pass the layout manager instance
            );
            // Add the UI Manager's view ON TOP of the background
            this.view.addChild(this.uiManager.getView());
             // Add the timer container ON TOP
             this.view.addChild(this.uiManager.getTimerContainer());
            console.log("[MultipleChoiceGame] UIManager instantiated and view added.");
            // --- End UI Manager Init ---

            this.dataManager.initializeSequencer(this.config.teams.length);

            // Show the first question using the sequencer
            console.log("[MultipleChoiceGame] initImplementation: Calling _showQuestion() for first question...");
            this._showQuestion();
            console.log("[MultipleChoiceGame] initImplementation: AFTER _showQuestion() for first question.");

            // Bind game-specific events after UI and data are ready
            this._bindGameEvents();

            this.setState({ phase: 'playing' }); 
            
            console.log(`${this.constructor.name}: Initialized successfully.`);

        } catch (error) {
            console.error(`Error initializing ${this.constructor.name}:`, error);
            console.log("[MultipleChoiceGame] initImplementation: Hiding transition in CATCH block...");
            // Ensure transition is hidden even if an error occurs AFTER it was shown
            this.hideTransition(); 
            this.setState({ hasTriggeredGameOver: true, phase: 'gameOver' });
            this._unbindGameEvents();
            // Ensure UIManager is destroyed if init fails after its creation
            this.uiManager?.destroy();
            throw error; // Re-throw error after cleanup attempt
        }
    }

    /**
     * Binds event listeners for game events
     */
    private _bindGameEvents(): void {
        console.log("[MultipleChoiceGame] _bindGameEvents: START Registering listeners...");
        // Explicitly bind 'this' context to the handler functions
        this.registerEventListener(TIMER_EVENTS.TIMER_COMPLETED, this._handleTimerComplete.bind(this));
        // --- Add Pause/Resume Listeners ---
        this.registerEventListener(GAME_STATE_EVENTS.GAME_PAUSED, this._handleGamePaused.bind(this));
        this.registerEventListener(GAME_STATE_EVENTS.GAME_RESUMED, this._handleGameResumed.bind(this));
        // --- End Add Listeners ---
        console.log("[MultipleChoiceGame] _bindGameEvents: END Registering listeners.");
    }

    /**
     * Unbinds all event listeners
     */
    private _unbindGameEvents(): void {
        this.unregisterEventListener(TIMER_EVENTS.TIMER_COMPLETED, this._handleTimerComplete.bind(this));
        // --- Unregister Pause/Resume Listeners ---
        this.unregisterEventListener(GAME_STATE_EVENTS.GAME_PAUSED, this._handleGamePaused.bind(this));
        this.unregisterEventListener(GAME_STATE_EVENTS.GAME_RESUMED, this._handleGameResumed.bind(this));
        // --- End Unregister ---
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
        console.log(`${this.constructor.name}: Game started`);
        
        // Start with the first question (already displayed during init)
        // The timer was already started during init as well
    }

    /**
     * Update game logic each frame
     * @param delta Time elapsed since last frame
     */
    public update(delta: number): void {
        // Current implementation doesn't need per-frame updates
        // But we could add animations or other time-based effects here
        
        // Update power-ups (handles durations)
        const deltaTimeMs = delta * 1000; // Assuming delta is in seconds, convert to ms
        this.powerUpManager.update(deltaTimeMs);
    }

    /**
     * Render game elements
     */
    public render(): void {
        // Currently all rendering is handled by PIXI automatically
        // But custom rendering logic could be added here
    }

    /**
     * Clean up resources during game end
     */
    protected endImplementation(): void {
        console.log(`${this.constructor.name}: End implementation`);
        
        // --- Add Guard for Timer Removal ---
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.removeTimer(this.QUESTION_TIMER_ID);
            console.log(`[MultipleChoiceGame.endImplementation] Timer ${this.QUESTION_TIMER_ID} removed.`);
        } else {
            console.warn(`[MultipleChoiceGame.endImplementation] Timer '${this.QUESTION_TIMER_ID}' not found when attempting removal.`);
        }
        // --- End Guard ---

        // Disable interaction with answer buttons
        this.uiManager?.setAnswerButtonsEnabled(false);
        
        // Any other end-game logic (could show final scores, etc.)
        this.uiManager?.clearQuestionState();
    }

    /**
     * Clean up all resources during game destruction
     */
    protected destroyImplementation(): void {
        console.log(`${this.constructor.name}: Destroying...`);
        this._unbindGameEvents();

        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.removeTimer(this.QUESTION_TIMER_ID);
            console.log(`[MultipleChoiceGame.destroyImplementation] Timer ${this.QUESTION_TIMER_ID} removed.`);
        } else {
            console.log(`[MultipleChoiceGame.destroyImplementation] Timer '${this.QUESTION_TIMER_ID}' not found during destroy (might be expected).`);
        }

        if (this.uiManager) {
            this.uiManager.destroy();
            // @ts-expect-error - Allow setting to null
            this.uiManager = null;
        }

        this.view.removeChildren(); // Clear game's main view
        console.log(`${this.constructor.name}: Destroy complete.`);
    }

    /**
     * Shows the next question using Data and UI Managers.
     */
    private _showQuestion(): void {
        if (!this.dataManager || !this.uiManager) {
            console.error("Cannot show question: Managers not initialized.");
            this._triggerGameOver();
            return;
        }

        const question = this.dataManager.getNextQuestion();
        if (!question) {
            console.log("[MultipleChoiceGame] _showQuestion: DataManager indicates sequence finished.");
            if (!this.getState().hasTriggeredGameOver) {
                this._triggerGameOver();
            }
            return;
        }
        
        // UI Manager handles clearing old state -- THIS WILL BECOME REDUNDANT OR REMOVED
        // this.uiManager.clearQuestionState();

        // UI Manager handles displaying the new question content -- THIS WILL BE REPLACED BY EVENT EMISSION
        // this.uiManager.updateQuestionContent(question);

        // Game logic creates the answer options data structure -- THIS LOGIC MIGHT MOVE TO THE STORE OR BE PASSED IN EVENT
        // const generatedOptions = this._createAnswerOptions(question);

        // UI Manager handles creating and displaying buttons -- THIS WILL BE REPLACED BY REACT COMPONENTS VIA STORE
        // this.uiManager.setupAnswerButtons(question.id, generatedOptions);

        // Emit an event with the new question data
        this.emitEvent(GAME_EVENTS.NEW_QUESTION_READY, { question });

        // Start the timer (Engine Manager)
        this._startQuestionTimer(); // This also updates the UI via UIManager's listener -- TIMER PART ALREADY REFACTORED

        // Update state
        this.setState({ 
            currentQuestionIndex: this.dataManager.getCurrentProgressIndex() - 1 
        });
        console.log(`[MultipleChoiceGame] Showing question index ${this.getState().currentQuestionIndex} ...`);
    }

    private _createAnswerOptions(question: QuestionData): AnswerOptionUIData[] {
        return ((question.answers as string[]) ?? []).map((answerText: string, i: number) => {
            const optionId = `${question.id}-opt-${i}`;
            const isCorrect = answerText === question.correctAnswer;
            return { id: optionId, text: answerText, isCorrect: isCorrect, length: answerText.length };
        });
    }
    
    private _startQuestionTimer(): void {
        const specificConfig = this.config as unknown as MultipleChoiceGameConfig;
        let questionDuration = specificConfig.intensityTimeLimit * 1000;
        const currentTeamId = this.getState().activeTeam;

        if (currentTeamId) {
             const timeExtensionActive = this.isPowerUpActive('time_extension', currentTeamId);
             if (timeExtensionActive) {
                 const definition = this.powerUpManager.getPowerupDefinition('time_extension');
                 const extraTimeMs = (definition?.effectParams?.amount as number || 0) * 1000;
                 questionDuration += extraTimeMs;
             }
        }

        this.timerManager.createTimer(this.QUESTION_TIMER_ID, questionDuration, TimerType.COUNTDOWN);
        this.timerManager.startTimer(this.QUESTION_TIMER_ID);

        console.log(`Created and started timer ${this.QUESTION_TIMER_ID} for ${questionDuration}ms`);
    }

    /**
     * Handles user selection of an answer option. Triggered by UIManager via callback.
     */
    private async _handleAnswerSelected(questionId: string, selectedGeneratedOptionId: string): Promise<void> {
        console.log(`[MultipleChoiceGame] _handleAnswerSelected received: Q:${questionId}, O:${selectedGeneratedOptionId}`);
        if (!this.dataManager || !this.uiManager) {
             console.error("_handleAnswerSelected: Managers not ready.");
             return;
        }
        if (this.getState().hasTriggeredGameOver) { return; }

        // Delegate disabling buttons
        this.uiManager.setAnswerButtonsEnabled(false);

        const question = this.dataManager.getQuestionById(questionId);
        if (!question) {
             console.error(`_handleAnswerSelected: Could not find question data ID ${questionId}`);
             this.uiManager.setAnswerButtonsEnabled(true); // Re-enable if error
             return;
        }

        const generatedOptions = this._createAnswerOptions(question);
        const selectedOption = generatedOptions.find(o => o.id === selectedGeneratedOptionId);
        if (!selectedOption) {
             console.error(`_handleAnswerSelected: Could not find selected option ID ${selectedGeneratedOptionId}`);
             this.uiManager.setAnswerButtonsEnabled(true); // Re-enable if error
             return;
        }

        // Process the answer (emits events, stops timer, updates score via rules)
        this._processAnswerSelection(question, selectedOption, generatedOptions);

        const isSequenceFinished = this.dataManager.isSequenceFinished();

        // --- Transition Logic ---
        await new Promise(resolve => setTimeout(resolve, 1500)); // Feedback delay

        if (this.getState().hasTriggeredGameOver) { return; }

        if (isSequenceFinished) {
            this._triggerGameOver();
        } else {
            // Determine next team 
            const currentTeamIndex = this.getState().activeTeamIndex;
            const nextTeamIndex = (currentTeamIndex + 1) % this.config.teams.length;
            const nextTeam = this.config.teams[nextTeamIndex];
            const nextTeamId = nextTeam?.id ?? 'unknown';
            const nextTeamName = nextTeam?.name || `Team ${nextTeamIndex + 1}`;
            
            console.log(`[MultipleChoiceGame] _handleAnswerSelected: Current team index: ${currentTeamIndex}, Next team index: ${nextTeamIndex}, Next team ID: ${nextTeamId}`);
            
            // State update only needs team change
            const nextState = { 
                activeTeamIndex: nextTeamIndex,
                activeTeam: nextTeamId 
            };

            // *** MOVE STATE UPDATE HERE ***
            this.setState(nextState);
            console.log(`[MultipleChoiceGame] _handleAnswerSelected: State updated BEFORE transition. New active team index: ${this.getState().activeTeamIndex}, New active team ID: ${this.getState().activeTeam}`); 
            
            // --- Calculate if power-up roll should trigger ---
            const progressIndex = this.dataManager.getCurrentProgressIndex();
            const numTeams = this.config.teams.length;
            // Trigger roll only AFTER the first round is fully complete (progress index > num teams)
            const shouldTriggerRoll = progressIndex > numTeams;
            console.log(`[MultipleChoiceGame] _handleAnswerSelected: Checking power-up roll trigger. ProgressIndex: ${progressIndex}, NumTeams: ${numTeams}, ShouldTrigger: ${shouldTriggerRoll}`);
            // --- End calculation ---

            console.log(`[MultipleChoiceGame] _handleAnswerSelected: Calling showTransition (turn) for ${nextTeamName}...`);
            await this.showTransition({ 
                type: 'turn', 
                message: `${nextTeamName}'s Turn!`,
                duration: 3000,
                autoHide: true,
                // Pass the calculated boolean
                triggerPowerupRoll: shouldTriggerRoll 
            });
            console.log("[MultipleChoiceGame] _handleAnswerSelected: AFTER await showTransition (turn).");

            if (this.getState().hasTriggeredGameOver) {
                console.log("[MultipleChoiceGame] _handleAnswerSelected: Game over detected after turn transition. Exiting.");
                return; 
            }
            
            console.log("[MultipleChoiceGame] _handleAnswerSelected: Calling _showQuestion() for next turn...");
            this._showQuestion();
            console.log("[MultipleChoiceGame] _handleAnswerSelected: AFTER _showQuestion() for next turn.");
            this.uiManager.setAnswerButtonsEnabled(true);
        }
    }
    
    /**
     * Process a user's answer selection
     */
    private _processAnswerSelection(
        question: QuestionData,
        selectedOption: AnswerOptionUIData,
        generatedOptions: AnswerOptionUIData[]
    ): void {
        const isCorrect = !!selectedOption.isCorrect;
        const currentTeamId = this.getState().activeTeam;
        console.log(`Answer selected: ${selectedOption.id}, Correct: ${isCorrect}, Team: ${currentTeamId}`);

        // --- Add Guard for Timer Check ---
        let remainingTimeMs = 0; // Default to 0 if timer doesn't exist
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            remainingTimeMs = this.timerManager.getTimeRemaining(this.QUESTION_TIMER_ID);
            console.log(`[MultipleChoiceGame] Remaining time: ${remainingTimeMs}ms`);
        } else {
            console.warn(`[MultipleChoiceGame._processAnswerSelection] Timer '${this.QUESTION_TIMER_ID}' not found when getting remaining time.`);
        }
        // --- End Guard ---
        
        // --- DEBUG: Check active powerups for the current team --- START ---
        if (currentTeamId) {
            const activePUs = this.powerUpManager.getActivePowerupsForTarget(currentTeamId);
            console.log(`[MultipleChoiceGame._processAnswerSelection] Active Powerups for team ${currentTeamId}:`, 
                activePUs.length > 0 ? activePUs.map(p => ({id: p.id, instanceId: p.instanceId, remaining: p.remainingDurationMs})) : 'None'
            );
        }
        // --- DEBUG: Check active powerups for the current team --- END ---
        
        // Check for 'double_points' power-up
        let scoreMultiplier = 1;
        console.log(`[MultipleChoiceGame._processAnswerSelection] Checking double_points for team: ${currentTeamId}`); // DEBUG LOG
        const doublePointsActive = currentTeamId && isCorrect ? this.isPowerUpActive('double_points', currentTeamId) : false; // DEBUG LOG HELPER
        console.log(`[MultipleChoiceGame._processAnswerSelection] isPowerUpActive('double_points') result: ${doublePointsActive}`); // DEBUG LOG
        if (doublePointsActive) {
            scoreMultiplier = 2; // Or read from power-up definition if value is variable
            console.log(`[MultipleChoiceGame] Double Points active! Score multiplier: ${scoreMultiplier}`); // Existing log

            // --- Deactivate Double Points Instance --- START ---
            if (currentTeamId) { 
                const activeInstances = this.powerUpManager.getActivePowerupsForTarget(currentTeamId)
                                           .filter(p => p.id === 'double_points');
                if (activeInstances.length > 0) {
                    const instanceToDeactivate = activeInstances[0]; // Deactivate the first one found
                    console.log(`[MultipleChoiceGame] Deactivating double_points instance ${instanceToDeactivate.instanceId} after applying effect.`);
                    this.powerUpManager.deactivatePowerUp(instanceToDeactivate.instanceId);
                } else {
                     console.warn("[MultipleChoiceGame] Double points was active, but couldn't find instance to deactivate?");
                }
            }
            // --- Deactivate Double Points Instance --- END ---
        }
        
        // Calculate score modification if applicable (e.g., for progressive scoring)
        // This is where the score multiplier would be applied.
        // For now, we just include it in the payload. Rules/ScoringManager should handle it.

        // Show visual feedback using theme
        this.uiManager?.showAnswerFeedback(generatedOptions, selectedOption.id);

        // Emit event with the ID of the team that just answered AND remaining time
        const payload: AnswerSelectedPayload = {
            questionId: question.id,
            selectedOptionId: selectedOption.id,
            isCorrect,
            teamId: currentTeamId,
            remainingTimeMs: remainingTimeMs,
            scoreMultiplier: scoreMultiplier
        };
        console.log(`[MultipleChoiceGame._processAnswerSelection] Emitting ANSWER_SELECTED payload:`, payload);
        this.emitEvent(GAME_EVENTS.ANSWER_SELECTED, payload);

        // --- Add Guard for Timer Removal ---
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.removeTimer(this.QUESTION_TIMER_ID);
            console.log(`[MultipleChoiceGame] Timer ${this.QUESTION_TIMER_ID} removed.`);
        } else {
             console.warn(`[MultipleChoiceGame._processAnswerSelection] Timer '${this.QUESTION_TIMER_ID}' not found when attempting removal.`);
        }
        // --- End Guard ---

        console.log(`[MultipleChoiceGame] _processAnswerSelection finished. Next team calculation deferred to handler.`);
    }

    private _triggerGameOver(): void {
        // Check if already triggered
        if (this.getState().hasTriggeredGameOver) {
             console.log("triggerGameOver: Already triggered. Skipping emission/cleanup.");
             return;
         }
        
        // Hide transition screen if it happens to be visible during game over trigger
        console.log("[MultipleChoiceGame] _triggerGameOver: Calling hideTransition()...");
        this.hideTransition();
        console.log("[MultipleChoiceGame] _triggerGameOver: AFTER hideTransition().");


        // Update state
        this.setState({ 
            hasTriggeredGameOver: true,
            phase: 'gameOver'
        });

        console.log("Triggering Game Over (Emission/Cleanup)");
        this.uiManager?.setAnswerButtonsEnabled(false);

        // Emit game ended event
        this.emitEvent(GAME_STATE_EVENTS.GAME_ENDED);
        console.log(`Emitted ${GAME_STATE_EVENTS.GAME_ENDED} event.`);

        // End the game through BaseGame lifecycle method
        this.end();

        // Clear UI
        this.uiManager?.clearQuestionState();
    }

    private async _handleTimerComplete(payload: TimerEventPayload): Promise<void> {
        console.log(`[MultipleChoiceGame] _handleTimerComplete: Entered function for timer ${payload.timerId}`);

        // Check 1: Is it the correct timer?
        if (payload.timerId !== this.QUESTION_TIMER_ID) {
            console.log(`[MultipleChoiceGame] _handleTimerComplete: Ignoring timer ${payload.timerId}, expected ${this.QUESTION_TIMER_ID}`); // Added log
            return;
        }

        // Check 2: Is game already over?
        if (this.getState().hasTriggeredGameOver) {
            console.log(`[MultipleChoiceGame] _handleTimerComplete: Game already over. Exiting.`); // Added log
            return;
        }

        // Check 3: Update timer count state
        try {
            console.log(`[MultipleChoiceGame] _handleTimerComplete: Updating timerCompleteCount...`); // Added log
            this.setState({
                timerCompleteCount: this.getState().timerCompleteCount + 1
            });
            console.log(`[MultipleChoiceGame] _handleTimerComplete: timerCompleteCount updated.`); // Added log
        } catch (error) {
            console.error(`[MultipleChoiceGame] _handleTimerComplete: Error setting timerCompleteCount state:`, error); // Added log
            return; // Stop if state update fails
        }

        // Log that we passed the state update
        console.log(`[MultipleChoiceGame] _handleTimerComplete: Passed state update.`); // Added log

        // Check 4: Disable buttons and handle time up visuals/event
        try {
            console.log(`[MultipleChoiceGame] _handleTimerComplete: Calling _setAnswerButtonsEnabled(false)...`); // Added log
            this.uiManager?.setAnswerButtonsEnabled(false);
            console.log(`[MultipleChoiceGame] _handleTimerComplete: Calling _handleTimeUp...`); // Added log
            this._handleTimeUp(); // This now includes logging inside it
            console.log(`[MultipleChoiceGame] _handleTimerComplete: Returned from _handleTimeUp.`); // Added log
        } catch (error) {
            console.error(`[MultipleChoiceGame] _handleTimerComplete: Error during button disable or _handleTimeUp:`, error); // Added log
            return; // Stop if this section fails
        }

        // Determine if the sequence is finished using the sequencer
        // We check *before* getting the next question in this case
        const isSequenceFinished = this.dataManager.isSequenceFinished(); 
        console.log(`[MultipleChoiceGame] _handleTimerComplete: Is sequence finished? ${isSequenceFinished}`);

        // --- Transition Logic --- 
        console.log("[MultipleChoiceGame] _handleTimerComplete: Waiting 1.5s for feedback..."); 
        await new Promise(resolve => setTimeout(resolve, 1500)); // Feedback delay
        console.log("[MultipleChoiceGame] _handleTimerComplete: Finished feedback delay.");

        if (this.getState().hasTriggeredGameOver) { 
            console.log("[MultipleChoiceGame] _handleTimerComplete: Game over detected after feedback delay. Exiting.");
            return; 
        } 
        
        // <<< MODIFIED: Use sequencer finish state >>>
        if (isSequenceFinished) {
            console.log("[MultipleChoiceGame] _handleTimerComplete: Sequencer finished after timeout. Triggering game over."); 
            this._triggerGameOver();
        } else {
             console.log("[MultipleChoiceGame] _handleTimerComplete: Not last question. Calculating next turn..."); 
             const currentTeamIndex = this.getState().activeTeamIndex; 
             const nextTeamIndex = (currentTeamIndex + 1) % this.config.teams.length;
             const nextTeam = this.config.teams[nextTeamIndex];
             const nextTeamId = nextTeam?.id ?? 'unknown';
             const nextTeamName = nextTeam?.name || `Team ${nextTeamIndex + 1}`;
             
             console.log(`[MultipleChoiceGame] _handleTimerComplete: Current team index: ${currentTeamIndex}, Next team index: ${nextTeamIndex}, Next team ID: ${nextTeamId}`);
             
             // State update only needs team change
             const nextState = { 
                 activeTeamIndex: nextTeamIndex,
                 activeTeam: nextTeamId 
             };
             
             // *** MOVE STATE UPDATE HERE ***
             this.setState(nextState); 
             console.log(`[MultipleChoiceGame] _handleTimerComplete: State updated BEFORE transition. New active team index: ${this.getState().activeTeamIndex}, New active team ID: ${this.getState().activeTeam}`); 

             // --- Calculate if power-up roll should trigger ---
             const progressIndex = this.dataManager.getCurrentProgressIndex();
             const numTeams = this.config.teams.length;
             // Trigger roll only AFTER the first round is fully complete (progress index > num teams)
             const shouldTriggerRoll = progressIndex > numTeams;
             console.log(`[MultipleChoiceGame] _handleTimerComplete: Checking power-up roll trigger. ProgressIndex: ${progressIndex}, NumTeams: ${numTeams}, ShouldTrigger: ${shouldTriggerRoll}`);
             // --- End calculation ---

             console.log(`[MultipleChoiceGame] _handleTimerComplete: Calling showTransition (turn) for ${nextTeamName}...`);
             await this.showTransition({ 
                 type: 'turn', 
                 message: `${nextTeamName}'s Turn!`, 
                 duration: 3000, 
                 autoHide: true,
                 // Pass the calculated boolean
                 triggerPowerupRoll: shouldTriggerRoll
             });
             console.log("[MultipleChoiceGame] _handleTimerComplete: AFTER await showTransition (turn)."); 

             if (this.getState().hasTriggeredGameOver) {
                  console.log("[MultipleChoiceGame] _handleTimerComplete: Game over detected after turn transition. Exiting.");
                  return;
             }

             console.log("[MultipleChoiceGame] _handleTimerComplete: Calling _showQuestion() for next turn..."); 
             this._showQuestion();
             console.log("[MultipleChoiceGame] _handleTimerComplete: AFTER _showQuestion() for next turn."); 

             this.uiManager.setAnswerButtonsEnabled(true);
             console.log("[MultipleChoiceGame] _handleTimerComplete: End of method."); 
        }
    }
    
    private _handleTimeUp(): void {
        if (!this.dataManager || !this.uiManager) return;
        // Get current question based on state index
        const currentQuestionIndex = this.getState().currentQuestionIndex;
        const allQuestions = this.dataManager.getAllQuestions();
        const question = currentQuestionIndex >= 0 && currentQuestionIndex < allQuestions.length
                          ? allQuestions[currentQuestionIndex]
                          : undefined; // Find question safely

        const currentTeamId = this.getState().activeTeam;
        
        console.log(`[MultipleChoiceGame] _handleTimeUp: Started for Team ID: ${currentTeamId} on Question ID: ${question?.id}`);
        
        if (question) {
            console.log(`[MultipleChoiceGame] _handleTimeUp: Calling _showTimeUpFeedback...`);
            this._showTimeUpFeedback(question); // Show visual feedback first
            console.log(`[MultipleChoiceGame] _handleTimeUp: AFTER _showTimeUpFeedback.`);
            
            // Emit ANSWER_SELECTED event for timeout (incorrect answer)
            const payload: AnswerSelectedPayload = {
                questionId: question.id,
                selectedOptionId: null, // Indicate no option was selected
                isCorrect: false,
                teamId: currentTeamId,
                remainingTimeMs: 0 // Explicitly set 0 time for timeout
            };
            console.log(`[MultipleChoiceGame] _handleTimeUp: Emitting ANSWER_SELECTED event...`);
            this.emitEvent(GAME_EVENTS.ANSWER_SELECTED, payload);
            console.log(`[MultipleChoiceGame] _handleTimeUp: AFTER emitting ANSWER_SELECTED event.`);

            } else {
            console.warn(`[MultipleChoiceGame] _handleTimeUp: Timer complete for question index ${this.getState().currentQuestionIndex}, but question data not found.`);
            }
        
        console.log(`[MultipleChoiceGame] _handleTimeUp: Finished.`);
    }

    private _showTimeUpFeedback(question: QuestionData): void {
        if (!this.uiManager) return;
        const generatedOptions = this._createAnswerOptions(question);
        this.uiManager.showAnswerFeedback(generatedOptions, null);
    }

    /**
     * Overrides BaseGame method to handle the power-up selected during transition.
     * Activates the selected power-up for the team whose turn is about to begin.
     */
    protected override _handlePowerupSelected(payload: TransitionPowerupSelectedPayload): void {
        super._handlePowerupSelected(payload); // Call base class log if needed

        // Determine the target team: It should be the team stored in the current game state,
        // as the state is updated *before* _showQuestion and the transition happens.
        const targetTeamId = this.getState().activeTeam;
        console.log(`[MultipleChoiceGame._handlePowerupSelected] Received selected power-up: ${payload.selectedPowerupId}. Target team determined as: ${targetTeamId}`); // DEBUG LOG

        if (targetTeamId !== undefined) {
            console.log(`[MultipleChoiceGame] Attempting to activate randomly selected power-up '${payload.selectedPowerupId}' for team ${targetTeamId}`); // DEBUG LOG
            // Activate the power-up using the PowerUpManager
            // Optional: Add logic here to check if the team can receive this power-up
            // (e.g., maybe they can only have one active at a time)
            
            // Special handling for 50/50: Don't deactivate here, it deactivates upon use in _setupAnswerButtons
            if (payload.selectedPowerupId !== 'fifty_fifty') {
                const activationResult = this.activatePowerUp(payload.selectedPowerupId, targetTeamId); // Store result
                console.log(`[MultipleChoiceGame] Power-up activation result:`, activationResult ? `Instance ID ${activationResult.instanceId}` : activationResult); // DEBUG LOG
            } else {
                // For 50/50, just activate it. It will be used and deactivated when the next question buttons are set up.
                 const activationResult = this.activatePowerUp(payload.selectedPowerupId, targetTeamId); // Store result
                 console.log(`[MultipleChoiceGame] 50/50 activation result (will deactivate on use):`, activationResult ? `Instance ID ${activationResult.instanceId}` : activationResult); // DEBUG LOG
            }
        } else {
            console.warn(`[MultipleChoiceGame] Could not determine target team ID to activate selected power-up '${payload.selectedPowerupId}'. State activeTeam: ${this.getState().activeTeam}`);
        }
    }

    // --- Add Pause/Resume Handlers for Game Logic ---
    private _handleGamePaused(): void {
        console.log("[MultipleChoiceGame] Received GAME_PAUSED. Attempting to pause question timer.");
        // --- Add Guard Check ---
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
             this.timerManager.pauseTimer(this.QUESTION_TIMER_ID);
        } else {
             console.warn(`[MultipleChoiceGame] Cannot pause timer: TimerManager or timer ID '${this.QUESTION_TIMER_ID}' not found.`);
        }
        // --- End Guard Check ---
    }

    private _handleGameResumed(): void {
         console.log("[MultipleChoiceGame] Received GAME_RESUMED. Attempting to resume question timer.");
         // --- Add Guard Check ---
         if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
             this.timerManager.resumeTimer(this.QUESTION_TIMER_ID);
         } else {
             console.warn(`[MultipleChoiceGame] Cannot resume timer: TimerManager or timer ID '${this.QUESTION_TIMER_ID}' not found.`);
         }
         // --- End Guard Check ---
    }
    // --- End Add Handlers ---
} 