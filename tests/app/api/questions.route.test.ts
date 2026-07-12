import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
  isUnauthorized: (result: unknown) => result instanceof NextResponse,
}))

vi.mock('@/lib/db', () => ({
  getQuestions: vi.fn(),
  createQuestion: vi.fn(),
}))

import { requireAuth } from '@/lib/auth'
import { getQuestions, createQuestion } from '@/lib/db'
import { GET, POST } from '@/app/api/questions/route'
import { QuestionType } from '@/types/question_types'

describe('GET /api/questions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns questions on success', async () => {
    const mockQuestions = [
      {
        id: '1',
        question: 'Q1',
        answers: ['A', 'B'],
        correctAnswer: 'A',
        type: QuestionType.MULTIPLE_CHOICE,
      },
    ]
    vi.mocked(getQuestions).mockResolvedValue(mockQuestions as never)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual(mockQuestions)
  })
})

describe('POST /api/questions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests when Clerk is enabled', async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )

    const request = new Request('http://localhost/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Test?',
        answers: ['A', 'B'],
        correctAnswer: 'A',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    expect(createQuestion).not.toHaveBeenCalled()
  })

  it('creates a question when authenticated', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ userId: 'user_123' })
    const created = {
      id: 'q1',
      question: 'Test?',
      answers: ['A', 'B'],
      correctAnswer: 'A',
      type: QuestionType.MULTIPLE_CHOICE,
    }
    vi.mocked(createQuestion).mockResolvedValue(created as never)

    const request = new Request('http://localhost/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Test?',
        answers: ['A', 'B'],
        correctAnswer: 'A',
        type: QuestionType.MULTIPLE_CHOICE,
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data.question).toEqual(created)
    expect(createQuestion).toHaveBeenCalled()
  })

  it('returns 400 for invalid question payload', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ userId: 'user_123' })

    const request = new Request('http://localhost/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '',
        answers: ['A'],
        correctAnswer: 'A',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    expect(createQuestion).not.toHaveBeenCalled()
  })
})
