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

/** A tag as a child would say it: "Prepositions of Time" becomes "prepositions of time". */
export function spokenLessonTag(tag: string): string {
  return tag
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\/\s*/g, ' and ')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function spokenTopic(topic: string): string {
  if (topic.trim().toLowerCase() === 'school & classroom') return 'school subjects'
  return spokenLessonTag(topic)
}

function joinSpoken(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

/**
 * A speaking task for the grammar already saved on the lesson.
 * Three grammar tags fit in the Thoughts prompt. The title stays short enough to store.
 * A school lesson talks about school subjects. Other lessons talk about the student's life.
 * Picture lessons ask for a sentence for each picture.
 */
export function lessonThoughtCopy(input: {
  title: string
  grammar: string[]
  topics?: string[]
  pictures?: boolean
}): { title: string; prompt: string } {
  const lesson = input.title.replace(/\s+/g, ' ').trim() || 'This lesson'
  const grammar = [...new Set(input.grammar.map((tag) => tag.replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, 3)
  const topics = [...new Set((input.topics ?? []).map((tag) => tag.replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, 2)
  const point = joinSpoken(grammar.map(spokenLessonTag))
  const about = topics.length > 0 ? joinSpoken(topics.map(spokenTopic)) : 'your life'
  const title = (grammar.length > 0 ? `${lesson}: ${grammar.join(', ')}` : lesson).slice(0, 80)
  const prompt = (
    input.pictures
      ? point
        ? `Look at each picture. Say a sentence for each one. Use ${point}.`
        : 'Look at each picture. Say what you see.'
      : point
        ? `Make three or four sentences about ${about}. Use ${point}.`
        : `Make three or four sentences about ${about}.`
  ).slice(0, 400)
  return { title, prompt }
}
