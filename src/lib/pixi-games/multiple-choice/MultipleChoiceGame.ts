import * as PIXI from 'pixi.js';
import { BaseGame } from '@/lib/pixi-engine/game/BaseGame';
import { PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine';
import { GameConfig } from '@/lib/pixi-engine/config/GameConfig';
import { GAME_STATE_EVENTS, TIMER_EVENTS, TimerEventPayload, GAME_EVENTS, AnswerSelectedPayload } from '@/lib/pixi-engine/core/EventTypes';
import { TimerType } from '@/lib/pixi-engine/game/TimerManager';
import { QuestionScene } from './scenes/QuestionScene';
import { Button } from '@pixi/ui';
import { FullGameConfig as MultipleChoiceGameConfig /*, PlayerScoreData, GameOverPayload */ } from '@/types/gameTypes';
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

export class MultipleChoiceGame extends BaseGame {
    private isGameOver: boolean = false;
    private timerCompleteCount: number = 0;
    private _hasTriggeredGameOver: boolean = false;
    private currentQuestionIndex: number = 0;
    private questionsData: QuestionData[] = [];
    private questionScene?: QuestionScene;
    private answerButtons: Button[] = [];
    private preloadedMediaUrls: string[] = [];
    private activeTeamIndex: number = 0;
    private readonly QUESTION_TIMER_ID = 'multipleChoiceQuestionTimer';
    private timerDisplay?: PIXI.Text;

    constructor(config: GameConfig, managers: PixiEngineManagers) {
        super(config, managers);

        console.log("MultipleChoiceGame constructor - Config received:", this.config);

        if (typeof GifAsset !== 'undefined') {
            console.log("GIF Asset handler registered.");
        }
    }

    public async init(): Promise<void> {
        if (this.isInitialized) {
            return;
        }
        console.log(`${this.constructor.name}: Initializing...`);

        try {
            const placeholder = new PIXI.Text('Initializing MultipleChoiceGame...', { fill: 0xffffff });
            this.view.addChild(placeholder);

            await this.loadQuestionData();
            await this.preloadQuestionMedia(this.questionsData);

            await ensureFontIsLoaded('Grandstander');

            this.setupInitialScene();
            this.setupTimerDisplay();

            this.eventBus.on(TIMER_EVENTS.TIMER_COMPLETED, this.handleTimerComplete);
            this.eventBus.on(TIMER_EVENTS.TIMER_TICK, this.handleTimerTick);

            if (this.questionsData.length > 0) {
                this.showQuestion(this.currentQuestionIndex);
            } else {
                const specificConfig = this.config as unknown as MultipleChoiceGameConfig;
                console.error("No questions loaded for quiz:", specificConfig.quizId);
                throw new Error("No questions loaded.");
            }

            this.isInitialized = true;
            console.log(`${this.constructor.name}: Initialized successfully.`);

        } catch (error) {
            console.error(`Error initializing ${this.constructor.name}:`, error);
            this.isGameOver = true;
            this.eventBus.off(TIMER_EVENTS.TIMER_COMPLETED, this.handleTimerComplete);
            this.eventBus.off(TIMER_EVENTS.TIMER_TICK, this.handleTimerTick);
            throw error;
        }
    }

    private setupInitialScene(): void {
        // Create scene, passing necessary managers
        if (!this.questionScene) {
            // Pass the eventBus (and other managers if needed) from the game to the scene
            this.questionScene = new QuestionScene(this.eventBus);
            // Add the scene instance itself (which is a Container) to the game's view
            this.view.addChild(this.questionScene);
            console.log("QuestionScene created and added to the game view.");
        } else {
             console.log("QuestionScene already exists.");
        }
    }

    public update(): void {
        if (!this.isInitialized || this.isGameOver) {
            return;
        }
    }

    public render(): void {
    }

    public destroy(): void {
        if (!this.isInitialized) {
            return;
        }
        console.log(`${this.constructor.name}: Destroying...`);

        this.eventBus.off(TIMER_EVENTS.TIMER_COMPLETED, this.handleTimerComplete);
        this.eventBus.off(TIMER_EVENTS.TIMER_TICK, this.handleTimerTick);

        this.timerManager.removeTimer(this.QUESTION_TIMER_ID);

        if (this.questionScene) {
            this.questionScene.destroy({ children: true });
            this.questionScene = undefined;
        }

        if (this.timerDisplay) {
            this.timerDisplay.destroy();
            this.timerDisplay = undefined;
        }

        this.view.removeChildren();
        this.isInitialized = false;
        console.log(`${this.constructor.name}: Destroy complete.`);
    }

    private positionTimerDisplay(): void {
        if (!this.timerDisplay) return;
        const screenWidth = 800;
        const screenHeight = 600;
        this.timerDisplay.x = screenWidth * 0.85;
        this.timerDisplay.y = screenHeight * 0.1;
        this.timerDisplay.anchor.set(0.5, 0);
    }

    private async loadQuestionData(): Promise<void> {
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

    private async preloadQuestionMedia(questions: QuestionData[]): Promise<void> {
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

    private showQuestion(index: number): void {
        if (!this.questionScene || index >= this.questionsData.length) {
            console.log("Invalid question index or scene not ready:", index);
            if (!this._hasTriggeredGameOver) {
                this.triggerGameOver();
            }
            return;
        }

        this.timerManager.removeTimer(this.QUESTION_TIMER_ID);

        const question: QuestionData = this.questionsData[index];

        this.questionScene.clearAnswerOptions();
        this.answerButtons = [];

        console.log("MultipleChoiceGame.ts:233 QuestionScene.updateQuestion call temporarily commented out."); // Keep this log for now
        this.questionScene.updateQuestion(question.question, question.imageUrl); // <-- UNCOMMENTED and CORRECTED this line

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

        const optionsContainer = this.questionScene.getAnswerOptionContainer();
        const screenWidth = 800;
        const buttonWidth = screenWidth * 0.4 - 20;
        const buttonHeight = 80;
        const gap = 20;
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

            button.onPress.connect(() => {
                // *** Call the actual answer handling logic ***
                this.handleAnswerSelected(question.id, option.id);
            });
            button.onHover.connect(() => button.view.tint = 0xDDDDDD);
            button.onOut.connect(() => button.view.tint = 0xFFFFFF);
            button.onDown.connect(() => button.view.scale.set(0.95));
            button.onUp.connect(() => button.view.scale.set(1.0));
            button.onUpOut.connect(() => button.view.scale.set(1.0));

            optionsContainer.addChild(button.view);
            this.answerButtons.push(button);
        });

        optionsContainer.x = (screenWidth / 2) - (columns * buttonWidth + (columns - 1) * gap) / 2;
        optionsContainer.y = 300;

        const specificConfig = this.config as unknown as MultipleChoiceGameConfig;
        const questionDuration = specificConfig.intensityTimeLimit * 1000;

        this.timerManager.createTimer(this.QUESTION_TIMER_ID, questionDuration, TimerType.COUNTDOWN);
        this.timerManager.startTimer(this.QUESTION_TIMER_ID);

        console.log(`Created and started timer ${this.QUESTION_TIMER_ID} for ${questionDuration}ms`);

        if (this.timerDisplay) {
             this.timerDisplay.text = this.formatTime(questionDuration);
        }
    }

    private handleAnswerSelected(questionId: string, selectedGeneratedOptionId: string): void {
        console.log(`handleAnswerSelected triggered! questionId: ${questionId}, selectedOptionId: ${selectedGeneratedOptionId}`);
        this.timerManager.removeTimer(this.QUESTION_TIMER_ID);

        if (this.isGameOver) {
             return;
         }
        this.setAnswerButtonsEnabled(false);

        const question = this.questionsData.find(q => q.id === questionId);
        if (!question) return;

        const generatedOptions = (question.answers || []).map((answerText, i) => ({
            id: `${question.id}-opt-${i}`,
            text: answerText,
            isCorrect: answerText === question.correctAnswer
        }));
        const selectedOption = generatedOptions.find(o => o.id === selectedGeneratedOptionId);
        if (!selectedOption) return;

        const isCorrect = !!selectedOption.isCorrect;
        const currentTeamId = this.config.teams[this.activeTeamIndex]?.id;
        console.log(`Answer selected: ${selectedGeneratedOptionId}, Correct: ${isCorrect}, Team: ${currentTeamId}`);

        this.showAnswerFeedback(generatedOptions);

        // Emit ANSWER_SELECTED event using imported type and payload
        const payload: AnswerSelectedPayload = {
            questionId,
            selectedOptionId: selectedGeneratedOptionId,
            isCorrect,
            teamId: currentTeamId
        };
        // Emit using the correctly typed event from GAME_EVENTS
        this.eventBus.emit(GAME_EVENTS.ANSWER_SELECTED, payload);

        // Direct scoring logic removed - RuleEngine should handle this
        if (isCorrect && currentTeamId !== undefined) {
            this.scoringManager.addScore(currentTeamId, POINTS_PER_CORRECT_ANSWER);
            console.log(`Awarded ${POINTS_PER_CORRECT_ANSWER} points to team ${currentTeamId}. New score: ${this.scoringManager.getScore(currentTeamId)}`);
        }

        // Advance team index
        this.activeTeamIndex = (this.activeTeamIndex + 1) % this.config.teams.length;
        console.log(`Next active team index: ${this.activeTeamIndex}`);

        const isLastQuestion = this.currentQuestionIndex >= this.questionsData.length - 1;

        setTimeout(() => {
            if (this.isGameOver) return;
            if (isLastQuestion) {
                this.triggerGameOver();
            } else {
                this.currentQuestionIndex++;
                this.showQuestion(this.currentQuestionIndex);
                this.setAnswerButtonsEnabled(true);
            }
        }, 1500);
    }

    private showAnswerFeedback(generatedOptions: { id: string; text: string; isCorrect?: boolean }[]): void {
         this.answerButtons.forEach((button, index) => {
             if (index >= generatedOptions.length) return;
             const option = generatedOptions[index];
             const buttonView = button.view as PIXI.Graphics;

             if (option.isCorrect) {
                 buttonView.tint = 0x90EE90;
             } else {
                 buttonView.tint = 0xE0E0E0;
                 buttonView.alpha = 0.7;
             }
         });
    }

    private setAnswerButtonsEnabled(enabled: boolean): void {
         this.answerButtons.forEach(button => {
             button.enabled = enabled;
             button.view.alpha = enabled ? 1.0 : 0.6;
         });
     }

    private triggerGameOver(): void {
        if (!this.isGameOver) {
             console.warn("triggerGameOver called unexpectedly when isGameOver was false. Setting flag now.");
             this.isGameOver = true;
        } else {
             console.log("triggerGameOver called while isGameOver is true (expected).");
        }

        if (this._hasTriggeredGameOver) {
             console.log("triggerGameOver: Already triggered. Skipping emission/cleanup.");
             return;
         }
        this._hasTriggeredGameOver = true;

        console.log("Triggering Game Over (Emission/Cleanup)");
        this.setAnswerButtonsEnabled(false);

        // Final scores can be retrieved by listeners from ScoringManager
        // const finalScoresData = this.scoringManager.getAllTeamData();
        // const finalScores: PlayerScoreData[] = ... map data ...
        // let winner: string | undefined = ... calculate winner ...

        // Emit GAME_ENDED event via EventBus (no payload needed)
        this.eventBus.emit(GAME_STATE_EVENTS.GAME_ENDED);
        console.log(`Emitted ${GAME_STATE_EVENTS.GAME_ENDED} event.`);

        if (this.questionScene) {
            console.log("Clearing question scene content on game over trigger");
            this.questionScene.clearAnswerOptions();
        }
    }

    private handleTimerComplete = (payload: TimerEventPayload): void => {
        if (payload.timerId !== this.QUESTION_TIMER_ID) {
            return;
        }

        if (this.isGameOver) {
            console.log(`Timer complete ignored - game is already over (${payload.timerId})`);
            return;
        }

        this.timerCompleteCount++;
        console.log(`Timer Complete! Event received for ${payload.timerId} (Count: ${this.timerCompleteCount}) - Time ran out for question ${this.currentQuestionIndex}`);

        this.setAnswerButtonsEnabled(false);

        const question = this.questionsData[this.currentQuestionIndex];
        if (question) {
            this.showTimeUpFeedback(question);
        } else {
            console.warn(`Timer complete for question index ${this.currentQuestionIndex}, but question data not found.`);
        }

        this.activeTeamIndex = (this.activeTeamIndex + 1) % this.config.teams.length;
        console.log(`Timer ran out. No points awarded. Next team: ${this.config.teams[this.activeTeamIndex]?.name}`);

        const isLastQuestion = this.currentQuestionIndex >= this.questionsData.length - 1;

        setTimeout(() => {
            if (this.isGameOver) {
                  console.log("setTimeout in handleTimerComplete: Game is already over. Skipping further action.");
                  return;
             }

            if (isLastQuestion) {
                this.isGameOver = true;
                console.log("Last question timed out. Setting isGameOver = true.");
                this.triggerGameOver();
            } else {
                this.currentQuestionIndex++;
                console.log(`Timer expired. Advancing to question index: ${this.currentQuestionIndex}`);
                this.showQuestion(this.currentQuestionIndex);
                this.setAnswerButtonsEnabled(true);
            }
        }, 1500);
    }

    private showTimeUpFeedback(question: QuestionData): void {
        const generatedOptions = (question.answers || []).map((answerText, i) => ({
            id: `${question.id}-opt-${i}`,
            text: answerText,
            isCorrect: answerText === question.correctAnswer
        }));

        this.showAnswerFeedback(generatedOptions);
        if (this.questionScene) {
        }
    }

    private setupTimerDisplay(): void {
        this.timerDisplay = new PIXI.Text({ text: '--:--', style: { fill: 0xffffff, fontSize: 24 }});
        this.positionTimerDisplay();
        this.view.addChild(this.timerDisplay);
    }

    private handleTimerTick = (payload: TimerEventPayload): void => {
        if (payload.timerId !== this.QUESTION_TIMER_ID) {
            return;
        }
        if (this.timerDisplay && payload.remaining !== undefined) {
            this.timerDisplay.text = this.formatTime(payload.remaining);
        }
    };

    private formatTime(ms: number): string {
        const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
} 