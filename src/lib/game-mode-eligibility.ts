import { QuestionType } from '@/types/question_types'

export type GameModeId = 'multiple-choice' | 'splash-dash' | 'quiz-room-3d'

/** Max answer length that still fits Splash Dash crate tiers. */
export const SPLASH_DASH_MAX_ANSWER_LENGTH = 40

export interface EligibilityQuestion {
  type?: string | null
  answers?: (string | null | undefined)[] | null
  correctAnswer?: string | null
}

export interface EligibilityQuiz {
  quizType?: string | null
  questions?: EligibilityQuestion[] | null
}

function normalizeAnswers(answers: EligibilityQuestion['answers']): string[] {
  if (!Array.isArray(answers)) return []
  return answers.map((a) => (typeof a === 'string' ? a : '')).filter((a) => a.trim().length > 0)
}

function isMultipleChoiceType(type: string | null | undefined): boolean {
  return type === QuestionType.MULTIPLE_CHOICE || type === 'MULTIPLE_CHOICE'
}

/**
 * True when any non-empty answer exceeds the Splash Dash length limit.
 * Used by the create/edit form warning banner.
 */
export function hasAnswersTooLongForSplashDash(
  questions: EligibilityQuestion[] | null | undefined
): boolean {
  if (!questions?.length) return false
  return questions.some((q) =>
    (q.answers ?? []).some(
      (a) => typeof a === 'string' && a.trim().length > SPLASH_DASH_MAX_ANSWER_LENGTH
    )
  )
}

function questionFailsSplashDash(
  question: EligibilityQuestion
): 'type' | 'count' | 'length' | null {
  if (!isMultipleChoiceType(question.type)) return 'type'
  const answers = normalizeAnswers(question.answers)
  if (answers.length < 2 || answers.length > 4) return 'count'
  if (answers.some((a) => a.length > SPLASH_DASH_MAX_ANSWER_LENGTH)) return 'length'
  return null
}

/**
 * Splash Dash is eligible when every question is multiple choice,
 * has 2–4 answers, and no answer exceeds {@link SPLASH_DASH_MAX_ANSWER_LENGTH}.
 */
export function isSplashDashEligible(quiz: EligibilityQuiz): boolean {
  const questions = quiz.questions
  if (!questions?.length) return false
  if (quiz.quizType && !isMultipleChoiceType(quiz.quizType)) return false
  return questions.every((q) => questionFailsSplashDash(q) === null)
}

export function getEligibleGameModes(quiz: EligibilityQuiz): GameModeId[] {
  const modes: GameModeId[] = ['multiple-choice']
  if (isSplashDashEligible(quiz)) {
    modes.push('splash-dash')
  }
  if (isQuizRoom3dEligible(quiz)) {
    modes.push('quiz-room-3d')
  }
  return modes
}

function questionFailsQuizRoom3d(
  question: EligibilityQuestion
): 'type' | 'count' | 'answer' | null {
  if (!isMultipleChoiceType(question.type)) return 'type'
  const answers = normalizeAnswers(question.answers)
  if (answers.length < 2 || answers.length > 4) return 'count'
  if (
    question.correctAnswer &&
    !answers.includes(question.correctAnswer.trim())
  ) {
    return 'answer'
  }
  return null
}

/** Experimental 3D room supports standard 2–4 option multiple-choice data. */
export function isQuizRoom3dEligible(quiz: EligibilityQuiz): boolean {
  if (!quiz.questions?.length) return false
  return quiz.questions.every((question) => questionFailsQuizRoom3d(question) === null)
}

export function getQuizRoom3dBlockReason(quiz: EligibilityQuiz): string | null {
  if (isQuizRoom3dEligible(quiz)) return null
  if (!quiz.questions?.length) return 'This quiz has no questions yet.'

  for (const question of quiz.questions) {
    const failure = questionFailsQuizRoom3d(question)
    if (failure === 'type') return '3D Quiz Room supports multiple-choice questions only.'
    if (failure === 'count') return '3D Quiz Room needs 2–4 answers per question.'
    if (failure === 'answer') return 'A correct answer is missing from its answer choices.'
  }
  return 'This quiz cannot be played in 3D Quiz Room.'
}

export function getSplashDashBlockReason(quiz: EligibilityQuiz): string | null {
  if (isSplashDashEligible(quiz)) return null

  const questions = quiz.questions
  if (!questions?.length) {
    return 'This quiz has no questions yet.'
  }

  if (quiz.quizType && !isMultipleChoiceType(quiz.quizType)) {
    return 'Splash Dash only supports multiple-choice quizzes.'
  }

  for (const q of questions) {
    const fail = questionFailsSplashDash(q)
    if (fail === 'type') {
      return 'Splash Dash only supports multiple-choice questions.'
    }
    if (fail === 'count') {
      return 'Splash Dash needs 2–4 answers per question.'
    }
    if (fail === 'length') {
      return `Answers are too long for Splash Dash (max ${SPLASH_DASH_MAX_ANSWER_LENGTH} characters).`
    }
  }

  return 'This quiz cannot be played in Splash Dash.'
}
