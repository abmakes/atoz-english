import { describe, it, expect } from '@jest/globals';
import { Point } from 'pixi.js';
import { MathUtils } from '@/lib/pixi-engine/utils/MathUtils';

describe('MathUtils', () => {

    describe('lerp', () => {
        it('should interpolate correctly within [0, 1]', () => {
            expect(MathUtils.lerp(0, 10, 0)).toBe(0);
            expect(MathUtils.lerp(0, 10, 1)).toBe(10);
            expect(MathUtils.lerp(0, 10, 0.5)).toBe(5);
            expect(MathUtils.lerp(-10, 10, 0.5)).toBe(0);
        });

        it('should clamp t outside [0, 1]', () => {
            expect(MathUtils.lerp(0, 10, -1)).toBe(0);
            expect(MathUtils.lerp(0, 10, 2)).toBe(10);
        });
    });

    describe('clamp01', () => {
        it('should clamp values correctly', () => {
            expect(MathUtils.clamp01(0.5)).toBe(0.5);
            expect(MathUtils.clamp01(-1)).toBe(0);
            expect(MathUtils.clamp01(2)).toBe(1);
        });
    });

    describe('clamp', () => {
        it('should clamp values correctly', () => {
            expect(MathUtils.clamp(5, 0, 10)).toBe(5);
            expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
            expect(MathUtils.clamp(15, 0, 10)).toBe(10);
        });
    });

    describe('randomRange', () => {
        it('should return a number within the range', () => {
            const min = 5;
            const max = 10;
            for (let i = 0; i < 100; i++) {
                const result = MathUtils.randomRange(min, max);
                expect(result).toBeGreaterThanOrEqual(min);
                expect(result).toBeLessThanOrEqual(max);
                expect(typeof result).toBe('number');
            }
        });
    });

    describe('randomIntRange', () => {
        it('should return an integer within the range', () => {
            const min = -5;
            const max = 5;
            for (let i = 0; i < 100; i++) {
                const result = MathUtils.randomIntRange(min, max);
                expect(result).toBeGreaterThanOrEqual(min);
                expect(result).toBeLessThanOrEqual(max);
                expect(Number.isInteger(result)).toBe(true);
            }
        });
    });

    describe('degreesToRadians', () => {
        it('should convert degrees to radians correctly', () => {
            expect(MathUtils.degreesToRadians(0)).toBeCloseTo(0);
            expect(MathUtils.degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
            expect(MathUtils.degreesToRadians(180)).toBeCloseTo(Math.PI);
            expect(MathUtils.degreesToRadians(360)).toBeCloseTo(Math.PI * 2);
        });
    });

    describe('radiansToDegrees', () => {
        it('should convert radians to degrees correctly', () => {
            expect(MathUtils.radiansToDegrees(0)).toBeCloseTo(0);
            expect(MathUtils.radiansToDegrees(Math.PI / 2)).toBeCloseTo(90);
            expect(MathUtils.radiansToDegrees(Math.PI)).toBeCloseTo(180);
            expect(MathUtils.radiansToDegrees(Math.PI * 2)).toBeCloseTo(360);
        });
    });

    // --- Vector Operations ---
    const p1 = new Point(3, 4);
    const p2 = new Point(-1, 2);
    const zero = new Point(0, 0);

    describe('magnitude', () => {
        it('should calculate magnitude correctly', () => {
            expect(MathUtils.magnitude(p1)).toBeCloseTo(5);
            expect(MathUtils.magnitude(p2)).toBeCloseTo(Math.sqrt(5));
            expect(MathUtils.magnitude(zero)).toBeCloseTo(0);
        });
    });

    describe('normalize', () => {
        it('should normalize vector correctly', () => {
            const normalizedP1 = MathUtils.normalize(new Point(p1.x, p1.y));
            expect(MathUtils.magnitude(normalizedP1)).toBeCloseTo(1);
            expect(normalizedP1.x).toBeCloseTo(3 / 5);
            expect(normalizedP1.y).toBeCloseTo(4 / 5);
        });

        it('should handle zero vector normalization', () => {
            const normalizedZero = MathUtils.normalize(new Point(zero.x, zero.y));
            expect(normalizedZero.x).toBe(0);
            expect(normalizedZero.y).toBe(0);
        });
    });

    describe('dot', () => {
        it('should calculate dot product correctly', () => {
            expect(MathUtils.dot(p1, p2)).toBeCloseTo(3 * -1 + 4 * 2); // -3 + 8 = 5
            expect(MathUtils.dot(p1, zero)).toBeCloseTo(0);
        });
    });

    describe('distanceSq', () => {
        it('should calculate squared distance correctly', () => {
            const dx = p1.x - p2.x; // 3 - (-1) = 4
            const dy = p1.y - p2.y; // 4 - 2 = 2
            expect(MathUtils.distanceSq(p1, p2)).toBeCloseTo(dx * dx + dy * dy); // 16 + 4 = 20
            expect(MathUtils.distanceSq(p1, zero)).toBeCloseTo(p1.x * p1.x + p1.y * p1.y); // 9 + 16 = 25
        });
    });

    describe('distance', () => {
        it('should calculate distance correctly', () => {
            expect(MathUtils.distance(p1, p2)).toBeCloseTo(Math.sqrt(20));
            expect(MathUtils.distance(p1, zero)).toBeCloseTo(5);
        });
    });
});
