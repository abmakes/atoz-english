import type { EventBus } from '../core/EventBus';
import { POWERUP_EVENTS, type PowerUpEventPayload } from '../core/EventTypes';
import type { GameConfig } from '../config/GameConfig';
import type { PowerupConfig, PowerupDefinition, PowerPolarity } from '../config/PowerupConfig';

/**
 * Runtime state of an active power-up instance.
 */
export interface ActivePowerUp extends PowerupDefinition {
  instanceId: string;
  targetId: string | number;
  activationTime: number;
  remainingDurationMs?: number;
}

/**
 * A single slot shown on the spin wheel (duplicates allowed).
 */
export interface SelectablePowerupInfo {
  id: string;
  displayName: string;
  /** Stable id for this wheel slot — used when replacing a buff with a debuff. */
  slotId?: string;
  polarity?: PowerPolarity;
}

interface WheelSlot {
  powerupId: string;
  slotId: string;
}

/**
 * Manages power-up definitions, activation, timed expiry, and the dynamic spin-wheel pool.
 *
 * Wheel rules:
 * - Starts with `initialWheelCopies` of each enabled buff (except catch-up powers like comeback).
 * - After a buff is won, that slot is permanently replaced by a random enabled power-down.
 * - Comeback is injected only when the spinning team is behind by more than minPointsBehind.
 */
export class PowerUpManager {
  private eventBus: EventBus;
  private config: GameConfig;
  private availablePowerups: Map<string, PowerupDefinition> = new Map();
  private activePowerups: Map<string, ActivePowerUp> = new Map();

  private wheelSlots: WheelSlot[] = [];
  private wheelInitialized = false;

  constructor(eventBus: EventBus, config: GameConfig) {
    this.eventBus = eventBus;
    this.config = config;
    this.loadDefinitions(config.powerups);
    console.log(`PowerUpManager initialized with ${this.availablePowerups.size} available power-up types.`);
  }

  private loadDefinitions(powerupConfig: PowerupConfig): void {
    this.availablePowerups.clear();
    (powerupConfig?.availablePowerups || []).forEach((def) => {
      if (def.id) {
        this.availablePowerups.set(def.id, def);
      }
    });
    this.wheelSlots = [];
    this.wheelInitialized = false;
  }

  /**
   * Legacy flat list (unique enabled buffs). Prefer getWheelSegmentsForSpin for the spinner.
   */
  public getSelectablePowerups(): SelectablePowerupInfo[] {
    if (!this.config.powerups?.powerupsEnabled) {
      return [];
    }
    return this.getEnabledBuffDefinitions()
      .filter((d) => (d.initialWheelCopies ?? 2) > 0)
      .map((d) => ({
        id: d.id,
        displayName: d.name || d.id,
        polarity: d.polarity,
      }));
  }

  private getEnabledBuffDefinitions(): PowerupDefinition[] {
    return Array.from(this.availablePowerups.values()).filter((d) => d.polarity === 'buff');
  }

  private getEnabledDebuffDefinitions(): PowerupDefinition[] {
    return Array.from(this.availablePowerups.values()).filter((d) => d.polarity === 'debuff');
  }

  /**
   * Builds the persistent wheel pool once: N copies of each standard buff.
   */
  public ensureWheelInitialized(): void {
    if (this.wheelInitialized) return;
    if (!this.config.powerups?.powerupsEnabled) {
      this.wheelInitialized = true;
      return;
    }

    this.wheelSlots = [];
    for (const def of this.getEnabledBuffDefinitions()) {
      const copies = def.initialWheelCopies ?? 0;
      for (let i = 0; i < copies; i++) {
        this.wheelSlots.push({
          powerupId: def.id,
          slotId: `${def.id}-${i}`,
        });
      }
    }

    this.wheelInitialized = true;
    console.log(
      '[PowerUpManager] Wheel pool initialized:',
      this.wheelSlots.map((s) => s.powerupId)
    );
  }

  /**
   * Segments for the next spin for a given team, based on current standings.
   * Comeback slots are added temporarily when the team is far enough behind.
   */
  public getWheelSegmentsForSpin(
    teamId: string | number,
    scores: Record<string | number, number>
  ): SelectablePowerupInfo[] {
    this.ensureWheelInitialized();

    const segments: SelectablePowerupInfo[] = this.wheelSlots.map((slot) => {
      const def = this.getPowerupDefinition(slot.powerupId);
      return {
        id: slot.powerupId,
        displayName: def?.name ?? (slot.powerupId === 'none' ? 'No Power-up' : slot.powerupId),
        slotId: slot.slotId,
        polarity: def?.polarity ?? (slot.powerupId === 'none' ? undefined : 'buff'),
      };
    });

    const comeback = this.availablePowerups.get('comeback');
    if (comeback) {
      const teamScore = Number(scores[teamId] ?? 0);
      const scoreValues = Object.values(scores).map(Number);
      const leaderScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;
      const pointsBehind = leaderScore - teamScore;
      const minBehind =
        comeback.minPointsBehind ??
        (comeback.effectParams?.minPointsBehind as number | undefined) ??
        100;

      if (pointsBehind > minBehind) {
        // Two comeback wedges so trailing teams feel the advantage
        segments.push({
          id: comeback.id,
          displayName: comeback.name,
          slotId: 'comeback-spin-a',
          polarity: 'buff',
        });
        segments.push({
          id: comeback.id,
          displayName: comeback.name,
          slotId: 'comeback-spin-b',
          polarity: 'buff',
        });
      }
    }

    return segments;
  }

  /**
   * After a spin lands on a buff slot, replace that permanent pool slot with a power-down.
   * Comeback temporary slots and existing debuffs are left unchanged.
   */
  public consumeWheelSlot(selected: SelectablePowerupInfo): void {
    if (!selected.slotId || selected.id === 'none' || selected.id === 'comeback') {
      return;
    }

    const def = this.getPowerupDefinition(selected.id);
    if (def?.polarity === 'debuff') {
      return;
    }

    const idx = this.wheelSlots.findIndex((s) => s.slotId === selected.slotId);
    const targetIndex =
      idx !== -1 ? idx : this.wheelSlots.findIndex((s) => s.powerupId === selected.id);

    if (targetIndex === -1) return;

    const debuffs = this.getEnabledDebuffDefinitions();
    if (debuffs.length === 0) {
      this.wheelSlots[targetIndex] = {
        powerupId: 'none',
        slotId: `none-${Date.now()}`,
      };
      return;
    }

    const pick = debuffs[Math.floor(Math.random() * debuffs.length)];
    this.wheelSlots[targetIndex] = {
      powerupId: pick.id,
      slotId: `${pick.id}-${Date.now()}`,
    };
    console.log(
      `[PowerUpManager] Replaced wheel slot with power-down '${pick.id}'. Pool:`,
      this.wheelSlots.map((s) => s.powerupId)
    );
  }

  public getPointsBehind(teamId: string | number, scores: Record<string | number, number>): number {
    const teamScore = Number(scores[teamId] ?? 0);
    const scoreValues = Object.values(scores).map(Number);
    const leaderScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;
    return Math.max(0, leaderScore - teamScore);
  }

  isPowerUpActiveForTarget(typeId: string, targetId: string | number): boolean {
    for (const powerup of this.activePowerups.values()) {
      if (powerup.id === typeId && powerup.targetId === targetId) {
        return true;
      }
    }
    return false;
  }

  getActivePowerupsForTarget(targetId: string | number): ActivePowerUp[] {
    return Array.from(this.activePowerups.values()).filter(
      (powerup) => powerup.targetId === targetId
    );
  }

  getPowerupDefinition(typeId: string): PowerupDefinition | undefined {
    return this.availablePowerups.get(typeId);
  }

  activatePowerUp(typeId: string, targetId: string | number): ActivePowerUp | null {
    if (typeId === 'none') return null;

    const definition = this.getPowerupDefinition(typeId);
    if (!definition) {
      console.warn(`PowerUpManager: Cannot activate unknown power-up type '${typeId}'.`);
      return null;
    }

    const instanceId = crypto.randomUUID();
    const activationTime = Date.now();
    const remainingDurationMs =
      definition.durationSeconds !== undefined
        ? definition.durationSeconds * 1000
        : undefined;

    const activePowerup: ActivePowerUp = {
      ...definition,
      instanceId,
      targetId,
      activationTime,
      remainingDurationMs,
    };

    this.activePowerups.set(instanceId, activePowerup);
    console.log(
      `PowerUpManager: Activated '${typeId}' (${instanceId}) for '${targetId}'. Duration: ${remainingDurationMs ?? 'until consumed'}ms`
    );

    const payload: PowerUpEventPayload = {
      powerUpId: instanceId,
      type: typeId,
      targetId: targetId,
      duration: definition.durationSeconds,
    };
    this.eventBus.emit(POWERUP_EVENTS.ACTIVATED, payload);

    return { ...activePowerup };
  }

  public deactivatePowerUpByTypeAndTarget(typeId: string, targetId: string | number): boolean {
    let instanceIdToDeactivate: string | null = null;

    for (const [instanceId, powerup] of this.activePowerups.entries()) {
      if (powerup.id === typeId && powerup.targetId === targetId) {
        instanceIdToDeactivate = instanceId;
        break;
      }
    }

    if (instanceIdToDeactivate) {
      this.deactivatePowerUp(instanceIdToDeactivate, false);
      return true;
    }
    return false;
  }

  deactivatePowerUp(instanceId: string, expired = false): void {
    const powerup = this.activePowerups.get(instanceId);
    if (!powerup) return;

    this.activePowerups.delete(instanceId);

    const payload: PowerUpEventPayload = {
      powerUpId: instanceId,
      type: powerup.id,
      targetId: powerup.targetId,
    };
    const eventName = expired ? POWERUP_EVENTS.EXPIRED : POWERUP_EVENTS.DEACTIVATED;
    this.eventBus.emit(eventName, payload);
  }

  /**
   * Tick timed power-ups (including multi-round effects like Comeback).
   * Independent of the per-question countdown timer.
   */
  update(deltaTimeMs: number): void {
    if (deltaTimeMs <= 0) return;

    const instanceIds = Array.from(this.activePowerups.keys());
    for (const instanceId of instanceIds) {
      const powerup = this.activePowerups.get(instanceId);
      if (powerup && powerup.remainingDurationMs !== undefined) {
        powerup.remainingDurationMs -= deltaTimeMs;
        if (powerup.remainingDurationMs <= 0) {
          this.deactivatePowerUp(instanceId, true);
        }
      }
    }
  }

  /** Remaining ms for a timed power-up type on a target, or 0 if inactive. */
  getRemainingDurationMs(typeId: string, targetId: string | number): number {
    for (const powerup of this.activePowerups.values()) {
      if (powerup.id === typeId && powerup.targetId === targetId) {
        return Math.max(0, powerup.remainingDurationMs ?? 0);
      }
    }
    return 0;
  }

  destroy(): void {
    this.availablePowerups.clear();
    this.activePowerups.clear();
    this.wheelSlots = [];
    this.wheelInitialized = false;
  }
}
