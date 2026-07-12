/**
 * Frame timing / FPS / fixed-timestep accumulation for BaseGame.
 */
export interface FrameTiming {
  deltaTime: number
  scaledDeltaTime: number
  timeScale: number
  elapsedTime: number
  fixedTimeAccumulator: number
}

export interface FrameClockConfig {
  maxFPS?: number
  targetFPS?: number
  fixedUpdateFPS?: number
  maxFixedUpdatesPerFrame?: number
}

export class GameFrameClock {
  private frameCount = 0
  private fpsUpdateTime = 0
  private currentFPS = 0
  private gameSpeed = 1.0
  private previousGameSpeed = 1.0
  private elapsedTime = 0
  private frameTimeAccumulator = 0

  getCurrentFPS(): number {
    return this.currentFPS
  }

  getGameSpeed(): number {
    return this.gameSpeed
  }

  getPreviousGameSpeed(): number {
    return this.previousGameSpeed
  }

  getFrameTimeAccumulator(): number {
    return this.frameTimeAccumulator
  }

  setGameSpeed(speed: number): void {
    this.previousGameSpeed = this.gameSpeed
    this.gameSpeed = Math.max(0.1, Math.min(speed, 10.0))
  }

  /**
   * Process frame timing. When paused, advances FPS tracking only.
   */
  processFrame(
    deltaMs: number,
    isPaused: boolean,
    config: FrameClockConfig,
    onFpsUpdated?: (fps: number, targetFPS: number) => void
  ): FrameTiming {
    const deltaTimeSec = deltaMs / 1000

    if (isPaused) {
      this.fpsUpdateTime += deltaTimeSec
      this.frameCount++
      if (this.fpsUpdateTime >= 1.0) {
        this.currentFPS = this.frameCount / this.fpsUpdateTime
        this.frameCount = 0
        this.fpsUpdateTime = 0
        onFpsUpdated?.(this.currentFPS, config.targetFPS || 60)
      }
      return {
        deltaTime: 0,
        scaledDeltaTime: 0,
        timeScale: this.gameSpeed,
        elapsedTime: this.elapsedTime,
        fixedTimeAccumulator: this.frameTimeAccumulator,
      }
    }

    let finalDeltaTime = deltaTimeSec
    const maxFPS = config.maxFPS || 0
    if (maxFPS > 0) {
      finalDeltaTime = Math.min(finalDeltaTime, 1 / maxFPS)
    }

    this.fpsUpdateTime += finalDeltaTime
    this.frameCount++

    if (this.fpsUpdateTime >= 1.0) {
      this.currentFPS = this.frameCount / this.fpsUpdateTime
      this.frameCount = 0
      this.fpsUpdateTime = 0
      onFpsUpdated?.(this.currentFPS, config.targetFPS || 60)
    }

    const timeScale = this.gameSpeed
    const scaledDelta = finalDeltaTime * timeScale
    this.frameTimeAccumulator += scaledDelta
    this.elapsedTime += finalDeltaTime

    return {
      deltaTime: finalDeltaTime,
      scaledDeltaTime: scaledDelta,
      timeScale,
      elapsedTime: this.elapsedTime,
      fixedTimeAccumulator: this.frameTimeAccumulator,
    }
  }

  /**
   * Runs fixedUpdate callbacks until the accumulator is drained (or max reached).
   */
  runFixedUpdates(
    timing: FrameTiming,
    isPaused: boolean,
    config: FrameClockConfig,
    fixedUpdate: (deltaTime: number) => void,
    onBefore?: (deltaTime: number) => void,
    onAfter?: (deltaTime: number) => void
  ): void {
    if (isPaused || timing.deltaTime === 0) return

    const fixedUpdateFPS = config.fixedUpdateFPS || 60
    const fixedDeltaTime = 1 / fixedUpdateFPS
    let updatesPerformed = 0
    const maxUpdatesPerFrame = config.maxFixedUpdatesPerFrame || 5

    while (
      this.frameTimeAccumulator >= fixedDeltaTime &&
      updatesPerformed < maxUpdatesPerFrame
    ) {
      onBefore?.(fixedDeltaTime)
      fixedUpdate(fixedDeltaTime)
      onAfter?.(fixedDeltaTime)
      this.frameTimeAccumulator -= fixedDeltaTime
      updatesPerformed++
    }

    if (updatesPerformed >= maxUpdatesPerFrame) {
      console.warn(
        `[GameFrameClock] Maximum fixed updates per frame reached (${maxUpdatesPerFrame}). Game might be running too slowly.`
      )
    }
  }
}
