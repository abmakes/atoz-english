export const FACE_MASKS = ['circle', 'rounded', 'square'] as const

export type FaceMask = (typeof FACE_MASKS)[number]

export type BackdropKind = 'solid' | 'gradient' | 'pattern'

export interface BackdropOption {
  id: string
  label: string
  group: 'plain' | 'gradient' | 'pattern'
  kind: BackdropKind
  /** CSS preview for the picker. */
  preview: string
  from?: string
  to?: string
  color?: string
}

export const BACKDROPS: readonly BackdropOption[] = [
  { id: 'white', label: 'White', group: 'plain', kind: 'solid', color: '#ffffff', preview: '#ffffff' },
  {
    id: 'sky',
    label: 'Sky',
    group: 'gradient',
    kind: 'gradient',
    from: '#dbeafe',
    to: '#fef9c3',
    preview: 'linear-gradient(#dbeafe, #fef9c3)',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    group: 'gradient',
    kind: 'gradient',
    from: '#fecdd3',
    to: '#fde68a',
    preview: 'linear-gradient(#fecdd3, #fde68a)',
  },
  {
    id: 'mint',
    label: 'Mint',
    group: 'gradient',
    kind: 'gradient',
    from: '#d1fae5',
    to: '#e0f2fe',
    preview: 'linear-gradient(#d1fae5, #e0f2fe)',
  },
  {
    id: 'lilac',
    label: 'Lilac',
    group: 'gradient',
    kind: 'gradient',
    from: '#ede9fe',
    to: '#fce7f3',
    preview: 'linear-gradient(#ede9fe, #fce7f3)',
  },
  {
    id: 'dots',
    label: 'Dots',
    group: 'pattern',
    kind: 'pattern',
    preview: 'radial-gradient(#c4b5fd 18%, #ffffff 19%) 0 0 / 14px 14px',
  },
  {
    id: 'stripes',
    label: 'Stripes',
    group: 'pattern',
    kind: 'pattern',
    preview: 'repeating-linear-gradient(#e0f2fe, #e0f2fe 8px, #ffffff 8px, #ffffff 16px)',
  },
  {
    id: 'grid',
    label: 'Grid',
    group: 'pattern',
    kind: 'pattern',
    preview:
      'linear-gradient(#e2e8f0 1px, transparent 1px) 0 0 / 10px 10px, linear-gradient(90deg, #e2e8f0 1px, transparent 1px) 0 0 / 10px 10px, #ffffff',
  },
]

export const BACKDROP_IDS = BACKDROPS.map((item) => item.id) as [string, ...string[]]

const byId = new Map(BACKDROPS.map((item) => [item.id, item]))

export function getBackdrop(id: string | undefined): BackdropOption {
  return byId.get(id ?? '') ?? BACKDROPS[0]
}

export function sanitizeBackdrop(value: unknown): string | undefined {
  if (typeof value !== 'string' || value === 'white') return undefined
  return byId.has(value) ? value : undefined
}

export function sanitizeFaceMask(value: unknown): Exclude<FaceMask, 'circle'> | undefined {
  if (value === 'rounded' || value === 'square') return value
  return undefined
}

export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  backdropId: string | undefined,
  stage: number
): void {
  const backdrop = getBackdrop(backdropId)
  ctx.save()
  if (backdrop.kind === 'solid') {
    ctx.fillStyle = backdrop.color ?? '#ffffff'
    ctx.fillRect(0, 0, stage, stage)
  } else if (backdrop.kind === 'gradient') {
    const gradient = ctx.createLinearGradient(0, 0, 0, stage)
    gradient.addColorStop(0, backdrop.from ?? '#ffffff')
    gradient.addColorStop(1, backdrop.to ?? '#ffffff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, stage, stage)
  } else if (backdrop.id === 'stripes') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, stage, stage)
    ctx.fillStyle = '#e0f2fe'
    const band = stage / 14
    for (let index = 0; index < 14; index += 2) {
      ctx.fillRect(0, index * band, stage, band)
    }
  } else if (backdrop.id === 'grid') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, stage, stage)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = Math.max(1, stage / 180)
    const gap = stage / 10
    ctx.beginPath()
    for (let position = gap; position < stage; position += gap) {
      ctx.moveTo(position, 0)
      ctx.lineTo(position, stage)
      ctx.moveTo(0, position)
      ctx.lineTo(stage, position)
    }
    ctx.stroke()
  } else {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, stage, stage)
    ctx.fillStyle = '#c4b5fd'
    const gap = stage / 12
    const radius = gap * 0.16
    for (let y = gap / 2; y < stage; y += gap) {
      for (let x = gap / 2; x < stage; x += gap) {
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  ctx.restore()
}
