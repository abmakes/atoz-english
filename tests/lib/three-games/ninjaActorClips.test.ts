import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import {
  NinjaActor,
  isTugNinjaClip,
  type TugNinjaTextures,
} from '@/lib/three-games/tug-of-war/NinjaActor'
import { TUG_NINJA_CLIPS } from '@/lib/three-games/tug-of-war/tugOfWarLogic'

function stubTextures(): TugNinjaTextures {
  return {
    pull: new THREE.Texture(),
    cheer: new THREE.Texture(),
    fallen: new THREE.Texture(),
  }
}

function sprite(ninja: NinjaActor) {
  return ninja.group.getObjectByName('ninja-sprite') as THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshBasicMaterial
  >
}

/** Horizontal offset of the sprite's top-left corner from its bottom-left. */
function topShear(ninja: NinjaActor): number {
  const position = sprite(ninja).geometry.attributes.position
  return position.getX(0) - position.getX(2)
}

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

  it('returns one-shot clips to idle and holds defeat_fall on the fallen pose', () => {
    const textures = stubTextures()
    const ninja = new NinjaActor({ side: 'blue', slot: 0, restX: -3.3, textures })
    expect(ninja.group.name).toBe('ninja-blue-0')
    expect(ninja.currentClip).toBe('idle_hold')
    expect(sprite(ninja).material.map).toBe(textures.pull)

    ninja.play('pull_heave')
    expect(ninja.currentClip).toBe('pull_heave')
    ninja.update(800)
    expect(ninja.currentClip).toBe('idle_hold')

    ninja.play('defeat_fall')
    ninja.update(2000)
    expect(ninja.currentClip).toBe('defeat_fall')
    expect(ninja.currentPose).toBe('fallen')
    expect(sprite(ninja).material.map).toBe(textures.fallen)
    ninja.dispose()
  })

  it('swaps to the cheer pose and hops during victory_cheer', () => {
    const textures = stubTextures()
    const ninja = new NinjaActor({ side: 'red', slot: 1, restX: 4.75, textures })
    ninja.play('victory_cheer')
    ninja.update(1100 * 0.35)
    expect(ninja.currentPose).toBe('cheer')
    expect(sprite(ninja).material.map).toBe(textures.cheer)
    expect(sprite(ninja).position.y).toBeGreaterThan(0.3)
  })

  it('leans each team away from the rope centre until it stumbles', () => {
    const blue = new NinjaActor({ side: 'blue', slot: 0, restX: -3.3, textures: stubTextures() })
    const red = new NinjaActor({ side: 'red', slot: 0, restX: 3.3, textures: stubTextures() })
    expect(topShear(blue)).toBeLessThan(0)
    expect(topShear(red)).toBeGreaterThan(0)

    blue.play('stumble_slip')
    blue.update(900 * 0.3)
    expect(topShear(blue)).toBeGreaterThan(0)
  })

  it('keeps the feet on the baseline when the layout changes', () => {
    const ninja = new NinjaActor({
      side: 'blue',
      slot: 2,
      restX: -6.2,
      baselineY: 1.81,
      textures: stubTextures(),
    })
    ninja.setLayout({ restX: -4.5, spriteScale: 0.72, baselineY: 1.81 })
    ninja.setWorldX(-4)
    expect(ninja.restX).toBe(-4.5)
    expect(ninja.group.position.x).toBe(-4)
    expect(ninja.group.position.y).toBeCloseTo(1.81)
  })
})
