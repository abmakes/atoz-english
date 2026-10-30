import {
  GameModeRegistry,
  type GameModeDefinition,
} from '@/lib/game-engine/modes/GameModeRegistry'
import {
  getNinjaClimbBlockReason,
  getQuizRoom3dBlockReason,
  getSplashDashBlockReason,
  getTugOfWar3dBlockReason,
  isNinjaClimbEligible,
  isQuizRoom3dEligible,
  isSplashDashEligible,
  isTugOfWar3dEligible,
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

const ninjaClimb: GameModeDefinition = {
  slug: 'ninja-climb',
  title: 'Ninja Climb',
  description: 'Two-team mountain race — answer to climb, use ninja powers.',
  thumbnail: '/images/marketing/ninjaclimb_thumb.png',
  renderer: 'pixi',
  questionTimerId: 'multipleChoiceQuestionTimer',
  isEligible: isNinjaClimbEligible,
  getBlockReason: getNinjaClimbBlockReason,
  buildControls: (defaults) => ({
    actionMap: {
      ANSWER_1: { keyboard: 'Digit1' },
      ANSWER_2: { keyboard: 'Digit2' },
      ANSWER_3: { keyboard: 'Digit3' },
      ANSWER_4: { keyboard: 'Digit4' },
      POWERUP_TELEPORT: { keyboard: 'KeyZ' },
      POWERUP_ROPE: { keyboard: 'KeyX' },
      POWERUP_SMOKE: { keyboard: 'KeyC' },
    },
    playerMappings: [{ playerId: 'player1', deviceType: 'keyboard' }],
    gamepadDeadzone: defaults.gamepadDeadzone,
  }),
  buildAssets: () => ({
    bundles: [
      {
        name: 'ninja-climb',
        assets: [
          { key: 'ninja_blue_idle', src: '/images/ninja-climb/ninja_blue_idle.webp' },
          { key: 'ninja_red_idle', src: '/images/ninja-climb/ninja_red_idle.webp' },
          { key: 'ninja_blue_climb', src: '/images/ninja-climb/ninja_blue_climb.png' },
          { key: 'ninja_red_climb', src: '/images/ninja-climb/ninja_red_climb.png' },
          { key: 'sky', src: '/images/ninja-climb/sky.webp' },
          { key: 'icon_teleport', src: '/images/ninja-climb/icon_teleport.png' },
          { key: 'icon_rope', src: '/images/ninja-climb/icon_rope.png' },
          { key: 'icon_smoke', src: '/images/ninja-climb/icon_smoke.png' },
        ],
      },
    ],
  }),
  loadRuntime: async () => {
    const [{ PixiRuntimeAdapter }, { NinjaClimbGame }] = await Promise.all([
      import('@/lib/pixi-engine/runtime/PixiRuntimeAdapter'),
      import('@/lib/pixi-games/ninja-climb/NinjaClimbGame'),
    ])
    return new PixiRuntimeAdapter(
      (config, managers) => new NinjaClimbGame(config, managers)
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

const tugOfWar3d: GameModeDefinition = {
  slug: 'tug-of-war-3d',
  title: 'Tug of War',
  description: 'Two teams take turns answering — first to 3 round points wins.',
  thumbnail: '/images/marketing/teamquiz_thumb.png',
  renderer: 'three',
  questionTimerId: 'tugOfWarQuestionTimer',
  hud: {
    questionPanel: true,
    timer: true,
    tugMeter: true,
    roundDots: true,
    splitTeamScores: true,
  },
  isEligible: isTugOfWar3dEligible,
  getBlockReason: getTugOfWar3dBlockReason,
  buildControls: (defaults) => ({
    actionMap: {
      ACTION_A: { keyboard: 'Digit1' },
      ACTION_B: { keyboard: 'Digit2' },
    },
    playerMappings: [{ playerId: 'player1', deviceType: 'auto' }],
    gamepadDeadzone: defaults.gamepadDeadzone,
  }),
  buildAssets: (defaults) => defaults,
  loadRuntime: async () => {
    const [{ ThreeRuntime }, { TugOfWar3DGame }] = await Promise.all([
      import('@/lib/three-engine/ThreeRuntime'),
      import('@/lib/three-games/tug-of-war/TugOfWar3DGame'),
    ])
    return new ThreeRuntime((context) => new TugOfWar3DGame(context))
  },
}

export const gameModeRegistry = new GameModeRegistry()
  .register(multipleChoice)
  .register(splashDash)
  .register(ninjaClimb)
  .register(tugOfWar3d)
  .register(quizRoom3d)
