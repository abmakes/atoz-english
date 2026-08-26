import { QuestionType } from '@/types/question_types'

export type GameModeId = 'multiple-choice' | 'splash-dash' | 'word-play'

/** Max answer length that still fits Splash Dash crate tiers. */
export const SPLASH_DASH_MAX_ANSWER_LENGTH = 40

/** Max items (words or pairs) that fit the Word Play board comfortably. */
export const WORD_PLAY_MAX_SORTING_ITEMS = 10
export const WORD_PLAY_MAX_MATCHING_PAIRS = 6

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

function isWordPlayType(type: string | null | undefined): boolean {
  return type === QuestionType.SORTING || type === QuestionType.MATCHING
}

function questionFailsWordPlay(
  question: EligibilityQuestion
): 'type' | 'count' | null {
  if (!isWordPlayType(question.type)) return 'type'
  const answers = normalizeAnswers(question.answers)
  if (question.type === QuestionType.MATCHING) {
    if (answers.length < 4 || answers.length % 2 !== 0) return 'count'
    if (answers.length / 2 > WORD_PLAY_MAX_MATCHING_PAIRS) return 'count'
  } else {
    if (answers.length < 2 || answers.length > WORD_PLAY_MAX_SORTING_ITEMS) return 'count'
  }
  return null
}

/**
 * Word Play is eligible when every question is SORTING (word order)
 * or MATCHING (pairs), with a board-friendly item count.
 */
export function isWordPlayEligible(quiz: EligibilityQuiz): boolean {
  const questions = quiz.questions
  if (!questions?.length) return false
  return questions.every((q) => questionFailsWordPlay(q) === null)
}

export function getWordPlayBlockReason(quiz: EligibilityQuiz): string | null {
  if (isWordPlayEligible(quiz)) return null

  const questions = quiz.questions
  if (!questions?.length) {
    return 'This quiz has no questions yet.'
  }

  for (const q of questions) {
    const fail = questionFailsWordPlay(q)
    if (fail === 'type') {
      return 'Word Play only supports word order (sorting) and matching questions.'
    }
    if (fail === 'count') {
      return q.type === QuestionType.MATCHING
        ? `Word Play needs 2–${WORD_PLAY_MAX_MATCHING_PAIRS} matching pairs per question.`
        : `Word Play needs 2–${WORD_PLAY_MAX_SORTING_ITEMS} words per sorting question.`
    }
  }

  return 'This quiz cannot be played in Word Play.'
}

export function getEligibleGameModes(quiz: EligibilityQuiz): GameModeId[] {
  const modes: GameModeId[] = ['multiple-choice']
  if (isSplashDashEligible(quiz)) {
    modes.push('splash-dash')
  }
  if (isWordPlayEligible(quiz)) {
    modes.push('word-play')
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
