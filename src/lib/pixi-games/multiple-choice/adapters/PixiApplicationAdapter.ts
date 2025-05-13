import * as PIXI from 'pixi.js';
import { Container } from 'pixi.js';

/**
 * PixiApplicationAdapter - An adapter that mimics the interface of the deprecated PixiApplication class
 * but actually uses a PIXI.Application instance under the hood. This helps with the refactor to @pixi/react
 * by allowing existing code to keep working while we transition.
 * 
 * This adapter implements the same interface as PixiApplication but delegates to a PIXI.Application.
 * During the transition to @pixi/react, this allows existing code to work with the PIXI.Application
 * instance provided by @pixi/react's useApplication hook.
 */
export class PixiApplicationAdapter {
  // Properties to match PixiApplication interface that are accessed
  public targetElement: HTMLElement | null = null;
  public parent: HTMLElement | null = null;
  public mainStage: PIXI.Container;
  public debugContainer: PIXI.Container;
  public initialized = true; // Always true since we're wrapping an initialized app
  
  /**
   * Constructor for the adapter
   * @param app The PIXI.Application instance to wrap
   */
  constructor(private readonly app: PIXI.Application) {
    console.log("[PixiApplicationAdapter] Created with PIXI.Application:", app);
    // Initialize required properties
    this.mainStage = app.stage;
    this.debugContainer = new PIXI.Container(); // Create an empty debug container
    app.stage.addChild(this.debugContainer);
  }

  /**
   * Get the screen size
   * @returns The screen size object with width and height
   */
  public getScreenSize(): { width: number; height: number } {
    return {
      width: this.app.renderer.width,
      height: this.app.renderer.height
    };
  }

  /**
   * Get the canvas element
   * @returns The canvas element
   */
  public getView(): HTMLCanvasElement | undefined {
    return this.app.canvas;
  }

  /**
   * Get the canvas element (alias for getView)
   * @returns The canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  /**
   * Get the stage container
   * @returns The main stage container
   */
  public getStage(): Container {
    return this.app.stage;
  }

  /**
   * Get the PixiJS Application instance
   * @returns The PixiJS Application instance
   */
  public getApp(): PIXI.Application {
    return this.app;
  }

  /**
   * Add a container to the stage
   * @param container The container to add
   */
  public addChild(container: Container): void {
    this.app.stage.addChild(container);
  }

  /**
   * Remove a container from the stage
   * @param container The container to remove
   */
  public removeChild(container: Container): void {
    this.app.stage.removeChild(container);
  }

  /**
   * Get the ticker
   * @returns The ticker
   */
  public getTicker(): PIXI.Ticker | undefined {
    return this.app.ticker;
  }

  /**
   * Start the application ticker 
   * (No-op in adapter as this is managed by @pixi/react)
   */
  public start(): void {
    console.log("[PixiApplicationAdapter] start() called - app ticker is managed by @pixi/react");
    // No-op - ticker is managed by @pixi/react
  }

  /**
   * Stop the application ticker 
   * (No-op in adapter as this is managed by @pixi/react)
   */
  public stop(): void {
    console.log("[PixiApplicationAdapter] stop() called - app ticker is managed by @pixi/react");
    // No-op - ticker is managed by @pixi/react
  }

  /**
   * Register a callback for resize events
   * (No-op in adapter as resize is managed by @pixi/react)
   */
  public onResize(callback: (width: number, height: number) => void): () => void {
    console.log("[PixiApplicationAdapter] onResize() called - resize is managed by @pixi/react");
    // Return a no-op cleanup function
    return () => {};
  }

  /**
   * Destroy method (partial implementation)
   * (No-op in adapter as destruction is managed by @pixi/react)
   */
  public destroy(): void {
    console.log("[PixiApplicationAdapter] destroy() called - app lifecycle is managed by @pixi/react");
    // No-op - app lifecycle is managed by @pixi/react
  }

  /**
   * Resize the application
   * (No-op in adapter as resize is managed by @pixi/react)
   */
  public resize(width: number, height: number): void {
    console.log(`[PixiApplicationAdapter] resize(${width}, ${height}) called - resize is managed by @pixi/react`);
    // No-op - app resize is managed by @pixi/react
  }
} 