import { describe, it, expect, jest } from '@jest/globals'; // Import jest for spying
import { AnimationUtils } from '@/lib/pixi-engine/utils/AnimationUtils';

describe('AnimationUtils', () => {

    describe('lerp', () => {
        it('should interpolate correctly within [0, 1]', () => {
            expect(AnimationUtils.lerp(0, 100, 0)).toBe(0);
            expect(AnimationUtils.lerp(0, 100, 1)).toBe(100);
            expect(AnimationUtils.lerp(-50, 50, 0.5)).toBe(0);
        });

        it('should clamp t outside [0, 1]', () => {
            expect(AnimationUtils.lerp(0, 100, -0.5)).toBe(0);
            expect(AnimationUtils.lerp(0, 100, 1.5)).toBe(100);
        });
    });

    describe('Easing Functions', () => {
        const testCases = [
            { name: 'easeInQuad', func: AnimationUtils.easeInQuad, t05: 0.25 },
            { name: 'easeOutQuad', func: AnimationUtils.easeOutQuad, t05: 0.75 },
            { name: 'easeInOutQuad', func: AnimationUtils.easeInOutQuad, t05: 0.5 },
            { name: 'easeInCubic', func: AnimationUtils.easeInCubic, t05: 0.125 },
            { name: 'easeOutCubic', func: AnimationUtils.easeOutCubic, t05: 0.875 },
            { name: 'easeInOutCubic', func: AnimationUtils.easeInOutCubic, t05: 0.5 },
        ];

        testCases.forEach(({ name, func, t05 }) => {
            describe(name, () => {
                it('should return 0 for t=0', () => {
                    expect(func(0)).toBeCloseTo(0);
                });

                it('should return 1 for t=1', () => {
                    expect(func(1)).toBeCloseTo(1);
                });

                it('should return correct value for t=0.5', () => {
                    expect(func(0.5)).toBeCloseTo(t05);
                });

                it('should clamp t < 0', () => {
                    expect(func(-1)).toBeCloseTo(0);
                });

                it('should clamp t > 1', () => {
                    expect(func(2)).toBeCloseTo(1);
                });
            });
        });
    });

    describe('tween (placeholder)', () => {
        it('should log a warning', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            AnimationUtils.tween({}, 'x', 100, 1);
            expect(consoleWarnSpy).toHaveBeenCalledWith('AnimationUtils.tween is a placeholder and does not perform animation.');
            consoleWarnSpy.mockRestore();
        });
    });
}); 