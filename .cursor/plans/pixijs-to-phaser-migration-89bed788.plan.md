<!-- 89bed788-0c35-4148-941f-c621e58bf240 60b16be2-bb3b-424d-848c-9edec26f0615 -->
# PixiJS to Phaser 3 Migration Plan

## Phase 1: Foundation - Phaser Engine Core

### 1.1 Create Phaser Engine Structure

- Create `src/lib/phaser-engine/` directory structure:
  - `core/` - PhaserEngine, EventBus, GameStateManager, ControlsManager, StorageManager
  - `game/` - BaseGame, ScoringManager, TimerManager, PowerUpManager
  - `assets/` - AssetLoader (hybrid approach for GIF support)
  - `config/` - GameConfig, PhaserConfig
  - `ui/` - TransitionScreen, UI components
  - `scenes/` - Base scene classes

### 1.2 Port Core Managers (Keep Architecture, Change Implementation)

- **EventBus** (`src/lib/phaser-engine/core/EventBus.ts`)
  - Keep existing EventBus interface and event types
  - Implement using Phaser's EventEmitter as underlying system
  - Maintain all current event constants (ENGINE_EVENTS, GAME_EVENTS, etc.)

- **GameStateManager** (`src/lib/phaser-engine/core/GameStateManager.ts`)
  - Port from PixiJS Container-based to Phaser Scene-based state management
  - Keep same state transition logic and events

- **ScoringManager** (`src/lib/phaser-engine/game/ScoringManager.ts`)
  - Direct port (no rendering dependencies)
  - Keep all scoring rules and team/player management

- **TimerManager** (`src/lib/phaser-engine/game/TimerManager.ts`)
  - Replace PixiJS Ticker with Phaser time events
  - Keep same timer interface and countdown/countup logic

- **PowerUpManager** (`src/lib/phaser-engine/game/PowerUpManager.ts`)
  - Direct port (minimal rendering dependencies)
  - Keep power-up definitions and effect system

- **ControlsManager** (`src/lib/phaser-engine/core/ControlsManager.ts`)
  - Replace PixiJS pointer events with Phaser input system
  - Support keyboard, mouse, touch, gamepad
  - Keep same control mapping interface

### 1.3 Hybrid Asset Loading System

- **AssetLoader** (`src/lib/phaser-engine/assets/AssetLoader.ts`)
  - Create Phaser-based loader that wraps PIXI.Assets for GIF support
  - Use Phaser's native loader for images, audio, spritesheets
  - Keep custom GIF loading path using pixi.js/gif library
  - Create adapter methods:
    - `loadAsset(key, url, type)` - Routes to appropriate loader
    - `getDisplayObject(key)` - Returns Phaser GameObject or GifSprite wrapper
    - `preloadGif(url)` - Uses existing PIXI GIF loading
  - Maintain GIF animation support with same API surface

### 1.4 PhaserEngine Main Class

- **PhaserEngine** (`src/lib/phaser-engine/core/PhaserEngine.ts`)
  - Create Phaser.Game instance with configuration
  - Initialize all core managers
  - Provide scene management and lifecycle
  - Match PixiEngine interface for drop-in replacement:
    - `init(config, gameFactory)` - Initialize with game config
    - `destroy()` - Cleanup
    - `getManagers()` - Return manager instances
  - Support same configuration options as PixiEngine

## Phase 2: Base Game Framework

### 2.1 BaseGame Pattern for Phaser

- **BaseGame** (`src/lib/phaser-engine/game/BaseGame.ts`)
  - Extend `Phaser.Scene` instead of Container
  - Keep same lifecycle methods:
    - `createInitialState()` - Define initial game state
    - `initImplementation()` - Async initialization
    - `update(delta)` - Game loop
    - `render()` - Optional custom rendering
    - `destroy()` - Cleanup
  - Provide same manager access as PixiJS version
  - Implement render layer system using Phaser depth/zIndex
  - Keep state management pattern (setState, getState)
  - Maintain transition screen integration
  - Support power-up system integration

### 2.2 Scene Management

- **BaseBootScene** (`src/lib/phaser-engine/scenes/BaseBootScene.ts`)
  - Handle initial asset preloading
  - Initialize engine managers
  - Load theme configurations

- **BasePreloaderScene** (`src/lib/phaser-engine/scenes/BasePreloaderScene.ts`)
  - Show loading screen
  - Preload game-specific assets
  - Handle GIF preloading via hybrid AssetLoader

- **BaseGameScene** (`src/lib/phaser-engine/scenes/BaseGameScene.ts`)
  - Main game scene template
  - Implements BaseGame pattern
  - Manages game state and lifecycle

### 2.3 UI Components for Phaser

- **TransitionScreen** (`src/lib/phaser-engine/ui/TransitionScreen.ts`)
  - Port to Phaser GameObject/Container
  - Keep all transition types (loading, turn, powerup, question_preview, countdown)
  - Maintain power-up wheel animation
  - Support same configuration interface

- **Button** (`src/lib/phaser-engine/ui/Button.ts`)
  - Create Phaser-native button component
  - Support theming and interaction states

- **Text Components** (`src/lib/phaser-engine/ui/Text.ts`)
  - Wrapper around Phaser.GameObjects.Text
  - Support custom fonts (Grandstander)
  - Theme-aware styling

## Phase 3: Game Conversions

### 3.1 Multiple Choice Game Migration

- **Structure** (`src/lib/phaser-games/multiple-choice/`)
  - MultipleChoiceGame.ts - Extend BaseGame/BaseGameScene
  - managers/
    - MultipleChoiceDataManager.ts - Direct port (no rendering)
    - MultipleChoiceUIManager.ts - Convert to Phaser GameObjects
    - MultipleChoiceLayoutManager.ts - Direct port
    - GameBackgroundManager.ts - Convert to Phaser Graphics/Sprites

- **Key Changes**:
  - Replace PIXI.Container with Phaser.GameObjects.Container
  - Replace PIXI.Graphics with Phaser.GameObjects.Graphics
  - Replace PIXI.Text with Phaser.GameObjects.Text
  - Replace PIXI.Sprite with Phaser.GameObjects.Sprite
  - Use AssetLoader.getDisplayObject() for images (maintains GIF support)
  - Convert button interactions to Phaser pointer events
  - Keep all game logic, sequencing, and scoring identical

### 3.2 Splash Dash Game Migration

- **Structure** (`src/lib/phaser-games/splash-dash/`)
  - SplashDashGame.ts - Extend BaseGame/BaseGameScene
  - managers/
    - SplashDashDataManager.ts - Direct port
    - SplashDashUIManager.ts - Convert to Phaser GameObjects
    - SplashDashLayoutManager.ts - Direct port
    - SplashDashBackgroundManager.ts - Convert animated water tiles to Phaser
    - SplashDashPlayerManager.ts - Convert sprite animation to Phaser

- **Key Changes**:
  - Replace PIXI.AnimatedSprite with Phaser sprite animations
  - Convert water tile animation to Phaser sprite sheets
  - Port displacement filter to Phaser FX or custom shader
  - Replace keyboard controls with Phaser input system
  - Convert collision detection to Phaser physics or keep custom
  - Maintain all game mechanics (swimming, answer circles, timer)
  - Use AssetLoader for GIF question images

### 3.3 Transition Screen Updates

- Port question preview functionality to Phaser
- Maintain countdown and "GO!" animations
- Keep GIF loading for question images in preview
- Ensure smooth transitions between scenes

## Phase 4: Integration and React Components

### 4.1 React Component Updates

- **GameContainer** (`src/components/game_ui/GameContainer.tsx`)
  - Replace PixiEngine import with PhaserEngine
  - Update initialization to use Phaser.Game
  - Mount Phaser canvas to DOM element
  - Keep same props and state management
  - Maintain game over flow and scoring display

- **GameplayView** (`src/components/game_ui/GameplayView.tsx`)
  - Update for Phaser engine reference
  - Keep same event listener pattern
  - Maintain score updates and team management
  - Support pause/resume functionality

### 4.2 Game Factory Pattern

- **GameFactory** (`src/lib/phaser-engine/core/GameFactory.ts`)
  - Create registry for Phaser games
  - Map game slugs to game classes
  - Provide same factory interface as PixiJS version
  - Support dynamic game loading

### 4.3 Configuration Updates

- Update game configuration to support Phaser settings
- Maintain backward compatibility with existing quiz data
- Keep theme system working with Phaser rendering

## Phase 5: Testing and Refinement

### 5.1 Feature Parity Verification

- Test all quiz types (multiple choice, splash dash)
- Verify GIF loading and animation
- Test all power-ups and their effects
- Verify transition screens and animations
- Test responsive layout on all devices
- Verify audio playback and settings
- Test team management and scoring
- Verify timer functionality

### 5.2 Performance Optimization

- Profile Phaser game performance
- Optimize asset loading and caching
- Test GIF animation performance
- Ensure smooth 60fps gameplay
- Optimize memory usage

### 5.3 Clean Up

- Remove PixiJS engine code (`src/lib/pixi-engine/`)
- Remove PixiJS games (`src/lib/pixi-games/`)
- Update all imports to use phaser-engine
- Remove PixiJS dependencies from package.json
- Update documentation

## Phase 6: Documentation and Future Expansion

### 6.1 Update Documentation

- Create new game-development-guide.md for Phaser
- Document Phaser-specific patterns and best practices
- Update GIF loading documentation
- Create migration guide for future games
- Document scene lifecycle and state management

### 6.2 Future Game Template

- Create template scene for new games
- Document how to extend BaseGame/BaseGameScene
- Provide examples of common game patterns
- Create boilerplate for new game types

## Key Technical Decisions

### GIF Support Strategy (Hybrid Approach)

1. Keep pixi.js/gif library for GIF support
2. Phaser loads static images and spritesheets natively
3. AssetLoader routes GIF URLs to PIXI.Assets.load()
4. Wrap GifSprite in Phaser GameObject container
5. Maintain same .play() animation interface
6. Preload GIFs in boot scene using hybrid loader

### Architecture Benefits for Future Games

1. Phaser's scene system makes multi-scene games easier
2. Built-in physics engines (Arcade, Matter) for complex interactions
3. Better mobile performance and touch support
4. Extensive plugin ecosystem
5. Better tilemap support for level-based games
6. WebGL shader support for advanced effects
7. Built-in particle systems
8. Timeline and tween systems for animations

### Migration Safety

1. Keep both engines during development
2. Test each game thoroughly before removing PixiJS version
3. Maintain feature flag for engine selection during transition
4. Comprehensive test suite for all game mechanics
5. Beta testing phase before full rollout

## Dependencies to Add

- phaser: ^3.80.0 (latest stable)
- Keep pixi.js/gif for GIF support
- Remove @pixi/devtools and other PixiJS-specific deps

## File Structure After Migration

```
src/lib/
├── phaser-engine/          # New Phaser engine
│   ├── core/              # Core managers
│   ├── game/              # Game managers
│   ├── assets/            # Hybrid asset loader
│   ├── config/            # Configuration
│   ├── ui/                # UI components
│   └── scenes/            # Base scenes
├── phaser-games/          # New Phaser games
│   ├── multiple-choice/
│   └── splash-dash/
└── themes/                # Keep existing themes
```

This plan ensures a systematic, safe migration that maintains all current functionality while setting up a robust foundation for future game development with Phaser's superior architecture and ecosystem.

### To-dos

- [ ] Create Phaser engine directory structure and base files
- [ ] Port core managers (EventBus, GameStateManager, Scoring, Timer, PowerUp, Controls)
- [ ] Implement hybrid AssetLoader with GIF support
- [ ] Create PhaserEngine main class matching PixiEngine interface
- [ ] Create BaseGame pattern extending Phaser.Scene
- [ ] Create base scene classes (Boot, Preloader, Game)
- [ ] Port UI components (TransitionScreen, Button, Text)
- [ ] Convert Multiple Choice game to Phaser
- [ ] Convert Splash Dash game to Phaser
- [ ] Update transition screens for Phaser
- [ ] Update React components for Phaser integration
- [ ] Create Phaser game factory pattern
- [ ] Update configuration for Phaser
- [ ] Comprehensive testing of all features
- [ ] Performance optimization and profiling
- [ ] Remove PixiJS code and dependencies
- [ ] Update all documentation for Phaser
- [ ] Create future game template and guides