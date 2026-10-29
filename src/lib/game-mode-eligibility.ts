import { QuestionType } from '@/types/question_types'

export type GameModeId = 'multiple-choice' | 'splash-dash' | 'ninja-climb'

/** Max answer length that still fits Splash Dash crate tiers. */
export const SPLASH_DASH_MAX_ANSWER_LENGTH = 40

/** Max answer length for Ninja Climb answer banners. */
export const NINJA_CLIMB_MAX_ANSWER_LENGTH = 48

export interface EligibilityQuestion {
  type?: string | null
  answers?: (string | null | undefined)[] | null
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

export function hasAnswersTooLongForNinjaClimb(
  questions: EligibilityQuestion[] | null | undefined
): boolean {
  if (!questions?.length) return false
  return questions.some((q) =>
    (q.answers ?? []).some(
      (a) => typeof a === 'string' && a.trim().length > NINJA_CLIMB_MAX_ANSWER_LENGTH
    )
  )
}

function questionFailsAnswerLayout(
  question: EligibilityQuestion,
  maxLength: number
): 'type' | 'count' | 'length' | null {
  if (!isMultipleChoiceType(question.type)) return 'type'
  const answers = normalizeAnswers(question.answers)
  if (answers.length < 2 || answers.length > 4) return 'count'
  if (answers.some((a) => a.length > maxLength)) return 'length'
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
  return questions.every((q) => questionFailsAnswerLayout(q, SPLASH_DASH_MAX_ANSWER_LENGTH) === null)
}

/**
 * Ninja Climb is eligible when every question is multiple choice,
 * has 2–4 answers, and no answer exceeds {@link NINJA_CLIMB_MAX_ANSWER_LENGTH}.
 */
export function isNinjaClimbEligible(quiz: EligibilityQuiz): boolean {
  const questions = quiz.questions
  if (!questions?.length) return false
  if (quiz.quizType && !isMultipleChoiceType(quiz.quizType)) return false
  return questions.every((q) => questionFailsAnswerLayout(q, NINJA_CLIMB_MAX_ANSWER_LENGTH) === null)
}

export function getEligibleGameModes(quiz: EligibilityQuiz): GameModeId[] {
  const modes: GameModeId[] = ['multiple-choice']
  if (isSplashDashEligible(quiz)) {
    modes.push('splash-dash')
  }
  if (isNinjaClimbEligible(quiz)) {
    modes.push('ninja-climb')
  }
  return modes
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
    const fail = questionFailsAnswerLayout(q, SPLASH_DASH_MAX_ANSWER_LENGTH)
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

export function getNinjaClimbBlockReason(quiz: EligibilityQuiz): string | null {
  if (isNinjaClimbEligible(quiz)) return null

  const questions = quiz.questions
  if (!questions?.length) {
    return 'This quiz has no questions yet.'
  }

  if (quiz.quizType && !isMultipleChoiceType(quiz.quizType)) {
    return 'Ninja Climb only supports multiple-choice quizzes.'
  }

  for (const q of questions) {
    const fail = questionFailsAnswerLayout(q, NINJA_CLIMB_MAX_ANSWER_LENGTH)
    if (fail === 'type') {
      return 'Ninja Climb only supports multiple-choice questions.'
    }
    if (fail === 'count') {
      return 'Ninja Climb needs 2–4 answers per question.'
    }
    if (fail === 'length') {
      return `Answers are too long for Ninja Climb (max ${NINJA_CLIMB_MAX_ANSWER_LENGTH} characters).`
    }
  }

  return 'This quiz cannot be played in Ninja Climb.'
}
