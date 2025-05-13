import * as PIXI from 'pixi.js';
import { GifSprite } from 'pixi.js/gif';
// Remove direct PixiEngine import
// Import managers/types needed
import { EventBus } from '@/lib/pixi-engine/core/EventBus'; // Example manager
// Assume AssetLoader provides a method like getDisplayObject
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';
import { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication'; // Import PixiApplication
import { PixiApplicationAdapter } from '../adapters/PixiApplicationAdapter'; // Import the adapter
// Import the theme config type
import type { PixiSpecificConfig } from '../../../themes'; // Use correct relative path
import type { LayoutParameters } from '../managers/MultipleChoiceLayoutManager';
// Remove ImageOptimizerCache import if not needed
// import { ImageOptimizerCache } from 'next/dist/server/image-optimizer';

// Remove type, AssetLoader handles creation now
/*
type AnimatedResource = { 
  textures?: PIXI.Texture[]; 
  frames?: { texture?: PIXI.Texture }[]; 
} | PIXI.Texture;
*/

// Define a type that allows both old PixiApplication and our adapter
type PixiAppType = PixiApplication | PixiApplicationAdapter;

export class QuestionScene extends PIXI.Container {
    private backgroundPanel: PIXI.Graphics;
    private questionText: PIXI.Text;
    private questionMedia: PIXI.Sprite | GifSprite | PIXI.AnimatedSprite | null = null;
    private answerOptionsContainer: PIXI.Container;
    private readonly eventBus: EventBus;
    private readonly assetLoader: AssetLoader;
    private readonly pixiApp: PixiAppType; // Changed from PixiApplication to PixiAppType
    private readonly pixiTheme: PixiSpecificConfig;

    constructor(
        pixiApp: PixiAppType, // Changed from PixiApplication to PixiAppType
        eventBus: EventBus,
        assetLoader: AssetLoader,
        pixiTheme: PixiSpecificConfig
    ) {
        super();
        this.pixiApp = pixiApp;
        this.eventBus = eventBus;
        this.assetLoader = assetLoader;
        this.pixiTheme = pixiTheme;

        this.interactive = true;
        this.interactiveChildren = true;

        // Create background panel
        this.backgroundPanel = new PIXI.Graphics();
        this.backgroundPanel.label = 'QuestionBackgroundPanel';
        this.addChild(this.backgroundPanel);

        // Create question text with initial style (will be updated by layout)
        const textStyle = new PIXI.TextStyle({
            fontFamily: this.pixiTheme.fontFamilyTheme,
            fontSize: 36,
            fill: this.pixiTheme.questionTextColor,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 95
        });

        this.questionText = new PIXI.Text({ text: '', style: textStyle });
        this.questionText.anchor.set(0.5);
        this.addChild(this.questionText);

        this.answerOptionsContainer = new PIXI.Container();
        this.answerOptionsContainer.interactive = true;
        this.answerOptionsContainer.interactiveChildren = true;
        this.addChild(this.answerOptionsContainer);
    }

    public updateQuestion(text: string, imageUrl?: string): void {
        console.log("--- QuestionSceneV2 updateQuestion START ---");
        // Cleanup existing media
        if (this.questionMedia) {
            console.log("Destroying previous questionMedia instance...");
            this.removeChild(this.questionMedia);
            this.questionMedia.destroy();
            this.questionMedia = null;
        }

        // Update text
        this.questionText.text = text;

        // Get and add new media
        if (imageUrl) {
            console.log(`Requesting display object from AssetLoader for: ${imageUrl}`);
            try {
                const displayObject = AssetLoader.getDisplayObject(imageUrl);
                if (displayObject) {
                    this.questionMedia = displayObject;
                    this.questionMedia.anchor.set(0.5);
                    this.questionMedia.visible = false; // Initially hide until positioned
                    this.addChild(this.questionMedia);
                    console.log(`Added media from AssetLoader: ${this.questionMedia.constructor.name}`);

                    if (this.questionMedia instanceof PIXI.AnimatedSprite || this.questionMedia instanceof GifSprite) {
                        if (!this.questionMedia.playing) {
                            setTimeout(() => {
                                if (this.questionMedia instanceof PIXI.AnimatedSprite || this.questionMedia instanceof GifSprite) {
                                    if (!this.questionMedia.destroyed) {
                                        this.questionMedia.play();
                                    }
                                }
                            }, 50);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error during AssetLoader.getDisplayObject for ${imageUrl}:`, error);
                if (this.questionMedia && !this.questionMedia.parent) {
                    this.questionMedia = null;
                } else if (this.questionMedia?.parent !== this) {
                    this.questionMedia?.parent?.removeChild(this.questionMedia);
                    this.questionMedia?.destroy();
                    this.questionMedia = null;
                }
            }
        }
        console.log("--- QuestionSceneV2 updateQuestion END ---");
    }

    public updateLayout(
        textBounds: PIXI.Rectangle,
        mediaBounds: PIXI.Rectangle | null, // Media might not always exist
        params: LayoutParameters, // Still need params for font size etc.
        screenWidth: number // May still need screen width for fallback/centering
    ): void {
        console.log("QuestionScene: Starting updateLayout with explicit bounds");

        // Update text style using params
        this.questionText.style.fontSize = params.questionFontSize;
        // Set wrap width based on the provided text bounds width or params
        this.questionText.style.wordWrapWidth = params.questionWrapWidth;

        // Position elements using the provided bounds
        this._positionElements(textBounds, mediaBounds, params, screenWidth);
        console.log("QuestionScene: Finished updateLayout");
    }

    private _positionElements(
        textBounds: PIXI.Rectangle,
        mediaBounds: PIXI.Rectangle | null,
        params: LayoutParameters,
        screenWidth: number
    ): void {
        console.log("QuestionScene: Starting _positionElements (Refactored Logic)");

        // --- Position question text ---
        const screenHeight = this.pixiApp.getScreenSize().height;
        this.questionText.style.wordWrapWidth = params.questionWrapWidth;
        this.questionText.x = screenWidth / 2; // Center X
        this.questionText.y = params.questionY; // Use absolute logical Y from params
        console.log("QuestionScene: Text positioned (Refactored Y)", { x: this.questionText.x, y: this.questionText.y });

        // --- Position media ---
        const hasValidMediaBounds = mediaBounds && mediaBounds.width > 0 && mediaBounds.height > 0;

        if (this.questionMedia && hasValidMediaBounds) {
            this.questionMedia.visible = true;
            const mediaOrigWidth = this.questionMedia.texture?.orig.width ?? this.questionMedia.width;
            const mediaOrigHeight = this.questionMedia.texture?.orig.height ?? this.questionMedia.height;

            if (mediaOrigWidth <= 0 || mediaOrigHeight <= 0) { return; }

            // Use params.imageY and params.imageMaxHeight for positioning and scaling
            let scale = 1;
            if (mediaOrigHeight > params.imageMaxHeight && params.imageMaxHeight > 0) {
                scale = params.imageMaxHeight / mediaOrigHeight;
            }
            if (mediaOrigHeight < params.imageMaxHeight) {
                scale = params.imageMaxHeight / mediaOrigHeight;
            }
            if (scale <= 0 || !isFinite(scale)) { return; }

            this.questionMedia.scale.set(scale);
            this.questionMedia.x = screenWidth / 2;
            this.questionMedia.y = params.imageY + this.questionMedia.height / 2;
            console.log("Final media position (Refactored):", { x: this.questionMedia.x, y: this.questionMedia.y, scale });
        } else if (this.questionMedia) {
            this.questionMedia.visible = false;
        }

        console.log("QuestionScene: Finished _positionElements (Refactored Logic)");
    }

    public getAnswerOptionContainer(): PIXI.Container {
        return this.answerOptionsContainer;
    }

    public clearAnswerOptions(): void {
        this.answerOptionsContainer.removeChildren().forEach(child => child.destroy(true)); // destroy children too
    }

    public destroy(options?: boolean | PIXI.DestroyOptions): void {
        if (this.questionMedia) {
             // Use simple destroy() 
            this.questionMedia.destroy();
            this.questionMedia = null;
        }
        // Destroy the scene's children explicitly if needed, or rely on super.destroy default
        super.destroy(options ?? { children: true }); 
    }

    // Remove createAnimatedFallback - AssetLoader should handle this now
    /*
    private createAnimatedFallback(resource: AnimatedResource): void {
        // ... removed ...
    }
    */

    // Add getter for questionText to access its position/dimensions if needed
    public getQuestionText(): PIXI.Text {
        return this.questionText;
    }

    // Add getter for questionMedia
    public getQuestionMedia(): PIXI.Sprite | GifSprite | PIXI.AnimatedSprite | null {
        return this.questionMedia;
    }

    public getQuestionTextBounds(): PIXI.Rectangle {
        const bounds = this.questionText.getBounds();
        return new PIXI.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    // --- Add Method to Draw Background ---
    /**
     * Clears and redraws the background panel with specified dimensions and color.
     * @param x X position of the panel
     * @param y Y position of the panel
     * @param width Width of the panel
     * @param height Height of the panel
     * @param color Fill color (string or number)
     * @param radius Corner radius
     */
    public drawBackgroundPanel(x: number, y: number, width: number, height: number, color: PIXI.ColorSource, radius: number): void {
        this.backgroundPanel.clear();
        if (width > 0 && height > 0) {
             this.backgroundPanel.roundRect(x, y, width, height, radius)
                               .fill(color);
        }
    }
    // --- End Add Method ---
} 