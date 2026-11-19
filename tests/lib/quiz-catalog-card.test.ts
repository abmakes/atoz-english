import { afterEach, describe, expect, it } from 'vitest'
import {
  mapQuizRowToCatalogCard,
  shouldSkipCatalogQuery,
  CATALOG_PLACEHOLDER_IMAGE,
} from '@/lib/quiz-catalog-card'

describe('mapQuizRowToCatalogCard', () => {
  it('keeps the cover fields and question count without question bodies', () => {
    const card = mapQuizRowToCatalogCard({
      id: 'quiz-1',
      title: 'Animals at the zoo',
      description: 'Name the animals.',
      imageUrl: 'https://cdn.example.com/zoo.webp',
      tags: ['A1', 'Animals'],
      statistics: { likes: 4, favoritesCount: 2, playsCount: 9 },
      defaultSettings: { theme: 'forest', music: true },
      authorId: 'teacher-1',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      questionCount: 12,
    })

    expect(card).toMatchObject({
      id: 'quiz-1',
      title: 'Animals at the zoo',
      description: 'Name the animals.',
      imageUrl: 'https://cdn.example.com/zoo.webp',
      questionCount: 12,
      level: 'A1',
      authorId: 'teacher-1',
      createdAt: '2026-01-02T00:00:00.000Z',
      statistics: { likes: 4, favoritesCount: 2, playsCount: 9 },
    })
    expect(card).not.toHaveProperty('questions')
  })

  it('fills empty cover fields so a card can still render', () => {
    const card = mapQuizRowToCatalogCard({
      id: 'quiz-2',
      title: 'Untitled practice',
      description: null,
      imageUrl: null,
      tags: null,
      statistics: null,
      defaultSettings: null,
      authorId: null,
      createdAt: '2026-03-01T00:00:00.000Z',
      questionCount: 0,
    })

    expect(card.description).toBe('')
    expect(card.imageUrl).toBe(CATALOG_PLACEHOLDER_IMAGE)
    expect(card.tags).toEqual([])
    expect(card.authorId).toBe('admin')
    expect(card.level).toBeUndefined()
    expect(card.defaultSettings).toBeUndefined()
    expect(card.statistics).toEqual({ likes: 0, favoritesCount: 0, playsCount: 0 })
  })

  it('treats broken statistics as zero instead of throwing', () => {
    const card = mapQuizRowToCatalogCard({
      id: 'quiz-3',
      title: 'Broken stats',
      description: 'Still list this quiz.',
      imageUrl: '/covers/broken.webp',
      tags: ['not-a-level'],
      statistics: 'nope',
      defaultSettings: ['not-an-object'],
      authorId: 'teacher-3',
      createdAt: '2026-04-01T00:00:00.000Z',
      questionCount: 3,
    })

    expect(card.statistics).toEqual({ likes: 0, favoritesCount: 0, playsCount: 0 })
    expect(card.level).toBeUndefined()
    expect(card.defaultSettings).toBeUndefined()
    expect(card.questionCount).toBe(3)
  })
})

describe('shouldSkipCatalogQuery', () => {
  const original = {
    NEXT_PHASE: process.env.NEXT_PHASE,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
  }

  afterEach(() => {
    process.env.NEXT_PHASE = original.NEXT_PHASE
    process.env.POSTGRES_PRISMA_URL = original.POSTGRES_PRISMA_URL
    process.env.DATABASE_URL = original.DATABASE_URL
    process.env.POSTGRES_URL = original.POSTGRES_URL
  })

  it('queries a hosted database during the production build', () => {
    process.env.NEXT_PHASE = 'phase-production-build'
    process.env.POSTGRES_PRISMA_URL = 'postgresql://user:pass@ep-cool.neon.tech/db'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/ignored'
    expect(shouldSkipCatalogQuery()).toBe(false)
  })

  it('skips the localhost stub used by CI', () => {
    process.env.NEXT_PHASE = 'phase-production-build'
    process.env.POSTGRES_PRISMA_URL = ''
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/atoz_ci'
    expect(shouldSkipCatalogQuery()).toBe(true)
  })

  it('still queries localhost while developing', () => {
    process.env.NEXT_PHASE = 'phase-development-server'
    process.env.POSTGRES_PRISMA_URL = 'postgresql://user:pass@127.0.0.1:5432/atoz'
    expect(shouldSkipCatalogQuery()).toBe(false)
  })
})
