import * as PIXI from 'pixi.js';
import { Button } from '@pixi/ui';
import { QuestionScene } from '../scenes/QuestionScene';
import { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication';
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { PixiSpecificConfig } from '@/lib/themes';
import { QuestionData } from '@/types';
import { TimerEventPayload, TIMER_EVENTS, ENGINE_EVENTS, GAME_STATE_EVENTS } from '@/lib/pixi-engine/core/EventTypes';
import { MultipleChoiceLayoutManager, LayoutProfile } from './MultipleChoiceLayoutManager';
import { PixiTimer } from '../ui/PixiTimer';
import { VisualEffectsManager } from '@/lib/pixi-engine/ui/VisualEffectsManager';

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
    private questionCounterText: PIXI.Text | null = null;
    private visualEffectsManager: VisualEffectsManager;
    
    // Constants for button styling
    private readonly shadowOffsetY = 6;

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
            updateCurrentAnswerOptions: (options: AnswerOptionUIData[]) => void;
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

        // Initialize visual effects manager
        this.visualEffectsManager = new VisualEffectsManager(this.pixiApp.getApp(), this.scene);

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
        
        // Clear any ongoing visual effects
        this.visualEffectsManager.clearAllEffects();
    }

    /**
     * Updates the question counter display
     */
    public updateQuestionCounter(currentIndex: number, totalQuestions: number): void {
        if (!this.questionCounterText) {
            this._createQuestionCounter();
        }
        
        if (this.questionCounterText) {
            this.questionCounterText.text = `Question ${currentIndex + 1} of ${totalQuestions}`;
            console.log(`UIManager: Updated question counter to: ${this.questionCounterText.text}`);
        }
    }

    /**
     * Creates the question counter text element
     */
    private _createQuestionCounter(): void {
        this.questionCounterText = new PIXI.Text({
            text: 'Question 1 of 1',
            style: {
                fontFamily: this.themeConfig.fontFamilyTheme || 'Grandstander',
                fontSize: 18,
                fill: this.themeConfig.questionTextColor,
                align: 'center'
            }
        });
        
        this.questionCounterText.anchor.set(1, 0.5); // Right-align
        this.scene.addChild(this.questionCounterText);
        
        // Position immediately to avoid (0,0) flash
        this._positionQuestionCounter();
        
        console.log("UIManager: Created question counter text element");
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
        const contentWidth = screenWidth - 2 * sidePad;
        // Calculate actual button height first, then use that for container sizing
        const actualButtonHeight = Math.round(screenHeight * params.answerButtonHeightMultiplier);
        const buttonGap = params.answerButtonGap;
        // Using this.this.shadowOffsetY instead // Shadow offset from button creation
        
        // For 2x3 grid (question + 2 rows of buttons), calculate total height needed
        const totalButtonHeight = (actualButtonHeight * 3) + (buttonGap * 2 + this.shadowOffsetY * 2);
        const isMobile = screenHeight < 700; // More appropriate threshold for mobile devices
        const isTabletNonFullscreen = screenHeight >= 600 && screenHeight <= 650; // Tablet in non-fullscreen mode
        const panelPadding = isMobile ? 10 : (isTabletNonFullscreen ? 15 : 20); // Reduce padding on mobile and tablet non-fullscreen
        const buttonContainerHeight = totalButtonHeight + (panelPadding * 2); // Padding above and below
        const buttonContainerY = screenHeight - buttonContainerHeight; // Touch bottom of screen
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
        // Using this.this.shadowOffsetY instead
        const borderRadius = 16;
        const columns = params.answerColumns;
        const gap = params.answerButtonGap;
        const buttonWidth = screenWidth * 0.4 - 20;
        // Use responsive button height from layout parameters instead of hardcoded 90px
        const buttonHeight = Math.round(screenHeight * params.answerButtonHeightMultiplier);
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
        console.log(`[UIManager] 50/50 check - currentTeamId: ${currentTeamId}, fiftyFiftyActive: ${fiftyFiftyActive}`);

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
        
        // Update the game's stored answer options if 50/50 was applied
        if (fiftyFiftyActive && currentTeamId && optionsToDisplay !== generatedOptions) {
            console.log(`[UIManager] Updating game's stored answer options after 50/50 power-up`);
            this.gameRef.updateCurrentAnswerOptions(optionsToDisplay);
        }
        // --- End 50/50 ---

        this.scene.clearAnswerOptions();
        this.answerButtons = [];
        const optionsContainer = this.scene.getAnswerOptionContainer();
        
        // Add question text to the top row of the button container
        this._addQuestionToButtonContainer(optionsContainer, buttonContainerBounds, params);
        
        // Hide the original question text since it's now in the button container
        const originalQuestionText = this.scene.getQuestionText();
        if (originalQuestionText) {
            originalQuestionText.visible = false;
        }

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
            buttonView.roundRect(shadowOffsetX, this.shadowOffsetY, buttonWidth, buttonHeight, borderRadius).fill(shadowColor);
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
            button.view.eventMode = 'static';

            // --- Position Button WITHIN the Container (question takes top row, buttons start from row 1) ---
            const col = i % columns;
            const row = Math.floor(i / columns) + 1; // +1 because question takes row 0
            const panelPadding = 20; // Same as used in container calculation
            const buttonPadding = isMobile ? 10 : panelPadding; // Reduce padding on mobile
            button.view.x = startX + col * (buttonWidth + gap + shadowOffsetX);
            button.view.y = buttonPadding + row * (buttonHeight + gap + this.shadowOffsetY);
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
        console.log("UIManager: Drawing full-height background panel with config bounds:", { textBoundsConfigFromLayout, buttonContainerBounds });
        const padding = 20;
        const borderRadius = 20;
        const bgColor = this.themeConfig.panelBg;

        if (!this.scene) {
            console.warn("UIManager.drawBackgroundPanel: Scene is not available.");
            return;
        }

        if (!buttonContainerBounds) {
            console.warn("UIManager.drawBackgroundPanel: No button container bounds provided.");
            return;
        }

        // Use the button container bounds for the panel
        const bgX = buttonContainerBounds.x;
        const bgY = buttonContainerBounds.y;
        const bgWidth = buttonContainerBounds.width;
        const bgHeight = buttonContainerBounds.height;
        
        console.log("UIManager: Full-height background panel calculated:", { bgX, bgY, bgWidth, bgHeight });

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
         // Using this.this.shadowOffsetY instead
         const borderRadius = 16;
         // --- End Color Definitions ---


         this.answerButtons.forEach((button, index) => {
             if (index >= generatedOptions.length) return;
             const option = generatedOptions[index];

             const buttonView = button.view as PIXI.Graphics;
             // Calculate dimensions needed *before* clearing
             const buttonWidth = buttonView.width - shadowOffsetX;
             const buttonHeight = buttonView.height - this.shadowOffsetY;
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
             buttonView.roundRect(shadowOffsetX, this.shadowOffsetY, buttonWidth, buttonHeight, borderRadius).fill(currentShadow);
             // Draw border with current border color
             buttonView.roundRect(0, 0, buttonWidth, buttonHeight, borderRadius).fill(currentBorder);
             // Draw main fill with current fill color
             buttonView.roundRect(borderWidth, borderWidth, buttonWidth - (2 * borderWidth), buttonHeight - (2 * borderWidth), innerRadius ).fill(currentFill);
             // --- End Apply Styles ---
         });

         // Add visual effects for answer feedback
         if (selectedOptionId) {
             const selectedOption = generatedOptions.find(option => option.id === selectedOptionId);
             if (selectedOption) {
                // Find the button that was selected to get its position
                const selectedButtonIndex = generatedOptions.findIndex(option => option.id === selectedOptionId);
                if (selectedButtonIndex >= 0 && selectedButtonIndex < this.answerButtons.length) {
                    const selectedButton = this.answerButtons[selectedButtonIndex];
                    const buttonView = selectedButton.view as PIXI.Graphics;
                    
                    // Get button center position in global coordinates
                    const globalPos = buttonView.toGlobal(new PIXI.Point(buttonView.width / 2, buttonView.height / 2));
                    const buttonX = globalPos.x;
                    const buttonY = globalPos.y;
                     
                     if (selectedOption.isCorrect) {
                         // Create celebrate emoji for correct answer
                         this.visualEffectsManager.createCelebrateEmoji(buttonX, buttonY, {
                             duration: 2000,
                             scale: 1.5,
                             alpha: 0.9
                         });
                     } else {
                         // Create sad emoji for incorrect answer
                         this.visualEffectsManager.createSadEmoji(buttonX, buttonY, {
                             duration: 1500,
                             scale: 1.5,
                             alpha: 0.9
                         });
                     }
                 }
             }
         }
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
        const targetY = screenHeight * 0.25; // Moved down 3% more to give more space for question counter
        
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
        const contentWidth = screenWidth - 2 * sidePad;

        // -- Button Container Bounds --
        // Calculate actual button height first, then use that for container sizing
        const actualButtonHeight = Math.round(screenHeight * params.answerButtonHeightMultiplier);
        const buttonGap = params.answerButtonGap;
        // Using this.this.shadowOffsetY instead // Shadow offset from button creation
        
        // For 2x3 grid (question + 2 rows of buttons), calculate total height needed
        const totalButtonHeight = (actualButtonHeight * 3) + (buttonGap * 2 + this.shadowOffsetY * 2);
        const isMobile = screenHeight < 700; // More appropriate threshold for mobile devices
        const isTabletNonFullscreen = screenHeight >= 600 && screenHeight <= 650; // Tablet in non-fullscreen mode
        const panelPadding = isMobile ? 10 : (isTabletNonFullscreen ? 15 : 20); // Reduce padding on mobile and tablet non-fullscreen
        const buttonContainerHeight = totalButtonHeight + (panelPadding * 2); // Padding above and below
        const buttonContainerY = screenHeight - buttonContainerHeight; // Touch bottom of screen
        const buttonContainerBounds = new PIXI.Rectangle(
            sidePad,
            buttonContainerY,
            contentWidth,
            buttonContainerHeight
        );
        console.log("UIManager: Calculated Button Container Bounds:", buttonContainerBounds);

        // -- Text Bounds (No longer needed since question is in button container) --
        const textBoundsConfig = null; // Question text is now in button container
        console.log("UIManager: Question text moved to button container, no separate text bounds needed");

        // -- Media Bounds (Maximize space for image, remove padding on mobile) --
        let mediaBounds: PIXI.Rectangle | null = null;
        
        // On mobile and tablet non-fullscreen, remove padding completely to maximize image size
        const mediaTop = (isMobile || isTabletNonFullscreen) ? 0 : topPad;
        const mediaBottom = buttonContainerY - ((isMobile || isTabletNonFullscreen) ? 0 : topPad);
        const mediaHeight = Math.max(10, mediaBottom - mediaTop);
        
        // On mobile and tablet non-fullscreen, use more of the screen for image
        const maxImageHeight = isMobile ? screenHeight * 0.6 : (isTabletNonFullscreen ? screenHeight * 0.65 : mediaHeight);
        const finalMediaHeight = Math.min(mediaHeight, maxImageHeight);
        
        if (finalMediaHeight > 10) { 
            mediaBounds = new PIXI.Rectangle(
                sidePad,
                mediaTop,
                contentWidth,
                finalMediaHeight
            );
            console.log(`UIManager: Calculated Media Bounds (${isMobile ? 'mobile' : isTabletNonFullscreen ? 'tablet non-fullscreen' : 'maximized'}):`, mediaBounds);
        } else {
             console.log("UIManager: Not enough space for media bounds.");
        }


        // 3. Update Scene Layout (passing textBoundsConfig)
        console.log("UIManager: Updating scene layout");
        this.scene.updateLayout(textBoundsConfig, mediaBounds, params, screenWidth);
        
        // On mobile, ensure images are properly reloaded after layout update
        if (isMobile && this.currentQuestionId) {
            console.log("UIManager: Mobile device detected, ensuring image visibility after layout update");
            // Add a small delay to ensure the layout update is complete
            setTimeout(() => {
                if (this.scene && this.scene.currentQuestionMedia) {
                    this.scene.currentQuestionMedia.visible = true;
                    console.log("UIManager: Mobile image visibility restored after layout update");
                }
            }, 50);
        }

        // 4. Update Timer Position
        this._positionTimerElements();

        // 5. Update Question Counter Position
        this._positionQuestionCounter();

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
        
        // On mobile devices, add a small delay to ensure proper image loading after resize
        const screenHeight = this.pixiApp.getScreenSize().height;
        const isMobile = screenHeight < 700;
        
        if (isMobile) {
            console.log("[UIManager._handleResize] Mobile device detected, adding delay for image stability...");
            // Add a small delay to ensure the resize is complete and images can load properly
            setTimeout(() => {
                this._updateAndApplyLayout();
            }, 100);
        } else {
            this._updateAndApplyLayout();
        }
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

    private _addQuestionToButtonContainer(
        container: PIXI.Container, 
        bounds: PIXI.Rectangle, 
        params: LayoutProfile
    ): void {
        // Get the current question text from the scene
        const questionText = this.scene.getQuestionText();
        if (!questionText) return;
        
        // Create a copy of the question text for the button container
        const questionInContainer = new PIXI.Text({
            text: questionText.text,
            style: {
                fontSize: params.questionFontSize,
                fill: this.themeConfig.textColor || 0x000000,
                fontFamily: this.themeConfig.fontFamilyTheme || 'Arial',
                align: 'center',
                wordWrap: true,
                wordWrapWidth: bounds.width - 40, // Leave some padding
            }
        });
        
        // Position in the top row, centered with responsive padding
        questionInContainer.anchor.set(0.5);
        questionInContainer.x = bounds.width / 2;
        const panelPadding = 20; // Same as used in container calculation
        const isMobile = this.pixiApp.getScreenSize().height < 700; // More appropriate threshold for mobile devices
        const isTabletNonFullscreen = this.pixiApp.getScreenSize().height >= 600 && this.pixiApp.getScreenSize().height <= 800; // Tablet in non-fullscreen mode
        const questionPadding = isMobile ? 10 : (isTabletNonFullscreen ? 12 : panelPadding); // Reduce padding on mobile and tablet non-fullscreen
        questionInContainer.y = questionPadding + (Math.round(this.pixiApp.getScreenSize().height * params.answerButtonHeightMultiplier) + params.answerButtonGap + this.shadowOffsetY) / 2;
        
        container.addChild(questionInContainer);
    }

    /**
     * Positions the question counter text element
     */
    private _positionQuestionCounter(): void {
        if (!this.questionCounterText) return;

        const screenWidth = this.pixiApp.getScreenSize().width;
        const screenHeight = this.pixiApp.getScreenSize().height;
        
        // Position on the right side, below navigation buttons but above timer
        this.questionCounterText.x = screenWidth - 20; // 20px from right edge
        this.questionCounterText.y = screenHeight * 0.13; // 13% from top, moved up 2% more
        
        // Right-align the text (already set in _createQuestionCounter)
        this.questionCounterText.anchor.set(1, 0.5);
        
        console.log(`UIManager: Positioned question counter at (${this.questionCounterText.x}, ${this.questionCounterText.y})`);
    }

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

        // Destroy visual effects manager
        this.visualEffectsManager?.destroy();

        console.log("UIManager: Destroy complete.");
    }
} 