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

export interface Character {
  version: 1
  parts: PlacedPart[]
}

export type PartPatch = Partial<
  Pick<PlacedPart, 'x' | 'y' | 'scale' | 'rotation' | 'mirror'>
>

const FACE_KEY = 'playtoz-thoughts-face-v1'
const NAME_KEY = 'playtoz-thoughts-name-v1'

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
  return placed
}

function countCategory(character: Character, category: ThoughtCategory): number {
  return character.parts.filter((part) => getPart(part.partId)?.category === category).length
}

function pairOffsets(category: ThoughtCategory): Array<{ x: number; mirror: boolean }> {
  if (category === 'ears') {
    return [
      { x: 0.18, mirror: false },
      { x: 0.82, mirror: true },
    ]
  }
  return [
    { x: 0.38, mirror: false },
    { x: 0.62, mirror: true },
  ]
}

export function normalizeCharacter(character: Character): Character {
  return {
    version: 1,
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
  const hair = pick(partsIn('hair', 'cartoon'))
  const eyes = pick(partsIn('eyes', 'cartoon'))
  const ears = pick(partsIn('ears', 'cartoon'))
  const nose = pick(partsIn('nose', 'cartoon'))
  const mouth = pick(partsIn('mouth', 'cartoon'))
  const parts: PlacedPart[] = [
    place(head, createId),
    place(hair, createId),
    ...pairOffsets('eyes').map((side) =>
      place(eyes, createId, { x: side.x, mirror: side.mirror })
    ),
    ...pairOffsets('ears').map((side) =>
      place(ears, createId, { x: side.x, mirror: side.mirror })
    ),
    place(nose, createId),
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
      character: {
        version: 1,
        parts: [place(definition, createId), ...next],
      },
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
    character: { version: 1, parts: [...character.parts, ...additions] },
  }
}

export function updatePart(
  character: Character,
  instanceId: string,
  patch: PartPatch
): Character {
  return normalizeCharacter({
    version: 1,
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
  return {
    version: 1,
    parts: character.parts.filter((part) => part.instanceId !== instanceId),
  }
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
