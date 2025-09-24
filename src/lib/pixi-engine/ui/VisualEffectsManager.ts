import * as PIXI from 'pixi.js';

export interface VisualEffectConfig {
    duration?: number;
    scale?: number;
    alpha?: number;
    color?: number;
}

export class VisualEffectsManager {
    private container: PIXI.Container;
    private app: PIXI.Application;

    constructor(app: PIXI.Application, parentContainer: PIXI.Container) {
        this.app = app;
        this.container = new PIXI.Container();
        parentContainer.addChild(this.container);
    }

    /**
     * Creates celebrate emoji balloons effect for correct answers
     */
    public createCelebrateEmoji(x: number, y: number, config: VisualEffectConfig = {}): void {
        const duration = config.duration || 2500;
        const scale = config.scale || 1.2;
        const alpha = config.alpha || 1;

        // Create 6 emoji balloons with slightly different x positions
        const emojiCount = 6;
        const emoji = '🥳'; // Same emoji for all balloons
        
        for (let i = 0; i < emojiCount; i++) {
            this.createSingleBalloon(
                x + (Math.random() - 0.5) * 80, // Random x offset within 80px range
                y + Math.random() * 20, // Start slightly behind the answer box
                emoji,
                duration,
                scale,
                alpha,
                i
            );
        }
    }

    /**
     * Creates a single balloon emoji that rises up
     */
    private createSingleBalloon(x: number, y: number, emoji: string, duration: number, scale: number, alpha: number, index: number): void {
        // Create emoji using text
        const emojiText = new PIXI.Text(emoji, {
            fontSize: 32 * scale,
            fontFamily: 'Arial',
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 1,
        });

        emojiText.anchor.set(0.5);
        emojiText.x = x;
        emojiText.y = y;
        emojiText.alpha = alpha;

        this.container.addChild(emojiText);

        // Animation properties
        const startY = y;
        const endY = y - 150 - (Math.random() * 50); // Rise up 150-200px
        const startScale = scale * 0.4;
        const endScale = scale;
        const startX = x;
        const endX = x + (Math.random() - 0.5) * 40; // Slight horizontal drift

        emojiText.scale.set(startScale);
        emojiText.y = startY;
        emojiText.x = startX;

        // Stagger the start time slightly for each balloon
        const startDelay = index * 100; // 100ms delay between each balloon

        // Rising balloon animation
        const balloonTicker = new PIXI.Ticker();
        let time = 0;
        const riseDuration = duration * 0.7; // 70% of time for rising

        const animate = () => {
            time += 16; // ~60fps
            const progress = Math.min(time / riseDuration, 1);
            
            // Ease out for smooth rising
            const easedProgress = 1 - Math.pow(1 - progress, 2);
            
            // Rise up
            emojiText.y = startY + (endY - startY) * easedProgress;
            emojiText.x = startX + (endX - startX) * easedProgress;
            
            // Scale up as it rises
            emojiText.scale.set(startScale + (endScale - startScale) * easedProgress);
            
            // Gentle swaying motion
            emojiText.rotation = Math.sin(progress * Math.PI * 3) * 0.1;
            
            // Fade out in the last 30% of the animation
            if (progress > 0.7) {
                const fadeProgress = (progress - 0.7) / 0.3;
                emojiText.alpha = alpha * (1 - fadeProgress);
            }
            
            if (progress >= 1) {
                balloonTicker.stop();
                balloonTicker.destroy();
                
                // Remove the emoji
                this.container.removeChild(emojiText);
                emojiText.destroy();
            }
        };

        // Start animation after delay
        setTimeout(() => {
            balloonTicker.add(animate);
            balloonTicker.start();
        }, startDelay);
    }

    /**
     * Creates multiple sad emoji effect for incorrect answers
     */
    public createSadEmoji(x: number, y: number, config: VisualEffectConfig = {}): void {
        const duration = config.duration || 1500;
        const scale = config.scale || 1.2;
        const alpha = config.alpha || 1;

        // Create 6 sad emoji balloons with slightly different x positions
        const emojiCount = 6;
        const emoji = '😔'; // Same emoji for all balloons
        
        for (let i = 0; i < emojiCount; i++) {
            this.createSingleSadBalloon(
                x + (Math.random() - 0.5) * 80, // Random x offset within 80px range
                y + Math.random() * 20, // Start slightly behind the answer box
                emoji,
                duration,
                scale,
                alpha,
                i
            );
        }
    }

    /**
     * Creates a single sad balloon emoji that rises up
     */
    private createSingleSadBalloon(x: number, y: number, emoji: string, duration: number, scale: number, alpha: number, index: number): void {
        // Create emoji using text
        const emojiText = new PIXI.Text(emoji, {
            fontSize: 32 * scale,
            fontFamily: 'Arial',
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 1,
        });

        emojiText.anchor.set(0.5);
        emojiText.x = x;
        emojiText.y = y;
        emojiText.alpha = alpha;

        this.container.addChild(emojiText);

        // Animation properties
        const startY = y;
        const endY = y - 150 - (Math.random() * 50); // Rise up 150-200px
        const startScale = scale * 0.4;
        const endScale = scale;
        const startX = x;
        const endX = x + (Math.random() - 0.5) * 40; // Slight horizontal drift

        emojiText.scale.set(startScale);
        emojiText.y = startY;
        emojiText.x = startX;

        // Stagger the start time slightly for each balloon
        const startDelay = index * 100; // 100ms delay between each balloon

        // Rising balloon animation
        const balloonTicker = new PIXI.Ticker();
        let time = 0;
        const riseDuration = duration * 0.7; // 70% of time for rising

        const animate = () => {
            time += 16; // ~60fps
            const progress = Math.min(time / riseDuration, 1);
            
            // Ease out for smooth rising
            const easedProgress = 1 - Math.pow(1 - progress, 2);
            
            // Rise up
            emojiText.y = startY + (endY - startY) * easedProgress;
            emojiText.x = startX + (endX - startX) * easedProgress;
            
            // Scale up as it rises
            emojiText.scale.set(startScale + (endScale - startScale) * easedProgress);
            
            // Gentle swaying motion
            emojiText.rotation = Math.sin(progress * Math.PI * 3) * 0.1;
            
            // Fade out in the last 30% of the animation
            if (progress > 0.7) {
                const fadeProgress = (progress - 0.7) / 0.3;
                emojiText.alpha = alpha * (1 - fadeProgress);
            }
            
            if (progress >= 1) {
                balloonTicker.stop();
                balloonTicker.destroy();
                
                // Remove the emoji
                this.container.removeChild(emojiText);
                emojiText.destroy();
            }
        };

        // Start animation after delay
        setTimeout(() => {
            balloonTicker.add(animate);
            balloonTicker.start();
        }, startDelay);
    }


    /**
     * Fades out a display object
     */
    private fadeOut(object: PIXI.DisplayObject, duration: number): void {
        const startAlpha = object.alpha;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            object.alpha = startAlpha * (1 - progress);
            
            if (progress >= 1) {
                this.container.removeChild(object);
                object.destroy();
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Clears all effects
     */
    public clearAllEffects(): void {
        this.container.removeChildren();
    }

    /**
     * Destroys the effects manager
     */
    public destroy(): void {
        this.clearAllEffects();
        this.container.destroy();
    }
}
