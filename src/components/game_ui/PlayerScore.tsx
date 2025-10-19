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
  /** Flag to indicate mobile screen for 20% size reduction. */
  isMobile?: boolean;
  /** Flag indicating if this should be displayed in compact mode (smaller). */
  isCompact?: boolean;
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
  onClick,
  isMobile = false,
  isCompact = false
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
          ${isMobile ? 'px-3 py-1' : 'px-4 py-2'} text-center
          ${isActive
            ? 'bg-[var(--secondary-bg)] text-[var(--text-dark)] font-bold border-2 border-[var(--primary-accent-hover)]' // Active: Blue bg, light text, bold
            : 
            'bg-[var(--inactive-button-bg)] text-[var(--text-dark)] font-semibold border-4 border-gray-300' // Inactive: White bg, dark text, semibold
          }
          rounded-[var(--border-radius-xl)]
          -mb-5
          pb-6
          ${isCompact 
            ? (isMobile ? 'text-sm' : 'text-lg')  // Compact: 20% smaller on desktop, 40% smaller on mobile
            : (isMobile ? 'text-lg' : 'text-2xl') // Normal: original sizes
          } font-regular
        `}
      >
        {playerName}
      </div>

      {/* Score section */}
      <div
         className={`
          relative
          ${isMobile ? 'mx-1' : 'mx-2'} py-2 text-center
          font-[var(--font-theme)]
          ${isActive
            ? 'bg-[var(--primary-accent-hover)] text-[var(--text-dark)] font-bold' // Active: Darker blue bg, light text, bold
            : 'bg-[var(--box-bg)] text-[var(--text-dark)] font-semibold bg-gray-300' // Inactive: Grey bg, dark text, semibold
          }
          rounded-[var(--border-radius-xl)]
          ${isCompact 
            ? (isMobile ? 'text-2xl' : 'text-3xl')  // Compact: 20% smaller on desktop, 40% smaller on mobile
            : (isMobile ? 'text-3xl' : 'text-4xl')  // Normal: original sizes
          }
          ${isCompact 
            ? (isMobile ? 'w-20' : 'w-28')  // Compact: 20% smaller on desktop, 40% smaller on mobile
            : (isMobile ? 'w-24' : 'w-32')  // Normal: original sizes
          }

        `}
      >
        {score}
      </div>
    </div>
  );
};

export default PlayerScore; 