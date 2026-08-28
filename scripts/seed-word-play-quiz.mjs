/**
 * Seeds a demo quiz for the Word Play game mode (SORTING + MATCHING questions).
 *
 * Usage:
 *   POSTGRES_PRISMA_URL=... POSTGRES_URL_NON_POOLING=... npm run seed:word-play
 *
 * Requires `prisma generate` to have run (happens automatically on install).
 * Safe to re-run: it skips seeding when a quiz with the same title exists.
 */
import { PrismaClient } from '../prisma/app/generated/prisma/client/index.js'

const QUIZ_TITLE = 'Word Play Demo: Sentences & Matching'

/** SORTING: answers = words; correctAnswer = JSON array in correct order. */
const sortingQuestions = [
  {
    question: 'Arrange the words to make a sentence.',
    words: ['The', 'dog', 'runs', 'fast'],
  },
  {
    question: 'Put the words in order.',
    words: ['I', 'like', 'to', 'read', 'books'],
  },
  {
    question: 'Build the question.',
    words: ['What', 'is', 'your', 'name?'],
  },
  {
    question: 'Make a sentence about the weather.',
    words: ['It', 'is', 'sunny', 'today'],
  },
]

/** MATCHING: answers = flat [left, right, ...]; correctAnswer = JSON pairs. */
const matchingQuestions = [
  {
    question: 'Match each animal to its home.',
    pairs: [
      { left: 'bird', right: 'nest' },
      { left: 'bee', right: 'hive' },
      { left: 'dog', right: 'kennel' },
      { left: 'fish', right: 'tank' },
    ],
  },
  {
    question: 'Match the opposites.',
    pairs: [
      { left: 'hot', right: 'cold' },
      { left: 'big', right: 'small' },
      { left: 'fast', right: 'slow' },
    ],
  },
  {
    question: 'Match the word to its category.',
    pairs: [
      { left: 'apple', right: 'fruit' },
      { left: 'carrot', right: 'vegetable' },
      { left: 'milk', right: 'drink' },
    ],
  },
]

async function main() {
  const prisma = new PrismaClient()
  try {
    const existing = await prisma.quiz.findFirst({ where: { title: QUIZ_TITLE } })
    if (existing) {
      console.log(`Quiz "${QUIZ_TITLE}" already exists (id: ${existing.id}). Skipping.`)
      return
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: QUIZ_TITLE,
        description:
          'Demo quiz for the Word Play prototype: drag words into order and match pairs together.',
        quizType: 'SORTING',
        tags: ['demo', 'word-play'],
        statistics: { likes: 0, favoritesCount: 0, playsCount: 0 },
        authorId: 'admin',
        questions: {
          create: [
            ...sortingQuestions.map((q) => ({
              question: q.question,
              answers: q.words,
              correctAnswer: JSON.stringify(q.words),
              type: 'SORTING',
            })),
            ...matchingQuestions.map((q) => ({
              question: q.question,
              answers: q.pairs.flatMap((p) => [p.left, p.right]),
              correctAnswer: JSON.stringify(q.pairs),
              type: 'MATCHING',
            })),
          ],
        },
      },
      include: { questions: true },
    })

    console.log(
      `Seeded quiz "${quiz.title}" (id: ${quiz.id}) with ${quiz.questions.length} questions.`
    )
    console.log(`Play it at /games/${quiz.id}/word-play`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exitCode = 1
})
