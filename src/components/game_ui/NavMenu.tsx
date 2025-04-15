'use client';

import React from 'react';
import styles from '@/styles/themes/themes.module.css'; // Import theme styles

// Interface for individual menu items
export interface NavMenuItemProps {
  id: string;
  label: string; // Used for aria-label and potentially tooltips
  icon: React.ReactNode; // Expecting SVG or similar icon component
  onClick?: () => void;
  active?: boolean; // Optional active state for styling (e.g., toggles)
  disabled?: boolean;
}

// Interface for the NavMenu component itself
export interface NavMenuProps {
  items: NavMenuItemProps[];
  orientation?: 'horizontal' | 'vertical';
  expanded?: boolean; // Controls if labels are shown in vertical mode
  className?: string; // Allow passing additional classes
  ariaLabel?: string; // Accessibility label for the menu container
}

/**
 * Navigation menu component that can display items horizontally or vertically.
 */
const NavMenu: React.FC<NavMenuProps> = ({
  items,
  orientation = 'horizontal',
  expanded = false, // Default to icons only for vertical unless expanded
  className = '',
  ariaLabel = 'Navigation Menu',
}) => {

  const isVertical = orientation === 'vertical';

  // Determine wrapper class based on orientation
  const wrapperClasses = `
    ${styles.navMenuWrapper}
    ${isVertical ? styles.navMenuVertical : styles.navMenuHorizontal}
    ${className}
  `.trim();

  // Determine item class based on orientation and expansion
  const itemBaseClass = isVertical ? styles.navMenuItemVertical : styles.navMenuItem;

  return (
    <nav className={wrapperClasses} aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          className={`${itemBaseClass} ${item.active ? styles.buttonChoiceActive : ''}`} // Apply active style if needed
          onClick={item.onClick}
          disabled={item.disabled}
          aria-label={item.label}
          // Add aria-pressed for toggle buttons if 'active' state is meaningful
          aria-pressed={item.active !== undefined ? item.active : undefined}
        >
          {item.icon}
          {/* Show label only if vertical and expanded */}
          {isVertical && expanded && (
            <span className={styles.navMenuItemLabel}>{item.label}</span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default NavMenu; 