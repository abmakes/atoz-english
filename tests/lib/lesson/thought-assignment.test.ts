import { describe, expect, it } from 'vitest'
import {
  lessonShowsPictures,
  lessonSpeakPictures,
  lessonThoughtCopy,
  studentThoughtPath,
} from '@/lib/lesson/thought-assignment'

const animals = [
  {
    question: 'There are three cows.',
    correctAnswer: 'There are three cows.',
    imageUrl: '/cows.webp',
  },
  {
    question: 'There ______ five donkeys.',
    correctAnswer: 'are',
    imageUrl: '/donkeys.webp',
  },
  {
    question: 'How many sheep?',
    correctAnswer: 'There is one sheep.',
    imageUrl: '/sheep.webp',
  },
]

describe('lesson thoughts assignment', () => {
  it('uses the same kind of link as a shared story', () => {
    expect(studentThoughtPath('abc_def')).toBe('/thoughts/abc_def')
  })

  it('asks for three or four sentences about the student\'s life', () => {
    const copy = lessonThoughtCopy({
      title: 'Bigger and smaller',
      grammar: ['Comparatives & Superlatives'],
    })
    expect(copy.prompt).toBe('Make three or four sentences about your life. Use comparatives and superlatives.')
    expect(copy.title.length).toBeLessThanOrEqual(80)
    expect(copy.prompt.length).toBeLessThanOrEqual(400)
  })

  it('talks about school subjects when that is the lesson', () => {
    const copy = lessonThoughtCopy({
      title: 'My week',
      grammar: ['Prepositions of Time'],
      topics: ['School & Classroom'],
    })
    expect(copy.prompt).toBe('Make three or four sentences about school subjects. Use prepositions of time.')
  })

  it('recognises image description and there is / there are', () => {
    expect(lessonShowsPictures({ title: 'On the farm', description: null, tags: ['There is / There are'] })).toBe(
      true
    )
    expect(lessonShowsPictures({ title: 'Image description: animals', description: '', tags: ['Animals'] })).toBe(
      true
    )
    expect(
      lessonShowsPictures({ title: 'Bigger and smaller', description: null, tags: ['Comparatives & Superlatives'] })
    ).toBe(false)
  })

  it('shows each animal picture with its sentence and leaves a repeated farm cover out', () => {
    const pictures = lessonSpeakPictures(
      [
        ...animals,
        {
          question: 'There is a barn.',
          correctAnswer: 'There is a barn.',
          imageUrl: '/farm.webp',
        },
        {
          question: 'There are two pigs.',
          correctAnswer: 'There are two pigs.',
          imageUrl: '/farm.webp',
        },
      ],
      '/farm.webp'
    )
    expect(pictures).toEqual([
      { imageUrl: '/cows.webp', line: 'There are three cows.' },
      { imageUrl: '/donkeys.webp', line: 'There are five donkeys.' },
      { imageUrl: '/sheep.webp', line: 'There is one sheep.' },
    ])
  })

  it('does not use one farm photo for several different sentences', () => {
    const pictures = lessonSpeakPictures(
      animals.map((question) => ({ ...question, imageUrl: '/farm.webp' })),
      '/farm.webp'
    )
    expect(pictures).toEqual([])
  })

  it('asks the student to say a sentence for each picture', () => {
    const copy = lessonThoughtCopy({
      title: 'On the farm',
      grammar: ['There is / There are'],
      pictures: true,
    })
    expect(copy.prompt).toBe(
      'Look at each picture. Say a sentence for each one. Use there is and there are.'
    )
  })

  it('ignores a placeholder picture', () => {
    expect(
      lessonSpeakPictures(
        [
          {
            question: 'There is a cat.',
            correctAnswer: 'There is a cat.',
            imageUrl: '/images/placeholder.webp',
          },
        ],
        null
      )
    ).toEqual([])
  })
})
