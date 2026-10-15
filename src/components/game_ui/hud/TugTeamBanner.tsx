'use client'

import React from 'react'
import RoundDots from './RoundDots'

interface TugTeamBannerProps {
  name: string
  score: number
  wins: number
  side: 'blue' | 'red'
  isActive?: boolean
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

/**
 * Horizontal team pill for Tug of War: name, round pips, and score.
 * Uses the outdoor blue/red palette from the mode reference so it stays
 * readable over the 3D sky regardless of the app theme.
 */
const TugTeamBanner: React.FC<TugTeamBannerProps> = ({
  name,
  score,
  wins,
  side,
  isActive = false,
}) => {
  const colors = PALETTE[side]
  return (
    <div
      className={`flex max-w-full min-w-0 items-center gap-1 rounded-full border-2 border-[#163e66] py-0.5 pl-0.5 pr-0.5 shadow-[2px_2px_0_0_#163e66] lg:gap-2 lg:border-[3px] lg:py-1 lg:pl-1 lg:pr-1 lg:shadow-[3px_3px_0_0_#163e66] ${
        isActive ? 'bg-white ring-2 ring-[#f6e05e] lg:ring-4' : colors.soft
      }`}
      aria-label={`${name}, score ${score}, ${wins} round wins${isActive ? ', answering' : ''}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#163e66] text-xs font-bold text-white lg:h-11 lg:w-11 lg:text-lg ${colors.fill}`}
        aria-hidden
      >
        {side === 'blue' ? 'B' : 'R'}
      </span>
      <div className="hidden min-w-0 flex-col items-start pr-0.5 min-[480px]:flex lg:pr-1">
        <span className={`grandstander max-w-[4.5rem] truncate text-xs font-bold lg:max-w-[7.5rem] lg:text-base ${colors.text}`}>
          {name}
        </span>
        <RoundDots wins={wins} max={3} side={side} />
      </div>
      <div className="min-[480px]:hidden">
        <RoundDots wins={wins} max={3} side={side} />
      </div>
      <span
        className={`grandstander flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#163e66] text-sm font-bold text-white lg:h-12 lg:w-12 lg:text-xl ${colors.fill}`}
      >
        {score}
      </span>
    </div>
  )
}

export default TugTeamBanner
