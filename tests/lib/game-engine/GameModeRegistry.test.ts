import { describe, expect, it } from 'vitest'
import { GameModeRegistry } from '@/lib/game-engine/modes/GameModeRegistry'
import { gameModeRegistry } from '@/lib/game-engine/modes/builtinGameModes'
import type { GameModeDefinition } from '@/lib/game-engine/modes/GameModeRegistry'

function stubMode(slug: GameModeDefinition['slug']): GameModeDefinition {
  return {
    slug,
    title: slug,
    description: '',
    thumbnail: '',
    renderer: 'pixi',
    questionTimerId: 'timer',
    isEligible: () => true,
    getBlockReason: () => null,
    buildControls: (defaults) => defaults,
    buildAssets: (defaults) => defaults,
    loadRuntime: async () => {
      throw new Error('not used')
    },
  }
}

describe('GameModeRegistry', () => {
  it('lists builtin Pixi and Three modes', () => {
    expect(gameModeRegistry.require('multiple-choice').renderer).toBe('pixi')
    expect(gameModeRegistry.require('splash-dash').renderer).toBe('pixi')
    expect(gameModeRegistry.require('quiz-room-3d').renderer).toBe('three')
    expect(gameModeRegistry.require('multiple-choice').loadRuntime).toEqual(
      expect.any(Function)
    )
  })

  it('throws for unknown slugs instead of falling through', () => {
    expect(gameModeRegistry.get('not-a-game')).toBeUndefined()
    expect(() => gameModeRegistry.require('not-a-game')).toThrow(
      /Unknown game mode 'not-a-game'/
    )
  })

  it('rejects duplicate registration', () => {
    const registry = new GameModeRegistry().register(stubMode('multiple-choice'))
    expect(() => registry.register(stubMode('multiple-choice'))).toThrow(
      /already registered/
    )
  })
})
