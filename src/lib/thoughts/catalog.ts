import manifestJson from '../../../public/images/thoughts/manifest.json'

export const THOUGHT_CATEGORIES = [
  'head',
  'hair',
  'eyes',
  'ears',
  'nose',
  'mouth',
  'extras',
] as const

export type ThoughtCategory = (typeof THOUGHT_CATEGORIES)[number]

export const THOUGHT_STYLES = ['photo', 'cartoon', 'sketch', 'mixed'] as const

export type ThoughtStyle = (typeof THOUGHT_STYLES)[number]

export const PART_CAPS: Record<ThoughtCategory, number> = {
  head: 1,
  hair: 2,
  eyes: 4,
  ears: 4,
  nose: 2,
  mouth: 2,
  extras: 4,
}

export const PAIR_CATEGORIES: ReadonlySet<ThoughtCategory> = new Set([
  'eyes',
  'ears',
])

export interface FrameRect {
  x: number
  y: number
  width: number
  height: number
  index: number
}

export interface CatalogPart {
  id: string
  label: string
  style: ThoughtStyle
  category: ThoughtCategory
  sheet: string
  frames: FrameRect[]
  pivot: { x: number; y: number }
  layer: number
  animation: 'mouth' | 'eyes' | null
  mirrorable: boolean
  defaultPlacement: { x: number; y: number; scale: number; rotation: number }
}

export interface ThoughtSheet {
  id: string
  src: string
  width: number
  height: number
}

interface ThoughtManifest {
  version: number
  animation: {
    mouth: { frames: number }
    eyes: {
      sequence: number[]
      transitionMs: number[]
      idleRangeMs: [number, number]
    }
  }
  sheets: ThoughtSheet[]
  parts: CatalogPart[]
}

export const thoughtManifest = manifestJson as unknown as ThoughtManifest

const partsById = new Map(thoughtManifest.parts.map((part) => [part.id, part]))
const sheetsById = new Map(thoughtManifest.sheets.map((sheet) => [sheet.id, sheet]))

export function getPart(partId: string): CatalogPart | undefined {
  return partsById.get(partId)
}

export function getSheet(sheetId: string): ThoughtSheet | undefined {
  return sheetsById.get(sheetId)
}

export function partsIn(
  category: ThoughtCategory,
  style?: Exclude<ThoughtStyle, 'mixed'>
): CatalogPart[] {
  return thoughtManifest.parts.filter((part) => {
    if (part.category !== category) return false
    if (!style || category === 'head' || part.style === 'mixed') return true
    return part.style === style
  })
}

/** Tray preview frame: a mid-open mouth reads as a mouth; eyes rest open. */
export function previewFrame(part: CatalogPart): FrameRect {
  if (part.animation === 'mouth') {
    return part.frames[Math.min(2, part.frames.length - 1)] ?? part.frames[0]
  }
  return part.frames[0]
}
