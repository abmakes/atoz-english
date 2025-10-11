<!-- 89bed788-0c35-4148-941f-c621e58bf240 60b16be2-bb3b-424d-848c-9edec26f0615 -->
# PixiJS to Phaser 3 Migration Plan

## CORRECTED ARCHITECTURE APPROACH

**Key Decision:** Use scene-independent managers (like PixiJS) with Phaser for rendering only.

- Managers work without scene dependencies
- BaseGame extends Phaser.Scene for rendering benefits
- Defer GIF support to Phase 2 (get static images working first)
- Focus on stable, observable progress

## Phase 1: Foundation - Phaser Engine Core (STABLE LOADING)

### 1.1 Create Phaser Engine Structure ✅ COMPLETED

- [x] Create `src/lib/phaser-engine/` directory structure:
  - [x] `core/` - PhaserEngine, EventBus, GameStateManager, ControlsManager, StorageManager, RuleEngine
  - [x] `game/` - BaseGame, ScoringManager, TimerManager, PowerUpManager, QuestionSequencer
  - [x] `assets/` - AssetLoader (simplified for static images first)
  - [x] `config/` - GameConfig, PhaserConfig
  - [x] `ui/` - TransitionScreen, PowerupSpinWheel
  - [ ] `scenes/` - Base scene classes (DEFERRED - using single scene approach)

### 1.2 Port Core Managers (Keep Architecture, Change Implementation) ✅ MOSTLY COMPLETED

- [x] **EventBus** (`src/lib/phaser-engine/core/EventBus.ts`)
  - [x] Keep existing EventBus interface and event types
  - [x] Implement using EventEmitter3 (not Phaser's EventEmitter)
  - [x] Maintain all current event constants (ENGINE_EVENTS, GAME_EVENTS, etc.)

- [x] **GameStateManager** (`src/lib/phaser-engine/core/GameStateManager.ts`)
  - [x] Direct port (no scene dependencies)
  - [x] Keep same state transition logic and events

- [x] **ScoringManager** (`src/lib/phaser-engine/game/ScoringManager.ts`)
  - [x] Direct port (no rendering dependencies)
  - [x] Keep all scoring rules and team/player management

- [x] **TimerManager** (`src/lib/phaser-engine/game/TimerManager.ts`) ⚠️ NEEDS FIX
  - [x] Port timer interface and countdown/countup logic
  - [ ] **CRITICAL FIX:** Remove scene dependency, use browser timers (setTimeout/setInterval)
  - [ ] **CRITICAL FIX:** Update constructor to match PixiJS version (2 params only)

- [x] **PowerUpManager** (`src/lib/phaser-engine/game/PowerUpManager.ts`)
  - [x] Direct port (minimal rendering dependencies)
  - [x] Keep power-up definitions and effect system

- [x] **ControlsManager** (`src/lib/phaser-engine/core/ControlsManager.ts`)
  - [x] Replace PixiJS pointer events with Phaser input system
  - [x] Support keyboard, mouse, touch
  - [x] Keep same control mapping interface

- [x] **RuleEngine** (`src/lib/phaser-engine/core/RuleEngine.ts`)
  - [x] Direct port from PixiJS version
  - [x] Event-driven game logic processing

- [x] **QuestionSequencer** (`src/lib/phaser-engine/game/QuestionSequencer.ts`)
  - [x] Direct port from PixiJS version
  - [x] Question distribution and sequencing logic

### 1.3 Simplified Asset Loading System (STATIC IMAGES ONLY) ✅ COMPLETED

- [x] **AssetLoader** (`src/lib/phaser-engine/assets/AssetLoader.ts`) - ✅ COMPLETED
  - [x] **REMOVE:** All PIXI imports and dual-cache complexity
  - [x] **SIMPLIFY:** Use only Phaser's scene.load system
  - [x] **DEFER:** GIF support to Phase 2
  - [x] **FIX:** Remove scene dependency from init()
  - [x] **FIX:** Defer scene-based loading to BaseGame

### 1.4 PhaserEngine Main Class ✅ COMPLETED

- [x] **PhaserEngine** (`src/lib/phaser-engine/core/PhaserEngine.ts`)
  - [x] Create Phaser.Game instance with configuration
  - [x] Initialize all core managers
  - [x] Provide single-scene management and lifecycle
  - [x] Match PixiEngine interface for drop-in replacement:
    - [x] `init(config, gameFactory)` - Initialize with game config
    - [x] `destroy()` - Cleanup
    - [x] `getManagers()` - Return manager instances
  - [x] Support same configuration options as PixiEngine

## Phase 2: Base Game Framework (STABLE ASSET LOADING & DISPLAY)

### 2.1 BaseGame Pattern for Phaser ✅ COMPLETED

- [x] **BaseGame** (`src/lib/phaser-engine/game/BaseGame.ts`)
  - [x] Extend `Phaser.Scene` instead of Container
  - [x] Keep same lifecycle methods:
    - [x] `createInitialState()` - Define initial game state
    - [x] `initImplementation()` - Async initialization
    - [x] `update(delta)` - Game loop
    - [x] `destroy()` - Cleanup
  - [x] Provide same manager access as PixiJS version
  - [x] Implement render layer system using Phaser depth/zIndex
  - [x] Keep state management pattern (setState, getState)
  - [x] Maintain transition screen integration
  - [x] Support power-up system integration

### 2.2 Scene Management (DEFERRED - Using Single Scene)

- [ ] **BaseBootScene** - **DEFERRED** (using inline scene creation)
- [ ] **BasePreloaderScene** - **DEFERRED** (using inline scene creation)  
- [ ] **BaseGameScene** - **DEFERRED** (using inline scene creation)

**Decision:** Use single scene approach for simplicity and stability.

### 2.3 UI Components for Phaser ✅ PARTIALLY COMPLETED

- [x] **TransitionScreen** (`src/lib/phaser-engine/ui/TransitionScreen.ts`)
  - [x] Port to Phaser GameObject/Container
  - [x] Keep all transition types (loading, turn, powerup, question_preview, countdown)
  - [x] Maintain power-up wheel animation
  - [x] Support same configuration interface

- [x] **PowerupSpinWheel** (`src/lib/phaser-engine/ui/PowerupSpinWheel.ts`)
  - [x] Basic Phaser implementation with tweens

- [ ] **Button** (`src/lib/phaser-engine/ui/Button.ts`) - **DEFERRED**
  - [ ] Create Phaser-native button component
  - [ ] Support theming and interaction states

- [ ] **Text Components** (`src/lib/phaser-engine/ui/Text.ts`) - **DEFERRED**
  - [ ] Wrapper around Phaser.GameObjects.Text
  - [ ] Support custom fonts (Grandstander)
  - [ ] Theme-aware styling

## Phase 3: Critical Fixes (STABLE APPLICATION LOADING) ✅ COMPLETED

### 3.1 Fix Critical Runtime Errors ✅ COMPLETED

- [x] **Fix TimerManager Constructor** - ✅ COMPLETED
  - [x] Remove `scene: Phaser.Scene` parameter from constructor
  - [x] Use browser timers (setTimeout/setInterval) instead of Phaser scene.time
  - [x] Update PhaserEngine to call TimerManager with 2 params only
  - [x] Test: Application loads without constructor errors

- [x] **Fix AssetLoader Scene Dependency** - ✅ COMPLETED
  - [x] Remove scene parameter from `init()` method
  - [x] Remove all PIXI imports and dual-cache logic
  - [x] Simplify to pure Phaser asset loading
  - [x] Defer scene-based loading to BaseGame
  - [x] Test: AssetLoader initializes without scene dependency

- [x] **Fix Missing EventTypes** - ✅ COMPLETED
  - [x] Add missing event payload types to EventTypes.ts
  - [x] Ensure all manager events are properly typed
  - [x] Test: No TypeScript compilation errors

- [x] **Fix PhaserEngine Manager Initialization** - ✅ COMPLETED
  - [x] Update manager initialization order
  - [x] Ensure all managers receive correct parameters
  - [x] Test: PhaserEngine initializes without errors

### 3.2 Create Test Game (OBSERVABLE OUTPUT) ✅ COMPLETED

- [x] **Create Simple Test Game** (`src/lib/phaser-games/test/`)
  - [x] TestGame.ts - Minimal game extending BaseGame
  - [x] Display "Hello Phaser" text on screen
  - [x] Show basic Phaser canvas rendering
  - [x] Test: Can see Phaser canvas with text

- [x] **Create Test React Component**
  - [x] Update GameContainer to use PhaserEngine
  - [x] Mount test game in React component
  - [x] Test: Can load test game in browser

## Phase 4: Multiple Choice Game Migration (STABLE GAME FUNCTIONALITY)

### 4.1 Multiple Choice Game Migration

- [ ] **Structure** (`src/lib/phaser-games/multiple-choice/`)
  - [ ] MultipleChoiceGame.ts - Extend BaseGame
  - [ ] managers/
    - [ ] MultipleChoiceDataManager.ts - Direct port (no rendering)
    - [ ] MultipleChoiceUIManager.ts - Convert to Phaser GameObjects
    - [ ] MultipleChoiceLayoutManager.ts - Direct port
    - [ ] GameBackgroundManager.ts - Convert to Phaser Graphics/Sprites

- [ ] **Key Changes**:
  - [ ] Replace PIXI.Container with Phaser.GameObjects.Container
  - [ ] Replace PIXI.Graphics with Phaser.GameObjects.Graphics
  - [ ] Replace PIXI.Text with Phaser.GameObjects.Text
  - [ ] Replace PIXI.Sprite with Phaser.GameObjects.Sprite
  - [ ] Use simplified AssetLoader for static images only
  - [ ] Convert button interactions to Phaser pointer events
  - [ ] Keep all game logic, sequencing, and scoring identical

### 4.2 Splash Dash Game Migration (DEFERRED)

- [ ] **Structure** (`src/lib/phaser-games/splash-dash/`) - **DEFERRED TO PHASE 5**
  - [ ] SplashDashGame.ts - Extend BaseGame
  - [ ] managers/ - All deferred

### 4.3 Transition Screen Updates ✅ COMPLETED

- [x] Port question preview functionality to Phaser
- [x] Maintain countdown and "GO!" animations
- [ ] Keep GIF loading for question images in preview - **DEFERRED TO PHASE 6**
- [x] Ensure smooth transitions between scenes

## Phase 5: Integration and React Components (STABLE REACT INTEGRATION)

### 5.1 React Component Updates

- [ ] **GameContainer** (`src/components/game_ui/GameContainer.tsx`)
  - [ ] Replace PixiEngine import with PhaserEngine
  - [ ] Update initialization to use Phaser.Game
  - [ ] Mount Phaser canvas to DOM element
  - [ ] Keep same props and state management
  - [ ] Maintain game over flow and scoring display

- [ ] **GameplayView** (`src/components/game_ui/GameplayView.tsx`)
  - [ ] Update for Phaser engine reference
  - [ ] Keep same event listener pattern
  - [ ] Maintain score updates and team management
  - [ ] Support pause/resume functionality

### 5.2 Game Factory Pattern

- [ ] **GameFactory** (`src/lib/phaser-engine/core/GameFactory.ts`)
  - [ ] Create registry for Phaser games
  - [ ] Map game slugs to game classes
  - [ ] Provide same factory interface as PixiJS version
  - [ ] Support dynamic game loading

### 5.3 Configuration Updates

- [ ] Update game configuration to support Phaser settings
- [ ] Maintain backward compatibility with existing quiz data
- [ ] Keep theme system working with Phaser rendering

## Phase 6: Splash Dash Game Migration (STABLE ADVANCED GAMES)

### 6.1 Splash Dash Game Migration

- [ ] **Structure** (`src/lib/phaser-games/splash-dash/`)
  - [ ] SplashDashGame.ts - Extend BaseGame
  - [ ] managers/
    - [ ] SplashDashDataManager.ts - Direct port
    - [ ] SplashDashUIManager.ts - Convert to Phaser GameObjects
    - [ ] SplashDashLayoutManager.ts - Direct port
    - [ ] SplashDashBackgroundManager.ts - Convert animated water tiles to Phaser
    - [ ] SplashDashPlayerManager.ts - Convert sprite animation to Phaser

- [ ] **Key Changes**:
  - [ ] Replace PIXI.AnimatedSprite with Phaser sprite animations
  - [ ] Convert water tile animation to Phaser sprite sheets
  - [ ] Port displacement filter to Phaser FX or custom shader
  - [ ] Replace keyboard controls with Phaser input system
  - [ ] Convert collision detection to Phaser physics or keep custom
  - [ ] Maintain all game mechanics (swimming, answer circles, timer)
  - [ ] Use simplified AssetLoader for static images only

## Phase 7: GIF Support Implementation (STABLE ANIMATED CONTENT)

### 7.1 Hybrid Asset Loading System

- [ ] **AssetLoader** (`src/lib/phaser-engine/assets/AssetLoader.ts`)
  - [ ] Add back PIXI.Assets for GIF support
  - [ ] Create Phaser-based loader that wraps PIXI.Assets for GIF support
  - [ ] Use Phaser's native loader for images, audio, spritesheets
  - [ ] Keep custom GIF loading path using pixi.js/gif library
  - [ ] Create adapter methods:
    - [ ] `loadAsset(key, url, type)` - Routes to appropriate loader
    - [ ] `getDisplayObject(key)` - Returns Phaser GameObject or GifSprite wrapper
    - [ ] `preloadGif(url)` - Uses existing PIXI GIF loading
  - [ ] Maintain GIF animation support with same API surface

### 7.2 GIF Integration Testing

- [ ] Test GIF loading and animation
- [ ] Verify GIF performance in games
- [ ] Test GIF question images in Multiple Choice
- [ ] Test GIF question images in Splash Dash

## Phase 8: Testing and Refinement (STABLE PRODUCTION)

### 8.1 Feature Parity Verification

- [ ] Test all quiz types (multiple choice, splash dash)
- [ ] Verify GIF loading and animation
- [ ] Test all power-ups and their effects
- [ ] Verify transition screens and animations
- [ ] Test responsive layout on all devices
- [ ] Verify audio playback and settings
- [ ] Test team management and scoring
- [ ] Verify timer functionality

### 8.2 Performance Optimization

- [ ] Profile Phaser game performance
- [ ] Optimize asset loading and caching
- [ ] Test GIF animation performance
- [ ] Ensure smooth 60fps gameplay
- [ ] Optimize memory usage

### 8.3 Clean Up

- [ ] Remove PixiJS engine code (`src/lib/pixi-engine/`)
- [ ] Remove PixiJS games (`src/lib/pixi-games/`)
- [ ] Update all imports to use phaser-engine
- [ ] Remove PixiJS dependencies from package.json
- [ ] Update documentation

## Phase 9: Documentation and Future Expansion

### 9.1 Update Documentation

- [ ] Create new game-development-guide.md for Phaser
- [ ] Document Phaser-specific patterns and best practices
- [ ] Update GIF loading documentation
- [ ] Create migration guide for future games
- [ ] Document scene lifecycle and state management

### 9.2 Future Game Template

- [ ] Create template scene for new games
- [ ] Document how to extend BaseGame/BaseGameScene
- [ ] Provide examples of common game patterns
- [ ] Create boilerplate for new game types

## Key Technical Decisions

### CORRECTED Architecture Approach

**Scene-Independent Managers:**

- Managers work without scene dependencies (like PixiJS)
- BaseGame extends Phaser.Scene for rendering benefits only
- Single scene approach for simplicity and stability
- Defer complex scene management to later phases

### GIF Support Strategy (DEFERRED APPROACH)

**Phase 1-5:** Static images only for stability

**Phase 7:** Add hybrid approach:

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
- Keep pixi.js/gif for GIF support (Phase 7)
- Remove @pixi/devtools and other PixiJS-specific deps (Phase 8)

## File Structure After Migration

```
src/lib/
├── phaser-engine/          # New Phaser engine
│   ├── core/              # Core managers
│   ├── game/              # Game managers
│   ├── assets/            # Simplified asset loader (Phase 1-5)
│   ├── config/            # Configuration
│   ├── ui/                # UI components
│   └── scenes/            # Base scenes (DEFERRED)
├── phaser-games/          # New Phaser games
│   ├── test/              # Test game (Phase 3)
│   ├── multiple-choice/   # Phase 4
│   └── splash-dash/       # Phase 6
└── themes/                # Keep existing themes
```

## STABLE PHASES SUMMARY

**Phase 1:** Foundation - Phaser Engine Core (STABLE LOADING) ✅ COMPLETED

**Phase 2:** Base Game Framework (STABLE ASSET LOADING & DISPLAY) ✅ COMPLETED

**Phase 3:** Critical Fixes (STABLE APPLICATION LOADING) ✅ COMPLETED

**Phase 4:** Multiple Choice Game Migration (STABLE GAME FUNCTIONALITY)

**Phase 5:** Integration and React Components (STABLE REACT INTEGRATION)

**Phase 6:** Splash Dash Game Migration (STABLE ADVANCED GAMES)

**Phase 7:** GIF Support Implementation (STABLE ANIMATED CONTENT)

**Phase 8:** Testing and Refinement (STABLE PRODUCTION)

**Phase 9:** Documentation and Future Expansion

### COMPLETED STEPS (Phase 3) ✅

1. **Fix TimerManager Constructor** - ✅ Remove scene dependency
2. **Fix AssetLoader Scene Dependency** - ✅ Simplify to pure Phaser
3. **Fix Missing EventTypes** - ✅ Add proper TypeScript types
4. **Create Test Game** - ✅ Observable "Hello Phaser" output
5. **Test Application Loading** - ✅ No runtime errors

### NEXT STEPS (Phase 4)

1. **Multiple Choice Game Migration** - Port existing game to Phaser
2. **React Component Integration** - Update GameContainer for Phaser
3. **Game Factory Pattern** - Create registry for Phaser games

This plan ensures a systematic, stable migration with observable progress at each phase.