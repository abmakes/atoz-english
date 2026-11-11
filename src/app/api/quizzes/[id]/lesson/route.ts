import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, PrismaClient } from '../../../../../../prisma/app/generated/prisma/client'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const worksheetItemSchema = z.object({
  questionId: z.string().optional(),
  line: z.string().trim().min(1).max(500),
  imageUrl: z.string().nullable().optional(),
  choices: z.array(z.string().max(120)).max(4),
})

const sentenceSchema = z.object({
  questionId: z.string().optional(),
  text: z.string().trim().min(1).max(500),
  imageUrl: z.string().nullable().optional(),
})

const commitSchema = z.discriminatedUnion('target', [
  z.object({
    target: z.literal('worksheet'),
    items: z.array(worksheetItemSchema).min(1).max(40),
  }),
  z.object({
    target: z.literal('sentence-builder'),
    items: z.array(sentenceSchema).min(1).max(40),
  }),
])

const storedWorksheetSchema = z.object({
  questionId: z.string().optional(),
  line: z.string(),
  imageUrl: z.string().optional(),
  choices: z.array(z.string()).optional(),
})

const storedSentenceSchema = z.object({
  text: z.string(),
  imageUrl: z.string().optional(),
  questionId: z.string().optional(),
})

function readWorksheetItems(value: unknown) {
  const parsed = z.array(storedWorksheetSchema).safeParse(value)
  if (!parsed.success) return []
  return parsed.data.map((item) => ({
    questionId: item.questionId,
    line: item.line,
    imageUrl: item.imageUrl,
    choices: item.choices ?? [],
  }))
}

function readSentences(value: unknown) {
  const parsed = z.array(storedSentenceSchema).safeParse(value)
  if (!parsed.success) return []
  return parsed.data
}

function lessonPayload(lesson: {
  id: string
  title: string
  worksheetItems: unknown
  sentences: unknown
}) {
  return {
    id: lesson.id,
    title: lesson.title,
    worksheetItems: readWorksheetItems(lesson.worksheetItems),
    sentences: readSentences(lesson.sentences),
  }
}

async function ownedQuiz(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  })
  if (!quiz) return { error: NextResponse.json({ error: 'Quiz not found' }, { status: 404 }) }
  if (quiz.authorId !== userId) {
    return { error: NextResponse.json({ error: 'This quiz is not on your profile.' }, { status: 403 }) }
  }
  return { quiz }
}

function missingLessonTable(error: unknown): boolean {
  const code =
    typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : ''
  const message = error instanceof Error ? error.message : String(error)
  return code === 'P2021' || (/lessonkit/i.test(message) && /does not exist/i.test(message))
}

/**
 * Preview and production builds do not run migrations. The first lesson open
 * creates the table on the direct database connection. The pooled Neon URL
 * rejects this DDL and can kill the function, which comes back as plain text
 * instead of JSON.
 */
function lessonDdlClient(): { client: PrismaClient; close: boolean } {
  const direct = process.env.POSTGRES_URL_NON_POOLING
  if (!direct) return { client: prisma, close: false }
  return {
    client: new PrismaClient({ datasources: { db: { url: direct } } }),
    close: true,
  }
}

function alreadyExists(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /already exists|duplicate_object/i.test(message)
}

async function ensureLessonKitTable(): Promise<void> {
  const { client, close } = lessonDdlClient()
  try {
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LessonKit" (
        "id" TEXT NOT NULL,
        "authorId" TEXT NOT NULL DEFAULT 'admin',
        "quizId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "worksheetItems" JSONB NOT NULL,
        "sentences" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "LessonKit_pkey" PRIMARY KEY ("id")
      )
    `)
    await client.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "LessonKit_quizId_key" ON "LessonKit"("quizId")`
    )
    await client.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "LessonKit_authorId_idx" ON "LessonKit"("authorId")`
    )
    try {
      await client.$executeRawUnsafe(`
        ALTER TABLE "LessonKit"
          ADD CONSTRAINT "LessonKit_quizId_fkey"
          FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `)
    } catch (error) {
      if (!alreadyExists(error)) throw error
    }
  } finally {
    if (close) await client.$disconnect().catch(() => {})
  }
}

async function upsertLesson(input: {
  userId: string
  quizId: string
  title: string
  worksheetItems?: Prisma.InputJsonValue
  sentences?: Prisma.InputJsonValue
}) {
  const create = {
    authorId: input.userId,
    quizId: input.quizId,
    title: input.title,
    worksheetItems: input.worksheetItems ?? [],
    sentences: input.sentences ?? [],
  }
  const update =
    input.worksheetItems !== undefined
      ? { worksheetItems: input.worksheetItems }
      : input.sentences !== undefined
        ? { sentences: input.sentences }
        : {}
  try {
    return await prisma.lessonKit.upsert({
      where: { quizId: input.quizId },
      create,
      update,
    })
  } catch (error) {
    if (!missingLessonTable(error)) throw error
    await ensureLessonKitTable()
    return prisma.lessonKit.upsert({
      where: { quizId: input.quizId },
      create,
      update,
    })
  }
}

function quizPayload(quiz: {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  tags: string[]
  questions: Array<{
    id: string
    question: string
    answers: string[]
    correctAnswer: string
    type: string
    imageUrl: string | null
  }>
}) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    imageUrl: quiz.imageUrl,
    tags: quiz.tags,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      question: question.question,
      answers: question.answers,
      correctAnswer: question.correctAnswer,
      type: question.type,
      imageUrl: question.imageUrl,
    })),
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult

    const owned = await ownedQuiz(id, authResult.userId)
    if (owned.error) return owned.error
    const quiz = owned.quiz

    const lesson = await upsertLesson({
      userId: authResult.userId,
      quizId: quiz.id,
      title: quiz.title,
    })

    return NextResponse.json({
      data: {
        quiz: quizPayload(quiz),
        lesson: lessonPayload(lesson),
      },
    })
  } catch (error) {
    console.error(`API Error in GET /api/quizzes/${id}/lesson:`, error)
    return NextResponse.json({ error: 'Failed to open this lesson.' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult

    const parsed = commitSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Approve at least one item before continuing.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const owned = await ownedQuiz(id, authResult.userId)
    if (owned.error) return owned.error
    const quiz = owned.quiz

    const worksheetItems =
      parsed.data.target === 'worksheet'
        ? (parsed.data.items as unknown as Prisma.InputJsonValue)
        : undefined
    const sentences =
      parsed.data.target === 'sentence-builder'
        ? (parsed.data.items as unknown as Prisma.InputJsonValue)
        : undefined

    const lesson = await upsertLesson({
      userId: authResult.userId,
      quizId: quiz.id,
      title: quiz.title,
      worksheetItems,
      sentences,
    })

    return NextResponse.json({
      data: {
        quiz: quizPayload(quiz),
        lesson: lessonPayload(lesson),
      },
    })
  } catch (error) {
    console.error(`API Error in POST /api/quizzes/${id}/lesson:`, error)
    return NextResponse.json({ error: 'Failed to save the approved items.' }, { status: 500 })
  }
}
