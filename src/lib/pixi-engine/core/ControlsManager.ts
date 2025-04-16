// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ControlsConfig, ActionMapping } from '../config/GameConfig';
import type { EventBus } from './EventBus';
import { CONTROLS_EVENTS, type ControlsPlayerActionPayload } from './EventTypes'; // Import necessary types and constants
import { Point } from 'pixi.js';

/**
 * Manages player input controls, mapping raw input events (keyboard, gamepad, touch)
 * to standardized game actions defined in {@link ControlsConfig}.
 * Emits {@link CONTROLS_EVENTS.PLAYER_ACTION} events via the provided {@link EventBus}.
 */
export class ControlsManager {
    private config: ControlsConfig | null = null;
    private eventBus: EventBus | null = null;
    private actionStates: Map<string, boolean> = new Map(); // Tracks if an action is currently pressed
    private isEnabled: boolean = false;

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
        if (!this.config || event.repeat) return; // Ignore repeat events

        const action = this.getActionForKey(event.code);
        if (action && !this.actionStates.get(action)) { // Check if action exists and wasn't already pressed
            this.updateActionState(action, true);
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        if (!this.config) return;

        const action = this.getActionForKey(event.code);
        if (action && this.actionStates.get(action)) { // Check if action exists and was pressed
            this.updateActionState(action, false);
        }
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
     */
    private updateActionState(action: string, isPressed: boolean): void {
        this.actionStates.set(action, isPressed);

        // TODO: Determine playerId based on config.playerMappings and device (later)
        const playerId = 'player1'; // Placeholder

        // Construct payload according to ControlsPlayerActionPayload
        const payload: ControlsPlayerActionPayload = {
            action: action,
            value: isPressed, // Use boolean value for pressed state
            playerId: playerId,
            device: 'keyboard' // Specify device type
        };

        console.log(`Action event: ${action} ${isPressed ? 'pressed' : 'released'} (Key)`); // Log human-readable state
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
