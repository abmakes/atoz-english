import * as PIXI from 'pixi.js';

interface PixiTimerOptions {
    radius?: number;
    backgroundColor?: number;
    backgroundAlpha?: number; // Added alpha for background
    textColor?: PIXI.ColorSource; // Use ColorSource type
    textSize?: number;
    fontFamily?: string; // Added font family
    fontWeight?: PIXI.TextStyleFontWeight; // Added font weight
    progressBarWidth?: number;
    progressBackgroundColor?: PIXI.ColorSource; // Use ColorSource type
    progressBackgroundAlpha?: number; // Added alpha for track
    progressBarColor?: PIXI.ColorSource; // Use ColorSource type
    progressBarAlpha?: number; // Added alpha for progress arc
    clockwise?: boolean; // Keep clockwise option
    pauseColor?: PIXI.ColorSource; // Color for progress bar when paused
    pauseAlpha?: number; // Alpha for progress bar when paused
}

export class PixiTimer extends PIXI.Container {
    private options: Required<PixiTimerOptions>;
    private backgroundCircle: PIXI.Graphics;
    private progressTrack: PIXI.Graphics;
    private progressArc: PIXI.Graphics;
    private timeText: PIXI.Text;
    private isPaused: boolean = false; // Internal state for visual pause

    // Store last known values to redraw on resume if needed
    private lastRemainingTime: number = 0;
    private lastDuration: number = 0;

    constructor(options: PixiTimerOptions = {}) {
        super();

        // --- Default values matching UIManager's current implementation ---
        this.options = {
            radius: 60, // from UIManager._updateTimerCircle
            backgroundColor: 0xDDDDDD, // Example: neutral background
            backgroundAlpha: 0.0, // Invisible background circle by default
            textColor: 0x114257, // Example: Dark text
            textSize: 48, // from UIManager constructor
            fontFamily: 'Grandstander', // from UIManager constructor
            fontWeight: 'bold', // from UIManager constructor
            progressBarWidth: 14, // from UIManager._updateTimerCircle
            progressBackgroundColor: 0xE0E0E0, // Example: Light grey track
            progressBackgroundAlpha: 0.0, // Invisible track by default
            progressBarColor: 0x00FF00, // Example: Green progress (will use theme below)
            progressBarAlpha: 1.0,
            clockwise: false, // Default direction
            pauseColor: 0xAAAAAA, // Example: Grey color when paused
            pauseAlpha: 0.7, // Slightly transparent when paused
            ...options, // Allow overriding defaults
        };
        // --- End Defaults ---

        this.backgroundCircle = new PIXI.Graphics();
        this.progressTrack = new PIXI.Graphics();
        this.progressArc = new PIXI.Graphics();
        this.timeText = new PIXI.Text({
            text: '--', // Initial text
            style: {
                fontFamily: this.options.fontFamily,
                fontSize: this.options.textSize,
                fill: this.options.textColor,
                fontWeight: this.options.fontWeight,
                align: 'center', // Center align text
            }
        });
        this.timeText.anchor.set(0.5);

        this.addChild(this.backgroundCircle);
        this.addChild(this.progressTrack);
        this.addChild(this.progressArc);
        this.addChild(this.timeText);

        // Initial draw (mostly invisible based on defaults, can be shown via options)
        this.drawBackgroundAndTrack();
        this.updateDisplay(0, 1); // Initialize display (e.g., showing '--')
    }

    private drawBackgroundAndTrack(): void {
        const center = 0;
        // Background (often invisible)
        this.backgroundCircle.clear()
            .circle(center, center, this.options.radius) // Use full radius if needed
            .fill({ color: this.options.backgroundColor, alpha: this.options.backgroundAlpha });

        // Progress Track (often invisible or subtle)
        this.progressTrack.clear()
             .arc(center, center, this.options.radius - this.options.progressBarWidth / 2, 0, Math.PI * 2)
             .stroke({
                 width: this.options.progressBarWidth,
                 color: this.options.progressBackgroundColor,
                 alpha: this.options.progressBackgroundAlpha
             });
    }

    /**
     * Updates the visual representation of the timer.
     * @param remainingTime The current remaining time (in ms).
     * @param duration The total duration of the timer (in ms).
     */
    public updateDisplay(remainingTime: number, duration: number): void {
        // Store last values in case of resume redraw
        this.lastRemainingTime = remainingTime;
        this.lastDuration = duration;

        // Format text display (always update text even if paused)
        const remainingSeconds = Math.max(0, Math.ceil(remainingTime / 1000));
        this.timeText.text = `${remainingSeconds}`;
        this.timeText.position.set(0); // Ensure centered

        // Don't update the progress arc if paused visually
        if (this.isPaused) {
            return;
        }

        // --- Draw Progress Arc ---
        const center = 0;
        // Calculate progress: clamp between 0 and 1
        const progress = duration > 0 ? Math.max(0, Math.min(1, remainingTime / duration)) : 0;

        const startAngle = -Math.PI / 2; // 12 o'clock
        // Use min(progress, 0.99999) to prevent full circle overlap issue if progress hits exactly 1
        const clampedProgress = Math.min(progress, 0.99999);
        const endAngle = startAngle + (this.options.clockwise ? -1 : 1) * clampedProgress * (Math.PI * 2);

        this.progressArc.clear();
        // Only draw the arc if there's progress to show (remaining > 0)
        if (progress > 0) {
            this.progressArc
                // Draw from startAngle to endAngle
                .arc(center, center, this.options.radius - this.options.progressBarWidth / 2, startAngle, endAngle, this.options.clockwise)
                .stroke({
                    width: this.options.progressBarWidth,
                    color: this.options.progressBarColor, // Use normal color when running
                    alpha: this.options.progressBarAlpha
                 });
        }
        // --- End Draw Progress Arc ---
    }

    /** Puts the timer into a visually paused state. */
    public pause(): void {
        if (this.isPaused) return;
        this.isPaused = true;
        console.log("PixiTimer: Visually Paused");

        // Redraw the progress arc with pause styling
        this.redrawPausedState();
    }

    /** Resumes the timer from a visually paused state. */
    public resume(): void {
        if (!this.isPaused) return;
        this.isPaused = false;
        console.log("PixiTimer: Visually Resumed");

        // Redraw the arc with normal styling using the last known time
        this.updateDisplay(this.lastRemainingTime, this.lastDuration);
    }

    private redrawPausedState(): void {
        // Reuse drawing logic from updateDisplay but with different style
        const center = 0;
        const progress = this.lastDuration > 0 ? Math.max(0, Math.min(1, this.lastRemainingTime / this.lastDuration)) : 0;
        const startAngle = -Math.PI / 2;
        const clampedProgress = Math.min(progress, 0.99999);
        const endAngle = startAngle + (this.options.clockwise ? -1 : 1) * clampedProgress * (Math.PI * 2);

        this.progressArc.clear();
        if (progress > 0) {
            this.progressArc
                .arc(center, center, this.options.radius - this.options.progressBarWidth / 2, startAngle, endAngle, this.options.clockwise)
                .stroke({
                    width: this.options.progressBarWidth,
                    color: this.options.pauseColor, // Use pause color
                    alpha: this.options.pauseAlpha   // Use pause alpha
                 });
        }
    }

    public destroy(options?: boolean | PIXI.DestroyOptions): void {
        this.backgroundCircle.destroy();
        this.progressTrack.destroy();
        this.progressArc.destroy();
        this.timeText.destroy();
        super.destroy(options);
    }

    public getVisualBounds(): PIXI.Rectangle {
        const diameter = this.options.radius * 2;
        return new PIXI.Rectangle(-this.options.radius, -this.options.radius, diameter, diameter);
    }
}
