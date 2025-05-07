import * as PIXI from 'pixi.js';
import { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication';
// AssetLoader class itself might not be needed here if we use PIXI.Assets directly
// import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader'; 
import { PixiThemeConfig } from '@/lib/themes';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { ENGINE_EVENTS } from '@/lib/pixi-engine/core/EventTypes';

export class GameBackgroundManager {
    private pixiApp: PixiApplication;
    // Remove assetLoader property if not used elsewhere
    // private assetLoader: typeof AssetLoader; 
    private themeConfig: PixiThemeConfig;
    private eventBus: EventBus;

    private view: PIXI.Container;
    private backgroundSprite: PIXI.Sprite | null = null;
    private readonly BACKGROUND_IMAGE_NAME = 'bg_image.png';

    constructor(
        pixiApp: PixiApplication,
        // Remove assetLoader from constructor if not needed
        // assetLoader: typeof AssetLoader, 
        themeConfig: PixiThemeConfig,
        eventBus: EventBus
    ) {
        this.pixiApp = pixiApp;
        // this.assetLoader = assetLoader; // Remove assignment
        this.themeConfig = themeConfig;
        this.eventBus = eventBus;

        this.view = new PIXI.Container();
        this.view.label = 'GameBackgroundContainer';

        this._init();

        this.eventBus.on(ENGINE_EVENTS.RESIZED, this._handleResize);
        console.log("GameBackgroundManager: Initialized and listening for resize.");
    }

    private async _init(): Promise<void> {
        let texture: PIXI.Texture | null = null;
        try {
            const basePath = this.themeConfig.imagesBasePath || '/images/default/';
            const imageUrl = basePath + this.BACKGROUND_IMAGE_NAME;
            console.log(`GameBackgroundManager: Loading texture: ${imageUrl}`);

            texture = await PIXI.Assets.load<PIXI.Texture>(imageUrl);

            if (!texture) {
                throw new Error(`Texture not loaded`);
            }
            
            this.backgroundSprite = new PIXI.Sprite(texture);

        } catch (error) {
            console.error(`GameBackgroundManager: Failed to load texture for background image:`, error);
            const fallback = new PIXI.Graphics()
                .rect(0, 0, 100, 100)
                .fill(this.themeConfig.pixiConfig.primaryBg || 0xeeeeee);
            try {
                 const fallbackTexture = this.pixiApp.getApp().renderer.generateTexture(fallback);
                 this.backgroundSprite = new PIXI.Sprite(fallbackTexture);
                 console.warn("GameBackgroundManager: Using fallback background color.");
                 fallback.destroy();
            } catch (renderError) {
                 console.error("GameBackgroundManager: Failed to create fallback texture:", renderError);
                 this.backgroundSprite = null;
            }
        }

        if (this.backgroundSprite) {
            this.backgroundSprite.label = 'StaticBackgroundSprite';
            this.backgroundSprite.anchor.set(0.5);
            this.backgroundSprite.alpha = 0.5;
            this.view.addChild(this.backgroundSprite);
            this._handleResize();
            console.log("GameBackgroundManager: Background sprite created and added.");
        } else {
             console.error("GameBackgroundManager: Could not create background sprite.");
        }
    }

    public getView(): PIXI.Container {
        return this.view;
    }

    private _handleResize = (): void => {
        const { width: screenWidth, height: screenHeight } = this.pixiApp.getScreenSize();
        this.view.position.set(screenWidth / 2, screenHeight / 2);

        if (this.backgroundSprite) {
            const screenAspect = screenWidth / screenHeight;
            if (this.backgroundSprite.texture) { 
                const textureAspect = this.backgroundSprite.texture.width / this.backgroundSprite.texture.height;
                let scale = 1;

                if (screenAspect > textureAspect) {
                    scale = screenWidth / this.backgroundSprite.texture.width;
                } else {
                    scale = screenHeight / this.backgroundSprite.texture.height;
                }
                this.backgroundSprite.scale.set(scale);
            } else {
                 this.backgroundSprite.width = screenWidth;
                 this.backgroundSprite.height = screenHeight;
                 console.warn("GameBackgroundManager: Background texture missing during resize, stretching instead.");
            }
            
            this.backgroundSprite.position.set(0, 0);
        }
    };

    public destroy(): void {
        console.log("GameBackgroundManager: Destroying...");
        this.eventBus.off(ENGINE_EVENTS.RESIZED, this._handleResize);

        if (this.backgroundSprite) {
            this.backgroundSprite.destroy();
            this.backgroundSprite = null;
        }
        this.view.destroy({ children: true });
        console.log("GameBackgroundManager: Destroy complete.");
    }
}
