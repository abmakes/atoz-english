import { describe, expect, it } from 'vitest'
import { createTeacherFirstPrompt } from '@/lib/ai/quiz-generation'
import {
  createQuestionShapePrompt,
  finalizeShapeSample,
  inferQuestionShape,
  parseGeneratedShapes,
  type QuestionShape,
} from '@/lib/ai/question-shapes'
import { resolveLexicon } from '@/lib/lexicon/resolver'

const shapes: QuestionShape[] = [
  {
    shape: 'Wh-question',
    question: 'What is she doing?',
    answerStyle: 'A present continuous action',
  },
  {
    shape: 'Wh-question',
    question: 'What are they doing?',
    answerStyle: 'A present continuous action',
  },
  {
    shape: 'Fill the gap',
    question: 'She is _____.',
    answerStyle: 'A present continuous verb',
  },
  {
    shape: 'Yes/No question',
    question: 'Is she swimming?',
    answerStyle: 'Yes or no',
  },
  {
    shape: 'Find the mistake',
    question: 'He are swimming.',
    answerStyle: 'The corrected sentence',
  },
  {
    shape: 'Affirmative',
    question: 'The boy is running.',
    answerStyle: 'A present continuous sentence',
  },
]

describe('question shape sample', () => {
  it('labels a wh-question, a yes/no question, and a gap', () => {
    expect(inferQuestionShape('What is he doing?')).toBe('Wh-question')
    expect(inferQuestionShape('Is she swimming?')).toBe('Yes/No question')
    expect(inferQuestionShape('She is _____.')).toBe('Fill the gap')
  })

  it('pins the teacher example as the first stem', () => {
    const next = finalizeShapeSample(shapes, 'What is he doing?')
    expect(next).toHaveLength(6)
    expect(next[0]).toMatchObject({
      shape: 'Wh-question',
      question: 'What is he doing?',
    })
    expect(next.map((shape) => shape.question)).not.toContain('The boy is running.')
    expect(next.filter((shape) => shape.question === 'What is he doing?')).toHaveLength(1)
  })

  it('asks for close variants and other forms of the same point', () => {
    const prompt = createQuestionShapePrompt({
      level: 'A1',
      topics: ['Colors & Numbers'],
      grammarFocus: ['Present Continuous'],
      teacherNotes: 'Numbers from 100 to 1000, written in full.',
      modelSentence: 'What is he doing?',
      sentenceForms: ['Yes/No question'],
      questionStyles: ['Fill the gap'],
      vocabularyFocus: 'Mixed',
      numberOfQuestions: 10,
      quizTitle: 'Actions',
      quizDescription: 'Present continuous',
    })

    expect(prompt).toContain('What is he doing?')
    expect(prompt).toContain('Rows 2 and 3 keep that same shape')
    expect(prompt).toContain('Rows 4, 5, and 6 are different forms')
    expect(prompt).toContain('do not write color questions')
    expect(prompt).toContain('present continuous')
    expect(prompt).not.toContain('imageKeyword')
  })

  it('parses a fenced shape list and normalizes the label', () => {
    const raw = `\`\`\`json
[{"shape":"yes/no","question":"Is she swimming?","answerStyle":"Yes or no"},
{"shape":"Wh-question","question":"What is she doing?","answerStyle":"An action"},
{"shape":"Fill the gap","question":"She is _____.","answerStyle":"A verb"},
{"shape":"Negative","question":"He is not reading.","answerStyle":"A negative sentence"},
{"shape":"Find the mistake","question":"He are swimming.","answerStyle":"The correction"},
{"shape":"Affirmative","question":"They are eating.","answerStyle":"A sentence"}]
\`\`\``
    const parsed = parseGeneratedShapes(raw)
    expect(parsed).toHaveLength(6)
    expect(parsed[0].shape).toBe('Yes/No question')
  })

  it('rejects a short shape list', () => {
    expect(() =>
      parseGeneratedShapes(
        '[{"shape":"Wh-question","question":"What is he doing?","answerStyle":"An action"}]'
      )
    ).toThrow('Expected 6 question shapes')
  })
})

describe('selected shapes bind the full quiz prompt', () => {
  it('puts ticked shapes ahead of the topic tag', () => {
    const selection = resolveLexicon({
      level: 'A1',
      tags: ['Colors & Numbers'],
      limit: 20,
    })
    const prompt = createTeacherFirstPrompt({
      brief: {
        level: 'A1',
        topics: ['Colors & Numbers'],
        grammarFocus: [],
        teacherNotes: 'Numbers from 100 to 1000, written in full.',
        modelSentence: "What's this number? 428",
        sentenceForms: [],
        questionStyles: [],
        vocabularyFocus: 'Mixed',
        numberOfQuestions: 10,
        quizTitle: 'Big numbers',
        quizDescription: 'Write the number',
        selectedShapes: [
          {
            shape: 'Wh-question',
            question: "What's this number? 428",
            answerStyle: 'The number written in words, with wrong wordings',
          },
          {
            shape: 'Yes/No question',
            question: 'Is 270 written two hundred and seventy?',
            answerStyle: 'Yes or no',
          },
        ],
      },
      selection,
    })

    expect(prompt.indexOf('SELECTED QUESTION SHAPES')).toBeLessThan(
      prompt.indexOf('Colors & Numbers')
    )
    expect(prompt).toContain("What's this number? 428")
    expect(prompt).toContain('Do not add a shape the teacher did not select')
    expect(prompt).toContain('do not add color questions')
    expect(prompt).not.toContain('Keep each answer under 6 words')
    expect(prompt).toContain('up to 12 words')
  })
})
