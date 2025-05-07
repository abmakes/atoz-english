import React from 'react';

interface LoadingSpinnerProps {
  /** Optional additional className to apply to the spinner container */
  className?: string;
  /** Optional inline styles to apply */
  style?: React.CSSProperties;
  /** Optional size in pixels (adjusts font-size) */
  size?: number;
   /** Optional color override */
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className = '',
  style = {},
  size,
  color
}) => {
  // Combine base style with potential size/color overrides
  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(size && { fontSize: `${size}px` }), // Adjust font-size based on prop
    ...(color && { color: color }) // Override color if prop is provided
  };

  return (
    <div
      className={`${className}`} // Combine module class with any passed className
      style={combinedStyle}
      aria-label="Loading..." // Accessibility
      role="status" // Accessibility
    >
      {/* Text is hidden via text-indent */}
      Loading
    </div>
  );
};

export default LoadingSpinner;
  