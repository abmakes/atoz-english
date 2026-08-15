import { describe, expect, it } from 'vitest'
import { QuestionType } from '@/types/question_types'
import {
  buildExternalAiPrompt,
  extractJsonPayload,
  parseImportedQuestionsJson,
} from '@/lib/ai/prompt-import'

describe('prompt-import', () => {
  it('builds a prompt with quiz metadata and question count', () => {
    const prompt = buildExternalAiPrompt({
      quizTitle: 'Animals at the zoo',
      quizDescription: 'Practice animal names',
      tags: ['A1', 'Animals', 'Present Simple'],
      numberOfQuestions: 5,
      exampleSentences: 'What animal is this? / Lions live in Africa.',
      themesVocabulary: 'zoo animals, habitats',
    })

    expect(prompt).toContain('Animals at the zoo')
    expect(prompt).toContain('Practice animal names')
    expect(prompt).toContain('5-question')
    expect(prompt).toContain('What animal is this? / Lions live in Africa.')
    expect(prompt).toContain('zoo animals, habitats')
    expect(prompt).toContain('"answers"')
    expect(prompt).toContain('correctAnswer')
    expect(prompt).not.toContain('[[')
    expect(prompt).not.toContain('WRITING RULES')
  })

  it('parses answers-array JSON', () => {
    const questions = parseImportedQuestionsJson(
      JSON.stringify([
        {
          question: 'What is it?',
          answers: ['a pen', 'a pencil', 'a rubber', 'a ruler'],
          correctAnswer: 'a pen',
        },
      ]),
      QuestionType.MULTIPLE_CHOICE
    )

    expect(questions).toHaveLength(1)
    expect(questions[0].answers).toEqual([
      'a pen',
      'a pencil',
      'a rubber',
      'a ruler',
    ])
    expect(questions[0].correctAnswer).toBe('a pen')
  })

  it('parses CSV-style keys and markdown fences', () => {
    const raw = `Here you go:
\`\`\`json
{
  "questions": [
    {
      "question": "Who wrote Romeo and Juliet?",
      "answer1": "Charles Dickens",
      "answer2": "William Shakespeare",
      "answer3": "Jane Austen",
      "answer4": "Mark Twain",
      "correctAnswer": "William Shakespeare"
    }
  ]
}
\`\`\``

    expect(extractJsonPayload(raw)).toContain('"questions"')

    const questions = parseImportedQuestionsJson(raw)
    expect(questions).toHaveLength(1)
    expect(questions[0].correctAnswer).toBe('William Shakespeare')
    expect(questions[0].answers).toHaveLength(4)
  })

  it('rejects when correctAnswer is not in answers', () => {
    expect(() =>
      parseImportedQuestionsJson(
        JSON.stringify([
          {
            question: 'What is it?',
            answers: ['a pen', 'a pencil', 'a rubber', 'a ruler'],
            correctAnswer: 'a book',
          },
        ])
      )
    ).toThrow(/correctAnswer must exactly match/)
  })
})
