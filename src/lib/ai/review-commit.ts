import type { Question } from '@/components/management_ui/QuizEditor'
import type { ReviewableQuestion } from '@/components/management_ui/AIQuestionReviewPanel'
import { discoveryTagsFromBrief, type GenerationBrief } from '@/lib/ai/generation-brief'

/**
 * Pure helpers for committing AI-reviewed questions into the quiz editor.
 * Kept free of React so Vitest can cover the review-commit contract.
 */

export function isEmptyQuestionStub(question: Question | undefined): boolean {
  if (!question) return false
  return (
    !question.question.trim() &&
    question.answers.every((answer) => !answer.trim())
  )
}

export function mergeApprovedQuestions(
  existing: Question[],
  approved: Question[]
): Question[] {
  const onlyEmptyStub =
    existing.length === 1 && isEmptyQuestionStub(existing[0])

  if (onlyEmptyStub || existing.length === 0) {
    return approved
  }

  return [...existing, ...approved]
}

export function stripReviewSessionFields(
  questions: ReviewableQuestion[]
): Question[] {
  return questions.map((item) => ({
    id: item.id,
    question: item.question,
    answers: item.answers,
    correctAnswer: item.correctAnswer,
    imageUrl: item.imageUrl,
    imageFile: item.imageFile,
    imageMetadata: item.imageMetadata,
    type: item.type,
  }))
}

export function commitReviewedQuestions(input: {
  existingQuestions: Question[]
  approvedReviewItems: ReviewableQuestion[]
  brief: GenerationBrief
}): {
  questions: Question[]
  tags: string[]
  contentView: 'create'
} {
  const approved = stripReviewSessionFields(input.approvedReviewItems)
  return {
    questions: mergeApprovedQuestions(input.existingQuestions, approved),
    tags: discoveryTagsFromBrief(input.brief),
    contentView: 'create',
  }
}
