import { describe, expect, it } from 'vitest'
import { NinjaActor, isTugNinjaClip } from '@/lib/three-games/tug-of-war/NinjaActor'
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

  it('builds a procedural ninja and plays clips without a WebGL renderer', () => {
    const ninja = new NinjaActor({ side: 'blue', slot: 0, restX: -3.2 })
    expect(ninja.group.name).toBe('ninja-blue-0')
    expect(ninja.currentClip).toBe('idle_hold')
    ninja.play('pull_heave')
    expect(ninja.currentClip).toBe('pull_heave')
    ninja.update(800)
    expect(ninja.currentClip).toBe('idle_hold')
    ninja.play('defeat_fall')
    ninja.update(2000)
    expect(ninja.currentClip).toBe('defeat_fall')
    ninja.dispose()
  })
})
