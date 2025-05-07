'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

// Interface for individual menu items
export interface NavMenuItemProps {
  id: string;
  label: string; // Used for aria-label and potentially tooltips
  // Allow ReactNode for icons, enabling components like the dropdown trigger
  icon: React.ReactNode; 
  onClick?: () => void;
  active?: boolean; // Optional active state for styling (e.g., toggles)
  // Flag to indicate if the item itself handles interaction (like a dropdown trigger)
  // If true, NavMenu won't attach its own onClick handler to the button element.
  customInteraction?: boolean; 
}

// Interface for the NavMenu component itself
export interface NavMenuProps {
  items: NavMenuItemProps[];
  expanded?: boolean; // Controls if labels are shown in vertical mode
  className?: string; // Allow passing additional classes
  ariaLabel?: string; // Accessibility label for the menu container
}

/**
 * Navigation menu component that can display items horizontally or vertically.
 */
const NavMenu: React.FC<NavMenuProps> = ({
  items,
  ariaLabel = 'Navigation Menu',
}) => {

  return (
    <nav className={`flex flex-row items-center justify-center gap-2`} aria-label={ariaLabel}>
      {items.map((item) => {
        // If item has custom interaction, render the icon directly (assuming it's a component like DropdownMenuTrigger)
        // Otherwise, wrap the icon in a button.
        if (item.customInteraction) {
          // Render the icon component directly. Apply styling classes if needed.
          // Note: The GameControlDropdown itself needs to handle its className for styling/layout within the nav.
          return React.isValidElement(item.icon) 
            ? React.cloneElement(item.icon as React.ReactElement, { key: item.id }) 
            : null; // Or render a placeholder/error
        } else {
          // Render as a standard button
          return (
            <Button
              key={item.id}
              variant="navIcon"
              className={`bg-[var(--primary-accent)] text-[var(--text-color)] rounded-full flex items-center justify-center border-2 border-[var(--primary-accent)]`}
              onClick={item.onClick}
              aria-label={item.label}
              aria-pressed={item.active !== undefined ? item.active : undefined}
            >
              {item.icon}
            </Button>
          );
        }
      })}
    </nav>
  );
};

export default NavMenu; 