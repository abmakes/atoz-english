# Splash Dash Game Mechanics

## Overview
Splash Dash is a two-player competitive quiz game where players control capybara characters swimming to reach correct answer rectangles. The game emphasizes speed, accuracy, and strategic movement.

## Scoring System

### Time-Based Scoring
- **Correct Answer**: `Math.floor(remainingTimeMs / 1000)` seconds + 5 bonus if first to answer correctly
- **Incorrect Answer**: -3 points
- **Timeout**: -1 point

### Examples
- Player answers correctly with 8 seconds remaining and is first: +13 points (8 + 5)
- Player answers correctly with 3 seconds remaining but not first: +3 points
- Player answers incorrectly: -3 points
- Player runs out of time: -1 point

### Strategy Tips
- **Speed is rewarded**: Faster correct answers earn more points
- **First player advantage**: Being first to answer correctly gives a significant 5-point bonus
- **Risk vs. reward**: Incorrect answers are less punishing (-3 vs. old -5), encouraging risk-taking
- **Time management**: Even if you're not first, answering correctly before time runs out is better than timeout

## Timer Behavior

### Continuous Timer
- Timer continues running until **all players answer** OR timer expires
- First player to answer doesn't stop the timer for other players
- This allows all players to compete for the full time period
- Timer only stops when transitioning to the next question

### Visual Timer
- Circular countdown timer in top-right corner
- Light blue progress bar shows remaining time
- Updates in real-time as time counts down

## Visual Feedback Systems

### Swimming Trails
- **When active**: Only when player is moving (holding A or L button)
- **Appearance**: Semi-transparent colored line following the capybara
- **Colors**: Red trail for Player 1, Blue trail for Player 2
- **Length**: Shows last 15 positions with gradient fade (newer positions more opaque)
- **Width**: 4px trail width for clear visibility

### Splash Effects
- **Trigger**: When player starts moving (transitions from idle to moving)
- **Particles**: 6 water droplets in blue and white colors
- **Pattern**: 180-degree spray arc opposite to movement direction
- **Animation**: Particles fade out over 0.5 seconds with slight gravity effect
- **Size**: 3-5px circular particles

### Answer Rectangle Proximity Highlighting
- **Distance < 100px**: Gold glow appears around answer rectangle
- **Distance < 50px**: Brighter yellow glow with increased intensity
- **Animation**: Pulsing effect (scale 1.0 to 1.15) over 0.8 seconds
- **Purpose**: Helps players identify which answers they're approaching

### Score Feedback Display
- **Correct answers**: Shows "+X POINTS!" in green
- **First player bonus**: Additional "+5 FIRST!" text in gold
- **Incorrect answers**: Shows "-3 POINTS" in red
- **Timeouts**: Shows "-1 POINTS" in red
- **Duration**: Feedback displays for 1.5 seconds

## Movement Mechanics

### Controls
- **Player 1**: Hold A button to move forward
- **Player 2**: Hold L button to move forward
- **Movement**: Capybara moves in the direction it's currently facing
- **Rotation**: Continuous rotation when idle, stops when moving

### Physics
- **Speed**: Moves across screen in approximately 7 seconds at 60fps
- **Rotation Speed**: Full rotation in ~2.67 seconds (50% faster than before)
- **Boundaries**: Players stay within screen bounds, cannot go under question area
- **Collision**: 30px radius collision detection with answer rectangles

### Animation States
- **Static (idle)**: Slow bobbing animation using frames 1-2
- **Moving**: Fast swimming animation using frames 2-8
- **Transition**: Smooth animation state changes based on movement

## Game Flow

### Question Sequence
1. **Loading**: "Getting Ready..." transition screen
2. **Question Preview**: Shows question with countdown timer
3. **GO! Signal**: Timer starts, players can begin moving
4. **Answering**: Players swim to answer rectangles
5. **Feedback**: Visual feedback for each answer
6. **Transition**: Move to next question or game over

### Win Conditions
- Game ends when all questions are answered
- Player with highest total score wins
- Scores are cumulative across all questions

## Technical Implementation

### Performance Optimizations
- Trail effects use circular buffer (max 15 positions)
- Splash particles auto-cleanup when animation completes
- Proximity highlighting only updates when players are nearby
- Visual effects are properly destroyed to prevent memory leaks

### Responsive Design
- All visual effects scale with screen size
- Answer rectangles use dynamic sizing based on text length
- Trail and splash effects maintain consistent appearance across devices

## Future Enhancements

### Planned Features
- **Power-up obstacles**: Environmental elements that provide temporary abilities
- **Combo multipliers**: Bonus points for consecutive correct answers
- **Speed boost mechanics**: Temporary movement speed increases

### Potential Improvements
- **Obstacle navigation**: Rocks, lily pads, or other swimming challenges
- **Multiplayer modes**: 3+ player support
- **Customizable themes**: Different water environments and capybara skins
