import { Application } from 'pixi.js';

export interface ResponsiveCanvasOptions {
  /** The application instance */
  app: Application;
  
  /** The canvas element */
  canvas: HTMLCanvasElement;
  
  /** The parent element that will contain the canvas */
  parent?: HTMLElement;
  
  /** The aspect ratio to maintain (width / height) */
  aspectRatio?: number;
  
  /** Minimum width in pixels */
  minWidth?: number;
  
  /** Maximum width in pixels */
  maxWidth?: number;
  
  /** Minimum height in pixels */
  minHeight?: number;
  
  /** Maximum height in pixels */
  maxHeight?: number;
  
  /** Pixel ratio to use for rendering (default: window.devicePixelRatio) */
  pixelRatio?: number;
  
  /** Whether to center the canvas in its parent container */
  centerCanvas?: boolean;
  
  /** Whether to automatically resize on window resize */
  autoResize?: boolean;
  
  /** CSS positioning strategy ('absolute', 'relative', etc.) */
  position?: string;
  
  /** Whether to prefer filling the height (true) or width (false) */
  fitHeight?: boolean;
  
  /** Whether to prioritize maintaining aspect ratio over filling container */
  maintainAspectRatio?: boolean;
}

/**
 * ResponsiveCanvas - A utility class for handling responsive canvas sizing in PixiJS applications
 */
export class ResponsiveCanvas {
  private app: Application;
  private canvas: HTMLCanvasElement;
  private parent: HTMLElement;
  private options: {
    aspectRatio: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    pixelRatio: number;
    centerCanvas: boolean;
    autoResize: boolean;
    position: string;
    fitHeight: boolean;
    maintainAspectRatio: boolean;
  };
  private resizeObserver: ResizeObserver | null = null;
  
  /**
   * Creates a new ResponsiveCanvas instance
   * @param options - Configuration options for the responsive canvas
   */
  constructor(options: ResponsiveCanvasOptions) {
    this.app = options.app;
    this.canvas = options.canvas;
    this.parent = options.parent || document.body;
    
    this.options = {
      aspectRatio: options.aspectRatio || 16 / 9,
      minWidth: options.minWidth || 300,
      maxWidth: options.maxWidth || Infinity,
      minHeight: options.minHeight || 200,
      maxHeight: options.maxHeight || Infinity,
      pixelRatio: options.pixelRatio || window.devicePixelRatio || 1,
      centerCanvas: options.centerCanvas !== undefined ? options.centerCanvas : true,
      autoResize: options.autoResize !== undefined ? options.autoResize : true,
      position: options.position || 'relative',
      fitHeight: options.fitHeight !== undefined ? options.fitHeight : false,
      maintainAspectRatio: options.maintainAspectRatio !== undefined ? options.maintainAspectRatio : true,
    };
    
    this.setupCanvas();
    
    if (this.options.autoResize) {
      this.enableAutoResize();
    }
  }
  
  /**
   * Set up the canvas with initial styles
   */
  private setupCanvas(): void {
    // Set canvas CSS properties
    Object.assign(this.canvas.style, {
      position: this.options.position,
      display: 'block',
      top: '0',
      left: '0',
    });
    
    // Add the canvas to the parent if it's not already there
    if (!this.parent.contains(this.canvas)) {
      this.parent.appendChild(this.canvas);
    }
    
    // Set initial size
    this.resize();
  }
  
  /**
   * Enable automatic resizing when the window or parent element changes size
   */
  private enableAutoResize(): void {
    // Create a ResizeObserver to watch the parent element
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    
    // Start observing the parent element
    this.resizeObserver.observe(this.parent);
    
    // Also listen for window resize events
    window.addEventListener('resize', this.handleResize);
  }
  
  /**
   * Handle window resize events
   */
  private handleResize = (): void => {
    this.resize();
  };
  
  /**
   * Calculate and set the canvas size based on the parent element
   */
  public resize(): void {
    // Get the parent container dimensions
    const parentWidth = this.parent.clientWidth;
    const parentHeight = this.parent.clientHeight;
    
    let width, height;
    
    if (this.options.maintainAspectRatio) {
      // Calculate dimensions that maintain the aspect ratio
      if (this.options.fitHeight) {
        // Fit to height and calculate width based on aspect ratio
        height = parentHeight;
        width = height * this.options.aspectRatio;
        
        // If the width exceeds the parent width, recalculate based on width
        if (width > parentWidth) {
          width = parentWidth;
          height = width / this.options.aspectRatio;
        }
      } else {
        // Fit to width and calculate height based on aspect ratio
        width = parentWidth;
        height = width / this.options.aspectRatio;
        
        // If the height exceeds the parent height, recalculate based on height
        if (height > parentHeight) {
          height = parentHeight;
          width = height * this.options.aspectRatio;
        }
      }
    } else {
      // Simply fill the parent container
      width = parentWidth;
      height = parentHeight;
    }
    
    // Apply min/max constraints
    width = Math.min(Math.max(width, this.options.minWidth), this.options.maxWidth);
    height = Math.min(Math.max(height, this.options.minHeight), this.options.maxHeight);
    
    // Round to prevent blurry canvas
    width = Math.round(width);
    height = Math.round(height);
    
    // Set CSS dimensions
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    // Set the renderer size with the device pixel ratio
    this.app.renderer.resize(
      width * this.options.pixelRatio,
      height * this.options.pixelRatio
    );
    
    // Adjust the renderer resolution to match the device pixel ratio
    this.app.renderer.resolution = this.options.pixelRatio;
    
    // Center the canvas if needed
    if (this.options.centerCanvas) {
      // Calculate horizontal and vertical margins to center the canvas
      const marginLeft = Math.max(0, Math.floor((parentWidth - width) / 2));
      const marginTop = Math.max(0, Math.floor((parentHeight - height) / 2));
      
      // Apply the margins
      this.canvas.style.marginLeft = `${marginLeft}px`;
      this.canvas.style.marginTop = `${marginTop}px`;
    } else {
      this.canvas.style.marginLeft = '0';
      this.canvas.style.marginTop = '0';
    }
    
    // Trigger a custom resize event that components can listen for
    const event = new CustomEvent('canvasresize', {
      detail: { 
        width, 
        height, 
        pixelRatio: this.options.pixelRatio,
        parentWidth,
        parentHeight
      },
    });
    
    this.canvas.dispatchEvent(event);
  }
  
  /**
   * Get the current canvas dimensions
   * @returns An object containing width, height, and scale
   */
  public getDimensions() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
      scale: this.options.pixelRatio,
    };
  }
  
  /**
   * Set a new aspect ratio and resize the canvas
   * @param aspectRatio - The new aspect ratio (width / height)
   */
  public setAspectRatio(aspectRatio: number): void {
    this.options.aspectRatio = aspectRatio;
    this.resize();
  }
  
  /**
   * Set whether to fit to height or width
   * @param fitHeight - Whether to fit to height (true) or width (false)
   */
  public setFitHeight(fitHeight: boolean): void {
    this.options.fitHeight = fitHeight;
    this.resize();
  }
  
  /**
   * Clean up event listeners and observers
   */
  public destroy(): void {
    // Remove the window resize listener
    window.removeEventListener('resize', this.handleResize);
    
    // Disconnect the resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
} 