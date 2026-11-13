import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { generateText } from '@/lib/ai/gemini-text'
import { assessLessonQuestions } from '@/lib/lesson/assess'
import { saveWorksheetRun } from '@/lib/lesson/worksheet-store'
import type { WorksheetRunReport } from '@/lib/lesson/worksheet-generation'
import { normalizeCefrLevel } from '@/lib/taxonomy/quiz-taxonomy'
import { QuestionType } from '@/types/question_types'

export const maxDuration = 60

const bodySchema = z.object({
  target: z.enum(['worksheet', 'sentence-builder']),
  level: z.string().optional(),
  grammar: z.array(z.string().max(80)).max(12).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  scope: z.enum(['set', 'item']).optional(),
  quizId: z.string().max(80).optional(),
  sourceText: z.string().max(4000).optional(),
  sections: z.array(z.enum(['choice', 'gap', 'circle', 'rewrite'])).max(4).optional(),
  questions: z
    .array(
      z.object({
        id: z.string().optional(),
        question: z.string().min(1).max(500),
        answers: z.array(z.string().max(200)).max(8),
        correctAnswer: z.string().max(4000),
        type: z.nativeEnum(QuestionType),
        imageUrl: z.string().nullable().optional(),
      })
    )
    .min(1)
    .max(40),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid assessment request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const level = normalizeCefrLevel(parsed.data.level ?? '') ?? 'A1'
    let report: WorksheetRunReport | undefined
    const items = await assessLessonQuestions({
      target: parsed.data.target,
      questions: parsed.data.questions,
      level,
      grammar: parsed.data.grammar,
      title: parsed.data.title,
      description: parsed.data.description,
      sourceText: parsed.data.sourceText,
      sections: parsed.data.sections,
      scope: parsed.data.scope,
      solve: parsed.data.target === 'worksheet' && parsed.data.scope !== 'item' && process.env.WORKSHEET_SOLVER !== '0',
      onReport: async (next) => {
        report = next
        if (next.status === 'failed') {
          await saveWorksheetRun({
            authorId: authResult.userId,
            quizId: parsed.data.quizId,
            title: parsed.data.title ?? '',
            level,
            report: next,
          })
        }
      },
      generate: generateText,
    })
    const reportId =
      parsed.data.target === 'worksheet' && report
        ? await saveWorksheetRun({
            authorId: authResult.userId,
            quizId: parsed.data.quizId,
            title: parsed.data.title ?? '',
            level,
            report,
          })
        : null

    return NextResponse.json({ success: true, items, reportId })
  } catch (error) {
    if (
      error instanceof z.ZodError ||
      error instanceof SyntaxError ||
      (error instanceof Error && error.message.startsWith('The AI'))
    ) {
      console.error('Failed to parse AI worksheet:', error)
      return NextResponse.json(
        {
          error:
            error instanceof Error && error.message.startsWith('The AI')
              ? error.message
              : 'The AI returned an invalid question format. Please try again.',
        },
        { status: 502 }
      )
    }
    console.error('Error assessing lesson questions:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message.includes('not configured')
            ? error.message
            : 'Failed to check these questions. Please try again.',
      },
      { status: 500 }
    )
  }
}
