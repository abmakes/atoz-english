import EventEmitter from 'eventemitter3';
import { EngineEvents, TIMER_EVENTS } from './EventTypes';

/**
 * EventBus provides a central hub for event-driven communication
 * throughout the Phaser engine and related components.
 * It wraps EventEmitter3 and uses a defined type map for type safety.
 */
export class EventBus {
  private emitter: EventEmitter;
  private isDebugMode: boolean;

  /**
   * Creates an instance of EventBus.
   * @param debug - Optional flag to enable debug logging for events.
   */
  constructor(debug: boolean = process.env.NODE_ENV === 'development') {
    this.emitter = new EventEmitter();
    this.isDebugMode = debug;
    if (this.isDebugMode) {
      console.log('[PhaserEventBus] Debug mode enabled.');
    }
  }

  /**
   * Register an event listener with type safety.
   * @param eventName - The name of the event (must be a key in EngineEvents).
   * @param listener - The callback function, typed according to the event.
   * @returns The EventBus instance for chaining.
   */
  public on<K extends keyof EngineEvents>(eventName: K, listener: EngineEvents[K]): this {
    this.emitter.on(eventName, listener);
    return this;
  }

  /**
   * Remove an event listener with type safety.
   * @param eventName - The name of the event.
   * @param listener - The callback function to remove.
   * @returns The EventBus instance for chaining.
   */
  public off<K extends keyof EngineEvents>(eventName: K, listener?: EngineEvents[K]): this {
    this.emitter.off(eventName, listener);
    return this;
  }

  /**
   * Trigger an event with type safety for arguments.
   * Optionally logs the event in debug mode.
   * @param eventName - The name of the event.
   * @param args - Arguments matching the event's payload definition in EngineEvents.
   * @returns True if the event had listeners, false otherwise.
   */
  public emit<K extends keyof EngineEvents>(eventName: K, ...args: Parameters<EngineEvents[K]>): boolean {
    if (this.isDebugMode) {
      this.logEvent(eventName, args);
    }
    return this.emitter.emit(eventName, ...args);
  }

  /**
   * Register a one-time event listener with type safety.
   * @param eventName - The name of the event.
   * @param listener - The callback function.
   * @returns The EventBus instance for chaining.
   */
  public once<K extends keyof EngineEvents>(eventName: K, listener: EngineEvents[K]): this {
    this.emitter.once(eventName, listener);
    return this;
  }

  /**
   * Logs event details to the console if debug mode is enabled.
   * Filters out high-frequency events like timer:tick.
   * @param eventName - The name of the event.
   * @param args - The arguments passed with the event.
   */
  private logEvent<K extends keyof EngineEvents>(eventName: K, args: Parameters<EngineEvents[K]>): void {
    if (eventName === TIMER_EVENTS.TIMER_TICK) {
        return;
    }
    console.log(`[PhaserEventBus] Event Emitted: ${String(eventName)}`, args.length > 0 ? args : '(No Payload)');
  }

  /**
   * Remove all listeners for a specific event.
   * @param eventName - The name of the event.
   * @returns The EventBus instance for chaining.
   */
  public removeAllListeners<K extends keyof EngineEvents>(eventName?: K): this {
    this.emitter.removeAllListeners(eventName);
    return this;
  }

  /**
   * Get the number of listeners for a specific event.
   * @param eventName - The name of the event.
   * @returns The number of listeners.
   */
  public listenerCount<K extends keyof EngineEvents>(eventName: K): number {
    return this.emitter.listenerCount(eventName);
  }

  /**
   * Get all event names that have listeners.
   * @returns Array of event names.
   */
  public eventNames(): (string | symbol)[] {
    return this.emitter.eventNames();
  }

  /**
   * Destroy the EventBus and clean up all listeners.
   */
  public destroy(): void {
    this.emitter.removeAllListeners();
    console.log('[PhaserEventBus] Destroyed and all listeners removed.');
  }
}