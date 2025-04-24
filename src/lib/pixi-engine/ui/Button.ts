import { Container, Graphics, Text, TextStyle, FederatedPointerEvent, Sprite, Texture } from 'pixi.js';
import { ControlsManager } from '../core/ControlsManager';
import { AssetLoader } from '../assets/AssetLoader';

/**
 * Configuration options for Button appearance and behavior
 */
export interface ButtonOptions {
  /** Text label to display on the button */
  label?: string;
  /** Width of the button (default: 200) */
  width?: number;
  /** Height of the button (default: 50) */
  height?: number;
  /** Button background color in normal state (default: 0x4e7bff) */
  backgroundColor?: number;
  /** Button background color when hovered (default: 0x6c8fff) */
  hoverColor?: number;
  /** Button background color when pressed (default: 0x3c69e0) */
  pressedColor?: number;
  /** Button background color when disabled (default: 0xcccccc) */
  disabledColor?: number;
  /** Text color (default: 0xffffff) */
  textColor?: number;
  /** Corner radius for button (default: 8) */
  cornerRadius?: number;
  /** Border width (default: 2) */
  borderWidth?: number;
  /** Border color (default: 0x000000) */
  borderColor?: number;
  /** Padding between text and button edge (default: 10) */
  padding?: number;
  /** Button action identifier for ControlsManager (default: 'button_click') */
  action?: string;
  /** Whether the button is disabled initially (default: false) */
  disabled?: boolean;
  /** Custom text style options (will be merged with defaults) */
  textStyle?: Partial<TextStyle>;
  /** Optional icon texture name to display alongside text (requires AssetLoader) */
  iconTexture?: string;
  /** Whether to place icon before text (true) or after (false). Default: true */
  iconBeforeText?: boolean;
  /** Spacing between icon and text (default: 10) */
  iconTextSpacing?: number;
  /** Width of the icon (default: 24) */
  iconWidth?: number;
  /** Height of the icon (default: 24) */
  iconHeight?: number;
}

/**
 * Button states
 */
export enum ButtonState {
  NORMAL,
  HOVER,
  PRESSED,
  DISABLED
}

/**
 * A reusable button component for PixiJS UI that integrates with ControlsManager.
 * Supports normal, hover, pressed, and disabled states with customizable appearance.
 */
export class Button extends Container {
  private options: Required<ButtonOptions>;
  private currentState: ButtonState = ButtonState.NORMAL;
  private background: Graphics;
  private labelText: Text | null = null;
  private icon: Sprite | null = null;

  // Default button options
  private static readonly DEFAULT_OPTIONS: Required<ButtonOptions> = {
    label: '',
    width: 200,
    height: 50,
    backgroundColor: 0x4e7bff,
    hoverColor: 0x6c8fff,
    pressedColor: 0x3c69e0,
    disabledColor: 0xcccccc,
    textColor: 0xffffff,
    cornerRadius: 8,
    borderWidth: 2,
    borderColor: 0x000000,
    padding: 10,
    action: 'button_click',
    disabled: false,
    textStyle: {},
    iconTexture: '',
    iconBeforeText: true,
    iconTextSpacing: 10,
    iconWidth: 24,
    iconHeight: 24
  };

  /**
   * Creates a new Button instance.
   * @param options - Button configuration options
   * @param assetLoader - Optional AssetLoader for loading icon textures
   */
  constructor(options: ButtonOptions = {}, assetLoader?: typeof AssetLoader) {
    super();

    // Merge provided options with defaults
    this.options = {
      ...Button.DEFAULT_OPTIONS,
      ...options
    };

    // Store whether the button is disabled
    this.currentState = this.options.disabled ? ButtonState.DISABLED : ButtonState.NORMAL;

    // Create graphical elements
    this.background = new Graphics();
    this.addChild(this.background);

    // Add label text if provided
    if (this.options.label) {
      this.createLabelText();
    }

    // Add icon if provided and we have an AssetLoader
    if (this.options.iconTexture && assetLoader) {
      this.createIcon(assetLoader);
    } else if (this.options.iconTexture) {
      // If we have a texture name but no AssetLoader, create a placeholder
      this.createIconPlaceholder();
    }

    // Position elements
    this.layoutElements();

    // Update the visual appearance for initial state
    this.updateAppearance();

    // Set up interactivity
    this.setUpInteractivity();
  }

  /**
   * Creates the button's text label
   */
  private createLabelText(): void {
    // Set up default text style with provided overrides
    const textStyle = new TextStyle({
      fill: this.options.textColor,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      ...this.options.textStyle
    });

    this.labelText = new Text(this.options.label, textStyle);
    this.labelText.anchor.set(0.5);
    this.addChild(this.labelText);
  }

  /**
   * Creates an icon sprite using the provided AssetLoader
   * @param assetLoader - AssetLoader to use for loading the texture
   */
  private createIcon(assetLoader: typeof AssetLoader): void {
    try {
      // Try to load the texture from the AssetLoader using static method
      const texture = assetLoader.getTexture(this.options.iconTexture);
      
      if (texture) {
        this.icon = new Sprite(texture);
        this.icon.width = this.options.iconWidth;
        this.icon.height = this.options.iconHeight;
        this.addChild(this.icon);
      }
    } catch {
      console.warn(`Button: Icon texture "${this.options.iconTexture}" not found in AssetLoader. Using placeholder.`);
      this.createIconPlaceholder();
    }
  }

  /**
   * Creates a placeholder graphic for the icon
   */
  private createIconPlaceholder(): void {
    // Use a simple Graphics object as an icon placeholder
    this.icon = new Sprite(Texture.EMPTY);
    this.icon.width = this.options.iconWidth;
    this.icon.height = this.options.iconHeight;
    
    // Add a graphics element as a child to visualize the icon area
    const iconGraphic = new Graphics()
      .beginFill(0xffffff)
      .drawRect(0, 0, this.options.iconWidth, this.options.iconHeight)
      .endFill();
    
    this.icon.addChild(iconGraphic);
    this.addChild(this.icon);
  }

  /**
   * Updates an existing icon with a new texture from AssetLoader
   * @param assetLoader - AssetLoader to use for loading the texture
   * @param textureName - Name of the texture to load
   */
  public updateIcon(assetLoader: typeof AssetLoader, textureName: string): void {
    if (!textureName) return;

    this.options.iconTexture = textureName;
    
    // Remove existing icon if any
    if (this.icon) {
      this.removeChild(this.icon);
      this.icon = null;
    }

    // Create new icon
    this.createIcon(assetLoader);
    this.layoutElements();
  }

  /**
   * Positions the button elements (background, text, icon)
   */
  private layoutElements(): void {
    // Center for the text
    if (this.labelText) {
      this.labelText.x = this.options.width / 2;
      this.labelText.y = this.options.height / 2;
    }

    // If we have both icon and text, position them relative to each other
    if (this.icon && this.labelText) {
      const totalWidth = this.labelText.width + (this.options.iconTextSpacing + this.options.iconWidth);
      const startX = (this.options.width - totalWidth) / 2;

      if (this.options.iconBeforeText) {
        this.icon.x = startX;
        this.icon.y = (this.options.height - this.options.iconHeight) / 2; // Center icon vertically
        this.labelText.x = startX + this.options.iconWidth + this.options.iconTextSpacing;
        this.labelText.anchor.set(0, 0.5); // Left-align text
      } else {
        this.labelText.x = startX;
        this.labelText.anchor.set(0, 0.5); // Left-align text
        this.icon.x = startX + this.labelText.width + this.options.iconTextSpacing;
        this.icon.y = (this.options.height - this.options.iconHeight) / 2; // Center icon vertically
      }
    } else if (this.icon) {
      // Only icon, center it
      this.icon.x = (this.options.width - this.options.iconWidth) / 2;
      this.icon.y = (this.options.height - this.options.iconHeight) / 2;
    }
  }

  /**
   * Updates the visual appearance based on the current state
   */
  private updateAppearance(): void {
    this.background.clear();

    let fillColor;
    switch (this.currentState) {
      case ButtonState.HOVER:
        fillColor = this.options.hoverColor;
        break;
      case ButtonState.PRESSED:
        fillColor = this.options.pressedColor;
        break;
      case ButtonState.DISABLED:
        fillColor = this.options.disabledColor;
        break;
      case ButtonState.NORMAL:
      default:
        fillColor = this.options.backgroundColor;
        break;
    }

    // Draw border if specified
    if (this.options.borderWidth > 0) {
      this.background.lineStyle(this.options.borderWidth, this.options.borderColor);
    }

    // Draw rounded rectangle
    this.background.beginFill(fillColor);
    this.background.drawRoundedRect(0, 0, this.options.width, this.options.height, this.options.cornerRadius);
    this.background.endFill();

    // Update text color if needed
    if (this.labelText) {
      // In a more sophisticated implementation, you could have different text colors for different states
      this.labelText.style.fill = this.options.textColor;
    }

    // Update icon tint if needed (for example, to handle disabled state)
    if (this.icon) {
      this.icon.tint = this.currentState === ButtonState.DISABLED ? 0x888888 : 0xffffff;
    }
  }

  /**
   * Sets up interactive behavior for the button
   */
  private setUpInteractivity(): void {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    // Only set up event handlers if not disabled
    if (!this.options.disabled) {
      this.on('pointerover', this.onPointerOver.bind(this));
      this.on('pointerout', this.onPointerOut.bind(this));
      this.on('pointerdown', this.onPointerDown.bind(this));
      this.on('pointerup', this.onPointerUp.bind(this));
      this.on('pointerupoutside', this.onPointerUpOutside.bind(this));
    }
  }

  /**
   * Registers this button with ControlsManager for unified input handling
   * @param controlsManager - The ControlsManager instance
   * @param action - Optional custom action to use (defaults to options.action)
   */
  public registerWithControls(controlsManager: ControlsManager, action?: string): void {
    if (!this.options.disabled) {
      controlsManager.registerInteractiveArea(this, action || this.options.action);
    }
  }

  /**
   * Unregisters this button from ControlsManager
   * @param controlsManager - The ControlsManager instance
   */
  public unregisterFromControls(controlsManager: ControlsManager): void {
    controlsManager.unregisterInteractiveArea(this);
  }

  /**
   * Sets the disabled state of the button
   * @param disabled - True to disable the button, false to enable it
   */
  public setDisabled(disabled: boolean): void {
    if (this.options.disabled === disabled) return;

    this.options.disabled = disabled;
    
    if (disabled) {
      this.currentState = ButtonState.DISABLED;
      this.eventMode = 'none';
      this.cursor = 'default';
      this.off('pointerover');
      this.off('pointerout');
      this.off('pointerdown');
      this.off('pointerup');
      this.off('pointerupoutside');
    } else {
      this.currentState = ButtonState.NORMAL;
      this.eventMode = 'static';
      this.cursor = 'pointer';
      this.setUpInteractivity();
    }

    this.updateAppearance();
  }

  /**
   * Updates the button's label text
   * @param newLabel - New text for the button
   */
  public setLabel(newLabel: string): void {
    this.options.label = newLabel;
    
    if (this.labelText) {
      this.labelText.text = newLabel;
    } else if (newLabel) {
      // Create text if it didn't exist before
      this.createLabelText();
    }

    this.layoutElements();
  }

  /**
   * Sets the width of the button
   * @param width - New width in pixels
   */
  public setWidth(width: number): void {
    this.options.width = width;
    this.layoutElements();
    this.updateAppearance();
  }

  /**
   * Sets the height of the button
   * @param height - New height in pixels
   */
  public setHeight(height: number): void {
    this.options.height = height;
    this.layoutElements();
    this.updateAppearance();
  }

  /**
   * Event handler for pointer over (hover) events
   */
  private onPointerOver(): void {
    if (this.currentState !== ButtonState.DISABLED) {
      this.currentState = ButtonState.HOVER;
      this.updateAppearance();
    }
  }

  /**
   * Event handler for pointer out events
   */
  private onPointerOut(): void {
    if (this.currentState !== ButtonState.DISABLED) {
      this.currentState = ButtonState.NORMAL;
      this.updateAppearance();
    }
  }

  /**
   * Event handler for pointer down events
   */
  private onPointerDown(): void {
    if (this.currentState !== ButtonState.DISABLED) {
      this.currentState = ButtonState.PRESSED;
      this.updateAppearance();
    }
  }

  /**
   * Event handler for pointer up events
   * @param event - The pointer event
   */
  private onPointerUp(event: FederatedPointerEvent): void {
    if (this.currentState !== ButtonState.DISABLED) {
      // Emit a click event
      this.emit('buttonClick', { 
        target: this, 
        position: { x: event.global.x, y: event.global.y }
      });
      
      this.currentState = ButtonState.HOVER;
      this.updateAppearance();
    }
  }

  /**
   * Event handler for pointer up outside events
   */
  private onPointerUpOutside(): void {
    if (this.currentState !== ButtonState.DISABLED) {
      this.currentState = ButtonState.NORMAL;
      this.updateAppearance();
    }
  }
} 