'use client';

import React from 'react';

/**
 * Props for the PlayerScore component.
 */
export interface PlayerScoreProps {
  /** The display name of the player. */
  playerName: string;
  /** The current score of the player. */
  score: number;
  /** Flag indicating if this player is the currently active one. Defaults to false. */
  isActive?: boolean;
  /** Optional additional CSS class names for the wrapper div. */
  className?: string;
  /** Optional callback function to be executed when the component is clicked. */
  onClick?: () => void;
}

/**
 * Displays a player's name and score using Tailwind CSS and global CSS variables for theming.
 * Styling is defined inline within the component's className props.
 */
const PlayerScore: React.FC<PlayerScoreProps> = ({
  playerName,
  score,
  isActive = false,
  className,
  onClick
}) => {

  return (
    <div
      className={`${className}`}
      onClick={onClick}
      role="button"
      tabIndex={onClick ? 0 : -1}
      aria-pressed={isActive}
      aria-label={`Player ${playerName}, Score ${score}, ${isActive ? 'Active' : 'Inactive'}`}
    >
      {/* Player name section */}
      <div
        className={`
          grandstander
          px-4 py-2 text-center
          ${isActive
            ? 'bg-[var(--primary-accent)] text-[var(--text-color)] font-bold' // Active: Blue bg, light text, bold
            : 
            'bg-[var(--inactive-button-bg)] text-[var(--text-color)] font-semibold border-4 border-gray-300' // Inactive: White bg, dark text, semibold
          }
          rounded-[var(--border-radius-xl)]
          -mb-5
          pb-6
          text-2xl font-regular
        `}
      >
        {playerName}
      </div>

      {/* Score section */}
      <div
         className={`
          relative
          mx-2 py-2 text-center
          font-[var(--font-theme)]
          ${isActive
            ? 'bg-[var(--primary-accent-hover)] text-[var(--text-color)] font-bold' // Active: Darker blue bg, light text, bold
            : 'bg-[var(--box-bg)] text-[var(--text-color)] font-semibold bg-gray-300' // Inactive: Grey bg, dark text, semibold
          }
          rounded-[var(--border-radius-xl)]
          text-4xl
          w-32

        `}
      >
        {score}
      </div>
    </div>
  );
};

export default PlayerScore; 