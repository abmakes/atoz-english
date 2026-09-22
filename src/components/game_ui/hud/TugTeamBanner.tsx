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
      className={`flex items-center gap-2 rounded-full border-[3px] border-[#163e66] py-1 pl-1 pr-1 shadow-[3px_3px_0_0_#163e66] ${
        isActive ? 'bg-white ring-4 ring-[#f6e05e]' : colors.soft
      }`}
      aria-label={`${name}, score ${score}, ${wins} round wins${isActive ? ', answering' : ''}`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#163e66] text-lg font-bold text-white ${colors.fill}`}
        aria-hidden
      >
        {side === 'blue' ? 'B' : 'R'}
      </span>
      <div className="flex min-w-0 flex-col items-start pr-1">
        <span className={`grandstander max-w-[7.5rem] truncate text-sm font-bold sm:text-base ${colors.text}`}>
          {name}
        </span>
        <RoundDots wins={wins} max={3} side={side} />
      </div>
      <span
        className={`grandstander flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#163e66] text-xl font-bold text-white ${colors.fill}`}
      >
        {score}
      </span>
    </div>
  )
}

export default TugTeamBanner
