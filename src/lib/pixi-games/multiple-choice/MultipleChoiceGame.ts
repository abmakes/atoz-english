import * as PIXI from 'pixi.js';
import { PixiEngine, PixiEngineOptions } from '@/lib/pixi-engine';
import { EventEmitter } from 'eventemitter3';
import { QuestionScene } from './scenes/QuestionScene';
import { Button } from '@pixi/ui';
import { PixiTimer, TimerEventType } from './ui/PixiTimer';
// Import types from central location
import { FullGameConfig, PlayerScoreData, ScoreUpdatePayload, GameOverPayload, TeamData } from '@/types/gameTypes';
// Import the correct QuestionData type from src/types/index.ts
import { QuestionData } from '@/types'; // Adjust path if necessary
// Import the GIF asset parser/loader
import { GifAsset } from 'pixi.js/gif';

// Define events this game can emit
export enum GameEventType {
    SCORE_UPDATED = 'score_updated',
    GAME_OVER = 'game_over',
    NEXT_QUESTION = 'next_question',
}

async function ensureFontIsLoaded(fontFamily: string, descriptor: string = '28px'): Promise<void> {
    const fontCheckString = `${descriptor} "${fontFamily}"`; // e.g., "28px Grandstander"
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
        // Optionally throw the error or handle fallback
    }
}

export class MultipleChoiceGame extends EventEmitter {
    private engine: PixiEngine;
    private config: FullGameConfig; // Use the imported type
    private parentElement: HTMLElement;
    private _isInitialized: boolean = false;
    private isGameOver: boolean = false; // Add this flag
    private timerCompleteCount: number = 0; // Add counter
    private _hasTriggeredGameOver: boolean = false; // Declare the property

    // Game state properties
    private currentQuestionIndex: number = 0;
    private questionsData: QuestionData[] = []; // Use QuestionData from '@/types'
    private currentScores: { [playerName: string]: number } = {};

    // Scenes & UI
    private questionScene?: QuestionScene;
    private timerInstance?: PixiTimer;
    private answerButtons: Button[] = [];
    private preloadedMediaUrls: string[] = [];

    // Add a property to track active team index
    private activeTeamIndex: number = 0;

    constructor(parentElement: HTMLElement, config: FullGameConfig) {
        super();
        this.parentElement = parentElement;
        this.config = config;

        console.log("MultipleChoiceGame constructor - Config received:", config);

        // Initialize scores
        this.config.teams.forEach((team: TeamData) => {
            this.currentScores[team.name] = 0;
        });

        // Configure the Pixi Engine
        const engineOptions: PixiEngineOptions = {
            // NOTE: resizeTo is likely handled by GameplayView/GameContainer now, consider removing if redundant
            resizeTo: parentElement, 
            backgroundColor: '#E0F2FE',
            debug: false, // Set to false to remove test bunny and shapes
            loadAssetsOnInit: false,
             // Simplify assetManifest - Rely on question data for image URLs
             // Remove specific image preloads if they come from question data
             assetManifest: {
                 bundles: [
                     {
                         name: 'game-assets', // Keep bundle name if needed for general assets
                         assets: {
                             // Remove specific images like piggy, batman, giddy if loaded via questions
                             // Add any *general* UI assets here if needed (e.g., button textures not in @pixi/ui)
                         }
                     }
                 ]
             }
        };
        this.engine = new PixiEngine(engineOptions);

        // Ensure the GIF parser is explicitly acknowledged by referencing the import
        // This prevents tree-shaking from removing the necessary parser code.
        if (typeof GifAsset !== 'undefined') {
            console.log("GIF Asset handler registered."); // Or just: console.log(GifAsset);
        }
    }

    public async init(): Promise<void> {
        if (this._isInitialized) {
            return;
        }
        
        try {
            // Comment out asset loading logs
            await this.engine.init();
            // console.log("PixiEngine initialized");

            const pixiView = this.engine.getApp().getView();
            if(pixiView) {
                this.parentElement.appendChild(pixiView);
                console.log("Pixi canvas appended");
            } else {
                throw new Error("Failed to get Pixi view from engine.");
            }

            // Load general game assets first (if any)
            // await this.engine.loadAssets(); 
            // console.log("General game assets loaded.");

            // Load the specific quiz/question data
            await this.loadQuestionData();

            // === Preload all question media ===
            await this.preloadQuestionMedia(this.questionsData);
            // =================================

            // Create UI Elements - Timer
            this.timerInstance = new PixiTimer({ radius: 35, lineWidth: 6 });
            this.positionTimer();
            this.engine.getApp().getStage().addChild(this.timerInstance);
            this.timerInstance.onTimerEvent(TimerEventType.COMPLETE, this.handleTimerComplete);

            // Before creating QuestionScene or the PIXI.Text objects:
            await ensureFontIsLoaded('Grandstander'); // Wait for the specific font

            // Now you can safely create the scene and text styles
            this.questionScene = new QuestionScene(this.engine);
            this.engine.getApp().getStage().addChild(this.questionScene);

            if (this.questionsData.length > 0) {
                this.showQuestion(this.currentQuestionIndex);
            } else {
                console.error("No questions loaded for quiz:", this.config.quizId);
                this.emit(GameEventType.GAME_OVER, { scores: [], winner: undefined });
            }
            console.log("MultipleChoiceGame setup complete.");
            this._isInitialized = true;
        } catch (error) {
            console.error("Error initializing MultipleChoiceGame:", error);
             this.emit(GameEventType.GAME_OVER, { scores: [], winner: undefined });
        }
    }

    // --- Positioning ---
    private positionTimer(): void {
        if (!this.timerInstance) return;
        // Fix: Use public getter for screen size
        const screen = this.engine.getApp().getScreenSize();
        this.timerInstance.x = screen.width * 0.85;
        this.timerInstance.y = screen.height / 2;
    }

    // --- Question Data Loading --- (Should be correct now)
    private async loadQuestionData(): Promise<void> {
        if (!this.config.quizId) {
            console.error("Cannot load questions: quizId is missing in config.");
            this.questionsData = [];
            return;
        }

        const apiUrl = `/api/quizzes/${this.config.quizId}`;
        // console.log(`Fetching quiz data (including questions) from: ${apiUrl}`);

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
                   console.error(`Quiz not found (404) for ID: ${this.config.quizId}`);
                   throw new Error(`Quiz not found for ID: ${this.config.quizId}`);
                }
                throw new Error(`API Error fetching quiz: ${response.status} ${response.statusText} - ${errorText}`);
             }

             const quizData = await response.json();

             // Use optional chaining and nullish coalescing for robustness
             const potentialQuestions = quizData?.data?.questions ?? quizData?.questions;

             if (!potentialQuestions || !Array.isArray(potentialQuestions)) {
                console.error("Invalid quiz data format received from API (expected object with 'questions' array, possibly nested in 'data'):", quizData);
                throw new Error("Invalid quiz data format received.");
             }

             this.questionsData = potentialQuestions as QuestionData[];
             // console.log(`Successfully loaded ${this.questionsData.length} questions for quiz ${this.config.quizId}.`);

         } catch (error) {
            console.error("Failed to load question data:", error);
            this.questionsData = [];
            // Re-throw or handle appropriately to prevent game start without data
            throw new Error("Failed to load critical question data."); 
        }
    }

    // === New method to preload media ===
    private async preloadQuestionMedia(questions: QuestionData[]): Promise<void> {
        const imageUrls = questions.map(q => q.imageUrl).filter((url): url is string =>
            typeof url === 'string' && url.length > 0);
        const uniqueImageUrls = Array.from(new Set(imageUrls));

        // Store the URLs we are about to load
        this.preloadedMediaUrls = uniqueImageUrls;

        console.log(`Preloading ${uniqueImageUrls.length} unique question media assets...`);

        if (uniqueImageUrls.length === 0) {
             console.log("No unique media URLs to preload.");
             return; // Exit early if nothing to load
         }


        try {
             // Simplified: Load all unique URLs. PIXI.Assets handles types internally.
             console.log("Starting PIXI.Assets.load for:", uniqueImageUrls);
             await PIXI.Assets.load(uniqueImageUrls);
             console.log("Question media preloaded successfully via PIXI.Assets.load.");

         } catch (error) {
             console.error("Error during PIXI.Assets.load for question media:", error);
             // Handle errors for specific URLs if needed, though Assets.load might group them
             // Maybe attempt to unload any potentially partially loaded assets?
             uniqueImageUrls.forEach(url => PIXI.Assets.unload(url).catch(unloadErr => console.warn(`Failed to unload ${url} after load error`, unloadErr)));
         }
    }
    // =====================================

    // --- Add a dedicated timer cleanup method ---
    private cleanupTimer(): void {
        if (this.timerInstance) {
            const ticker = this.engine?.getApp()?.getTicker(); // Use optional chaining
            if (ticker) {
                this.timerInstance.stop(ticker);
            }
            // Always try to remove the listener, even if stop failed
            this.timerInstance.removeListener(TimerEventType.COMPLETE, this.handleTimerComplete);
            // console.log("Timer cleaned up (stopped and listener removed)."); // Optional debug log
        }
    }

    // --- Scene and UI Management --- Updated Logic ---
    private showQuestion(index: number): void {
        if (!this.questionScene || index >= this.questionsData.length) {
            console.log("Invalid question index or scene not ready:", index);
            // Check if game over hasn't been triggered yet to avoid duplicate triggers
            if (!this._hasTriggeredGameOver) {
                this.triggerGameOver();
            }
            return;
        }

        // Clean up any residual timer from previous state *before* setting up new one
        this.cleanupTimer(); // Call the consolidated cleanup

        const question: QuestionData = this.questionsData[index];

        // Clear previous answer buttons
        this.questionScene.clearAnswerOptions();
        this.answerButtons = [];

        // Update scene content
        this.questionScene.updateQuestion(question.question, this.engine, question.imageUrl);

        // === Generate options array for UI ===
        // Explicitly cast answers to string[] before mapping
        const generatedOptions = ((question.answers as string[]) ?? []).map((answerText: string, i: number) => {
            const optionId = `${question.id}-opt-${i}`;
            const isCorrect = answerText === question.correctAnswer;
            return {
                id: optionId,
                text: answerText,
                isCorrect: isCorrect,
                length: answerText.length
            };
        });
        // =====================================

        // Create Answer Buttons
        const optionsContainer = this.questionScene.getAnswerOptionContainer();
        const buttonWidth = this.engine.getScreenSize().width * 0.4 - 20;
        const buttonHeight = this.engine.getScreenSize().height *0.1 - 10;
        const gap = 10;
        const columns = 2;
        const totalWidth = columns * buttonWidth + (columns - 1) * gap;
        

        // Iterate over the generatedOptions array
        generatedOptions.forEach((option, i) => {
            const buttonView = new PIXI.Graphics()
                .roundRect(0, 0, buttonWidth, buttonHeight, 16)
                .fill(0xFFFFFF);

            let fontSize = 30;
            let wordWrap = false;
            // Use option.text for the button label
            if (option.length > 30) {
              fontSize = 24;
              wordWrap = true;              
            } 

            ////// ANSWER BUTTON TEXT //////

            const buttonText = new PIXI.Text({
                 text: option.text, // Use text from generated option
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
            buttonView.addChild(buttonText); //only continers can add children

            const button = new Button(buttonView);

            const col = i % columns;
            const row = Math.floor(i / columns);
            button.view.x = col * (buttonWidth + gap) - totalWidth / 2 + buttonWidth / 2;
            button.view.y = row * (buttonHeight + gap);

            // Use option.id when handling selection
            button.onPress.connect(() => this.handleAnswerSelected(question.id, option.id));
            button.onHover.connect(() => button.view.tint = 0xDDDDDD);
            button.onOut.connect(() => button.view.tint = 0xFFFFFF);
            button.onDown.connect(() => button.view.scale.set(0.95));
            button.onUp.connect(() => button.view.scale.set(1.0));
            button.onUpOut.connect(() => button.view.scale.set(1.0));

            optionsContainer.addChild(button.view);
            this.answerButtons.push(button);
        });

        optionsContainer.x = this.engine.getScreenSize().width / 2 - buttonWidth / 2;
        /*
        console.log(`Options container width: ${optionsContainer.width}, Options container height: ${optionsContainer.height}`);
        console.log(`Options container x: ${optionsContainer.x}, Options container y: ${optionsContainer.y}`);
        console.log(`Button width: ${buttonWidth}, Button height: ${buttonHeight}`);
        */


        // Reset and Start Timer
        const questionDuration = this.config.intensityTimeLimit;
        if(this.timerInstance) {
            this.timerInstance.reset(questionDuration);
            // Add new timer event listener *AFTER* resetting and *AFTER* cleaning previous listener
            this.timerInstance.onTimerEvent(TimerEventType.COMPLETE, this.handleTimerComplete);
            const ticker = this.engine.getApp().getTicker();
            if (ticker) {
                this.timerInstance.start(questionDuration, ticker);
            } else {
                console.error("Ticker not available for starting timer!");
            }
        }
    }

    // --- Game Logic Handling ---
    private handleAnswerSelected(questionId: string, selectedGeneratedOptionId: string): void {
        // --- Stop and Cleanup Timer Immediately ---
        this.cleanupTimer(); // Call the consolidated cleanup
        // -----------------------------------------

        // Check if game is already over
        if (this.isGameOver) {
            console.log("handleAnswerSelected called but game is already over. Skipping.");
            return;
        }

        // Prevent further interaction *after* checking isGameOver
        this.setAnswerButtonsEnabled(false);

        const question = this.questionsData.find(q => q.id === questionId);
        if (!question) {
             console.error(`Question not found for id: ${questionId}`);
             return; // Early exit if question is missing
        }

        // Regenerate options to find the selected one and check correctness
        const generatedOptions = (question.answers || []).map((answerText, i) => ({
            id: `${question.id}-opt-${i}`,
            text: answerText,
            isCorrect: answerText === question.correctAnswer
        }));

        const selectedOption = generatedOptions.find(o => o.id === selectedGeneratedOptionId);
        if (!selectedOption) {
             console.error(`Selected option not found for id: ${selectedGeneratedOptionId}`);
             return; // Early exit if option somehow doesn't match
        }

        const isCorrect = !!selectedOption.isCorrect;
        console.log(`Answer selected (Option ID): ${selectedGeneratedOptionId}, Correct: ${isCorrect}`);

        // Provide visual feedback
        this.showAnswerFeedback(generatedOptions);

        if (isCorrect) {
            const activeTeam = this.config.teams[this.activeTeamIndex];
            if (activeTeam?.name) {
                this.currentScores[activeTeam.name] = (this.currentScores[activeTeam.name] || 0) + 5;
                this.emitScoreUpdate();
                console.log(`Score updated: ${activeTeam.name} now has ${this.currentScores[activeTeam.name]} points`);
            }
        } else {
             // Log incorrect answer selection, but no points
             console.log(`Incorrect answer selected for question ${this.currentQuestionIndex}.`);
        }
        
        // Always advance team, regardless of correct/incorrect answer
        this.activeTeamIndex = (this.activeTeamIndex + 1) % this.config.teams.length;
        console.log(`Next active team: ${this.config.teams[this.activeTeamIndex]?.name}`);

        // Check if this was the last question *after* processing the answer
        const isLastQuestion = this.currentQuestionIndex >= this.questionsData.length - 1;

        // Use setTimeout to allow feedback visibility
        setTimeout(() => {
            // Re-check game over status inside timeout in case it changed
            if (this.isGameOver) {
                  console.log("setTimeout in handleAnswerSelected: Game is already over. Skipping further action.");
                  return;
             }

            if (isLastQuestion) {
                this.isGameOver = true; // Set flag *before* calling trigger
                console.log("Last question answered. Setting isGameOver = true.");
                this.triggerGameOver(); // Trigger game over directly
            } else {
                this.currentQuestionIndex++;
                console.log(`Advancing to question index: ${this.currentQuestionIndex}`);
                this.showQuestion(this.currentQuestionIndex);
                // Re-enable buttons only if we are advancing to a new question
                this.setAnswerButtonsEnabled(true);
            }
        }, 1500); // Delay remains for feedback visibility
    }

    // Update showAnswerFeedback to accept the generated options
    private showAnswerFeedback(generatedOptions: { id: string; text: string; isCorrect?: boolean }[]): void {
         this.answerButtons.forEach((button, index) => {
             if (index >= generatedOptions.length) return; // Safety check
             const option = generatedOptions[index];
             const buttonView = button.view as PIXI.Graphics;

             // We need to know which option was *selected* to color it red/pink
             // This requires passing the selectedGeneratedOptionId to this function,
             // or rethinking the feedback slightly. For now, just green/grey.
             if (option.isCorrect) {
                 buttonView.tint = 0x90EE90; // Light green for correct
             } else {
                 // Example: Grey out incorrect options. Coloring the selected *wrong* one needs more info.
                 buttonView.tint = 0xE0E0E0;
                 buttonView.alpha = 0.7;
             }
         });
         // TODO: Refactor feedback logic if specific 'selected wrong' color is needed.
    }

    private setAnswerButtonsEnabled(enabled: boolean): void {
         this.answerButtons.forEach(button => {
             button.enabled = enabled;
              // Optionally change visual state for disabled
             button.view.alpha = enabled ? 1.0 : 0.6;
         });
     }

    private emitScoreUpdate(): void {
        const scoresPayload: ScoreUpdatePayload = {
            // Cast needed if currentScores keys aren't strictly PlayerScoreData keys
            scores: Object.entries(this.currentScores).map(([name, score]) => ({ playerName: name, score }))
        };
        this.emit(GameEventType.SCORE_UPDATED, scoresPayload);
    }

    private triggerGameOver(): void {
        // --- Prevent multiple executions ---
        // This check is still useful to prevent accidental double calls,
        // but the primary prevention is now setting the flag earlier.
        if (!this.isGameOver) {
             console.warn("triggerGameOver called unexpectedly when isGameOver was false. Setting flag now.");
             this.isGameOver = true; // Set flag immediately just in case
        } else {
            // It's expected that isGameOver is true here when called from handleAnswerSelected's timeout
             console.log("triggerGameOver called while isGameOver is true (expected).");
        }


        // --- Ensure cleanup runs only once effectively ---
        // We might need a separate flag if we want to ensure the actual
        // emission/cleanup happens only once, even if triggerGameOver is called multiple times.
        // Let's refine this slightly.

        // Introduce a flag specifically for "has triggered" state
        if (this._hasTriggeredGameOver) {
             console.log("triggerGameOver: Already triggered. Skipping emission/cleanup.");
             return;
         }
        this._hasTriggeredGameOver = true;


        console.log("Triggering Game Over (Emission/Cleanup)");
        // Ensure timer is stopped (redundant but safe)
        if (this.timerInstance) {
            const ticker = this.engine.getApp()?.getTicker();
            if (ticker) this.timerInstance.stop(ticker);
        }
        // Ensure buttons are disabled (redundant but safe)
        this.setAnswerButtonsEnabled(false);


        // Perform final calculations FIRST
        const finalScores: PlayerScoreData[] = Object.entries(this.currentScores).map(([name, score]) => ({ playerName: name, score }));
        let winner: string | undefined = undefined;
        let highScore = -1;

        // Debug log current scores
        console.log("Final scores before determining winner:", this.currentScores);

        finalScores.forEach(p => {
             if (p.score > highScore) {
                 highScore = p.score;
                 winner = p.playerName;
             } else if (p.score === highScore && highScore > 0) {
                 // It's a tie only if tied scores are > 0
                 winner = undefined; 
             }
         });

        // Debug log the calculation results
        console.log(`Winner calculation: highScore=${highScore}, winner=${winner || 'No winner/tie'}`);

        // Emit the event
        const payload: GameOverPayload = { scores: finalScores, winner };
        console.log("GAME_OVER payload:", payload);
        this.emit(GameEventType.GAME_OVER, payload); // Emit now!

        // --- ADD IMMEDIATE SCENE CLEANUP ---
        // This runs *after* the event is emitted, so React can start transitioning
        // while Pixi cleans up its own view.
        if (this.questionScene) {
            console.log("Clearing question scene content on game over trigger");
            this.questionScene.clearAnswerOptions(); // Remove answer buttons NOW
             // Optionally clear the question text/image immediately
             this.questionScene.updateQuestion("Game Over!", this.engine); // Or pass empty string ""
        }
        // -----------------------------------
    }

    // --- Timer Completion Handler ---
     private handleTimerComplete = (): void => {
         // --- Stop and Cleanup Timer Immediately ---
         // Crucial to call cleanup here too, in case this fires before handleAnswerSelected
         this.cleanupTimer();
         // -----------------------------------------

         // Prevent timer handling if game is over
         if (this.isGameOver) {
             console.log(`Timer complete ignored - game is already over`);
             return;
         }

         // It's possible this handler fires *just* as the game ends.
         // We increment the count but might skip further actions if isGameOver becomes true soon.
         this.timerCompleteCount++;
         console.log(`Timer Complete! (Count: ${this.timerCompleteCount}) - Time ran out for question ${this.currentQuestionIndex}`);

         // Prevent further interaction
         this.setAnswerButtonsEnabled(false);

         // Show "Time's Up!" feedback visually
         const question = this.questionsData[this.currentQuestionIndex];
         if (question) {
             this.showTimeUpFeedback(question);
         } else {
             console.warn(`Timer complete for question index ${this.currentQuestionIndex}, but question data not found.`);
         }

         // Move to next team (they get no points)
         this.activeTeamIndex = (this.activeTeamIndex + 1) % this.config.teams.length;
         console.log(`Timer ran out. No points awarded. Next team: ${this.config.teams[this.activeTeamIndex]?.name}`);

         // Check if this was the last question
         const isLastQuestion = this.currentQuestionIndex >= this.questionsData.length - 1;

         // Schedule next action with a delay
         setTimeout(() => {
             // *** Add crucial check inside setTimeout ***
             if (this.isGameOver) {
                  console.log("setTimeout in handleTimerComplete: Game is already over. Skipping further action.");
                  return;
             }

             if (isLastQuestion) {
                 // If last question timed out, trigger game over
                 this.isGameOver = true; // Set flag *before* calling trigger
                 console.log("Last question timed out. Setting isGameOver = true.");
                 this.triggerGameOver(); // Trigger game over directly
             } else {
                 // Move to next question after delay
                 this.currentQuestionIndex++;
                 console.log(`Timer expired. Advancing to question index: ${this.currentQuestionIndex}`);
                 this.showQuestion(this.currentQuestionIndex);
                 // Re-enable buttons only if we are advancing to a new question
                 this.setAnswerButtonsEnabled(true);
             }
         }, 1500); // Delay to show timeout feedback
     }

     private showTimeUpFeedback(question: QuestionData): void {
        // Regenerate options to know which one was correct
        const generatedOptions = (question.answers || []).map((answerText, i) => ({
            id: `${question.id}-opt-${i}`,
            text: answerText,
            isCorrect: answerText === question.correctAnswer
        }));

        this.answerButtons.forEach((button, index) => {
             if (index >= generatedOptions.length) return;
             const option = generatedOptions[index];
             const buttonView = button.view as PIXI.Graphics;
             buttonView.tint = 0xE0E0E0;
             buttonView.alpha = 0.7;
             if (option.isCorrect) {
                 buttonView.tint = 0xF0F0A0;
                 buttonView.alpha = 0.8;
             }
         });
    }

    /**
     * Cleans up the Pixi application and resources.
     */
    public async destroy(): Promise<void> {
        console.log("Destroying MultipleChoiceGame and PixiEngine...");
        if (this._isInitialized) {
             this._isInitialized = false;

             // Stop Timer
             if (this.timerInstance) {
                 const ticker = this.engine?.getApp()?.getTicker();
                 if (ticker) this.timerInstance.stop(ticker);
                 this.timerInstance.destroy({ children: true });
                 this.timerInstance = undefined;
             }
             // Destroy Scene
             if (this.questionScene) {
                 this.questionScene.destroy({ children: true });
                 this.questionScene = undefined;
             }

             // --- Unload Assets ---
             if (this.preloadedMediaUrls.length > 0) {
                 console.log(`Unloading ${this.preloadedMediaUrls.length} media assets...`);
                 const unloadPromises = this.preloadedMediaUrls.map(url =>
                     PIXI.Assets.unload(url).catch(err =>
                         console.warn(`Failed to unload asset: ${url}`, err)
                     )
                 );
                 await Promise.allSettled(unloadPromises);
                 console.log("Finished attempting asset unloading.");
                 this.preloadedMediaUrls = [];
             }
             // ---------------------

             // Destroy Engine (handles app destruction, ticker stop, view removal)
             if (this.engine) {
                 this.engine.destroy();
             }
         } else {
            console.log("MultipleChoiceGame already destroyed or not initialized.");
         }

        this.removeAllListeners();
        console.log("MultipleChoiceGame destroy complete.");
    }
} 