import * as PIXI from 'pixi.js';
import { Assets } from 'pixi.js';
import { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';
// import { PixiThemeConfig } from '@/themes';
import { SplashDashLayoutManager } from './SplashDashLayoutManager';
import { CONTROLS_EVENTS, ControlsPlayerActionPayload } from '@/lib/pixi-engine/core/EventTypes';

export interface PlayerState {
    id: string;
    x: number;
    y: number;
    rotation: number;
    score: number;
    isMoving: boolean;
    isAtAnswer: boolean;
}

interface PlayerSprite {
    container: PIXI.Container;
    capybaraSprite: PIXI.Sprite | PIXI.Graphics;
    directionIndicator: PIXI.Graphics | null; // Made nullable since we removed it
    playerIndex: number;
    isMoving: boolean;
    rotation: number;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    animationFrame: number;
    animationTimer: number;
    animationSpeed: number;
    isAnimating: boolean;
    animationType: 'static' | 'moving';
    spriteSheet?: {
        texture: PIXI.Texture;
        frameWidth: number;
        frameHeight: number;
        totalFrames: number;
    };
}

export class SplashDashPlayerManager {
    private app: PixiApplication;
    private eventBus: EventBus;
    private assetLoader: typeof AssetLoader;
    private layoutManager: SplashDashLayoutManager;
    private view: PIXI.Container;
    private players: PlayerSprite[] = [];
    private controlsEnabled: boolean = true;

    private readonly PLAYER_SIZE = 66; // Increased by 250% (30 * 2.5 = 75)
    private readonly ROTATION_SPEED = (Math.PI * 2) / 240;
    private readonly MOVEMENT_SPEED = 2; // Pixels per update
    
    // Animation constants
    private readonly STATIC_ANIMATION_SPEED = 0.01; // Very slow animation for static (frames 1-2) - changes every 0.5 seconds
    private readonly MOVING_ANIMATION_SPEED = 0.2; // Fast animation for moving (frames 2-8)

    constructor(
        app: PixiApplication,
        eventBus: EventBus,
        assetLoader: typeof AssetLoader,
        layoutManager: SplashDashLayoutManager
    ) {
        this.app = app;
        this.eventBus = eventBus;
        this.assetLoader = assetLoader;
        this.layoutManager = layoutManager;
        this.view = new PIXI.Container();
        this.view.label = 'SplashDashPlayers';

        this._bindEvents();
        console.log('SplashDashPlayerManager created');
    }

    private _bindEvents(): void {
        if (this.eventBus && typeof this.eventBus.on === 'function') {
            this.eventBus.on(CONTROLS_EVENTS.PLAYER_ACTION, this._handlePlayerAction.bind(this));
        } else {
            console.warn('SplashDashPlayerManager: EventBus not available, skipping event binding');
        }
    }

    private _handlePlayerAction(payload: ControlsPlayerActionPayload): void {
        if (!this.controlsEnabled) return;

        // This manager only updates the visual state based on the game state
        // The actual game state update for isMoving is handled in SplashDashGame
        console.log('Player action received:', payload);
    }

    public async initializePlayers(players: PlayerState[]): Promise<void> {
        try {
            console.log('[SplashDashPlayerManager] Initializing players...');
            
            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                const playerSprite = await this.createPlayerSprite(i, { x: player.x, y: player.y });
                this.players.push(playerSprite);
                this.view.addChild(playerSprite.container);
            }
            
            console.log('[SplashDashPlayerManager] Players initialized successfully');
        } catch (error) {
            console.error('[SplashDashPlayerManager] Error initializing players:', error);
            this.createFallbackPlayers(players);
        }
    }

    private async createPlayerSprite(playerIndex: number, startPosition: {x: number, y: number}): Promise<PlayerSprite> {
        const container = new PIXI.Container();
        container.label = `Player${playerIndex + 1}`;
        
        let capybaraSprite: PIXI.Sprite | PIXI.Graphics | null = null;
        let spriteSheet: PlayerSprite['spriteSheet'] | undefined;
        
        try {
            // Try to load capybara sprite sheet
            const spritePath = `/images/splash-dash/capy_spritesheet.png`;
            const texture = await Assets.load(spritePath);
            
            console.log(`[SplashDashPlayerManager] Loaded capybara sprite: ${texture.width}x${texture.height}`);
            
            // Check if this is a multi-frame sprite sheet (width > height suggests horizontal layout)
            const isMultiFrame = texture.width > texture.height;
            
            if (isMultiFrame) {
                // Create sprite sheet configuration for horizontally arranged frames
                const totalFrames = 9; // 9 frames arranged horizontally
                const frameWidth = texture.width / totalFrames;
                const frameHeight = texture.height;
                
                spriteSheet = {
                    texture,
                    frameWidth,
                    frameHeight,
                    totalFrames
                };
                
                // Create sprite with first frame
                capybaraSprite = PIXI.Sprite.from(texture);
                capybaraSprite.anchor.set(0.5, 0.5); // Center anchor for proper rotation
                capybaraSprite.scale.set(this.PLAYER_SIZE / frameHeight); // Scale based on frame height
                
                // Set initial frame (first frame)
                this.setSpriteFrame(capybaraSprite, spriteSheet, 0);
                
                console.log(`[SplashDashPlayerManager] Loaded capybara sprite sheet: ${frameWidth}x${frameHeight}, ${totalFrames} frames`);
            } else {
                // Single frame sprite
                capybaraSprite = PIXI.Sprite.from(texture);
                capybaraSprite.anchor.set(0.5, 0.5); // Center anchor for proper rotation
                capybaraSprite.scale.set(this.PLAYER_SIZE / Math.min(texture.width, texture.height)); // Scale based on smaller dimension
                
                console.log(`[SplashDashPlayerManager] Loaded capybara single sprite: ${texture.width}x${texture.height}`);
            }
        } catch (error) {
            console.warn('[SplashDashPlayerManager] Could not load capybara sprite sheet, using fallback:', error);
        }
        
        // Create fallback graphics if sprite loading failed
        if (!capybaraSprite) {
            capybaraSprite = this.createFallbackCapybara();
        }
        
        if (capybaraSprite) {
            container.addChild(capybaraSprite);
        }
        
        // Direction indicator removed - not needed anymore
        
        // Set initial position
        container.x = startPosition.x;
        container.y = startPosition.y;
        container.rotation = -Math.PI / 2; // Face up initially
        
        return {
            container,
            capybaraSprite: capybaraSprite!,
            directionIndicator: null, // Removed - not needed
            playerIndex,
            isMoving: false,
            rotation: -Math.PI / 2,
            x: startPosition.x,
            y: startPosition.y,
            targetX: startPosition.x,
            targetY: startPosition.y,
            animationFrame: 0,
            animationTimer: 0,
            animationSpeed: this.STATIC_ANIMATION_SPEED,
            isAnimating: true,
            animationType: 'static',
            spriteSheet
        };
    }

    private setSpriteFrame(sprite: PIXI.Sprite, spriteSheet: PlayerSprite['spriteSheet'], frameIndex: number): void {
        if (!spriteSheet) return;
        
        const { texture, frameWidth, frameHeight } = spriteSheet;
        const frameX = frameIndex * frameWidth;
        
        // Create a texture region for the specific frame (horizontal layout)
        const frameTexture = new PIXI.Texture({
            source: texture.source,
            frame: new PIXI.Rectangle(frameX, 0, frameWidth, frameHeight)
        });
        
        sprite.texture = frameTexture;
    }

    private createFallbackCapybara(): PIXI.Graphics {
        const graphics = new PIXI.Graphics();
        
        // Body - using modern PixiJS v8 syntax
        graphics.ellipse(0, 0, this.PLAYER_SIZE / 2, this.PLAYER_SIZE / 3);
        graphics.fill(0x8B4513);
        
        // Head
        graphics.circle(this.PLAYER_SIZE / 3, 0, this.PLAYER_SIZE / 4);
        graphics.fill(0x8B4513);
        
        // Eyes
        graphics.circle(this.PLAYER_SIZE / 2.5, -this.PLAYER_SIZE / 8, 2);
        graphics.circle(this.PLAYER_SIZE / 2.5, this.PLAYER_SIZE / 8, 2);
        graphics.fill(0x000000);
        
        return graphics;
    }

    // createDirectionIndicator method removed - not needed anymore

    private createFallbackPlayers(players: PlayerState[]): void {
        console.log('[SplashDashPlayerManager] Creating fallback players');
        
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const container = new PIXI.Container();
            
            const graphics = this.createFallbackCapybara();
            graphics.tint = i === 0 ? 0x4CAF50 : 0x2196F3; // Green for player1, Blue for player2
            
            container.addChild(graphics);
            container.x = player.x;
            container.y = player.y;
            container.rotation = -Math.PI / 2;
            
            this.players.push({
                container,
                capybaraSprite: graphics,
                directionIndicator: null, // Removed - not needed
                playerIndex: i,
                isMoving: false,
                rotation: -Math.PI / 2,
                x: player.x,
                y: player.y,
                targetX: player.x,
                targetY: player.y,
                animationFrame: 0,
                animationTimer: 0,
                animationSpeed: this.STATIC_ANIMATION_SPEED,
                isAnimating: true,
                animationType: 'static'
            });
            
            this.view.addChild(container);
        }
        
        console.log('[SplashDashPlayerManager] Fallback players created');
    }

    public update(delta: number, playersState: PlayerState[]): void {
        playersState.forEach((playerState, index) => {
            const playerSprite = this.players[index];
            if (!playerSprite) return;

            const { x, y, rotation, isMoving } = playerState;

            // Update sprite position and rotation
            playerSprite.container.x = x;
            playerSprite.container.y = y;
            playerSprite.container.rotation = rotation;
            
            // Update animation state based on movement
            if (isMoving && playerSprite.animationType !== 'moving') {
                playerSprite.animationType = 'moving';
                playerSprite.animationSpeed = this.MOVING_ANIMATION_SPEED;
                playerSprite.animationFrame = 1; // Start moving animation from frame 2 (index 1)
            } else if (!isMoving && playerSprite.animationType !== 'static') {
                playerSprite.animationType = 'static';
                playerSprite.animationSpeed = this.STATIC_ANIMATION_SPEED;
                playerSprite.animationFrame = 0; // Start static animation from frame 1 (index 0)
            }
            
            // Animate based on current state
            this.updateCapybaraAnimation(playerSprite, delta);
        });
    }

    private updateCapybaraAnimation(player: PlayerSprite, delta: number): void {
        if (!player.spriteSheet || !(player.capybaraSprite instanceof PIXI.Sprite)) {
            // No animation for single frame sprites or non-sprite objects
            return;
        }
        
        // Update animation timer
        player.animationTimer += delta * player.animationSpeed;
        
        // Check if it's time to advance to the next frame
        if (player.animationTimer >= 1) {
            player.animationTimer = 0;
            
            if (player.animationType === 'static') {
                // Static animation: slowly cycle between frames 1-2 (indices 0-1)
                player.animationFrame = player.animationFrame === 0 ? 1 : 0;
            } else if (player.animationType === 'moving') {
                // Moving animation: quickly cycle between frames 2-8 (indices 1-7)
                player.animationFrame = ((player.animationFrame - 1 + 1) % 7) + 1;
            }
            
            // Set the new frame
            this.setSpriteFrame(player.capybaraSprite, player.spriteSheet, player.animationFrame);
        }
    }

    public resetPlayerPositions(): void {
        const { width, height } = this.app.getScreenSize();
        const startPositions = [
            { x: width * 0.25, y: height * (2/3) }, // 1/3 up from bottom
            { x: width * 0.75, y: height * (2/3) }  // 1/3 up from bottom
        ];
        
        this.players.forEach((player, index) => {
            const startPos = startPositions[index];
            player.x = startPos.x;
            player.y = startPos.y;
            player.targetX = startPos.x;
            player.targetY = startPos.y;
            player.rotation = -Math.PI / 2;
            player.isMoving = false;
            player.animationFrame = 0;
            player.animationTimer = 0;
            player.animationType = 'static';
            player.animationSpeed = this.STATIC_ANIMATION_SPEED;
            
            player.container.x = player.x;
            player.container.y = player.y;
            player.container.rotation = player.rotation;
            
            // Reset sprite to first frame
            if (player.spriteSheet && player.capybaraSprite instanceof PIXI.Sprite) {
                this.setSpriteFrame(player.capybaraSprite, player.spriteSheet, 0);
            }
        });
        
        console.log('[SplashDashPlayerManager] Player positions reset');
    }

    public setControlsEnabled(enabled: boolean): void {
        this.controlsEnabled = enabled;
        console.log('[SplashDashPlayerManager] Controls enabled:', enabled);
    }

    public getView(): PIXI.Container {
        return this.view;
    }

    public destroy(): void {
        if (this.eventBus && typeof this.eventBus.off === 'function') {
            this.eventBus.off(CONTROLS_EVENTS.PLAYER_ACTION, this._handlePlayerAction.bind(this));
        }
        this.view.destroy({ children: true });
        this.players = [];
        console.log('SplashDashPlayerManager destroyed');
    }
}