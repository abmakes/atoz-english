import { sanitizeBackdrop, sanitizeFaceMask, type FaceMask } from '@/lib/thoughts/backdrop'
import {
  PAIR_CATEGORIES,
  PART_CAPS,
  getPart,
  partsIn,
  type CatalogPart,
  type ThoughtCategory,
} from '@/lib/thoughts/catalog'

export interface PlacedPart {
  instanceId: string
  partId: string
  x: number
  y: number
  scale: number
  rotation: number
  mirror: boolean
}

/** background: the sticker face sits on the photo. face: the photo replaces the sticker head. */
export type PhotoMode = 'background' | 'face'

export interface Character {
  version: 1
  parts: PlacedPart[]
  /** Resized photo. Omitted when the student has not added one. */
  background?: string
  photoMode?: PhotoMode
  /** Stage fill behind the stickers. Omitted when the fill is plain white. */
  backdrop?: string
  /** How a photo used as the face is cropped. Omitted for the circle. */
  faceMask?: FaceMask
}

export type PartPatch = Partial<
  Pick<PlacedPart, 'x' | 'y' | 'scale' | 'rotation' | 'mirror'>
>

const FACE_KEY = 'playtoz-thoughts-face-v2'
const NAME_KEY = 'playtoz-thoughts-name-v1'
/** Hair frames include a wide empty margin, so the default 0.25 scale looks tiny on the head. */
const HAIR_SCALE = 0.85

export function sanitizeBackground(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (value.length > 450_000) return undefined
  if (!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return undefined
  return value
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function place(
  part: CatalogPart,
  createId: () => string,
  overrides: Partial<Omit<PlacedPart, 'instanceId' | 'partId'>> = {}
): PlacedPart {
  const placed: PlacedPart = {
    instanceId: createId(),
    partId: part.id,
    x: part.defaultPlacement.x,
    y: part.defaultPlacement.y,
    scale: part.defaultPlacement.scale,
    rotation: part.defaultPlacement.rotation,
    mirror: false,
    ...overrides,
  }
  if (part.category === 'head') {
    placed.x = 0.5
    placed.y = 0.5
    placed.rotation = 0
    placed.mirror = false
  }
  if (!part.mirrorable) placed.mirror = false
  if (part.category === 'hair') {
    placed.scale = Math.max(placed.scale, HAIR_SCALE)
    placed.y = Math.max(placed.y, 0.34)
  }
  return placed
}

function countCategory(character: Character, category: ThoughtCategory): number {
  return character.parts.filter((part) => getPart(part.partId)?.category === category).length
}

/**
 * Source eyes and ears have their distinctive side on the right of the sticker
 * (lashes, ear opening). The unmirrored sticker belongs on the viewer's right.
 */
function pairOffsets(category: ThoughtCategory): Array<{ x: number; mirror: boolean }> {
  if (category === 'ears') {
    return [
      { x: 0.18, mirror: true },
      { x: 0.82, mirror: false },
    ]
  }
  return [
    { x: 0.38, mirror: true },
    { x: 0.62, mirror: false },
  ]
}

function keptPhoto(
  character: Character
): Pick<Character, 'background' | 'photoMode' | 'backdrop' | 'faceMask'> {
  const background = sanitizeBackground(character.background)
  const backdrop = sanitizeBackdrop(character.backdrop)
  const faceMask =
    background && character.photoMode === 'face' ? sanitizeFaceMask(character.faceMask) : undefined
  return {
    ...(background
      ? { background, ...(character.photoMode === 'face' ? { photoMode: 'face' as const } : {}) }
      : {}),
    ...(backdrop ? { backdrop } : {}),
    ...(faceMask ? { faceMask } : {}),
  }
}

export function normalizeCharacter(character: Character): Character {
  return {
    version: 1,
    ...keptPhoto(character),
    parts: character.parts.map((part) => {
      const definition = getPart(part.partId)
      if (definition?.category !== 'head') {
        return definition && !definition.mirrorable ? { ...part, mirror: false } : part
      }
      return { ...part, x: 0.5, y: 0.5, rotation: 0, mirror: false }
    }),
  }
}

export function assembleRandomFace(
  random: () => number = Math.random,
  createId: () => string = () => crypto.randomUUID()
): Character {
  const pick = <T,>(items: T[]): T => items[Math.floor(random() * items.length)]
  const head = pick(partsIn('head'))
  const eyes = pick(partsIn('eyes', 'cartoon'))
  const mouth = pick(partsIn('mouth', 'cartoon'))
  const parts: PlacedPart[] = [
    place(head, createId),
    ...pairOffsets('eyes').map((side) =>
      place(eyes, createId, { x: side.x, mirror: side.mirror })
    ),
    place(mouth, createId),
  ]
  return { version: 1, parts }
}

export function addCatalogPart(
  character: Character,
  partId: string,
  createId: () => string = () => crypto.randomUUID()
): { character: Character } | { error: string } {
  const definition = getPart(partId)
  if (!definition) return { error: 'That sticker is not in the catalog.' }

  if (definition.category === 'head') {
    const next = character.parts.filter((part) => getPart(part.partId)?.category !== 'head')
    return {
      character: normalizeCharacter({
        version: 1,
        ...keptPhoto(character),
        parts: [place(definition, createId), ...next],
      }),
    }
  }

  const room = PART_CAPS[definition.category] - countCategory(character, definition.category)
  if (room <= 0) return { error: 'That is enough of those.' }

  const additions: PlacedPart[] = []
  if (PAIR_CATEGORIES.has(definition.category)) {
    const sides = pairOffsets(definition.category).slice(0, Math.min(room, 2))
    for (const side of sides) {
      additions.push(place(definition, createId, { x: side.x, mirror: side.mirror }))
    }
  } else {
    const same = character.parts.filter((part) => part.partId === partId).length
    const x = clamp(definition.defaultPlacement.x + same * 0.08, 0.12, 0.88)
    additions.push(place(definition, createId, { x }))
  }

  return {
    character: normalizeCharacter({
      version: 1,
      ...keptPhoto(character),
      parts: [...character.parts, ...additions],
    }),
  }
}

export function updatePart(
  character: Character,
  instanceId: string,
  patch: PartPatch
): Character {
  return normalizeCharacter({
    version: 1,
    ...keptPhoto(character),
    parts: character.parts.map((part) => {
      if (part.instanceId !== instanceId) return part
      const definition = getPart(part.partId)
      const next: PlacedPart = {
        ...part,
        ...patch,
        instanceId: part.instanceId,
        partId: part.partId,
      }
      next.x = clamp(next.x, 0, 1)
      next.y = clamp(next.y, 0, 1)
      next.scale = clamp(next.scale, 0.05, 1.2)
      next.rotation = clamp(next.rotation, -180, 180)
      if (definition && !definition.mirrorable) next.mirror = false
      return next
    }),
  })
}

export function deletePart(character: Character, instanceId: string): Character {
  const target = character.parts.find((part) => part.instanceId === instanceId)
  if (getPart(target?.partId ?? '')?.category === 'head') return character
  return normalizeCharacter({
    version: 1,
    ...keptPhoto(character),
    parts: character.parts.filter((part) => part.instanceId !== instanceId),
  })
}

export function bringPartIntoView(character: Character, instanceId: string): Character {
  const target = character.parts.find((part) => part.instanceId === instanceId)
  const definition = target ? getPart(target.partId) : undefined
  if (!target || !definition) return character
  return updatePart(character, instanceId, {
    x: definition.defaultPlacement.x,
    y: definition.defaultPlacement.y,
  })
}

export function readSavedFace(): Character | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(FACE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Character
    if (parsed?.version !== 1 || !Array.isArray(parsed.parts)) return null
    if (parsed.parts.some((part) => !getPart(part.partId))) return null
    return normalizeCharacter(parsed)
  } catch {
    return null
  }
}

export function writeSavedFace(character: Character): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FACE_KEY, JSON.stringify(normalizeCharacter(character)))
}

export function readSavedName(): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(NAME_KEY) ?? ''
}

export function writeSavedName(name: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(NAME_KEY, name)
}
