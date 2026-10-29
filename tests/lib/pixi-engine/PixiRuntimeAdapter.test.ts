import { describe, expect, it } from 'vitest'
import { PixiRuntimeAdapter } from '@/lib/pixi-engine/runtime/PixiRuntimeAdapter'

describe('PixiRuntimeAdapter', () => {
  it('keeps the Pixi renderer kind and refuses services before init', () => {
    const adapter = new PixiRuntimeAdapter(() => {
      throw new Error('factory should not run until init')
    })
    expect(adapter.rendererKind).toBe('pixi')
    expect(() => adapter.getServices()).toThrow(/unavailable before init/)
  })
})
