import { Assets, type ProgressCallback, Texture, Spritesheet, Sprite, AnimatedSprite } from 'pixi.js';
import { GifSprite } from 'pixi.js/gif'; // Keep for direct GifSprite handling


/**
 * Static class providing centralized management for loading and retrieving game assets using PixiJS v8 Assets.
 * Handles manifest initialization, bundle loading, asset retrieval, and unloading.
 */
export class AssetLoader {
	private static manifestLoaded = false;
	private static isLoading = false; // Basic flag for load status
	private static loadProgress = 0; // Basic progress tracking

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

	// TODO: Define a more structured way to handle asset manifests if needed
	// type AssetManifest = {
	//   images: { [key: string]: string };
	//   spritesheets: { [key: string]: string }; // Path to the JSON definition
	//   audio: { [key: string]: string };
	// };

	private static handleProgress(progress: number): void {
		this.loadProgress = progress;
		// TODO: Emit progress event via EventBus if needed
		// EventBus.emit(ASSET_EVENTS.LOAD_PROGRESS, progress);
		if (progress === 1) {
			this.isLoading = false;
		}
	}

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
		if (this.isLoading) {
			console.warn('AssetLoader initialization already in progress.');
			return; // Prevent concurrent initialization
		}

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
	 * Loads a single spritesheet asset.
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
			// Add more context to the er
			console.error(`Asset with key "${key}" not found`);
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
			console.error(`Asset type mismatch for key "${key}"`);
			throw new Error(`Asset with key "${key}" is not a Texture.`);
		}
		return asset;
	}

	/**
	 * Retrieves a loaded Spritesheet asset by its key.
	 * @param {string} key - The key of the spritesheet asset.
	 * @returns {Spritesheet} The loaded Spritesheet instance.
	 * @throws Throws an error if the asset is not found or is not a Spritesheet instance.
	 * @remarks PixiJS v8 Assets might resolve the load promise before the Spritesheet instance is fully processed.
	 * If you encounter issues, ensure loading is complete before calling this.
	 */
	public static getSpritesheet(key: string): Spritesheet {
		const asset = this.get<Spritesheet | Record<string, unknown>>(key); // Use Record<string, unknown> for generic object

		if (asset instanceof Spritesheet) {
			// Directly return if it's already a Spritesheet instance
			return asset;
		}

		// Check if it looks like the data object before parsing is complete using 'in' operator
		if (asset && typeof asset === 'object' && 'textures' in asset && 'animations' in asset) {
			console.warn(`Asset with key "${key}" appears to be spritesheet data, not instance yet. Waiting might be needed.`);
			// Attempt to re-get, sometimes it resolves later. This is not guaranteed.
			const assetAgain = Assets.get<Spritesheet>(key);
			if (assetAgain instanceof Spritesheet) {
				return assetAgain;
			}
			// If still not an instance, throw. Caller might need to implement waiting logic.
			throw new Error(`Asset with key "${key}" is spritesheet data, not a fully processed Spritesheet instance.`);
		}

		console.error(`Asset type mismatch for key "${key}". Expected Spritesheet, got ${asset?.constructor?.name}`);
		throw new Error(`Asset with key "${key}" is not a Spritesheet instance or valid data.`);
	}

	/**
	 * Retrieves a loaded asset and returns an appropriate DisplayObject (Sprite, AnimatedSprite, GifSprite).
	 * Handles basic image textures, animated spritesheet data, and potentially GifSprites.
	 * CRITICAL: Order of checks matters. Checks are added without removing existing ones.
	 * @param {string} key - The key (alias) of the asset to retrieve.
	 * @returns {PIXI.DisplayObject | null} A display object instance, or null if the asset is not found or cannot be represented.
	 */
	public static getDisplayObject(key: string): Sprite | AnimatedSprite | GifSprite | null {
		if (!this.manifestLoaded) {
			// console.warn('AssetLoader.getDisplayObject used before initialization. Asset might not be available yet.');
		}

		try {
			const resource = Assets.get(key); // Use the generic get first

			if (!resource) {
				console.warn(`AssetLoader.getDisplayObject: Asset with key "${key}" not found in PIXI.Assets cache.`);
				return null;
			}

			// [Existing Check 1] Check for GifSprite (if pixi.js/gif is used and Assets returns it directly)
			if (resource instanceof GifSprite) {
				console.log(`AssetLoader.getDisplayObject: Returning GifSprite for key "${key}".`);
				return resource;
			}

			// [NEW Check 2] Check for Spritesheet instance directly
			if (resource instanceof Spritesheet) {
				console.log(`AssetLoader.getDisplayObject: Resource for key "${key}" is a Spritesheet instance.`);
				// Attempt to get animations
				const animKeys = Object.keys(resource.animations);
				if (animKeys.length > 0) {
					console.log(`  > Found animations: ${animKeys.join(', ')}. Creating AnimatedSprite from "${animKeys[0]}".`);
					// Create AnimatedSprite from the first animation found
					const animSprite = new AnimatedSprite(resource.animations[animKeys[0]]);
					animSprite.animationSpeed = resource.animations[animKeys[0]].length > 20 ? 0.2 : 0.1; // Example speed
					animSprite.loop = true;
					// Play can be started here or in the scene
					// animSprite.play();
					return animSprite;
				} else {
					// If it's a Spritesheet but has no animations, return Sprite of first texture
					console.warn(`  > No animations found in Spritesheet. Returning Sprite of first texture.`);
					const textures = Object.values(resource.textures);
					if (textures.length > 0) {
						return new Sprite(textures[0]);
					} else {
						console.error(`  > Spritesheet "${key}" has no animations and no textures.`);
						return null;
					}
				}
			}

			// [Existing Check 3] Check for simple Texture -> Sprite
			if (resource instanceof Texture) {
				console.log(`AssetLoader.getDisplayObject: Creating Sprite for key "${key}".`);
				return new Sprite(resource);
			}

			// [Existing Check 4 - Potentially for previous spritesheet attempt or other complex objects]
			// Check for object with textures/frames array (might have been added before)
			// --- This check remains untouched to avoid breaking other potential use cases ---
			if (typeof resource === 'object' && resource !== null) {
				let textures: Texture[] = [];
				// This logic might create AnimatedSprites from assets that aren't true spritesheets
				// if they happen to have a 'textures' or 'frames' property. Keep it for now.
				if ('textures' in resource && Array.isArray(resource.textures)) {
					textures = resource.textures.filter((t: unknown): t is Texture => t instanceof Texture);
				} else if ('frames' in resource && Array.isArray(resource.frames)) {
					// This specifically handles formats like TexturePacker might output if not loaded as a Spritesheet instance
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

	/**
	 * Resolves the full path for an asset based on its type, key, and optional themeId.
	 * It prioritizes theme-specific assets and falls back to default assets.
	 * Note: This is a basic example; theme-specific path checking might need refinement
	 * based on how theme availability is determined.
	 * @param type - The type of asset ('image', 'spritesheet', 'audio').
	 * @param key - The unique identifier/filename for the asset (e.g., 'player.png', 'ui_sheet.json').
	 * @param themeId - Optional theme identifier.
	 * @returns The resolved asset path relative to the public directory.
	 */
	// Made static as the class methods are static
	private static resolveAssetPath(type: 'image' | 'spritesheet' | 'audio', key: string, themeId?: string): string {
		let basePath = '';
		let themePath = '';

		switch (type) {
			case 'image':
			case 'spritesheet': // Spritesheets often live alongside their images
				// Corrected static access
				basePath = AssetLoader.DEFAULT_IMAGE_PATH;
				if (themeId) {
					themePath = `${AssetLoader.THEME_IMAGE_PATH_PREFIX}${themeId}/`;
				}
				break;
			case 'audio':
				// Corrected static access
				basePath = AssetLoader.DEFAULT_AUDIO_PATH;
				if (themeId) {
					themePath = `${AssetLoader.THEME_AUDIO_PATH_PREFIX}${themeId}/`;
				}
				break;
			default:
				console.warn(`AssetLoader: Unknown asset type "${type}" for key "${key}"`);
				return key; // Return key as fallback
		}

		// TODO: Implement actual check for theme asset existence if needed.
		// For now, assume theme path is valid if themeId is provided.
		const finalPath = themeId ? themePath : basePath;

		// Ensure leading/trailing slashes are handled correctly
		return `${finalPath.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
	}

	/**
	 * Preloads a list of assets or bundles (identified by string keys) in the background.
	 * @param assets - An array of asset keys or bundle names defined in the manifest.
	 * @returns Promise<void> that resolves when preloading is complete.
	 */
	public static async preloadAssets(assets: string[]): Promise<void> { // Changed parameter type to string[]
		if (!this.manifestLoaded) {
			console.warn('AssetLoader.preloadAssets called before init. Manifest might be incomplete.');
		}
		if (!Array.isArray(assets) || assets.some(a => typeof a !== 'string')) {
			console.error('AssetLoader.preloadAssets expects an array of strings (asset keys or bundle names).');
			return; // Or throw error
		}
		try {
			console.log('Preloading assets/bundles:', assets);
			// PIXI.Assets.backgroundLoad handles bundles and individual assets identified by keys
			await Assets.backgroundLoad(assets); // Now type matches
			console.log('Preloading complete.');
		} catch (error) {
			console.error('Error during asset preloading:', error);
			// Decide if this should throw or just log
		}
	}

	/**
	 * Gets the current loading status.
	 * @returns Object containing isLoading boolean and progress number (0-1).
	 */
	public static getLoadStatus(): { isLoading: boolean; progress: number } {
		// Note: This is a simplified status based on the last load operation initiated
		// by this class. PIXI.Assets doesn't expose a global loading flag easily.
		return { isLoading: this.isLoading, progress: this.loadProgress };
	}
}
