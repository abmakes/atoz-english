/**
 * Provides utility functions for animations and tweening.
 * Note: For complex tweens, consider using a dedicated library like GSAP or @pixi/tween.
 */
export class AnimationUtils {

    /**
     * Linear interpolation (same as MathUtils.lerp, but included here for animation context).
     * @param a Start value.
     * @param b End value.
     * @param t Interpolation factor (0.0 to 1.0).
     * @returns Interpolated value.
     */
    public static lerp(a: number, b: number, t: number): number {
        // Clamp t between 0 and 1
        const clampedT = Math.max(0, Math.min(1, t));
        return a + (b - a) * clampedT;
    }

    // --- Easing Functions (Common Examples) ---
    // Based on https://easings.net/

    /**
     * Ease-in quadratic easing function.
     * Starts slow, accelerates.
     * @param t Input time factor (0.0 to 1.0).
     * @returns Eased value.
     */
    public static easeInQuad(t: number): number {
        const clampedT = Math.max(0, Math.min(1, t));
        return clampedT * clampedT;
    }

    /**
     * Ease-out quadratic easing function.
     * Starts fast, decelerates.
     * @param t Input time factor (0.0 to 1.0).
     * @returns Eased value.
     */
    public static easeOutQuad(t: number): number {
        const clampedT = Math.max(0, Math.min(1, t));
        return 1 - (1 - clampedT) * (1 - clampedT);
    }

    /**
     * Ease-in-out quadratic easing function.
     * Slow start, fast middle, slow end.
     * @param t Input time factor (0.0 to 1.0).
     * @returns Eased value.
     */
    public static easeInOutQuad(t: number): number {
        const clampedT = Math.max(0, Math.min(1, t));
        return clampedT < 0.5 ? 2 * clampedT * clampedT : 1 - Math.pow(-2 * clampedT + 2, 2) / 2;
    }

    /**
     * Ease-in cubic easing function.
     * @param t Input time factor (0.0 to 1.0).
     * @returns Eased value.
     */
    public static easeInCubic(t: number): number {
        const clampedT = Math.max(0, Math.min(1, t));
        return clampedT * clampedT * clampedT;
    }

    /**
     * Ease-out cubic easing function.
     * @param t Input time factor (0.0 to 1.0).
     * @returns Eased value.
     */
    public static easeOutCubic(t: number): number {
        const clampedT = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - clampedT, 3);
    }

    /**
     * Ease-in-out cubic easing function.
     * @param t Input time factor (0.0 to 1.0).
     * @returns Eased value.
     */
    public static easeInOutCubic(t: number): number {
        const clampedT = Math.max(0, Math.min(1, t));
        return clampedT < 0.5 ? 4 * clampedT * clampedT * clampedT : 1 - Math.pow(-2 * clampedT + 2, 3) / 2;
    }

    // --- Basic Tweening Placeholder ---
    // TODO: Implement basic tween management or integrate a library.

    /**
     * Placeholder for a simple tween function.
     * In a real implementation, this would likely involve managing active tweens,
     * updating them in a game loop, and handling callbacks.
     *
     * @param target The object to tween.
     * @param property The property of the target to tween (e.g., 'x', 'alpha').
     * @param endValue The target value for the property.
     * @param duration The duration of the tween in seconds.
     * @param easingFunction An optional easing function (e.g., AnimationUtils.easeOutQuad).
     * @param onComplete Optional callback when the tween finishes.
     */
    public static tween(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        target: unknown,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        property: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        endValue: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        duration: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        easingFunction?: (t: number) => number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onComplete?: () => void
    ): void {
        console.warn('AnimationUtils.tween is a placeholder and does not perform animation.');
        // Basic structure idea:
        // const startTime = Date.now();
        // const startValue = target[property];
        // const ease = easingFunction || AnimationUtils.lerp; // Default to linear

        // function updateTween() {
        //     const elapsed = (Date.now() - startTime) / 1000;
        //     const t = Math.min(1, elapsed / duration);
        //     target[property] = AnimationUtils.lerp(startValue, endValue, ease(t));

        //     if (t >= 1) {
        //         // Remove from update loop
        //         onComplete?.();
        //     } else {
        //         // Request next frame
        //         requestAnimationFrame(updateTween);
        //     }
        // }
        // requestAnimationFrame(updateTween);
    }
} 