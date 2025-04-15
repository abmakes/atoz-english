'use client';

import React from 'react';

export interface TransitionPanelTheme {
  // Colors
  backgroundColor?: string;
  titleColor?: string;
  messageColor?: string;
  // Typography
  fontFamily?: string;
  titleFontSize?: string;
  messageFontSize?: string;
  titleFontWeight?: string;
  messageFontWeight?: string;
  // Styling
  borderRadius?: string;
  padding?: string;
  boxShadow?: string;
  opacity?: number;
}

export interface TransitionPanelProps {
  title?: string;          // Main title (e.g., player name)
  message?: string;        // Additional message (e.g., "Get ready!")
  className?: string;
  theme?: TransitionPanelTheme;
  visible?: boolean;       // Whether the panel is visible
  fullScreen?: boolean;    // Whether to cover the full screen
  onAnimationEnd?: () => void; // Callback when transition animation ends
  children?: React.ReactNode; // Optional additional content
}

/**
 * TransitionPanel component for displaying between-state messages like "Get ready!"
 * Based on the light blue panel design from the reference image
 */
const TransitionPanel: React.FC<TransitionPanelProps> = ({
  title,
  message = "Get ready!",
  className = '',
  theme = {},
  visible = true,
  fullScreen = true,
  onAnimationEnd,
  children,
}) => {
  // Apply theme defaults based on the light blue panel from the image
  const {
    backgroundColor = 'rgba(233, 246, 255, 0.95)', // Very light blue with high opacity
    titleColor = '#003A5C',             // Dark blue
    messageColor = '#006699',           // Medium blue
    fontFamily = 'Nunito, sans-serif',
    titleFontSize = '3.5rem',           // Large title
    messageFontSize = '2.5rem',         // Smaller message
    titleFontWeight = '700',            // Bold
    messageFontWeight = '600',          // Semi-bold
    borderRadius = fullScreen ? '0' : '1.5rem',
    padding = '2rem',
    boxShadow = fullScreen ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.15)',
    opacity = 1
  } = theme;

  // Base classes for animation
  const baseClasses = `transition-all duration-500 ease-in-out ${className}`;
  const visibilityClasses = visible 
    ? 'opacity-100 scale-100' 
    : 'opacity-0 scale-95 pointer-events-none';

  return (
    <div 
      className={`transition-panel ${baseClasses} ${visibilityClasses} ${fullScreen ? 'fixed inset-0 z-50 flex items-center justify-center' : 'relative'}`}
      style={{
        backgroundColor: fullScreen ? backgroundColor : 'transparent',
        backdropFilter: fullScreen ? 'blur(5px)' : 'none',
      }}
      onAnimationEnd={onAnimationEnd}
    >
      <div 
        className={`panel-content flex flex-col items-center justify-center text-center ${fullScreen ? 'w-full h-full' : ''}`}
        style={{
          backgroundColor: fullScreen ? 'transparent' : backgroundColor,
          borderRadius,
          padding,
          boxShadow,
          fontFamily,
          opacity,
          width: fullScreen ? '100%' : undefined,
          height: fullScreen ? '100%' : undefined,
        }}
      >
        {title && (
          <h1 
            className="transition-panel-title mb-4"
            style={{
              color: titleColor,
              fontSize: titleFontSize,
              fontWeight: titleFontWeight,
            }}
          >
            {title}
          </h1>
        )}
        
        {message && (
          <p 
            className="transition-panel-message mb-8"
            style={{
              color: messageColor,
              fontSize: messageFontSize,
              fontWeight: messageFontWeight,
            }}
          >
            {message}
          </p>
        )}
        
        {children}
      </div>
    </div>
  );
};

export default TransitionPanel; 