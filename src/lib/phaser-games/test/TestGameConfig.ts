import { GameConfig } from '../../phaser-engine/config/GameConfig';

/**
 * Test game configuration for verifying the Phaser engine foundation.
 */
export const TEST_GAME_CONFIG: GameConfig = {
  gameMode: {
    name: 'Test Game',
    type: 'score',
    description: 'A simple test game to verify the Phaser engine foundation',
    maxScore: 100,
    timeLimit: 30,
    lives: 1
  },
  teams: [
    {
      id: 'player1',
      name: 'Test Player',
      color: '#FF6B6B',
      isAI: false
    }
  ],
  themeId: 'default',
  controls: {
    actionMap: {
      'UP': { keyboard: 'ArrowUp' },
      'DOWN': { keyboard: 'ArrowDown' },
      'LEFT': { keyboard: 'ArrowLeft' },
      'RIGHT': { keyboard: 'ArrowRight' },
      'ACTION_A': { keyboard: 'Space' },
      'ACTION_B': { keyboard: 'Enter' }
    },
    playerMappings: {
      'player1': ['UP', 'DOWN', 'LEFT', 'RIGHT', 'ACTION_A', 'ACTION_B']
    }
  },
  powerups: {
    powerupsEnabled: true,
    availablePowerups: [
      {
        id: 'double_points',
        name: 'Double Points',
        description: 'Double your score for the next answer',
        durationSeconds: 30,
        icon: 'double-points.png'
      },
      {
        id: 'time_extension',
        name: 'Time Extension',
        description: 'Add 10 seconds to the timer',
        durationSeconds: undefined,
        icon: 'time-extension.png'
      },
      {
        id: 'fifty_fifty',
        name: '50/50',
        description: 'Remove two wrong answers',
        durationSeconds: undefined,
        icon: 'fifty-fifty.png'
      }
    ]
  },
  assets: {
    basePath: '/assets/',
    manifestUrl: 'assets/asset-manifest.json',
    bundles: [
      {
        name: 'common',
        assets: [
          { alias: 'test-background', src: 'images/test/background.png' },
          { alias: 'test-button', src: 'images/test/button.png' }
        ]
      }
    ]
  },
  initialMusicMuted: false,
  initialSfxMuted: false,
  settings: {
    globalVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8
  }
};
