/**
 * Engine configuration for switching between PixiJS and Phaser engines
 */

export type EngineType = 'pixi' | 'phaser';

/**
 * Current engine configuration
 * Change this to switch between engines
 */
export const ENGINE_CONFIG = {
    // Set to 'phaser' to use the new Phaser engine
    // Set to 'pixi' to use the existing PixiJS engine
    current: 'pixi' as EngineType,
    
    // Feature flags for specific games
    games: {
        multipleChoice: 'phaser' as EngineType, // Enable Phaser for multiple-choice
        splashDash: 'pixi' as EngineType
    }
};

/**
 * Get the engine type for a specific game
 */
export function getEngineForGame(gameSlug: string): EngineType {
    switch (gameSlug) {
        case 'multiple-choice':
            return ENGINE_CONFIG.games.multipleChoice;
        case 'splash-dash':
            return ENGINE_CONFIG.games.splashDash;
        default:
            return ENGINE_CONFIG.current;
    }
}

/**
 * Check if we should use Phaser for a specific game
 */
export function shouldUsePhaser(gameSlug: string): boolean {
    return getEngineForGame(gameSlug) === 'phaser';
}
