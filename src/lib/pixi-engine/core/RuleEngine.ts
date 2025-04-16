import type { EventBus } from './EventBus';
import type { EngineEvents } from './EventTypes'; // Keep base EngineEvents
import type { GameConfig, RuleConfig, RuleDefinition, ConditionDefinition, ActionDefinition } from '../config/GameConfig';
// Import implemented managers
import { type TimerManager, TimerStatus } from '../game/TimerManager'; // Import TimerStatus enum
// Import placeholder types for other managers
import type { GameStateManager } from './GameStateManager';
import type { ScoringManager } from '../game/ScoringManager';
import type { PowerUpManager } from '../game/PowerUpManager'; // Use the actual type now

/**
 * Represents a rule to be processed by the RuleEngine.
 * Extends the definition from GameConfig with runtime properties.
 */
interface RuntimeRule extends RuleDefinition {
    id: string; // Ensure ID is always present
    triggerEvent: keyof EngineEvents; // Ensure trigger is a valid event name
    priority: number; // Ensure priority has a default
    enabled: boolean; // Ensure enabled state
    // Add any runtime state if needed, e.g., cooldown timer
}

/** Context object passed to condition evaluators and action executors */
interface RuleContext {
    eventPayload: unknown;
    // Add access to managers if needed directly in conditions/actions?
}

/**
 * Manages the processing of game rules based on events and game state.
 * Rules are defined in the GameConfig and processed based on triggers, conditions, and actions.
 */
export class RuleEngine {
    private eventBus: EventBus;
    private rules: RuntimeRule[] = [];
    private isEnabled: boolean = true;
    // References to other managers needed for evaluation
    private timerManager: TimerManager;
    private gameStateManager: GameStateManager | null = null;
    private scoringManager: ScoringManager | null = null;
    private powerUpManager: PowerUpManager | null = null;

    /**
     * Creates an instance of RuleEngine.
     * @param eventBus - The central event bus for subscribing to trigger events.
     * @param config - The game configuration containing rule definitions.
     * @param managers - Object containing references to other managers needed for evaluation.
     */
    constructor(
        eventBus: EventBus,
        config: GameConfig,
        managers: {
            timerManager: TimerManager;
            // Disable lint errors for using types not yet exported
            // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
            gameStateManager?: GameStateManager;
            // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
            scoringManager?: ScoringManager;
            powerUpManager?: PowerUpManager;
        }
    ) {
        this.eventBus = eventBus;
        this.timerManager = managers.timerManager;
        this.gameStateManager = managers.gameStateManager ?? null;
        this.scoringManager = managers.scoringManager ?? null;
        this.powerUpManager = managers.powerUpManager ?? null;

        if (!this.gameStateManager) console.warn('RuleEngine: GameStateManager not provided. Some rule conditions/actions may fail.');
        if (!this.scoringManager) console.warn('RuleEngine: ScoringManager not provided. Some rule conditions/actions may fail.');
        if (!this.powerUpManager) console.warn('RuleEngine: PowerUpManager not provided. Rule conditions/actions related to power-ups will fail.');

        this.loadRules(config.rules);
        this.registerEventListeners();
        console.log(`RuleEngine initialized with ${this.rules.length} rules.`);
    }

    /**
     * Loads and validates rules from the provided configuration.
     * @param ruleConfig - The rule configuration section from GameConfig.
     */
    private loadRules(ruleConfig: RuleConfig): void {
        this.rules = (ruleConfig?.rules || [])
            .filter(def => def.id && def.triggerEvent) // Basic validation
            .map((def) => ({ // Removed unused 'index' parameter
                ...def,
                id: def.id,
                triggerEvent: def.triggerEvent as keyof EngineEvents, // Assume valid for now, add validation later
                priority: def.priority ?? 0,
                enabled: def.enabled ?? true,
                conditions: def.conditions || [],
                actions: def.actions || [],
            }))
            .sort((a, b) => b.priority - a.priority); // Sort by priority descending
        
        console.log('Rules loaded:', this.rules.map(r => `${r.id} (Prio: ${r.priority}, Event: ${r.triggerEvent})`));
    }

    /**
     * Subscribes to all unique trigger events defined in the loaded rules.
     */
    private registerEventListeners(): void {
        const uniqueEventTriggersArray = [...new Set(this.rules.map(rule => rule.triggerEvent))]; // Creates an Array from the Set

        // Iterate directly over the created array
        uniqueEventTriggersArray.forEach(eventName => {
            if (eventName) { // Ensure eventName is valid
                console.log(`RuleEngine: Registering listener for event: ${eventName}`);
                // TODO: Refine listener type based on specific event payloads
                const listener = (payload: unknown) => {
                    this.handleEvent(eventName, payload);
                };
                // Store listener reference if needed for specific removal later
                // Cast to 'any' is temporarily necessary here because the generic listener signature
                // (payload: unknown) doesn't perfectly match the specific payload type expected
                // by eventBus.on<K extends keyof EngineEvents>(eventName: K, listener: EngineEvents[K])
                // for each specific eventName K. Type narrowing happens inside handleEvent.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.eventBus.on(eventName, listener as any);
            }
        });
    }

    /**
     * Handles an incoming event from the EventBus.
     * Finds and processes rules triggered by this event.
     * @param eventName - The name of the triggered event.
     * @param payload - The payload associated with the event (type unknown).
     */
    private handleEvent(eventName: keyof EngineEvents, payload: unknown): void {
        if (!this.isEnabled) return;

        const applicableRules = this.rules.filter(rule => rule.enabled && rule.triggerEvent === eventName);

        if (applicableRules.length > 0) {
            console.log(`RuleEngine: Event '${eventName}' triggered ${applicableRules.length} rules.`);
            // Process rules (condition evaluation and action execution will be added in Subtask 6.2)
            for (const rule of applicableRules) {
                this.processRule(rule, payload);
            }
        }
    }

    /**
     * Processes a single rule: evaluates conditions and executes actions if met.
     * (Implementation details for conditions/actions will be in Subtask 6.2)
     * @param rule - The rule to process.
     * @param eventPayload - The payload of the triggering event (type unknown).
     */
    private processRule(rule: RuntimeRule, eventPayload: unknown): void {
        console.log(`RuleEngine: Processing rule '${rule.id}'...`);
        // TODO (Subtask 6.2): Evaluate rule.conditions based on game state and eventPayload
        // TODO: Add proper type checking/casting for eventPayload based on rule.triggerEvent
        const context: RuleContext = { eventPayload };
        const conditionsMet = this.evaluateConditions(rule.conditions, context);

        if (conditionsMet) {
            console.log(`RuleEngine: Conditions met for rule '${rule.id}'. Executing actions.`);
            // TODO (Subtask 6.2): Execute rule.actions
            // TODO: Add proper type checking/casting for eventPayload based on rule.triggerEvent
            this.executeActions(rule.actions, context);
        }
    }

    /**
     * Evaluates the conditions of a rule.
     * @param conditions - The conditions to evaluate.
     * @param context - The rule context containing event payload and potentially other data.
     * @returns True if all conditions are met, false otherwise.
     */
    private evaluateConditions(conditions: ConditionDefinition[], context: RuleContext): boolean {
        if (conditions.length === 0) return true; // No conditions means they are met

        for (const condition of conditions) {
            if (!this.evaluateSingleCondition(condition, context)) {
                console.log(`RuleEngine: Condition type '${condition.type}' failed.`);
                return false; // If any condition fails, the rule doesn't run
            }
        }
        return true; // All conditions passed
    }

    /** Evaluates a single condition */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private evaluateSingleCondition(condition: ConditionDefinition, context: RuleContext): boolean {
        try {
            switch (condition.type) {
                case 'compareState':
                    // TODO: Implement state comparison using GameStateManager
                    // Example: Get value from gameStateManager based on condition.property
                    // const actualValue = this.gameStateManager?.getStateValue(condition.property);
                    console.warn(`RuleEngine: Condition type 'compareState' not implemented for property '${condition.property}'.`);
                    return false; // Placeholder

                case 'timerCheck':
                    // Example: Check timer status or remaining time
                    if (!this.timerManager) return false;
                    const timerId = String(condition.property); // Assume property is timer ID
                    const timer = this.timerManager.getTimer(timerId);
                    if (!timer) {
                        console.warn(`RuleEngine: Timer '${timerId}' not found for condition check.`);
                        return false;
                    }
                    // Example check: is timer running?
                    if (condition.operator === 'eq' && condition.value === 'running') {
                        return timer.status === TimerStatus.RUNNING; // Use imported enum
                    }
                    // Example check: time remaining less than value?
                    if (condition.operator === 'lt' && typeof condition.value === 'number') {
                         const remaining = this.timerManager.getTimeRemaining(timerId);
                         return remaining < condition.value;
                    }
                    // Add more timer checks (gt, gte, lte, completed, etc.) based on operator/value
                     console.warn(`RuleEngine: Unhandled operator '${condition.operator}' or value for timerCheck condition.`);
                     return false;

                case 'checkPowerup':
                    if (!this.powerUpManager) return false;
                    const powerupTypeId = String(condition.property); // Assume property is power-up type ID
                    // Assume value is the targetId (player/team) to check against
                    // TODO: Consider allowing context.eventPayload to determine targetId dynamically
                    const targetId = condition.value as string | number;
                    if (targetId === undefined || targetId === null) {
                         console.warn(`RuleEngine: Missing targetId (condition.value) for checkPowerup condition.`);
                         return false;
                    }
                    const isActive = this.powerUpManager.isPowerUpActiveForTarget(powerupTypeId, targetId);
                    // Basic check for equality (power-up active == true)
                    // TODO: Add support for checking if NOT active (operator: 'ne')
                    if (condition.operator === 'eq') {
                         return isActive; // Checks if power-up is active
                    } else if (condition.operator === 'ne') {
                         return !isActive; // Check if power-up is NOT active
                    }
                    console.warn(`RuleEngine: Unsupported operator '${condition.operator}' for checkPowerup condition.`);
                    return false;

                default:
                    console.warn(`RuleEngine: Unknown condition type: ${condition.type}`);
                    return false;
            }
        } catch (error) {
            console.error(`RuleEngine: Error evaluating condition type '${condition.type}':`, error);
            return false;
        }
    }

    // TODO: Add comparison helper function for different operators (eq, ne, gt, lt, gte, lte, contains)
    // private compareValues(actual: unknown, operator: ConditionDefinition['operator'], expected: unknown): boolean { ... }

    /**
     * Executes the actions of a rule.
     * @param actions - The actions to execute.
     * @param context - The rule context containing event payload and potentially other data.
     */
    private executeActions(actions: ActionDefinition[], context: RuleContext): void {
        actions.forEach(action => {
            try {
                this.executeSingleAction(action, context);
            } catch (error) {
                 console.error(`RuleEngine: Error executing action type '${action.type}':`, error);
            }
        });
    }

    /** Executes a single action */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private executeSingleAction(action: ActionDefinition, context: RuleContext): void {
        console.log(`RuleEngine: Executing action '${action.type}' with params: ${JSON.stringify(action.params)}`);
        const params = action.params || {}; // Ensure params is an object

        switch (action.type) {
            case 'changePhase':
                if (!this.gameStateManager) {
                    console.warn('RuleEngine: Cannot execute changePhase action, GameStateManager missing.');
                    return;
                }
                // Type check for phase parameter
                if (typeof params.phase === 'string') {
                    // this.gameStateManager.changePhase(params.phase);
                    console.log(`   -> (Mock) Changing phase to '${params.phase}'`);
                } else {
                    console.warn(`RuleEngine: Missing or invalid 'phase' string parameter for changePhase action.`);
                }
                break;

            case 'modifyScore':
                if (!this.scoringManager) {
                     console.warn('RuleEngine: Cannot execute modifyScore action, ScoringManager missing.');
                    return;
                }
                // TODO: Implement score modification based on params (teamId, value, multiplier)
                // Example with type checking:
                // const teamId = params.teamId as string | number; 
                // const value = typeof params.value === 'number' ? params.value : undefined;
                // if (teamId !== undefined && value !== undefined) { ... }
                console.log(`   -> (Mock) Modifying score with params: ${JSON.stringify(params)}`);
                break;

            case 'startTimer':
                 if (!this.timerManager) return;
                 // Type checks for timer parameters
                 const timerId = typeof params.timerId === 'string' ? params.timerId : undefined;
                 const duration = typeof params.duration === 'number' ? params.duration : undefined;
                 if (timerId && duration !== undefined) {
                     if (!this.timerManager.getTimer(timerId)) {
                          this.timerManager.createTimer(timerId, duration);
                     }
                     this.timerManager.startTimer(timerId);
                     console.log(`   -> Started timer '${timerId}' with duration ${duration}`);
                 } else {
                     console.warn(`RuleEngine: Missing or invalid 'timerId' (string) or 'duration' (number) parameter for startTimer action.`);
                 }
                 break;

            case 'activatePowerup':
                 if (!this.powerUpManager) {
                    console.warn('RuleEngine: Cannot execute activatePowerup action, PowerUpManager missing.');
                    return;
                 }
                 // Type checks for power-up parameters
                 const typeId = typeof params.typeId === 'string' ? params.typeId : undefined;
                 // TODO: Determine targetId more robustly - from params or event context?
                 const targetId = (typeof params.targetId === 'string' || typeof params.targetId === 'number') ? params.targetId : 'player1'; // Example default
                 if (typeId) {
                    this.powerUpManager.activatePowerUp(typeId, targetId);
                    console.log(`   -> Activated power-up '${typeId}' for target '${targetId}'`);
                 } else {
                    console.warn(`RuleEngine: Missing or invalid 'typeId' (string) parameter for activatePowerup action.`);
                 }
                 break;

            // case 'emitEvent': // Example for emitting custom events
            //     const eventName = action.params?.eventName as keyof EngineEvents;
            //     const payload = action.params?.payload; // Payload structure depends on event
            //     if (eventName) {
            //         this.eventBus.emit(eventName, payload as any); // Cast payload carefully
            //         console.log(`   -> Emitted custom event '${eventName}'`);
            //     } else {
            //         console.warn(`RuleEngine: Missing 'eventName' parameter for emitEvent action.`);
            //     }
            //     break;

            // TODO: Add 'deactivatePowerup' action?
            // case 'deactivatePowerup':
            //     if (!this.powerUpManager) return;
            //     const instanceId = action.params?.instanceId as string; // Need instance ID
            //     // OR find instance by typeId and targetId?
            //     if (instanceId) {
            //         this.powerUpManager.deactivatePowerUp(instanceId);
            //         console.log(`   -> Deactivated power-up instance '${instanceId}'`);
            //     } else {
            //         console.warn(`RuleEngine: Missing 'instanceId' parameter for deactivatePowerup action.`);
            //     }
            //     break;

            default:
                console.warn(`RuleEngine: Unknown action type: ${action.type}`);
        }
    }

    /**
     * Enables or disables the processing of all rules.
     * @param enable - Set to true to enable, false to disable.
     */
    setEnabled(enable: boolean): void {
        this.isEnabled = enable;
        console.log(`RuleEngine ${enable ? 'enabled' : 'disabled'}.`);
    }

    /**
     * Cleans up resources, removing event listeners.
     */
    destroy(): void {
        console.log('Destroying RuleEngine...');
        // Unsubscribe from all events
        const uniqueEventTriggersArray = [...new Set(this.rules.map(rule => rule.triggerEvent))]; // Creates an Array from the Set

        // Iterate directly over the created array
        uniqueEventTriggersArray.forEach(eventName => {
            if (eventName) {
                // NOTE: This removes ALL listeners for the eventName.
                // For more precise cleanup, the specific listener function reference
                // registered in registerEventListeners would need to be stored and passed to off().
                this.eventBus.off(eventName);
            }
        });
        this.rules = [];
        console.log('RuleEngine destroyed.');
    }
}
