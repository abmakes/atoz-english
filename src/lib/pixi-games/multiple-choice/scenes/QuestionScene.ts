import * as PIXI from 'pixi.js';
import { GifSprite } from 'pixi.js/gif';
// Remove direct PixiEngine import
// Import managers/types needed
import { EventBus } from '@/lib/pixi-engine/core/EventBus'; // Example manager
// Assume AssetLoader provides a method like getDisplayObject
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';
import { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication'; // Import PixiApplication
// Import the theme config type
import type { PixiSpecificConfig } from '../../../themes'; // Use correct relative path
import type { LayoutProfile } from '../managers/MultipleChoiceLayoutManager';
// Remove ImageOptimizerCache import if not needed
// import { ImageOptimizerCache } from 'next/dist/server/image-optimizer';

// Remove type, AssetLoader handles creation now
/*
type AnimatedResource = { 
  textures?: PIXI.Texture[]; 
  frames?: { texture?: PIXI.Texture }[]; 
} | PIXI.Texture;
*/

export class QuestionScene extends PIXI.Container {
    private backgroundPanel: PIXI.Graphics;
    private questionText: PIXI.Text;
    private questionMedia: PIXI.Sprite | GifSprite | PIXI.AnimatedSprite | null = null;
    private answerOptionsContainer: PIXI.Container;
    private readonly eventBus: EventBus;
    private readonly assetLoader: AssetLoader;
    private readonly pixiApp: PixiApplication;
    private readonly pixiTheme: PixiSpecificConfig;

    constructor(
        pixiApp: PixiApplication,
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
        params: LayoutProfile, // Changed from LayoutParameters
        screenWidth: number // May still need screen width for fallback/centering
    ): void {
        console.log("QuestionScene: Starting updateLayout with explicit bounds");

        // Update text style using params
        this.questionText.style.fontSize = params.questionFontSize;
        // Set wrap width based on the provided text bounds width
        this.questionText.style.wordWrapWidth = textBounds.width;

        // Position elements using the provided bounds
        this._positionElements(textBounds, mediaBounds, params, screenWidth);
        console.log("QuestionScene: Finished updateLayout");
    }

    private _positionElements(
        textBounds: PIXI.Rectangle,
        mediaBounds: PIXI.Rectangle | null,
        params: LayoutProfile, // Changed from LayoutParameters
        screenWidth: number
    ): void {
        console.log("QuestionScene: Starting _positionElements (Reverted Logic)");

        // --- Position question text (Revert to previous Y calculation) ---
        const screenHeight = this.pixiApp.getScreenSize().height; // Need height here
        this.questionText.style.wordWrapWidth = textBounds.width;
        this.questionText.x = screenWidth / 2; // Center X is likely fine
        // Use the formula that worked visually before:
        this.questionText.y = screenHeight * params.questionYMultiplier; // Or screenHeight * 0.7 - 64 if preferred
        console.log("QuestionScene: Text positioned (Reverted Y)", { x: this.questionText.x, y: this.questionText.y });

        // --- Position media ---
        const hasValidMediaBounds = mediaBounds && mediaBounds.width > 0 && mediaBounds.height > 0;

        if (this.questionMedia && hasValidMediaBounds) {
            // --- Positioning logic when media and bounds are valid ---
            this.questionMedia.visible = true;
            // ... (get dimensions, check dimensions > 0, calculate scale, check scale, set scale/position) ...
            // (All the logic currently inside the main 'if (this.questionMedia && mediaBounds ...)' block)

             const mediaOrigWidth = this.questionMedia.texture?.orig.width ?? this.questionMedia.width;
             const mediaOrigHeight = this.questionMedia.texture?.orig.height ?? this.questionMedia.height;

             if (mediaOrigWidth <= 0 || mediaOrigHeight <= 0) { /* ... hide and return ... */ return;}

            // Use previous logic for available height (relative to text)
            const imageTopBound = params.topPadding;
            // Use the actual text position AFTER it's set above
            const textTop = this.questionText.y - this.questionText.height * this.questionText.anchor.y;
            const imageBottomBound = textTop - params.topPadding; // Use textTop now
            let availableHeightForMedia = Math.max(10, imageBottomBound - imageTopBound);

             // --- Reinstate your scaling logic ---
             let scale = 1;
             // scale down if media is larger than available height
             if (mediaOrigHeight > availableHeightForMedia && availableHeightForMedia > 0) {
                 scale = availableHeightForMedia / mediaOrigHeight;
             }
             // scale up if media is smaller than available height
             if (mediaOrigHeight < availableHeightForMedia) {
               scale = availableHeightForMedia / mediaOrigHeight;
             }
             // ---

             // Optional: Reinstate width constraint check if needed
             // const availableWidthForMedia = screenWidth - 2 * params.sidePadding;
             // if (mediaOrigWidth * scale > availableWidthForMedia && availableWidthForMedia > 0) {
             //     scale = Math.min(scale, availableWidthForMedia / mediaOrigWidth);
             // }

             if (scale <= 0 || !isFinite(scale)) { /* ... hide and return ... */ return; }

             this.questionMedia.scale.set(scale);

             // Position based on previous logic (centered X, top + half height Y)
             this.questionMedia.x = screenWidth / 2;
             this.questionMedia.y = imageTopBound + this.questionMedia.height / 2; // Use height *after* scaling

             console.log("Final media position (Reverted):", { /* ... log details ... */ });

        } else if (this.questionMedia) {
             this.questionMedia.visible = false;
        }

        console.log("QuestionScene: Finished _positionElements (Reverted Logic)");
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