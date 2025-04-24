import { Application, Container } from 'pixi.js';
import { Button } from './Button';
import { EventBus } from '../core/EventBus';
import { ControlsManager } from '../core/ControlsManager';
import { ControlsConfig } from '../config/GameConfig';

/**
 * Interface for button click event data
 */
interface ButtonClickEvent {
  target: Button;
  position: { x: number; y: number };
}

/**
 * Example demonstrating how to use the Button component with ControlsManager.
 * This is not part of the main engine but serves as a usage example.
 */
export class ButtonExample {
  private app: Application;
  private eventBus: EventBus;
  private controlsManager: ControlsManager;
  private container: Container;

  constructor(mountElement: HTMLElement) {
    // Create PixiJS application
    this.app = new Application({
      backgroundColor: 0x1099bb,
      resizeTo: mountElement,
    });
    mountElement.appendChild(this.app.view as HTMLCanvasElement);

    // Set up EventBus
    this.eventBus = new EventBus(true); // debug mode enabled

    // Set up ControlsManager
    this.controlsManager = new ControlsManager();
    const controlsConfig: ControlsConfig = {
      actionMap: {
        'button_primary': { keyboard: 'Space' },
        'button_secondary': { keyboard: 'KeyS' },
        'button_click': {} // Empty mapping, will only respond to direct clicks
      },
      playerMappings: [
        { playerId: 'player1', deviceType: 'keyboard' }
      ]
    };
    this.controlsManager.init(controlsConfig, this.eventBus);
    this.controlsManager.enable();

    // Create container for our UI
    this.container = new Container();
    this.app.stage.addChild(this.container);

    // Set up buttons
    this.setupButtons();

    // Listen for button events
    this.listenForEvents();
  }

  private setupButtons(): void {
    // Create primary button
    const primaryButton = new Button({
      label: 'Primary Button',
      width: 200,
      height: 50,
      backgroundColor: 0x4e7bff,
      action: 'button_primary', // Maps to Space key via controlsConfig
    });
    primaryButton.position.set(this.app.screen.width / 2 - 100, 100);
    this.container.addChild(primaryButton);
    
    // Register with controls manager
    primaryButton.registerWithControls(this.controlsManager);

    // Add a custom event handler directly on the button
    primaryButton.on('buttonClick', this.onButtonClick.bind(this, 'Primary'));

    // Create secondary button with different style
    const secondaryButton = new Button({
      label: 'Secondary Button',
      width: 220,
      height: 60,
      backgroundColor: 0x50c878, // Emerald green
      cornerRadius: 12,
      textColor: 0x000000,
      action: 'button_secondary', // Maps to S key via controlsConfig
    });
    secondaryButton.position.set(this.app.screen.width / 2 - 110, 180);
    this.container.addChild(secondaryButton);
    
    // Register with controls manager
    secondaryButton.registerWithControls(this.controlsManager);

    // Create disabled button
    const disabledButton = new Button({
      label: 'Disabled Button',
      width: 180,
      height: 50,
      disabled: true,
    });
    disabledButton.position.set(this.app.screen.width / 2 - 90, 270);
    this.container.addChild(disabledButton);

    // No need to register disabled button with controls
  }

  private listenForEvents(): void {
    // Listen for PLAYER_ACTION events from ControlsManager
    this.eventBus.on('controls:playerAction', (payload) => {
      console.log('Control action received:', payload);
      
      if (payload.action === 'button_primary' && payload.value === true) {
        console.log('Primary button action triggered via', payload.device);
      }
      
      if (payload.action === 'button_secondary' && payload.value === true) {
        console.log('Secondary button action triggered via', payload.device);
      }
    });
  }

  private onButtonClick(buttonType: string, event: ButtonClickEvent): void {
    console.log(`${buttonType} button clicked directly at position:`, event.position);
  }

  public destroy(): void {
    // Clean up resources
    this.controlsManager.destroy();
    this.app.destroy(true, { children: true });
  }
}

/**
 * Usage example:
 * 
 * // In your application code:
 * import { ButtonExample } from './lib/pixi-engine/ui/ButtonExample';
 * 
 * // Get container element
 * const container = document.getElementById('button-example-container');
 * 
 * // Create example
 * const example = new ButtonExample(container);
 * 
 * // Clean up when done
 * // example.destroy();
 */ 