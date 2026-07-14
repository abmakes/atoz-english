import type { QuestionType } from '@/types/question_types'

export type DraftQuestion = {
  id?: string
  question: string
  answers: string[]
  correctAnswer: string
  imageUrl: string
  imageMetadata?: {
    pixabayId: number
    pixabayUser: string
    tags: string[]
    searchTerm: string
    width: number
    height: number
  }
  type: QuestionType
}

export type DraftQuizSetup = {
  title: string
  description: string
  coverImageUrl: string
  quizType: QuestionType
  tags: string[]
}

export type DraftQuizSettings = {
  theme?: string
  powerUps?: string[]
  gameMode?: 'basic' | 'boosted'
  guessOptions?: string
  timeLimit?: string
  music?: boolean
  soundEffects?: boolean
}

export type QuizDraftSnapshot = {
  id: string
  mode: 'create' | 'edit'
  quizId?: string
  updatedAt: string
  creationStep: 'setup' | 'content' | 'publish'
  contentView: 'create' | 'upload' | 'ai-generation'
  quizSetup: DraftQuizSetup
  questions: DraftQuestion[]
  settings: DraftQuizSettings
}

const STORAGE_KEY = 'atoz-quiz-drafts'
const MAX_DRAFTS = 12

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

function readAll(): QuizDraftSnapshot[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((d): d is QuizDraftSnapshot => !!d && typeof d === 'object' && typeof (d as QuizDraftSnapshot).id === 'string')
  } catch {
    return []
  }
}

function writeAll(drafts: QuizDraftSnapshot[]) {
  if (!canUseStorage()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts.slice(0, MAX_DRAFTS)))
}

/** Active working draft key for create vs edit sessions */
export function getWorkingDraftId(mode: 'create' | 'edit', quizId?: string): string {
  if (mode === 'edit' && quizId) return `edit:${quizId}`
  return 'create:active'
}

export function listQuizDrafts(): QuizDraftSnapshot[] {
  return readAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function getQuizDraft(id: string): QuizDraftSnapshot | null {
  return readAll().find((d) => d.id === id) ?? null
}

export function upsertQuizDraft(
  partial: Omit<QuizDraftSnapshot, 'updatedAt'> & { updatedAt?: string }
): QuizDraftSnapshot {
  const draft: QuizDraftSnapshot = {
    ...partial,
    updatedAt: partial.updatedAt ?? new Date().toISOString(),
  }
  const others = readAll().filter((d) => d.id !== draft.id)
  writeAll([draft, ...others])
  return draft
}

export function deleteQuizDraft(id: string): void {
  writeAll(readAll().filter((d) => d.id !== id))
}

export function clearWorkingDraft(mode: 'create' | 'edit', quizId?: string): void {
  deleteQuizDraft(getWorkingDraftId(mode, quizId))
}

/** True if draft has meaningful content worth keeping */
export function draftHasContent(draft: Pick<QuizDraftSnapshot, 'quizSetup' | 'questions'>): boolean {
  const title = draft.quizSetup.title?.trim()
  const desc = draft.quizSetup.description?.trim()
  const hasQuestionText = draft.questions.some((q) => q.question?.trim())
  return Boolean(title || desc || hasQuestionText || draft.questions.length > 1)
}
