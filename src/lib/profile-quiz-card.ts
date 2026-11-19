import { getQuizStatistics } from '@/lib/quiz-statistics'
import type { Quiz } from '@/types'
import { QuestionType } from '@/types/question_types'

export interface ProfileQuizLists {
  owned: Quiz[]
  liked: Quiz[]
  favorites: Quiz[]
}

export const emptyProfileQuizLists = (): ProfileQuizLists => ({
  owned: [],
  liked: [],
  favorites: [],
})

const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

export type ProfileCardRow = {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  quizType: string
  tags: string[]
  statistics: unknown
  authorId: string | null
  questionCount: number
}

function isQuestionType(value: string): value is QuestionType {
  return Object.values(QuestionType).includes(value as QuestionType)
}

/** Title, cover, type, and count. Question text stays off the profile list. */
export function toProfileQuizCard(row: ProfileCardRow): Quiz {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl || PLACEHOLDER_IMAGE,
    quizType: isQuestionType(row.quizType) ? row.quizType : QuestionType.MULTIPLE_CHOICE,
    tags: row.tags ?? [],
    statistics: getQuizStatistics(row.statistics) as Quiz['statistics'],
    authorId: row.authorId || 'admin',
    questionCount: row.questionCount,
    questions: [],
  }
}
