import * as PIXI from 'pixi.js';
import { Application, ApplicationOptions, Container, Graphics, Text } from 'pixi.js';
// import { EventEmitter } from 'eventemitter3';

export interface PixiApplicationOptions extends Partial<ApplicationOptions> {
  parent?: HTMLElement;
  width?: number;
  height?: number;
  backgroundColor?: string;
  resolution?: number;
  autoResize?: boolean;
  autoStart?: boolean;
  targetFPS?: number;
  debug?: boolean;
}

export type ResizeCallback = (width: number, height: number) => void;

/**
 * PixiApplication - A wrapper around the PixiJS Application class
 * with added functionality for responsive sizing, debugging, and scene management.
 */
export class PixiApplication {
  /** The underlying PixiJS Application instance */
  private app: Application;
  
  /** The parent container to attach the canvas to */
  private parent: HTMLElement | null = null;
  
  /** The main stage container for all game objects */
  private mainStage: Container;
  
  /** Debug container for visualizing hitboxes, etc. */
  private debugContainer: Container;
  
  /** Options for the application */
  private options: PixiApplicationOptions;
  
  /** Debug graphics instance for drawing debug visualizations */
  private debugGraphics: Graphics | null = null;
  
  /** Debug text for rendering FPS and other information */
  private debugText: Text | null = null;
  
  /** Flag to track if the application has been initialized */
  private initialized = false;
  
  /** Timestamp of the last frame for calculating delta time */
  private lastFrameTime = 0;
  
  /** Callbacks to be executed when the application is resized */
  private resizeCallbacks: ResizeCallback[] = [];
  
  /** Flag to track if a resize is pending */
  private resizePending = false;
  
  /** Current window dimensions */
  private windowDimensions = { width: 0, height: 0 };
  
  /** Array to store the last 10 FPS values for smoothing */
  private fpsValues: number[] = Array(10).fill(60);

  /**
   * Get the screen size
   * @returns The screen size
   */
  public getScreenSize(): { width: number; height: number } {
      return this.app.screen;
    }
  
  /**
   * Get the canvas element from the internal app instance
   * @returns The canvas element
   */
  public getView(): HTMLCanvasElement | undefined {
    return this.app?.canvas;
  }

  /**
   * Constructor for the PixiApplication class
   * @param options - Configuration options for the application
   */
  constructor(options: PixiApplicationOptions = {}) {
    this.options = {
      width: options.width || 800,
      height: options.height || 600,
      backgroundColor: options.backgroundColor || '#1099bb',
      resolution: options.resolution || window.devicePixelRatio || 1,
      autoResize: options.autoResize !== undefined ? options.autoResize : true,
      autoStart: options.autoStart !== undefined ? options.autoStart : true,
      targetFPS: options.targetFPS || 60,
      debug: options.debug || false,
      ...options
    };
    
    this.parent = options.parent || null;
    this.app = new Application();
    this.mainStage = new Container();
    this.debugContainer = new Container();
  }

  /**
   * Initialize the PixiJS application
   * @returns A promise that resolves when initialization is complete
   */
  public async init(): Promise<void> {
    if (this.initialized) {
      console.warn('PixiApplication already initialized');
      return;
    }

    try {
      console.log('Initializing PixiJS application with options:', this.options);
      
      // Initialize the application with options
      await this.app.init({
        background: this.options.backgroundColor,
        resolution: this.options.resolution,
        antialias: true,
        autoDensity: true,
        // If parent is set, use it for resizing, otherwise use window
        ...(this.parent ? {} : { resizeTo: window }),
      });
      
      console.log('PixiJS application initialized successfully');
      
      // Add main stage to the application stage
      this.app.stage.addChild(this.mainStage);
      console.log('Main stage added to application stage');
      
      // Setup debug container if debug mode is enabled
      if (this.options.debug) {
        console.log('Debug mode enabled, setting up debug container');
        this.debugGraphics = new Graphics();
        this.debugText = new Text({
          text: 'Debug Info',
          style: {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xffffff,
            align: 'left',
          }
        });
        this.debugText.position.set(15, 15);
        this.debugContainer.addChild(this.debugGraphics);
        this.debugContainer.addChild(this.debugText);
        this.app.stage.addChild(this.debugContainer);
      }

      // Add the canvas to the DOM if parent is provided
      if (this.parent) {
        console.log('Adding canvas to parent element');
        
        // Force a specific style for the canvas to make sure it's visible
        const canvas = this.app.canvas;
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';

        this.parent.appendChild(this.app.canvas);
        
        // Set initial size
        this.resize(this.options.width!, this.options.height!);
        
        // Set up auto-resize if enabled
        if (this.options.autoResize) {
          console.log('Auto-resize enabled, adding resize listeners');
          window.addEventListener('resize', this.handleResize);
          
          // Store initial window dimensions
          this.windowDimensions = {
            width: window.innerWidth,
            height: window.innerHeight
          };
        }
      } else {
        // If no parent, at least add to document body
        console.log('No parent provided, adding canvas to document body');
        document.body.appendChild(this.app.canvas);
      }
      
      console.log('Renderer created with dimensions:', 
        this.app.renderer.width, 'x', this.app.renderer.height);
      console.log('Canvas dimensions:', 
        this.app.canvas.width, 'x', this.app.canvas.height);
      console.log('Canvas style dimensions:', 
        this.app.canvas.style.width, 'x', this.app.canvas.style.height);

      // Add ticker for update loop if autoStart is true
      if (this.options.autoStart) {
        console.log('Auto-start enabled, adding ticker');
        this.app.ticker.add(this.update);
        
        // Set target FPS if provided
        if (this.options.targetFPS) {
          console.log('Setting target FPS to', this.options.targetFPS);
          this.app.ticker.maxFPS = this.options.targetFPS;
        }
      }

      this.initialized = true;
      console.log('PixiApplication initialization complete');
    } catch (error) {
      console.error('Error initializing PixiJS application:', error);
      throw error;
    }
  }

  /**
   * Main update loop, called each frame
   * @param time - Frame timing information from PixiJS ticker
   */
  private update = (time: { deltaTime: number; deltaMS: number; elapsedMS: number }): void => {
    const deltaTime = time.deltaTime;
    
    // Calculate actual FPS
    const now = performance.now();
    const deltaMs = now - this.lastFrameTime;
    const currentFps = 1000 / deltaMs;
    this.lastFrameTime = now;
    
    // Add current FPS to the values array
    this.fpsValues.shift();
    this.fpsValues.push(currentFps);
    
    // Calculate average FPS
    const avgFps = this.fpsValues.reduce((sum, fps) => sum + fps, 0) / this.fpsValues.length;
    
    // Update debug info if in debug mode
    if (this.options.debug && this.debugGraphics && this.debugText) {
      this.updateDebugInfo(avgFps, deltaTime);
    }
  };

  /**
   * Handle window resize events with throttling
   */
  private handleResize = (): void => {
    if (this.resizePending) return;
    
    this.resizePending = true;
    
    // Check if dimensions have actually changed to avoid unnecessary resizes
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    if (newWidth === this.windowDimensions.width && newHeight === this.windowDimensions.height) {
      this.resizePending = false;
      return;
    }
    
    // Update stored dimensions
    this.windowDimensions = { width: newWidth, height: newHeight };
    
    // Use requestAnimationFrame to throttle resize events
    requestAnimationFrame(() => {
      if (this.parent) {
        const bounds = this.parent.getBoundingClientRect();
        console.log('Resizing to parent dimensions:', bounds.width, 'x', bounds.height);
        this.resize(bounds.width, bounds.height);
      }
      this.resizePending = false;
    });
  };

  /**
   * Resize the canvas to specified dimensions
   * @param width - The new width
   * @param height - The new height
   */
  public resize(width: number, height: number): void {
    if (!this.initialized) {
      console.warn('Cannot resize before initialization');
      return;
    }
    
    console.log('Resizing renderer to:', width, 'x', height);
    
    // Resize the renderer
    this.app.renderer.resize(width, height);
    
    // Also set canvas style dimensions
    this.app.canvas.style.width = `${width}px`;
    this.app.canvas.style.height = `${height}px`;
    
    console.log('After resize - Renderer dimensions:', 
      this.app.renderer.width, 'x', this.app.renderer.height);
    console.log('After resize - Canvas dimensions:', 
      this.app.canvas.width, 'x', this.app.canvas.height);
    console.log('After resize - Canvas style dimensions:', 
      this.app.canvas.style.width, 'x', this.app.canvas.style.height);
    
    // Call registered resize callbacks
    for (const callback of this.resizeCallbacks) {
      callback(width, height);
    }
    
    // Update any layout that depends on screen size
    this.updateLayout();
  }
  
  /**
   * Register a callback that will be called when the application is resized
   * @param callback - The callback function to register
   * @returns A function that removes the callback when called
   */
  public onResize(callback: ResizeCallback): () => void {
    this.resizeCallbacks.push(callback);
    
    // Return a function that removes the callback
    return () => {
      const index = this.resizeCallbacks.indexOf(callback);
      if (index !== -1) {
        this.resizeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update the layout based on new dimensions
   * Override this in derived classes to handle specific layout needs
   */
  protected updateLayout(): void {
    // If debug mode is enabled, position debug text in top-left corner
    if (this.debugText) {
      this.debugText.position.set(10, 10);
    }
  }

  /**
   * Update debug information display
   * @param fps - Current frames per second
   * @param deltaTime - Time since last frame in seconds
   */
  private updateDebugInfo(fps: number, deltaTime: number): void {
    if (!this.debugGraphics || !this.debugText) return;
    
    // Clear previous debug drawings
    this.debugGraphics.clear();
    
    // Draw semi-transparent background
    this.debugGraphics
      .rect(5, 5, 200, 100)
      .fill({ color: 0x000000, alpha: 0.7 });
    
    // Update debug text
    this.debugText.text = `FPS: ${Math.round(fps)}\n` +
      `Delta: ${deltaTime.toFixed(4)}\n` +
      `Renderer: ${this.app.renderer.width}x${this.app.renderer.height}\n` +
      `Stage children: ${this.app.stage.children.length}\n` +
      `Canvas: ${this.app.canvas.width}x${this.app.canvas.height}`;
  }

  /**
   * Get the main stage container
   * @returns The main stage container
   */
  public getStage(): Container {
    return this.mainStage;
  }

  /**
   * Get the PixiJS Application instance
   * @returns The PixiJS Application instance
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * Get the canvas element
   * @returns The canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  /**
   * Start the application ticker
   */
  public start(): void {
    if (!this.initialized) {
      console.warn('Cannot start before initialization');
      return;
    }
    
    this.app.ticker.start();
  }

  /**
   * Stop the application ticker
   */
  public stop(): void {
    if (!this.initialized) return;
    
    this.app.ticker.stop();
  }

  /**
   * Add a container to the main stage
   * @param container - The container to add
   */
  public addChild(container: Container): void {
    this.mainStage.addChild(container);
  }

  /**
   * Remove a container from the main stage
   * @param container - The container to remove
   */
  public removeChild(container: Container): void {
    this.mainStage.removeChild(container);
  }

  /**
   * Clean up resources when the application is no longer needed
   */
  public destroy(): void {
    if (!this.initialized) return;
    
    // Stop the ticker
    this.stop();
    
    // Remove event listeners
    if (this.options.autoResize) {
      window.removeEventListener('resize', this.handleResize);
    }
    
    // Clear resize callbacks
    this.resizeCallbacks = [];
    
    // Destroy the PixiJS application
    this.app.destroy(true);
    
    // Reset initialized flag
    this.initialized = false;
  }

  // Add the getter for the ticker
  public getTicker(): PIXI.Ticker | undefined {
    return this.app?.ticker;
  }


} 