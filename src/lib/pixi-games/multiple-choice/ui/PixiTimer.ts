import * as PIXI from 'pixi.js';
import { EventEmitter } from 'eventemitter3';

export enum TimerEventType {
    COMPLETE = 'timer_complete',
    TICK = 'timer_tick' // Optional: emit every second
}

// --- Helper type for listener function based on event type ---
// Use conditional types to map event types directly to function signatures
type TimerEventListener<T extends TimerEventType> =
    T extends TimerEventType.COMPLETE ? () => void :
    // Add other event types here if needed, e.g.:
    // T extends TimerEventType.TICK ? (remainingTime: number) => void :
    never; // Fallback case

interface PixiTimerOptions {
    radius?: number;
    backgroundColor?: number;
    foregroundColor?: number;
    textColor?: number;
    textSize?: number;
    lineWidth?: number;
}

export class PixiTimer extends PIXI.Container {
    private options: Required<PixiTimerOptions>;
    private backgroundCircle: PIXI.Graphics;
    private progressArc: PIXI.Graphics;
    private timeText: PIXI.Text;
    private emitter: EventEmitter;

    private duration: number = 0;
    private remainingTime: number = 0;
    private isRunning: boolean = false;
    private tickerCallback?: (ticker: PIXI.Ticker) => void; // Store ticker ref

    constructor(options: PixiTimerOptions = {}) {
        super();
        this.emitter = new EventEmitter();

        // Default options merged with provided ones
        this.options = {
            radius: 40,
            backgroundColor: 0xFFFFFF, // White background
            foregroundColor: 0x3b82f6, // Blue accent (Tailwind blue-500)
            textColor: 0x1F2937,      // Dark text (Tailwind gray-800)
            textSize: 24,
            lineWidth: 8,
            ...options,
        };

        // Create visual elements
        this.backgroundCircle = new PIXI.Graphics();
        this.progressArc = new PIXI.Graphics();
        this.timeText = new PIXI.Text({
            text: '', // Initial text
            style: {
                fontFamily: 'Arial', // Make configurable later
                fontSize: this.options.textSize,
                fill: this.options.textColor,
                fontWeight: 'bold',
            }
        });
        this.timeText.anchor.set(0.5);

        this.addChild(this.backgroundCircle);
        this.addChild(this.progressArc);
        this.addChild(this.timeText);

        this.drawBackground();
        this.updateDisplay(0); // Initial display
    }

    private drawBackground(): void {
        this.backgroundCircle.clear()
            .circle(0, 0, this.options.radius)
            .fill({ color: this.options.backgroundColor, alpha: 0.8 })
            .stroke({ width: this.options.lineWidth / 2, color: 0xEEEEEE, alpha: 0.5 }); // Optional subtle border
    }

    private updateDisplay(time: number): void {
        const progress = this.duration > 0 ? Math.max(0, time) / this.duration : 0;
        const angle = progress * Math.PI * 2 - Math.PI / 2; // Start from top (-90 deg)

        // Update arc
        this.progressArc.clear()
            .moveTo(0, 0) // Needed for fill to work correctly on arc in v8
            .arc(0, 0, this.options.radius - this.options.lineWidth / 2, -Math.PI / 2, angle)
            .stroke({ width: this.options.lineWidth, color: this.options.foregroundColor })

        // Update text
        this.timeText.text = `${Math.ceil(time)}`; // Show ceiling of remaining time
    }

    public start(duration: number, ticker: PIXI.Ticker): void {
        if (this.isRunning && this.tickerCallback) {
            ticker.remove(this.tickerCallback); // Remove old ticker if running
        }

        this.duration = duration;
        this.remainingTime = duration;
        this.isRunning = true;
        this.updateDisplay(this.remainingTime);

        // Use shared ticker passed from engine/game
        this.tickerCallback = (tickerInstance: PIXI.Ticker) => {
            if (!this.isRunning) return;

            // Use deltaMS for accuracy, divided by 1000 for seconds
            const deltaTime = tickerInstance.deltaMS / 1000;
            this.remainingTime -= deltaTime;

            if (this.remainingTime <= 0) {
                this.remainingTime = 0;
                this.updateDisplay(this.remainingTime);
                this.stop(ticker); // Stop internal logic
                // Emit COMPLETE with no arguments, matching TimerEventPayloads
                this.emitter.emit(TimerEventType.COMPLETE);
            } else {
                this.updateDisplay(this.remainingTime);
                // Optional: Emit tick event every second change
                // Example if TICK were enabled:
                // const prevTime = this.remainingTime + deltaTime;
                // if (Math.floor(prevTime) !== Math.floor(this.remainingTime)) {
                //    this.emitter.emit(TimerEventType.TICK, Math.ceil(this.remainingTime));
                // }
            }
        };

        ticker.add(this.tickerCallback);
    }

    public stop(ticker: PIXI.Ticker): void {
        if (this.tickerCallback) {
            ticker.remove(this.tickerCallback);
            this.tickerCallback = undefined;
        }
        this.isRunning = false;
    }

    public reset(duration: number = 0, ticker?: PIXI.Ticker): void {
         if (ticker) this.stop(ticker);
         this.duration = duration;
         this.remainingTime = duration;
         this.updateDisplay(this.remainingTime);
    }

     // --- Updated Event Listener Methods ---

     /**
      * Register an event handler for a timer event.
      * @param event - The event type (e.g., TimerEventType.COMPLETE).
      * @param fn - The callback function. Its arguments are typed based on the event.
      * @param context - Optional execution context for the listener. Use `unknown` instead of `any`.
      */
    public onTimerEvent<T extends TimerEventType>(event: T, fn: TimerEventListener<T>, context?: unknown): this {
        // Cast to a slightly more specific function type accepting unknown args
        this.emitter.on(event, fn as (...args: unknown[]) => void, context);
        return this;
    }

    /**
     * Register a one-time event handler for a timer event.
     * @param event - The event type (e.g., TimerEventType.COMPLETE).
     * @param fn - The callback function. Its arguments are typed based on the event.
     * @param context - Optional execution context for the listener. Use `unknown` instead of `any`.
     */
    public onceTimerEvent<T extends TimerEventType>(event: T, fn: TimerEventListener<T>, context?: unknown): this {
        this.emitter.once(event, fn as (...args: unknown[]) => void, context);
        return this;
    }

     /**
      * Remove an event handler for a timer event.
      * @param event - The event type (e.g., TimerEventType.COMPLETE).
      * @param fn - Optional callback function to remove. If omitted, all listeners for the event are removed.
      * @param context - Optional execution context to match. Use `unknown` instead of `any`.
      * @param once - Optional flag to specify if the listener was added with `once`.
      */
    public offTimerEvent<T extends TimerEventType>(event: T, fn?: TimerEventListener<T>, context?: unknown, once?: boolean): this {
         // Cast to a slightly more specific function type accepting unknown args
        this.emitter.off(event, fn as ((...args: unknown[]) => void) | undefined, context, once);
        return this;
    }

    public destroy(options?: boolean | PIXI.DestroyOptions): void {
        this.emitter.removeAllListeners();
        // Stop ticker if running and reference exists
        // Note: Ticker reference might be tricky if destroyed externally
        // Consider passing the ticker only when starting/stopping
        // if (this.tickerCallback && PIXI.Ticker.shared) { // Or use passed ticker ref if available
        //     PIXI.Ticker.shared.remove(this.tickerCallback);
        // }
        this.backgroundCircle.destroy();
        this.progressArc.destroy();
        this.timeText.destroy();
        super.destroy(options);
    }
} 