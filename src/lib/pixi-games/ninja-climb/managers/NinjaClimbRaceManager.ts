import type { NinjaPowerupId } from '../ninjaPowerups'

export type ShortcutKind = 'forest' | 'cave'

export const POINTS_PER_STEP = 40

export interface ShortcutNodeDef {
  id: string
  kind: ShortcutKind
  /** Fraction of summit (used to derive step index once summit is known). */
  fraction: number
  /** Absolute step index (filled after race init). */
  stepIndex: number
  ladderChance: number
  ladderDelta: number
  snakeDelta: number
}

export interface TeamRaceState {
  teamId: string
  score: number
  charges: Record<NinjaPowerupId, number>
  ropeBoostRemaining: number
  smokeDebuffRemaining: number
  /** Barrier step index placed by this team. Null if none. */
  barrierStep: number | null
  consumedShortcuts: string[]
  /** Correct answers this race — every 2nd grants a random power-up. */
  correctAnswers: number
}

export interface GainResult {
  base: number
  afterBoost: number
  afterSmoke: number
  applied: number
  barrierClamped: boolean
  barrierShattered: boolean
  newScore: number
}

export interface ShortcutRollResult {
  nodeId: string
  kind: ShortcutKind
  outcome: 'ladder' | 'snake'
  delta: number
  newScore: number
}

export interface ApplyPowerupResult {
  ok: boolean
  reason?: string
  actorScoreDelta?: number
  targetScoreDelta?: number
  barrierPlacedAtStep?: number | null
}

const TELEPORT_JUMP = 120
const ROPE_PULL = 50
const ROPE_BOOST_MULTIPLIER = 1.5
const ROPE_BOOST_ANSWERS = 3
const SMOKE_MULTIPLIER = 0.7
const SMOKE_ANSWERS = 2

/** Two well-spaced nodes — high risk (snake more likely than ladder). */
export const DEFAULT_SHORTCUT_NODES: Omit<ShortcutNodeDef, 'stepIndex'>[] = [
  {
    id: 'node-forest-1',
    kind: 'forest',
    fraction: 0.4,
    ladderChance: 0.35,
    ladderDelta: 60,
    snakeDelta: -50,
  },
  {
    id: 'node-cave-1',
    kind: 'cave',
    fraction: 0.75,
    ladderChance: 0.3,
    ladderDelta: 80,
    snakeDelta: -70,
  },
]

/** Minimum summit height so back-and-forth power fights can play out. */
export const MIN_SUMMIT_POINTS = 560

export function computeSummitPoints(questionsPerTeam: number): number {
  return Math.max(MIN_SUMMIT_POINTS, Math.floor(questionsPerTeam) * 80)
}

export function scoreToStepIndex(score: number, summitPoints: number): number {
  const totalSteps = Math.max(1, Math.ceil(summitPoints / POINTS_PER_STEP))
  const raw = Math.floor(Math.max(0, score) / POINTS_PER_STEP)
  return Math.max(0, Math.min(totalSteps - 1, raw))
}

export function totalStepsForSummit(summitPoints: number): number {
  return Math.max(1, Math.ceil(summitPoints / POINTS_PER_STEP))
}

/**
 * Correct-answer climb points with a time bonus.
 * - Basic: 50–75 (slow → fast)
 * - Boosted: 50–100 (slow → fast)
 */
export function computeCorrectGain(options: {
  boosted: boolean
  remainingTimeMs: number
  questionDurationMs: number
}): number {
  const duration = Math.max(1, options.questionDurationMs)
  const fraction = Math.max(0, Math.min(1, options.remainingTimeMs / duration))
  if (!options.boosted) {
    return 50 + Math.round(25 * fraction)
  }
  return 50 + Math.round(50 * fraction)
}

/**
 * Pure race rules: score ↔ step, gain pipeline, barriers, boosts, shortcuts.
 */
export class NinjaClimbRaceManager {
  private summitPoints: number
  private shortcutsEnabled: boolean
  private nodes: ShortcutNodeDef[]
  private teams: Map<string, TeamRaceState> = new Map()
  private teamOrder: string[] = []
  private rng: () => number

  constructor(options: {
    teamIds: string[]
    startingCharges: NinjaPowerupId[]
    questionsPerTeam: number
    shortcutsEnabled?: boolean
    nodes?: Omit<ShortcutNodeDef, 'stepIndex'>[]
    rng?: () => number
  }) {
    this.summitPoints = computeSummitPoints(options.questionsPerTeam)
    this.shortcutsEnabled = options.shortcutsEnabled !== false
    this.rng = options.rng ?? Math.random
    this.teamOrder = [...options.teamIds]

    const totalSteps = totalStepsForSummit(this.summitPoints)
    const rawNodes = options.nodes ?? DEFAULT_SHORTCUT_NODES
    this.nodes = rawNodes.map((n) => ({
      ...n,
      stepIndex: Math.max(
        0,
        Math.min(totalSteps - 1, Math.round(n.fraction * (totalSteps - 1)))
      ),
    }))

    for (const teamId of options.teamIds) {
      const charges: Record<NinjaPowerupId, number> = {
        teleport: 0,
        rope: 0,
        smoke: 0,
      }
      for (const id of options.startingCharges) {
        charges[id] = 1
      }
      this.teams.set(teamId, {
        teamId,
        score: 0,
        charges,
        ropeBoostRemaining: 0,
        smokeDebuffRemaining: 0,
        barrierStep: null,
        consumedShortcuts: [],
        correctAnswers: 0,
      })
    }
  }

  public getSummitPoints(): number {
    return this.summitPoints
  }

  public getTotalSteps(): number {
    return totalStepsForSummit(this.summitPoints)
  }

  public getNodes(): ShortcutNodeDef[] {
    return this.nodes.map((n) => ({ ...n }))
  }

  public isShortcutsEnabled(): boolean {
    return this.shortcutsEnabled
  }

  public getTeamState(teamId: string): TeamRaceState | null {
    const t = this.teams.get(teamId)
    return t
      ? { ...t, charges: { ...t.charges }, consumedShortcuts: [...t.consumedShortcuts] }
      : null
  }

  public getScore(teamId: string): number {
    return this.teams.get(teamId)?.score ?? 0
  }

  public getStepIndex(teamId: string): number {
    return scoreToStepIndex(this.getScore(teamId), this.summitPoints)
  }

  /** Convert an absolute score to a clamped waypoint step index. */
  public scoreToStepIndex(score: number): number {
    return scoreToStepIndex(score, this.summitPoints)
  }

  /**
   * Active barrier step on the shared trail (first team that has one).
   * Barriers are stored per team but render as a single trail gate.
   */
  public getBarrierStep(): number | null {
    for (const id of this.teamOrder) {
      const step = this.teams.get(id)?.barrierStep ?? null
      if (step != null) return step
    }
    return null
  }

  public getHeightFraction(teamId: string): number {
    return Math.max(0, Math.min(1, this.getScore(teamId) / this.summitPoints))
  }

  public hasReachedSummit(teamId: string): boolean {
    return this.getScore(teamId) >= this.summitPoints
  }

  public anyTeamAtSummit(): string | null {
    for (const id of this.teamOrder) {
      if (this.hasReachedSummit(id)) return id
    }
    return null
  }

  public getOpponentId(teamId: string): string | null {
    return this.teamOrder.find((id) => id !== teamId) ?? null
  }

  public canPlayPowerup(teamId: string, powerup: NinjaPowerupId): boolean {
    const team = this.teams.get(teamId)
    return !!team && (team.charges[powerup] ?? 0) > 0
  }

  public getCharges(teamId: string): Record<NinjaPowerupId, number> {
    const team = this.teams.get(teamId)
    return team
      ? { ...team.charges }
      : { teleport: 0, rope: 0, smoke: 0 }
  }

  /**
   * Record a correct answer. Every 2nd correct grants one random charge
   * from `pool` (enabled power-ups). Returns the granted id, or null.
   */
  public registerCorrectAnswer(
    teamId: string,
    pool: readonly NinjaPowerupId[]
  ): NinjaPowerupId | null {
    const team = this.teams.get(teamId)
    if (!team) return null
    team.correctAnswers += 1
    if (team.correctAnswers % 2 !== 0) return null
    if (!pool.length) return null
    const pick = pool[Math.floor(this.rng() * pool.length)]!
    team.charges[pick] = (team.charges[pick] ?? 0) + 1
    return pick
  }

  /**
   * Clamp a proposed score gain against the opponent's barrier (by step).
   * Returns the applied delta and whether the barrier shattered.
   */
  private _clampAgainstBarrier(
    teamId: string,
    currentScore: number,
    proposedDelta: number
  ): { applied: number; barrierClamped: boolean; barrierShattered: boolean } {
    if (proposedDelta <= 0) {
      return { applied: proposedDelta, barrierClamped: false, barrierShattered: false }
    }

    const opponentId = this.getOpponentId(teamId)
    const opponent = opponentId ? this.teams.get(opponentId) : null
    if (!opponent || opponent.barrierStep == null) {
      return { applied: proposedDelta, barrierClamped: false, barrierShattered: false }
    }

    const barrierScore = opponent.barrierStep * POINTS_PER_STEP
    if (currentScore >= barrierScore) {
      return { applied: proposedDelta, barrierClamped: false, barrierShattered: false }
    }

    const projected = currentScore + proposedDelta
    if (projected <= barrierScore) {
      return { applied: proposedDelta, barrierClamped: false, barrierShattered: false }
    }

    const applied = Math.max(0, barrierScore - currentScore)
    opponent.barrierStep = null
    return { applied, barrierClamped: true, barrierShattered: true }
  }

  public applyPowerup(actorId: string, powerup: NinjaPowerupId): ApplyPowerupResult {
    const actor = this.teams.get(actorId)
    if (!actor) return { ok: false, reason: 'unknown-team' }
    if ((actor.charges[powerup] ?? 0) <= 0) return { ok: false, reason: 'no-charge' }

    const targetId = this.getOpponentId(actorId)
    const target = targetId ? this.teams.get(targetId) : null

    actor.charges[powerup] -= 1

    if (powerup === 'teleport') {
      const before = actor.score
      const clamp = this._clampAgainstBarrier(actorId, actor.score, TELEPORT_JUMP)
      actor.score = Math.min(this.summitPoints, actor.score + clamp.applied)
      actor.barrierStep = this.getStepIndex(actorId)
      return {
        ok: true,
        actorScoreDelta: actor.score - before,
        barrierPlacedAtStep: actor.barrierStep,
      }
    }

    if (powerup === 'rope') {
      actor.ropeBoostRemaining = ROPE_BOOST_ANSWERS
      let targetDelta = 0
      if (target) {
        const before = target.score
        target.score = Math.max(0, target.score - ROPE_PULL)
        targetDelta = target.score - before
      }
      return { ok: true, actorScoreDelta: 0, targetScoreDelta: targetDelta }
    }

    if (powerup === 'smoke') {
      if (target) {
        target.smokeDebuffRemaining = SMOKE_ANSWERS
      }
      return { ok: true, actorScoreDelta: 0, targetScoreDelta: 0 }
    }

    return { ok: false, reason: 'unknown-powerup' }
  }

  public applyGain(teamId: string, base: number): GainResult {
    const team = this.teams.get(teamId)
    if (!team) {
      return {
        base,
        afterBoost: base,
        afterSmoke: base,
        applied: 0,
        barrierClamped: false,
        barrierShattered: false,
        newScore: 0,
      }
    }

    if (base <= 0) {
      return {
        base: 0,
        afterBoost: 0,
        afterSmoke: 0,
        applied: 0,
        barrierClamped: false,
        barrierShattered: false,
        newScore: team.score,
      }
    }

    let afterBoost = base
    if (team.ropeBoostRemaining > 0) {
      afterBoost = Math.round(base * ROPE_BOOST_MULTIPLIER)
      team.ropeBoostRemaining -= 1
    }

    let afterSmoke = afterBoost
    if (team.smokeDebuffRemaining > 0) {
      afterSmoke = Math.round(afterBoost * SMOKE_MULTIPLIER)
      team.smokeDebuffRemaining -= 1
    }

    const clamp = this._clampAgainstBarrier(teamId, team.score, afterSmoke)
    team.score = Math.min(this.summitPoints, Math.max(0, team.score + clamp.applied))

    return {
      base,
      afterBoost,
      afterSmoke,
      applied: clamp.applied,
      barrierClamped: clamp.barrierClamped,
      barrierShattered: clamp.barrierShattered,
      newScore: team.score,
    }
  }

  public setScore(teamId: string, score: number): void {
    const team = this.teams.get(teamId)
    if (!team) return
    team.score = Math.min(this.summitPoints, Math.max(0, Math.floor(score)))
  }

  public findCrossedShortcut(
    teamId: string,
    previousScore: number,
    newScore: number
  ): ShortcutNodeDef | null {
    if (!this.shortcutsEnabled) return null
    const team = this.teams.get(teamId)
    if (!team) return null

    const prevStep = scoreToStepIndex(previousScore, this.summitPoints)
    const nextStep = scoreToStepIndex(newScore, this.summitPoints)

    const crossed = this.nodes
      .filter(
        (node) =>
          !team.consumedShortcuts.includes(node.id) &&
          prevStep < node.stepIndex &&
          nextStep >= node.stepIndex
      )
      .sort((a, b) => a.stepIndex - b.stepIndex)

    return crossed[0] ?? null
  }

  public markShortcutConsumed(teamId: string, nodeId: string): void {
    const team = this.teams.get(teamId)
    if (!team) return
    if (!team.consumedShortcuts.includes(nodeId)) {
      team.consumedShortcuts.push(nodeId)
    }
  }

  public rollShortcut(teamId: string, node: ShortcutNodeDef): ShortcutRollResult {
    const team = this.teams.get(teamId)
    if (!team) {
      return {
        nodeId: node.id,
        kind: node.kind,
        outcome: 'snake',
        delta: 0,
        newScore: 0,
      }
    }

    this.markShortcutConsumed(teamId, node.id)
    const roll = this.rng()
    const isLadder = roll < node.ladderChance
    const rawDelta = isLadder ? node.ladderDelta : node.snakeDelta

    let applied = rawDelta
    const outcome: 'ladder' | 'snake' = isLadder ? 'ladder' : 'snake'

    if (rawDelta > 0) {
      const clamp = this._clampAgainstBarrier(teamId, team.score, rawDelta)
      applied = clamp.applied
    }

    team.score = Math.min(this.summitPoints, Math.max(0, team.score + applied))

    return {
      nodeId: node.id,
      kind: node.kind,
      outcome,
      delta: applied,
      newScore: team.score,
    }
  }

  public skipShortcut(teamId: string, nodeId: string): void {
    this.markShortcutConsumed(teamId, nodeId)
  }

  public getLeadingTeamId(): string | null {
    let bestId: string | null = null
    let bestScore = -1
    for (const id of this.teamOrder) {
      const score = this.getScore(id)
      if (score > bestScore) {
        bestScore = score
        bestId = id
      }
    }
    return bestId
  }

  public getTeamOrder(): string[] {
    return [...this.teamOrder]
  }
}
