import { z } from 'zod'
import { PART_CAPS, getPart, type ThoughtCategory } from '@/lib/thoughts/catalog'
import { VOICE_EFFECTS } from '@/lib/thoughts/voices'

export const RECORDING_MAX_BYTES = 6 * 1024 * 1024
export const RECORDING_MAX_DURATION_MS = 60_000
export const ENVELOPE_WINDOW_MS = 50
const ENVELOPE_MAX_POINTS = Math.ceil(RECORDING_MAX_DURATION_MS / ENVELOPE_WINDOW_MS) + 5

export const studentNameSchema = z.string().trim().min(1).max(40)

export const voiceEffectSchema = z.enum(VOICE_EFFECTS)

export const placedPartSchema = z.object({
  instanceId: z.string().trim().min(8).max(80),
  partId: z.string().trim().min(1).max(80),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  scale: z.number().min(0.05).max(1.2),
  rotation: z.number().min(-180).max(180),
  mirror: z.boolean(),
})

export const characterSchema = z
  .object({
    version: z.literal(1),
    parts: z.array(placedPartSchema).min(1).max(19),
  })
  .superRefine((character, ctx) => {
    const instanceIds = new Set<string>()
    const counts: Partial<Record<ThoughtCategory, number>> = {}
    for (const part of character.parts) {
      if (instanceIds.has(part.instanceId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Each sticker needs its own id.',
        })
      }
      instanceIds.add(part.instanceId)
      const definition = getPart(part.partId)
      if (!definition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown sticker: ${part.partId}`,
        })
        continue
      }
      counts[definition.category] = (counts[definition.category] ?? 0) + 1
      if (part.mirror && !definition.mirrorable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${definition.label} cannot be mirrored.`,
        })
      }
      if (definition.category === 'head') {
        if (part.x !== 0.5 || part.y !== 0.5 || part.rotation !== 0 || part.mirror) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'The head stays centered.',
          })
        }
      }
    }
    if ((counts.head ?? 0) !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A face needs exactly one head.',
      })
    }
    for (const [category, cap] of Object.entries(PART_CAPS) as Array<
      [ThoughtCategory, number]
    >) {
      if ((counts[category] ?? 0) > cap) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Too many ${category}.`,
        })
      }
    }
  })

export const envelopeSchema = z.array(z.number().min(0).max(1)).min(1).max(ENVELOPE_MAX_POINTS)

export function envelopeFitsDuration(envelope: number[], durationMs: number): boolean {
  const expected = Math.ceil(durationMs / ENVELOPE_WINDOW_MS)
  return envelope.length <= expected + 5
}

export const submissionMetaSchema = z
  .object({
    clientKey: z.string().uuid(),
    durationMs: z.number().int().min(400).max(RECORDING_MAX_DURATION_MS),
    envelope: envelopeSchema,
    character: characterSchema,
    voiceEffect: voiceEffectSchema,
  })
  .refine((meta) => envelopeFitsDuration(meta.envelope, meta.durationMs), {
    message: 'The recording envelope does not match its duration.',
  })

export type SubmissionMeta = z.infer<typeof submissionMetaSchema>

export const challengeCreateSchema = z.object({
  title: z.string().trim().min(1).max(80),
  prompt: z.string().trim().min(3).max(400),
})

export const challengePatchSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    prompt: z.string().trim().min(3).max(400),
    status: z.enum(['DRAFT', 'READY', 'ARCHIVED']),
    acceptingResponses: z.boolean(),
    showGallery: z.boolean(),
    allowFunnyVoices: z.boolean(),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'Nothing to update.',
  })

export const submissionStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'APPROVED', 'HIDDEN']),
})

export function isAllowedAudioMime(mimeType: string): boolean {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim() ?? ''
  if (!mime) return true
  if (mime.startsWith('audio/')) return true
  return mime === 'video/mp4' || mime === 'video/webm'
}

export function audioExtension(mimeType: string): string {
  const mime = mimeType.toLowerCase()
  if (mime.includes('mp4') || mime.includes('aac')) return 'm4a'
  if (mime.includes('ogg')) return 'ogg'
  return 'webm'
}
