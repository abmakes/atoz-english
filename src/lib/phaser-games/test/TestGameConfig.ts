import { GameConfig } from '../../phaser-engine/config/GameConfig';

/**
 * Test game configuration for verifying the Phaser engine foundation.
 */
export const TEST_GAME_CONFIG: GameConfig = {
  // Quiz configuration
  quizId: 'test-quiz',
  gameSlug: 'test-game',
  intensityTimeLimit: 30, // 30 seconds
  
  // Teams configuration
  teams: [
    {
      id: 'player1',
      name: 'Test Player',
      color: '#FF6B6B'
    }
  ],
  
  // Game mode configuration
  gameMode: {
    type: 'score' as const,
    name: 'Test Game',
    targetScore: 100
  },
  
  // Question handling configuration
  questionHandling: {
    distributionMode: 'sharedPool' as const,
    randomizeOrder: true,
    truncateForFairness: true
  },
  
  // Controls configuration
  controls: {
    actionMap: {
      'UP': { keyboard: 'ArrowUp' },
      'DOWN': { keyboard: 'ArrowDown' },
      'LEFT': { keyboard: 'ArrowLeft' },
      'RIGHT': { keyboard: 'ArrowRight' },
      'ACTION_A': { keyboard: 'Space' },
      'ACTION_B': { keyboard: 'Enter' }
    },
    playerMappings: [
      { playerId: 'player1', deviceType: 'auto' }
    ]
  },
  
  // Assets configuration
  assets: {
    bundles: [
      {
        name: 'common',
        assets: [
          { key: 'test-background', src: '/images/test/background.png' },
          { key: 'test-button', src: '/images/test/button.png' }
        ]
      }
    ]
  },
  
  // Audio configuration
  audio: {
    basePath: '/sounds/',
    defaultVolume: 0.7,
    startMuted: false,
    sounds: [
      { id: 'test-sound', filename: 'test.mp3', type: 'sfx' }
    ]
  },
  
  // Power-ups configuration
  powerups: {
    powerupsEnabled: true,
    availablePowerups: [
      {
        id: 'double_points',
        name: 'Double Points',
        description: 'Double your score for the next answer',
        effectType: 'persistent',
        durationSeconds: 30,
        effectParams: { multiplier: 2 }
      },
      {
        id: 'time_extension',
        name: 'Time Extension',
        description: 'Add 10 seconds to the timer',
        effectType: 'instant',
        effectParams: { amount: 10 }
      },
      {
        id: 'fifty_fifty',
        name: '50/50',
        description: 'Remove two wrong answers',
        effectType: 'instant',
        effectParams: { removeCount: 2 }
      }
    ]
  },
  
  // Rules configuration
  rules: {
    rules: [
      {
        id: 'test_rule',
        description: 'Test Rule',
        triggerEvent: 'test:incrementScore',
        conditions: [],
        actions: [
          { type: 'modifyScore', params: { target: 'active_team', value: 5 } }
        ]
      }
    ]
  },
  
  // Optional settings
  initialMusicMuted: false,
  initialSfxMuted: false,
  theme: 'default'
};
