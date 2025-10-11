import { Scene } from 'phaser';
import { EventBus } from '@/lib/phaser-engine/core/EventBus';
import { ENGINE_EVENTS } from '@/lib/phaser-engine/core/EventTypes';

export class GameBackgroundManager {
    private scene: Scene;
    private eventBus: EventBus;
    private backgroundGraphics: Phaser.GameObjects.Graphics | null = null;
    private backgroundImage: Phaser.GameObjects.Image | null = null;

    constructor(scene: Scene, eventBus: EventBus) {
        console.log('PhaserGameBackgroundManager created');
        this.scene = scene;
        this.eventBus = eventBus;
        
        this._initBackground();
        this._bindEvents();
    }

    private _initBackground(): void {
        const { width, height } = this.scene.scale;
        console.log(`PhaserGameBackgroundManager: Creating background with screen size ${width}x${height}`);
        
        // Create background graphics
        this.backgroundGraphics = this.scene.add.graphics();
        this.backgroundGraphics.fillStyle(0x87CEEB); // Light blue background
        this.backgroundGraphics.fillRect(0, 0, width, height);
        
        // Add to scene at depth 0 (behind everything)
        this.scene.children.bringToTop(this.backgroundGraphics);
        
        console.log(`PhaserGameBackgroundManager: Background initialization complete`);
    }

    private _bindEvents(): void {
        if (this.eventBus) {
            this.eventBus.on(ENGINE_EVENTS.RESIZED, this._handleResize);
        } else {
            console.warn('PhaserGameBackgroundManager: EventBus not available, skipping event binding');
        }
    }

    private _handleResize = (): void => {
        // Reinitialize background when screen is resized
        this._initBackground();
    }

    public update(): void {
        // No update logic needed for static background
    }

    public getBackgroundGraphics(): Phaser.GameObjects.Graphics | null {
        return this.backgroundGraphics;
    }

    public destroy(): void {
        if (this.eventBus) {
            this.eventBus.off(ENGINE_EVENTS.RESIZED, this._handleResize);
        }
        
        // Clean up background graphics
        if (this.backgroundGraphics) {
            this.backgroundGraphics.destroy();
            this.backgroundGraphics = null;
        }
        
        // Clean up background image
        if (this.backgroundImage) {
            this.backgroundImage.destroy();
            this.backgroundImage = null;
        }
        
        console.log('PhaserGameBackgroundManager destroyed');
    }
}