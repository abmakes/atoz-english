import {
  GameModeRegistry,
  type GameModeDefinition,
} from '@/lib/game-engine/modes/GameModeRegistry'
import {
  getQuizRoom3dBlockReason,
  getSplashDashBlockReason,
  isQuizRoom3dEligible,
  isSplashDashEligible,
} from '@/lib/game-mode-eligibility'

const multipleChoice: GameModeDefinition = {
  slug: 'multiple-choice',
  title: 'Team Quiz',
  description: 'Turn-based classroom play with timers, teams, and power-ups.',
  thumbnail: '/images/marketing/teamquiz_thumb.png',
  renderer: 'pixi',
  questionTimerId: 'multipleChoiceQuestionTimer',
  isEligible: () => true,
  getBlockReason: () => null,
  buildControls: (defaults) => ({
    actionMap: {
      UP: { keyboard: 'ArrowUp' },
      DOWN: { keyboard: 'ArrowDown' },
      LEFT: { keyboard: 'ArrowLeft' },
      RIGHT: { keyboard: 'ArrowRight' },
      ACTION_A: { keyboard: 'Space' },
      ACTION_B: { keyboard: 'Enter' },
    },
    playerMappings: [{ playerId: 'player1', deviceType: 'keyboard' }],
    gamepadDeadzone: defaults.gamepadDeadzone,
  }),
  buildAssets: (defaults) => defaults,
  loadRuntime: async () => {
    const [{ PixiRuntimeAdapter }, { MultipleChoiceGame }] = await Promise.all([
      import('@/lib/pixi-engine/runtime/PixiRuntimeAdapter'),
      import('@/lib/pixi-games/multiple-choice/MultipleChoiceGame'),
    ])
    return new PixiRuntimeAdapter(
      (config, managers) => new MultipleChoiceGame(config, managers)
    )
  },
}

const splashDash: GameModeDefinition = {
  slug: 'splash-dash',
  title: 'Splash Dash',
  description: 'Two-player race — swim to the right crate first.',
  thumbnail: '/images/marketing/splashdash_thumb.png',
  renderer: 'pixi',
  questionTimerId: 'multipleChoiceQuestionTimer',
  isEligible: isSplashDashEligible,
  getBlockReason: getSplashDashBlockReason,
  buildControls: (defaults) => ({
    actionMap: {
      MOVE_PLAYER1: { keyboard: 'KeyA', touchArea: 'button-player1' },
      MOVE_PLAYER2: { keyboard: 'KeyL', touchArea: 'button-player2' },
    },
    playerMappings: [
      { playerId: 'player1', deviceType: 'keyboard' },
      { playerId: 'player2', deviceType: 'keyboard' },
    ],
    gamepadDeadzone: defaults.gamepadDeadzone,
  }),
  buildAssets: () => ({
    bundles: [
      {
        name: 'splash-dash',
        assets: [
          { key: 'crate_5_4', src: '/images/splash-dash/crate_5_4.png' },
          { key: 'crate_square', src: '/images/splash-dash/crate_square.png' },
        ],
      },
    ],
  }),
  loadRuntime: async () => {
    const [{ PixiRuntimeAdapter }, { SplashDashGame }] = await Promise.all([
      import('@/lib/pixi-engine/runtime/PixiRuntimeAdapter'),
      import('@/lib/pixi-games/splash-dash/SplashDashGame'),
    ])
    return new PixiRuntimeAdapter(
      (config, managers) => new SplashDashGame(config, managers)
    )
  },
}

const quizRoom3d: GameModeDefinition = {
  slug: 'quiz-room-3d',
  title: '3D Quiz Room',
  description: 'Experimental 3D room — choose the correct answer pedestal.',
  thumbnail: '/images/marketing/teamquiz_thumb.png',
  renderer: 'three',
  questionTimerId: 'quizRoom3dQuestionTimer',
  isEligible: isQuizRoom3dEligible,
  getBlockReason: getQuizRoom3dBlockReason,
  buildControls: (defaults) => ({
    actionMap: {
      ACTION_A: { keyboard: 'Space' },
      ACTION_B: { keyboard: 'Enter' },
    },
    playerMappings: [{ playerId: 'player1', deviceType: 'auto' }],
    gamepadDeadzone: defaults.gamepadDeadzone,
  }),
  buildAssets: (defaults) => defaults,
  loadRuntime: async () => {
    const [{ ThreeRuntime }, { QuizRoom3DGame }] = await Promise.all([
      import('@/lib/three-engine/ThreeRuntime'),
      import('@/lib/three-games/quiz-room/QuizRoom3DGame'),
    ])
    return new ThreeRuntime((context) => new QuizRoom3DGame(context))
  },
}

export const gameModeRegistry = new GameModeRegistry()
  .register(multipleChoice)
  .register(splashDash)
  .register(quizRoom3d)
