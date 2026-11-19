'use client'

import React, { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import type { EventBus } from '@/lib/pixi-engine/core/EventBus'
import { TUG_EVENTS, type TugStreakChangedPayload } from '@/lib/pixi-engine/core/EventTypes'
import {
  TUG_ROUNDS_TO_WIN,
  TUG_STREAK_FOR_DOUBLE,
  streakCharge,
} from '@/lib/three-games/tug-of-war/tugOfWarLogic'
import RoundDots from './RoundDots'

interface TugTeamBannerProps {
  name: string
  score: number
  wins: number
  side: 'blue' | 'red'
  isActive?: boolean
  eventBus?: EventBus
}

const PALETTE = {
  blue: {
    fill: 'bg-[#2b6cb0]',
    soft: 'bg-[#d7ebfb]',
    text: 'text-[#163e66]',
  },
  red: {
    fill: 'bg-[#c53030]',
    soft: 'bg-[#fde2e2]',
    text: 'text-[#7b1e1e]',
  },
} as const

const BOOKMARK_NOTCH = 'polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%)'

/**
 * Horizontal team pill for Tug of War. The round dots and flame show the
 * double-pull power-up. Round wins hang as bookmark banners under the pill.
 */
const TugTeamBanner: React.FC<TugTeamBannerProps> = ({
  name,
  score,
  wins,
  side,
  isActive = false,
  eventBus,
}) => {
  const [streak, setStreak] = useState(0)
  const colors = PALETTE[side]
  const { filled, ready } = streakCharge(streak)
  const remaining = TUG_STREAK_FOR_DOUBLE - filled
  const powerLabel = ready
    ? 'Power-up ready. Next correct answer pulls double'
    : `Power-up. ${remaining} correct ${remaining === 1 ? 'answer' : 'answers'} until a double pull`
  const banners = Math.max(0, Math.min(TUG_ROUNDS_TO_WIN, Math.floor(wins)))

  useEffect(() => {
    if (!eventBus) return
    const onStreak = (payload: TugStreakChangedPayload) => {
      setStreak(side === 'blue' ? payload.blueStreak : payload.redStreak)
    }
    eventBus.on(TUG_EVENTS.STREAK_CHANGED, onStreak)
    return () => {
      eventBus.off(TUG_EVENTS.STREAK_CHANGED, onStreak)
    }
  }, [eventBus, side])

  return (
    <div className="relative inline-flex max-w-full flex-col items-center">
      <div
        className={`flex max-w-full min-w-0 items-center gap-1 rounded-full border-2 border-[#163e66] py-0.5 pl-0.5 pr-0.5 shadow-[2px_2px_0_0_#163e66] lg:gap-2 lg:border-[3px] lg:py-1 lg:pl-1 lg:pr-1 lg:shadow-[3px_3px_0_0_#163e66] ${
          isActive ? 'bg-white ring-2 ring-[#f6e05e] lg:ring-4' : colors.soft
        }`}
        role="group"
        aria-label={`${name}, score ${score}, ${banners} of ${TUG_ROUNDS_TO_WIN} banners. ${powerLabel}${isActive ? '. Answering' : ''}`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#163e66] text-xs font-bold text-white lg:h-11 lg:w-11 lg:text-lg ${colors.fill}`}
          aria-hidden
        >
          {side === 'blue' ? 'B' : 'R'}
        </span>
        <div className="flex min-w-0 flex-col items-start gap-0.5 pr-0.5 lg:pr-1">
          <span className={`grandstander hidden max-w-[4.5rem] truncate text-xs font-bold min-[480px]:block lg:max-w-[7.5rem] lg:text-base ${colors.text}`}>
            {name}
          </span>
          <div className="flex items-center gap-1">
            <RoundDots
              wins={filled}
              max={TUG_STREAK_FOR_DOUBLE}
              side={side}
              label={powerLabel}
            />
            <Flame
              className={`h-4 w-4 shrink-0 lg:h-5 lg:w-5 ${
                ready
                  ? 'fill-[#f6e05e] text-[#c05621] drop-shadow-[0_0_5px_#f6e05e]'
                  : 'fill-[#ed8936] text-[#c05621]'
              }`}
              aria-hidden
            />
          </div>
        </div>
        <span
          className={`grandstander flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#163e66] text-sm font-bold text-white lg:h-12 lg:w-12 lg:text-xl ${colors.fill}`}
        >
          {score}
        </span>
      </div>
      {banners > 0 && (
        <div
          className="pointer-events-none absolute left-1/2 top-full z-10 flex -translate-x-1/2 items-start justify-center gap-1 pt-px"
          aria-hidden
        >
          {Array.from({ length: banners }, (_, index) => (
            <span
              key={index}
              className={`block h-9 w-5 border-x-2 border-b-2 border-[#f6e05e] shadow-[1px_3px_0_0_#163e66] lg:h-12 lg:w-6 ${colors.fill}`}
              style={{ clipPath: BOOKMARK_NOTCH }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TugTeamBanner
