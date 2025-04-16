import { Assets, type ProgressCallback, Texture, Spritesheet, Sprite, AnimatedSprite } from 'pixi.js';
import { GifSprite } from 'pixi.js/gif'; // Import GifSprite if you might get it directly

/**
 * Static class providing centralized management for loading and retrieving game assets using PixiJS v8 Assets.
 * Handles manifest initialization, bundle loading, asset retrieval, and unloading.
 */
export class AssetLoader {
    private static manifestLoaded = false;

    /**
     * Initializes the AssetLoader by loading the main asset manifest and the 'common' bundle.
     * Ensures the manifest is loaded only once.
     * @param {string} manifestUrl - The URL of the asset manifest file (e.g., 'assets/asset-manifest.json').
     * @param {ProgressCallback} [onProgress] - Optional callback function for loading progress updates (0-1).
     * @returns {Promise<void>} A promise that resolves when initialization and common bundle loading are complete.
     * @throws Throws an error if initialization or common bundle loading fails.
     */
    public static async init(manifestUrl: string, onProgress?: ProgressCallback): Promise<void> {
        if (this.manifestLoaded) {
            console.warn('Asset manifest already loaded.');
            return;
        }

        try {
            console.log(`Loading asset manifest from: ${manifestUrl}`);
            await Assets.init({ manifest: manifestUrl });
            // Load bundles in the background after init
            // The second argument to loadBundle is an optional progress callback
            await Assets.loadBundle('common', onProgress);
            console.log('Common assets loaded.');
            this.manifestLoaded = true;
        } catch (error) {
            console.error('Failed to initialize AssetLoader or load common assets:', error);
            throw error; // Re-throw error to indicate initialization failure
        }
    }

    /**
     * Loads a specific asset bundle defined in the manifest.
     * Requires {@link init} to have been called successfully first.
     * @param {string} bundleName - The name of the bundle to load.
     * @param {ProgressCallback} [onProgress] - Optional callback function for loading progress updates (0-1).
     * @returns {Promise<void>} A promise that resolves when the bundle is loaded.
     * @throws Throws an error if the AssetLoader was not initialized or if bundle loading fails.
     */
    public static async loadGameBundle(bundleName: string, onProgress?: ProgressCallback): Promise<void> {
        if (!this.manifestLoaded) {
            throw new Error('AssetLoader not initialized. Call init() first.');
        }
        try {
            console.log(`Loading game asset bundle: ${bundleName}`);
            await Assets.loadBundle(bundleName, onProgress);
            console.log(`Game asset bundle "${bundleName}" loaded.`);
        } catch (error) {
            console.error(`Failed to load game asset bundle "${bundleName}":`, error);
            throw error;
        }
    }

    /**
     * Retrieves a loaded asset by its key.
     * It's recommended to use the typed getters like {@link getTexture} or {@link getSpritesheet} when possible.
     * @template T - The expected type of the asset.
     * @param {string} key - The key (alias) of the asset to retrieve.
     * @returns {T} The loaded asset.
     * @throws Throws an error if the asset is not found.
     */
    public static get<T>(key: string): T {
        if (!this.manifestLoaded) {
            console.warn('AssetLoader used before initialization. Asset might not be available yet.');
        }
        const asset = Assets.get<T>(key);
        if (!asset) {
            throw new Error(`Asset with key "${key}" not found.`);
        }
        return asset;
    }

    /**
     * Retrieves a loaded Texture asset by its key.
     * @param {string} key - The key of the texture asset.
     * @returns {Texture} The loaded Texture.
     * @throws Throws an error if the asset is not found or is not a Texture instance.
     */
    public static getTexture(key: string): Texture {
        const asset = this.get<Texture>(key);
        if (!(asset instanceof Texture)) {
            throw new Error(`Asset with key "${key}" is not a Texture.`);
        }
        return asset;
    }

    /**
     * Retrieves a loaded Spritesheet asset by its key.
     * @param {string} key - The key of the spritesheet asset.
     * @returns {Spritesheet} The loaded Spritesheet instance.
     * @throws Throws an error if the asset is not found or is not a Spritesheet instance.
     * @remarks PixiJS v8 might return the spritesheet JSON data object before the Spritesheet instance is fully processed.
     * This method specifically expects and returns the Spritesheet instance.
     */
    public static getSpritesheet(key: string): Spritesheet {
        const asset = this.get<Spritesheet>(key);
        // Note: Pixi v8 Assets.get might return the spritesheet JSON data
        // before the texture is fully processed in some scenarios.
        // A more robust check might involve checking asset.textures or asset.animations.
        // However, direct Spritesheet type check is often sufficient.
        if (!(asset instanceof Spritesheet)) {
             // Attempt to check if it's the data object before throwing
             // Use 'in' operator for safer property checking on potentially narrowed types
             if (asset && typeof asset === 'object' && 'textures' in asset && 'animations' in asset) {
                 console.warn(`Asset with key "${key}" might be spritesheet data, not Spritesheet instance yet.`);
                 // Depending on usage, you might want to return asset as any or handle differently
                 // For now, we'll throw if it's not a Spritesheet instance directly.
             }
            throw new Error(`Asset with key "${key}" is not a Spritesheet instance.`);
        }
        return asset;
    }

    /**
     * Retrieves a loaded asset and returns an appropriate DisplayObject (Sprite, AnimatedSprite, GifSprite).
     * Handles basic image textures, animated spritesheet data, and potentially GifSprites.
     * @param {string} key - The key (alias) of the asset to retrieve.
     * @returns {PIXI.DisplayObject | null} A display object instance, or null if the asset is not found or cannot be represented.
     */
    public static getDisplayObject(key: string): Sprite | AnimatedSprite | GifSprite | null {
        if (!this.manifestLoaded) {
            console.warn('AssetLoader.getDisplayObject used before initialization. Asset might not be available yet.');
        }

        try {
            const resource = Assets.get(key); // Use the generic get first

            if (!resource) {
                console.warn(`AssetLoader.getDisplayObject: Asset with key "${key}" not found in PIXI.Assets cache.`);
                return null;
            }

            // --- Add Detailed Logging ---
            console.log(`[AssetLoader.getDisplayObject] Resource retrieved for key: "${key}"`);
            if (resource) {
                console.log(`  > Type: ${resource.constructor.name}`);
                console.log(`  > Instance of Texture: ${resource instanceof Texture}`);
                console.log(`  > Instance of GifSprite: ${resource instanceof GifSprite}`);
                // Log structure if it's an object
                if (typeof resource === 'object' && resource !== null) {
                    console.log(`  > Properties: ${Object.keys(resource).join(', ')}`);
                    if ('textures' in resource) console.log(`  > Has 'textures' property: ${Array.isArray(resource.textures) ? resource.textures.length : typeof resource.textures}`);
                    if ('frames' in resource) console.log(`  > Has 'frames' property: ${Array.isArray(resource.frames) ? resource.frames.length : typeof resource.frames}`);
                }
            } else {
                 console.log(`  > Resource is null or undefined.`);
            }
             // --- End Detailed Logging ---

            // 1. Check for GifSprite (if pixi.js/gif is used and Assets returns it directly)
            if (resource instanceof GifSprite) {
                console.log(`AssetLoader.getDisplayObject: Returning GifSprite for key "${key}".`);
                // Ensure it plays if needed (optional here, could be done in scene)
                // if (!resource.playing) resource.play();
                return resource;
            }

            // 2. Check for AnimatedSprite data (textures array or frames array)
            if (typeof resource === 'object' && resource !== null) {
                let textures: Texture[] = [];
                if ('textures' in resource && Array.isArray(resource.textures)) {
                    textures = resource.textures.filter((t: unknown): t is Texture => t instanceof Texture);
                } else if ('frames' in resource && Array.isArray(resource.frames)) {
                    textures = resource.frames
                        .map((f: { texture?: Texture }) => f?.texture)
                        .filter((t: Texture | undefined): t is Texture => t instanceof Texture);
                }

                if (textures.length > 0) {
                    console.log(`AssetLoader.getDisplayObject: Creating AnimatedSprite for key "${key}".`);
                    const animSprite = new AnimatedSprite(textures);
                    animSprite.animationSpeed = textures.length > 20 ? 0.2 : 0.1; // Example speed logic
                    animSprite.loop = true;
                    // Play can be started here or in the scene
                    // animSprite.play(); 
                    return animSprite;
                }
            }

            // 3. Check for simple Texture -> Sprite
            if (resource instanceof Texture) {
                console.log(`AssetLoader.getDisplayObject: Creating Sprite for key "${key}".`);
                return new Sprite(resource);
            }
            
            // 4. Handle other potential types (like Spritesheet - might return first frame?)
            if (resource instanceof Spritesheet) {
                 console.warn(`AssetLoader.getDisplayObject: Resource for key "${key}" is a Spritesheet. Returning Sprite of first texture.`);
                 // Attempt to get the first texture from the spritesheet
                 const textures = Object.values(resource.textures);
                 if (textures.length > 0) {
                     return new Sprite(textures[0]);
                 }
            }
            

            // If none of the above match, log a warning and return null
            console.warn(`AssetLoader.getDisplayObject: Unhandled resource type for key "${key}". Type: ${typeof resource}`);
            return null;

        } catch (error) {
            console.error(`AssetLoader.getDisplayObject: Error retrieving asset for key "${key}":`, error);
            return null;
        }
    }

    /**
     * Unloads an asset or an entire bundle to free up memory.
     * @param {string} keyOrBundleId - The key of the specific asset or the ID of the bundle to unload.
     * @returns {Promise<void>} A promise that resolves when the asset/bundle is unloaded.
     * @remarks Errors during unload are logged but not thrown.
     */
    public static async unload(keyOrBundleId: string): Promise<void> {
        try {
            await Assets.unload(keyOrBundleId);
            console.log(`Unloaded asset/bundle: ${keyOrBundleId}`);
        } catch (error) {
            console.error(`Failed to unload asset/bundle "${keyOrBundleId}":`, error);
        }
    }
}
