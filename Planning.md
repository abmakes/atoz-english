# AtoZ PixiJS Quiz Application - High-Level Overview

## Vision

The AtoZ PixiJS Quiz Application is an interactive, engaging educational platform that transforms traditional quiz-based learning into immersive game experiences. The application aims to:

- Make learning more engaging through gamification
- Support multiple learning styles with varied game types
- Provide accessible education across different devices
- Enable customizable experiences through themes and difficulty levels
- Allow multiplayer learning experiences on a single device

By leveraging the power of PixiJS for advanced 2D graphics and animation, combined with the robust architecture of Next.js, the platform creates memorable learning experiences that improve retention while maintaining educational integrity.

## Architecture

The application follows a layered architecture that separates concerns and promotes reusability:

1. **Presentation Layer**:
   - React components for UI elements and app navigation
   - PixiJS canvas for game rendering
   - Responsive design adapting to different screen sizes

2. **Game Engine Layer**:
   - PixiJS wrapper for canvas management
   - Scene management system
   - Input handling for keyboard, mouse, and touch
   - Audio system for sound effects and music
   - Theme system for visual customization

3. **Game Logic Layer**:
   - Individual game implementations
   - Quiz data processing
   - Score tracking and feedback systems

4. **Data Layer**:
   - Prisma ORM for database access (import schema from old project)
   - API routes for data operations (import working api routes from old project)
   - Zod for data validation (update API routes)

5. **State Management**:
   - Zustand for global state
   - React context for theme management
   - Local storage for persisting preferences

## Project Structure

```
src/
├── app/
│   ├── api/                     # Backend API routes (Unchanged)
│   │   └── ...
│   ├── (main_app)/              # Routes for the standard website part (optional grouping)
│   │   ├── layout.tsx
│   │   └── page.tsx             # e.g., Landing page
│   ├── games/                   # Root for all game-related pages/UI
│   │   ├── layout.tsx           # Layout specific to games section (optional, could be higher up)
│   │   ├── page.tsx             # Optional: Page to list quizzes or game types (e.g., /games)
│   │   ├── [quizId]/            # <<< NEW: Dynamic route for a specific Quiz ID >>>
│   │   │   ├── page.tsx         # Optional: Page showing details about quizId, available games?
│   │   │   └── [gameSlug]/      # <<< NEW: Dynamic route for the game type for this quiz >>>
│   │   │       └── page.tsx     # React Wrapper/Loader for the specific game (PixiJS or React) using quizId and gameSlug
│   │   └── store/               # Zustand store (or other state management) for games section
│   │       └── quizStore.ts     # Store managing state potentially across quizzes/games
│   ├── quizzes/                 # Optional: Routes specifically for managing/creating quizzes
│   │   └── ...
│   └── ...                      # Other app routes
├── components/                  # Reusable React components (Unchanged)
│   ├── ui/                      # Shadcn or other UI library components
│   ├── QuizGame/                # The main React-based quiz component (if applicable)
│   └── ...
├── lib/
│   ├── prisma.ts                # Prisma client (Unchanged)
│   ├── utils.ts                 # General utility functions
│   └── pixi-engine/             # <<< Shared PixiJS Engine Logic (Structured) >>>
│       ├── core/                # Renderer setup, game loop, scene manager
│       ├── assets/              # Asset loader utilities
│       ├── entities/            # Base classes for game objects (optional)
│       ├── ui/                  # Common PixiJS UI elements (buttons, text)
│       └── utils/               # PixiJS specific helpers
├── pixi-games/                  # <<< Specific PixiJS Game Implementations (Modular) >>>
│   ├── swimmer/
│   │   ├── index.ts             # Entry point for the swimmer game
│   │   ├── assets/              # Swimmer-specific assets
│   │   ├── scenes/              # MenuScene, GameScene, GameOverScene
│   │   ├── entities/            # Player, AnswerCircle implementations
│   │   └── ...
│   └── another-pixi-game/
│       └── ...
├── contexts/                    # React contexts (Unchanged)
├── styles/                      # Styling and Theming
│   ├── globals.css
│   └── theme/                   # Theme definitions (colors, fonts, etc.)
│       ├── index.ts
│       └── ...
├── types/                       # TypeScript types (Unchanged)
│   └── index.ts
└── utils/                       # Client-side utilities (Unchanged)
    └── api.ts                   # Client-side API fetching functions
```

## Technical Constraints

1. **Performance Requirements**:
   - Must maintain 60fps on modern devices
   - Support for lower-end mobile devices with graceful degradation
   - Efficient asset loading and management

2. **Compatibility**:
   - Support for modern browsers (Chrome, Firefox, Safari, Edge)
   - Mobile-responsive design for tablets and smartphones
   - Touch-friendly interface

3. **Accessibility**:
   - Support for keyboard navigation
   - Color contrast compliance
   - Screen reader compatibility where possible
   - Alternative input methods

4. **Offline Capability**:
   - Basic functionality without internet connection
   - Sync when connection is restored

5. **Security**:
   - Data validation on both client and server
   - Protection against common web vulnerabilities
   - Secure API endpoints

## Tech Stack

1. **Frontend**:
   - Next.js (App Router) - React framework for server and client components
   - TypeScript - For type safety and improved developer experience
   - PixiJS - WebGL-based rendering library for 2D graphics
   - Tailwind CSS - Utility-first CSS framework
   - Shadcn/UI - Component library built on Radix UI
   - Howler.js - Audio library for sound management

2. **Backend**:
   - Next.js API Routes - Server endpoints
   - Prisma - ORM for database access
   - PostgreSQL - Relational database
   - Zod - Runtime type validation

3. **State Management**:
   - Zustand - Lightweight state management
   - React Context - For theme and settings

4. **Deployment & Infrastructure**:
   - Vercel - Hosting and deployment
   - Vercel Postgres - Database service

## Development Tools

1. **Development Environment**:
   - Cursor - Code editor
   - ESLint - Code linting
   - Prettier - Code formatting
   - TypeScript - Static type checking

2. **Testing Tools**:
   - Jest - Unit testing
   - Testing Library - Component testing
   - Playwright - E2E testing

3. **CI/CD Tools**:
   - GitHub Actions - Continuous integration
   - Vercel - Continuous deployment
   - Husky - Git hooks for pre-commit checks

4. **Monitoring & Analytics**:
   - Vercel Analytics - Usage metrics
   - Error tracking - Sentry
   - Performance monitoring - Web Vitals

5. **Design Tools**:
   - Figma - UI/UX design
   - Texture Packer - Sprite sheet creation
   - Audacity - Audio editing

This architecture provides a robust foundation for building engaging, interactive quiz games while maintaining performance, accessibility, and developer productivity.


