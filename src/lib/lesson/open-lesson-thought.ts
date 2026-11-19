import { prisma } from '@/lib/prisma'
import { ensureLessonKitTable } from '@/lib/lesson/lesson-kit-table'
import {
  lessonShowsPictures,
  lessonSpeakPictures,
  lessonThoughtCopy,
  type LessonPictureQuestion,
} from '@/lib/lesson/thought-assignment'
import { createShareToken } from '@/lib/stories/tokens'
import { resolveGrammarTags, resolveTopicTags } from '@/lib/taxonomy/quiz-taxonomy'

export interface LessonThought {
  id: string
  title: string
  prompt: string
  shareToken: string
  status: string
}

function missingLessonStore(error: unknown): boolean {
  const code =
    typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : ''
  const message = error instanceof Error ? error.message : String(error)
  return code === 'P2021' || code === 'P2022' || /thoughtChallengeId|lessonkit/i.test(message)
}

async function savedLesson(quizId: string) {
  try {
    return await prisma.lessonKit.findUnique({
      where: { quizId },
      include: { thoughtChallenge: true },
    })
  } catch (error) {
    if (!missingLessonStore(error)) throw error
    await ensureLessonKitTable()
    return prisma.lessonKit.findUnique({
      where: { quizId },
      include: { thoughtChallenge: true },
    })
  }
}

/**
 * One Thoughts assignment per saved lesson. Opening it again returns the same share token.
 * The activity is Ready, so the student link works at home the way a story link does.
 */
export async function openLessonThought(
  userId: string,
  quiz: {
    id: string
    title: string
    description?: string | null
    imageUrl?: string | null
    tags: string[]
    questions?: LessonPictureQuestion[]
  }
): Promise<LessonThought> {
  const pictures = lessonShowsPictures(quiz)
    ? lessonSpeakPictures(quiz.questions ?? [], quiz.imageUrl)
    : []
  const copy = lessonThoughtCopy({
    title: quiz.title,
    grammar: resolveGrammarTags(quiz.tags),
    topics: resolveTopicTags(quiz.tags),
    pictures: pictures.length > 0,
  })
  let lesson = await savedLesson(quiz.id)
  if (!lesson) {
    await prisma.lessonKit.create({
      data: {
        authorId: userId,
        quizId: quiz.id,
        title: quiz.title,
        worksheetItems: [],
        sentences: [],
      },
    })
    lesson = await savedLesson(quiz.id)
  }
  if (!lesson) throw new Error('Could not save this lesson.')
  if (lesson.thoughtChallenge) {
    return {
      id: lesson.thoughtChallenge.id,
      title: lesson.thoughtChallenge.title,
      prompt: lesson.thoughtChallenge.prompt,
      shareToken: lesson.thoughtChallenge.shareToken,
      status: lesson.thoughtChallenge.status,
    }
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.lessonKit.findUnique({
      where: { id: lesson.id },
      include: { thoughtChallenge: true },
    })
    if (current?.thoughtChallenge) {
      return {
        id: current.thoughtChallenge.id,
        title: current.thoughtChallenge.title,
        prompt: current.thoughtChallenge.prompt,
        shareToken: current.thoughtChallenge.shareToken,
        status: current.thoughtChallenge.status,
      }
    }
    const created = await tx.thoughtChallenge.create({
      data: {
        authorId: userId,
        title: copy.title,
        prompt: copy.prompt,
        status: 'READY',
        shareToken: createShareToken(),
      },
    })
    const claimed = await tx.lessonKit.updateMany({
      where: { id: lesson.id, thoughtChallengeId: null },
      data: { thoughtChallengeId: created.id },
    })
    if (claimed.count === 1) {
      return {
        id: created.id,
        title: created.title,
        prompt: created.prompt,
        shareToken: created.shareToken,
        status: created.status,
      }
    }
    await tx.thoughtChallenge.delete({ where: { id: created.id } })
    const winner = await tx.lessonKit.findUnique({
      where: { id: lesson.id },
      include: { thoughtChallenge: true },
    })
    if (!winner?.thoughtChallenge) throw new Error('Could not save the speaking assignment.')
    return {
      id: winner.thoughtChallenge.id,
      title: winner.thoughtChallenge.title,
      prompt: winner.thoughtChallenge.prompt,
      shareToken: winner.thoughtChallenge.shareToken,
      status: winner.thoughtChallenge.status,
    }
  })
}
