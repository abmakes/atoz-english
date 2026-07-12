import type { EventBus } from '../core/EventBus'
import type { EngineEvents } from '../core/EventTypes'

type TrackedListener = {
  eventName: keyof EngineEvents
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listener: (...args: any[]) => void
  once?: boolean
}

/**
 * Tracks EventBus subscriptions so games can clean them up on destroy.
 */
export class GameEventRegistry {
  private listeners: TrackedListener[] = []

  constructor(private readonly eventBus: EventBus) {}

  on<K extends keyof EngineEvents>(eventName: K, listener: EngineEvents[K]): void {
    this.listeners.push({ eventName, listener })
    this.eventBus.on(eventName, listener)
  }

  once<K extends keyof EngineEvents>(eventName: K, listener: EngineEvents[K]): void {
    this.listeners.push({ eventName, listener, once: true })
    this.eventBus.once(eventName, listener)
  }

  off<K extends keyof EngineEvents>(eventName: K, listener: EngineEvents[K]): void {
    this.listeners = this.listeners.filter(
      (entry) => !(entry.eventName === eventName && entry.listener === listener)
    )
    this.eventBus.off(eventName, listener)
  }

  offAll(extraCleanup?: () => void): void {
    this.listeners.forEach((entry) => {
      this.eventBus.off(entry.eventName, entry.listener as EngineEvents[typeof entry.eventName])
    })
    this.listeners = []
    extraCleanup?.()
  }

  emit<K extends keyof EngineEvents>(
    eventName: K,
    ...args: Parameters<EngineEvents[K]>
  ): boolean {
    return this.eventBus.emit(eventName, ...args)
  }

  waitFor<K extends keyof EngineEvents>(
    eventName: K,
    timeout?: number
  ): Promise<Parameters<EngineEvents[K]>[0]> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listener: EngineEvents[K] = ((...args: any[]) => {
        resolve(args[0])
      }) as EngineEvents[K]

      this.eventBus.once(eventName, listener)

      if (timeout) {
        const timeoutId = setTimeout(() => {
          this.eventBus.off(eventName, listener)
          reject(new Error(`Timeout waiting for event ${String(eventName)}`))
        }, timeout)

        this.eventBus.once(eventName, (() => clearTimeout(timeoutId)) as EngineEvents[K])
      }
    })
  }

  createDebouncedEmitter<K extends keyof EngineEvents>(
    eventName: K,
    delay: number
  ): (...args: Parameters<EngineEvents[K]>) => void {
    let lastEmit = 0
    let timeoutId: number | null = null
    let pendingArgs: Parameters<EngineEvents[K]> | null = null

    return (...args: Parameters<EngineEvents[K]>) => {
      const now = Date.now()

      if (now - lastEmit > delay) {
        lastEmit = now
        this.emit(eventName, ...args)
        return
      }

      pendingArgs = args

      if (!timeoutId) {
        timeoutId = window.setTimeout(() => {
          if (pendingArgs) {
            this.emit(eventName, ...pendingArgs)
            lastEmit = Date.now()
            pendingArgs = null
          }
          timeoutId = null
        }, delay - (now - lastEmit))
      }
    }
  }
}
