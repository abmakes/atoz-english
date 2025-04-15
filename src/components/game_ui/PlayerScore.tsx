'use client';

import React from 'react';
import styles from '@/styles/themes/themes.module.css'; // Import theme styles

export interface PlayerScoreTheme {
  // Colors for active player
  activeBackgroundColor?: string;
  activeTextColor?: string;
  activeScoreBackgroundColor?: string;
  activeScoreColor?: string;
  
  // Colors for inactive player
  inactiveBackgroundColor?: string;
  inactiveTextColor?: string;
  inactiveScoreBackgroundColor?: string;
  inactiveScoreColor?: string;
  
  // Typography
  fontFamily?: string;
  fontSize?: string;
  scoreFontSize?: string;
  fontWeight?: string;
  
  // Styling
  borderRadius?: string;
  padding?: string;
  margin?: string;
  boxShadow?: string;
}

export interface PlayerScoreProps {
  playerName: string;
  score: number;
  isActive?: boolean;
  className?: string;
  theme?: PlayerScoreTheme;
  onClick?: () => void;
}

/**
 * PlayerScore component displays a player's name and score
 * with different styling for active vs inactive players
 * Based on the reference image with player names and scores
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
    // Active player (blue theme like in Banana example)
    activeBackgroundColor = '#93E1FF',
    activeTextColor = '#003A5C',
    activeScoreBackgroundColor = '#00AAFF',
    activeScoreColor = '#FFFFFF',
    
    // Inactive player (gray/white theme like in Dolphin and Capybara examples)
    inactiveBackgroundColor = '#FFFFFF',
    inactiveTextColor = '#003A5C',
    inactiveScoreBackgroundColor = '#E0E0E0',
    inactiveScoreColor = '#003A5C',
    
    // Typography
    fontFamily = 'Nunito, sans-serif',
    fontSize = '1.25rem',
    scoreFontSize = '1.5rem',
    fontWeight = '600',
    
    // Styling
    borderRadius = '0.75rem',
    margin = '0.5rem 0',
    boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
  } = theme;

  // Determine which theme to use based on active state
  const backgroundColor = isActive ? activeBackgroundColor : inactiveBackgroundColor;
  const textColor = isActive ? activeTextColor : inactiveTextColor;
  const scoreBackgroundColor = isActive ? activeScoreBackgroundColor : inactiveScoreBackgroundColor;
  const scoreColor = isActive ? activeScoreColor : inactiveScoreColor;

  // Interactive class for click behavior
  const interactiveClass = onClick ? 'cursor-pointer transition-transform hover:scale-[1.02]' : '';

  // Combine base wrapper class with active class if applicable, and any passed className
  const wrapperClasses = `
    ${styles.playerScoreWrapper}
    ${isActive ? styles.playerScoreActive : ''}
    ${interactiveClass}
    ${className}
  `.trim(); // Use trim to clean up potential extra spaces

  return (
    <div
      className={wrapperClasses}
      style={{
        margin,
        fontFamily,
        boxShadow,
        borderRadius,
        overflow: 'hidden', // Ensures child elements don't overflow the border radius
      }}
      onClick={onClick}
      role="button" // Indicate it's clickable
      tabIndex={onClick ? 0 : -1} // Make clickable items focusable
      aria-pressed={isActive} // Indicate active state for accessibility
      aria-label={`Player ${playerName}, Score ${score}, ${isActive ? 'Active' : 'Inactive'}`}
    >
      {/* Player name section */}
      <div 
        className={styles.playerName}
        style={{
          backgroundColor,
          color: textColor,
          fontWeight,
          fontSize,
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
          backgroundColor: scoreBackgroundColor,
          color: scoreColor,
          fontWeight,
          fontSize: scoreFontSize,
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