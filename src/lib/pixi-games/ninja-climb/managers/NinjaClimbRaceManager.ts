import type { NinjaPowerupId } from '../ninjaPowerups'

export type ShortcutKind = 'forest' | 'cave'

export interface ShortcutNodeDef {
  id: string
  kind: ShortcutKind
  /** Fraction of summit height where the node sits (0–1). */
  fraction: number
  ladderChance: number
  ladderDelta: number
  snakeDelta: number
}

export interface TeamRaceState {
  teamId: string
  score: number
  charges: Record<NinjaPowerupId, number>
  /** Remaining scoring answers that still get +50% from rope. */
  ropeBoostRemaining: number
  /** Remaining scoring answers still cut by smoke. */
  smokeDebuffRemaining: number
  /** Barrier height placed by this team (blocks the opponent). Null if none. */
  barrierHeight: number | null
  /** Shortcut node ids this team has already resolved (accept or skip). */
  consumedShortcuts: string[]
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
  barrierPlacedAt?: number | null
}

const TELEPORT_JUMP = 120
const ROPE_PULL = 50
const ROPE_BOOST_MULTIPLIER = 1.5
const ROPE_BOOST_ANSWERS = 3
const SMOKE_MULTIPLIER = 0.7
const SMOKE_ANSWERS = 2

export const DEFAULT_SHORTCUT_NODES: ShortcutNodeDef[] = [
  {
    id: 'node-forest-1',
    kind: 'forest',
    fraction: 0.25,
    ladderChance: 0.6,
    ladderDelta: 90,
    snakeDelta: -60,
  },
  {
    id: 'node-cave-1',
    kind: 'cave',
    fraction: 0.45,
    ladderChance: 0.4,
    ladderDelta: 160,
    snakeDelta: -100,
  },
  {
    id: 'node-forest-2',
    kind: 'forest',
    fraction: 0.7,
    ladderChance: 0.6,
    ladderDelta: 90,
    snakeDelta: -60,
  },
  {
    id: 'node-cave-2',
    kind: 'cave',
    fraction: 0.85,
    ladderChance: 0.4,
    ladderDelta: 160,
    snakeDelta: -100,
  },
]

export function computeSummitPoints(questionsPerTeam: number): number {
  return Math.max(400, Math.floor(questionsPerTeam) * 80)
}

export function computeCorrectGain(options: {
  boosted: boolean
  remainingTimeMs: number
  questionDurationMs: number
}): number {
  if (!options.boosted) return 60
  const duration = Math.max(1, options.questionDurationMs)
  const fraction = Math.max(0, Math.min(1, options.remainingTimeMs / duration))
  return 50 + Math.round(50 * fraction)
}

/**
 * Pure race rules: score ↔ height, gain pipeline, barriers, boosts, shortcuts.
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
    nodes?: ShortcutNodeDef[]
    rng?: () => number
  }) {
    this.summitPoints = computeSummitPoints(options.questionsPerTeam)
    this.shortcutsEnabled = options.shortcutsEnabled !== false
    this.nodes = options.nodes ?? DEFAULT_SHORTCUT_NODES
    this.rng = options.rng ?? Math.random
    this.teamOrder = [...options.teamIds]

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
        barrierHeight: null,
        consumedShortcuts: [],
      })
    }
  }

  public getSummitPoints(): number {
    return this.summitPoints
  }

  public getNodes(): ShortcutNodeDef[] {
    return this.nodes.map((n) => ({ ...n }))
  }

  public isShortcutsEnabled(): boolean {
    return this.shortcutsEnabled
  }

  public getTeamState(teamId: string): TeamRaceState | null {
    const t = this.teams.get(teamId)
    return t ? { ...t, charges: { ...t.charges }, consumedShortcuts: [...t.consumedShortcuts] } : null
  }

  public getScore(teamId: string): number {
    return this.teams.get(teamId)?.score ?? 0
  }

  public getHeightFraction(teamId: string): number {
    return Math.max(0, Math.min(1, this.getScore(teamId) / this.summitPoints))
  }

  public scoreToWorldY(score: number, trackBottomY: number, trackTopY: number): number {
    const fraction = Math.max(0, Math.min(1, score / this.summitPoints))
    return trackBottomY + (trackTopY - trackBottomY) * fraction
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

  /**
   * Apply a power-up. Mutates race state. Caller syncs ScoringManager.
   */
  public applyPowerup(actorId: string, powerup: NinjaPowerupId): ApplyPowerupResult {
    const actor = this.teams.get(actorId)
    if (!actor) return { ok: false, reason: 'unknown-team' }
    if ((actor.charges[powerup] ?? 0) <= 0) return { ok: false, reason: 'no-charge' }

    const targetId = this.getOpponentId(actorId)
    const target = targetId ? this.teams.get(targetId) : null

    actor.charges[powerup] -= 1

    if (powerup === 'teleport') {
      const before = actor.score
      actor.score = Math.min(this.summitPoints, actor.score + TELEPORT_JUMP)
      actor.barrierHeight = actor.score
      return {
        ok: true,
        actorScoreDelta: actor.score - before,
        barrierPlacedAt: actor.barrierHeight,
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

  /**
   * Gain pipeline: base → rope boost → smoke → barrier clamp → apply.
   * Consumes one boost/debuff charge when base > 0.
   */
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

    const opponentId = this.getOpponentId(teamId)
    const opponent = opponentId ? this.teams.get(opponentId) : null
    let applied = afterSmoke
    let barrierClamped = false
    let barrierShattered = false

    if (opponent && opponent.barrierHeight != null) {
      const barrier = opponent.barrierHeight
      if (team.score < barrier) {
        const maxReachable = barrier
        const projected = team.score + afterSmoke
        if (projected > maxReachable) {
          applied = Math.max(0, maxReachable - team.score)
          barrierClamped = true
          opponent.barrierHeight = null
          barrierShattered = true
        }
      }
    }

    team.score = Math.min(this.summitPoints, Math.max(0, team.score + applied))

    return {
      base,
      afterBoost,
      afterSmoke,
      applied,
      barrierClamped,
      barrierShattered,
      newScore: team.score,
    }
  }

  /**
   * Apply a raw delta (ladder/snake/rope pull sync). Clamps to [0, summit].
   */
  public applyRawDelta(teamId: string, delta: number): number {
    const team = this.teams.get(teamId)
    if (!team) return 0
    const before = team.score
    team.score = Math.min(this.summitPoints, Math.max(0, team.score + delta))
    return team.score - before
  }

  /**
   * Sync absolute score from ScoringManager (e.g. after external set). Prefer applyGain.
   */
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

    const crossed = this.nodes
      .map((node) => ({
        node,
        height: Math.floor(node.fraction * this.summitPoints),
      }))
      .filter(
        ({ node, height }) =>
          !team.consumedShortcuts.includes(node.id) &&
          previousScore < height &&
          newScore >= height
      )
      .sort((a, b) => a.height - b.height)

    return crossed[0]?.node ?? null
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
    const delta = isLadder ? node.ladderDelta : node.snakeDelta
    team.score = Math.min(this.summitPoints, Math.max(0, team.score + delta))

    return {
      nodeId: node.id,
      kind: node.kind,
      outcome: isLadder ? 'ladder' : 'snake',
      delta,
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
}
