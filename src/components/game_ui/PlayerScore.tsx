'use client';

import React from 'react';
import styles from '@/styles/themes/themes.module.css'; // Import theme styles

export interface PlayerScoreTheme {
  // Colors for active player
  activeBackgroundColor?: string;
  activeTextColor?: string;
  activeScoreBackgroundColor?: string;
  activeScoreColor?: string;
  activeBorder?: string; // e.g., '2px solid blue'
  
  // Colors for inactive player
  inactiveBackgroundColor?: string;
  inactiveTextColor?: string;
  inactiveScoreBackgroundColor?: string;
  inactiveScoreColor?: string;
  inactiveBorder?: string; // e.g., '1px solid #ccc'
  
  // Typography
  fontFamily?: string;
  fontSize?: string;
  scoreFontSize?: string;
  fontWeight?: string; // Default/fallback weight
  activeFontWeight?: string | number; // Specific weight for active player
  inactiveFontWeight?: string | number; // Specific weight for inactive player
  
  // Styling
  borderRadius?: string;
  padding?: string;
  margin?: string;
  boxShadow?: string;
}

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
  /** Optional theme object to override default styles. */
  theme?: PlayerScoreTheme;
  /** Optional callback function to be executed when the component is clicked. */
  onClick?: () => void;
}

/**
 * Displays a player's name and score with distinct styling for active/inactive states.
 * Can be made clickable via the onClick prop.
 */
const PlayerScore: React.FC<PlayerScoreProps> = ({
  playerName,
  score,
  isActive = false,
  className = '',
  theme = {},
  onClick
}) => {
  // Apply theme defaults based on the image
  const {
    // Active player
    activeBackgroundColor = '#93E1FF',
    activeTextColor = '#003A5C',
    activeScoreBackgroundColor = '#00AAFF',
    activeScoreColor = '#FFFFFF',
    activeBorder = '2px solid #00AAFF', // Example active border
    
    // Inactive player
    inactiveBackgroundColor = '#FFFFFF',
    inactiveTextColor = '#003A5C',
    inactiveScoreBackgroundColor = '#E0E0E0',
    inactiveScoreColor = '#003A5C',
    inactiveBorder = '1px solid #E0E0E0', // Example inactive border
    
    // Typography
    fontFamily = 'Nunito, sans-serif',
    fontSize = '1.1rem',
    scoreFontSize = '1.5rem',
    activeFontWeight = '700', // Default bold for active
    inactiveFontWeight = '600', // Default normal for inactive
    
    // Styling
    borderRadius = '0.75rem',
    margin = '0.5rem 0',
    boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
  } = theme;

  // Determine which styles to use based on active state
  const currentBackgroundColor = isActive ? activeBackgroundColor : inactiveBackgroundColor;
  const currentTextColor = isActive ? activeTextColor : inactiveTextColor;
  const currentScoreBackgroundColor = isActive ? activeScoreBackgroundColor : inactiveScoreBackgroundColor;
  const currentScoreColor = isActive ? activeScoreColor : inactiveScoreColor;
  const currentFontWeight = isActive ? activeFontWeight : inactiveFontWeight;
  const currentBorder = isActive ? activeBorder : inactiveBorder;

  // Interactive class for click behavior
  const interactiveClass = onClick ? 'cursor-pointer transition-transform hover:scale-[1.02]' : '';

  // Combine base wrapper class with active class if applicable, and any passed className
  // The .playerScoreActive class in themes.module.css can add/override styles (like border)
  const wrapperClasses = `
    ${styles.playerScoreWrapper}
    ${isActive ? styles.playerScoreActive : ''}
    ${interactiveClass}
    ${className}
  `.trim();

  return (
    <div
      className={wrapperClasses}
      style={{
        margin,
        fontFamily,
        boxShadow,
        borderRadius,
        border: currentBorder, // Apply border dynamically
        overflow: 'hidden',
      }}
      onClick={onClick}
      role="button" 
      tabIndex={onClick ? 0 : -1}
      aria-pressed={isActive} 
      aria-label={`Player ${playerName}, Score ${score}, ${isActive ? 'Active' : 'Inactive'}`}
    >
      {/* Player name section */}
      <div 
        className={styles.playerName}
        style={{
          backgroundColor: currentBackgroundColor,
          color: currentTextColor,
          fontWeight: currentFontWeight, // Apply dynamic weight
          fontSize,
          padding: '0.5rem 0.75rem', // Add some padding
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
        }}
      >
        {playerName}
      </div>
      
      {/* Score section */}
      <div 
        className={styles.playerScoreValue}
        style={{
          backgroundColor: currentScoreBackgroundColor,
          color: currentScoreColor,
          fontWeight: currentFontWeight, // Apply dynamic weight
          fontSize: scoreFontSize,
          padding: '0.5rem 0.75rem', // Add some padding
          borderBottomLeftRadius: borderRadius,
          borderBottomRightRadius: borderRadius,
        }}
      >
        {score}
      </div>
    </div>
  );
};

export default PlayerScore; 