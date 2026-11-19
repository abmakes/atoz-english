import { PrismaClient } from '../../../prisma/app/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import type { WorksheetItem } from '@/lib/lesson/assess'
import type { WorksheetRunReport } from '@/lib/lesson/worksheet-generation'

/**
 * These tables are created on first use. Preview builds do not run migrations,
 * same as LessonKit.
 */
function ddlClient(): { client: PrismaClient; close: boolean } {
  const direct = process.env.POSTGRES_URL_NON_POOLING
  if (!direct) return { client: prisma, close: false }
  return { client: new PrismaClient({ datasources: { db: { url: direct } } }), close: true }
}

let ready: Promise<void> | null = null

export function ensureWorksheetTables(): Promise<void> {
  if (!ready) {
    ready = createWorksheetTables().catch((error) => {
      ready = null
      throw error
    })
  }
  return ready
}

async function createWorksheetTables(): Promise<void> {
  const { client, close } = ddlClient()
  try {
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WorksheetRun" (
        "id" TEXT PRIMARY KEY,
        "authorId" TEXT NOT NULL,
        "quizId" TEXT,
        "sheetId" TEXT,
        "title" TEXT NOT NULL DEFAULT '',
        "level" TEXT NOT NULL DEFAULT '',
        "status" TEXT NOT NULL,
        "rejected" JSONB NOT NULL,
        "solver" JSONB NOT NULL,
        "error" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "WorksheetRun_authorId_createdAt_idx" ON "WorksheetRun"("authorId", "createdAt")`
    )
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WorksheetSheet" (
        "id" TEXT PRIMARY KEY,
        "authorId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "level" TEXT NOT NULL,
        "grammar" TEXT NOT NULL DEFAULT '',
        "source" TEXT NOT NULL DEFAULT '',
        "items" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "WorksheetSheet_authorId_idx" ON "WorksheetSheet"("authorId")`
    )
  } finally {
    if (close) await client.$disconnect().catch(() => {})
  }
}

export async function saveWorksheetRun(input: {
  authorId: string
  quizId?: string | null
  sheetId?: string | null
  title: string
  level: string
  report: WorksheetRunReport
}): Promise<string | null> {
  try {
    await ensureWorksheetTables()
    const id = crypto.randomUUID()
    await prisma.$executeRawUnsafe(
      `INSERT INTO "WorksheetRun"
        ("id", "authorId", "quizId", "sheetId", "title", "level", "status", "rejected", "solver", "error", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, NOW())`,
      id,
      input.authorId,
      input.quizId ?? null,
      input.sheetId ?? null,
      input.title.slice(0, 200),
      input.level,
      input.report.status,
      JSON.stringify(input.report.rejected),
      JSON.stringify(input.report.solver),
      input.report.error.slice(0, 2000)
    )
    return id
  } catch (error) {
    console.error(JSON.stringify({ source: 'worksheet-generation', reason: 'report-not-stored', error: String(error) }))
    return null
  }
}

export interface WorksheetRunRow {
  id: string
  title: string
  level: string
  status: string
  rejected: unknown
  solver: unknown
  error: string
  createdAt: Date
}

export async function listWorksheetRuns(authorId: string): Promise<WorksheetRunRow[]> {
  await ensureWorksheetTables()
  return prisma.$queryRawUnsafe<WorksheetRunRow[]>(
    `SELECT "id", "title", "level", "status", "rejected", "solver", "error", "createdAt"
     FROM "WorksheetRun" WHERE "authorId" = $1 ORDER BY "createdAt" DESC LIMIT 40`,
    authorId
  )
}

export interface WorksheetSheetRow {
  id: string
  title: string
  level: string
  grammar: string
  source: string
  items: WorksheetItem[]
  createdAt: Date
  updatedAt: Date
}

export async function saveWorksheetSheet(input: {
  authorId: string
  title: string
  level: string
  grammar: string
  source: string
  items: WorksheetItem[]
}): Promise<string> {
  await ensureWorksheetTables()
  const id = crypto.randomUUID()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "WorksheetSheet"
      ("id", "authorId", "title", "level", "grammar", "source", "items", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW())`,
    id,
    input.authorId,
    input.title.slice(0, 200),
    input.level,
    input.grammar.slice(0, 500),
    input.source.slice(0, 4000),
    JSON.stringify(input.items)
  )
  return id
}

export async function listWorksheetSheets(authorId: string): Promise<Omit<WorksheetSheetRow, 'items' | 'source'>[]> {
  await ensureWorksheetTables()
  return prisma.$queryRawUnsafe(
    `SELECT "id", "title", "level", "grammar", "createdAt", "updatedAt"
     FROM "WorksheetSheet" WHERE "authorId" = $1 ORDER BY "updatedAt" DESC LIMIT 40`,
    authorId
  )
}

export async function readWorksheetSheet(authorId: string, id: string): Promise<WorksheetSheetRow | null> {
  await ensureWorksheetTables()
  const rows = await prisma.$queryRawUnsafe<WorksheetSheetRow[]>(
    `SELECT "id", "title", "level", "grammar", "source", "items", "createdAt", "updatedAt"
     FROM "WorksheetSheet" WHERE "id" = $1 AND "authorId" = $2`,
    id,
    authorId
  )
  return rows[0] ?? null
}

export async function updateWorksheetSheet(authorId: string, id: string, items: WorksheetItem[]): Promise<boolean> {
  await ensureWorksheetTables()
  const count = await prisma.$executeRawUnsafe(
    `UPDATE "WorksheetSheet" SET "items" = $3::jsonb, "updatedAt" = NOW() WHERE "id" = $1 AND "authorId" = $2`,
    id,
    authorId,
    JSON.stringify(items)
  )
  return count > 0
}
