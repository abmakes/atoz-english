import { describe, expect, it } from 'vitest'
import {
  createTeacherFirstPrompt,
  parseGeneratedQuestions,
} from '@/lib/ai/quiz-generation'
import { resolveLexicon } from '@/lib/lexicon/resolver'

describe('quiz generation contract', () => {
  it('builds a teacher-first prompt with helpful examples', () => {
    const selection = resolveLexicon({
      level: 'A1',
      tags: ['Animals', 'Nouns', 'Present Simple'],
      limit: 30,
    })
    const prompt = createTeacherFirstPrompt({
      brief: {
        level: 'A1',
        topics: ['Animals'],
        grammarFocus: ['Present Simple'],
        teacherNotes: 'A short picture quiz',
        modelSentence: '',
        sentenceForms: ['Affirmative'],
        questionStyles: ['Vocabulary meaning'],
        vocabularyFocus: 'Nouns',
        numberOfQuestions: 3,
        quizTitle: 'Animals',
        quizDescription: 'A short picture quiz',
      },
      selection,
    })

    expect(prompt).toContain('CEFR band: A1')
    expect(prompt).toContain('HELPFUL LEVEL EXAMPLES (not an exclusive allowlist)')
    expect(prompt).toContain('subject + base verb')
    expect(prompt).not.toContain('BOOK CONTEXT')
    expect(prompt).not.toContain('Use only words from this allowlist')
  })

  it('parses a valid fenced response', () => {
    const result = parseGeneratedQuestions(
      '```json\n[{"question":"The cat is ...","answers":["big","run","blue","two"],"correctAnswer":"big"}]\n```',
      1
    )

    expect(result).toHaveLength(1)
    expect(result[0].correctAnswer).toBe('big')
    expect(result[0].imageKeyword).toBeTruthy()
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
