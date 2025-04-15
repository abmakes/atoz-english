'use client';

import React from 'react';
import styles from '@/styles/themes/themes.module.css';

// Re-use NavMenuItemProps or define specific actions
interface MainMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode; // Optional icon
  onClick: () => void;
}

interface MainMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string; // Add className prop
  // Callbacks for actions
  onRestartGame: () => void;
  onGoHome: () => void;
  onQuitGame: () => void;
}

// Example SVGs (replace with actual imports or component library)
const RestartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>;
const QuitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;


const MainMenuDropdown: React.FC<MainMenuDropdownProps> = ({
  isOpen,
  onClose, // Used for potential backdrop click or close button
  className = '', // Default to empty string
  onRestartGame,
  onGoHome,
  onQuitGame,
}) => {

  if (!isOpen) {
    return null;
  }

  const menuItems: MainMenuItem[] = [
    { id: 'restart', label: 'Restart Game', icon: <RestartIcon />, onClick: onRestartGame },
    { id: 'home', label: 'Go Home', icon: <HomeIcon />, onClick: onGoHome },
    { id: 'quit', label: 'Quit Game', icon: <QuitIcon />, onClick: onQuitGame },
  ];

  // Optional: Handler to close the panel if clicked outside
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Check if the clicked element is the backdrop itself, not a child
    if (event.target === event.currentTarget) {
      onClose();
    }
  };


  return (
    // Add the backdrop div and attach the click handler
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        className={`${styles.mainMenuDropdown} ${className}`}
        role="menu" // Use role="menu" for dropdowns
        aria-orientation="vertical"
        aria-labelledby="main-menu-button" // Assume the trigger button has id="main-menu-button"
      >
         {menuItems.map((item) => (
           <button
             key={item.id}
             className={styles.mainMenuDropdownItem}
             onClick={() => {
                 item.onClick();
                 onClose(); // Close dropdown after action
             }}
             role="menuitem"
           >
             {item.icon && item.icon}
             <span className={styles.navMenuItemLabel}>{item.label}</span>
           </button>
         ))}
      </div>
    </div>
  );
};

export default MainMenuDropdown; 