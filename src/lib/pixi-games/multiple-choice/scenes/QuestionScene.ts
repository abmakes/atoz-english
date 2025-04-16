
/// REMOVE IN FUTURE IF V2 IS SUCCESSFUL

import * as PIXI from 'pixi.js';
import { GifSprite } from 'pixi.js/gif';
// Remove direct PixiEngine import
// import { PixiEngine } from '@/lib/pixi-engine/core/PixiEngine';
// Import managers/types needed
import { EventBus } from '@/lib/pixi-engine/core/EventBus'; // Example manager

// Define a type for potential animated resources from Assets.get()
type AnimatedResource = { 
  textures?: PIXI.Texture[]; 
  frames?: { texture?: PIXI.Texture }[]; 
};

export class QuestionScene extends PIXI.Container {
    private questionText: PIXI.Text;
    private questionMedia: PIXI.Sprite | GifSprite | null = null;
    private answerOptionsContainer: PIXI.Container;
    // Remove engineRef property
    // private engineRef: PixiEngine;
    // Add references to managers passed in constructor if needed
    private eventBus: EventBus; // Example

    // Update constructor signature
    constructor(eventBus: EventBus /* Add other managers as needed */) {
        super();
        this.eventBus = eventBus;

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

    // Update method signature - remove engine param
    // Accept pre-loaded texture/resource or just URL?
    // For now, keep URL and internal PIXI.Assets.get, but acknowledge refactoring needed
    public updateQuestion(text: string, imageUrl?: string ): void {
        // Remove engineRef assignment
        // this.engineRef = engine;

        console.log("--- updateQuestion START - Current media:", this.questionMedia ? "Exists" : "null");

        // --- Cleanup existing media (remains the same) ---
        if (this.questionMedia) {
            console.log("Destroying previous questionMedia...");
            const mediaToDestroy = this.questionMedia;
            // Log texture state BEFORE destroy (Check if texture exists)
            // Simplified check: If it has a texture property, assume it's Sprite-like
            const textureExistsBeforeDestroy = !!(mediaToDestroy as PIXI.Sprite).texture;
            console.log(`Texture exists before destroy: ${textureExistsBeforeDestroy}`);
            this.removeChild(mediaToDestroy);
            // Simple destroy, will destroy children by default
            mediaToDestroy.destroy(true);
            this.questionMedia = null;
            /* Comment out final cleanup log
            console.log("Previous questionMedia destroyed and nulled.");
            */
        }
        // -----------------------------

        this.questionText.text = text;
        // Use placeholder or calculate based on container size later
        const currentScreenWidth = 800; // Placeholder
        this.questionText.style.wordWrapWidth = currentScreenWidth * 0.8;

        // Position without media first
        this._positionElements(currentScreenWidth, 600); // Pass placeholders

        if (imageUrl) {
            console.log(`Processing imageUrl: ${imageUrl}`);
            try {
                // TODO (Subtask 3): This asset retrieval should ideally happen
                // before calling updateQuestion, passing the Texture/resource.
                const loadedResource = PIXI.Assets.get(imageUrl);

                if (!loadedResource) {
                    console.warn(`Asset not found in cache: ${imageUrl}.`);
                    this._positionElements(currentScreenWidth, 600); // Position one last time
                    return;
                }

                // --- Animation Check (remains the same for now) ---
                let isPotentiallyAnimated = false;
                if (typeof loadedResource === 'object' && loadedResource !== null) {
                    // Check for known animation properties
                    if (loadedResource.hasOwnProperty('frames') || loadedResource.hasOwnProperty('textures')) {
                        isPotentiallyAnimated = true;
                        console.log("Resource identified as animated based on frames/textures property.");
                    }
                    // Add check for WebP based on URL if needed, though internal properties are better
                    else if (imageUrl.toLowerCase().endsWith('.webp')) {
                         // Assume .webp COULD be animated, let createAnimatedFallback verify
                         isPotentiallyAnimated = true;
                         console.log("Resource has .webp extension, attempting animated fallback.");
                    }
                     // Keep .gif check as well
                     else if (imageUrl.toLowerCase().endsWith('.gif')) {
                         isPotentiallyAnimated = true;
                         console.log("Resource has .gif extension, attempting animated fallback.");
                     }
                }
                // -----------------------------

                if (isPotentiallyAnimated) {
                    this.createAnimatedFallback(loadedResource);
                } else if (loadedResource instanceof PIXI.Texture) {
                    this.questionMedia = new PIXI.Sprite(loadedResource);
                    this.questionMedia.anchor.set(0.5);
                    this.addChild(this.questionMedia);
                } else {
                    console.warn(`Unhandled resource type for ${imageUrl}.`);
                    this._positionElements(currentScreenWidth, 600);
                    return;
                }

                // Position elements AFTER new media is potentially added
                this._positionElements(currentScreenWidth, 600);

            } catch (error) {
                 console.error(`Error processing image ${imageUrl}:`, error);
                 // Ensure cleanup on error
                 if (this.questionMedia) {
                    this.removeChild(this.questionMedia);
                    // Simple destroy
                    this.questionMedia.destroy(true);
                    this.questionMedia = null;
                 }
                 console.log("Calling _positionElements (after error)");
                 this._positionElements(currentScreenWidth, 600);
             }
        } else {
             console.log("No imageUrl provided. Calling _positionElements.");
             this._positionElements(currentScreenWidth, 600); // Position elements when there's no image
        }
        console.log("--- updateQuestion END - Current media:", this.questionMedia ? "Exists" : "null");
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

            let mediaWidth = 100; // Default/fallback
            let mediaHeight = 100;

            if (this.questionMedia instanceof PIXI.Sprite && this.questionMedia.texture) {
                mediaWidth = this.questionMedia.texture.width;
                mediaHeight = this.questionMedia.texture.height;
            } else if (this.questionMedia instanceof GifSprite) {
                mediaWidth = this.questionMedia.width || 100;
                mediaHeight = this.questionMedia.height || 100;
            }

            // Calculate scale
            let scale = 1;
            if (mediaWidth > maxMediaWidth) {
                scale = maxMediaWidth / mediaWidth;
            }
            if (mediaHeight * scale > maxMediaHeight) {
                scale = maxMediaHeight / mediaHeight;
            }
            this.questionMedia.scale.set(scale);

            // Position media below text
            this.questionMedia.x = screenWidth / 2;
            this.questionMedia.y = this.questionText.y + this.questionText.height / 2 + padding + (this.questionMedia.height * scale / 2);
        }

        // Position answer options container below media (or text if no media)
        const mediaBottom = this.questionMedia ? this.questionMedia.y + this.questionMedia.height * (this.questionMedia.scale.y || 1) / 2 : this.questionText.y + this.questionText.height / 2;
        this.answerOptionsContainer.x = screenWidth / 2; // Center the container origin
        this.answerOptionsContainer.y = mediaBottom + padding * 2; // Position below media/text with padding
    }

    public getAnswerOptionContainer(): PIXI.Container {
        return this.answerOptionsContainer;
    }

    public clearAnswerOptions(): void {
        this.answerOptionsContainer.removeChildren().forEach(child => child.destroy());
    }

    public destroy(options?: boolean | PIXI.DestroyOptions): void {
        // Destroy the sprite/animated sprite instance, but NOT its texture
        // Use the simple boolean form for destroying children
        this.questionMedia?.destroy(true); 
        this.questionMedia = null;
        // Destroy other children like questionText, answerOptionsContainer implicitly via super.destroy
        super.destroy(options ?? { children: true }); // Ensure children of the scene itself are destroyed
    }

    // Helper method to create an animated sprite fallback
    private createAnimatedFallback(resource: AnimatedResource): void {
        /* Comment out animation sprite creation log
        console.log("Creating AnimatedSprite from animated content");
        */
        try {
            let textures: PIXI.Texture[] = [];
            
            // Extract textures from the resource
            if (resource && typeof resource === 'object') {
                if ('textures' in resource && Array.isArray(resource.textures)) {
                    textures = resource.textures.filter((t): t is PIXI.Texture => !!t);
                    /* Comment out textures log
                    console.log(`Using ${textures.length} textures from resource.textures.`);
                    */
                } else if ('frames' in resource && Array.isArray(resource.frames)) {
                    textures = resource.frames
                        .map((frame) => frame?.texture)
                        .filter((t): t is PIXI.Texture => !!t);
                    /* Comment out frames log
                    console.log(`Extracted ${textures.length} textures from resource.frames.`);
                    */
                } else if (resource instanceof PIXI.Texture) {
                    textures = [resource]; // Handle if the resource itself is a texture
                    /* Comment out fallback log
                    console.log(`Using single texture as fallback.`);
                    */
                }
            }
            
            // Simplified check: Proceed if we extracted any textures
            if (textures.length > 0) {
                // Remove any existing media FIRST
                if (this.questionMedia) {
                    /* Comment out removal log
                    console.log("Removing existing media before creating AnimatedSprite...");
                    */
                    this.removeChild(this.questionMedia);
                    // Simple destroy
                    this.questionMedia.destroy(true);
                    this.questionMedia = null;
                }
                
                // Create an AnimatedSprite
                const animSprite = new PIXI.AnimatedSprite(textures);
                
                // Configure animation properties
                animSprite.anchor.set(0.5);
                animSprite.alpha = 1;
                animSprite.visible = true;
                
                // Adjust animation speed based on frame count
                // Fewer frames should play slower for better visibility
                const baseSpeed = 0.1;
                animSprite.animationSpeed = textures.length > 20 
                    ? baseSpeed * 2   // Faster for many frames
                    : baseSpeed * 1;  // Slower for fewer frames
                
                animSprite.loop = true;
                
                // Add to display tree and SET THE REFERENCE
                this.questionMedia = animSprite; 
                this.addChild(animSprite);
                
                // Start playing after a short delay for stability
                setTimeout(() => {
                    if (animSprite && !animSprite.destroyed) {
                        animSprite.play();
                        // Comment out AnimatedSprite playback logs
                        /*
                        console.log(`AnimatedSprite playback started with speed: ${animSprite.animationSpeed}`);
                        */
                    }
                }, 100);
                
                /* Comment out success log
                console.log("AnimatedSprite successfully created and added to display");
                */
            } else { // This handles no textures found
                console.warn("No textures found for animated content. Attempting static fallback.");
                // Try to extract at least one texture as fallback
                let fallbackTexture: PIXI.Texture | null = null;
                
                // Refined fallback texture extraction
                if (resource instanceof PIXI.Texture) {
                    fallbackTexture = resource;
                    /* Comment out fallback log
                    console.log("Using provided Texture for fallback.");
                    */
                } else if (typeof resource === 'object' && resource !== null) {
                     // Try getting first texture from textures array or frames array
                    const firstTexture = 
                        (resource.textures?.[0]) ??
                        (resource.frames?.[0]?.texture);

                    if (firstTexture instanceof PIXI.Texture) { // Check if it's actually a texture
                        fallbackTexture = firstTexture;
                        /* Comment out fallback log
                        console.log("Using first texture found in textures/frames array for fallback.");
                        */
                    } else {
                         /* Comment out no-fallback log
                         console.log("No valid fallback texture found in resource object's arrays.");
                         */
                    }
                } else {
                    /* Comment out resource-type log
                    console.log("Resource is not a Texture or suitable object for fallback.");
                    */
                }
                
                if (fallbackTexture) {
                     // Remove any existing media FIRST
                     if (this.questionMedia) {
                        /* Comment out removal log
                        console.log("Removing existing media before creating static fallback...");
                        */
                        this.removeChild(this.questionMedia);
                        // Simple destroy
                        this.questionMedia.destroy(true);
                        this.questionMedia = null;
                     }
                     this.questionMedia = new PIXI.Sprite(fallbackTexture); 
                     this.questionMedia.anchor.set(0.5);
                     this.addChild(this.questionMedia);
                     /* Comment out fallback-creation log
                     console.log("Created static fallback sprite from first frame");
                     */
                } else {
                    console.error("FAILED to find any valid texture for fallback display.");
                }
            }
        } catch (err) {
            console.error("Failed to create animated content:", err);
            // Ensure cleanup on error
            if (this.questionMedia) {
                this.removeChild(this.questionMedia);
                // Simple destroy
                this.questionMedia.destroy(true);
                this.questionMedia = null;
            }
        }
    }
}
