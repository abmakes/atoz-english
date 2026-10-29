import { describe, expect, it, vi } from 'vitest'
import { QuizDataSource } from '@/lib/game-engine/quiz/QuizDataSource'
import { QuestionType } from '@/types/question_types'

const validQuestion = {
  id: 'q1',
  question: 'Which color?',
  answers: ['Red', 'Blue'],
  correctAnswer: 'Blue',
  type: QuestionType.MULTIPLE_CHOICE,
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => body,
  } as Response
}

describe('QuizDataSource', () => {
  it('parses a wrapped quiz payload and builds a sequencer', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          id: 'quiz-1',
          title: 'Colors',
          quizType: QuestionType.MULTIPLE_CHOICE,
          questions: [validQuestion],
        },
      })
    )
    const source = new QuizDataSource(fetcher)
    const quiz = await source.loadQuiz('quiz-1')
    expect(quiz.id).toBe('quiz-1')
    expect(quiz.questions).toHaveLength(1)
    expect(fetcher).toHaveBeenCalledWith(
      '/api/quizzes/quiz-1',
      expect.objectContaining({ method: 'GET' })
    )

    const sequencer = source.createSequencer(quiz, 1, {
      distributionMode: 'sharedPool',
      randomizeOrder: false,
    })
    expect(sequencer.getTotalQuestionsToAsk()).toBe(1)
    expect(sequencer.getNextQuestion()?.id).toBe('q1')
  })

  it('rejects missing questions and unsupported types', async () => {
    const missing = new QuizDataSource(
      vi.fn().mockResolvedValue(jsonResponse({ id: 'quiz-1', title: 'Empty' }))
    )
    await expect(missing.loadQuiz('quiz-1')).rejects.toThrow(/missing questions/)

    const badType = new QuizDataSource(
      vi.fn().mockResolvedValue(
        jsonResponse({
          id: 'quiz-1',
          questions: [{ ...validQuestion, type: 'NOT_A_TYPE' }],
        })
      )
    )
    await expect(badType.loadQuiz('quiz-1')).rejects.toThrow(/unsupported type/)
  })

  it('uses a window-bound fetch so browsers do not throw Illegal invocation', async () => {
    function windowFetch(
      this: unknown,
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      if (this !== globalThis) {
        throw new TypeError(
          "Failed to execute 'fetch' on 'Window': Illegal invocation"
        )
      }
      return Promise.resolve(
        jsonResponse({
          id: 'quiz-1',
          questions: [validQuestion],
          quizType: QuestionType.MULTIPLE_CHOICE,
        })
      )
    }

    vi.stubGlobal('fetch', windowFetch)
    try {
      const source = new QuizDataSource()
      await expect(source.loadQuiz('quiz-1')).resolves.toMatchObject({
        id: 'quiz-1',
        questions: [{ id: 'q1' }],
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('rejects empty quiz ids and HTTP errors', async () => {
    const source = new QuizDataSource(
      vi.fn().mockResolvedValue(jsonResponse({}, false, 404))
    )
    await expect(source.loadQuiz('   ')).rejects.toThrow(/requires a quiz id/)
    await expect(source.loadQuiz('missing')).rejects.toThrow(/Quiz request failed: 404/)
  })
})
