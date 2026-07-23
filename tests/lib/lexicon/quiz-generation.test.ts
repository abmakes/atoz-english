import { describe, expect, it } from 'vitest'
import {
  createQuizGenerationPrompt,
  parseGeneratedQuestions,
} from '@/lib/lexicon/quiz-generation'
import { resolveLexicon } from '@/lib/lexicon/resolver'

describe('quiz generation contract', () => {
  it('builds a prompt with a bounded lexical selection', () => {
    const selection = resolveLexicon({
      level: 'A1',
      tags: ['Animals', 'Nouns', 'Present Simple'],
      limit: 30,
    })
    const prompt = createQuizGenerationPrompt({
      selection,
      tags: ['Animals', 'Nouns', 'Present Simple'],
      quizTitle: 'Animals',
      quizDescription: 'A short picture quiz',
      numberOfQuestions: 3,
    })

    expect(prompt).toContain('CEFR band: A1')
    expect(prompt).toContain('Use only words from this allowlist')
    expect(prompt).toContain('subject + base verb')
    expect(prompt).not.toContain('BOOK CONTEXT')
  })

  it('parses a valid fenced response', () => {
    const result = parseGeneratedQuestions(
      '```json\n[{"question":"The cat is ...","answers":["big","run","blue","two"],"correctAnswer":"big"}]\n```',
      1
    )

    expect(result).toHaveLength(1)
    expect(result[0].correctAnswer).toBe('big')
  })

  it('rejects a correct answer that is not one of the options', () => {
    expect(() =>
      parseGeneratedQuestions(
        '[{"question":"Choose","answers":["one","two","three","four"],"correctAnswer":"five"}]',
        1
      )
    ).toThrow()
  })

  it('rejects an unexpected question count', () => {
    expect(() =>
      parseGeneratedQuestions(
        '[{"question":"Choose","answers":["one","two","three","four"],"correctAnswer":"one"}]',
        2
      )
    ).toThrow('Expected 2 questions')
  })
})
