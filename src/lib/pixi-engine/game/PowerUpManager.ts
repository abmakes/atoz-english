import type { EventBus } from '../core/EventBus';
// Re-add event types needed for activation/deactivation
import { POWERUP_EVENTS, type PowerUpEventPayload } from '../core/EventTypes';
import type { GameConfig, PowerupConfig, PowerupDefinition } from '../config/GameConfig';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating unique instance IDs

/**
 * Represents the runtime state of an active power-up instance.
 * Includes the original definition plus activation details.
 */
export interface ActivePowerUp extends PowerupDefinition {
    /** A unique identifier generated for this specific activation instance. */
    instanceId: string;
    /** The ID of the entity (player, team) this power-up instance is affecting. */
    targetId: string | number;
    /** The system timestamp (milliseconds since epoch) when the power-up was activated. */
    activationTime: number;
    /** The remaining duration in milliseconds, if the power-up is timed. Undefined otherwise. */
    remainingDurationMs?: number;
}

/**
 * Manages the lifecycle and state of power-ups within the game.
 * Handles loading power-up definitions, activating/deactivating instances,
 * tracking durations, and emitting related events.
 */
export class PowerUpManager {
    private eventBus: EventBus;
    private availablePowerups: Map<string, PowerupDefinition> = new Map();
    private activePowerups: Map<string, ActivePowerUp> = new Map(); // Keyed by instanceId
    // TODO: Potentially group active powerups by targetId for faster lookup

    /**
     * Creates an instance of PowerUpManager.
     * @param {EventBus} eventBus - The central event bus for emitting power-up related events (e.g., ACTIVATED, DEACTIVATED, EXPIRED).
     * @param {GameConfig} config - The game configuration containing the definitions of available power-ups under the `powerups` key.
     */
    constructor(eventBus: EventBus, config: GameConfig) {
        this.eventBus = eventBus;
        this.loadDefinitions(config.powerups);
        console.log(`PowerUpManager initialized with ${this.availablePowerups.size} available power-up types.`);
    }

    /**
     * Loads and stores the definitions of available power-ups from the configuration.
     * Called internally by the constructor.
     * @private
     * @param {PowerupConfig} powerupConfig - The power-up configuration section from GameConfig.
     */
    private loadDefinitions(powerupConfig: PowerupConfig): void {
        this.availablePowerups.clear();
        (powerupConfig?.availablePowerups || []).forEach(def => {
            if (def.id) { // Basic validation
                this.availablePowerups.set(def.id, def);
            }
        });
         console.log('Available power-ups loaded:', Array.from(this.availablePowerups.keys()));
    }

    /**
     * Checks if a specific type of power-up is currently active for a given target entity.
     * @param {string} typeId - The ID of the power-up type (defined in GameConfig, e.g., 'double_points').
     * @param {string | number} targetId - The ID of the target entity (e.g., player ID, team ID) to check.
     * @returns {boolean} True if at least one instance of the power-up type is active for the target, false otherwise.
     */
    isPowerUpActiveForTarget(typeId: string, targetId: string | number): boolean {
        for (const powerup of this.activePowerups.values()) {
            if (powerup.id === typeId && powerup.targetId === targetId) {
                return true;
            }
        }
        return false;
    }

    /**
     * Gets all active power-up instances currently affecting a specific target entity.
     * @param {string | number} targetId - The ID of the target entity.
     * @returns {ActivePowerUp[]} An array of active power-up instances for the target. Returns an empty array if none are active.
     */
    getActivePowerupsForTarget(targetId: string | number): ActivePowerUp[] {
        return Array.from(this.activePowerups.values())
                   .filter(powerup => powerup.targetId === targetId);
    }

    /**
     * Retrieves the static definition of a power-up type.
     * @param {string} typeId - The ID of the power-up type.
     * @returns {PowerupDefinition | undefined} The definition if found, otherwise undefined.
     */
    getPowerupDefinition(typeId: string): PowerupDefinition | undefined {
        return this.availablePowerups.get(typeId);
    }

    // --- Methods for Activation / Deactivation / Duration (Subtask 6.4) ---

    /**
     * Activates a power-up of a specific type for a target entity.
     * Generates a unique instance ID for this activation.
     * Emits a `POWERUP_EVENTS.ACTIVATED` event.
     * @param {string} typeId - The ID of the power-up type to activate.
     * @param {string | number} targetId - The ID of the entity (player, team) receiving the power-up.
     * @returns {ActivePowerUp | null} A copy of the newly created ActivePowerUp instance, or null if the power-up type doesn't exist.
     */
    activatePowerUp(typeId: string, targetId: string | number): ActivePowerUp | null {
        const definition = this.getPowerupDefinition(typeId);
        if (!definition) {
            console.warn(`PowerUpManager: Cannot activate unknown power-up type '${typeId}'.`);
            return null;
        }

        // TODO: Add logic for stacking/non-stacking based on definition?
        // For now, allow multiple instances of the same type for a target.

        const instanceId = uuidv4();
        const activationTime = Date.now();
        const remainingDurationMs = definition.durationSeconds !== undefined ? definition.durationSeconds * 1000 : undefined;

        const activePowerup: ActivePowerUp = {
            ...definition,
            instanceId,
            targetId,
            activationTime,
            remainingDurationMs,
        };

        this.activePowerups.set(instanceId, activePowerup);
        console.log(`PowerUpManager: Activated power-up '${typeId}' (Instance: ${instanceId}) for target '${targetId}'. Duration: ${remainingDurationMs ?? 'Infinite'}ms`);

        // Emit event
        const payload: PowerUpEventPayload = {
            powerUpId: instanceId,
            type: typeId,
            targetId: targetId,
            duration: definition.durationSeconds,
        };
        this.eventBus.emit(POWERUP_EVENTS.ACTIVATED, payload);

        return { ...activePowerup }; // Return a copy
    }

    /**
     * Deactivates a specific instance of an active power-up using its unique instance ID.
     * Emits a `POWERUP_EVENTS.DEACTIVATED` or `POWERUP_EVENTS.EXPIRED` event.
     * @param {string} instanceId - The unique instance ID of the power-up activation to deactivate.
     * @param {boolean} [expired=false] - Optional flag indicating if deactivation is due to expiration. Defaults to false.
     */
    deactivatePowerUp(instanceId: string, expired = false): void {
        const powerup = this.activePowerups.get(instanceId);
        if (!powerup) {
            // console.warn(`PowerUpManager: Cannot deactivate non-existent power-up instance '${instanceId}'.`);
            return;
        }

        this.activePowerups.delete(instanceId);
        console.log(`PowerUpManager: Deactivated power-up '${powerup.id}' (Instance: ${instanceId}) for target '${powerup.targetId}'. Reason: ${expired ? 'Expired' : 'Manual'}`);

        // Emit event
        const payload: PowerUpEventPayload = {
            powerUpId: instanceId,
            type: powerup.id,
            targetId: powerup.targetId,
        };
        const eventName = expired ? POWERUP_EVENTS.EXPIRED : POWERUP_EVENTS.DEACTIVATED;
        this.eventBus.emit(eventName, payload);
    }

    /**
     * Updates the remaining duration of all active, timed power-ups.
     * This method should be called regularly within the main game loop.
     * Automatically deactivates power-ups whose duration expires.
     * @param {number} deltaTimeMs - The time elapsed since the last update call, in milliseconds.
     */
    update(deltaTimeMs: number): void {
        if (deltaTimeMs <= 0) return;

        // Use keys().next() pattern for safe iteration while potentially deleting
        const instanceIds = Array.from(this.activePowerups.keys());
        for (const instanceId of instanceIds) {
            const powerup = this.activePowerups.get(instanceId);
            // Check if powerup still exists in case it was deactivated during the loop
            if (powerup && powerup.remainingDurationMs !== undefined) {
                powerup.remainingDurationMs -= deltaTimeMs;

                if (powerup.remainingDurationMs <= 0) {
                    this.deactivatePowerUp(instanceId, true); // Deactivate due to expiration
                }
            }
        }
    }

    /**
     * Cleans up resources used by the PowerUpManager.
     * Clears internal maps of available and active power-ups.
     * Should be called when the manager is no longer needed (e.g., engine shutdown).
     */
    destroy(): void {
        console.log('Destroying PowerUpManager...');
        this.availablePowerups.clear();
        this.activePowerups.clear();
        // TODO: Clear any running timers or intervals related to power-ups
        console.log('PowerUpManager destroyed.');
    }
}
