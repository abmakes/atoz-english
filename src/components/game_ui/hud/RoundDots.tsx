'use client'

import React from 'react'

interface RoundDotsProps {
  wins: number
  max?: number
  side?: 'blue' | 'red'
}

const RoundDots: React.FC<RoundDotsProps> = ({
  wins,
  max = 3,
  side = 'blue',
}) => {
  const fill = side === 'blue' ? 'bg-[#2b6cb0]' : 'bg-[#c53030]'
  return (
    <div className="flex items-center gap-1 lg:gap-1.5" aria-label={`${wins} of ${max} round wins`}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < wins
        return (
          <span
            key={index}
            className={`h-2 w-2 rounded-full border border-[var(--border-dark,#1E5167)] lg:h-3 lg:w-3 lg:border-2 ${
              filled ? fill : 'bg-white/70'
            }`}
          />
        )
      })}
    </div>
  )
}

export default RoundDots
