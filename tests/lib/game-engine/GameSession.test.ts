import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_GAME_CONFIG } from '@/lib/pixi-engine/config/GameConfig'
import { GAME_EVENTS } from '@/lib/pixi-engine/core/EventTypes'
import type { GameConfig } from '@/lib/pixi-engine/config/GameConfig'

vi.mock('howler', () => ({
  Howl: class {
    play() {
      return 1
    }
    stop() {}
    unload() {}
    volume() {}
    mute() {}
  },
  Howler: {
    volume: () => 1,
    mute: () => undefined,
    stop: () => undefined,
    unload: () => undefined,
  },
}))

function createTestConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    ...DEFAULT_GAME_CONFIG,
    quizId: 'quiz-1',
    gameSlug: 'quiz-room-3d',
    teams: [{ id: 'team-a', name: 'Alpha', startingResources: { score: 0 } }],
    gameMode: { type: 'score', name: 'Team Quiz' },
    rules: {
      rules: [
        {
          id: 'score-correct-answer',
          triggerEvent: GAME_EVENTS.ANSWER_SELECTED,
          conditions: [
            {
              type: 'compareState',
              property: 'isCorrect',
              operator: 'eq',
              value: true,
            },
          ],
          actions: [
            {
              type: 'modifyScore',
              params: {
                target: 'payload.teamId',
                mode: 'fixed',
                points: 10,
              },
            },
          ],
        },
      ],
    },
    ...overrides,
  }
}

describe('GameSession', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exposes services only after init and applies RuleEngine scoring', async () => {
    const { GameSession } = await import('@/lib/game-engine/core/GameSession')
    const session = new GameSession()
    expect(() => session.getServices()).toThrow(/unavailable before init/)

    session.init(createTestConfig())
    const services = session.getServices()
    expect(services.ruleEngine).toBeDefined()
    expect(services.scoringManager.getScore('team-a')).toBe(0)

    services.eventBus.emit(GAME_EVENTS.ANSWER_SELECTED, {
      questionId: 'q1',
      selectedOptionId: 'q1-answer-0',
      isCorrect: true,
      teamId: 'team-a',
      remainingTimeMs: 5000,
      scoreMultiplier: 1,
    })
    expect(services.scoringManager.getScore('team-a')).toBe(10)
  })

  it('rejects double init and is idempotent on destroy', async () => {
    const { GameSession } = await import('@/lib/game-engine/core/GameSession')
    const session = new GameSession()
    const config = createTestConfig()
    session.init(config)
    expect(() => session.init(config)).toThrow(/already initialized/)

    session.destroy()
    session.destroy()
    expect(() => session.getServices()).toThrow(/unavailable before init/)
    expect(() => session.init(config)).toThrow(/cannot be initialized after destroy/)
  })

  it('does not award points after destroy', async () => {
    const { GameSession } = await import('@/lib/game-engine/core/GameSession')
    const session = new GameSession()
    session.init(createTestConfig())
    const eventBus = session.eventBus
    session.destroy()

    eventBus.emit(GAME_EVENTS.ANSWER_SELECTED, {
      questionId: 'q1',
      selectedOptionId: 'q1-answer-0',
      isCorrect: true,
      teamId: 'team-a',
      remainingTimeMs: 5000,
      scoreMultiplier: 1,
    })
    expect(() => session.getServices()).toThrow()
  })
})
