import { Assets, type ProgressCallback, Texture, Spritesheet, Sprite, AnimatedSprite } from 'pixi.js';
import { GifSprite } from 'pixi.js/gif'; // Keep for direct GifSprite handling

/**
 * Hybrid AssetLoader that combines Phaser's native asset loading with PIXI GIF support.
 * 
 * This class provides centralized management for loading and retrieving game assets:
 * - Uses Phaser's native loader for images, audio, spritesheets, and other standard assets
 * - Uses PIXI.Assets and pixi.js/gif for GIF support (maintaining existing functionality)
 * - Provides a unified interface that maintains compatibility with the existing PixiJS AssetLoader
 * 
 * The hybrid approach ensures:
 * 1. GIF animations continue to work exactly as before
 * 2. Standard assets benefit from Phaser's optimized loading
 * 3. The same API surface is maintained for easy migration
 */
export class AssetLoader {
    private static manifestLoaded = false;
    private static isLoading = false; // Basic flag for load status
    private static loadProgress = 0; // Basic progress tracking
    private static phaserScene: Phaser.Scene | null = null;

    // --- Asset Path Structure ---
    // Assets are organized under the /public directory.
    // Default assets reside in /public/<type>/default/
    // Theme-specific assets reside in /public/<type>/[themeId]/
    // The AssetLoader will resolve the correct path based on the requested asset
    // type and the current theme context (or fallback to default).
    // - Images/Spritesheets: /public/images/(default | [themeId])/
    // - Audio: /public/audio/(default | [themeId])/

    private static DEFAULT_IMAGE_PATH = '/images/default/';
    private static THEME_IMAGE_PATH_PREFIX = '/images/';
    private static DEFAULT_AUDIO_PATH = '/audio/default/';
    private static THEME_AUDIO_PATH_PREFIX = '/audio/';

    private static handleProgress(progress: number): void {
        this.loadProgress = progress;
        // TODO: Emit progress event via EventBus if needed
        // EventBus.emit(ASSET_EVENTS.LOAD_PROGRESS, progress);
        if (progress === 1) {
            this.isLoading = false;
        }
    }

    /**
     * Initializes the AssetLoader with both Phaser and PIXI systems.
     * @param {Phaser.Scene} scene - The Phaser scene for native asset loading
     * @param {string} manifestUrl - The URL of the asset manifest file (e.g., 'assets/asset-manifest.json').
     * @param {ProgressCallback} [onProgress] - Optional callback function for loading progress updates (0-1).
     * @returns {Promise<void>} A promise that resolves when initialization and common bundle loading are complete.
     * @throws Throws an error if initialization or common bundle loading fails.
     */
    public static async init(scene: Phaser.Scene, manifestUrl: string, onProgress?: ProgressCallback): Promise<void> {
        if (this.manifestLoaded) {
            console.warn('Asset manifest already loaded.');
            return;
        }
        if (this.isLoading) {
            console.warn('AssetLoader initialization already in progress.');
            return; // Prevent concurrent initialization
        }

        this.phaserScene = scene;
        this.isLoading = true;
        this.loadProgress = 0;

        try {
            console.log(`Loading asset manifest from: ${manifestUrl}`);
            // Use combined progress handler
            const progressHandler = (p: number) => {
                this.handleProgress(p);
                onProgress?.(p);
            };
            await Assets.init({ manifest: manifestUrl });
            // Load bundles in the background after init
            await Assets.loadBundle('common', progressHandler);
            console.log('Common assets loaded.');
            this.manifestLoaded = true;
        } catch (error) {
            console.error('Failed to initialize AssetLoader or load common assets:', error);
            this.isLoading = false; // Reset flag on error
            throw error; // Re-throw error to indicate initialization failure
        } finally {
            // Ensure isLoading is false if init completes quickly or fails before loadBundle
            if (this.loadProgress === 1 || !this.isLoading) {
                this.isLoading = false;
            }
        }
    }

    /**
     * Loads a specific asset bundle defined in the manifest using PIXI.Assets.
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
        if (this.isLoading) {
            console.warn(`AssetLoader cannot load bundle "${bundleName}" while another load is in progress.`);
            // Optionally, queue or wait, but for now, just return/throw
            return;
        }
        this.isLoading = true;
        this.loadProgress = 0;
        const progressHandler = (p: number) => {
            this.handleProgress(p);
            onProgress?.(p);
        };
        try {
            console.log(`Loading game asset bundle: ${bundleName}`);
            await Assets.loadBundle(bundleName, progressHandler);
            console.log(`Game asset bundle "${bundleName}" loaded.`);
        } catch (error) {
            console.error(`Failed to load game asset bundle "${bundleName}":`, error);
            this.isLoading = false; // Reset flag on error
            throw error;
        }
    }

    /**
     * Loads a single spritesheet asset using PIXI.Assets.
     * Use this for loading spritesheets not defined in the main manifest bundles.
     * @param alias The alias to assign to the loaded spritesheet.
     * @param src The path to the spritesheet JSON file.
     * @param onProgress Optional progress callback.
     * @returns Promise resolving when the spritesheet is loaded.
     */
    public static async loadSpritesheet(alias: string, src: string, onProgress?: ProgressCallback): Promise<void> {
        if (this.isLoading) {
            console.warn(`AssetLoader cannot load spritesheet "${alias}" while another load is in progress.`);
            return;
        }
        this.isLoading = true;
        this.loadProgress = 0;
        const progressHandler = (p: number) => {
            this.handleProgress(p);
            onProgress?.(p);
        };
        try {
            console.log(`Loading spritesheet: ${alias} from ${src}`);
            await Assets.load({ alias, src }, progressHandler);
            console.log(`Spritesheet "${alias}" loaded.`);
        } catch (error) {
            console.error(`Failed to load spritesheet "${alias}" from ${src}:`, error);
            this.isLoading = false; // Reset flag on error
            throw error;
        }
    }

    /**
     * Loads an asset using Phaser's native loader for better performance.
     * This method routes to the appropriate loader based on asset type.
     * @param {string} key - The key to assign to the loaded asset.
     * @param {string} url - The URL of the asset to load.
     * @param {string} [type] - The type of asset ('image', 'audio', 'spritesheet', 'gif').
     * @returns {Promise<void>} A promise that resolves when the asset is loaded.
     */
    public static async loadAsset(key: string, url: string, type?: string): Promise<void> {
        if (!this.phaserScene) {
            throw new Error('AssetLoader not initialized with Phaser scene. Call init() first.');
        }

        // Route GIF assets to PIXI loader
        if (type === 'gif' || url.toLowerCase().endsWith('.gif')) {
            console.log(`Loading GIF asset: ${key} from ${url}`);
            await Assets.load({ alias: key, src: url });
            return;
        }

        // Route other assets to Phaser's native loader
        console.log(`Loading asset via Phaser: ${key} from ${url} (type: ${type || 'auto'})`);
        
        switch (type) {
            case 'image':
                this.phaserScene.load.image(key, url);
                break;
            case 'audio':
                this.phaserScene.load.audio(key, url);
                break;
            case 'spritesheet':
                // For spritesheets, we need both the image and JSON
                const imageUrl = url.replace('.json', '.png');
                this.phaserScene.load.atlas(key, imageUrl, url);
                break;
            default:
                // Auto-detect based on file extension
                if (url.toLowerCase().endsWith('.png') || url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')) {
                    this.phaserScene.load.image(key, url);
                } else if (url.toLowerCase().endsWith('.mp3') || url.toLowerCase().endsWith('.wav') || url.toLowerCase().endsWith('.ogg')) {
                    this.phaserScene.load.audio(key, url);
                } else if (url.toLowerCase().endsWith('.json')) {
                    // Assume it's a spritesheet
                    const imageUrl = url.replace('.json', '.png');
                    this.phaserScene.load.atlas(key, imageUrl, url);
                } else {
                    // Fallback to image
                    this.phaserScene.load.image(key, url);
                }
        }

        // Start loading and wait for completion
        return new Promise((resolve, reject) => {
            this.phaserScene!.load.once('complete', () => {
                console.log(`Asset loaded via Phaser: ${key}`);
                resolve();
            });
            this.phaserScene!.load.once('loaderror', (file: any) => {
                console.error(`Failed to load asset via Phaser: ${key}`, file);
                reject(new Error(`Failed to load asset: ${key}`));
            });
            this.phaserScene!.load.start();
        });
    }

    /**
     * Retrieves a loaded asset by its key from either Phaser or PIXI cache.
     * @template T - The expected type of the asset.
     * @param {string} key - The key (alias) of the asset to retrieve.
     * @returns {T} The loaded asset.
     * @throws Throws an error if the asset is not found.
     */
    public static get<T>(key: string): T {
        if (!this.manifestLoaded && !this.phaserScene) {
            console.warn('AssetLoader used before initialization. Asset might not be available yet.');
        }

        // First try PIXI cache (for GIFs and manifest-based assets)
        const pixiAsset = Assets.get<T>(key);
        if (pixiAsset) {
            return pixiAsset;
        }

        // Then try Phaser cache
        if (this.phaserScene) {
            const phaserAsset = this.phaserScene.cache.get(key);
            if (phaserAsset) {
                return phaserAsset as T;
            }
        }

        console.error(`Asset with key "${key}" not found in either PIXI or Phaser cache`);
        throw new Error(`Asset with key "${key}" not found.`);
    }

    /**
     * Retrieves a loaded Texture asset by its key from PIXI cache.
     * @param {string} key - The key of the texture asset.
     * @returns {Texture} The loaded Texture.
     * @throws Throws an error if the asset is not found or is not a Texture instance.
     */
    public static getTexture(key: string): Texture {
        const asset = this.get<Texture>(key);
        if (!(asset instanceof Texture)) {
            console.error(`Asset type mismatch for key "${key}"`);
            throw new Error(`Asset with key "${key}" is not a Texture.`);
        }
        return asset;
    }

    /**
     * Retrieves a loaded Spritesheet asset by its key from PIXI cache.
     * @param {string} key - The key of the spritesheet asset.
     * @returns {Spritesheet} The loaded Spritesheet instance.
     * @throws Throws an error if the asset is not found or is not a Spritesheet instance.
     */
    public static getSpritesheet(key: string): Spritesheet {
        const asset = this.get<Spritesheet | Record<string, unknown>>(key);

        if (asset instanceof Spritesheet) {
            return asset;
        }

        // Check if it looks like the data object before parsing is complete
        if (asset && typeof asset === 'object' && 'textures' in asset && 'animations' in asset) {
            console.warn(`Asset with key "${key}" appears to be spritesheet data, not instance yet. Waiting might be needed.`);
            const assetAgain = Assets.get<Spritesheet>(key);
            if (assetAgain instanceof Spritesheet) {
                return assetAgain;
            }
            throw new Error(`Asset with key "${key}" is spritesheet data, not a fully processed Spritesheet instance.`);
        }

        console.error(`Asset type mismatch for key "${key}". Expected Spritesheet, got ${asset?.constructor?.name}`);
        throw new Error(`Asset with key "${key}" is not a Spritesheet instance or valid data.`);
    }

    /**
     * Retrieves a loaded asset and returns an appropriate DisplayObject (Sprite, AnimatedSprite, GifSprite).
     * Handles basic image textures, animated spritesheet data, and potentially GifSprites.
     * 
     * This method maintains the same interface as the PixiJS version for compatibility.
     * @param {string} key - The key (alias) of the asset to retrieve.
     * @returns {PIXI.DisplayObject | null} A display object instance, or null if the asset is not found or cannot be represented.
     */
    public static getDisplayObject(key: string): Sprite | AnimatedSprite | GifSprite | null {
        if (!this.manifestLoaded && !this.phaserScene) {
            // console.warn('AssetLoader.getDisplayObject used before initialization. Asset might not be available yet.');
        }

        try {
            // First try PIXI cache (for GIFs and manifest-based assets)
            const resource = Assets.get(key);

            if (!resource) {
                // Try Phaser cache for standard assets
                if (this.phaserScene) {
                    const phaserAsset = this.phaserScene.cache.get(key);
                    if (phaserAsset) {
                        // Convert Phaser asset to PIXI equivalent if needed
                        return this.convertPhaserAssetToPixi(key, phaserAsset);
                    }
                }
                
                console.warn(`AssetLoader.getDisplayObject: Asset with key "${key}" not found in either cache.`);
                return null;
            }

            // Handle PIXI assets (GIFs, spritesheets, textures)
            return this.handlePixiAsset(key, resource);

        } catch (error) {
            console.error(`AssetLoader.getDisplayObject: Error retrieving asset for key "${key}":`, error);
            return null;
        }
    }

    /**
     * Converts a Phaser asset to a PIXI DisplayObject for compatibility.
     * @param {string} key - The asset key.
     * @param {any} phaserAsset - The Phaser asset.
     * @returns {Sprite | null} A PIXI Sprite or null if conversion fails.
     */
    private static convertPhaserAssetToPixi(key: string, phaserAsset: any): Sprite | null {
        try {
            // For now, we'll create a simple sprite from the Phaser asset
            // In a full implementation, you might want to create a wrapper or adapter
            console.log(`Converting Phaser asset to PIXI: ${key}`);
            
            // This is a simplified conversion - in practice, you might need more sophisticated handling
            if (phaserAsset && phaserAsset.base) {
                // Create a PIXI texture from the Phaser asset
                const texture = Texture.from(phaserAsset.base);
                return new Sprite(texture);
            }
            
            return null;
        } catch (error) {
            console.error(`Failed to convert Phaser asset to PIXI: ${key}`, error);
            return null;
        }
    }

    /**
     * Handles PIXI assets (GIFs, spritesheets, textures) and returns appropriate DisplayObjects.
     * @param {string} key - The asset key.
     * @param {any} resource - The PIXI resource.
     * @returns {Sprite | AnimatedSprite | GifSprite | null} The appropriate display object.
     */
    private static handlePixiAsset(key: string, resource: any): Sprite | AnimatedSprite | GifSprite | null {
        // Check for GifSprite (if pixi.js/gif is used and Assets returns it directly)
        if (resource instanceof GifSprite) {
            console.log(`AssetLoader.getDisplayObject: Returning GifSprite for key "${key}".`);
            return resource;
        }

        // Check for Spritesheet instance directly
        if (resource instanceof Spritesheet) {
            console.log(`AssetLoader.getDisplayObject: Resource for key "${key}" is a Spritesheet instance.`);
            const animKeys = Object.keys(resource.animations);
            if (animKeys.length > 0) {
                console.log(`  > Found animations: ${animKeys.join(', ')}. Creating AnimatedSprite from "${animKeys[0]}".`);
                const animSprite = new AnimatedSprite(resource.animations[animKeys[0]]);
                animSprite.animationSpeed = resource.animations[animKeys[0]].length > 20 ? 0.2 : 0.1;
                animSprite.loop = true;
                return animSprite;
            } else {
                console.warn(`  > No animations found in Spritesheet. Returning Sprite of first texture.`);
                const textures = Object.values(resource.textures);
                if (textures.length > 0) {
                    return new Sprite(textures[0] as Texture);
                } else {
                    console.error(`  > Spritesheet "${key}" has no animations and no textures.`);
                    return null;
                }
            }
        }

        // Check for simple Texture -> Sprite
        if (resource instanceof Texture) {
            console.log(`AssetLoader.getDisplayObject: Creating Sprite for key "${key}".`);
            return new Sprite(resource);
        }

        // Check for object with textures/frames array
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
                console.log(`AssetLoader.getDisplayObject: Creating AnimatedSprite from object with textures/frames for key "${key}".`);
                const animSprite = new AnimatedSprite(textures);
                animSprite.animationSpeed = textures.length > 20 ? 0.2 : 0.1;
                animSprite.loop = true;
                return animSprite;
            }
        }

        // If none of the above match, log a warning and return null
        console.warn(`AssetLoader.getDisplayObject: Unhandled resource type for key "${key}". Type: ${typeof resource}, Constructor: ${resource?.constructor?.name}`);
        return null;
    }

    /**
     * Unloads an asset or an entire bundle to free up memory.
     * @param {string} keyOrBundleId - The key of the specific asset or the ID of the bundle to unload.
     * @returns {Promise<void>} A promise that resolves when the asset/bundle is unloaded.
     */
    public static async unload(keyOrBundleId: string): Promise<void> {
        try {
            // Try PIXI unload first
            await Assets.unload(keyOrBundleId);
            console.log(`Unloaded asset/bundle from PIXI: ${keyOrBundleId}`);
        } catch (error) {
            // If PIXI unload fails, try Phaser unload
            if (this.phaserScene) {
                try {
                    this.phaserScene.cache.remove(keyOrBundleId);
                    console.log(`Unloaded asset from Phaser: ${keyOrBundleId}`);
                } catch (phaserError) {
                    console.error(`Failed to unload asset/bundle "${keyOrBundleId}" from both PIXI and Phaser:`, error, phaserError);
                }
            } else {
                console.error(`Failed to unload asset/bundle "${keyOrBundleId}":`, error);
            }
        }
    }

    /**
     * Resolves the full path for an asset based on its type, key, and optional themeId.
     * @param type - The type of asset ('image', 'spritesheet', 'audio').
     * @param key - The unique identifier/filename for the asset.
     * @param themeId - Optional theme identifier.
     * @returns The resolved asset path relative to the public directory.
     */
    private static resolveAssetPath(type: 'image' | 'spritesheet' | 'audio', key: string, themeId?: string): string {
        let basePath = '';
        let themePath = '';

        switch (type) {
            case 'image':
            case 'spritesheet':
                basePath = AssetLoader.DEFAULT_IMAGE_PATH;
                if (themeId) {
                    themePath = `${AssetLoader.THEME_IMAGE_PATH_PREFIX}${themeId}/`;
                }
                break;
            case 'audio':
                basePath = AssetLoader.DEFAULT_AUDIO_PATH;
                if (themeId) {
                    themePath = `${AssetLoader.THEME_AUDIO_PATH_PREFIX}${themeId}/`;
                }
                break;
            default:
                console.warn(`AssetLoader: Unknown asset type "${type}" for key "${key}"`);
                return key;
        }

        const finalPath = themeId ? themePath : basePath;
        return `${finalPath.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
    }

    /**
     * Preloads a list of assets or bundles using the appropriate loader.
     * @param assets - An array of asset keys or bundle names.
     * @returns Promise<void> that resolves when preloading is complete.
     */
    public static async preloadAssets(assets: string[]): Promise<void> {
        if (!this.manifestLoaded && !this.phaserScene) {
            console.warn('AssetLoader.preloadAssets called before init. Manifest might be incomplete.');
        }
        if (!Array.isArray(assets) || assets.some(a => typeof a !== 'string')) {
            console.error('AssetLoader.preloadAssets expects an array of strings (asset keys or bundle names).');
            return;
        }
        try {
            console.log('Preloading assets/bundles:', assets);
            
            // Separate GIFs from other assets
            const gifAssets: string[] = [];
            const otherAssets: string[] = [];
            
            assets.forEach(asset => {
                if (asset.toLowerCase().includes('.gif') || asset.toLowerCase().includes('gif')) {
                    gifAssets.push(asset);
                } else {
                    otherAssets.push(asset);
                }
            });
            
            // Load GIFs via PIXI
            if (gifAssets.length > 0) {
                await Assets.backgroundLoad(gifAssets);
            }
            
            // Load other assets via Phaser
            if (otherAssets.length > 0 && this.phaserScene) {
                // For now, we'll use PIXI for all assets to maintain compatibility
                // In a full implementation, you might want to route to Phaser's preloader
                await Assets.backgroundLoad(otherAssets);
            }
            
            console.log('Preloading complete.');
        } catch (error) {
            console.error('Error during asset preloading:', error);
        }
    }

    /**
     * Gets the current loading status.
     * @returns Object containing isLoading boolean and progress number (0-1).
     */
    public static getLoadStatus(): { isLoading: boolean; progress: number } {
        return { isLoading: this.isLoading, progress: this.loadProgress };
    }

    /**
     * Gets the Phaser scene instance.
     * @returns The Phaser scene or null if not initialized.
     */
    public static getPhaserScene(): Phaser.Scene | null {
        return this.phaserScene;
    }
}
