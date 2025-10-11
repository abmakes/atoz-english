import { Scene } from 'phaser';
import { EventBus } from '@/lib/phaser-engine/core/EventBus';
import { AssetLoader } from '@/lib/phaser-engine/assets/AssetLoader';
import { ENGINE_EVENTS, TIMER_EVENTS } from '@/lib/phaser-engine/core/EventTypes';
import { MultipleChoiceLayoutManager, LayoutProfile } from './MultipleChoiceLayoutManager';
import { QuestionData } from '@/types';

interface AnswerOptionUIData {
    id: string;
    text: string;
    isCorrect: boolean;
    length: number;
}

interface GameRef {
    handleAnswerSelected: (questionId: string, selectedOptionId: string) => Promise<void>;
    isPowerUpActive: (powerUpId: string, targetId: string | number) => boolean;
    deactivatePowerUpInstance: (instanceId: string) => void;
    getPowerUpTargetId: () => string | number | undefined;
    updateCurrentAnswerOptions: (options: AnswerOptionUIData[]) => void;
    powerUpManager: unknown;
}

export class MultipleChoiceUIManager {
    private scene: Scene;
    private eventBus: EventBus;
    private assetLoader: typeof AssetLoader;
    private layoutManager: MultipleChoiceLayoutManager;
    private gameRef: GameRef;
    
    // UI Containers
    private mainContainer: Phaser.GameObjects.Container;
    private questionContainer: Phaser.GameObjects.Container;
    private answerContainer: Phaser.GameObjects.Container;
    private timerContainer: Phaser.GameObjects.Container;
    
    // UI Elements
    private questionText: Phaser.GameObjects.Text | null = null;
    private questionImage: Phaser.GameObjects.Image | null = null;
    private answerButtons: Phaser.GameObjects.Container[] = [];
    private timerText: Phaser.GameObjects.Text | null = null;
    private timerBar: Phaser.GameObjects.Graphics | null = null;
    private questionCounter: Phaser.GameObjects.Text | null = null;
    
    // Layout
    private screenWidth: number;
    private screenHeight: number;
    private layoutParams: LayoutProfile;

    constructor(
        scene: Scene,
        eventBus: EventBus,
        assetLoader: typeof AssetLoader,
        screenWidth: number,
        screenHeight: number,
        layoutManager: MultipleChoiceLayoutManager,
        gameRef: GameRef
    ) {
        console.log('PhaserMultipleChoiceUIManager created');
        this.scene = scene;
        this.eventBus = eventBus;
        this.assetLoader = assetLoader;
        this.layoutManager = layoutManager;
        this.gameRef = gameRef;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.layoutParams = layoutManager.getLayoutParams();

        // Create main containers
        this.mainContainer = this.scene.add.container(0, 0);
        this.questionContainer = this.scene.add.container(0, 0);
        this.answerContainer = this.scene.add.container(0, 0);
        this.timerContainer = this.scene.add.container(0, 0);

        // Add containers to main container
        this.mainContainer.add([this.questionContainer, this.answerContainer, this.timerContainer]);

        this._bindEvents();
        this._createUIElements();
    }

    private _bindEvents(): void {
        if (this.eventBus) {
            this.eventBus.on(ENGINE_EVENTS.RESIZED, this._handleResize);
            this.eventBus.on(TIMER_EVENTS.TIMER_TICK, this._handleTimerTick);
        }
    }

    private _handleResize = (): void => {
        const { width, height } = this.scene.scale;
        this.screenWidth = width;
        this.screenHeight = height;
        this.layoutManager.updateLayout(width, height);
        this.layoutParams = this.layoutManager.getLayoutParams();
        this._updateLayout();
    }

    private _handleTimerTick = (payload: unknown): void => {
        if (payload && typeof payload === 'object' && 'timerId' in payload && 'remainingTime' in payload) {
            const timerPayload = payload as { timerId: string; remainingTime: number };
            if (timerPayload.timerId === 'multipleChoiceQuestionTimer') {
                this.updateTimerDisplay(timerPayload.remainingTime);
            }
        }
    }

    private _createUIElements(): void {
        // Create question text
        this.questionText = this.scene.add.text(0, 0, '', {
            fontSize: `${this.layoutParams.questionFontSize}px`,
            fontFamily: 'Arial, sans-serif',
            color: '#2D3748',
            align: 'center',
            wordWrap: { width: this.screenWidth * 0.8 }
        });
        this.questionText.setOrigin(0.5);
        this.questionContainer.add(this.questionText);

        // Create timer text
        this.timerText = this.scene.add.text(0, 0, '30', {
            fontSize: '32px',
            fontFamily: 'Arial, sans-serif',
            color: '#E53E3E',
            align: 'center'
        });
        this.timerText.setOrigin(0.5);
        this.timerContainer.add(this.timerText);

        // Create timer bar
        this.timerBar = this.scene.add.graphics();
        this.timerContainer.add(this.timerBar);

        // Create question counter
        this.questionCounter = this.scene.add.text(0, 0, '1/10', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#4A5568',
            align: 'center'
        });
        this.questionCounter.setOrigin(0.5);
        this.timerContainer.add(this.questionCounter);

        this._updateLayout();
    }

    private _updateLayout(): void {
        // Position question text
        if (this.questionText) {
            this.questionText.x = this.screenWidth / 2;
            this.questionText.y = this.screenHeight * this.layoutParams.questionYMultiplier;
        }

        // Position timer elements
        if (this.timerText) {
            this.timerText.x = this.screenWidth - 100;
            this.timerText.y = 50;
        }

        if (this.timerBar) {
            this.timerBar.clear();
            this.timerBar.fillStyle(0xE53E3E);
            this.timerBar.fillRect(this.screenWidth - 120, 30, 40, 20);
        }

        if (this.questionCounter) {
            this.questionCounter.x = 100;
            this.questionCounter.y = 50;
        }

        // Position answer container
        this.answerContainer.x = this.screenWidth / 2;
        this.answerContainer.y = this.screenHeight * this.layoutParams.answerContainerYMultiplier;
    }

    public updateQuestionContent(question: QuestionData): void {
        console.log('PhaserUIManager: Updating question content:', question);

        // Update question text
        if (this.questionText) {
            this.questionText.setText(question.question);
        }

        // Load and display question image if available
        if (question.imageUrl) {
            this._loadQuestionImage(question.imageUrl);
        } else {
            this._clearQuestionImage();
        }
    }

    private _loadQuestionImage(imageUrl: string): void {
        // Clear existing image
        this._clearQuestionImage();

        try {
            // Use AssetLoader to get the display object
            const displayObject = this.assetLoader.getDisplayObject(imageUrl);
            if (displayObject) {
                // Convert to Phaser Image if it's a PIXI object
                if (displayObject instanceof Phaser.GameObjects.Image) {
                    this.questionImage = displayObject;
                } else {
                    // For PIXI objects, we need to create a Phaser equivalent
                    // This is a simplified approach - in a real implementation,
                    // you'd need to handle the conversion properly
                    console.warn('PhaserUIManager: PIXI object conversion not fully implemented');
                }

                if (this.questionImage) {
                    this.questionImage.setOrigin(0.5);
                    this.questionContainer.add(this.questionImage);
                    this._positionQuestionImage();
                }
            }
        } catch (error) {
            console.error('PhaserUIManager: Error loading question image:', error);
        }
    }

    private _clearQuestionImage(): void {
        if (this.questionImage) {
            this.questionImage.destroy();
            this.questionImage = null;
        }
    }

    private _positionQuestionImage(): void {
        if (!this.questionImage) return;

        const imageTopBound = this.layoutParams.topPadding;
        const textTop = this.questionText ? this.questionText.y - this.questionText.height * 0.5 : this.screenHeight * 0.5;
        const imageBottomBound = textTop - this.layoutParams.topPadding;
        const availableHeight = Math.max(10, imageBottomBound - imageTopBound);
        
        const maxAllowedHeight = this.screenHeight * this.layoutParams.imageMaxHeightMultiplier;
        const constrainedHeight = Math.min(availableHeight, maxAllowedHeight);

        // Scale image to fit
        const scale = constrainedHeight / this.questionImage.height;
        this.questionImage.setScale(scale);

        // Position image
        this.questionImage.x = this.screenWidth / 2;
        this.questionImage.y = imageTopBound + this.questionImage.height * scale * 0.5;
    }

    public setupAnswerButtons(questionId: string, options: AnswerOptionUIData[]): void {
        console.log('PhaserUIManager: Setting up answer buttons:', options.length);

        // Clear existing buttons
        this.clearAnswerButtons();

        // Create new buttons
        options.forEach((option, index) => {
            const button = this._createAnswerButton(option, index);
            this.answerButtons.push(button);
            this.answerContainer.add(button);
        });

        this._layoutAnswerButtons();
    }

    private _createAnswerButton(option: AnswerOptionUIData, index: number): Phaser.GameObjects.Container {
        const button = this.scene.add.container(0, 0);
        
        // Create button background
        const buttonWidth = this.screenWidth * this.layoutParams.answerButtonWidthMultiplier;
        const buttonHeight = this.screenHeight * this.layoutParams.answerButtonHeightMultiplier;
        
        const background = this.scene.add.graphics();
        background.fillStyle(0x4299E1); // Blue background
        background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        background.lineStyle(2, 0x2B6CB0); // Blue border
        background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        
        // Create button text
        const buttonText = this.scene.add.text(0, 0, `${String.fromCharCode(65 + index)}. ${option.text}`, {
            fontSize: `${this.layoutParams.answerButtonFontSize}px`,
            fontFamily: 'Arial, sans-serif',
            color: '#FFFFFF',
            align: 'center',
            wordWrap: { width: buttonWidth - 20 }
        });
        buttonText.setOrigin(0.5);

        // Add elements to button container
        button.add([background, buttonText]);

        // Make button interactive
        button.setSize(buttonWidth, buttonHeight);
        button.setInteractive();

        // Add hover effects
        button.on('pointerover', () => {
            background.clear();
            background.fillStyle(0x3182CE); // Darker blue on hover
            background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            background.lineStyle(2, 0x2C5282);
            background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        });

        button.on('pointerout', () => {
            background.clear();
            background.fillStyle(0x4299E1); // Original blue
            background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            background.lineStyle(2, 0x2B6CB0);
            background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        });

        // Add click handler
        button.on('pointerdown', () => {
            this.gameRef.handleAnswerSelected(option.id.split('-')[0], option.id);
        });

        return button;
    }

    private _layoutAnswerButtons(): void {
        const buttonWidth = this.screenWidth * this.layoutParams.answerButtonWidthMultiplier;
        const buttonHeight = this.screenHeight * this.layoutParams.answerButtonHeightMultiplier;
        const gap = this.layoutParams.answerButtonGap;
        const columns = this.layoutParams.answerColumns;

        this.answerButtons.forEach((button, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            
            const x = (col - (columns - 1) / 2) * (buttonWidth + gap);
            const y = row * (buttonHeight + gap);
            
            button.x = x;
            button.y = y;
        });
    }

    public clearAnswerButtons(): void {
        this.answerButtons.forEach(button => button.destroy());
        this.answerButtons = [];
    }

    public setAnswerButtonsEnabled(enabled: boolean): void {
        this.answerButtons.forEach(button => {
            button.setInteractive(enabled);
            button.alpha = enabled ? 1.0 : 0.5;
        });
    }

    public showAnswerFeedback(options: AnswerOptionUIData[], selectedOptionId: string | null): void {
        console.log('PhaserUIManager: Showing answer feedback');

        this.answerButtons.forEach((button, index) => {
            const option = options[index];
            if (!option) return;

            const background = button.list[0] as Phaser.GameObjects.Graphics;
            
            if (selectedOptionId === option.id) {
                // Selected option
                if (option.isCorrect) {
                    background.clear();
                    background.fillStyle(0x48BB78); // Green for correct
                    background.fillRoundedRect(-button.width/2, -button.height/2, button.width, button.height, 10);
                } else {
                    background.clear();
                    background.fillStyle(0xF56565); // Red for incorrect
                    background.fillRoundedRect(-button.width/2, -button.height/2, button.width, button.height, 10);
                }
            } else if (option.isCorrect) {
                // Correct answer (not selected)
                background.clear();
                background.fillStyle(0x48BB78); // Green for correct
                background.fillRoundedRect(-button.width/2, -button.height/2, button.width, button.height, 10);
            }
        });
    }

    public updateTimerDisplay(remainingTime: number): void {
        if (this.timerText) {
            const seconds = Math.ceil(remainingTime / 1000);
            this.timerText.setText(seconds.toString());
        }
    }

    public updateQuestionCounter(currentIndex: number, totalQuestions: number): void {
        if (this.questionCounter) {
            this.questionCounter.setText(`${currentIndex + 1}/${totalQuestions}`);
        }
    }

    public clearQuestionState(): void {
        this.clearAnswerButtons();
        this._clearQuestionImage();
        if (this.questionText) {
            this.questionText.setText('');
        }
    }

    public update(): void {
        // Update any animations or dynamic elements
    }

    public getView(): Phaser.GameObjects.Container {
        return this.mainContainer;
    }

    public getTimerContainer(): Phaser.GameObjects.Container {
        return this.timerContainer;
    }

    public destroy(): void {
        if (this.eventBus) {
            this.eventBus.off(ENGINE_EVENTS.RESIZED, this._handleResize);
            this.eventBus.off(TIMER_EVENTS.TIMER_TICK, this._handleTimerTick);
        }

        this.clearAnswerButtons();
        this._clearQuestionImage();
        
        if (this.mainContainer) {
            this.mainContainer.destroy();
        }

        console.log('PhaserMultipleChoiceUIManager destroyed');
    }
}