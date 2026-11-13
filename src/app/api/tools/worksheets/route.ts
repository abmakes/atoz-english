import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { generateText } from '@/lib/ai/gemini-text'
import { assessLessonQuestions, commitLessonSelection } from '@/lib/lesson/assess'
import { saveWorksheetRun, listWorksheetSheets, saveWorksheetSheet } from '@/lib/lesson/worksheet-store'
import type { WorksheetRunReport } from '@/lib/lesson/worksheet-generation'
import { normalizeCefrLevel } from '@/lib/taxonomy/quiz-taxonomy'
import { QuestionType } from '@/types/question_types'

const pictureSchema = z.object({
  imageUrl: z.string().min(1).max(500),
  question: z.string().min(1).max(300),
  answers: z.array(z.string().max(80)).min(2).max(4),
  correctAnswer: z.string().min(1).max(80),
})

const bodySchema = z.object({
  title: z.string().trim().min(1).max(160),
  level: z.string().optional(),
  grammar: z.string().max(500).optional(),
  source: z.string().max(4000).optional(),
  sections: z.array(z.enum(['choice', 'gap', 'circle', 'rewrite', 'unjumble', 'write', 'long'])).max(6).optional(),
  pages: z.union([z.literal(1), z.literal(2)]).optional(),
  pictures: z.array(pictureSchema).max(6).optional(),
})

export async function GET() {
  const authResult = await requireAuth()
  if (isUnauthorized(authResult)) return authResult
  const sheets = await listWorksheetSheets(authResult.userId)
  return NextResponse.json({ sheets })
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth()
  if (isUnauthorized(authResult)) return authResult
  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Add a title before generating.' }, { status: 400 })
  }
  const level = normalizeCefrLevel(parsed.data.level ?? '') ?? 'A1'
  const grammar = (parsed.data.grammar ?? '')
    .split(/[,;\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8)
  const pictures = parsed.data.pictures ?? []
  let report: WorksheetRunReport | undefined
  try {
    const items = await assessLessonQuestions({
      target: 'worksheet',
      level,
      grammar,
      title: parsed.data.title,
      description: parsed.data.grammar,
      sourceText: parsed.data.source,
      sections: parsed.data.sections ?? (pictures.length > 0 ? ['choice', 'gap', 'rewrite'] : ['gap', 'circle', 'rewrite']),
      pages: parsed.data.pages,
      solve: process.env.WORKSHEET_SOLVER !== '0',
      onReport: (next) => {
        report = next
      },
      generate: generateText,
      questions: (pictures.length > 0 ? pictures : [{ question: parsed.data.grammar || parsed.data.title, answers: ['yes', 'no'], correctAnswer: 'yes' }]).map(
        (picture, index) => ({
          id: `picture-${index}`,
          question: picture.question,
          answers: picture.answers,
          correctAnswer: picture.correctAnswer,
          type: QuestionType.MULTIPLE_CHOICE,
          imageUrl: 'imageUrl' in picture ? picture.imageUrl : null,
        })
      ),
    })
    const selection = commitLessonSelection(
      'worksheet',
      items.map((item) => ({
        status: 'approved' as const,
        questionId: item.questionId,
        line: item.line,
        choices: item.choices,
        imageUrl: item.imageUrl,
        correctAnswer: item.correctAnswer,
        activity: item.activity,
        exercise: item.exercise,
        instruction: item.instruction,
        bank: item.bank,
        example: item.example,
        warning: item.warning,
      }))
    )
    if (!selection.ok) return NextResponse.json({ error: selection.message }, { status: 400 })
    const id = await saveWorksheetSheet({
      authorId: authResult.userId,
      title: parsed.data.title,
      level,
      grammar: parsed.data.grammar ?? '',
      source: parsed.data.source ?? '',
      items: selection.worksheetItems,
    })
    const reportId = report
      ? await saveWorksheetRun({
          authorId: authResult.userId,
          sheetId: id,
          title: parsed.data.title,
          level,
          report,
        })
      : null
    return NextResponse.json({ id, reportId })
  } catch (error) {
    if (report) {
      await saveWorksheetRun({
        authorId: authResult.userId,
        title: parsed.data.title,
        level,
        report,
      })
    }
    const message = error instanceof Error ? error.message : 'Could not write the worksheet.'
    return NextResponse.json({ error: message }, { status: message.startsWith('The AI') ? 502 : 500 })
  }
}
