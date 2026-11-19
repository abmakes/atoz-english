import { PrismaClient } from '../../../prisma/app/generated/prisma/client'
import { prisma } from '@/lib/prisma'

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

export async function ensureLessonKitTable(): Promise<void> {
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
        "thoughtChallengeId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "LessonKit_pkey" PRIMARY KEY ("id")
      )
    `)
    await client.$executeRawUnsafe(
      `ALTER TABLE "LessonKit" ADD COLUMN IF NOT EXISTS "thoughtChallengeId" TEXT`
    )
    await client.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "LessonKit_quizId_key" ON "LessonKit"("quizId")`
    )
    await client.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "LessonKit_thoughtChallengeId_key" ON "LessonKit"("thoughtChallengeId")`
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
    try {
      await client.$executeRawUnsafe(`
        ALTER TABLE "LessonKit"
          ADD CONSTRAINT "LessonKit_thoughtChallengeId_fkey"
          FOREIGN KEY ("thoughtChallengeId") REFERENCES "ThoughtChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE
      `)
    } catch (error) {
      if (!alreadyExists(error)) throw error
    }
  } finally {
    if (close) await client.$disconnect().catch(() => {})
  }
}
