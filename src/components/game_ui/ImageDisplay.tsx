'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export interface ImageDisplayTheme {
  // Colors
  borderColor?: string;
  backgroundColor?: string;
  placeholderColor?: string;
  // Styling
  borderWidth?: string;
  borderRadius?: string;
  boxShadow?: string;
  padding?: string;
}

export interface ImageDisplayProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  theme?: ImageDisplayTheme;
  priority?: boolean;
  showBorder?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onClick?: () => void;
}

/**
 * Image display component with rounded corners and a dark blue border
 * For displaying images in the game UI
 */
const ImageDisplay: React.FC<ImageDisplayProps> = ({
  src,
  alt,
  width = 300,
  height = 200,
  className = '',
  theme = {},
  priority = false,
  showBorder = true,
  objectFit = 'contain',
  onClick
}) => {
  // Apply theme defaults
  const {
    borderColor = '#003A5C',           // Dark blue
    backgroundColor = '#FFFFFF',       // White
    placeholderColor = '#E0F7FF',      // Very light blue
    borderWidth = showBorder ? '3px' : '0',
    borderRadius = '0.75rem',
    boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding = '0'
  } = theme;

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setIsError(true);
  };

  // Interactive styles for click behavior
  const interactiveClass = onClick ? 'cursor-pointer transition-transform hover:scale-[1.02]' : '';

  return (
    <div
      className={`image-display relative overflow-hidden ${interactiveClass} ${className}`}
      style={{
        width,
        height,
        borderRadius,
        border: `${borderWidth} solid ${borderColor}`,
        backgroundColor: isLoading ? placeholderColor : backgroundColor,
        boxShadow,
        padding
      }}
      onClick={onClick}
    >
      {/* Loading Placeholder */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse w-12 h-12 rounded-full bg-blue-200"></div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-red-500 text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>Image failed to load</p>
          </div>
        </div>
      )}

      {/* Image */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${isLoading || isError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{
          objectFit,
          borderRadius: borderRadius ?? undefined
        }}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default ImageDisplay; 