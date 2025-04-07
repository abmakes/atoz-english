# AtoZ PixiJS Quiz Application - Tasks

## Phase 1: Foundation & Architecture Setup
- [x] Project initialization with Next.js, TypeScript, Tailwind, and app router (Assumed complete)
- [x] Install core dependencies (pixi.js, zustand, zod, prisma)
- [x] Install audio libraries (howler)
- [x] Set up shadcn/ui components (Assumed complete)
- [x] Configure TypeScript with strict mode and path aliases
- [x] Set up database with Prisma schema
- [x] Create API routes with Zod validation (Partially done - routes exist, need Zod)
- [x] Establish project folder structure

## Phase 2: Core Engine Development
- [x] Create PixiJS Application wrapper class
- [x] Implement responsive canvas sizing
- [x] Implement Scene Management system
- [ ] Build Audio Management system with theme support
- [ ] Create Theme system with multiple visual styles
- [ ] Develop reusable UI components for PixiJS
- [ ] Create Input Handling system (keyboard, touch, mouse)
- [ ] Add accessibility features

## Phase 3: Game Implementation & Integration
- [x] Create base Game class structure
- [x] Create React wrapper component for PixiJS games
- [ ] Implement first game type (Word Scramble)
- [ ] Build game integration page
- [ ] Implement state management for game settings
- [ ] Create theme definitions and switching functionality
- [ ] Add quiz data loading and processing
- [ ] Implement score tracking and game completion events
- [ ] Integrate Neon DB optimizations (connection pooling, retry logic) into Prisma setup
- [ ] Implement Quiz creation/update via CSV upload/download (`upload-quiz`, `download` routes)
- [ ] Add Zod validation to all API endpoints (Refining existing task)
- [ ] Implement Tag management within Quiz/Question API routes
- [ ] Refactor API routes for standardized error handling

## Phase 4: Mobile & Device Optimization
- [x] Optimize canvas for different screen sizes
- [ ] Add touch gesture recognition
- [ ] Implement device detection for performance settings
- [ ] Create split-screen functionality for multiplayer
- [ ] Add mobile-specific UI adaptations
- [ ] Optimize asset loading for mobile networks
- [ ] Implement performance monitoring

## Phase 5: Release & Deployment
- [ ] Set up environment variables
- [ ] Configure Vercel deployment
- [ ] Create database migration workflow
- [ ] Add error logging and monitoring
- [ ] Implement analytics for game usage
- [ ] Create documentation for codebase
- [x] Set up testing framework

## Additional Features
- [x] Developer debug mode
- [ ] Asset management system for themes
- [ ] Game difficulty configuration
- [ ] Theme editor tool
- [ ] Additional game types
- [ ] User progress tracking
- [ ] Leaderboards functionality


## Lessons Learned - TypeScript and Linting

To avoid common linting errors encountered during development:

### Import Paths
- **Never include file extensions** in import paths (e.g., use `'@/lib/db'` not `'@/lib/db.ts'`) unless using special loaders.
- **Verify module paths** before committing. TypeScript won't find modules if paths are incorrect.
- **Use path aliases consistently** - stick to `@/` prefix for imports from the src directory.

### Type Definitions
- **Define types in centralized locations** - prefer `src/types/` directory for shared types.
- **Use single source of truth** for enums and type definitions - avoid defining similar types in multiple places.
- **Import existing types** rather than recreating them - prevents "Cannot find name" errors.
- **Check for proper exports** - make sure types are properly exported from their modules.

### Unused Variables
- **Use catch blocks without variable binding** for ignored errors: `catch {` instead of `catch (error) {`.
- **Use underscore prefix** for intentionally unused parameters: `_param` to signal intent.
- **Remove unused helper functions** that are no longer needed after refactoring.
- **Clean up debug console.logs** before committing - they often cause linting errors.

### API Route Best Practices
- **Centralize database utilities** in the prisma.ts file to avoid duplicating code.
- **Use consistent response formats** with utility functions like `successResponse` and `errorResponse`.
- **Import the singleton prisma client** from a common location to ensure connection pooling works.
- **Validate request data** with Zod schemas before processing to catch errors early.

## Lessons Learned - PixiJS Development

### Canvas Integration with React
- **Use React components as containers**: Create wrapper React components that handle the lifecycle of PixiJS applications.
- **Prevent double initialization**: Use useRef and useState to track initialization state and avoid creating multiple instances.
- **Clean up resources**: Always implement proper cleanup in useEffect return functions to prevent memory leaks.
- **Handle resize events properly**: Set up proper resize event handling using ResizeObserver for better performance than window resize events.

### Application Structure
- **Create modular class hierarchy**: Implement a clean separation between the core application (PixiApplication), engine (PixiEngine), and scene management systems.
- **Use composition over inheritance**: Design modules that can be composed together rather than deep inheritance hierarchies.
- **Implement proper application lifecycle**: Handle init(), update(), and destroy() methods consistently across all components.
- **Centralize asset loading**: Create a dedicated asset loading system that handles progress tracking and error management.

### Performance Optimization
- **Monitor FPS and performance**: Implement a debug overlay with FPS counter and performance metrics during development.
- **Use proper event handling**: Add event listeners to the correct objects and remove them when they're no longer needed.
- **Implement resolution scaling**: Set proper devicePixelRatio for crisp rendering while maintaining performance.
- **Batch sprite operations**: Group sprites by texture to reduce draw calls and improve rendering performance.

### Responsive Design
- **Maintain aspect ratio**: Implement a ResponsiveCanvas class that can maintain the desired aspect ratio for games.
- **Handle device scaling**: Use proper scaling and positioning for different screen sizes and orientations.
- **Set appropriate canvas dimensions**: Calculate canvas size based on both container size and aspect ratio constraints.
- **Center canvas for best appearance**: Apply proper margins to center the canvas within its container for consistent positioning.

### Debugging and Development
- **Add verbose logging**: Include detailed console logging during critical operations for easier debugging.
- **Implement debug visualization**: Create debug graphics to visualize hitboxes, paths, and other invisible game elements.
- **Handle errors gracefully**: Implement proper error handling in async operations like asset loading.
- **Add error state UI**: Show informative error messages when something goes wrong instead of silently failing.

Following these practices will create a more robust, performant, and maintainable PixiJS application integrated with React.