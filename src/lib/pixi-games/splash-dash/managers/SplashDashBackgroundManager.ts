import * as PIXI from 'pixi.js';
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { ENGINE_EVENTS } from '@/lib/pixi-engine/core/EventTypes';
import { SplashDashLayoutManager } from './SplashDashLayoutManager';

export class SplashDashBackgroundManager {
    private view: PIXI.Container;
    private background: PIXI.Graphics;
    private app: PIXI.Application;
    private themeConfig: Record<string, unknown>;
    private eventBus: EventBus;
    private assetLoader: typeof AssetLoader;
    private layoutManager: SplashDashLayoutManager;
    
    // Water effect properties
    private waterTexture: PIXI.Texture | null = null;
    private waterSprite: PIXI.Sprite | null = null;
    private waterFilter: PIXI.Filter | null = null;
    private animationTime: number = 0;
    
    // Animated water tiles
    private waterTiles: PIXI.AnimatedSprite[] = [];
    private waterTextures: PIXI.Texture[] = [];
    private tileSize: number = 0;
    private tilesX: number = 0;
    private tilesY: number = 0;
    
    // Displacement filter for water distortion
    private displacementFilter: PIXI.DisplacementFilter | null = null;
    private displacementSprite: PIXI.Sprite | null = null;
    
    // Contrast reduction overlay
    private contrastOverlay: PIXI.Graphics | null = null;
    
    
    // Corner leaf sprites
    private cornerLeaves: {
        topleft: PIXI.Sprite | null;
        topright: PIXI.Sprite | null;
        bottomleft: PIXI.Sprite | null;
        bottomright: PIXI.Sprite | null;
    } = {
        topleft: null,
        topright: null,
        bottomleft: null,
        bottomright: null
    };

    constructor(app: PIXI.Application, themeConfig: Record<string, unknown>, eventBus: EventBus, assetLoader: typeof AssetLoader, layoutManager: SplashDashLayoutManager) {
        console.log('SplashDashBackgroundManager created');
        this.app = app;
        this.themeConfig = themeConfig;
        this.eventBus = eventBus;
        this.assetLoader = assetLoader;
        this.layoutManager = layoutManager;
        
        this.view = new PIXI.Container();
        this.view.label = 'SplashDashBackground';
        
        // Create water background
        this.background = new PIXI.Graphics();
        this._initBackground();
        this.view.addChild(this.background);
        
        this._bindEvents();
    }

    private async _initBackground(): Promise<void> {
        const { width, height } = this.app.screen;
        console.log(`SplashDashBackgroundManager: Creating animated water background with screen size ${width}x${height}`);
        
        // Clear previous background
        this.background.clear();
        
        // Load water animation textures
        await this._loadWaterTextures();
        
        // Create animated water tiles
        this._createWaterTiles(width, height);
        
        // Load and position corner leaves
        await this._loadCornerLeaves(width, height);
        
        console.log(`SplashDashBackgroundManager: Background initialization complete`);
        console.log(`SplashDashBackgroundManager: Background view children count: ${this.view.children.length}`);
    }

    private _bindEvents(): void {
        if (this.eventBus) {
            this.eventBus.on(ENGINE_EVENTS.RESIZED, this._handleResize);
            // Listen for when the engine is ready to reinitialize background
            this.eventBus.on(ENGINE_EVENTS.ENGINE_READY_FOR_GAME, this._handleEngineReady);
        } else {
            console.warn('SplashDashBackgroundManager: EventBus not available, skipping event binding');
        }
    }

    private _handleResize = (): void => {
        // Update layout manager first, then reinitialize background
        const { width, height } = this.app.screen;
        this.layoutManager.updateLayout(width, height);
        this._initBackground();
    }

    private _handleEngineReady = (): void => {
        console.log('SplashDashBackgroundManager: Engine ready, reinitializing background');
        // Reinitialize background now that app is fully ready
        this._initBackground();
    }


    private async _loadCornerLeaves(width: number, height: number): Promise<void> {
        try {
            // Calculate the bottom UI height to position bottom leaves above the question box
            const BOTTOM_UI_HEIGHT = this.layoutManager.getLayoutParams().bottomUIHeight;
            const bottomY = height - BOTTOM_UI_HEIGHT;
            
            const cornerPositions = [
                { key: 'topleft', x: 0, y: 0, anchor: { x: 0, y: 0 } },
                { key: 'topright', x: width, y: 0, anchor: { x: 1, y: 0 } },
                { key: 'bottomleft', x: 0, y: bottomY, anchor: { x: 0, y: 1 } },
                { key: 'bottomright', x: width, y: bottomY, anchor: { x: 1, y: 1 } }
            ];

            for (const corner of cornerPositions) {
                const assetPath = `/images/splash-dash/${corner.key}.png`;
                console.log(`SplashDashBackgroundManager: Loading corner leaf: ${assetPath}`);
                
                try {
                    const texture = await PIXI.Assets.load(assetPath);
                    const sprite = PIXI.Sprite.from(texture);
                    
                    // Position sprite in corner
                    sprite.x = corner.x;
                    sprite.y = corner.y;
                    sprite.anchor.set(corner.anchor.x, corner.anchor.y);
                    
                    // Reduce size by 20% (scale to 0.8)
                    sprite.scale.set(0.8);
                    
                    // Add slight transparency for water effect
                    sprite.alpha = 0.9;
                    
                    this.view.addChild(sprite);
                    this.cornerLeaves[corner.key as keyof typeof this.cornerLeaves] = sprite;
                    
                    console.log(`SplashDashBackgroundManager: Loaded ${corner.key} leaf at (${corner.x}, ${corner.y})`);
                } catch (error) {
                    console.warn(`SplashDashBackgroundManager: Failed to load ${corner.key} leaf:`, error);
                }
            }
        } catch (error) {
            console.error('SplashDashBackgroundManager: Error loading corner leaves:', error);
        }
    }

    public update(): void {
        // Animated sprites handle their own animation updates
        // No additional update logic needed for the water tiles
    }

    public getView(): PIXI.Container {
        return this.view;
    }

    /**
     * Updates the layout when screen dimensions change
     */
    public updateLayout(screenWidth: number, screenHeight: number): void {
        this.layoutManager.updateLayout(screenWidth, screenHeight);
        this._initBackground();
    }

    /**
     * Loads all 40 water animation frame textures
     */
    private async _loadWaterTextures(): Promise<void> {
        console.log('SplashDashBackgroundManager: Loading water animation textures...');
        
        this.waterTextures = [];
        
        // Load all 40 frames (0000.png to 0039.png)
        for (let i = 0; i < 40; i++) {
            const frameNumber = i.toString().padStart(4, '0');
            const texturePath = `/images/splash-dash/water/${frameNumber}.png`;
            
            try {
                const texture = await PIXI.Assets.load(texturePath);
                this.waterTextures.push(texture);
            } catch (error) {
                console.error(`Failed to load water frame ${frameNumber}:`, error);
            }
        }
        
        console.log(`SplashDashBackgroundManager: Loaded ${this.waterTextures.length} water textures`);
    }

    /**
     * Creates a grid of animated water tiles covering the entire screen
     */
    private _createWaterTiles(screenWidth: number, screenHeight: number): void {
        if (this.waterTextures.length === 0) {
            console.warn('SplashDashBackgroundManager: No water textures loaded, falling back to solid color');
            this.background.rect(0, 0, screenWidth, screenHeight).fill(0x4A90E2);
            return;
        }

        // Get the size of one water frame and double it for bigger tiles
        const firstTexture = this.waterTextures[0];
        this.tileSize = Math.max(firstTexture.width, firstTexture.height) * 2;
        
        // Calculate how many tiles we need to cover the screen
        this.tilesX = Math.ceil(screenWidth / this.tileSize) + 1; // +1 for seamless tiling
        this.tilesY = Math.ceil(screenHeight / this.tileSize) + 1; // +1 for seamless tiling
        
        console.log(`SplashDashBackgroundManager: Creating ${this.tilesX}x${this.tilesY} water tiles (${this.tileSize}px each)`);
        
        // Clear existing tiles
        this.waterTiles.forEach(tile => tile.destroy());
        this.waterTiles = [];
        
        // Create water tiles
        for (let y = 0; y < this.tilesY; y++) {
            for (let x = 0; x < this.tilesX; x++) {
                const animatedSprite = new PIXI.AnimatedSprite(this.waterTextures);
                
                // Position the tile
                animatedSprite.x = x * this.tileSize;
                animatedSprite.y = y * this.tileSize;
                
                // Scale the sprite to double size
                animatedSprite.scale.set(2);
                
                // Set animation properties
                animatedSprite.animationSpeed = 0.3; // Smooth animation speed
                animatedSprite.loop = true;
                animatedSprite.play();
                
                // Start all tiles on the same frame for proper tiling alignment
                animatedSprite.currentFrame = 0;
                
                this.waterTiles.push(animatedSprite);
                this.view.addChild(animatedSprite);
            }
        }
        
        console.log(`SplashDashBackgroundManager: Created ${this.waterTiles.length} animated water tiles`);
        
        // Create displacement filter for more natural water effect
        this._createDisplacementFilter();
        
        // Create contrast reduction overlay
        this._createContrastOverlay(screenWidth, screenHeight);
    }

    /**
     * Creates a displacement filter using one of the water frames as a displacement map
     * This adds realistic wave distortions and ripples to the water background
     */
    private _createDisplacementFilter(): void {
        if (this.waterTextures.length === 0) {
            console.warn('SplashDashBackgroundManager: No water textures available for displacement filter');
            return;
        }

        try {
            // Use the first water frame as the displacement map
            this.displacementSprite = new PIXI.Sprite(this.waterTextures[0]);
            
            // Create the displacement filter
            this.displacementFilter = new PIXI.DisplacementFilter({
                sprite: this.displacementSprite,
                scale: { x: 15, y: 10 } // Moderate displacement for natural water effect
            });
            
            // Apply the filter to the entire water background container
            this.view.filters = [this.displacementFilter];
            
            console.log('SplashDashBackgroundManager: Displacement filter created and applied');
        } catch (error) {
            console.error('SplashDashBackgroundManager: Failed to create displacement filter:', error);
        }
    }

    /**
     * Creates a semi-transparent light blue overlay to reduce background contrast
     * Positioned above water tiles but below corner leaves, avoiding the bottom UI area
     */
    private _createContrastOverlay(screenWidth: number, screenHeight: number): void {
        try {
            // Calculate the area to cover (full screen minus bottom UI area)
            const BOTTOM_UI_HEIGHT = this.layoutManager.getLayoutParams().bottomUIHeight;
            const overlayHeight = screenHeight - BOTTOM_UI_HEIGHT;
            
            this.contrastOverlay = new PIXI.Graphics();
            this.contrastOverlay.rect(0, 0, screenWidth, overlayHeight);
            this.contrastOverlay.fill({ color: 0x87CEEB, alpha: 0.5 }); // Light blue, 50% transparent
            
            // Add to view (this will be above water tiles but below corner leaves)
            this.view.addChild(this.contrastOverlay);
            
            console.log(`SplashDashBackgroundManager: Created contrast overlay (${screenWidth}x${overlayHeight})`);
        } catch (error) {
            console.error('SplashDashBackgroundManager: Failed to create contrast overlay:', error);
        }
    }

    public destroy(): void {
        if (this.eventBus) {
            this.eventBus.off(ENGINE_EVENTS.RESIZED, this._handleResize);
            this.eventBus.off(ENGINE_EVENTS.ENGINE_READY_FOR_GAME, this._handleEngineReady);
        }
        
        // Clean up water tiles
        this.waterTiles.forEach(tile => tile.destroy());
        this.waterTiles = [];
        
        // Clean up water textures
        this.waterTextures.forEach(texture => texture.destroy());
        this.waterTextures = [];
        
        // Clean up corner leaves
        Object.values(this.cornerLeaves).forEach(leaf => {
            if (leaf) {
                leaf.destroy();
            }
        });
        
        // Clean up displacement filter
        if (this.displacementFilter) {
            this.displacementFilter.destroy();
        }
        
        if (this.displacementSprite) {
            this.displacementSprite.destroy();
        }
        
        // Clean up contrast overlay
        if (this.contrastOverlay) {
            this.contrastOverlay.destroy();
        }
        
        
        this.view.destroy({ children: true });
        console.log('SplashDashBackgroundManager destroyed');
    }
}