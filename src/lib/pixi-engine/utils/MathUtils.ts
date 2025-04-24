import { Point } from 'pixi.js';

/**
 * Provides common mathematical utility functions.
 */
export class MathUtils {

    /**
     * Linear interpolation between two numbers.
     * @param a - Start value.
     * @param b - End value.
     * @param t - Interpolation factor (0.0 to 1.0).
     * @returns The interpolated value.
     */
    public static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * MathUtils.clamp01(t);
    }

    /**
     * Clamps a number between 0 and 1.
     * @param value - The number to clamp.
     * @returns The clamped value.
     */
    public static clamp01(value: number): number {
        return Math.max(0, Math.min(1, value));
    }

    /**
     * Clamps a number between a minimum and maximum value.
     * @param value - The number to clamp.
     * @param min - The minimum value.
     * @param max - The maximum value.
     * @returns The clamped value.
     */
    public static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Generates a random float number within a specified range (inclusive).
     * @param min - The minimum value.
     * @param max - The maximum value.
     * @returns A random float number between min and max.
     */
    public static randomRange(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    /**
     * Generates a random integer number within a specified range (inclusive).
     * @param min - The minimum value.
     * @param max - The maximum value.
     * @returns A random integer number between min and max.
     */
    public static randomIntRange(min: number, max: number): number {
        // Ensure min and max are integers
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Converts degrees to radians.
     * @param degrees - Angle in degrees.
     * @returns Angle in radians.
     */
    public static degreesToRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Converts radians to degrees.
     * @param radians - Angle in radians.
     * @returns Angle in degrees.
     */
    public static radiansToDegrees(radians: number): number {
        return radians * (180 / Math.PI);
    }

    // --- Vector Operations (using PixiJS Point) ---

    /**
     * Calculates the magnitude (length) of a vector.
     * @param point - The PixiJS Point representing the vector.
     * @returns The magnitude of the vector.
     */
    public static magnitude(point: Point): number {
        return Math.sqrt(point.x * point.x + point.y * point.y);
    }

    /**
     * Normalizes a vector (makes its magnitude 1).
     * Modifies the input Point object directly.
     * @param point - The PixiJS Point to normalize.
     * @returns The normalized Point (same instance as input).
     */
    public static normalize(point: Point): Point {
        const mag = MathUtils.magnitude(point);
        if (mag > 0) {
            point.x /= mag;
            point.y /= mag;
        } else {
            point.x = 0;
            point.y = 0;
        }
        return point;
    }

    /**
     * Calculates the dot product of two vectors.
     * @param a - The first PixiJS Point.
     * @param b - The second PixiJS Point.
     * @returns The dot product.
     */
    public static dot(a: Point, b: Point): number {
        return a.x * b.x + a.y * b.y;
    }

    /**
     * Calculates the squared distance between two points.
     * Often faster than distance() if only comparing distances.
     * @param a - The first PixiJS Point.
     * @param b - The second PixiJS Point.
     * @returns The squared distance.
     */
    public static distanceSq(a: Point, b: Point): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    /**
     * Calculates the distance between two points.
     * @param a - The first PixiJS Point.
     * @param b - The second PixiJS Point.
     * @returns The distance.
     */
    public static distance(a: Point, b: Point): number {
        return Math.sqrt(MathUtils.distanceSq(a, b));
    }

    // TODO: Add more utilities like collision detection helpers, angle/rotation helpers as needed.
} 