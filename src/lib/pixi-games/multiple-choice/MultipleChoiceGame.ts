import * as PIXI from 'pixi.js';
import { BaseGame, BaseGameState, GameState } from '@/lib/pixi-engine/game/BaseGame';
import { PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine';
import { GameConfig } from '@/lib/pixi-engine/config/GameConfig';
import { GAME_STATE_EVENTS, TIMER_EVENTS, TimerEventPayload, GAME_EVENTS, AnswerSelectedPayload } from '@/lib/pixi-engine/core/EventTypes';
import { TimerType } from '@/lib/pixi-engine/game/TimerManager';
import { QuestionScene } from './scenes/QuestionSceneV2';
import { Button } from '@pixi/ui';
import { GameSetupData as MultipleChoiceGameConfig } from '@/types/gameTypes';
import { QuestionData } from '@/types';
import { GifAsset } from 'pixi.js/gif';

const POINTS_PER_CORRECT_ANSWER = 10;

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
    private questionsData: QuestionData[] = [];
    private questionScene?: QuestionScene;
    private answerButtons: Button[] = [];
    private preloadedMediaUrls: string[] = [];
    private readonly QUESTION_TIMER_ID = 'multipleChoiceQuestionTimer';
    private timerDisplay?: PIXI.Text;
    
    constructor(config: GameConfig, managers: PixiEngineManagers) {
        super(config, managers);

        console.log("MultipleChoiceGame constructor - Config received:", this.config);

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
            
            // Show initial loading transition (non-auto-hiding)
            console.log("[MultipleChoiceGame] initImplementation: Calling showTransition (loading)...'"); 
            await this.showTransition({ type: 'loading', message: 'Getting Ready...', autoHide: false });
            console.log("[MultipleChoiceGame] initImplementation: AFTER await showTransition (loading) - Screen is visible.");

            // Start loading game-specific data (questions, media links) and get its promise
            console.log("[MultipleChoiceGame] initImplementation: Starting game data load (_loadGameData)..."); 
            const gameDataPromise = this._loadGameData();

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
            this._setupUI();
            console.log("[MultipleChoiceGame] initImplementation: Binding game events...");
            this._bindGameEvents();

            if (this.questionsData.length === 0) {
                console.error("No questions loaded after waiting for data.");
                throw new Error("No questions loaded.");
            }
            
            // Show the first question
            console.log("[MultipleChoiceGame] initImplementation: Calling _showQuestion(0)...");
            this._showQuestion(this.getState().currentQuestionIndex);
            console.log("[MultipleChoiceGame] initImplementation: AFTER _showQuestion(0).");

            this.setState({ phase: 'playing' }); 
            
            console.log(`${this.constructor.name}: Initialized successfully.`);

        } catch (error) {
            console.error(`Error initializing ${this.constructor.name}:`, error);
            console.log("[MultipleChoiceGame] initImplementation: Hiding transition in CATCH block...");
            // Ensure transition is hidden even if an error occurs AFTER it was shown
            this.hideTransition(); 
            this.setState({ hasTriggeredGameOver: true, phase: 'gameOver' });
            this._unbindGameEvents();
            throw error; // Re-throw error after cleanup attempt
        }
    }

    /**
     * Loads game data including questions from API
     */
    private async _loadGameData(): Promise<void> {
        await this._loadQuestionData();
        await this._preloadQuestionMedia(this.questionsData);
    }

    /**
     * Sets up UI elements including scene and timer display
     */
    private _setupUI(): void {
        this._setupInitialScene();
        this._setupTimerDisplay();
    }

    /**
     * Binds event listeners for game events
     */
    private _bindGameEvents(): void {
        console.log("[MultipleChoiceGame] _bindGameEvents: START Registering listeners..."); 
        // Explicitly bind 'this' context to the handler functions
        this.registerEventListener(TIMER_EVENTS.TIMER_COMPLETED, this._handleTimerComplete.bind(this));
        this.registerEventListener(TIMER_EVENTS.TIMER_TICK, this._handleTimerTick.bind(this));
        console.log("[MultipleChoiceGame] _bindGameEvents: END Registering listeners."); 
    }

    /**
     * Unbinds all event listeners
     */
    private _unbindGameEvents(): void {
        // Also use bind when unregistering to ensure the correct listener reference is removed
        this.unregisterEventListener(TIMER_EVENTS.TIMER_COMPLETED, this._handleTimerComplete.bind(this));
        this.unregisterEventListener(TIMER_EVENTS.TIMER_TICK, this._handleTimerTick.bind(this));
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(delta: number): void {
        // Current implementation doesn't need per-frame updates
        // But we could add animations or other time-based effects here
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
        
        // Stop any active timers
        this.timerManager.removeTimer(this.QUESTION_TIMER_ID);
        
        // Disable interaction with answer buttons
        this._setAnswerButtonsEnabled(false);
        
        // Any other end-game logic (could show final scores, etc.)
        if (this.questionScene) {
            this.questionScene.clearAnswerOptions();
        }
    }

    /**
     * Clean up all resources during game destruction
     */
    protected destroyImplementation(): void {
        console.log(`${this.constructor.name}: Destroying...`);

        // Remove event listeners (should be done by BaseGame's unregisterAllEventListeners)
        // But we'll explicitly unbind our custom ones
        this._unbindGameEvents();

        // Remove any active timers
        this.timerManager.removeTimer(this.QUESTION_TIMER_ID);

        // Destroy UI elements
        if (this.questionScene) {
            this.questionScene.destroy({ children: true });
            this.questionScene = undefined;
        }

        if (this.timerDisplay) {
            this.timerDisplay.destroy();
            this.timerDisplay = undefined;
        }

        // Clear all children from the main view
        this.view.removeChildren();
        console.log(`${this.constructor.name}: Destroy complete.`);
    }

    private _positionTimerDisplay(): void {
        if (!this.timerDisplay) return;
        const screenWidth = 800;
        const screenHeight = 600;
        this.timerDisplay.x = screenWidth * 0.85;
        this.timerDisplay.y = screenHeight * 0.1;
        this.timerDisplay.anchor.set(0.5, 0);
    }

    private async _loadQuestionData(): Promise<void> {
        const specificConfig = this.config as unknown as MultipleChoiceGameConfig;
        if (!specificConfig.quizId) {
            console.error("Cannot load questions: quizId is missing in config.");
            this.questionsData = [];
            return;
        }
        const apiUrl = `/api/quizzes/${specificConfig.quizId}`;
        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

             if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 404) {
                   console.error(`Quiz not found (404) for ID: ${specificConfig.quizId}`);
                   throw new Error(`Quiz not found for ID: ${specificConfig.quizId}`);
                }
                throw new Error(`API Error fetching quiz: ${response.status} ${response.statusText} - ${errorText}`);
             }

             const quizData = await response.json();

             const potentialQuestions = quizData?.data?.questions ?? quizData?.questions;

             if (!potentialQuestions || !Array.isArray(potentialQuestions)) {
                console.error("Invalid quiz data format received from API (expected object with 'questions' array, possibly nested in 'data'):", quizData);
                throw new Error("Invalid quiz data format received.");
             }

             this.questionsData = potentialQuestions as QuestionData[];

         } catch (error) {
            console.error("Failed to load question data:", error);
            this.questionsData = [];
            throw new Error("Failed to load critical question data."); 
        }
    }

    private async _preloadQuestionMedia(questions: QuestionData[]): Promise<void> {
        const imageUrls = questions.map(q => q.imageUrl).filter((url): url is string =>
            typeof url === 'string' && url.length > 0);
        const uniqueImageUrls = Array.from(new Set(imageUrls));

        this.preloadedMediaUrls = uniqueImageUrls;

        console.log(`Preloading ${uniqueImageUrls.length} unique question media assets...`);

        if (uniqueImageUrls.length === 0) {
             console.log("No unique media URLs to preload.");
             return;
         }

        try {
             console.log("Starting PIXI.Assets.load for:", uniqueImageUrls);
             await PIXI.Assets.load(uniqueImageUrls);
             console.log("Question media preloaded successfully via PIXI.Assets.load.");

         } catch (error) {
             console.error("Error during PIXI.Assets.load for question media:", error);
             uniqueImageUrls.forEach(url => PIXI.Assets.unload(url).catch(unloadErr => console.warn(`Failed to unload ${url} after load error`, unloadErr)));
         }
    }

    private _setupInitialScene(): void {
        // Create scene, passing necessary managers
        if (!this.questionScene) {
            // Pass the eventBus (and other managers if needed) from the game to the scene
            this.questionScene = new QuestionScene(this.pixiApp, this.eventBus, this.assetLoader);
            // Add the scene instance itself (which is a Container) to the game's view
            this.view.addChild(this.questionScene);
            console.log("QuestionScene created and added to the game view.");
        } else {
             console.log("QuestionScene already exists.");
        }
    }

    /**
     * Shows a question at the specified index
     */
    private _showQuestion(index: number): void {
        if (!this.questionScene || index >= this.questionsData.length) {
            console.log("Invalid question index or scene not ready:", index);
            if (!this.getState().hasTriggeredGameOver) {
                this._triggerGameOver();
            }
            return;
        }

        this.timerManager.removeTimer(this.QUESTION_TIMER_ID);

        const question: QuestionData = this.questionsData[index];

        // Clear previous question state
        this._clearQuestionState();
        
        // Update question content
        this._updateQuestionContent(question);
        
        // Create answer options
        const generatedOptions = this._createAnswerOptions(question);
        
        // Setup UI for answer options
        this._setupAnswerButtons(generatedOptions);
        
        // Start the timer for this question
        this._startQuestionTimer();
    }

    private _clearQuestionState(): void {
        if (this.questionScene) {
            this.questionScene.clearAnswerOptions();
            this.answerButtons = [];
        }
    }
    
    private _updateQuestionContent(question: QuestionData): void {
        if (!this.questionScene) return;
        
        console.log("MultipleChoiceGame.ts: Updating question content");
        this.questionScene.updateQuestion(question.question, question.imageUrl);
    }
    
    private _createAnswerOptions(question: QuestionData): Array<{
        id: string;
        text: string;
        isCorrect: boolean;
        length: number;
    }> {
        return ((question.answers as string[]) ?? []).map((answerText: string, i: number) => {
            const optionId = `${question.id}-opt-${i}`;
            const isCorrect = answerText === question.correctAnswer;
            return {
                id: optionId,
                text: answerText,
                isCorrect: isCorrect,
                length: answerText.length
            };
        });
    }
    
    /**
     * Sets up answer buttons for the current question
     */
    private _setupAnswerButtons(generatedOptions: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
        length: number;
    }>): void {
        if (!this.questionScene) return;
        
        this.questionScene.clearAnswerOptions();
        this.answerButtons = [];
        
        const optionsContainer = this.questionScene.getAnswerOptionContainer();
        const screenWidth = this.pixiApp.getScreenSize().width;
        const screenHeight = this.pixiApp.getScreenSize().height;
        const buttonWidth = screenWidth * 0.4 - 20;
        const buttonHeight = 90;
        const gap = 10;
        const columns = 2;
        const totalWidth = columns * buttonWidth + (columns - 1) * gap;
        
        generatedOptions.forEach((option, i) => {
            const buttonView = new PIXI.Graphics()
                .roundRect(0, 0, buttonWidth, buttonHeight, 16)
                .fill(0xFFFFFF);

            let fontSize = 30;
            let wordWrap = false;
            if (option.length > 30) {
              fontSize = 24;
              wordWrap = true;              
            } 

            const buttonText = new PIXI.Text({
                 text: option.text,
                 style: { 
                  fontSize: fontSize, 
                  fill: 0x333333, 
                 fontFamily: 'Grandstander',
                  wordWrap: wordWrap, 
                  wordWrapWidth: buttonWidth * 0.8, 
                  align: 'center'
                 }
            });
            buttonText.anchor.set(0.5);
            buttonText.x = buttonWidth / 2;
            buttonText.y = buttonHeight / 2;
            buttonView.addChild(buttonText);
            
            // Add an explicit hitArea matching the graphics dimensions
            buttonView.hitArea = new PIXI.Rectangle(0, 0, buttonWidth, buttonHeight);

            const button = new Button(buttonView);

            // Explicitly set the view interactive (though Button usually does this)
            button.view.interactive = true; 

            const col = i % columns;
            const row = Math.floor(i / columns);
            button.view.x = col * (buttonWidth + gap) - totalWidth / 2 + buttonWidth / 2;
            button.view.y = row * (buttonHeight + gap);
            
            // Bind to the current question and option
            const currentQuestion = this.questionsData[this.getState().currentQuestionIndex];
            button.onPress.connect(() => {
                this._handleAnswerSelected(currentQuestion.id, option.id);
            });
            
            // Setup button interaction effects
            this._setupButtonInteractionEffects(button);

            optionsContainer.addChild(button.view);
            this.answerButtons.push(button);
        });

        optionsContainer.x = (screenWidth / 2) - buttonWidth / 2;
        optionsContainer.y = screenHeight - optionsContainer.height - 15;
    }
    
    private _setupButtonInteractionEffects(button: Button): void {
        button.onHover.connect(() => button.view.tint = 0xDDDDDD);
        button.onOut.connect(() => button.view.tint = 0xFFFFFF);
        button.onDown.connect(() => button.view.scale.set(0.95));
        button.onUp.connect(() => button.view.scale.set(1.0));
        button.onUpOut.connect(() => button.view.scale.set(1.0));
    }
    
    private _startQuestionTimer(): void {
        const specificConfig = this.config as unknown as MultipleChoiceGameConfig;
        const questionDuration = specificConfig.intensityTimeLimit * 1000;

        this.timerManager.createTimer(this.QUESTION_TIMER_ID, questionDuration, TimerType.COUNTDOWN);
        this.timerManager.startTimer(this.QUESTION_TIMER_ID);

        console.log(`Created and started timer ${this.QUESTION_TIMER_ID} for ${questionDuration}ms`);

        if (this.timerDisplay) {
             this.timerDisplay.text = this._formatTime(questionDuration);
        }
    }

    /**
     * Handles user selection of an answer option
     */
    private async _handleAnswerSelected(questionId: string, selectedGeneratedOptionId: string): Promise<void> {
        console.log(`handleAnswerSelected triggered! questionId: ${questionId}, selectedOptionId: ${selectedGeneratedOptionId}`);
        this.timerManager.removeTimer(this.QUESTION_TIMER_ID);

        if (this.getState().hasTriggeredGameOver) {
             return;
         }
        this._setAnswerButtonsEnabled(false);

        // Find the selected question and option
        const question = this.questionsData.find(q => q.id === questionId);
        if (!question) return;

        const generatedOptions = this._createAnswerOptions(question);
        const selectedOption = generatedOptions.find(o => o.id === selectedGeneratedOptionId);
        if (!selectedOption) return;

        // Process the answer selection (emits event with CURRENT team ID)
        console.log("[MultipleChoiceGame] _handleAnswerSelected: Processing answer...");
        this._processAnswerSelection(question, selectedOption, generatedOptions);
        
        const isLastQuestion = this.getState().currentQuestionIndex >= this.questionsData.length - 1;

        // --- Transition Logic --- 
        console.log("[MultipleChoiceGame] _handleAnswerSelected: Waiting 1.5s for feedback...");
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for feedback display

        if (this.getState().hasTriggeredGameOver) {
            console.log("[MultipleChoiceGame] _handleAnswerSelected: Game over detected after feedback delay. Exiting.");
            return; 
        }
        
        if (isLastQuestion) {
            console.log("[MultipleChoiceGame] _handleAnswerSelected: Last question answered. Triggering game over.");
            this._triggerGameOver();
        } else {
            // Determine next team and show transition screen
            const currentTeamIndex = this.getState().activeTeamIndex;
            const nextTeamIndex = (currentTeamIndex + 1) % this.config.teams.length;
            const nextTeam = this.config.teams[nextTeamIndex];
            const nextTeamId = nextTeam?.id ?? 'unknown';
            const nextTeamName = nextTeam?.name || `Team ${nextTeamIndex + 1}`;
            
            console.log(`[MultipleChoiceGame] _handleAnswerSelected: Current team index: ${currentTeamIndex}, Next team index: ${nextTeamIndex}, Next team ID: ${nextTeamId}`);
            
            const nextState = { 
                currentQuestionIndex: this.getState().currentQuestionIndex + 1,
                activeTeamIndex: nextTeamIndex,
                activeTeam: nextTeamId
            };
            
            console.log(`[MultipleChoiceGame] _handleAnswerSelected: Calling showTransition (turn) for ${nextTeamName}...`);
            await this.showTransition({ 
                type: 'turn', 
                message: `${nextTeamName}'s Turn!`,
                duration: 3000,
                autoHide: true
            });
            console.log("[MultipleChoiceGame] _handleAnswerSelected: AFTER await showTransition (turn).");

            // After transition hides, update state and show next question
            if (this.getState().hasTriggeredGameOver) {
                console.log("[MultipleChoiceGame] _handleAnswerSelected: Game over detected after turn transition. Exiting.");
                return; 
            }

            this.setState(nextState);
            console.log(`[MultipleChoiceGame] _handleAnswerSelected: State updated. New question index: ${this.getState().currentQuestionIndex}, New team index: ${this.getState().activeTeamIndex}, New active team ID: ${this.getState().activeTeam}`);
            console.log("[MultipleChoiceGame] _handleAnswerSelected: Calling _showQuestion for next turn...");
            this._showQuestion(this.getState().currentQuestionIndex);
            console.log("[MultipleChoiceGame] _handleAnswerSelected: AFTER _showQuestion for next turn.");
            this._setAnswerButtonsEnabled(true);
        }
        // ------------------------
    }
    
    /**
     * Process a user's answer selection
     */
    private _processAnswerSelection(
        question: QuestionData, 
        selectedOption: { id: string; text: string; isCorrect: boolean }, 
        generatedOptions: Array<{ id: string; text: string; isCorrect: boolean; length?: number }>
    ): void {
        const isCorrect = !!selectedOption.isCorrect;
        // Get the team ID based on the current state *before* advancing
        const currentTeamId = this.config.teams[this.getState().activeTeamIndex]?.id;
        console.log(`Answer selected: ${selectedOption.id}, Correct: ${isCorrect}, Team: ${currentTeamId}`);

        // Show visual feedback
        this._showAnswerFeedback(generatedOptions, selectedOption.id);

        // Emit event with the ID of the team that just answered
        const payload: AnswerSelectedPayload = {
            questionId: question.id,
            selectedOptionId: selectedOption.id,
            isCorrect,
            teamId: currentTeamId
        };
        this.emitEvent(GAME_EVENTS.ANSWER_SELECTED, payload);

        // Update score if correct (based on the team that answered)
        if (isCorrect && currentTeamId !== undefined) {
            this.scoringManager.addScore(currentTeamId, POINTS_PER_CORRECT_ANSWER);
            console.log(`Awarded ${POINTS_PER_CORRECT_ANSWER} points to team ${currentTeamId}. New score: ${this.scoringManager.getScore(currentTeamId)}`);
        }

        // Log that the next team calculation is deferred
        console.log(`[MultipleChoiceGame] _processAnswerSelection finished. Next team calculation deferred to handler.`);
    }

    private _showAnswerFeedback(
        generatedOptions: { id: string; text: string; isCorrect?: boolean }[],
        selectedOptionId: string | null
    ): void {
         this.answerButtons.forEach((button, index) => {
             if (index >= generatedOptions.length) return;
             const option = generatedOptions[index];
             const buttonView = button.view as PIXI.Graphics;

             // Reset appearance first
             buttonView.tint = 0xFFFFFF;
             buttonView.alpha = 1.0;

             if (option.isCorrect) {
                 // Always highlight the correct answer green
                 buttonView.tint = 0x90EE90; 
             } else {
                 // If this incorrect option was the one selected
                 if (option.id === selectedOptionId) {
                     buttonView.tint = 0xFF8080; // Highlight selected incorrect answer (e.g., light red)
                 } else {
                     // Dim unselected incorrect answers
                     buttonView.tint = 0xE0E0E0; 
                     buttonView.alpha = 0.7;
                 }
             }
         });
    }

    private _setAnswerButtonsEnabled(enabled: boolean): void {
         this.answerButtons.forEach(button => {
             button.enabled = enabled;
             button.view.alpha = enabled ? 1.0 : 0.6;
         });
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
        this._setAnswerButtonsEnabled(false);

        // Emit game ended event
        this.emitEvent(GAME_STATE_EVENTS.GAME_ENDED);
        console.log(`Emitted ${GAME_STATE_EVENTS.GAME_ENDED} event.`);

        // End the game through BaseGame lifecycle method
        this.end();

        // Clear UI
        if (this.questionScene) {
            console.log("Clearing question scene content on game over trigger");
            this.questionScene.clearAnswerOptions();
        }
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
            this._setAnswerButtonsEnabled(false);
            console.log(`[MultipleChoiceGame] _handleTimerComplete: Calling _handleTimeUp...`); // Added log
            this._handleTimeUp(); // This now includes logging inside it
            console.log(`[MultipleChoiceGame] _handleTimerComplete: Returned from _handleTimeUp.`); // Added log
        } catch (error) {
            console.error(`[MultipleChoiceGame] _handleTimerComplete: Error during button disable or _handleTimeUp:`, error); // Added log
            return; // Stop if this section fails
        }

        // Determine if this is the last question
        const isLastQuestion = this.getState().currentQuestionIndex >= this.questionsData.length - 1;
        console.log(`[MultipleChoiceGame] _handleTimerComplete: Is last question? ${isLastQuestion}`); // Added log

        // --- Transition Logic --- 
        console.log("[MultipleChoiceGame] _handleTimerComplete: Waiting 1.5s for feedback..."); 
        await new Promise(resolve => setTimeout(resolve, 1500)); // Feedback delay
        console.log("[MultipleChoiceGame] _handleTimerComplete: Finished feedback delay.");

        // Re-check game over state AFTER delay
        if (this.getState().hasTriggeredGameOver) { 
            console.log("[MultipleChoiceGame] _handleTimerComplete: Game over detected after feedback delay. Exiting.");
            return; 
        } 

        if (isLastQuestion) {
            console.log("[MultipleChoiceGame] _handleTimerComplete: Last question timed out. Triggering game over."); 
            this._triggerGameOver();
        } else {
             console.log("[MultipleChoiceGame] _handleTimerComplete: Not last question. Calculating next turn..."); 
             const currentTeamIndex = this.getState().activeTeamIndex; 
             const nextTeamIndex = (currentTeamIndex + 1) % this.config.teams.length;
             const nextTeam = this.config.teams[nextTeamIndex];
             const nextTeamId = nextTeam?.id ?? 'unknown';
             const nextTeamName = nextTeam?.name || `Team ${nextTeamIndex + 1}`;
             
             console.log(`[MultipleChoiceGame] _handleTimerComplete: Current team index: ${currentTeamIndex}, Next team index: ${nextTeamIndex}, Next team ID: ${nextTeamId}`);
             
             const nextState = { 
                 currentQuestionIndex: this.getState().currentQuestionIndex + 1,
                 activeTeamIndex: nextTeamIndex,
                 activeTeam: nextTeamId
             };
             
             console.log(`[MultipleChoiceGame] _handleTimerComplete: Calling showTransition (turn) for ${nextTeamName}...`);
             await this.showTransition({ 
                 type: 'turn', 
                 message: `${nextTeamName}'s Turn!`, 
                 duration: 3000, 
                 autoHide: true 
             });
             console.log("[MultipleChoiceGame] _handleTimerComplete: AFTER await showTransition (turn)."); 

             // Re-check game over state AFTER transition
             if (this.getState().hasTriggeredGameOver) {
                  console.log("[MultipleChoiceGame] _handleTimerComplete: Game over detected after turn transition. Exiting.");
                 return; 
             }

             console.log(`[MultipleChoiceGame] _handleTimerComplete: Advancing to question index: ${nextState.currentQuestionIndex}`);
             this.setState(nextState); 
             console.log(`[MultipleChoiceGame] _handleTimerComplete: State updated. New question index: ${this.getState().currentQuestionIndex}, New team index: ${this.getState().activeTeamIndex}, New active team ID: ${this.getState().activeTeam}`);

             console.log("[MultipleChoiceGame] _handleTimerComplete: Calling _showQuestion for next turn..."); 
             this._showQuestion(this.getState().currentQuestionIndex); 
             console.log("[MultipleChoiceGame] _handleTimerComplete: AFTER _showQuestion for next turn."); 

             this._setAnswerButtonsEnabled(true);
             console.log("[MultipleChoiceGame] _handleTimerComplete: End of method."); 
        }
    }
    
    private _handleTimeUp(): void {
        const question = this.questionsData[this.getState().currentQuestionIndex];
        const currentTeamId = this.config.teams[this.getState().activeTeamIndex]?.id;
        
        console.log(`[MultipleChoiceGame] _handleTimeUp: Started for Team ID: ${currentTeamId} on Question ID: ${question?.id}`);
        
        if (question) {
            console.log(`[MultipleChoiceGame] _handleTimeUp: Calling _showTimeUpFeedback...`);
            this._showTimeUpFeedback(question); // Show visual feedback first
            console.log(`[MultipleChoiceGame] _handleTimeUp: AFTER _showTimeUpFeedback.`);
            
            // Emit ANSWER_SELECTED event for timeout (incorrect answer)
            const payload: AnswerSelectedPayload = {
                questionId: question.id,
                selectedOptionId: null, // Indicate no option was selected (now allowed by interface)
                isCorrect: false,
                teamId: currentTeamId
            };
            console.log(`[MultipleChoiceGame] _handleTimeUp: Emitting ANSWER_SELECTED event...`);
            this.emitEvent(GAME_EVENTS.ANSWER_SELECTED, payload);
            console.log(`[MultipleChoiceGame] _handleTimeUp: AFTER emitting ANSWER_SELECTED event.`);

        } else {
            console.warn(`[MultipleChoiceGame] _handleTimeUp: Timer complete for question index ${this.getState().currentQuestionIndex}, but question data not found.`);
        }

        // Logic to advance the active team index is now handled later in _handleTimerComplete 
        // after the feedback delay and potential transition.
        // We remove the setState call from here to avoid potential double updates.
        // // Move to next team
        // this.setState({
        //     activeTeamIndex: (this.getState().activeTeamIndex + 1) % this.config.teams.length
        // });
        
        // console.log(`Timer ran out. No points awarded. Next team calculation will happen in _handleTimerComplete.`);

        // Add final log
        console.log(`[MultipleChoiceGame] _handleTimeUp: Finished.`);
    }

    private _showTimeUpFeedback(question: QuestionData): void {
        const generatedOptions = (question.answers || []).map((answerText, i) => ({
            id: `${question.id}-opt-${i}`,
            text: answerText,
            isCorrect: answerText === question.correctAnswer
        }));

        this._showAnswerFeedback(generatedOptions, null);
    }

    private _setupTimerDisplay(): void {
        this.timerDisplay = new PIXI.Text({ text: '--:--', style: { fill: 0xffffff, fontSize: 24 }});
        this._positionTimerDisplay();
        this.view.addChild(this.timerDisplay);
    }

    private _handleTimerTick = (payload: TimerEventPayload): void => {
        if (payload.timerId !== this.QUESTION_TIMER_ID) {
            return;
        }
        if (this.timerDisplay && payload.remaining !== undefined) {
            this.timerDisplay.text = this._formatTime(payload.remaining);
        }
    };

    private _formatTime(ms: number): string {
        const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
} 