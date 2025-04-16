import * as PIXI from 'pixi.js';
import { GifSprite } from 'pixi.js/gif';
// Remove direct PixiEngine import
// import { PixiEngine } from '@/lib/pixi-engine/core/PixiEngine';
// Import managers/types needed
import { EventBus } from '@/lib/pixi-engine/core/EventBus'; // Example manager
// Assume AssetLoader provides a method like getDisplayObject
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';

// Remove type, AssetLoader handles creation now
/*
type AnimatedResource = { 
  textures?: PIXI.Texture[]; 
  frames?: { texture?: PIXI.Texture }[]; 
} | PIXI.Texture;
*/

export class QuestionSceneV2 extends PIXI.Container {
    private questionText: PIXI.Text;
    // Type remains the same, but creation is delegated
    private questionMedia: PIXI.Sprite | GifSprite | PIXI.AnimatedSprite | null = null;
    private answerOptionsContainer: PIXI.Container;
    // Remove engineRef property
    // private engineRef: PixiEngine;
    // Add references to managers passed in constructor if needed
    private eventBus: EventBus; // Example
    // Keep AssetLoader reference, though not used directly here anymore
    private assetLoader: AssetLoader;

    // Update constructor signature
    constructor(eventBus: EventBus, assetLoader: AssetLoader) {
        super();
        this.eventBus = eventBus;
        this.assetLoader = assetLoader; // Store reference even if not used directly in update

        // Ensure the scene itself is interactive
        this.interactive = true;
        this.interactiveChildren = true; // Allow events to reach children

        // Use placeholder or default screen size for initial text wrap
        const initialScreenWidth = 800; // Placeholder
        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Grandstander',
            fontSize: 36,
            fill: 0x111111,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: initialScreenWidth * 0.8
        });

        this.questionText = new PIXI.Text({ text: '', style: textStyle });
        this.questionText.anchor.set(0.5);
        this.addChild(this.questionText);

        this.answerOptionsContainer = new PIXI.Container();
        // Ensure the options container is interactive
        this.answerOptionsContainer.interactive = true;
        this.answerOptionsContainer.interactiveChildren = true; // Allow events to reach buttons
        this.addChild(this.answerOptionsContainer);

        // Initial position with placeholder dimensions
        this._positionElements(initialScreenWidth, 600); // Pass placeholder dimensions
    }

    public updateQuestion(text: string, imageUrl?: string ): void {
        console.log("--- QuestionSceneV2 updateQuestion START - Current media:", this.questionMedia ? "Exists" : "null");

        // Cleanup existing media
        if (this.questionMedia) {
            console.log("Destroying previous questionMedia instance...");
            this.removeChild(this.questionMedia);
            this.questionMedia.destroy(); 
            this.questionMedia = null;
        }

        // Update text
        this.questionText.text = text;
        const currentScreenWidth = 800; 
        this.questionText.style.wordWrapWidth = currentScreenWidth * 0.8;
        this._positionElements(currentScreenWidth, 600); // Position text

        // Get and add new media
        if (imageUrl) {
            console.log(`Requesting display object from AssetLoader for: ${imageUrl}`); 
            try {
                // Use AssetLoader to get the correct display object
                const displayObject = AssetLoader.getDisplayObject(imageUrl);

                if (displayObject) {
                    this.questionMedia = displayObject; // Assign the returned object
                    this.questionMedia.anchor.set(0.5);
                    this.addChild(this.questionMedia);
                    console.log(`Added media from AssetLoader: ${this.questionMedia.constructor.name}`);

                    // Start playback if applicable
                    if (this.questionMedia instanceof PIXI.AnimatedSprite || this.questionMedia instanceof GifSprite) {
                         if (!this.questionMedia.playing) {
                            // Use setTimeout to ensure it plays after potential initial stutters/calculations
                            setTimeout(() => { 
                                if (this.questionMedia instanceof PIXI.AnimatedSprite || this.questionMedia instanceof GifSprite) {
                                    if (!this.questionMedia.destroyed) { // Check destroyed status again in timeout
                                        this.questionMedia.play();
                                    } 
                                }
                            }, 50);
                         }
                    }
                    
                } else {
                    // AssetLoader.getDisplayObject handles logging warnings for null/not found
                    console.warn(`AssetLoader.getDisplayObject returned null for: ${imageUrl}.`);
                }
                
                // Position elements *after* adding potential media
                this._positionElements(currentScreenWidth, 600);

            } catch (error) {
                 // Catch potential errors from getDisplayObject itself (though it has internal catch)
                 console.error(`Error during AssetLoader.getDisplayObject for ${imageUrl}:`, error);
                 // Ensure cleanup hasn't left broken state
                 if (this.questionMedia && !this.questionMedia.parent) {
                      this.questionMedia = null; // If it exists but wasn't added, nullify
                 } else if (this.questionMedia?.parent !== this) {
                      // If added somewhere else unexpectedly, attempt removal/destroy
                      this.questionMedia?.parent?.removeChild(this.questionMedia);
                      this.questionMedia?.destroy();
                      this.questionMedia = null;
                 }
                 this._positionElements(currentScreenWidth, 600); // Reposition elements after error
             }
        } else {
             console.log("No imageUrl provided.");
             // No need to call _positionElements again if text was already positioned
        }
        console.log("--- QuestionSceneV2 updateQuestion END - Current media:", this.questionMedia ? "Exists" : "null");
    }

    // Update method signature to accept dimensions
    private _positionElements(screenWidth: number, screenHeight: number): void {
        // Use passed dimensions instead of engineRef
        const padding = 20;

        // Position question text
        this.questionText.x = screenWidth / 2;
        // Adjust y positioning based on screen height
        this.questionText.y = screenHeight * 0.15; // Position near top

        // Position media (if any)
        if (this.questionMedia) {
            const maxMediaWidth = screenWidth * 0.8;
            // Adjust max height calculation based on new text position
            const availableHeight = screenHeight * 0.5; // Space between text and answers
            const maxMediaHeight = availableHeight - 2 * padding;

            // Use const for dimensions if not reassigned later
            const mediaWidth = this.questionMedia.width || 100;
            const mediaHeight = this.questionMedia.height || 100;
            
            // Calculate scale based on the *display object's* current size
            let scale = 1;
            if (mediaWidth > maxMediaWidth) {
                scale = maxMediaWidth / mediaWidth;
            }
            if (mediaHeight * scale > maxMediaHeight) {
                scale = maxMediaHeight / mediaHeight;
            }
            // Important: Adjust scale *relative* to current scale if needed, or just set it
            // Let's assume we just set the final desired scale
            this.questionMedia.scale.set(scale);

            // Recalculate position based on scaled dimensions
            this.questionMedia.x = screenWidth / 2;
            this.questionMedia.y = this.questionText.y + this.questionText.height / 2 + padding + (this.questionMedia.height / 2); // height is already scaled
        }

        // Position answer options container below media (or text if no media)
        const mediaBottom = this.questionMedia ? this.questionMedia.y + this.questionMedia.height / 2 : this.questionText.y + this.questionText.height / 2;
        this.answerOptionsContainer.x = screenWidth / 2; // Center the container origin
        this.answerOptionsContainer.y = mediaBottom + padding * 2; // Position below media/text with padding
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
} 