import { describe, expect, it, vi } from 'vitest'
import { nextChoiceIndex } from '@/lib/pixi-games/sentence-builder/content'
import {
  assessLessonQuestions,
  commitLessonSelection,
  fillGap,
  finishWorksheetSentence,
  isStructuredCorrectAnswer,
  localSentenceAssessment,
  localWorksheetAssessment,
  type SourceQuestion,
} from '@/lib/lesson/assess'
import { promptsFromLesson, sentencePromptFromLesson } from '@/lib/lesson/prompts'
import { QuestionType } from '@/types/question_types'

const kicking: SourceQuestion = {
  id: 'q-kick',
  question: 'he is ___ the ball',
  answers: ['kicking', 'kick', 'kicks', 'kicked'],
  correctAnswer: 'kicking',
  type: QuestionType.MULTIPLE_CHOICE,
  imageUrl: '/images/placeholder.webp',
}

describe('lesson conversion', () => {
  it('fills a four-answer gap and leaves the stored question alone', () => {
    const source = structuredClone(kicking)
    const item = localSentenceAssessment(source)
    expect(item?.converted).toBe(true)
    expect(item?.compatible).toBe(true)
    expect(item?.line).toBe('he is kicking the ball')
    expect(fillGap('he is _____ the ball', 'kicking')).toBe('he is kicking the ball')
    expect(source).toEqual(kicking)
    expect(source.correctAnswer).toBe('kicking')
  })

  it('does not convert a stem with no blank', () => {
    expect(
      localSentenceAssessment({
        ...kicking,
        question: 'What color is the sky?',
        answers: ['Blue', 'Green', 'Red', 'Yellow'],
        correctAnswer: 'Blue',
      })
    ).toBeNull()
  })

  it('does not convert fewer than four answers or sorting JSON', () => {
    expect(
      localSentenceAssessment({
        ...kicking,
        answers: ['kicking', 'kick', 'kicks'],
      })
    ).toBeNull()
    expect(isStructuredCorrectAnswer('["She","eats","an apple"]')).toBe(true)
    expect(
      localSentenceAssessment({
        id: 'sort',
        question: 'he is ___ the ball',
        answers: ['he', 'is', 'kicking', 'the ball'],
        correctAnswer: '["he","is","kicking","the ball"]',
        type: QuestionType.SORTING,
      })
    ).toBeNull()
  })

  it('still recognises a printable quiz line, which the worksheet check no longer copies', () => {
    const gap = localWorksheetAssessment(kicking)
    expect(gap?.line).toBe('he is ______ the ball')
    expect(gap?.converted).toBe(false)
    expect(
      localWorksheetAssessment({
        id: 'color',
        question: 'What color is the sky?',
        answers: ['Blue', 'Green', 'Red', 'Yellow'],
        correctAnswer: 'Blue',
        type: QuestionType.MULTIPLE_CHOICE,
      })?.line
    ).toBe('What color is the sky?')
  })

  it('starts every worksheet sentence with a capital and a stop or question mark', () => {
    expect(finishWorksheetSentence('he is ______ the ball')).toBe('He is ______ the ball.')
    expect(finishWorksheetSentence('are there any giraffes')).toBe('Are there any giraffes?')
    expect(finishWorksheetSentence('Was it a good film')).toBe('Was it a good film?')
    expect(finishWorksheetSentence('What color is the sky?')).toBe('What color is the sky?')
    expect(finishWorksheetSentence('do not run beside the pool')).toBe('Do not run beside the pool.')
    expect(finishWorksheetSentence('He is kicking the ball.')).toBe('He is kicking the ball.')
  })

  it('does not treat sorting JSON as a worksheet line', () => {
    expect(
      localWorksheetAssessment({
        id: 'sort',
        question: 'Put the words in order.',
        answers: ['She', 'eats', 'an apple'],
        correctAnswer: '["She","eats","an apple"]',
        type: QuestionType.SORTING,
      })
    ).toBeNull()
  })

  it('sends only the items the rule cannot handle, and keeps a refusal', async () => {
    const generate = vi.fn(async () =>
      JSON.stringify([
        { id: 'color', compatible: false, reason: 'Not a sentence yet.' },
      ])
    )
    const items = await assessLessonQuestions({
      target: 'sentence-builder',
      level: 'A1',
      generate,
      questions: [
        kicking,
        {
          id: 'color',
          question: 'What color is the sky?',
          answers: ['Blue', 'Green', 'Red', 'Yellow'],
          correctAnswer: 'Blue',
          type: QuestionType.MULTIPLE_CHOICE,
        },
      ],
    })

    expect(generate).toHaveBeenCalledTimes(1)
    const prompt = JSON.stringify(generate.mock.calls)
    expect(prompt).toContain('Do not invent extra forms')
    expect(prompt).toContain('What color is the sky?')
    expect(prompt).not.toContain('he is ___ the ball')
    expect(items[0]?.line).toBe('he is kicking the ball')
    expect(items[1]?.compatible).toBe(false)
    expect(items[1]?.reason).toBe('Not a sentence yet.')
  })

  it('keeps a row when the lexicon warns about a word', async () => {
    const items = await assessLessonQuestions({
      target: 'worksheet',
      scope: 'item',
      level: 'A1',
      questions: [
        {
          id: 'odd',
          question: 'What is a flibbertigibbet?',
          answers: ['A word', 'A cat'],
          correctAnswer: 'A word',
          type: QuestionType.MULTIPLE_CHOICE,
        },
      ],
    })
    expect(items).toHaveLength(1)
    expect(items[0]?.compatible).toBe(true)
    expect(items[0]?.line).toBe('What is a flibbertigibbet?')
    expect(items[0]?.languageWarnings.some((issue) => issue.word === 'flibbertigibbet')).toBe(true)
  })

  it('writes mixed grammar practice instead of copying the quiz', async () => {
    const items = await assessLessonQuestions({
      target: 'worksheet',
      scope: 'set',
      level: 'A1',
      grammar: ['There is / There are'],
      title: 'Zoo animals',
      questions: [
        {
          id: 'dog',
          question: 'There ______ a dog in the park',
          answers: ['is', 'are', 'was', 'were'],
          correctAnswer: 'is',
          type: QuestionType.MULTIPLE_CHOICE,
          imageUrl: '/images/sentence-builder/sam-dog.jpg',
        },
        {
          id: 'kids',
          question: 'There ______ two children',
          answers: ['are', 'is', 'was', 'were'],
          correctAnswer: 'are',
          type: QuestionType.MULTIPLE_CHOICE,
        },
      ],
    })
    expect(items.length).toBeGreaterThanOrEqual(6)
    expect(items.length).toBeLessThanOrEqual(8)
    const activities = new Set(items.map((item) => item.activity))
    expect(activities).toEqual(new Set(['gap', 'question', 'rewrite', 'matching', 'practice']))
    for (const item of items) {
      expect(item.line).toMatch(/^[A-Z]/)
      expect(item.line).toMatch(/[.?!]$/)
      expect(item.line).not.toBe('There ______ a dog in the park')
    }
    expect(items.some((item) => item.line.endsWith('?'))).toBe(true)
    expect(items.some((item) => item.line.includes('______'))).toBe(true)
    expect(items.some((item) => item.line.includes('dog'))).toBe(true)
  })

  it('uses a model practice mix when the check returns one', async () => {
    const generate = vi.fn(async () =>
      JSON.stringify([
        { activity: 'gap', line: 'they ______ at school yesterday', choices: ['were', 'was'] },
        { activity: 'question', line: 'were they at school yesterday' },
        { activity: 'rewrite', line: 'rewrite this in the past: they are at school' },
        { activity: 'matching', line: 'match was and were', choices: ['was — I', 'were — they'] },
        { activity: 'practice', line: 'write one sentence about yesterday' },
        { activity: 'gap', line: 'she ______ at home', choices: ['was', 'were'] },
      ])
    )
    const items = await assessLessonQuestions({
      target: 'worksheet',
      scope: 'set',
      level: 'A1',
      grammar: ['Past Simple'],
      generate,
      questions: [kicking],
    })
    expect(generate).toHaveBeenCalledTimes(1)
    expect(String(generate.mock.calls)).toContain('was / were')
    expect(items.map((item) => item.activity)).toEqual([
      'gap',
      'question',
      'rewrite',
      'matching',
      'practice',
      'gap',
    ])
    expect(items[0]?.line).toBe('They ______ at school yesterday.')
    expect(items[1]?.line).toBe('Were they at school yesterday?')
    expect(items[4]?.line).toBe('Write one sentence about yesterday.')
  })
})

describe('lesson review gate', () => {
  const rows = [
    {
      status: 'approved' as const,
      questionId: 'q-kick',
      line: 'he is kicking the ball',
      choices: ['kicking', 'kick', 'kicks', 'kicked'],
      imageUrl: '/images/placeholder.webp',
      correctAnswer: 'kicking',
    },
    {
      status: 'rejected' as const,
      questionId: 'q-no',
      line: 'The sky is blue.',
      correctAnswer: 'Blue',
    },
    {
      status: 'pending' as const,
      questionId: 'q-wait',
      line: 'She eats an apple.',
      correctAnswer: 'eats',
    },
  ]

  it('keeps only approved sentences and does not store the correct answer', () => {
    const saved = commitLessonSelection('sentence-builder', rows)
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    expect(saved.sentences).toEqual([
      { text: 'he is kicking the ball', questionId: 'q-kick', imageUrl: undefined },
    ])
    expect(saved.sentences[0]).not.toHaveProperty('correctAnswer')
    expect(saved.worksheetItems).toEqual([])
  })

  it('keeps only approved worksheet lines', () => {
    const saved = commitLessonSelection('worksheet', [
      { ...rows[0], imageUrl: 'https://images.example/ball.jpg' },
      rows[1],
    ])
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    expect(saved.worksheetItems).toEqual([
      {
        questionId: 'q-kick',
        line: 'He is kicking the ball.',
        imageUrl: 'https://images.example/ball.jpg',
        choices: ['kicking', 'kick', 'kicks', 'kicked'],
      },
    ])
  })

  it('refuses to continue when nothing is approved', () => {
    const saved = commitLessonSelection('sentence-builder', [rows[1], rows[2]])
    expect(saved).toEqual({
      ok: false,
      message: 'Approve at least one item before continuing.',
    })
  })
})

describe('lesson sentence prompts', () => {
  it('asks only for the word that filled the blank', () => {
    const prompt = sentencePromptFromLesson({
      sentence: { text: 'he is kicking the ball', questionId: 'q-kick' },
      question: { ...kicking, imageUrl: 'https://images.example/ball.jpg' },
      coverUrl: 'https://images.example/cover.jpg',
      index: 0,
    })
    expect(prompt?.answer).toBe('he is kicking the ball.')
    expect(prompt?.image).toBe('https://images.example/ball.jpg')
    expect(prompt?.slots.map((slot) => slot.correct)).toEqual(['he', 'is', 'kicking', 'the', 'ball'])
    expect(prompt?.slots.filter((slot) => !slot.fixed)).toEqual([
      {
        correct: 'kicking',
        options: ['kicking', 'kick', 'kicks', 'kicked'],
      },
    ])
    expect(nextChoiceIndex(prompt?.slots ?? [], 0)).toBe(2)
    expect(nextChoiceIndex(prompt?.slots ?? [], 3)).toBe(5)
  })

  it('falls back to the cover, then the placeholder, and skips a line with no gap word', () => {
    const covered = sentencePromptFromLesson({
      sentence: { text: 'he is kicking the ball', questionId: 'q-kick' },
      question: kicking,
      coverUrl: 'https://images.example/cover.jpg',
      index: 0,
    })
    expect(covered?.image).toBe('https://images.example/cover.jpg')

    const placeholder = sentencePromptFromLesson({
      sentence: { text: 'he is kicking the ball', questionId: 'q-kick' },
      question: kicking,
      coverUrl: '/images/placeholder.webp',
      index: 0,
    })
    expect(placeholder?.image).toBe('/images/placeholder.webp')

    expect(
      promptsFromLesson({
        sentences: [{ text: 'The sky is bright.', questionId: 'q-kick' }],
        questions: [kicking],
      })
    ).toEqual([])
  })
})
