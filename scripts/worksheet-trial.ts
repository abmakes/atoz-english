/**
 * One live worksheet, printed as JSON. Not part of the test run.
 * Usage: npx tsx scripts/worksheet-trial.ts
 * Needs GEMINI_QUIZ_API_KEY. Writes nothing to the database.
 */
import { generateText } from '../src/lib/ai/gemini-text'
import { generateWorksheet } from '../src/lib/lesson/worksheet-generation'

if (!process.env.GEMINI_QUIZ_API_KEY) {
  console.log('GEMINI_QUIZ_API_KEY is not set, so this trial did not call the model.')
  process.exit(0)
}

const drafts = await generateWorksheet({
  level: 'A1',
  grammar: ['Comparatives & Superlatives'],
  title: 'Comparatives and superlatives',
  questions: [
    {
      id: 'dog',
      question: 'The dog is ______ than the cat.',
      answers: ['bigger', 'big', 'biggest', 'small'],
      correctAnswer: 'bigger',
      imageUrl: '/images/sentence-builder/sam-dog.jpg',
    },
  ],
  solve: true,
  generate: generateText,
  onReport: (report) => {
    console.log(JSON.stringify({ report }, null, 2))
  },
})

for (const draft of drafts) {
  console.log(`${draft.example ? 'example' : draft.activity} | ${draft.line} | ${draft.correctAnswer}${draft.warning ? ` | ${draft.warning}` : ''}`)
}
