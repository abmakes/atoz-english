import * as PIXI from 'pixi.js';
import { Button } from '@pixi/ui';
import { QuestionScene } from '../scenes/QuestionScene';
import { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication';
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { PixiSpecificConfig } from '@/lib/themes';
import { QuestionData } from '@/types';
import { TimerEventPayload, TIMER_EVENTS, ENGINE_EVENTS, GAME_STATE_EVENTS } from '@/lib/pixi-engine/core/EventTypes';
import { MultipleChoiceLayoutManager } from './MultipleChoiceLayoutManager';
import { PixiTimer } from '../ui/PixiTimer';

// Define the structure for answer options data used by the UI manager
export interface AnswerOptionUIData {
    id: string;
    text: string;
    isCorrect?: boolean; // Optional for initial setup, needed for feedback
    length: number;      // For potential styling adjustments
}

export class MultipleChoiceUIManager {
    private scene: QuestionScene;
    private pixiTimerInstance: PixiTimer;
    private initialDurationMs: number = 0;
    private answerButtons: Button[] = [];
    private readonly themeConfig: PixiSpecificConfig;
    private currentQuestionId: string | null = null;
    private currentGeneratedOptions: AnswerOptionUIData[] = [];
    private backgroundPanelDrawRafId: number | null = null;

    constructor(
        private readonly pixiApp: PixiApplication,
        private readonly eventBus: EventBus,
        private readonly assetLoader: typeof AssetLoader,
        themeConfig: PixiSpecificConfig,
        private readonly gameRef: {
            handleAnswerSelected: (questionId: string, optionId: string) => void;
            isPowerUpActive: (powerupId: string, targetId: string | number) => boolean;
            deactivatePowerUpInstance: (instanceId: string) => void;
            getPowerUpTargetId: () => string | number | undefined;
            powerUpManager: {
                isPowerUpActiveForTarget: (powerupId: string, targetId: string | number) => boolean;
                deactivatePowerUpByTypeAndTarget: (powerupId: string, targetId: string | number) => boolean;
            };
        },
        private readonly layoutManager: MultipleChoiceLayoutManager
    ) {
        this.themeConfig = themeConfig;

        // Create Scene, passing the theme config again
        this.scene = new QuestionScene(
            this.pixiApp,
            this.eventBus,
            this.assetLoader,
            this.themeConfig
        );

        // Create PixiTimer Instance using the restored themeConfig
        this.pixiTimerInstance = new PixiTimer({
             textColor: this.themeConfig.timerColor,
             progressBarColor: this.themeConfig.primaryAccent,
        });
        this.pixiTimerInstance.label = 'PixiTimerInstance';

        this._positionTimerElements();
        this._updateAndApplyLayout();

        // Listeners remain the same
        this.eventBus.on(TIMER_EVENTS.TIMER_TICK, this._handleTimerTick);
        this.eventBus.on(ENGINE_EVENTS.RESIZED, this._handleResize);
        this.eventBus.on(GAME_STATE_EVENTS.GAME_PAUSED, this._handleGamePaused);
        this.eventBus.on(GAME_STATE_EVENTS.GAME_RESUMED, this._handleGameResumed);

        console.log("UIManager: Initialized (Restored themeConfig usage).");
    }

    /**
     * Returns the root container managed by this UI manager (the scene).
     */
    public getView(): PIXI.Container {
        return this.scene;
    }

    /**
     * Returns the container holding timer UI element.
     * NOTE: Returns the PixiTimer instance itself now.
     */
    public getTimerContainer(): PIXI.Container {
        // --- Return the new timer instance ---
        return this.pixiTimerInstance;
        // --- Comment out old return ---
        // return this.timerContainer;
    }

    // --- Methods moved and adapted from MultipleChoiceGame ---

    public clearQuestionState(): void {
        this.scene.clearAnswerOptions();
        this.answerButtons = []; // Clear internal button array
        this.currentQuestionId = null;
        this.currentGeneratedOptions = [];
    }

    public updateQuestionContent(question: QuestionData): void {
        console.log("UIManager: Updating question content");
        this.scene.updateQuestion(question.question, question.imageUrl);
        
        // Add layout update after content change
        console.log("UIManager: Triggering layout update after content change");
        this._updateAndApplyLayout();
    }

    public setupAnswerButtons(
        questionId: string,
        generatedOptions: AnswerOptionUIData[]
    ): void {
        console.log("UIManager: Starting setupAnswerButtons");
        // --- GUARD CLAUSE ---
        if (!this.gameRef || !this.gameRef.powerUpManager) {
            console.error("[UIManager.setupAnswerButtons] Error: gameRef or gameRef.powerUpManager is not available!", { gameRefExists: !!this.gameRef, powerUpManagerExists: !!this.gameRef?.powerUpManager });
            // Optionally clear buttons or show an error state if appropriate
            this.scene.clearAnswerOptions();
            this.answerButtons = [];
            return; // Exit the function to prevent the error
        }
        // --- END GUARD CLAUSE ---

        // +++ Store questionId and options +++
        this.currentQuestionId = questionId;
        // Ensure to store a copy if generatedOptions might be mutated by 50/50 logic later in this function
        // and you want to preserve the original set for potential re-setup.
        // If 50/50 logic always takes the original `generatedOptions` and returns a new list for `optionsToDisplay`,
        // then storing `generatedOptions` as is, is fine.
        // Let's assume `generatedOptions` is the full list and `optionsToDisplay` is derived.
        this.currentGeneratedOptions = [...generatedOptions]; // Store a copy of the full set
        // +++ End store +++

        // We need layout params *now*
        const params = this.layoutManager.getLayoutParams();
        const { width: screenWidth, height: screenHeight } = this.pixiApp.getScreenSize(); // Needed for fallback/theme

        // Recalculate container bounds here as well, to ensure consistency
        const sidePad = params.sidePadding;
        const bottomPad = params.bottomPadding;
        const contentWidth = screenWidth - 2 * sidePad;
        const buttonContainerHeight = params.answerButtonHeightMultiplier * screenHeight;
        const buttonContainerY = screenHeight - bottomPad - buttonContainerHeight;
        const buttonContainerBounds = new PIXI.Rectangle(sidePad, buttonContainerY, contentWidth, buttonContainerHeight);
        // ---

        // Use the restored themeConfig
        const pixiTheme = this.themeConfig;
        const buttonFill = pixiTheme.buttonFillColor;
        const buttonText = pixiTheme.buttonTextColor;
        const buttonFont = pixiTheme.fontFamilyTheme;
        const borderColor = pixiTheme.primaryAccent;
        const shadowColor = pixiTheme.primaryAccentHover;
        const borderWidth = 3;
        const shadowOffsetX = 4;
        const shadowOffsetY = 6;
        const borderRadius = 16;
        const columns = params.answerColumns;
        const gap = params.answerButtonGap;
        const buttonWidth = screenWidth * 0.4 - 20;
        const buttonHeight = 90;
        const buttonFontSize = params.answerButtonFontSize;

        // --- 50/50 Power-up Logic ---
        const currentTeamId = this.gameRef.getPowerUpTargetId();
        let optionsToDisplay = [...generatedOptions];

        // Add check here too for safety, although the top guard should catch it
        const powerUpManager = this.gameRef.powerUpManager;
        if (!powerUpManager) {
             console.error("[UIManager.setupAnswerButtons] PowerUpManager became unavailable during execution?");
             return;
        }

        const fiftyFiftyActive = currentTeamId ? powerUpManager.isPowerUpActiveForTarget('fifty_fifty', currentTeamId) : false;

        if (fiftyFiftyActive && currentTeamId) {
            console.log(`[UIManager] 50/50 power-up ACTIVE for team ${currentTeamId}. Applying effect.`);
            const correctOption = optionsToDisplay.find(opt => opt.isCorrect);
            const incorrectOptions = optionsToDisplay.filter(opt => !opt.isCorrect);

            if (correctOption && incorrectOptions.length > 1) {
                const incorrectToKeep = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
                optionsToDisplay = [correctOption, incorrectToKeep].sort(() => Math.random() - 0.5);
            } else {
                 console.warn("[UIManager] 50/50 active, but couldn't apply effect (not enough incorrect options?).");
            }

            console.log(`[UIManager] Attempting to deactivate 'fifty_fifty' for target ${currentTeamId} after use.`);
            // Use the safe reference
            const deactivated = powerUpManager.deactivatePowerUpByTypeAndTarget('fifty_fifty', currentTeamId);
            if (!deactivated) {
                 console.error(`[UIManager] Failed to deactivate 'fifty_fifty' for target ${currentTeamId}. Was it already removed?`);
            }

        } else {
             // console.log(`[UIManager] 50/50 not active for team ${currentTeamId}`); // Optional log
        }
        // --- End 50/50 ---

        this.scene.clearAnswerOptions();
        this.answerButtons = [];
        const optionsContainer = this.scene.getAnswerOptionContainer();

        // --- Calculate starting X position to center the grid ---
        const numColumns = Math.min(columns, optionsToDisplay.length);
        const totalButtonWidth = numColumns * buttonWidth;
        const totalShadowWidth = numColumns * shadowOffsetX;
        const totalGapWidth = Math.max(0, numColumns - 1) * gap;
        const totalGridWidth = totalButtonWidth + totalShadowWidth + totalGapWidth;
        // Center the grid within the available container width
        const startX = (buttonContainerBounds.width - totalGridWidth) / 2;
        // ADD A CHECK/LOG:
        if (totalGridWidth > buttonContainerBounds.width) {
             console.warn(`UIManager: Button grid width (${totalGridWidth}) exceeds container width (${buttonContainerBounds.width}). Buttons might overlap or clip.`);
        }
        console.log("UIManager: Button grid centering:", { containerW: buttonContainerBounds.width, gridW: totalGridWidth, startX });
        // ---

        optionsToDisplay.forEach((option, i) => {
            const buttonView = new PIXI.Graphics();
            // Draw using themeConfig values
            buttonView.roundRect(shadowOffsetX, shadowOffsetY, buttonWidth, buttonHeight, borderRadius).fill(shadowColor);
            buttonView.roundRect(0, 0, buttonWidth, buttonHeight, borderRadius).fill(borderColor);
            const innerRadius = Math.max(0, borderRadius - borderWidth);
            buttonView.roundRect(borderWidth, borderWidth, buttonWidth - (2 * borderWidth), buttonHeight - (2 * borderWidth), innerRadius).fill(buttonFill);

            let wordWrap = false;
            if (option.text.length > 20) { wordWrap = true; }
             const textStyle = {
                 fontSize: buttonFontSize,
                 fill: buttonText,
                 fontFamily: buttonFont,
                 wordWrap: wordWrap,
                 wordWrapWidth: (buttonWidth - 2 * borderWidth) * 0.8,
                 align: 'center' as const
             };
             const buttonTextElement = new PIXI.Text({ text: option.text, style: textStyle });
             buttonTextElement.anchor.set(0.5);
             buttonTextElement.x = buttonWidth / 2;
             buttonTextElement.y = buttonHeight / 2;
             buttonView.addChild(buttonTextElement);
             buttonView.hitArea = new PIXI.Rectangle(0, 0, buttonWidth, buttonHeight);

            const button = new Button(buttonView);
            button.view.interactive = true;

            // --- Position Button WITHIN the Container (using reverted dimensions) ---
            const col = i % columns;
            const row = Math.floor(i / columns);
            button.view.x = startX + col * (buttonWidth + gap + shadowOffsetX);
            button.view.y = row * (buttonHeight + gap + shadowOffsetY);
            // ---

            button.onPress.connect(() => {
                this.gameRef.handleAnswerSelected(questionId, option.id);
            });

            this._setupButtonInteractionEffects(button);
            optionsContainer.addChild(button.view);
            this.answerButtons.push(button);
        });

        // Position the container using calculated bounds (this part of new logic is ok)
        optionsContainer.x = buttonContainerBounds.x;
        optionsContainer.y = buttonContainerBounds.y;
        // ---

        // Trigger background redraw after setup
        console.log("UIManager: Finished setupAnswerButtons (Restored themeConfig usage).");
    }

    private _setupButtonInteractionEffects(button: Button): void {
        // Use theme colors if desired, otherwise keep simple tints
        const hoverTint = 0xDDDDDD;
        const defaultTint = 0xFFFFFF;
        button.onHover.connect(() => button.view.tint = hoverTint);
        button.onOut.connect(() => button.view.tint = defaultTint);
        button.onDown.connect(() => button.view.scale.set(0.95));
        button.onUp.connect(() => button.view.scale.set(1.0));
        button.onUpOut.connect(() => button.view.scale.set(1.0));
    }

    public drawBackgroundPanel(
        textBoundsConfigFromLayout: PIXI.Rectangle | null, // Config for text area
        mediaBounds: PIXI.Rectangle | null, // Not directly used in this simplified version for bg panel geometry
        buttonContainerBounds: PIXI.Rectangle | null // Config for button area
    ): void {
        console.log("UIManager: Drawing simplified background panel with config bounds:", { textBoundsConfigFromLayout, buttonContainerBounds });
        const padding = 20;
        const borderRadius = 20;
        const bgColor = this.themeConfig.panelBg;

        if (!this.scene) {
            console.warn("UIManager.drawBackgroundPanel: Scene is not available.");
            return;
        }

        const screenWidth = this.pixiApp.getScreenSize().width;
        let bgX = 0, bgY = 0, bgWidth = 0, bgHeight = 0;

        const optionsContainer = this.scene.getAnswerOptionContainer();
        const actualButtonGridWidth = (optionsContainer && optionsContainer.width > 0) ? optionsContainer.width : 0;

        const actualTextBounds = this.scene.getQuestionTextBounds();
        const actualTextWidth = (actualTextBounds && actualTextBounds.width > 0) ? actualTextBounds.width : 0;

        // 1. Calculate bgWidth
        if (actualButtonGridWidth > 0) {
            bgWidth = actualButtonGridWidth + (2 * padding);
        } else if (actualTextWidth > 0) {
            bgWidth = actualTextWidth + (2 * padding);
        } else {
            // No content to determine width, so clear/don't draw panel
            this.scene.drawBackgroundPanel(0, 0, 0, 0, 0, 0);
            console.warn("UIManager.drawBackgroundPanel: No content (text or buttons) to determine panel width.");
            return;
        }

        // 2. Calculate bgX (Center panel horizontally on screen)
        bgX = (screenWidth - bgWidth) / 2;

        // 3. Calculate bgY and bgHeight (to vertically encompass text and buttons)
        let overallMinY = Infinity, overallMaxY = -Infinity;
        let hasVerticalContent = false;

        if (actualTextBounds && actualTextBounds.width > 0 && actualTextBounds.height > 0) {
            overallMinY = Math.min(overallMinY, actualTextBounds.y);
            overallMaxY = Math.max(overallMaxY, actualTextBounds.y + actualTextBounds.height);
            hasVerticalContent = true;
        }

        if (buttonContainerBounds && optionsContainer && optionsContainer.height > 0) {
            // Use buttonContainerBounds.y for the top of the button area,
            // and add optionsContainer.height (actual height of buttons) for the bottom.
            overallMinY = Math.min(overallMinY, buttonContainerBounds.y);
            overallMaxY = Math.max(overallMaxY, buttonContainerBounds.y + optionsContainer.height);
            hasVerticalContent = true;
        }

        if (hasVerticalContent) {
            bgY = overallMinY - padding;
            bgHeight = (overallMaxY - overallMinY) + (2 * padding);
        } else {
            // No vertical content, clear/don't draw
            this.scene.drawBackgroundPanel(0, 0, 0, 0, 0, 0);
            console.warn("UIManager.drawBackgroundPanel: No vertical content (text or buttons) to determine panel height.");
            return;
        }
        
        console.log("UIManager: Simplified Background panel calculated:", { bgX, bgY, bgWidth, bgHeight });

        // Ensure sensible dimensions before drawing
        if (bgWidth > padding && bgHeight > padding) { 
            this.scene.drawBackgroundPanel(bgX, bgY, bgWidth, bgHeight, bgColor, borderRadius);
        } else {
            console.warn("UIManager.drawBackgroundPanel: Calculated panel dimensions are too small or invalid.", { bgWidth, bgHeight });
            this.scene.drawBackgroundPanel(0, 0, 0, 0, 0, 0); // Clear if invalid
        }
    }

    public showAnswerFeedback(
        generatedOptions: AnswerOptionUIData[],
        selectedOptionId: string | null
    ): void {
         const pixiTheme = this.themeConfig;

         // --- Define Colors for Feedback States ---
         const correctFill = '#E0F6EE';
         const correctBorder = '#57D255'; // Example correct border
         const correctShadow = '#3F8C33'; // Example correct shadow

         const incorrectSelectedFill = '#EEE4EF';
         const incorrectSelectedBorder = '#EB6D9B'; // Example incorrect-selected border
         const incorrectSelectedShadow = '#FF1F6B'; // Example incorrect-selected shadow

         // For incorrect & not selected, we can use the defaults or define specific faded ones
         const incorrectUnselectedFill = pixiTheme.buttonFillColor; // Keep original fill? Or make grey?
         const incorrectUnselectedBorder = pixiTheme.primaryAccent; // Keep original border?
         const incorrectUnselectedShadow = pixiTheme.primaryAccentHover; // Keep original shadow?
         const incorrectUnselectedAlpha = 0.6; // Fade it more

         // Default/Base Colors (used for calculation)
         const defaultBorderColor = pixiTheme.primaryAccent;
         const defaultShadowColor = pixiTheme.primaryAccentHover;
         const defaultFillColor = pixiTheme.buttonFillColor;
         const defaultAlpha = 1.0;

         // Constants for drawing
         const borderWidth = 3;
         const shadowOffsetX = 4;
         const shadowOffsetY = 6;
         const borderRadius = 16;
         // --- End Color Definitions ---


         this.answerButtons.forEach((button, index) => {
             if (index >= generatedOptions.length) return;
             const option = generatedOptions[index];

             const buttonView = button.view as PIXI.Graphics;
             // Calculate dimensions needed *before* clearing
             const buttonWidth = buttonView.width - shadowOffsetX;
             const buttonHeight = buttonView.height - shadowOffsetY;
             const innerRadius = Math.max(0, borderRadius - borderWidth);

             // --- Determine Styles Based on State ---
             let currentFill: string | number = defaultFillColor;
             let currentBorder: string | number = defaultBorderColor;
             let currentShadow: string | number = defaultShadowColor;
             let currentAlpha: number = defaultAlpha;

             if (option.isCorrect) {
                 // Style for CORRECT answer
                 currentFill = correctFill;
                 currentBorder = correctBorder;
                 currentShadow = correctShadow;
                 currentAlpha = defaultAlpha; // Ensure it's fully visible
             } else {
                 // Style for INCORRECT answers
                 if (option.id === selectedOptionId) {
                     // Style for INCORRECT answer *selected by user*
                     currentFill = incorrectSelectedFill;
                     currentBorder = incorrectSelectedBorder;
                     currentShadow = incorrectSelectedShadow;
                     currentAlpha = defaultAlpha; // Ensure it's fully visible
                 } else {
                     // Style for INCORRECT answer *not selected*
                     currentFill = incorrectUnselectedFill; // Or a specific faded color
                     currentBorder = incorrectUnselectedBorder; // Or a specific faded color
                     currentShadow = incorrectUnselectedShadow; // Or a specific faded color
                     currentAlpha = incorrectUnselectedAlpha; // Apply fade
                 }
             }
             // --- End Style Determination ---

             // --- Apply Styles ---
             buttonView.clear(); // Clear previous drawings
             buttonView.alpha = currentAlpha; // Apply overall transparency first

             // Draw shadow with current shadow color
             buttonView.roundRect(shadowOffsetX, shadowOffsetY, buttonWidth, buttonHeight, borderRadius).fill(currentShadow);
             // Draw border with current border color
             buttonView.roundRect(0, 0, buttonWidth, buttonHeight, borderRadius).fill(currentBorder);
             // Draw main fill with current fill color
             buttonView.roundRect(borderWidth, borderWidth, buttonWidth - (2 * borderWidth), buttonHeight - (2 * borderWidth), innerRadius ).fill(currentFill);
             // --- End Apply Styles ---
         });
    }

    public setAnswerButtonsEnabled(enabled: boolean): void {
         this.answerButtons.forEach(button => {
             button.enabled = enabled;
             button.view.alpha = enabled ? 1.0 : 0.6;
         });
     }

    private _positionTimerElements(): void {
        const { width: screenWidth, height: screenHeight } = this.pixiApp.getScreenSize();
        const params = this.layoutManager.getLayoutParams();
        
        // Position timer container using layout parameters
        const targetX = screenWidth - 64 - params.sidePadding;
        const targetY = screenHeight * 0.2; // Could add timer position to LayoutParameters if needed
        
        // --- Position the new PixiTimer instance ---
        this.pixiTimerInstance.x = targetX;
        this.pixiTimerInstance.y = targetY;
    }

    private _updateAndApplyLayout(): void {
        console.log("UIManager: Starting _updateAndApplyLayout");
        const { width: screenWidth, height: screenHeight } = this.pixiApp.getScreenSize();

        // 1. Get Layout Parameters
        this.layoutManager.updateLayout(screenWidth, screenHeight);
        const params = this.layoutManager.getLayoutParams();
        console.log("UIManager: Got layout params:", params);

        // 2. Calculate Concrete Bounds for Major Regions
        const topPad = params.topPadding;
        const sidePad = params.sidePadding;
        const bottomPad = params.bottomPadding;
        const contentWidth = screenWidth - 2 * sidePad;

        // -- Button Container Bounds --
        const buttonContainerHeight = params.answerButtonHeightMultiplier * screenHeight; // Approx height based on params
        const buttonContainerY = screenHeight - bottomPad - buttonContainerHeight;
        const buttonContainerBounds = new PIXI.Rectangle(
            sidePad,
            buttonContainerY,
            contentWidth,
            buttonContainerHeight
        );
        console.log("UIManager: Calculated Button Container Bounds:", buttonContainerBounds);

        // -- Text Bounds (Configuration for the scene) -- Renamed to textBoundsConfig
        const textY = screenHeight * params.questionYMultiplier;
        const textWidth = contentWidth * params.questionWrapMultiplier;
        const textX = (screenWidth - textWidth) / 2;
        const approxMaxTextHeight = buttonContainerY - textY - topPad;
        const textBoundsConfig = new PIXI.Rectangle(
            textX,
            textY,
            textWidth,
            Math.max(50, approxMaxTextHeight)
        );
         console.log("UIManager: Calculated Text Bounds Config:", textBoundsConfig);

        // -- Media Bounds (Space between top and text) --
        let mediaBounds: PIXI.Rectangle | null = null;
        const mediaTop = topPad;
        const mediaBottom = textBoundsConfig.y - topPad; // Use config Y
        const mediaHeight = Math.max(10, mediaBottom - mediaTop);
        if (mediaHeight > 10) { 
            mediaBounds = new PIXI.Rectangle(
                sidePad,
                mediaTop,
                contentWidth,
                mediaHeight
            );
            console.log("UIManager: Calculated Media Bounds:", mediaBounds);
        } else {
             console.log("UIManager: Not enough space for media bounds.");
        }


        // 3. Update Scene Layout (passing textBoundsConfig)
        console.log("UIManager: Updating scene layout");
        this.scene.updateLayout(textBoundsConfig, mediaBounds, params, screenWidth);

        // 4. Update Timer Position
        this._positionTimerElements();

        // 5. Update Answer Buttons (passing bounds)
        if (this.answerButtons.length > 0 && this.currentQuestionId && this.currentGeneratedOptions.length > 0) {
            console.log("UIManager: Re-setting up answer buttons due to layout update using stored data.");
            // Pass the stored question ID and a copy of the stored options
            // The `setupAnswerButtons` method will use the latest layout params internally.
            this.setupAnswerButtons(this.currentQuestionId, [...this.currentGeneratedOptions]);
        } else if (this.answerButtons.length > 0) {
            // This might be a fallback if, for some reason, currentQuestionId/Options are not set
            // but buttons exist. This case should ideally not happen if state is managed correctly.
            console.log("UIManager: Only repositioning answer buttons container (fallback, full re-setup preferred).");
            this._repositionAnswerButtonsContainer(buttonContainerBounds);
        }
        // If setupAnswerButtons is called later, it will use the new bounds.

        // 6. Redraw Background Panel (passing textBoundsConfig)
        console.log("UIManager: Scheduling background panel draw");
        if (this.backgroundPanelDrawRafId) {
            cancelAnimationFrame(this.backgroundPanelDrawRafId);
        }
        this.backgroundPanelDrawRafId = requestAnimationFrame(() => {
            this.drawBackgroundPanel(textBoundsConfig, mediaBounds, buttonContainerBounds);
            this.backgroundPanelDrawRafId = null;
        });

        console.log("UIManager: Finished _updateAndApplyLayout");
    }

    private _handleResize = (): void => {
        console.log("[UIManager._handleResize] Resize event received. Updating layout...");
        this._updateAndApplyLayout();
    };

    private _handleTimerTick = (payload: TimerEventPayload): void => {
        if (payload.remaining !== undefined) {
            // --- Update PixiTimer Display ---
            this.pixiTimerInstance.updateDisplay(payload.remaining, this.initialDurationMs);            
        }
    };
    
    /**
     * Public method for game to update timer display when timer starts.
     * Stores the initial duration and updates UI.
     */
    public updateTimerDisplay(timeMs: number): void {
        console.log(`UIManager: updateTimerDisplay called with ${timeMs}ms`);
        this.initialDurationMs = Math.max(1, timeMs); // Store duration, prevent div by zero
        // --- Update PixiTimer Display ---
        this.pixiTimerInstance.updateDisplay(timeMs, this.initialDurationMs);
    }

    // --- Add Pause/Resume Handlers ---
    private _handleGamePaused = (): void => {
        console.log("UIManager: Received GAME_PAUSED. Pausing PixiTimer visually.");
        this.pixiTimerInstance?.pause(); // Add null check just in case
    };

    private _handleGameResumed = (): void => {
         console.log("UIManager: Received GAME_RESUMED. Resuming PixiTimer visually.");
         this.pixiTimerInstance?.resume(); // Add null check
    };
    // --- End Add Handlers ---

    private _repositionAnswerButtonsContainer(bounds: PIXI.Rectangle): void {
         const optionsContainer = this.scene.getAnswerOptionContainer();
         optionsContainer.x = bounds.x;
         optionsContainer.y = bounds.y;
         // Note: This doesn't resize/reposition individual buttons within
         // If button sizes change significantly, a full setup might be better
         console.log("UIManager: Repositioned options container to:", {x: bounds.x, y: bounds.y});
    }

    /**
     * Cleans up resources managed by the UI manager.
     */
    public destroy(): void {
        console.log("UIManager: Destroying...");
        // Unregister event listeners
        this.eventBus.off(TIMER_EVENTS.TIMER_TICK, this._handleTimerTick);
        this.eventBus.off(ENGINE_EVENTS.RESIZED, this._handleResize);
        // --- Unregister Pause/Resume Listeners ---
        this.eventBus.off(GAME_STATE_EVENTS.GAME_PAUSED, this._handleGamePaused);
        this.eventBus.off(GAME_STATE_EVENTS.GAME_RESUMED, this._handleGameResumed);
        // --- End Unregister ---

        // Destroy PIXI objects created and managed here
        this.scene.destroy({ children: true });
        // --- Destroy the new PixiTimer instance ---
        this.pixiTimerInstance?.destroy();
        // --- Comment out old timer destruction ---
        // this.timerContainer.destroy({ children: true });
        this.answerButtons = [];

        if (this.backgroundPanelDrawRafId) {
            cancelAnimationFrame(this.backgroundPanelDrawRafId);
            this.backgroundPanelDrawRafId = null;
        }

        console.log("UIManager: Destroy complete.");
    }
} 