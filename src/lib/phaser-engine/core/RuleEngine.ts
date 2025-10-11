import { EventBus } from './EventBus';
import type { EngineEvents } from './EventTypes';
import type { GameConfig, RuleConfig, RuleDefinition, ConditionDefinition, ActionDefinition } from '../config/GameConfig';
import { type TimerManager, TimerStatus } from '../game/TimerManager';
import { GameStateManager, GamePhase } from './GameStateManager';
import { ScoringManager } from '../game/ScoringManager';
import { PowerUpManager } from '../game/PowerUpManager';
import { AudioManager } from './AudioManager';
import { StorageManager } from './StorageManager';

/**
 * Represents a rule to be processed by the RuleEngine.
 * Extends the definition from GameConfig with runtime properties.
 */
interface RuntimeRule extends RuleDefinition {
    id: string;
    triggerEvent: keyof EngineEvents;
    priority: number;
    enabled: boolean;
}

/** Context object passed to condition evaluators and action executors */
interface RuleContext {
    eventPayload: unknown;
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
    private timerManager?: TimerManager;
    private gameStateManager?: GameStateManager;
    private scoringManager?: ScoringManager;
    private powerUpManager?: PowerUpManager;
    private audioManager?: AudioManager;
    private storageManager?: StorageManager;

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
            gameStateManager?: GameStateManager;
            scoringManager?: ScoringManager;
            powerUpManager?: PowerUpManager;
            timerManager?: TimerManager;
            storageManager?: StorageManager;
            audioManager?: AudioManager;
        }
    ) {
        this.eventBus = eventBus;
        this.gameStateManager = managers.gameStateManager ?? undefined;
        this.scoringManager = managers.scoringManager ?? undefined;
        this.powerUpManager = managers.powerUpManager ?? undefined;
        this.timerManager = managers.timerManager ?? undefined;
        this.storageManager = managers.storageManager ?? undefined;
        this.audioManager = managers.audioManager ?? undefined;

        if (!this.gameStateManager) console.warn('PhaserRuleEngine: GameStateManager not provided. Some rule conditions/actions may fail.');
        if (!this.scoringManager) console.warn('PhaserRuleEngine: ScoringManager not provided. Some rule conditions/actions may fail.');
        if (!this.powerUpManager) console.warn('PhaserRuleEngine: PowerUpManager not provided. Rule conditions/actions related to power-ups will fail.');

        this.loadRules(config.rules);
        this.registerEventListeners();
        console.log(`PhaserRuleEngine initialized with ${this.rules.length} rules.`);
    }

    /**
     * Loads and validates rules from the provided configuration.
     * @param ruleConfig - The rule configuration section from GameConfig.
     */
    private loadRules(ruleConfig: RuleConfig): void {
        this.rules = (ruleConfig?.rules || [])
            .filter(def => def.id && def.triggerEvent)
            .map((def) => ({
                ...def,
                id: def.id,
                triggerEvent: def.triggerEvent as keyof EngineEvents,
                priority: def.priority ?? 0,
                enabled: def.enabled ?? true,
                conditions: def.conditions || [],
                actions: def.actions || [],
            }))
            .sort((a, b) => b.priority - a.priority);
        
        console.log('PhaserRuleEngine: Rules loaded:', this.rules.map(r => `${r.id} (Prio: ${r.priority}, Event: ${r.triggerEvent})`));
    }

    /**
     * Subscribes to all unique trigger events defined in the loaded rules.
     */
    private registerEventListeners(): void {
        const uniqueEventTriggersArray = [...new Set(this.rules.map(rule => rule.triggerEvent))];

        uniqueEventTriggersArray.forEach(eventName => {
            if (eventName) {
                console.log(`PhaserRuleEngine: Registering listener for event: ${eventName}`);
                const listener = (payload: unknown) => {
                    this.handleEvent(eventName, payload);
                };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.eventBus.on(eventName, listener as any);
            }
        });
    }

    /**
     * Handles an incoming event from the EventBus.
     * Finds and processes rules triggered by this event.
     * @param eventName - The name of the triggered event.
     * @param payload - The payload associated with the event.
     */
    private handleEvent(eventName: keyof EngineEvents, payload: unknown): void {
        if (!this.isEnabled) return;

        const applicableRules = this.rules.filter(rule => rule.enabled && rule.triggerEvent === eventName);

        if (applicableRules.length > 0) {
            console.log(`PhaserRuleEngine: Event '${eventName}' triggered ${applicableRules.length} rules.`);
            for (const rule of applicableRules) {
                this.processRule(rule, payload);
            }
        }
    }

    /**
     * Processes a single rule: evaluates conditions and executes actions if met.
     * @param rule - The rule to process.
     * @param eventPayload - The payload of the triggering event.
     */
    private processRule(rule: RuntimeRule, eventPayload: unknown): void {
        console.log(`PhaserRuleEngine: Processing rule '${rule.id}'...`);
        const context: RuleContext = { eventPayload };
        const conditionsMet = this.evaluateConditions(rule.conditions, context);

        if (conditionsMet) {
            console.log(`PhaserRuleEngine: Conditions met for rule '${rule.id}'. Executing actions.`);
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
        if (conditions.length === 0) return true;

        for (const condition of conditions) {
            if (!this.evaluateSingleCondition(condition, context)) {
                console.log(`PhaserRuleEngine: Condition type '${condition.type}' failed.`);
                return false;
            }
        }
        return true;
    }

    /** Evaluates a single condition */
    private evaluateSingleCondition(condition: ConditionDefinition, context: RuleContext): boolean {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eventPayload = context.eventPayload as any;

            switch (condition.type) {
                case 'compareState':
                    if (eventPayload && Object.prototype.hasOwnProperty.call(eventPayload, condition.property)) {
                        const actualValue = eventPayload[condition.property];
                        const conditionMet = this.compareValues(actualValue, condition.operator, condition.value);
                        console.log(`PhaserRuleEngine: compareState (event) '${condition.property}' (${actualValue}) ${condition.operator} ${condition.value} -> ${conditionMet}`);
                        return conditionMet;
                    }
                    
                    console.warn(`PhaserRuleEngine: Condition 'compareState' - Property '${condition.property}' not found in event payload OR GameStateManager check not implemented.`);
                    return false;

                case 'timerCheck':
                    if (!this.timerManager) return false;
                    const timerId = String(condition.property);
                    const timer = this.timerManager.getTimer(timerId);
                    if (!timer) {
                        console.warn(`PhaserRuleEngine: Timer '${timerId}' not found for condition check.`);
                        return false;
                    }
                    if (condition.operator === 'eq' && condition.value === 'running') {
                        return timer.status === TimerStatus.RUNNING;
                    }
                    if (condition.operator === 'lt' && typeof condition.value === 'number') {
                         const remaining = this.timerManager.getTimeRemaining(timerId);
                         return remaining < condition.value;
                    }
                     console.warn(`PhaserRuleEngine: Unhandled operator '${condition.operator}' or value for timerCheck condition.`);
                     return false;

                case 'checkPowerup':
                    if (!this.powerUpManager) return false;
                    const powerupTypeId = String(condition.property);
                    const targetId = condition.value as string | number;
                    if (targetId === undefined || targetId === null) {
                         console.warn(`PhaserRuleEngine: Missing targetId (condition.value) for checkPowerup condition.`);
                         return false;
                    }
                    const isActive = this.powerUpManager.isPowerUpActiveForTarget(powerupTypeId, targetId);
                    if (condition.operator === 'eq') {
                         return isActive;
                    } else if (condition.operator === 'ne') {
                         return !isActive;
                    }
                    console.warn(`PhaserRuleEngine: Unsupported operator '${condition.operator}' for checkPowerup condition.`);
                    return false;

                default:
                    console.warn(`PhaserRuleEngine: Unknown condition type: ${condition.type}`);
                    return false;
            }
        } catch (error) {
            console.error(`PhaserRuleEngine: Error evaluating condition type '${condition.type}' for property '${condition.property}':`, error);
            return false;
        }
    }

    // Comparison helper function
    private compareValues(actual: unknown, operator: ConditionDefinition['operator'], expected: unknown): boolean {
        switch (operator) {
            case 'eq': return actual === expected;
            case 'ne': return actual !== expected;
            case 'gt': return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
            case 'lt': return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
            case 'gte': return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
            case 'lte': return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
            case 'contains': 
                if (typeof actual === 'string' && typeof expected === 'string') {
                    return actual.includes(expected);
                }
                return false;
            default:
                console.warn(`PhaserRuleEngine: Unknown comparison operator: ${operator}`);
                return false;
        }
    }

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
                 console.error(`PhaserRuleEngine: Error executing action type '${action.type}':`, error);
            }
        });
    }

    /** Executes a single action */
    private executeSingleAction(action: ActionDefinition, context: RuleContext): void {
        console.log(`PhaserRuleEngine: Executing action '${action.type}' with params: ${JSON.stringify(action.params)}`);
        const params = action.params || {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventPayload = context.eventPayload as any;

        switch (action.type) {
            case 'changePhase':
                if (!this.gameStateManager) {
                    console.warn('PhaserRuleEngine: Cannot execute changePhase action, GameStateManager missing.');
                    return;
                }
                const newPhaseValue = params.newPhase;
                if (newPhaseValue !== undefined && Object.values(GamePhase).includes(newPhaseValue as GamePhase)) {
                    const validPhase = newPhaseValue as GamePhase;
                    this.gameStateManager.setPhase(validPhase);
                    console.log(`   -> Called gameStateManager.setPhase(${validPhase})`);
                } else {
                    console.warn(`PhaserRuleEngine: Missing or invalid 'newPhase' (must be a valid GamePhase value) parameter for changePhase action. Received: ${newPhaseValue}`);
                }
                break;

            case 'modifyScore': {
                if (!this.scoringManager) {
                    console.warn('PhaserRuleEngine: Cannot execute modifyScore action, ScoringManager missing.');
                    return;
                }

                const mode = params.mode || 'fixed';
                const target = params.target;
                let teamId: string | number | undefined;

                if (target === 'payload.teamId') {
                    const payloadTeamId = eventPayload?.teamId;
                    if (typeof payloadTeamId === 'string' || typeof payloadTeamId === 'number') {
                        teamId = payloadTeamId;
                    } else {
                        console.warn(`PhaserRuleEngine: modifyScore target was 'payload.teamId', but teamId not found or invalid in event payload.`);
                        return;
                    }
                } else if (typeof target === 'string' || typeof target === 'number') {
                    teamId = target;
                } else {
                     console.warn(`PhaserRuleEngine: Missing or invalid 'target' (string | number | 'payload.teamId') parameter for modifyScore action. Received target: ${target}`);
                     return;
                }

                const scoreMultiplier = typeof eventPayload?.scoreMultiplier === 'number' && eventPayload.scoreMultiplier > 0 
                                        ? eventPayload.scoreMultiplier 
                                        : 1;
                console.log(`   -> [PhaserRuleEngine.modifyScore] Received event payload:`, context.eventPayload);
                console.log(`   -> [PhaserRuleEngine.modifyScore] Score multiplier determined from payload: ${scoreMultiplier}`);

                if (mode === 'progressive') {
                    const pointsPerSecond = typeof params.pointsPerSecond === 'number' ? params.pointsPerSecond : undefined;
                    const remainingTimeMs = typeof eventPayload?.remainingTimeMs === 'number' ? eventPayload.remainingTimeMs : undefined;

                    if (pointsPerSecond === undefined) {
                        console.warn(`PhaserRuleEngine: Missing or invalid 'pointsPerSecond' (number) parameter for progressive modifyScore action.`);
                        return;
                    }
                    
                    if (remainingTimeMs === undefined || remainingTimeMs <= 0) {
                        console.log(`PhaserRuleEngine: Progressive score: No time remaining in event payload or invalid value (${remainingTimeMs}). Awarding 0 points.`);
                    } else {
                        const remainingSeconds = Math.ceil(remainingTimeMs / 1000);
                        const calculatedPoints = remainingSeconds * pointsPerSecond;
                        const finalPoints = calculatedPoints * scoreMultiplier;

                        console.log(`   -> Progressive score: ${remainingSeconds}s * ${pointsPerSecond}/s * ${scoreMultiplier}x = ${finalPoints} points for team ${teamId}`);
                        console.log(`   -> [PhaserRuleEngine.modifyScore - Progressive] Calculated points: ${calculatedPoints}, Final points (after ${scoreMultiplier}x): ${finalPoints}`);
                        if (finalPoints > 0) {
                            this.scoringManager.addScore(teamId, finalPoints);
                            console.log(`   -> Called scoringManager.addScore(${teamId}, ${finalPoints})`);
                        }
                    }

                } else {
                    const points = typeof params.points === 'number' ? params.points : undefined;

                    if (points === undefined) {
                        console.warn(`PhaserRuleEngine: Missing or invalid 'points' (number) parameter for fixed modifyScore action.`);
                        return;
                    }

                    const finalPoints = points * scoreMultiplier;

                    console.log(`   -> Fixed score: ${points} points * ${scoreMultiplier}x = ${finalPoints} points for team ${teamId}`);
                    console.log(`   -> [PhaserRuleEngine.modifyScore - Fixed] Base points: ${points}, Final points (after ${scoreMultiplier}x): ${finalPoints}`);
                    if (finalPoints > 0) {
                        this.scoringManager.addScore(teamId, finalPoints);
                        console.log(`   -> Called scoringManager.addScore(${teamId}, ${finalPoints})`);
                    } else if (finalPoints < 0) {
                        this.scoringManager.subtractScore(teamId, Math.abs(finalPoints));
                        console.log(`   -> Called scoringManager.subtractScore(${teamId}, ${Math.abs(finalPoints)})`);
                    }
                }
                break;
            }

            case 'playSound':
                if (!this.audioManager) {
                    console.warn('PhaserRuleEngine: Cannot execute playSound action, AudioManager missing.');
                    return;
                }
                if (typeof params.soundId === 'string') {
                    this.audioManager.play(params.soundId);
                    console.log(`   -> Playing sound '${params.soundId}'`);
                } else {
                    console.warn(`PhaserRuleEngine: Missing or invalid 'soundId' string parameter for playSound action.`);
                }
                break;

            case 'startTimer':
                 if (!this.timerManager) return;
                 const timerId = typeof params.timerId === 'string' ? params.timerId : undefined;
                 const duration = typeof params.duration === 'number' ? params.duration : undefined;
                 if (timerId && duration !== undefined) {
                     if (!this.timerManager.getTimer(timerId)) {
                          this.timerManager.createTimer(timerId, duration);
                     }
                     this.timerManager.startTimer(timerId);
                     console.log(`   -> Started timer '${timerId}' with duration ${duration}`);
                 } else {
                     console.warn(`PhaserRuleEngine: Missing or invalid 'timerId' (string) or 'duration' (number) parameter for startTimer action.`);
                 }
                 break;

            case 'activatePowerup':
                 if (!this.powerUpManager) {
                    console.warn('PhaserRuleEngine: Cannot execute activatePowerup action, PowerUpManager missing.');
                    return;
                 }
                 const typeId = typeof params.typeId === 'string' ? params.typeId : undefined;
                 const targetId = (typeof params.targetId === 'string' || typeof params.targetId === 'number') ? params.targetId : 'player1';
                 if (typeId) {
                    this.powerUpManager.activatePowerUp(typeId, targetId);
                    console.log(`   -> Activated power-up '${typeId}' for target '${targetId}'`);
                 } else {
                    console.warn(`PhaserRuleEngine: Missing or invalid 'typeId' (string) parameter for activatePowerup action.`);
                 }
                 break;

            default:
                console.warn(`PhaserRuleEngine: Unknown action type: ${action.type}`);
        }
    }

    /**
     * Enables or disables the processing of all rules.
     * @param enable - Set to true to enable, false to disable.
     */
    setEnabled(enable: boolean): void {
        this.isEnabled = enable;
        console.log(`PhaserRuleEngine ${enable ? 'enabled' : 'disabled'}.`);
    }

    /**
     * Cleans up resources, removing event listeners.
     */
    destroy(): void {
        console.log('Destroying PhaserRuleEngine...');
        const uniqueEventTriggersArray = [...new Set(this.rules.map(rule => rule.triggerEvent))];

        uniqueEventTriggersArray.forEach(eventName => {
            if (eventName) {
                this.eventBus.off(eventName);
            }
        });
        this.rules = [];
        console.log('PhaserRuleEngine destroyed.');
    }
}
