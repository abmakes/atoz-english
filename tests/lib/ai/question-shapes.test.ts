import { describe, expect, it } from 'vitest'
import { createTeacherFirstPrompt } from '@/lib/ai/quiz-generation'
import {
  createQuestionShapePrompt,
  finalizeShapeSample,
  inferQuestionShape,
  parseGeneratedShapes,
  sanitizeShapeStem,
  splitTeacherExamples,
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

  it('keeps two teacher examples as separate stems', () => {
    expect(
      splitTeacherExamples('Can a crocodile fly?\nAre there any pandas?')
    ).toEqual(['Can a crocodile fly?', 'Are there any pandas?'])

    const joined: QuestionShape[] = [
      {
        shape: 'Yes/No question',
        question: 'Can a crocodile fly? Are there any pandas?',
        answerStyle: 'Yes or no',
      },
      ...shapes.slice(1),
    ]
    const next = finalizeShapeSample(
      joined,
      'Can a crocodile fly?\nAre there any pandas?'
    )
    expect(next[0].question).toBe('Can a crocodile fly?')
    expect(next[1].question).toBe('Are there any pandas?')
    expect(next.map((shape) => shape.question)).not.toContain(
      'Can a crocodile fly? Are there any pandas?'
    )
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
    expect(prompt).toContain('Never mix shapes')
    expect(prompt).toContain('Four complete sentences. One is fully correct.')
    expect(prompt).toContain('I like playing football.')
  })

  it('lists two teacher examples as separate stems in the prompt', () => {
    const prompt = createQuestionShapePrompt({
      level: 'A1',
      topics: ['Animals'],
      grammarFocus: [],
      teacherNotes: '',
      modelSentence: 'Can a crocodile fly?\nAre there any pandas?',
      sentenceForms: [],
      questionStyles: [],
      vocabularyFocus: 'Mixed',
      numberOfQuestions: 10,
      quizTitle: 'Animals',
      quizDescription: 'Yes/no questions',
    })

    expect(prompt).toContain('Never join them into one question')
    expect(prompt).toContain('1. Can a crocodile fly?')
    expect(prompt).toContain('2. Are there any pandas?')
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
    expect(parsed[4]).toMatchObject({
      shape: 'Find the mistake',
      answerStyle: 'Four complete sentences. One is fully correct.',
    })
  })

  it('strips mixed gap-and-mistake wording', () => {
    expect(
      sanitizeShapeStem({
        shape: 'Fill the gap',
        question: 'My keys ______ on the black table. Find the mistake.',
        answerStyle: 'The correction',
      })
    ).toMatchObject({
      question: 'My keys ______ on the black table.',
      answerStyle: 'A word or short phrase that fits the gap.',
    })
    expect(
      sanitizeShapeStem({
        shape: 'Find the mistake',
        question: 'I am like play football. Find the mistake.',
        answerStyle: 'like',
      })
    ).toMatchObject({
      question: 'I am like play football.',
      answerStyle: 'Four complete sentences. One is fully correct.',
    })
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
    expect(prompt).toContain('Never mix shapes')
    expect(prompt).toContain('Never a single word')
  })

  it('requires full-sentence options for a find-the-mistake shape', () => {
    const selection = resolveLexicon({
      level: 'A1',
      tags: ['Sports & Activities'],
      limit: 20,
    })
    const prompt = createTeacherFirstPrompt({
      brief: {
        level: 'A1',
        topics: ['Sports & Activities'],
        grammarFocus: ['Present Simple'],
        teacherNotes: 'Like + -ing',
        modelSentence: 'I am like play football.',
        sentenceForms: [],
        questionStyles: ['Find the mistake'],
        vocabularyFocus: 'Mixed',
        numberOfQuestions: 8,
        quizTitle: 'Sports',
        quizDescription: 'Likes',
        selectedShapes: [
          {
            shape: 'Find the mistake',
            question: 'I am like play football.',
            answerStyle: 'Four complete sentences. One is fully correct.',
          },
        ],
      },
      selection,
    })

    expect(prompt).toContain('I like playing football.')
    expect(prompt).toContain('Never a single word, never a blank, never a fragment')
    expect(prompt).toContain('the correct option is the full corrected sentence')
  })
})
