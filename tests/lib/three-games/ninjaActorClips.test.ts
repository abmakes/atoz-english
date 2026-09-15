import { describe, expect, it } from 'vitest'
import { isTugNinjaClip } from '@/lib/three-games/tug-of-war/NinjaActor'
import { TUG_NINJA_CLIPS } from '@/lib/three-games/tug-of-war/tugOfWarLogic'

describe('NinjaActor clip contract', () => {
  it('exposes the seven named clips required by the asset spec', () => {
    expect(TUG_NINJA_CLIPS).toEqual([
      'idle_hold',
      'pull_heave',
      'strain_lose',
      'stumble_slip',
      'victory_cheer',
      'defeat_fall',
      'charge_up',
    ])
    for (const clip of TUG_NINJA_CLIPS) {
      expect(isTugNinjaClip(clip)).toBe(true)
    }
    expect(isTugNinjaClip('walk')).toBe(false)
  })
})
