/**
 * Simplified AssetLoader for Phaser 3 - Static Images Only (Phase 3)
 * 
 * This class provides centralized management for loading and retrieving game assets:
 * - Uses Phaser's native loader for images, audio, spritesheets
 * - Simplified interface for stable loading
 * - GIF support deferred to Phase 7
 * 
 * This simplified approach ensures:
 * 1. Stable application loading without complex dependencies
 * 2. Standard assets work with Phaser's optimized loading
 * 3. Easy migration path for future enhancements
 */
export class AssetLoader {
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
        if (progress === 1) {
            this.isLoading = false;
        }
    }

    /**
     * Initializes the AssetLoader with Phaser scene.
     * @param {Phaser.Scene} scene - The Phaser scene for native asset loading
     * @returns {Promise<void>} A promise that resolves when initialization is complete.
     */
    public static async init(scene: Phaser.Scene): Promise<void> {
        if (this.phaserScene) {
            console.warn('AssetLoader already initialized.');
            return;
        }
        if (this.isLoading) {
            console.warn('AssetLoader initialization already in progress.');
            return; // Prevent concurrent initialization
        }

        this.phaserScene = scene;
        this.isLoading = false;
        this.loadProgress = 1;
        console.log('AssetLoader initialized with Phaser scene.');
    }

    /**
     * Loads a specific asset bundle (placeholder for future implementation).
     * @param {string} bundleName - The name of the bundle to load.
     * @returns {Promise<void>} A promise that resolves immediately (placeholder).
     */
    public static async loadGameBundle(bundleName: string): Promise<void> {
        console.log(`AssetLoader: Bundle loading not implemented in Phase 3. Bundle: ${bundleName}`);
        return Promise.resolve();
    }

    /**
     * Loads a single spritesheet asset using Phaser's native loader.
     * @param alias The alias to assign to the loaded spritesheet.
     * @param src The path to the spritesheet JSON file.
     * @returns Promise resolving when the spritesheet is loaded.
     */
    public static async loadSpritesheet(alias: string, src: string): Promise<void> {
        if (!this.phaserScene) {
            throw new Error('AssetLoader not initialized. Call init() first.');
        }
        
        const imageUrl = src.replace('.json', '.png');
        return this.loadAsset(alias, imageUrl, 'spritesheet');
    }

    /**
     * Loads an asset using Phaser's native loader.
     * @param {string} key - The key to assign to the loaded asset.
     * @param {string} url - The URL of the asset to load.
     * @param {string} [type] - The type of asset ('image', 'audio', 'spritesheet').
     * @returns {Promise<void>} A promise that resolves when the asset is loaded.
     */
    public static async loadAsset(key: string, url: string, type?: string): Promise<void> {
        if (!this.phaserScene) {
            throw new Error('AssetLoader not initialized with Phaser scene. Call init() first.');
        }

        // GIF support deferred to Phase 7
        if (type === 'gif' || url.toLowerCase().endsWith('.gif')) {
            console.warn(`GIF support deferred to Phase 7. Skipping: ${key}`);
            return Promise.resolve();
        }

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.phaserScene!.load.once('loaderror', (file: any) => {
                console.error(`Failed to load asset via Phaser: ${key}`, file);
                reject(new Error(`Failed to load asset: ${key}`));
            });
            this.phaserScene!.load.start();
        });
    }

    /**
     * Retrieves a loaded asset by its key from Phaser cache.
     * @template T - The expected type of the asset.
     * @param {string} key - The key (alias) of the asset to retrieve.
     * @returns {T} The loaded asset.
     * @throws Throws an error if the asset is not found.
     */
    public static get<T>(key: string): T {
        if (!this.phaserScene) {
            throw new Error('AssetLoader not initialized. Call init() first.');
        }

        const phaserAsset = this.phaserScene.textures.get(key);
        if (phaserAsset) {
            return phaserAsset as T;
        }

        console.error(`Asset with key "${key}" not found in Phaser cache`);
        throw new Error(`Asset with key "${key}" not found.`);
    }

    /**
     * Retrieves a loaded image asset by its key from Phaser cache.
     * @param {string} key - The key of the image asset.
     * @returns {Phaser.Textures.Texture} The loaded Phaser texture.
     * @throws Throws an error if the asset is not found.
     */
    public static getTexture(key: string): Phaser.Textures.Texture {
        return this.get<Phaser.Textures.Texture>(key);
    }

    /**
     * Retrieves a loaded atlas asset by its key from Phaser cache.
     * @param {string} key - The key of the atlas asset.
     * @returns {Phaser.Textures.TextureManager} The loaded Phaser atlas.
     * @throws Throws an error if the asset is not found.
     */
    public static getSpritesheet(key: string): Phaser.Textures.TextureManager {
        return this.get<Phaser.Textures.TextureManager>(key);
    }

    /**
     * Retrieves a loaded asset and returns a Phaser GameObject.
     * This method is simplified for Phase 3 - GIF support deferred to Phase 7.
     * @param {string} key - The key (alias) of the asset to retrieve.
     * @returns {Phaser.GameObjects.Sprite | null} A Phaser sprite or null if the asset is not found.
     */
    public static getDisplayObject(key: string): Phaser.GameObjects.Sprite | null {
        if (!this.phaserScene) {
            console.warn('AssetLoader not initialized. Call init() first.');
            return null;
        }

        try {
            const texture = this.phaserScene.textures.get(key);
            if (texture) {
                return this.phaserScene.add.sprite(0, 0, key);
            }
            
            console.warn(`AssetLoader.getDisplayObject: Asset with key "${key}" not found.`);
            return null;
        } catch (error) {
            console.error(`AssetLoader.getDisplayObject: Error retrieving asset for key "${key}":`, error);
            return null;
        }
    }

    /**
     * Unloads an asset to free up memory.
     * @param {string} key - The key of the specific asset to unload.
     * @returns {Promise<void>} A promise that resolves when the asset is unloaded.
     */
    public static async unload(key: string): Promise<void> {
        if (!this.phaserScene) {
            console.warn('AssetLoader not initialized. Cannot unload asset.');
            return;
        }

        try {
            this.phaserScene.textures.remove(key);
            console.log(`Unloaded asset from Phaser: ${key}`);
        } catch (error) {
            console.error(`Failed to unload asset "${key}":`, error);
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
     * Preloads a list of assets using Phaser's loader.
     * @param assets - An array of asset keys.
     * @returns Promise<void> that resolves when preloading is complete.
     */
    public static async preloadAssets(assets: string[]): Promise<void> {
        if (!this.phaserScene) {
            console.warn('AssetLoader.preloadAssets called before init.');
            return;
        }
        if (!Array.isArray(assets) || assets.some(a => typeof a !== 'string')) {
            console.error('AssetLoader.preloadAssets expects an array of strings (asset keys).');
            return;
        }
        
        console.log('Preloading assets:', assets);
        console.log('AssetLoader: Preloading not fully implemented in Phase 3. Assets:', assets);
        // TODO: Implement proper preloading in Phase 4
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
