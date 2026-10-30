import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventBus } from '@/lib/pixi-engine/core/EventBus'
import { StorageManager } from '@/lib/pixi-engine/core/StorageManager'
import { AudioManager } from '@/lib/pixi-engine/core/AudioManager'

const { howlerGlobalStop, howlerGlobalUnload, howlInstances } = vi.hoisted(() => {
  const instances: Array<{
    playCount: number
    stopped: boolean
    unloaded: boolean
    play: () => number
    stop: () => void
    unload: () => void
    volume: () => void
    mute: () => void
    playing: () => boolean
  }> = []

  return {
    howlerGlobalStop: vi.fn(),
    howlerGlobalUnload: vi.fn(),
    howlInstances: instances,
  }
})

vi.mock('howler', () => {
  class Howl {
    playCount = 0
    stopped = false
    unloaded = false

    constructor() {
      howlInstances.push(this)
    }

    play() {
      this.playCount += 1
      this.stopped = false
      return this.playCount
    }

    stop() {
      this.stopped = true
    }

    unload() {
      this.unloaded = true
      this.stopped = true
    }

    volume() {}
    mute() {}

    playing() {
      return this.playCount > 0 && !this.stopped && !this.unloaded
    }
  }

  return {
    Howl,
    Howler: {
      volume: vi.fn(),
      mute: vi.fn(),
      stop: howlerGlobalStop,
      unload: howlerGlobalUnload,
    },
  }
})

function createManager(): AudioManager {
  return new AudioManager(new EventBus(false), new StorageManager('audio-test'))
}

describe('AudioManager destroy isolation', () => {
  beforeEach(() => {
    howlInstances.length = 0
    howlerGlobalStop.mockClear()
    howlerGlobalUnload.mockClear()
  })

  afterEach(() => {
    howlInstances.length = 0
  })

  it('stops and unloads only its own Howl instances on destroy', () => {
    const manager = createManager()
    manager.registerSound({
      id: 'background-music',
      filename: 'background-music.mp3',
      type: 'music',
      loop: true,
    })
    manager.play('background-music')

    expect(howlInstances).toHaveLength(1)
    expect(howlInstances[0].playCount).toBe(1)

    manager.destroy()

    expect(howlInstances[0].stopped).toBe(true)
    expect(howlInstances[0].unloaded).toBe(true)
    expect(howlerGlobalStop).not.toHaveBeenCalled()
    expect(howlerGlobalUnload).not.toHaveBeenCalled()
  })

  it('does not stop a surviving manager when a racing instance is destroyed', () => {
    const discarded = createManager()
    const surviving = createManager()

    discarded.registerSound({
      id: 'background-music',
      filename: 'background-music.mp3',
      type: 'music',
      loop: true,
    })
    surviving.registerSound({
      id: 'background-music',
      filename: 'background-music.mp3',
      type: 'music',
      loop: true,
    })

    discarded.play('background-music')
    surviving.play('background-music')

    expect(howlInstances).toHaveLength(2)
    discarded.destroy()

    expect(howlInstances[0].unloaded).toBe(true)
    expect(howlInstances[1].stopped).toBe(false)
    expect(howlInstances[1].unloaded).toBe(false)
    expect(howlInstances[1].playing()).toBe(true)
    expect(howlerGlobalStop).not.toHaveBeenCalled()
    expect(howlerGlobalUnload).not.toHaveBeenCalled()
  })

  it('stopAll only stops this manager’s sounds, not Howler globally', () => {
    const managerA = createManager()
    const managerB = createManager()
    managerA.registerSound({
      id: 'sfx-a',
      filename: 'correct-sound.mp3',
      type: 'sfx',
    })
    managerB.registerSound({
      id: 'sfx-b',
      filename: 'incorrect-sound.mp3',
      type: 'sfx',
    })
    managerA.play('sfx-a')
    managerB.play('sfx-b')

    managerA.stopAll()

    expect(howlInstances[0].stopped).toBe(true)
    expect(howlInstances[1].stopped).toBe(false)
    expect(howlerGlobalStop).not.toHaveBeenCalled()
  })
})
