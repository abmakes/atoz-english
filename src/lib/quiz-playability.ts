import {
  getNinjaClimbBlockReason,
  getSplashDashBlockReason,
  getTugOfWar3dBlockReason,
  isNinjaClimbEligible,
  isSplashDashEligible,
  isTugOfWar3dEligible,
  type EligibilityQuiz,
} from '@/lib/game-mode-eligibility'
import type { QuizStatistics } from '@/lib/schemas'
import type { QuizDefaultSettings } from '@/types/gameTypes'

export interface QuizModePlayability {
  eligible: boolean
  reason: string | null
}

export interface QuizPlayability {
  splashDash: QuizModePlayability
  ninjaClimb: QuizModePlayability
  tugOfWar: QuizModePlayability
}

export interface QuizPickerSummary {
  id: string
  title: string
  description: string
  imageUrl: string
  tags: string[]
  statistics: QuizStatistics
  defaultSettings?: QuizDefaultSettings
  questionCount: number
  playability: QuizPlayability
}

function modeFromUnknown(value: unknown): QuizModePlayability | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (typeof record.eligible !== 'boolean') return null
  if (record.reason !== null && typeof record.reason !== 'string') return null
  return { eligible: record.eligible, reason: record.reason }
}

export function computeQuizPlayability(quiz: EligibilityQuiz): QuizPlayability {
  return {
    splashDash: {
      eligible: isSplashDashEligible(quiz),
      reason: getSplashDashBlockReason(quiz),
    },
    ninjaClimb: {
      eligible: isNinjaClimbEligible(quiz),
      reason: getNinjaClimbBlockReason(quiz),
    },
    tugOfWar: {
      eligible: isTugOfWar3dEligible(quiz),
      reason: getTugOfWar3dBlockReason(quiz),
    },
  }
}

export function parseQuizPlayability(raw: unknown): QuizPlayability | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const record = raw as Record<string, unknown>
  const splashDash = modeFromUnknown(record.splashDash)
  const ninjaClimb = modeFromUnknown(record.ninjaClimb)
  const tugOfWar = modeFromUnknown(record.tugOfWar)
  if (!splashDash || !ninjaClimb || !tugOfWar) return null
  return { splashDash, ninjaClimb, tugOfWar }
}
