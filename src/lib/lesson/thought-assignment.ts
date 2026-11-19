import { isRealPicture, isStructuredCorrectAnswer } from '@/lib/lesson/assess'
import { finishWorksheetSentence } from '@/lib/lesson/worksheet-practice'

/** The student page for a Thoughts share token. Same shape as a story link. */
export function studentThoughtPath(shareToken: string): string {
  return `/thoughts/${shareToken}`
}

const PICTURE_LESSON = /there is\s*\/\s*there are|image description/i

export interface LessonSpeakPicture {
  imageUrl: string
  line: string
}

export interface LessonPictureQuestion {
  question: string
  correctAnswer: string
  imageUrl?: string | null
}

/**
 * Image-description lessons and There is / There are lessons speak from pictures.
 * The check looks at the title, the description, and the tags.
 */
export function lessonShowsPictures(input: {
  title: string
  description?: string | null
  tags: string[]
}): boolean {
  return PICTURE_LESSON.test([input.title, input.description ?? '', ...input.tags].join('\n'))
}

/** The sentence the student says for one pictured question. */
export function lessonSpeakLine(question: string, correctAnswer: string): string {
  const answer = correctAnswer.trim()
  const stem = question.trim()
  const answerIsSentence =
    Boolean(answer) &&
    !isStructuredCorrectAnswer(answer) &&
    answer.split(/\s+/).filter(Boolean).length >= 3
  if (answerIsSentence) return finishWorksheetSentence(answer)
  if (/_{2,}/.test(stem) && answer && !isStructuredCorrectAnswer(answer) && !/\s/.test(answer)) {
    return finishWorksheetSentence(stem.replace(/_{2,}/, answer).replace(/[ \t]{2,}/g, ' '))
  }
  if (stem && !/_{2,}/.test(stem) && !stem.endsWith('?') && stem.split(/\s+/).filter(Boolean).length >= 3) {
    return finishWorksheetSentence(stem)
  }
  return ''
}

function picturePath(url: string): string {
  return url.split('?')[0]?.split('#')[0] ?? url
}

/**
 * Pictures that match the sentences. A single cover photo used for every line is left out:
 * that farm photo does not show three cows, five donkeys, and one sheep.
 */
export function lessonSpeakPictures(
  questions: LessonPictureQuestion[],
  coverUrl?: string | null
): LessonSpeakPicture[] {
  const rows = questions.flatMap((question) => {
    if (!isRealPicture(question.imageUrl)) return []
    return [
      {
        imageUrl: question.imageUrl,
        line: lessonSpeakLine(question.question, question.correctAnswer),
      },
    ]
  })
  const cover = coverUrl && isRealPicture(coverUrl) ? picturePath(coverUrl) : ''
  const byPath = new Map<string, LessonSpeakPicture[]>()
  for (const row of rows) {
    const key = picturePath(row.imageUrl)
    const group = byPath.get(key) ?? []
    group.push(row)
    byPath.set(key, group)
  }
  if (byPath.size === 1 && rows.length > 1) {
    const lines = new Set(rows.map((row) => row.line))
    if (lines.size > 1) return []
  }
  const coverUses = cover ? (byPath.get(cover)?.length ?? 0) : 0
  const dropCover = Boolean(cover) && coverUses > 1 && byPath.size > 1
  const usable = dropCover ? rows.filter((row) => picturePath(row.imageUrl) !== cover) : rows
  return usable.slice(0, 6)
}

/**
 * A speaking task for the grammar already saved on the lesson.
 * Three grammar tags fit in the Thoughts prompt. The title stays short enough to store.
 * Picture lessons ask the student to say a sentence for each picture.
 */
export function lessonThoughtCopy(input: {
  title: string
  grammar: string[]
  pictures?: boolean
}): { title: string; prompt: string } {
  const lesson = input.title.replace(/\s+/g, ' ').trim() || 'This lesson'
  const grammar = [...new Set(input.grammar.map((tag) => tag.replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, 3)
  const point = grammar.join(', ')
  const title = (point ? `${lesson}: ${point}` : lesson).slice(0, 80)
  const prompt = (
    input.pictures
      ? point
        ? `Look at each picture and say the sentence. Use this language: ${point}.`
        : 'Look at each picture and say what you see.'
      : point
        ? `Talk about your own life in at least three sentences. Use this language: ${point}.`
        : `Talk about ${lesson} in at least three sentences.`
  ).slice(0, 400)
  return { title, prompt }
}
