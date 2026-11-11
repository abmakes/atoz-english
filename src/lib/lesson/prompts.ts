import type { SentencePrompt, WordSlot } from '@/lib/pixi-games/sentence-builder/content'
import {
  isRealPicture,
  isStructuredCorrectAnswer,
  usableAnswers,
  type LessonSentence,
  type SourceQuestion,
} from '@/lib/lesson/assess'

const PLACEHOLDER = '/images/placeholder.webp'

function punctuationOf(text: string): { body: string; punctuation: '.' | '?' } {
  const trimmed = text.trim()
  if (trimmed.endsWith('?')) return { body: trimmed.slice(0, -1).trim(), punctuation: '?' }
  const body = trimmed.endsWith('.') ? trimmed.slice(0, -1).trim() : trimmed
  return { body, punctuation: '.' }
}

function sameWord(token: string, correct: string): boolean {
  const bare = token.replace(/^[("']+|[)"',.?!]+$/g, '')
  return bare === correct || bare.toLowerCase() === correct.toLowerCase()
}

function pictureFor(
  sentence: LessonSentence,
  question: SourceQuestion | undefined,
  coverUrl?: string | null
): string {
  if (isRealPicture(sentence.imageUrl)) return sentence.imageUrl
  if (isRealPicture(question?.imageUrl)) return question.imageUrl
  if (isRealPicture(coverUrl)) return coverUrl
  return PLACEHOLDER
}

/**
 * One choice slot: the word that filled the blank, with the question's four answers.
 * Every other word is a fixed tile. Returns null when the line cannot be played.
 */
export function sentencePromptFromLesson(input: {
  sentence: LessonSentence
  question?: SourceQuestion
  coverUrl?: string | null
  index: number
}): SentencePrompt | null {
  const question = input.question
  if (!question) return null
  if (isStructuredCorrectAnswer(question.correctAnswer)) return null
  const answers = usableAnswers(question.answers)
  const correct = question.correctAnswer.trim()
  if (answers.length !== 4 || !answers.includes(correct)) return null

  const { body, punctuation } = punctuationOf(input.sentence.text)
  const tokens = body.split(/\s+/).filter(Boolean)
  const choiceAt = tokens.findIndex((token) => sameWord(token, correct))
  if (choiceAt < 0) return null

  const options = [answers[0], answers[1], answers[2], answers[3]] as const
  const slots: WordSlot[] = tokens.map((token, index) =>
    index === choiceAt
      ? { correct, options }
      : { correct: token.replace(/^[("']+|[)"',.?!]+$/g, ''), fixed: true }
  )
  const id = input.sentence.questionId || question.id || `lesson-${input.index}`
  const image = pictureFor(input.sentence, question, input.coverUrl)
  const answer = `${slots.map((slot) => slot.correct).join(' ')}${punctuation}`
  return {
    id: `lesson-${id}`,
    sceneId: `lesson-${id}`,
    focus: 'present-simple',
    label: 'Quiz sentences',
    instruction: 'Build the sentence.',
    punctuation,
    slots,
    answer,
    image,
    alt: answer,
  }
}

export function promptsFromLesson(input: {
  sentences: LessonSentence[]
  questions: SourceQuestion[]
  coverUrl?: string | null
}): SentencePrompt[] {
  const byId = new Map(
    input.questions.filter((question) => question.id).map((question) => [question.id as string, question])
  )
  const prompts: SentencePrompt[] = []
  input.sentences.forEach((sentence, index) => {
    const question = sentence.questionId ? byId.get(sentence.questionId) : undefined
    const prompt = sentencePromptFromLesson({
      sentence,
      question,
      coverUrl: input.coverUrl,
      index,
    })
    if (prompt) prompts.push(prompt)
  })
  return prompts
}
