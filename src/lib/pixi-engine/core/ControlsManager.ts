// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ControlsConfig, ActionMapping } from '../config/GameConfig';
import type { EventBus } from './EventBus';
import { CONTROLS_EVENTS, type ControlsPlayerActionPayload } from './EventTypes'; // Import necessary types and constants
import { Point, Container, type FederatedPointerEvent } from 'pixi.js';

/**
 * Manages player input controls, mapping raw input events (keyboard, mouse/touch)
 * to standardized game actions defined in {@link ControlsConfig}.
 * Emits {@link CONTROLS_EVENTS.PLAYER_ACTION} events via the provided {@link EventBus}.
 */
export class ControlsManager {
    private config: ControlsConfig | null = null;
    private eventBus: EventBus | null = null;
    private actionStates: Map<string, boolean> = new Map(); // Tracks if an action is currently pressed
    private isEnabled: boolean = false;
    private isKeyboardEnabled: boolean = true; // Control keyboard input
    private isPointerEnabled: boolean = true;  // Control pointer input

    // Stores registered interactive objects and their associated action
    // TODO: Find the correct importable type for PixiJS display objects instead of 'any'
    private interactiveAreas: Map<unknown, { action: string; listeners: Record<string, (event: FederatedPointerEvent) => void> }> = new Map();

    /**
     * Initializes the ControlsManager with configuration and event bus.
     * Sets up internal action states based on the provided configuration's actionMap.
     * Note: Event listeners are not attached until {@link enable} is called.
     * @param {ControlsConfig} config - The controls configuration mapping inputs to actions.
     * @param {EventBus} eventBus - The application's central event bus for emitting action events.
     */
    init(config: ControlsConfig, eventBus: EventBus): void {
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
     * Enables the ControlsManager, attaching input event listeners (currently keyboard only).
     * Idempotent: Does nothing if already enabled or not initialized.
     */
    enable(): void {
        if (this.isEnabled || !this.config || !this.eventBus) {
            if (!this.config || !this.eventBus) {
                console.warn('ControlsManager cannot enable: Not initialized.');
            }
            return;
        }
        console.log('Enabling ControlsManager...');
        // Bind event handlers to ensure 'this' context is correct
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        // TODO: Add listeners for gamepad and touch later
        this.isEnabled = true;
        console.log('ControlsManager enabled.');
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
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        // TODO: Remove gamepad and touch listeners later
        this.isEnabled = false;
        // Optionally reset action states on disable?
        // this.actionStates.forEach((_, key) => this.actionStates.set(key, false));
        console.log('ControlsManager disabled.');

        // Remove listeners from all registered interactive areas
        this.interactiveAreas.forEach(({ listeners }, displayObject) => {
            // Cast displayObject to Container to access PixiJS methods
            const pixiObject = displayObject as Container;
            for (const eventName in listeners) {
                pixiObject.off(eventName, listeners[eventName]);
            }
        });

        this.isEnabled = false;
        // Optionally reset action states on disable?
        // this.actionStates.forEach((_, key) => this.actionStates.set(key, false));
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
     * Registers a PixiJS DisplayObject as an interactive area linked to a specific action.
     * Attaches pointer listeners (pointerdown, pointerup) to the object.
     * @param {DisplayObject} displayObject - The PixiJS object to make interactive.
     * @param {string} action - The action identifier to associate with interactions on this object.
     */
    registerInteractiveArea(displayObject: Container, action: string): void {
        if (!this.isEnabled) {
            console.warn(`ControlsManager: Cannot register area for action "${action}", manager is disabled.`);
            return;
        }
        if (this.interactiveAreas.has(displayObject)) {
            console.warn(`ControlsManager: DisplayObject already registered for action "${this.interactiveAreas.get(displayObject)?.action}". Re-registering for action "${action}".`);
            this.unregisterInteractiveArea(displayObject); // Unregister previous first
        }

        displayObject.interactive = true;
        displayObject.eventMode = 'static'; // Recommended for performance

        // Create bound handlers specific to this object/action
        const handlePointerDown = (event: FederatedPointerEvent) => this.handlePointerEvent(event, action, true);
        const handlePointerUp = (event: FederatedPointerEvent) => this.handlePointerEvent(event, action, false);
        // Consider adding pointerover/pointerout for hover states if needed

        displayObject.on('pointerdown', handlePointerDown);
        displayObject.on('pointerup', handlePointerUp);
        displayObject.on('pointerupoutside', handlePointerUp); // Handle case where pointer is released outside

        this.interactiveAreas.set(displayObject, {
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
     * Unregisters a PixiJS DisplayObject, removing its listeners and association with an action.
     * @param {DisplayObject} displayObject - The object to unregister.
     */
    unregisterInteractiveArea(displayObject: Container): void {
        const registeredArea = this.interactiveAreas.get(displayObject);
        if (registeredArea) {
            for (const eventName in registeredArea.listeners) {
                displayObject.off(eventName, registeredArea.listeners[eventName]);
            }
            this.interactiveAreas.delete(displayObject);
            // Optionally reset interactivity, but might interfere if object is used elsewhere
            // displayObject.interactive = false;
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
     * @returns {Point} A PixiJS Point object representing the normalized direction vector (magnitude 0 or 1).
     *          (0,0) if no movement, (1,0) right, (-1,0) left, (0,-1) up, (0,1) down.
     *          Diagonal movement is normalized to have a magnitude of approximately 1.
     */
    getNormalizedMovementVector(): Point {
        const vec = new Point(0, 0);

        if (this.isActionActive('UP'))    vec.y -= 1;
        if (this.isActionActive('DOWN'))  vec.y += 1;
        if (this.isActionActive('LEFT'))  vec.x -= 1;
        if (this.isActionActive('RIGHT')) vec.x += 1;

        // Normalize the vector if it has magnitude (i.e., movement is occurring)
        const magnitude = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
        if (magnitude > 0) {
            vec.x /= magnitude;
            vec.y /= magnitude;
        }

        return vec;
    }

    // --- Private Event Handlers ---

    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.config || event.repeat || !this.isKeyboardEnabled) return; // Ignore repeat events and if disabled

        const action = this.getActionForKey(event.code);
        if (action && !this.actionStates.get(action)) { // Check if action exists and wasn't already pressed
            this.updateActionState(action, true, 'keyboard'); // Pass device type
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        // Allow key up events even if keyboard is disabled to release stuck keys
        if (!this.config) return;

        const action = this.getActionForKey(event.code);
        if (action && this.actionStates.get(action)) { // Check if action exists and was pressed
            this.updateActionState(action, false, 'keyboard'); // Pass device type
        }
    }

    /**
     * Handles pointer events (pointerdown, pointerup) on registered interactive areas.
     * @param {FederatedPointerEvent} event - The PixiJS pointer event.
     * @param {string} action - The action associated with the interacted object.
     * @param {boolean} isPressed - True if it's a 'press' event (pointerdown), false otherwise.
     */
    private handlePointerEvent(event: FederatedPointerEvent, action: string, isPressed: boolean): void {
        if (!this.isPointerEnabled) return; // Ignore if pointer input is disabled

        // Prevent triggering state update if the state is already correct
        if (this.actionStates.get(action) === isPressed) {
            return;
        }

        const position = { x: event.global.x, y: event.global.y };
        this.updateActionState(action, isPressed, 'pointer', position);

        // Optional: Stop propagation if needed, e.g., if UI elements overlap
        // event.stopPropagation();
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
            // Only check keyboard for now
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
    private updateActionState(action: string, isPressed: boolean, device: 'keyboard' | 'pointer' | 'gamepad' | 'unknown', position?: { x: number; y: number }): void {
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

    // --- Future Methods ---
    // TODO: Implement methods for gamepad handling
    // private handleGamepadConnected(event: GamepadEvent): void { ... }
    // private handleGamepadDisconnected(event: GamepadEvent): void { ... }
    // private pollGamepads(): void { ... }

    // TODO: Implement methods for touch handling
    // private handleTouchStart(event: TouchEvent): void { ... }
    // private handleTouchEnd(event: TouchEvent): void { ... }
    // private handleTouchMove(event: TouchEvent): void { ... }
}
