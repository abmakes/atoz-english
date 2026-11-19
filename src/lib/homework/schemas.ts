import { z } from 'zod'

export const studentNameSchema = z.string().trim().min(1).max(40)

export const clientKeySchema = z.string().uuid()

export const homeworkCreateSchema = z.object({
  quizId: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  dueAt: z.string().datetime({ offset: true }),
})

export const homeworkPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    dueAt: z.string().datetime({ offset: true }),
    acceptingResponses: z.boolean(),
    showLeaderboard: z.boolean(),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, { message: 'Nothing to update.' })

export const homeworkSyncSchema = z.object({
  studentName: studentNameSchema,
  clientKey: clientKeySchema,
  questionIds: z.array(z.string().min(1)).min(1).max(200),
  selections: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedAnswer: z.string().trim().min(1).max(500),
      })
    )
    .max(200),
  startedAt: z.string().datetime({ offset: true }),
  submit: z.boolean(),
})

export const startAttemptSchema = z.object({
  studentName: studentNameSchema,
  clientKey: clientKeySchema,
  mode: z.enum(['HOMEWORK', 'CHALLENGE']),
})

export const saveAnswerSchema = z.object({
  clientKey: clientKeySchema,
  questionId: z.string().min(1),
  selectedAnswer: z.string().trim().min(1).max(500),
})

export const challengeSyncSchema = z.object({
  studentName: studentNameSchema,
  clientKey: clientKeySchema,
  startedAt: z.string().datetime({ offset: true }),
  events: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedAnswer: z.string().trim().max(500),
        timedOut: z.boolean(),
        timeUsedMs: z.number().int().min(0).max(120_000),
      })
    )
    .min(1)
    .max(150),
})

export const challengeAnswerSchema = z.object({
  clientKey: clientKeySchema,
  questionId: z.string().min(1),
  selectedAnswer: z.string().trim().max(500).optional(),
  timedOut: z.boolean().optional(),
})

export function cleanStudentName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}
