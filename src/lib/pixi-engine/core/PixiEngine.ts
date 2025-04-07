import { Assets, Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';
import { PixiApplication, PixiApplicationOptions } from './PixiApplication';

export interface PixiEngineOptions extends PixiApplicationOptions {
  debug?: boolean;
  loadAssetsOnInit?: boolean;
  assetManifest?: { 
    bundles: { name: string; assets: Record<string, string> }[] 
  };
}

export type EngineUpdateCallback = (deltaTime: number) => void;

/**
 * PixiEngine - Manages the overall game engine including asset loading,
 * scenes, and update loops.
 */
export class PixiEngine {
  /** The main PixiApplication instance */
  private app: PixiApplication;
  
  /** Container for the current scene */
  private currentScene: Container | null = null;
  
  /** Options for the engine */
  private options: PixiEngineOptions;
  
  /** Whether the engine has been initialized */
  private initialized = false;
  
  /** List of update callbacks to be executed each frame */
  private updateCallbacks: EngineUpdateCallback[] = [];
  
  /** Asset loading status */
  private assetLoadingStatus = {
    loaded: false,
    progress: 0,
    errors: [] as string[]
  };

  /**
   * Constructor for the PixiEngine class
   * @param options - Configuration options for the engine
   */
  constructor(options: PixiEngineOptions = {}) {
    this.options = {
      debug: options.debug || false,
      loadAssetsOnInit: options.loadAssetsOnInit !== undefined ? options.loadAssetsOnInit : true,
      assetManifest: options.assetManifest || { bundles: [] },
      ...options
    };
    
    // Initialize the PixiApplication with the options
    this.app = new PixiApplication(this.options);
  }

  /**
   * Initialize the engine
   * @returns A promise that resolves when initialization is complete
   */
  public async init(): Promise<void> {
    if (this.initialized) {
      console.warn('PixiEngine already initialized');
      return;
    }
    
    console.log('Initializing PixiEngine...');
    
    try {
      // Initialize the PixiApplication
      await this.app.init();
      
      // Set up update callback to propagate to registered callbacks
      this.app.getApp().ticker.add(this.handleUpdate);
      
      // Load assets if specified
      if (this.options.loadAssetsOnInit && this.options.assetManifest) {
        console.log('Auto-loading assets on init');
        await this.loadAssets();
      }
      
      if (this.options.debug) {
        console.log('Debug mode enabled, creating test sprite');
        await this.createTestSprite();
      }
      
      this.initialized = true;
      console.log('PixiEngine initialized successfully');
    } catch (error) {
      console.error('Error initializing PixiEngine:', error);
      throw error;
    }
  }

  /**
   * Load all assets from the asset manifest
   * @returns A promise that resolves when all assets are loaded
   */
  public async loadAssets(): Promise<void> {
    if (!this.options.assetManifest || this.options.assetManifest.bundles.length === 0) {
      console.warn('No assets to load');
      this.assetLoadingStatus.loaded = true;
      this.assetLoadingStatus.progress = 100;
      return;
    }
    
    try {
      console.log('Starting asset loading...');
      
      // Reset asset loading status
      this.assetLoadingStatus = {
        loaded: false,
        progress: 0,
        errors: []
      };
      
      // Add the bundles from the manifest
      for (const bundle of this.options.assetManifest.bundles) {
        console.log(`Adding bundle: ${bundle.name}`);
        Assets.addBundle(bundle.name, bundle.assets);
      }
      
      // Create a list of all bundle names
      const bundleNames = this.options.assetManifest.bundles.map(bundle => bundle.name);
      
      // Set up progress callback
      Assets.loadBundle(bundleNames, (progress) => {
        this.assetLoadingStatus.progress = Math.round(progress * 100);
        if (this.options.debug) {
          console.log(`Asset loading progress: ${this.assetLoadingStatus.progress}%`);
        }
      }).then((loadedAssets) => {
        console.log('All assets loaded successfully:', Object.keys(loadedAssets));
        this.assetLoadingStatus.loaded = true;
      }).catch((error) => {
        console.error('Error loading assets:', error);
        this.assetLoadingStatus.errors.push(error.toString());
      });
    } catch (error) {
      console.error('Error in loadAssets:', error);
      this.assetLoadingStatus.errors.push(`Error in loadAssets: ${error}`);
      throw error;
    }
  }

  /**
   * Create a test sprite to verify that the engine is working
   * Only called in debug mode
   */
  private async createTestSprite(): Promise<void> {
    try {
      console.log('Creating test graphics...');
      
      // Create a graphics object
      const graphics = new Graphics();
      
      // Draw a simple shape
      graphics
        .rect(0, 0, 100, 100)
        .fill({ color: 0xff0000 })
        .circle(150, 150, 50)
        .fill({ color: 0x00ff00 })
        .roundRect(200, 50, 100, 100, 15)
        .fill({ color: 0x0000ff });
      
      // Add to the stage
      this.app.getStage().addChild(graphics);
      
      // Try to load a bunny texture
      console.log('Loading test bunny texture...');
      try {
        // Try to load the bunny texture
        const bunnyTexture = await Assets.load<Texture>('https://pixijs.com/assets/bunny.png');
        
        if (bunnyTexture) {
          console.log('Bunny texture loaded successfully, creating sprite');
          
          // Create a new Sprite using the bunny texture
          const bunny = new Sprite(bunnyTexture);
          
          // Center the sprite's anchor point
          bunny.anchor.set(0.5);
          
          // Move the sprite to the center of the screen
          bunny.x = this.app.getApp().screen.width / 2;
          bunny.y = this.app.getApp().screen.height / 2;
          
          // Set a bright color tint for visibility
          bunny.tint = 0xff0000;
          
          // Scale up for visibility
          bunny.scale.set(3);
          
          // Add to the stage
          this.app.getStage().addChild(bunny);
          
          // Set up a simple animation for the bunny
          const animate = (ticker: Ticker): void => {
            // Get delta time from ticker
            const delta = ticker.deltaTime;
            
            // Rotate the bunny
            bunny.rotation += 0.1 * delta;
            
            // Make the bunny "breathe" by scaling
            const time = this.app.getApp().ticker.lastTime / 1000;
            const scale = 2.5 + Math.sin(time * 2) * 0.5;
            bunny.scale.set(scale);
          };
          
          // Add the animation to the ticker
          this.app.getApp().ticker.add(animate);
          
          console.log('Test bunny added to stage');
        } else {
          console.warn('Failed to load bunny texture, it is null or undefined');
        }
      } catch (textureError) {
        console.error('Error loading test bunny texture:', textureError);
      }
    } catch (error) {
      console.error('Error creating test sprite:', error);
    }
  }

  /**
   * Handles the ticker update and calls the update method with the correct parameter
   */
  private handleUpdate = (ticker: Ticker): void => {
    // Extract delta time from ticker
    const deltaTime = ticker.deltaTime;
    this.update(deltaTime);
  };

  /**
   * Main update loop, called each frame
   * @param deltaTime - Time elapsed since the last frame
   */
  private update = (deltaTime: number): void => {
    // Call all registered update callbacks
    for (const callback of this.updateCallbacks) {
      callback(deltaTime);
    }
  };

  /**
   * Register an update callback
   * @param callback - The function to call each frame
   * @returns A function that removes the callback when called
   */
  public onUpdate(callback: EngineUpdateCallback): () => void {
    this.updateCallbacks.push(callback);
    
    // Return a function that removes the callback
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index !== -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get the PixiApplication instance
   * @returns The PixiApplication instance
   */
  public getApp(): PixiApplication {
    return this.app;
  }

  /**
   * Get the current scene
   * @returns The current scene container or null if none is set
   */
  public getScene(): Container | null {
    return this.currentScene;
  }

  /**
   * Set the current scene
   * @param scene - The new scene container
   */
  public setScene(scene: Container): void {
    // Remove the current scene if one exists
    if (this.currentScene) {
      this.app.getStage().removeChild(this.currentScene);
    }
    
    // Set and add the new scene
    this.currentScene = scene;
    this.app.getStage().addChild(scene);
  }

  /**
   * Get the current asset loading status
   * @returns The current asset loading status
   */
  public getAssetLoadingStatus(): { loaded: boolean; progress: number; errors: string[] } {
    return { ...this.assetLoadingStatus };
  }

  /**
   * Check if a specific asset is loaded
   * @param assetPath - The path of the asset to check
   * @returns True if the asset is loaded, false otherwise
   */
  public isAssetLoaded(assetPath: string): boolean {
    try {
      return Assets.cache.has(assetPath);
    } catch (error) {
      console.error('Error checking if asset is loaded:', error);
      return false;
    }
  }

  /**
   * Get a loaded texture
   * @param assetPath - The path or name of the texture
   * @returns The texture or null if not found
   */
  public getTexture(assetPath: string): Texture | null {
    try {
      return Assets.get(assetPath);
    } catch (error) {
      console.error(`Error getting texture ${assetPath}:`, error);
      return null;
    }
  }

  /**
   * Get a pre-created sprite from a loaded texture
   * @param assetPath - The path or name of the texture
   * @returns A new sprite with the texture or null if not found
   */
  public getSprite(assetPath: string): Sprite | null {
    const texture = this.getTexture(assetPath);
    if (!texture) {
      console.warn(`Texture not found for path: ${assetPath}`);
      return null;
    }
    
    return new Sprite(texture);
  }
  
  /**
   * Load a specific texture
   * @param path - The path to the texture
   * @param name - Optional name to reference the texture
   * @returns A promise that resolves to the loaded texture
   */
  public async loadTexture(path: string, name?: string): Promise<Texture> {
    try {
      if (name) {
        // Create a simple bundle with name as alias for path
        Assets.add({ alias: name, src: path });
        return await Assets.load<Texture>(name);
      } else {
        return await Assets.load<Texture>(path);
      }
    } catch (error) {
      console.error(`Error loading texture from ${path}:`, error);
      throw error;
    }
  }

  /**
   * Clean up resources when the engine is no longer needed
   */
  public destroy(): void {
    // Clear update callbacks
    this.updateCallbacks = [];
    
    // Destroy the PixiApplication
    this.app.destroy();
    
    // Reset initialized flag
    this.initialized = false;
  }
} 