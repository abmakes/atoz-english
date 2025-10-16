// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ControlsConfig, ActionMapping } from '../config/GameConfig';
import type { EventBus } from './EventBus';
import { CONTROLS_EVENTS, type ControlsPlayerActionPayload } from './EventTypes'; // Import necessary types and constants

/**
 * Manages player input controls, mapping raw input events (keyboard, mouse/touch, gamepad)
 * to standardized game actions defined in {@link ControlsConfig}.
 * Emits {@link CONTROLS_EVENTS.PLAYER_ACTION} events via the provided {@link EventBus}.
 * 
 * This is a port from the PixiJS version that used window events and PIXI pointer events,
 * now using Phaser's native input system for better integration.
 */
export class ControlsManager {
    private config: ControlsConfig | null = null;
    private eventBus: EventBus | null = null;
    private actionStates: Map<string, boolean> = new Map(); // Tracks if an action is currently pressed
    private isEnabled: boolean = false;
    private isKeyboardEnabled: boolean = true; // Control keyboard input
    private isPointerEnabled: boolean = true;  // Control pointer input

    // Stores registered interactive objects and their associated action
    private interactiveAreas: Map<Phaser.GameObjects.GameObject, { action: string; listeners: Record<string, () => void> }> = new Map();

    /**
     * Initializes the ControlsManager with configuration and event bus.
     * Sets up internal action states based on the provided configuration's actionMap.
     * Note: Event listeners are not attached until {@link enable} is called.
     * @param {ControlsConfig} config - The controls configuration mapping inputs to actions.
     * @param {EventBus} eventBus - The application's central event bus for emitting action events.
     * @param {Phaser.Scene} scene - The Phaser scene for input handling.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(config: ControlsConfig, eventBus: EventBus, _scene: Phaser.Scene): void {
        console.log('ControlsManager initializing...');
        this.config = config;
        this.eventBus = eventBus;

        // Initialize action states to false (not pressed)
        this.actionStates.clear();
        if (this.config?.actionMap) {
            for (const action in this.config.actionMap) {
                this.actionStates.set(action, false);
            }
        }
        console.log('ControlsManager initialized with actions:', Array.from(this.actionStates.keys()));
    }

    /**
     * Enables the ControlsManager, attaching input event listeners using Phaser's input system.
     * Idempotent: Does nothing if already enabled or not initialized.
     * @param {Phaser.Scene} scene - The Phaser scene for input handling.
     */
    enable(scene: Phaser.Scene): void {
        if (this.isEnabled || !this.config || !this.eventBus) {
            if (!this.config || !this.eventBus) {
                console.warn('ControlsManager cannot enable: Not initialized.');
            }
            return;
        }
        console.log('Enabling ControlsManager...');
        
        // Keyboard input disabled for now - multiple choice game uses mouse/touch only
        // this.setupKeyboardInput(scene);
        
        // Note: Gamepad input removed for now - focusing on touch/click only
        
        this.isEnabled = true;
        console.log('ControlsManager enabled (keyboard input disabled).');
    }

    /**
     * Disables the ControlsManager, removing attached input event listeners.
     * Idempotent: Does nothing if already disabled.
     */
    disable(): void {
        if (!this.isEnabled) {
            return;
        }
        console.log('Disabling ControlsManager...');
        
        // Remove listeners from all registered interactive areas
        this.interactiveAreas.forEach(({ listeners }, gameObject) => {
            for (const eventName in listeners) {
                gameObject.off(eventName, listeners[eventName]);
            }
        });
        this.interactiveAreas.clear();

        this.isEnabled = false;
        console.log('ControlsManager disabled.');
    }

    /**
     * Cleans up all resources used by the ControlsManager.
     * Disables the manager, removes listeners, and clears internal references.
     * Should be called when the manager is no longer needed (e.g., engine shutdown).
     */
    destroy(): void {
        console.log('Destroying ControlsManager...');
        this.disable(); // Ensure listeners are removed
        this.config = null;
        this.eventBus = null;
        this.actionStates.clear();
        this.interactiveAreas.clear(); // Clear registered areas
        console.log('ControlsManager destroyed.');
    }

    /**
     * Checks if a specific game action is currently active (e.g., corresponding key is pressed).
     * @param {string} action - The action identifier (e.g., 'UP', 'ACTION_A') as defined in the ControlsConfig actionMap.
     * @returns {boolean} True if the action is currently active, false otherwise.
     */
    isActionActive(action: string): boolean {
        return this.actionStates.get(action) ?? false;
    }

    /**
     * Registers a Phaser GameObject as an interactive area linked to a specific action.
     * Attaches pointer listeners (pointerdown, pointerup) to the object.
     * @param {Phaser.GameObjects.GameObject} gameObject - The Phaser object to make interactive.
     * @param {string} action - The action identifier to associate with interactions on this object.
     */
    registerInteractiveArea(gameObject: Phaser.GameObjects.GameObject, action: string): void {
        if (!this.isEnabled) {
            console.warn(`ControlsManager: Cannot register area for action "${action}", manager is disabled.`);
            return;
        }
        if (this.interactiveAreas.has(gameObject)) {
            console.warn(`ControlsManager: GameObject already registered for action "${this.interactiveAreas.get(gameObject)?.action}". Re-registering for action "${action}".`);
            this.unregisterInteractiveArea(gameObject); // Unregister previous first
        }

        // Make the object interactive
        gameObject.setInteractive();

        // Create bound handlers specific to this object/action
        const handlePointerDown = () => this.handlePointerEvent(gameObject, action, true);
        const handlePointerUp = () => this.handlePointerEvent(gameObject, action, false);

        gameObject.on('pointerdown', handlePointerDown);
        gameObject.on('pointerup', handlePointerUp);
        gameObject.on('pointerupoutside', handlePointerUp); // Handle case where pointer is released outside

        this.interactiveAreas.set(gameObject, {
            action,
            listeners: {
                'pointerdown': handlePointerDown,
                'pointerup': handlePointerUp,
                'pointerupoutside': handlePointerUp
            }
        });
        console.log(`ControlsManager: Registered interactive area for action "${action}".`);
    }

    /**
     * Unregisters a Phaser GameObject, removing its listeners and association with an action.
     * @param {Phaser.GameObjects.GameObject} gameObject - The object to unregister.
     */
    unregisterInteractiveArea(gameObject: Phaser.GameObjects.GameObject): void {
        const registeredArea = this.interactiveAreas.get(gameObject);
        if (registeredArea) {
            for (const eventName in registeredArea.listeners) {
                gameObject.off(eventName, registeredArea.listeners[eventName]);
            }
            this.interactiveAreas.delete(gameObject);
            // Optionally reset interactivity, but might interfere if object is used elsewhere
            // gameObject.disableInteractive();
            console.log(`ControlsManager: Unregistered interactive area for action "${registeredArea.action}".`);
        }
    }

    /**
     * Enables or disables handling of keyboard inputs.
     * @param {boolean} enabled - True to enable, false to disable.
     */
    setKeyboardEnabled(enabled: boolean): void {
        this.isKeyboardEnabled = enabled;
        console.log(`ControlsManager: Keyboard input ${enabled ? 'enabled' : 'disabled'}.`);
        // If disabling, we might want to force-release any currently held keys
        if (!enabled) {
            this.actionStates.forEach((isActive, action) => {
                // Heuristic: Assume keyboard actions might be active
                // This is imperfect; ideally, track source per action
                if (isActive) {
                    // Check if action is mapped to a keyboard key
                    let isKeyboardAction = false;
                    if (this.config?.actionMap) {
                        const mapping = this.config.actionMap[action];
                        if (mapping?.keyboard) isKeyboardAction = true;
                    }
                    if (isKeyboardAction) {
                         this.updateActionState(action, false, 'keyboard', undefined);
                    }
                }
            });
        }
    }

    /**
     * Enables or disables handling of pointer (mouse/touch) inputs on registered areas.
     * @param {boolean} enabled - True to enable, false to disable.
     */
    setPointerEnabled(enabled: boolean): void {
        this.isPointerEnabled = enabled;
        console.log(`ControlsManager: Pointer input ${enabled ? 'enabled' : 'disabled'}.`);
         // If disabling, force-release any actions potentially triggered by pointers
        if (!enabled) {
            this.actionStates.forEach((isActive, action) => {
                // Heuristic: Check if this action is associated with any interactive area
                 let isPointerAction = false;
                 this.interactiveAreas.forEach(areaData => {
                     if (areaData.action === action) {
                         isPointerAction = true;
                     }
                 });

                if (isActive && isPointerAction) {
                   this.updateActionState(action, false, 'pointer', undefined);
                }
            });
        }
    }

    /**
     * Calculates a normalized movement vector based on currently active movement actions.
     * Assumes standard action names 'UP', 'DOWN', 'LEFT', 'RIGHT' are defined in the ControlsConfig actionMap.
     * Useful for character movement logic.
     * @returns {Phaser.Math.Vector2} A Phaser Vector2 object representing the normalized direction vector (magnitude 0 or 1).
     *          (0,0) if no movement, (1,0) right, (-1,0) left, (0,-1) up, (0,1) down.
     *          Diagonal movement is normalized to have a magnitude of approximately 1.
     */
    getNormalizedMovementVector(): Phaser.Math.Vector2 {
        const vec = new Phaser.Math.Vector2(0, 0);

        if (this.isActionActive('UP'))    vec.y -= 1;
        if (this.isActionActive('DOWN'))  vec.y += 1;
        if (this.isActionActive('LEFT'))  vec.x -= 1;
        if (this.isActionActive('RIGHT')) vec.x += 1;

        // Normalize the vector if it has magnitude (i.e., movement is occurring)
        if (vec.length() > 0) {
            vec.normalize();
        }

        return vec;
    }

    // --- Private Setup Methods ---

    // Keyboard input disabled for now - multiple choice game uses mouse/touch only
    /*
    private setupKeyboardInput(scene: Phaser.Scene, retryCount: number = 0): void {
        if (!this.config?.actionMap) return;

        // Maximum retry limit to prevent infinite loops
        const MAX_RETRIES = 50; // 5 seconds max (50 * 100ms)
        
        // Check if the scene's input system is ready
        if (!scene.input || !scene.input.keyboard) {
            if (retryCount >= MAX_RETRIES) {
                console.error('ControlsManager: Scene input system not ready after maximum retries, giving up keyboard setup');
                return;
            }
            
            if (retryCount === 0) {
                console.warn('ControlsManager: Scene input system not ready, deferring keyboard setup');
            }
            
            // Use setTimeout instead of scene.time.delayedCall since scene.time might not be ready
            setTimeout(() => {
                this.setupKeyboardInput(scene, retryCount + 1);
            }, 100);
            return;
        }

        // Set up keyboard input using Phaser's keyboard manager
        let keyboardActionsSetup = 0;
        for (const action in this.config.actionMap) {
            const mapping = this.config.actionMap[action];
            if (mapping.keyboard) {
                const key = scene.input.keyboard.addKey(mapping.keyboard);
                if (key) {
                    key.on('down', () => {
                        if (this.isKeyboardEnabled && !this.actionStates.get(action)) {
                            this.updateActionState(action, true, 'keyboard');
                        }
                    });
                    key.on('up', () => {
                        if (this.actionStates.get(action)) {
                            this.updateActionState(action, false, 'keyboard');
                        }
                    });
                    keyboardActionsSetup++;
                }
            }
        }
        
        if (retryCount > 0) {
            console.log(`ControlsManager: Keyboard setup completed after ${retryCount} retries, ${keyboardActionsSetup} actions configured`);
        } else {
            console.log(`ControlsManager: Keyboard setup completed immediately, ${keyboardActionsSetup} actions configured`);
        }
    }
    */


    // --- Private Event Handlers ---

    /**
     * Handles pointer events (pointerdown, pointerup) on registered interactive areas.
     * @param {Phaser.GameObjects.GameObject} gameObject - The Phaser object that was interacted with.
     * @param {string} action - The action associated with the interacted object.
     * @param {boolean} isPressed - True if it's a 'press' event (pointerdown), false otherwise.
     */
    private handlePointerEvent(gameObject: Phaser.GameObjects.GameObject, action: string, isPressed: boolean): void {
        if (!this.isPointerEnabled) return; // Ignore if pointer input is disabled

        // Prevent triggering state update if the state is already correct
        if (this.actionStates.get(action) === isPressed) {
            return;
        }

        // Get pointer position from the scene's input manager
        const pointer = gameObject.scene.input.activePointer;
        const position = { x: pointer.x, y: pointer.y };
        this.updateActionState(action, isPressed, 'pointer', position);
    }

    // --- Helper Methods ---

    /**
     * Finds the action name associated with a given keyboard key code.
     * @param keyCode - The KeyboardEvent.code value (e.g., 'KeyW', 'ArrowUp').
     * @returns The action name or null if no mapping exists.
     */
    private getActionForKey(keyCode: string): string | null {
        if (!this.config?.actionMap) return null;

        for (const action in this.config.actionMap) {
            const mapping = this.config.actionMap[action];
            if (mapping.keyboard === keyCode) {
                return action;
            }
        }
        return null;
    }


    /**
     * Updates the state of an action and emits an event.
     * @param action - The action identifier.
     * @param isPressed - The new state (true for pressed, false for released).
     * @param device - The type of device triggering the action.
     * @param position - Optional position data for pointer events.
     */
    private updateActionState(action: string, isPressed: boolean, device: 'keyboard' | 'pointer' | 'unknown', position?: { x: number; y: number }): void {
        this.actionStates.set(action, isPressed);

        // TODO: Determine playerId based on config.playerMappings and device (later)
        const playerId = 'player1'; // Placeholder

        // Construct payload according to ControlsPlayerActionPayload
        const payload: ControlsPlayerActionPayload = {
            action: action,
            value: isPressed, // Use boolean value for pressed state
            playerId: playerId,
            device: device,
            position: position // Include position if available
        };

        console.log(`Action event: ${action} ${isPressed ? 'pressed' : 'released'} (${device})`); // Log human-readable state
        this.eventBus?.emit(CONTROLS_EVENTS.PLAYER_ACTION, payload);
    }
}
