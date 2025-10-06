# SplashDash Game Integration

## Overview

The SplashDash game is a two-player competitive quiz game where players control capybara characters swimming through water to reach correct answer circles. This game integrates with the existing PixiJS engine architecture.

## Architecture

### Core Components

1. **SplashDashGame.ts** - Main game class extending BaseGame
2. **managers/** - Game-specific managers following the multiple-choice pattern:
   - `SplashDashDataManager.ts` - Handles question loading and sequencing
   - `SplashDashUIManager.ts` - Manages UI elements (question text, answer circles, scores)
   - `SplashDashLayoutManager.ts` - Handles responsive layout calculations
   - `SplashDashBackgroundManager.ts` - Manages water background and particle effects
   - `SplashDashPlayerManager.ts` - Handles player sprites, movement, and controls

### Integration Points

#### ✅ **Reused from Existing Engine:**
- `BaseGame` lifecycle management (init, start, update, end, destroy)
- `EventBus` for game events and communication
- `TimerManager` for question timers
- `ScoringManager` for tracking player scores
- `AudioManager` for sound effects and music
- `PowerUpManager` for game enhancements
- `ControlsManager` for input handling
- Question loading and sequencing patterns
- Team/player management and turn-based gameplay
- Transition screens for question changes
- Game over and scoring logic

#### 🔄 **Game-Specific Adaptations:**
- Real-time movement and collision detection
- Two-player simultaneous controls
- Answer circle positioning and interaction
- Water particle effects and animations
- Animated capybara sprites
- Player position indicators

## Game Flow

1. **Initialization**: Load questions, setup UI, initialize players
2. **Question Display**: Show question text and position answer circles randomly
3. **Player Movement**: Players control capybara characters with single button (A/L keys)
4. **Answer Selection**: Players swim to answer circles to select answers
5. **Scoring**: First player to reach correct answer wins the question
6. **Next Question**: Repeat until all questions are answered
7. **Game Over**: Display final scores and winner

## Controls

- **Player 1**: Press 'A' to move forward, character rotates when standing still
- **Player 2**: Press 'L' to move forward, character rotates when standing still

## Assets Needed

### Sprites
- `capybara.png` - Animated capybara character sprite
- `water-bg.png` - Water background image

### Audio
- Background music
- Movement sounds
- Correct/incorrect answer sounds
- Victory sounds

## Event System

The game uses the existing event system with these key events:
- `ANSWER_SELECTED` - When a player reaches an answer circle
- `GAME_STATE_EVENTS` - For game lifecycle management
- `TIMER_EVENTS` - For question timing
- `CONTROLS_EVENTS` - For player input

## Collision Detection

The game implements collision detection between:
- Player sprites and answer circles
- Screen boundaries for player movement

## Performance Considerations

- Water particle effects are optimized with object pooling
- Player movement uses efficient delta-time calculations
- UI updates are batched for better performance
- Background effects use efficient graphics rendering

## Future Enhancements

1. **Power-ups**: Speed boost, temporary invincibility, answer hints
2. **Obstacles**: Moving obstacles in the water
3. **Multiple Rounds**: Best of 3/5 question rounds
4. **Customization**: Different capybara skins, water themes
5. **Multiplayer**: Online multiplayer support
6. **Achievements**: Unlockable content and achievements

## Integration with Existing System

To integrate this game with the existing quiz system:

1. Add splash-dash to the game type selection
2. Update the game factory to include SplashDashGame
3. Add splash-dash specific configuration options
4. Update the UI to show splash-dash as an option
5. Add splash-dash specific assets to the asset bundles

## Development Status

- ✅ Core game architecture
- ✅ Manager classes structure
- ✅ Event system integration
- ✅ Basic UI framework
- ⏳ Sprite assets and animations
- ⏳ Collision detection system
- ⏳ Controls integration
- ⏳ Full game integration
