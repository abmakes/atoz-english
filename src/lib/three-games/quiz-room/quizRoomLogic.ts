import type { AnswerSelectedPayload } from '@/lib/pixi-engine/core/EventTypes'
import type { QuestionData } from '@/types'
import { QuestionType } from '@/types/question_types'

export const QUIZ_ROOM_MIN_ANSWERS = 2
export const QUIZ_ROOM_MAX_ANSWERS = 4

export function isQuizRoomQuestionEligible(question: QuestionData): boolean {
  return (
    question.type === QuestionType.MULTIPLE_CHOICE &&
    question.answers.length >= QUIZ_ROOM_MIN_ANSWERS &&
    question.answers.length <= QUIZ_ROOM_MAX_ANSWERS &&
    question.answers.includes(question.correctAnswer)
  )
}

export function createQuizRoomAnswerPayload(
  question: QuestionData,
  selectedIndex: number | null,
  teamId: string | number,
  remainingTimeMs: number
): AnswerSelectedPayload {
  const selectedAnswer =
    selectedIndex === null ? null : question.answers[selectedIndex] ?? null

  return {
    questionId: question.id,
    selectedOptionId:
      selectedIndex === null ? null : `${question.id}-answer-${selectedIndex}`,
    isCorrect: selectedAnswer === question.correctAnswer,
    teamId,
    remainingTimeMs,
    scoreMultiplier: 1,
  }
}
