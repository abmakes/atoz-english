# Multiple Choice Game - React-Pixi Implementation

This directory contains a reimplementation of the Multiple Choice game using `@pixi/react`, a React wrapper for PixiJS. This implementation demonstrates how to use React's component-based architecture with PixiJS for game development.

## Key Features

- **React Component Model**: Leverages React's component architecture for better organization and reusability
- **Hooks-Based Logic**: Uses React hooks for state management and side effects
- **Declarative Rendering**: Takes advantage of React's declarative approach to rendering
- **JSX Syntax**: Uses JSX for more readable PixiJS element creation
- **Same Game Logic**: Maintains the same game logic as the vanilla PixiJS implementation

## Implementation Differences

### Component-Based Architecture

The React implementation organizes the game into reusable components:

- `MultipleChoiceReact`: Main game component that manages state and coordinates other components
- `Timer`: Circular timer display
- `QuestionDisplay`: Renders the question text and associated media
- `AnswerButtonsGrid`: Manages the grid of answer buttons
- `Background`: Handles the game background

### State Management

Rather than using class properties and a state object, the React version uses React's `useState` hook:

```jsx
const [gameState, setGameState] = useState({
  currentQuestionIndex: 0,
  activeTeamIndex: 0,
  // ...other state properties
});

const [question, setQuestion] = useState(null);
const [answerOptions, setAnswerOptions] = useState([]);
// ...other state variables
```

### Event Handling

The React version uses the `useEffect` hook to manage event listeners:

```jsx
useEffect(() => {
  const handleGamePaused = () => {
    timerManager.pauseTimer(QUESTION_TIMER_ID);
  };
  
  eventBus.on(GAME_STATE_EVENTS.GAME_PAUSED, handleGamePaused);
  
  return () => {
    eventBus.off(GAME_STATE_EVENTS.GAME_PAUSED, handleGamePaused);
  };
}, [eventBus, timerManager]);
```

### Drawing and Rendering

Instead of imperative drawing with method calls, the React version uses the declarative approach:

```jsx
// Vanilla PixiJS (imperative)
this.backgroundPanel.clear();
this.backgroundPanel.beginFill(color);
this.backgroundPanel.drawRoundedRect(x, y, width, height, radius);
this.backgroundPanel.endFill();

// React-Pixi (declarative)
<Graphics
  draw={g => {
    g.clear();
    g.roundRect(x, y, width, height, radius)
      .fill({ color });
  }}
/>
```

### Lifecycle Management

The React version uses hooks for lifecycle management:

```jsx
// Initialization
useEffect(() => {
  // Similar to componentDidMount
  const loadData = async () => {
    // Initialization logic
  };
  
  loadData();
  
  // Similar to componentWillUnmount
  return () => {
    // Cleanup logic
  };
}, []);
```

### Layout Updates

Layout updates are handled through React's re-rendering:

```jsx
// Get layout parameters
const layoutParams = useMemo(() => {
  return layoutManagerRef.current?.getLayoutParams() || null;
}, [layoutManagerRef.current]);

// Use layoutParams in JSX
<QuestionDisplay 
  layoutParams={layoutParams}
  // other props
/>
```

## Usage

To use this implementation instead of the vanilla PixiJS version:

```tsx
import { MultipleChoiceReactApp } from '@/lib/pixi-games/multi-react/MultipleChoiceReact';

// In your React component
return (
  <MultipleChoiceReactApp 
    config={gameConfig} 
    pixiEngine={pixiEngine}
    onGameOver={handleGameOver}
  />
);
```

## Benefits of the React-Pixi Approach

1. **Cleaner Code Organization**: Components encapsulate related functionality and appearance
2. **Easier State Management**: React's state system simplifies tracking and updating game state
3. **Reduced Boilerplate**: Less manual event binding/unbinding and cleanup code
4. **Improved Maintainability**: Smaller, focused components are easier to understand and maintain
5. **Better Developer Experience**: JSX and React's declarative style can be more intuitive
6. **Seamless Integration**: Works within the existing React application structure

## Limitations

1. **Performance Overhead**: React's reconciliation adds some overhead compared to direct PixiJS usage
2. **Learning Curve**: Requires understanding both React and PixiJS concepts
3. **Debugging Complexity**: Issues may span both React and PixiJS layers

## Architecture Flow

1. **Initialization**:
   - `MultipleChoiceReactApp` creates the PixiJS Application
   - `MultipleChoiceReact` initializes with configuration and managers
   - Layout manager calculates screen dimensions and selects layout profile
   - Data manager loads question data and initializes the sequencer

2. **Game Loop**:
   - `showNextQuestion` gets the next question and sets up answer options
   - Timer starts and updates visual display on each tick
   - User selects an answer or timer expires
   - Answer feedback is shown, scores are updated via the event system
   - Process repeats until all questions are answered

3. **UI Rendering**:
   - Question text and media are rendered by `QuestionDisplay`
   - Answer buttons are rendered by `AnswerButtonsGrid`
   - Timer is rendered by `Timer`
   - All components adapt to the current layout parameters

4. **Event Handling**:
   - Answer selection triggers `handleAnswerSelected`
   - Timer completion triggers `handleTimeUp`
   - Game pause/resume events update timer state
   - Game over triggers callback to parent component 