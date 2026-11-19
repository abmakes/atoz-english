import { describe, expect, it } from 'vitest'
import { emptyProfileQuizLists, toProfileQuizCard } from '@/lib/profile-quiz-card'

describe('toProfileQuizCard', () => {
  it('keeps the cover fields and question count without question bodies', () => {
    const card = toProfileQuizCard({
      id: 'quiz-1',
      title: 'Time and school subjects',
      description: 'What time is this class?',
      imageUrl: 'https://cdn.example.com/clock.webp',
      quizType: 'MULTIPLE_CHOICE',
      tags: ['A2', 'School & Classroom'],
      statistics: { likes: 3, favoritesCount: 1, playsCount: 8 },
      authorId: 'teacher-1',
      questionCount: 12,
    })

    expect(card).toMatchObject({
      id: 'quiz-1',
      title: 'Time and school subjects',
      quizType: 'MULTIPLE_CHOICE',
      questionCount: 12,
      authorId: 'teacher-1',
      statistics: { likes: 3, favoritesCount: 1, playsCount: 8 },
    })
    expect(card.questions).toEqual([])
  })

  it('fills a missing cover and an unknown type', () => {
    const card = toProfileQuizCard({
      id: 'quiz-2',
      title: 'Draft title',
      description: null,
      imageUrl: null,
      quizType: 'NOT_A_TYPE',
      tags: [],
      statistics: null,
      authorId: null,
      questionCount: 0,
    })

    expect(card.imageUrl).toBe('/images/placeholder.webp')
    expect(card.quizType).toBe('MULTIPLE_CHOICE')
    expect(card.authorId).toBe('admin')
    expect(card.questionCount).toBe(0)
  })

  it('starts the profile lists empty without touching the database', () => {
    expect(emptyProfileQuizLists()).toEqual({ owned: [], liked: [], favorites: [] })
  })
})
