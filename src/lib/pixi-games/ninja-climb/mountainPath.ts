/**
 * Ninja Climb trail.
 *
 * Waypoints are the painted grass pads on the v2 cliff tiles, not an even
 * screen-wide zigzag. `mid.png` is the repeating section: four pads, bottom
 * to top, left then right. `base.png` is the start lawn and the two ledges
 * above it. `top.png` is the last ledge and the finish-line summit.
 *
 * nx/ny are fractions of that tile image (0 = left / top). They were measured
 * from the sunlit turf in public/images/ninja-climb/v2 so a sprite stacked
 * with anchor (0.5, 1) puts feet on the grass.
 */

export interface Waypoint {
  index: number
  x: number
  y: number
  section: number
  /** Travel direction toward the next pad: 1 = left→right, -1 = right→left. */
  dir: 1 | -1
}

/** Foot point plus the turf rectangle it was measured from. */
export interface PlatformAnchor {
  nx: number
  ny: number
  nx0: number
  ny0: number
  nx1: number
  ny1: number
  dir: 1 | -1
}

export type CliffTileKind = 'base' | 'mid' | 'top'

export interface CliffTile {
  kind: CliffTileKind
  /** 0 for base/top. Mid tiles count upward from the base. */
  repeatIndex: number
  centerX: number
  /** World Y of the image's bottom edge (Pixi Y grows downward). */
  bottomY: number
  width: number
  height: number
}

export interface CliffLayout {
  waypoints: Waypoint[]
  tiles: CliffTile[]
}

export interface BuildPathOptions {
  totalSteps: number
  screenWidth: number
  /** Mid tile width as a fraction of the screen. Default 0.62. */
  midWidthFraction?: number
  /** World Y where the base image's bottom edge sits. */
  worldBottomY?: number
}

/** height / width of each v2 tile. */
const TILE_ASPECT: Record<CliffTileKind, number> = {
  base: 1024 / 1536,
  mid: 1536 / 1024,
  top: 1024 / 1536,
}

/**
 * Opaque stone-column width as a fraction of each image, at the seam that
 * meets the next tile. Used so base/top scale to the mid column.
 */
const COLUMN_WIDTH: Record<CliffTileKind, number> = {
  base: 0.502,
  mid: 0.748,
  top: 0.505,
}

/** Pixels of overlap so stacked tiles don't show a seam crack. */
const SEAM_OVERLAP = 12

/** Bottom → top. */
export const BASE_PLATFORMS: readonly PlatformAnchor[] = [
  { nx: 0.512, ny: 0.71, nx0: 0.133, ny0: 0.656, nx1: 0.906, ny1: 0.776, dir: -1 },
  { nx: 0.391, ny: 0.316, nx0: 0.263, ny0: 0.285, nx1: 0.486, ny1: 0.362, dir: 1 },
  { nx: 0.654, ny: 0.135, nx0: 0.549, ny0: 0.105, nx1: 0.755, ny1: 0.179, dir: -1 },
]

/** Bottom → top. This is the tiled zigzag. */
export const MID_PLATFORMS: readonly PlatformAnchor[] = [
  { nx: 0.343, ny: 0.786, nx0: 0.105, ny0: 0.763, nx1: 0.561, ny1: 0.82, dir: 1 },
  { nx: 0.678, ny: 0.494, nx0: 0.492, ny0: 0.471, nx1: 0.847, ny1: 0.528, dir: -1 },
  { nx: 0.343, ny: 0.286, nx0: 0.109, ny0: 0.266, nx1: 0.519, ny1: 0.317, dir: 1 },
  { nx: 0.69, ny: 0.098, nx0: 0.512, ny0: 0.075, nx1: 0.843, ny1: 0.132, dir: -1 },
]

/** Bottom → top. Last entry is the finish line. */
export const TOP_PLATFORMS: readonly PlatformAnchor[] = [
  { nx: 0.368, ny: 0.626, nx0: 0.237, ny0: 0.594, nx1: 0.502, ny1: 0.675, dir: 1 },
  { nx: 0.535, ny: 0.251, nx0: 0.294, ny0: 0.207, nx1: 0.799, ny1: 0.304, dir: 1 },
]

const PLATFORMS: Record<CliffTileKind, readonly PlatformAnchor[]> = {
  base: BASE_PLATFORMS,
  mid: MID_PLATFORMS,
  top: TOP_PLATFORMS,
}

interface Slot {
  kind: CliffTileKind
  repeatIndex: number
  platformIndex: number
}

function pushKind(slots: Slot[], kind: CliffTileKind, repeatIndex: number): void {
  const pads = PLATFORMS[kind]
  for (let i = 0; i < pads.length; i++) {
    slots.push({ kind, repeatIndex, platformIndex: i })
  }
}

/**
 * Choose exactly `totalSteps` pads. Full bookends stay when they fit.
 * Extra mid pads are dropped from the top of the highest mid tile so the
 * climb still starts on the lawn and ends under the finish line.
 */
export function planClimbSlots(totalSteps: number): Slot[] {
  if (totalSteps < 1) return []

  if (totalSteps === 1) {
    return [{ kind: 'top', repeatIndex: 0, platformIndex: TOP_PLATFORMS.length - 1 }]
  }

  const bookends = BASE_PLATFORMS.length + TOP_PLATFORMS.length
  const slots: Slot[] = []
  pushKind(slots, 'base', 0)

  if (totalSteps > bookends) {
    const midNeeded = totalSteps - bookends
    const midTiles = Math.ceil(midNeeded / MID_PLATFORMS.length)
    for (let tile = 0; tile < midTiles; tile++) pushKind(slots, 'mid', tile)
  }

  pushKind(slots, 'top', 0)

  while (slots.length > totalSteps) {
    let lastMid = -1
    for (let i = slots.length - 1; i >= 0; i--) {
      if (slots[i].kind === 'mid') {
        lastMid = i
        break
      }
    }
    if (lastMid === -1) break
    slots.splice(lastMid, 1)
  }

  if (slots.length > totalSteps) {
    const first = slots[0]
    const last = slots[slots.length - 1]
    const middle = slots.slice(1, -1).slice(0, Math.max(0, totalSteps - 2))
    return [first, ...middle, last]
  }

  return slots
}

function tileWidth(kind: CliffTileKind, midWidth: number): number {
  if (kind === 'mid') return midWidth
  if (kind === 'base') return midWidth * (COLUMN_WIDTH.mid / COLUMN_WIDTH.base)
  return midWidth * (0.734 / COLUMN_WIDTH.top)
}

function tileHeight(kind: CliffTileKind, width: number): number {
  return width * TILE_ASPECT[kind]
}

export function buildCliffLayout(opts: BuildPathOptions): CliffLayout {
  const slots = planClimbSlots(opts.totalSteps)
  if (slots.length === 0) return { waypoints: [], tiles: [] }

  const midWidth = Math.max(1, opts.screenWidth * (opts.midWidthFraction ?? 0.62))
  const centerX = opts.screenWidth / 2
  const worldBottomY = opts.worldBottomY ?? 4000

  const maxMid = slots.reduce(
    (max, slot) => (slot.kind === 'mid' ? Math.max(max, slot.repeatIndex) : max),
    -1
  )
  const hasBase = slots.some((slot) => slot.kind === 'base')
  const hasTop = slots.some((slot) => slot.kind === 'top')

  const tiles: CliffTile[] = []
  let cursor = worldBottomY

  if (hasBase) {
    const width = tileWidth('base', midWidth)
    const height = tileHeight('base', width)
    tiles.push({ kind: 'base', repeatIndex: 0, centerX, bottomY: cursor, width, height })
    cursor -= height - SEAM_OVERLAP
  }

  for (let i = 0; i <= maxMid; i++) {
    const width = tileWidth('mid', midWidth)
    const height = tileHeight('mid', width)
    tiles.push({ kind: 'mid', repeatIndex: i, centerX, bottomY: cursor, width, height })
    cursor -= height - SEAM_OVERLAP
  }

  if (hasTop) {
    const width = tileWidth('top', midWidth)
    const height = tileHeight('top', width)
    tiles.push({ kind: 'top', repeatIndex: 0, centerX, bottomY: cursor, width, height })
  }

  const tileByKey = new Map(tiles.map((tile) => [`${tile.kind}:${tile.repeatIndex}`, tile]))

  const waypoints: Waypoint[] = slots.map((slot, index) => {
    const tile = tileByKey.get(`${slot.kind}:${slot.repeatIndex}`)
    const pad = PLATFORMS[slot.kind][slot.platformIndex]
    if (!tile) {
      throw new Error(`Ninja Climb: missing ${slot.kind} tile ${slot.repeatIndex}`)
    }
    const section = slot.kind === 'base' ? 0 : slot.kind === 'top' ? maxMid + 2 : slot.repeatIndex + 1
    return {
      index,
      x: tile.centerX + (pad.nx - 0.5) * tile.width,
      y: tile.bottomY - (1 - pad.ny) * tile.height,
      section,
      dir: pad.dir,
    }
  })

  return { waypoints, tiles }
}

/** Switchback trail. Y decreases as the trail climbs. */
export function buildPath(opts: BuildPathOptions): Waypoint[] {
  return buildCliffLayout(opts).waypoints
}

/** Summit is always the last waypoint. */
export function getSummitWaypoint(path: Waypoint[]): Waypoint | null {
  return path.length > 0 ? path[path.length - 1] : null
}

/** Clamp a step index into the path range. */
export function clampStepIndex(stepIndex: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0
  return Math.max(0, Math.min(totalSteps - 1, Math.floor(stepIndex)))
}
