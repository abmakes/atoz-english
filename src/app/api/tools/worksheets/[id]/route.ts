import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import type { WorksheetItem } from '@/lib/lesson/assess'
import { readWorksheetSheet, updateWorksheetSheet } from '@/lib/lesson/worksheet-store'

const itemSchema = z.object({
  questionId: z.string().optional(),
  line: z.string().min(1).max(500),
  imageUrl: z.string().nullable().optional(),
  choices: z.array(z.string()).max(4),
  activity: z.string().max(40).optional(),
  exercise: z.string().max(80).optional(),
  instruction: z.string().max(200).optional(),
  bank: z.string().max(60).optional(),
  answer: z.string().max(200).optional(),
  example: z.boolean().optional(),
  warning: z.string().max(300).optional(),
  held: z.boolean().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth()
  if (isUnauthorized(authResult)) return authResult
  const { id } = await params
  const sheet = await readWorksheetSheet(authResult.userId, id)
  if (!sheet) return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 })
  return NextResponse.json({ sheet })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth()
  if (isUnauthorized(authResult)) return authResult
  const { id } = await params
  const parsed = z.object({ items: z.array(itemSchema).max(40) }).safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Could not save these lines.' }, { status: 400 })
  const saved = await updateWorksheetSheet(authResult.userId, id, parsed.data.items as WorksheetItem[])
  if (!saved) return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
