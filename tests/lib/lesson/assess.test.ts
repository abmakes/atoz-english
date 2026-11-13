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
import { planWorksheetLayout, worksheetLineNumbers } from '@/lib/lesson/worksheet-practice'
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
    const plan = planWorksheetLayout('A1')
    const questions = items.filter((item) => item.activity === 'question')
    const gaps = items.filter((item) => item.activity === 'gap')
    const choices = items.filter((item) => item.activity === 'choice')
    expect(plan).toMatchObject({ choices: 6, gaps: 8, sentences: 9 })
    expect(plan.heightMm).toBeGreaterThan(265)
    expect(plan.heightMm).toBeLessThanOrEqual(275)
    expect(planWorksheetLayout('B1').sentences).toBe(10)
    expect(items[0]?.activity).toBe('choice')
    expect(questions).toHaveLength(plan.sentences)
    expect(gaps).toHaveLength(plan.gaps)
    expect(choices).toHaveLength(plan.choices)
    expect(choices.every((item) => item.exercise === 'A. Look and circle the answer.')).toBe(true)
    expect(gaps.every((item) => item.exercise === 'B. Complete the sentences.')).toBe(true)
    expect(choices.every((item) => item.imageUrl === '/images/sentence-builder/sam-dog.jpg')).toBe(true)
    expect(choices.every((item) => item.choices.length >= 2)).toBe(true)
    for (const item of items) {
      expect(item.line).toMatch(/^[A-Z]/)
      expect(item.line).toMatch(/[.?!]$/)
      expect(item.line).not.toBe('There ______ a dog in the park')
    }
  })

  const pictured: SourceQuestion[] = [
    { ...kicking, id: 'p1', imageUrl: '/images/sentence-builder/sam-dog.jpg', question: 'The dog is ______ than the cat.', correctAnswer: 'bigger' },
    { ...kicking, id: 'p2', imageUrl: '/images/sentence-builder/sara-book.jpg', question: 'Sara is reading the ______ book.', correctAnswer: 'biggest' },
  ]

  function worksheetReply(overrides: { pictures?: unknown[]; gaps?: unknown[]; sentences?: unknown[] } = {}) {
    const animals = ['a horse', 'a cat', 'a dog', 'a lion', 'a bear', 'a duck', 'a goat', 'a fox', 'a cow', 'a pig', 'a hen', 'a frog']
    const adjectives = ['bigger', 'smaller', 'faster', 'slower', 'taller', 'shorter', 'older', 'younger', 'longer', 'stronger']
    return JSON.stringify({
      pictures: overrides.pictures ?? [
        { pictureId: 'p1', question: 'Which animal is bigger in the picture?', answers: ['The dog', 'The cat', 'The bird'], correctAnswer: 'The dog' },
        { pictureId: 'p2', question: 'Which book is Sara reading?', answers: ['The biggest book', 'The smallest book', 'No book'], correctAnswer: 'The biggest book' },
        ...['an elephant or a mouse', 'a car or a bicycle', 'a whale or a fish', 'a giraffe or a cat', 'a plane or a bus'].map((pair) => ({
          pictureId: null,
          question: `Which is bigger, ${pair}?`,
          answers: [pair.split(' or ')[0], pair.split(' or ')[1], 'They are the same'],
          correctAnswer: pair.split(' or ')[0],
        })),
      ],
      gaps: overrides.gaps ?? adjectives.map((answer, index) => ({
        sentence: `An elephant is ______ than ${animals[index]}.`,
        answer,
        base: answer.replace(/er$/, '').replace(/(.)\1$/, '$1'),
      })),
      sentences: overrides.sentences ?? animals.map((animal, index) => ({
        words: [animal, 'big', 'a mouse'],
        answer: `${animal} is bigger than a mouse number ${index}.`,
      })),
    })
  }

  it('writes a worksheet the teacher can mark, easiest exercise first', async () => {
    const generate = vi.fn(async () => `Here it is:\n\`\`\`json\n${worksheetReply()}\n\`\`\``)
    const items = await assessLessonQuestions({
      target: 'worksheet',
      scope: 'set',
      level: 'A1',
      grammar: ['Comparatives & Superlatives'],
      generate,
      questions: pictured,
    })
    const used = planWorksheetLayout('A1', { choices: 2, gap: true, rewrite: true })
    expect(generate).toHaveBeenCalledTimes(1)
    const prompt = String(generate.mock.calls[0])
    expect(prompt).toContain('exactly one correct answer')
    expect(prompt).toContain('Comparatives & Superlatives')
    expect(prompt).toContain('The dog is bigger than the cat.')
    expect(prompt).not.toContain('"pictures"')
    const choices = items.filter((item) => item.activity === 'choice')
    const gaps = items.filter((item) => item.activity === 'gap')
    const sentences = items.filter((item) => item.activity === 'rewrite')
    expect(choices).toHaveLength(2)
    expect(gaps).toHaveLength(used.gaps)
    expect(sentences).toHaveLength(used.sentences)
    expect(items[0]?.activity).toBe('choice')
    expect(choices[0]?.line).toBe('The dog is ______ than the cat.')
    expect(choices[0]?.imageUrl).toBe('/images/sentence-builder/sam-dog.jpg')
    expect(choices[0]?.reason).toBe('Kept with the picture you chose.')
    expect(choices[0]?.example).toBe(true)
    expect(choices[0]?.choices.map((choice) => choice.toLowerCase())).toContain('bigger')
    expect(gaps.every((item) => item.bank === item.correctAnswer)).toBe(true)
    expect(gaps.every((item) => item.instruction?.includes('box'))).toBe(true)
    expect(sentences.every((item) => item.line.includes(' / '))).toBe(true)
    expect(sentences.every((item) => item.correctAnswer.endsWith('.'))).toBe(true)
    expect(sentences[0]?.line.split(' / ').filter((word) => word !== '.').sort()).toEqual(
      sentences[0]?.correctAnswer.replace(/\.$/, '').split(' ').map((word, index) => (index === 0 ? word.toLowerCase() : word)).sort()
    )
  })

  it('gives base forms at A2 and brackets with no word box at B1', async () => {
    const generate = vi.fn(async () => worksheetReply())
    const a2 = await assessLessonQuestions({ target: 'worksheet', scope: 'set', level: 'A2', generate, questions: pictured })
    const a2Gaps = a2.filter((item) => item.activity === 'gap')
    expect(a2Gaps[0]?.bank).toBe('big')
    expect(a2Gaps[0]?.correctAnswer).toBe('bigger')
    expect(a2.filter((item) => item.activity === 'rewrite')[0]?.line).toBe('a horse / big / a mouse')
    const b1 = await assessLessonQuestions({ target: 'worksheet', scope: 'set', level: 'B1', generate, questions: pictured })
    const b1Gaps = b1.filter((item) => item.activity === 'gap')
    expect(b1Gaps[0]?.line).toBe('An elephant is ______ (big) than a horse.')
    expect(b1Gaps.every((item) => item.bank === undefined)).toBe(true)
  })

  it('logs items a student cannot answer and asks for new ones', async () => {
    const logged: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((message?: unknown) => {
      logged.push(String(message))
    })
    const generate = vi.fn(async () =>
      worksheetReply({
        gaps: [
          { sentence: "Your backpack is ______ than your friend's.", answer: 'heavier', base: 'heavy' },
          { sentence: 'Which subject do you find ______?', answer: 'interesting', base: 'interest' },
        ],
      })
    )
    await expect(
      assessLessonQuestions({ target: 'worksheet', scope: 'set', level: 'A1', generate, questions: pictured })
    ).rejects.toThrow('gap sentences were usable')
    expect(generate).toHaveBeenCalledTimes(2)
    const report = logged.find((line) => line.includes('worksheet-generation')) ?? ''
    expect(report).toContain('subjective')
    expect(String(generate.mock.calls[1])).toContain('Your backpack')
    spy.mockRestore()
  })

  it('flags a line when a student-style check disagrees, and skips the picture the teacher chose', async () => {
    const generate = vi.fn(async (prompt: string) => {
      if (prompt.includes('You are a student')) return JSON.stringify({ answers: { '4': 'tiny' }, ambiguous: [] })
      return worksheetReply()
    })
    const items = await assessLessonQuestions({
      target: 'worksheet',
      scope: 'set',
      level: 'A1',
      solve: true,
      generate,
      questions: pictured,
    })
    expect(generate).toHaveBeenCalledTimes(2)
    const gaps = items.filter((item) => item.activity === 'gap')
    expect(gaps[1]?.warning).toContain('tiny')
    expect(items.filter((item) => item.activity === 'choice').every((item) => !item.warning)).toBe(true)
  })

  it('keeps sentences the model returned as plain text', async () => {
    const lines = [
      'She helps him.',
      'He sees her.',
      'I help them.',
      'We help you.',
      'They see me.',
      'You help us.',
      'She gives me a toy.',
      'He gives her a card.',
      'I give him a book.',
      'We give them a snack.',
      'They give us a gift.',
      'You give me a pen.',
    ]
    const generate = vi.fn(async () => JSON.stringify({ sentences: lines }))
    const items = await assessLessonQuestions({
      target: 'worksheet',
      scope: 'set',
      level: 'A1',
      sections: ['rewrite'],
      generate,
      questions: [kicking],
    })
    const sentences = items.filter((item) => item.activity === 'rewrite')
    expect(sentences.length).toBeGreaterThanOrEqual(10)
    expect(sentences.some((item) => item.correctAnswer === 'She helps him.')).toBe(true)
    expect(sentences.every((item) => item.line.includes(' / '))).toBe(true)
  })

  it('keeps a number sentence when the cue list is too long or missing', async () => {
    const sentences = [
      { words: ['What', 'is', 'the', 'number', '300', '+', '500'], answer: 'Three hundred plus five hundred is eight hundred.' },
      { words: ['What', 'is', 'the', 'number', '400', '+', '400'], answer: 'Four hundred plus four hundred is eight hundred.' },
      'The number is six hundred in words.',
      'The number is nine hundred in words.',
      'The number is seven hundred in words.',
      'The number is one hundred in words.',
      'The number is two hundred in words.',
      'The number is five hundred in words.',
      'The number is eight hundred in words.',
      'The number is fifty in words.',
      'The number is twenty in words.',
      'The number is twelve in words.',
    ]
    const generate = vi.fn(async () => JSON.stringify({ sentences }))
    const items = await assessLessonQuestions({
      target: 'worksheet',
      scope: 'set',
      level: 'A2',
      sections: ['rewrite'],
      generate,
      questions: [kicking],
    })
    const written = items.filter((item) => item.activity === 'rewrite')
    expect(written.length).toBeGreaterThanOrEqual(10)
    expect(written.some((item) => item.correctAnswer.startsWith('Three hundred'))).toBe(true)
    expect(written.some((item) => item.line.toLowerCase().includes('six'))).toBe(true)
  })

  it('keeps gap sentences that differ only by the number', async () => {
    const words = ['ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred']
    const gaps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((number, index) => ({
      sentence: `The number is ${number}. What is it in words? ______.`,
      answer: words[index],
      base: words[index],
    }))
    const generate = vi.fn(async () => JSON.stringify({ gaps }))
    const items = await assessLessonQuestions({
      target: 'worksheet',
      scope: 'set',
      level: 'A1',
      sections: ['gap'],
      generate,
      questions: [kicking],
    })
    const written = items.filter((item) => item.activity === 'gap')
    expect(written.length).toBeGreaterThanOrEqual(8)
    expect(written.some((item) => item.line.includes('10.'))).toBe(true)
    expect(written.some((item) => item.line.includes('80'))).toBe(true)
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
        answer: 'kicking',
      },
    ])
  })

  it('numbers an exercise from 1, and skips a line left off the page', () => {
    expect(worksheetLineNumbers([false, false, false, false, false, false])).toEqual([1, 2, 3, 4, 5, 6])
    expect(worksheetLineNumbers([false, true, false])).toEqual([1, null, 2])
  })

  it('plans a second page with more questions than one page', () => {
    const one = planWorksheetLayout('A1', { choices: 0, gap: true, rewrite: true, pages: 1 })
    const two = planWorksheetLayout('A1', { choices: 0, gap: true, rewrite: true, pages: 2 })
    expect(two.gaps + two.sentences).toBeGreaterThan(one.gaps + one.sentences)
    expect(two.heightMm).toBeGreaterThan(277)
    expect(two.heightMm).toBeLessThanOrEqual(550)
  })

  it('writes unjumble, sentence, and long-answer sections when those cards are chosen', async () => {
    const plan = planWorksheetLayout('A1', { choices: 0, gap: false, rewrite: true, unjumble: true, long: true })
    const names = ['hen', 'fox', 'cow', 'pig', 'duck', 'goat', 'lion', 'bear', 'frog', 'sheep', 'wolf', 'crab', 'deer', 'seal', 'hare', 'moth', 'ant', 'bee', 'owl', 'ram']
    const generate = vi.fn(async () => JSON.stringify({
      jumbles: names.slice(0, plan.jumbles + 2).map((name) => ({ answer: `The cat sees the ${name}.` })),
      sentences: names.slice(0, plan.sentences + 2).map((name) => ({ words: ['cat', 'see', name], answer: `The cat sees the ${name} today.` })),
      questions: names.slice(0, plan.longs + 2).map((name) => ({ question: `Where is the ${name}?`, answer: `The ${name} is in the park.` })),
    }))
    const items = await assessLessonQuestions({
      target: 'worksheet',
      scope: 'set',
      level: 'A1',
      sections: ['unjumble', 'write', 'long'],
      generate,
      questions: [kicking],
    })
    const prompt = String(generate.mock.calls[0])
    expect(prompt).toContain('"jumbles"')
    expect(prompt).toContain('"questions"')
    expect(items.filter((item) => item.exercise?.includes('Put the words in order'))).toHaveLength(plan.jumbles)
    expect(items.filter((item) => item.exercise?.includes('Write the sentences'))).toHaveLength(plan.sentences)
    expect(items.filter((item) => item.activity === 'question')).toHaveLength(plan.longs)
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
