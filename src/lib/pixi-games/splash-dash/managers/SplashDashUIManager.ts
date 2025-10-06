import * as PIXI from 'pixi.js';
// Assets import removed - using AssetLoader instead
import { GifSprite } from 'pixi.js/gif';
import { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';
// import { PixiThemeConfig } from '@/themes';
import { SplashDashLayoutManager } from './SplashDashLayoutManager';
import { QuestionData } from '@/types';
import { ENGINE_EVENTS, CONTROLS_EVENTS } from '@/lib/pixi-engine/core/EventTypes';

interface AnswerRectangleUIData {
    id: string;
    text: string;
    isCorrect: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    container: PIXI.Container;
    rectangle: PIXI.Graphics;
    label: PIXI.Text;
}

export class SplashDashUIManager {
    private app: PixiApplication;
    private eventBus: EventBus;
    private assetLoader: typeof AssetLoader;
    private themeConfig: Record<string, unknown>;
    private layoutManager: SplashDashLayoutManager;
    private view: PIXI.Container;

    private bottomUIContainer: PIXI.Container;
    private questionContainer: PIXI.Container;
    private questionText: PIXI.Text;
    private questionImage: PIXI.Sprite | null = null;
    private questionCounter: PIXI.Text;
    private answerRectangles: AnswerRectangleUIData[] = [];
    private controlButtonA: PIXI.Container;
    private controlButtonL: PIXI.Container;
    // Layout constants are now managed by SplashDashLayoutManager

    /**
     * Initializes the SplashDash UI Manager with all necessary containers, buttons, and layout components
     * Sets up the bottom UI panel, control buttons, question area, and answer rectangles for the game
     */
    constructor(
        app: PixiApplication,
        eventBus: EventBus,
        assetLoader: typeof AssetLoader,
        themeConfig: Record<string, unknown>,
        layoutManager: SplashDashLayoutManager
    ) {
        this.app = app;
        this.eventBus = eventBus;
        this.assetLoader = assetLoader;
        this.themeConfig = themeConfig;
        this.layoutManager = layoutManager;
        this.view = new PIXI.Container();
        this.view.label = 'SplashDashUI';

        // Create bottom UI container (white box)
        this.bottomUIContainer = this._createBottomUIContainer();
        this.view.addChild(this.bottomUIContainer);

        // Create question container inside bottom UI
        this.questionContainer = new PIXI.Container();
        this.questionText = this._createQuestionText();
        this.questionCounter = this._createQuestionCounter();
        
        this.questionContainer.addChild(this.questionText);
        this.questionContainer.addChild(this.questionCounter);
        this.bottomUIContainer.addChild(this.questionContainer);

        // Create control buttons
        this.controlButtonA = this._createControlButton('A', 0xFF0000); // Red
        this.controlButtonL = this._createControlButton('L', 0x0000FF); // Blue
        
        this.bottomUIContainer.addChild(this.controlButtonA);
        this.bottomUIContainer.addChild(this.controlButtonL);

        this._bindEvents();
        console.log('SplashDashUIManager created');
    }

    /**
     * Binds event listeners for window resize and control button interactions
     * Sets up responsive layout updates and player control button handlers
     */
    private _bindEvents(): void {
        if (this.eventBus && typeof this.eventBus.on === 'function') {
            this.eventBus.on(ENGINE_EVENTS.RESIZED, this._handleResize.bind(this));
        } else {
            console.warn('SplashDashUIManager: EventBus not available, skipping event binding');
        }
    }

    /**
     * Handles window resize events by updating the layout manager and refreshing UI layout
     * Ensures all UI elements maintain proper positioning and sizing on screen resize
     */
    private _handleResize(payload: { width: number; height: number }): void {
        this.layoutManager.updateLayout(payload.width, payload.height);
        this._updateLayout();
    }

    /**
     * Creates the main question text display with Grandstander font and proper word wrapping
     * Returns a centered text object that will display the current question content
     */
    private _createQuestionText(): PIXI.Text {
        const text = new PIXI.Text({
            text: "Loading Question...",
            style: {
                fontFamily: 'Grandstander',
                fontSize: 24,
                fill: 0x000000,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: 400 // Will be updated dynamically in _updateLayout
            }
        });
        text.anchor.set(0.5);
        return text;
    }

    /**
     * Creates the question counter text that displays current question number and total
     * Shows format like "Question 1 of 5" with smaller font size below the main question
     */
    private _createQuestionCounter(): PIXI.Text {
        const text = new PIXI.Text({
            text: "Question 1 of 5",
            style: {
                fontFamily: 'Grandstander',
                fontSize: 18,
                fill: 0x666666,
                align: 'center'
            }
        });
        text.anchor.set(0.5);
        return text;
    }

    /**
     * Creates the white bottom UI container that holds the question area and control buttons
     * Sets up the background rectangle and positions it at the bottom of the screen
     */
    private _createBottomUIContainer(): PIXI.Container {
        const container = new PIXI.Container();
        const screenSize = this.app.getScreenSize();
        
        // Create white background rectangle (no border)
        const params = this.layoutManager.getLayoutParams();
        console.log(`[SplashDashUIManager] Creating bottom UI - Screen: ${screenSize.width}x${screenSize.height}, bottomUIHeight: ${params.bottomUIHeight}`);
        const background = new PIXI.Graphics();
        background.clear();
        background.rect(0, 0, screenSize.width, params.bottomUIHeight);
        background.fill({color: 0xFFFFFF});
        
        container.addChild(background);
        container.y = screenSize.height - params.bottomUIHeight;
        container.alpha = 1.0; // Ensure container is fully opaque
        container.visible = true; // Ensure container is visible
        
        return container;
    }

    /**
     * Creates circular control buttons (A and L) with specified color and letter text
     * Sets up interactive events for touch/mouse input and visual feedback on hover
     */
    private _createControlButton(letter: string, color: number | string): PIXI.Container {
        const container = new PIXI.Container();
        
        // Create button background circle (no border) - try different approach
        const params = this.layoutManager.getLayoutParams();
        const circle = new PIXI.Graphics();
        
        // Use modern PixiJS v8 syntax
        circle.circle(0, 0, params.controlButtonRadius);
        circle.fill(color);
        
        // Debug: Make sure the circle is visible
        console.log(`Button ${letter} circle created with color ${color}, radius ${params.controlButtonRadius}`);
        
        console.log(`Creating ${letter} button with color ${color}, radius ${params.controlButtonRadius}`);
        
        // Create button text
        const text = new PIXI.Text({
            text: letter,
            style: {
                fontFamily: 'Grandstander',
                fontSize: 48,
                fill: 0xFFFFFF,
                align: 'center',
                fontWeight: 'bold'
            }
        });
        text.anchor.set(0.5);
        
        container.addChild(circle);
        container.addChild(text);
        
        // Make button interactive
        container.eventMode = 'static';
        container.cursor = 'pointer';
        
        // Add touch/click events
        container.on('pointerdown', () => {
            this._handleControlButtonPress(letter);
        });
        
        // Add hover effects
        container.on('pointerover', () => {
            circle.tint = 0xCCCCCC;
        });
        
        container.on('pointerout', () => {
            circle.tint = 0xFFFFFF;
        });
        
        container.alpha = 1; // Ensure container is fully opaque
        
        return container;
    }

    /**
     * Handles control button press events and emits player action events to the game engine
     * Maps button letters to player movement commands for the capybara swimming game
     */
    private _handleControlButtonPress(letter: string): void {
        console.log(`[SplashDashUIManager] Control button ${letter} pressed`);
        
        // Emit control events for player movement
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
            if (letter === 'A') {
                this.eventBus.emit(CONTROLS_EVENTS.PLAYER_ACTION, {
                    playerId: 'player1',
                    action: 'MOVE_PLAYER1',
                    value: true,
                    device: 'pointer'
                });
            } else if (letter === 'L') {
                this.eventBus.emit(CONTROLS_EVENTS.PLAYER_ACTION, {
                    playerId: 'player2',
                    action: 'MOVE_PLAYER2',
                    value: true,
                    device: 'pointer'
                });
            }
        }
    }

    /**
     * Updates the layout of all UI elements using the layout manager parameters
     * Positions control buttons, question container, image, and text based on screen dimensions
     */
    private _updateLayout(): void {
        const screenSize = this.app.getScreenSize();
        console.log(`[SplashDashUIManager] _updateLayout: Screen size ${screenSize.width}x${screenSize.height}`);
        
        this.layoutManager.updateLayout(screenSize.width, screenSize.height);
        const params = this.layoutManager.getLayoutParams();
        
        // Update bottom UI container position
        this.bottomUIContainer.y = screenSize.height - params.bottomUIHeight;
        
        // Position control buttons absolutely with padding from edges
        this.controlButtonA.x = params.controlButtonRadius + params.controlButtonPadding;
        this.controlButtonA.y = params.bottomUIHeight / 2;
        
        this.controlButtonL.x = screenSize.width - params.controlButtonRadius - params.controlButtonPadding;
        this.controlButtonL.y = params.bottomUIHeight / 2;
        
        console.log(`Button positions - A: (${this.controlButtonA.x}, ${this.controlButtonA.y}), L: (${this.controlButtonL.x}, ${this.controlButtonL.y})`);
        
        // Calculate question container width using layout manager (for reference)
        // const containerWidth = this.layoutManager.calculateQuestionContainerWidth(width);
        
        // Position question container in the center of the game area
        this.questionContainer.x = screenSize.width / 2;
        this.questionContainer.y = params.bottomUIHeight / 2;
        
        // Calculate the available space between buttons (with padding)
        const leftButtonRight = this.controlButtonA.x + params.controlButtonRadius + 20; // Add padding
        const rightButtonLeft = this.controlButtonL.x - params.controlButtonRadius - 20; // Add padding
        const availableWidth = rightButtonLeft - leftButtonRight;
        
        // Position image and text within the available space
        const imageWidth = params.questionImageWidth;
        const textAreaWidth = availableWidth - imageWidth - params.questionImagePadding;
        
        // Position question image to the left of center (moved 50px to the right)
        if (this.questionImage) {
            this.questionImage.x = -(textAreaWidth / 2) - (params.questionImagePadding / 2) + 50;
            this.questionImage.y = 0;
        }
        
        // Position question text to the right of image with padding
        this.questionText.x = (imageWidth / 2) + (params.questionImagePadding / 2);
        this.questionText.y = -20;
        
        // Position question counter below question text
        this.questionCounter.x = (imageWidth / 2) + (params.questionImagePadding / 2);
        this.questionCounter.y = 20;
        
        // Update question text wordWrapWidth to use the calculated text area width
        if (this.questionText.style) {
            this.questionText.style.wordWrapWidth = Math.max(200, textAreaWidth - 20); // Minimum width with margin
        }
        
        console.log(`[SplashDashUIManager] Layout updated - Screen: ${screenSize.width}x${screenSize.height}, Available width: ${availableWidth}, Text area: ${textAreaWidth}, Bottom UI at y=${this.bottomUIContainer.y}`);
        console.log(`[SplashDashUIManager] Question container at (${this.questionContainer.x}, ${this.questionContainer.y}), Image at (${this.questionImage?.x || 'N/A'}, ${this.questionImage?.y || 'N/A'}), Text at (${this.questionText.x}, ${this.questionText.y})`);
    }

    /**
     * Updates the question content including text, image, and counter display
     * Loads and displays question images with proper GIF animation support
     */
    public async updateQuestionContent(question: QuestionData): Promise<void> {
        console.log(`[SplashDashUIManager] updateQuestionContent: Updating question text to: "${question.question}"`);
        this.questionText.text = question.question;
        console.log(`[SplashDashUIManager] Question text updated, container visible: ${this.questionContainer.visible}, alpha: ${this.questionContainer.alpha}`);
        
        // Load and display question image if it exists
        if (question.imageUrl) {
            try {
                // Use AssetLoader.getDisplayObject for proper GIF handling
                console.log(`[SplashDashUIManager] Loading image: ${question.imageUrl}`);
                const displayObject = this.assetLoader.getDisplayObject(question.imageUrl);
                
                if (displayObject) {
                    if (this.questionImage) {
                        this.questionImage.destroy();
                    }
                    
                    // Handle different display object types (Sprite, AnimatedSprite, GifSprite)
                    const isSprite = displayObject instanceof PIXI.Sprite;
                    const isAnimatedSprite = displayObject instanceof PIXI.AnimatedSprite;
                    const isGifSprite = displayObject instanceof GifSprite;
                    
                    if (isSprite || isAnimatedSprite || isGifSprite) {
                        this.questionImage = displayObject as PIXI.Sprite;
                        this.questionImage.anchor.set(0.5);
                        
                        // Scale image to maximum 120px height while maintaining aspect ratio
                        const maxHeight = 120;
                        const scale = Math.min(maxHeight / this.questionImage.height, 1);
                        this.questionImage.scale.set(scale);
                        
                        this.questionContainer.addChild(this.questionImage);
                        this._updateLayout();
                        
                        // Handle animation for GIFs and AnimatedSprites
                        if (isAnimatedSprite || isGifSprite) {
                            console.log(`[SplashDashUIManager] Starting animation for ${displayObject.constructor.name}: ${question.imageUrl}`);
                            const animatedObject = displayObject as PIXI.AnimatedSprite | GifSprite;
                            if (!animatedObject.playing) {
                                setTimeout(() => {
                                    if (animatedObject && !animatedObject.destroyed) {
                                        animatedObject.play();
                                        console.log(`[SplashDashUIManager] Animation started for: ${question.imageUrl}`);
                                    }
                                }, 50);
                            }
                        }
                        
                        console.log(`[SplashDashUIManager] Successfully loaded image: ${question.imageUrl}`);
                    } else {
                        console.warn(`[SplashDashUIManager] Unsupported display object type for: ${question.imageUrl}`);
                    }
                } else {
                    console.warn(`[SplashDashUIManager] AssetLoader.getDisplayObject returned null for: ${question.imageUrl}`);
                }
            } catch (error) {
                console.error(`[SplashDashUIManager] Error loading question image: ${question.imageUrl}`, error);
            }
        }
        
        this._updateLayout();
    }

    /**
     * Sets up rectangular answer options for the current question with non-overlapping positioning
     * Creates interactive answer rectangles that capybaras can swim to for answering questions
     */
    public setupAnswerRectangles(questionId: string, answerOptions: { id: string; text: string; isCorrect: boolean }[]): void {
        console.log(`[SplashDashUIManager] setupAnswerRectangles: Setting up ${answerOptions.length} answer rectangles for question ${questionId}`);
        this.clearAnswerRectangles();

        const screenSize = this.app.getScreenSize();
        console.log(`[SplashDashUIManager] setupAnswerRectangles: Screen size ${screenSize.width}x${screenSize.height}`);
        
        // Get layout parameters
        const params = this.layoutManager.getLayoutParams();
        
        // Define answer area (above bottom UI, avoiding capybara spawn area and score displays)
        const capybaraSpawnY = screenSize.height * (2/3); // Capybaras spawn 1/3 up from bottom
        const scoreDisplayHeight = 120; // Reserve space for score displays in top-left
        const answerArea = {
            x: params.sidePadding * 2, // Start further right to avoid score displays
            y: scoreDisplayHeight, // Start below score displays
            width: screenSize.width - (params.sidePadding * 4), // Reduced width to account for margins
            height: capybaraSpawnY - scoreDisplayHeight - 50 // End before capybara spawn area
        };

        // Generate non-overlapping positions (using max box size for collision detection)
        const maxBoxWidth = params.answerRectangleWidth * 1.5; // 1.5x for medium/large boxes
        const maxBoxHeight = params.answerRectangleHeight * 2; // 2x for large boxes
        const positions = this._generateNonOverlappingPositions(answerOptions.length, answerArea, maxBoxWidth, maxBoxHeight);
        
        answerOptions.forEach((option, index) => {
            const position = positions[index];
            const container = new PIXI.Container();
            
            container.x = position.x;
            container.y = position.y;
            container.eventMode = 'static';
            container.cursor = 'pointer';

            // Calculate text length and determine box size tier
            const textLength = option.text.length;
            const { boxWidth, boxHeight, fontSize, wordWrapWidth } = this._calculateAnswerBoxSize(textLength, params);

            const rectangle = new PIXI.Graphics();
            rectangle.roundRect(0, 0, boxWidth, boxHeight, 8)
                     .fill(0x4F46E5); // Purple (no border)

            const text = new PIXI.Text({
                text: option.text,
                style: {
                    fontFamily: 'Grandstander',
                    fontSize: fontSize,
                    fill: 0xFFFFFF,
                    align: 'center',
                    wordWrap: true,
                    wordWrapWidth: wordWrapWidth
                }
            });
            text.anchor.set(0.5);
            text.x = boxWidth / 2;
            text.y = boxHeight / 2;

            container.addChild(rectangle);
            container.addChild(text);
            this.view.addChild(container);

            this.answerRectangles.push({
                id: option.id,
                text: option.text,
                isCorrect: option.isCorrect,
                x: position.x,
                y: position.y,
                width: boxWidth,
                height: boxHeight,
                container,
                rectangle,
                label: text
            });
        });
    }

    /**
     * Calculates appropriate box size and font size based on text length
     * Returns three tiers: standard, medium, and large boxes with appropriate font sizes
     */
    private _calculateAnswerBoxSize(textLength: number, params: { answerRectangleWidth: number; answerRectangleHeight: number; answerFontSize: number }): { boxWidth: number; boxHeight: number; fontSize: number; wordWrapWidth: number } {
        const baseWidth = params.answerRectangleWidth;
        const baseHeight = params.answerRectangleHeight;
        const baseFontSize = params.answerFontSize;
        
        // Tier thresholds
        const SHORT_THRESHOLD = 20;  // Characters
        const MEDIUM_THRESHOLD = 40; // Characters
        
        if (textLength <= SHORT_THRESHOLD) {
            // Tier 1: Short answers - standard box
            return {
                boxWidth: baseWidth,
                boxHeight: baseHeight,
                fontSize: baseFontSize,
                wordWrapWidth: baseWidth - 10
            };
        } else if (textLength <= MEDIUM_THRESHOLD) {
            // Tier 2: Medium answers - 1.5x width, 1.5x height
            const mediumWidth = baseWidth * 1.5;
            const mediumHeight = baseHeight * 1.5;
            return {
                boxWidth: mediumWidth,
                boxHeight: mediumHeight,
                fontSize: baseFontSize,
                wordWrapWidth: mediumWidth - 10
            };
        } else {
            // Tier 3: Long answers - 1.5x width, 2x height, smaller font
            const largeWidth = baseWidth * 1.5;
            const largeHeight = baseHeight * 2;
            const smallerFontSize = baseFontSize * 0.85; // 15% smaller font
            return {
                boxWidth: largeWidth,
                boxHeight: largeHeight,
                fontSize: smallerFontSize,
                wordWrapWidth: largeWidth - 10
            };
        }
    }

    /**
     * Generates non-overlapping positions for answer rectangles within the specified area
     * Uses random placement with collision detection and falls back to grid layout if needed
     */
    private _generateNonOverlappingPositions(count: number, area: { x: number; y: number; width: number; height: number }, boxWidth: number, boxHeight: number): Array<{ x: number; y: number }> {
        const positions: Array<{ x: number; y: number }> = [];
        const minDistance = 150; // Minimum distance between rectangles and from capybaras
        const maxAttempts = 100; // Prevent infinite loops
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let position: { x: number; y: number };
            let validPosition = false;
            
            do {
                position = {
                    x: area.x + Math.random() * (area.width - boxWidth),
                    y: area.y + Math.random() * (area.height - boxHeight)
                };
                
                // Check if position is valid (not overlapping with existing positions)
                validPosition = positions.every(existingPos => {
                    const distance = Math.sqrt(
                        Math.pow(position.x - existingPos.x, 2) + 
                        Math.pow(position.y - existingPos.y, 2)
                    );
                    return distance >= minDistance;
                });
                
                attempts++;
            } while (!validPosition && attempts < maxAttempts);
            
            if (validPosition) {
                positions.push(position);
            } else {
                // Fallback: place in a grid pattern if random placement fails
                const cols = Math.ceil(Math.sqrt(count));
                const col = i % cols;
                const row = Math.floor(i / cols);
                const params = this.layoutManager.getLayoutParams();
                position = {
                    x: area.x + col * (boxWidth + params.answerRectangleGap),
                    y: area.y + row * (boxHeight + params.answerRectangleGap)
                };
                positions.push(position);
            }
        }
        
        return positions;
    }

    /**
     * Clears and destroys all existing answer rectangles from the game screen
     * Removes all answer options and their containers to prepare for new question
     */
    public clearAnswerRectangles(): void {
        this.answerRectangles.forEach(ar => ar.container.destroy({ children: true }));
        this.answerRectangles = [];
    }

    /**
     * Clears the current question state by resetting text and removing question image
     * Prepares the UI for loading a new question without affecting answer rectangles
     */
    public clearQuestionState(): void {
        this.questionText.text = "";
        this.questionCounter.text = "";
        if (this.questionImage) {
            this.questionImage.destroy();
            this.questionImage = null;
        }
        this.clearAnswerRectangles();
    }

    /**
     * Updates the question counter display to show current question number and total count
     * Formats the display as "Question X of Y" below the main question text
     */
    public updateQuestionCounter(currentIndex: number, totalQuestions: number): void {
        this.questionCounter.text = `Question ${currentIndex + 1} of ${totalQuestions}`;
    }

    /**
     * Shows visual feedback for answer selection with color tinting and message display
     * Displays correct/incorrect/time up messages in a transparent white box with proper styling
     */
    public showAnswerFeedback(selectedOptionId: string | null, isCorrect: boolean): void {
        this.answerRectangles.forEach(ar => {
            if (ar.id === selectedOptionId) {
                ar.rectangle.tint = isCorrect ? 0x00FF00 : 0xFF0000; // Green for correct, Red for incorrect
            } else if (ar.isCorrect) {
                ar.rectangle.tint = 0xFFFF00; // Yellow for correct answer if not selected
            } else {
                ar.rectangle.tint = 0x888888; // Dim incorrect answers
            }
        });

        // Display feedback message in transparent white box
        const screenSize = this.app.getScreenSize();
        const width = screenSize.width;
        const height = screenSize.height;
        const feedbackContainer = new PIXI.Container();
        
        // Create transparent white background
        const background = new PIXI.Graphics();
        background.rect(-150, -40, 300, 80);
        background.fill({ color: 0xFFFFFF, alpha: 0.8 }); // Transparent white
        
        const feedbackMessage = new PIXI.Text({
            text: isCorrect ? "CORRECT!" : (selectedOptionId === null ? "TIME UP!" : "INCORRECT!"),
            style: {
                fontFamily: 'Grandstander',
                fontSize: 48,
                fill: isCorrect ? 0x00FF00 : 0xFF0000,
                align: 'center'
            }
        });
        feedbackMessage.anchor.set(0.5);
        
        feedbackContainer.addChild(background);
        feedbackContainer.addChild(feedbackMessage);
        feedbackContainer.x = width / 2;
        feedbackContainer.y = height / 2;
        
        this.view.addChild(feedbackContainer);

        setTimeout(() => {
            feedbackContainer.destroy({ children: true });
            this.answerRectangles.forEach(ar => ar.rectangle.tint = 0xFFFFFF); // Reset tints
        }, 1500);
    }

    /**
     * Returns array of answer rectangle data for collision detection and game logic
     * Provides position and size information for each answer option on the screen
     */
    public getAnswerRectangles(): { id: string; x: number; y: number; width: number; height: number }[] {
        return this.answerRectangles.map(ar => ({
            id: ar.id,
            x: ar.container.x,
            y: ar.container.y,
            width: ar.width,
            height: ar.height
        }));
    }

    // Keep the old method name for backward compatibility
    /**
     * Returns answer data in circle format for backward compatibility with existing game logic
     * Converts rectangle data to approximate circle data for legacy collision detection
     */
    public getAnswerCircles(): { id: string; x: number; y: number; radius: number }[] {
        return this.answerRectangles.map(ar => ({
            id: ar.id,
            x: ar.container.x + ar.width / 2, // Center x
            y: ar.container.y + ar.height / 2, // Center y
            radius: Math.max(ar.width, ar.height) / 2 // Approximate radius
        }));
    }

    /**
     * Returns the main UI container that holds all game interface elements
     * Provides access to the root container for adding to the main game scene
     */
    public getView(): PIXI.Container {
        return this.view;
    }

    /**
     * Destroys the UI manager and cleans up all resources, event listeners, and containers
     * Removes all UI elements and prevents memory leaks when the game is destroyed
     */
    public destroy(): void {
        if (this.eventBus && typeof this.eventBus.off === 'function') {
            this.eventBus.off(ENGINE_EVENTS.RESIZED, this._handleResize.bind(this));
        }
        this.view.destroy({ children: true });
        this.answerRectangles = [];
        console.log('SplashDashUIManager destroyed');
    }
}