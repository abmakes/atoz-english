import * as PIXI from 'pixi.js';
import { GifSprite } from 'pixi.js/gif';
import { PixiEngine } from '@/lib/pixi-engine/core/PixiEngine';

// Define a type for potential animated resources from Assets.get()
type AnimatedResource = { 
  textures?: PIXI.Texture[]; 
  frames?: { texture?: PIXI.Texture }[]; 
};

export class QuestionScene extends PIXI.Container {
    private questionText: PIXI.Text;
    private questionMedia: PIXI.Sprite | GifSprite | null = null;
    private answerOptionsContainer: PIXI.Container;
    private engineRef: PixiEngine;

    constructor(engine: PixiEngine) {
        super();
        this.engineRef = engine;

        const initialScreenWidth = this.engineRef.getApp().getScreenSize().width ?? 800;
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
        this.addChild(this.answerOptionsContainer);

        this._positionElements();
    }

    public updateQuestion(text: string, engine: PixiEngine, imageUrl?: string ): void {
        this.engineRef = engine;

        console.log("--- updateQuestion START - Current media:", this.questionMedia ? "Exists" : "null");

        // --- Cleanup existing media ---
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
        this.questionText.style.wordWrapWidth = (this.engineRef.getApp().getScreenSize().width ?? 800) * 0.8;

        // Initial positioning call (might happen before new media is added)
        /* Comment out positioning log
        console.log("Calling _positionElements (before new media creation)");
        */
        this._positionElements();

        if (imageUrl) {
            console.log(`Processing imageUrl: ${imageUrl}`);
            try {
                // --- Retrieve asset from cache ---
                const loadedResource = PIXI.Assets.get(imageUrl);
                // ---------------------------------

                if (!loadedResource) {
                    console.warn(`Asset not found in cache: ${imageUrl}. FINAL CALL to _positionElements.`);
                    this._positionElements(); // Position one last time with no media
                    return;
                }

                // --- Revised Animation Check ---
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
                    // Always try the fallback which handles extraction
                    /* Comment out animated fallback log
                    console.log("Attempting createAnimatedFallback for potentially animated resource...");
                    */
                    this.createAnimatedFallback(loadedResource);
                    console.log(`createAnimatedFallback finished. Current media: ${this.questionMedia ? 'Exists' : 'null'}`);
                 
                } else if (loadedResource instanceof PIXI.Texture) {
                     // Only create static Sprite if NOT potentially animated AND it IS a Texture
                     /* Comment out static sprite log
                     console.log("Creating static Sprite (resource is Texture and not flagged as animated)...");
                     */
                     // No direct .valid check needed with Assets loader
                     this.questionMedia = new PIXI.Sprite(loadedResource);
                     this.questionMedia.anchor.set(0.5);
                     this.addChild(this.questionMedia);
                     /* Comment out sprite creation log
                     console.log(`Static sprite created. Current media: ${this.questionMedia ? 'Exists' : 'null'}`);
                     */
                } else {
                     // This case should be less likely now, but handles unexpected types
                    console.log(`Unhandled resource type loaded for ${imageUrl}:`, loadedResource);
                    console.warn("Resource was not a Texture or identified as Animated. No media displayed.");
                    console.log("Calling _positionElements (after unhandled resource type)");
                    this._positionElements(); // Position elements without media
                    return;
                 }

                // Position elements AFTER new media is added and set

                console.log("Calling _positionElements (after new media created/added)");
                this._positionElements();

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
                 this._positionElements();
             }
        } else {
             console.log("No imageUrl provided. Calling _positionElements.");
             this._positionElements(); // Position elements when there's no image
        }

        console.log("--- updateQuestion END - Current media:", this.questionMedia ? "Exists" : "null");
    }

    private _positionElements(): void {
        const screenWidth = this.engineRef.getApp().getScreenSize().width ?? 800;
        const screenHeight = this.engineRef.getApp().getScreenSize().height ?? 600;
        const padding = 20;

        // Position question text
        this.questionText.x = screenWidth / 2;
        this.questionText.y = screenHeight - screenHeight * 0.4;

        // let bottomOfPreviousElement = this.questionText.y + this.questionText.height / 2;

        // Position media (if any)
        if (this.questionMedia) {
            /* Comment out media positioning logs
            console.log("Positioning question media:", 
                "type:", this.questionMedia instanceof GifSprite ? "GIF" : "Image",
                "initial size:", this.questionMedia.width, "x", this.questionMedia.height);
            */
                
            const maxMediaWidth = screenWidth * 0.8;
            const maxMediaHeight = screenHeight * 0.6;
            
            // Get dimensions safely
            let mediaWidth = 0;
            let mediaHeight = 0;
            
            if (this.questionMedia instanceof PIXI.Sprite) {
                // Regular sprite with texture
                if (this.questionMedia.texture) {
                    mediaWidth = this.questionMedia.texture.width;
                    mediaHeight = this.questionMedia.texture.height;
                } else {
                    mediaWidth = 100; // Fallback size
                    mediaHeight = 100;
                }
            } else {
                // Must be a GifSprite
                const gifMedia = this.questionMedia as GifSprite;
                mediaWidth = gifMedia.width || 200;  // Fallback if undefined
                mediaHeight = gifMedia.height || 200;
            }

            // Calculate scale to fit in available space
            let scale = 1;
            if (mediaWidth > maxMediaWidth) {
                scale = maxMediaWidth / mediaWidth;
            }
            if (mediaHeight * scale > maxMediaHeight) {
                scale = maxMediaHeight / mediaHeight;
            }
            
            this.questionMedia.scale.set(scale);

            // Position media below question text
            this.questionMedia.x = screenWidth / 2;
            this.questionMedia.y = padding + (this.questionMedia.height * scale / 2);
            
            /* Comment out final positioning log
            console.log("Media positioned at:", this.questionMedia.x, this.questionMedia.y, 
                "with scale:", scale, 
                "resulting size:", this.questionMedia.width * scale, "x", this.questionMedia.height * scale);
            */
        }

        // Position answer options container
        this.answerOptionsContainer.x = 0;
        this.answerOptionsContainer.y = screenHeight - screenHeight * 0.4 + this.questionText.height;
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
