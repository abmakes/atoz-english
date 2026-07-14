import type { EventBus } from '../core/EventBus';
import { POWERUP_EVENTS, type PowerUpEventPayload } from '../core/EventTypes';
import type { GameConfig } from '../config/GameConfig';
import type {
  PowerupConfig,
  PowerupDefinition,
  PowerPolarity,
} from '../config/PowerupConfig';
import { SCORE_MODE_WHEEL_SEGMENT_COUNT } from '../config/PowerupConfig';

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
  slotId?: string;
  polarity?: PowerPolarity;
}

/**
 * Manages power-up definitions, activation, timed expiry, and spin-wheel composition.
 *
 * Wheel economy (fresh each spin — no permanent drain):
 * - Buff wedges are weighted (50/50 common, Double Points rare).
 * - Power-downs appear based on how far ahead the spinning team is.
 * - Comeback appears only when behind by more than minPointsBehind.
 */
export class PowerUpManager {
  private eventBus: EventBus;
  private config: GameConfig;
  private availablePowerups: Map<string, PowerupDefinition> = new Map();
  private activePowerups: Map<string, ActivePowerUp> = new Map();

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
  }

  /**
   * Legacy flat list (unique enabled buffs). Prefer getWheelSegmentsForSpin for the spinner.
   */
  public getSelectablePowerups(): SelectablePowerupInfo[] {
    if (!this.config.powerups?.powerupsEnabled) {
      return [];
    }
    return this.getStandardBuffDefinitions().map((d) => ({
      id: d.id,
      displayName: d.name || d.id,
      polarity: d.polarity,
    }));
  }

  /** Standard buffs that always compete for wheel slots (excludes standings-gated comeback). */
  private getStandardBuffDefinitions(): PowerupDefinition[] {
    return Array.from(this.availablePowerups.values()).filter(
      (d) => d.polarity === 'buff' && d.id !== 'comeback' && (d.wheelWeight ?? 0) > 0
    );
  }

  private getEnabledDebuffDefinitions(): PowerupDefinition[] {
    return Array.from(this.availablePowerups.values()).filter(
      (d) => d.polarity === 'debuff' && (d.wheelWeight ?? 0) > 0
    );
  }

  private toSelectable(def: PowerupDefinition, slotId: string): SelectablePowerupInfo {
    return {
      id: def.id,
      displayName: def.name || def.id,
      slotId,
      polarity: def.polarity,
    };
  }

  private pickWeighted(defs: PowerupDefinition[]): PowerupDefinition | null {
    if (defs.length === 0) return null;
    const total = defs.reduce((sum, d) => sum + Math.max(0, d.wheelWeight ?? 1), 0);
    if (total <= 0) return defs[Math.floor(Math.random() * defs.length)];
    let roll = Math.random() * total;
    for (const def of defs) {
      roll -= Math.max(0, def.wheelWeight ?? 1);
      if (roll <= 0) return def;
    }
    return defs[defs.length - 1];
  }

  private shuffle<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * How many power-down wedges to put on this spin for the current team.
   * Leaders soak more risk; trailing / tied teams mostly see buffs.
   */
  private getDebuffSlotCount(leadMargin: number, pointsBehind: number): number {
    if (pointsBehind > 0) return 0;
    if (leadMargin >= 100) return 3;
    if (leadMargin >= 40) return 2;
    if (leadMargin > 0) return 1;
    return Math.random() < 0.2 ? 1 : 0;
  }

  /**
   * Fresh wheel composition for the team about to play, based on standings.
   */
  public getWheelSegmentsForSpin(
    teamId: string | number,
    scores: Record<string | number, number>
  ): SelectablePowerupInfo[] {
    if (!this.config.powerups?.powerupsEnabled) {
      return [];
    }

    const teamScore = Number(scores[teamId] ?? 0);
    const scoreValues = Object.values(scores).map(Number);
    const leaderScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;
    const pointsBehind = Math.max(0, leaderScore - teamScore);
    const sorted = [...scoreValues].sort((a, b) => b - a);
    const leadMargin =
      teamScore >= leaderScore && sorted.length > 1
        ? Math.max(0, teamScore - (sorted[1] ?? 0))
        : 0;

    const buffs = this.getStandardBuffDefinitions();
    const debuffs = this.getEnabledDebuffDefinitions();
    const comeback = this.availablePowerups.get('comeback');
    const minBehind =
      comeback?.minPointsBehind ??
      (comeback?.effectParams?.minPointsBehind as number | undefined) ??
      100;
    const comebackEligible = Boolean(comeback) && pointsBehind > minBehind;

    let remaining = SCORE_MODE_WHEEL_SEGMENT_COUNT;
    const segments: SelectablePowerupInfo[] = [];
    let slotCounter = 0;

    if (comebackEligible && comeback) {
      const comebackSlots = pointsBehind > 200 ? 2 : 1;
      for (let i = 0; i < comebackSlots && remaining > 0; i++) {
        segments.push(this.toSelectable(comeback, `comeback-${slotCounter++}`));
        remaining--;
      }
    }

    let debuffSlots = this.getDebuffSlotCount(leadMargin, pointsBehind);
    debuffSlots = Math.min(debuffSlots, remaining, debuffs.length > 0 ? remaining : 0);
    for (let i = 0; i < debuffSlots && remaining > 0; i++) {
      const pick = this.pickWeighted(debuffs);
      if (!pick) break;
      segments.push(this.toSelectable(pick, `${pick.id}-${slotCounter++}`));
      remaining--;
    }

    while (remaining > 0) {
      if (buffs.length === 0) break;
      const pick = this.pickWeighted(buffs);
      if (!pick) break;
      segments.push(this.toSelectable(pick, `${pick.id}-${slotCounter++}`));
      remaining--;
    }

    while (segments.length < SCORE_MODE_WHEEL_SEGMENT_COUNT && debuffs.length > 0) {
      const pick = this.pickWeighted(debuffs);
      if (!pick) break;
      segments.push(this.toSelectable(pick, `${pick.id}-${slotCounter++}`));
    }

    return this.shuffle(segments);
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
  }
}
