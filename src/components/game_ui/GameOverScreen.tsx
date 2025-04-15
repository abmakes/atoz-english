'use client';

import React from 'react';
import Image from 'next/image'; // For the crown image
import PlayerScore, { PlayerScoreProps } from './PlayerScore';
import NavMenu, { NavMenuProps } from './NavMenu';
import styles from '@/styles/themes/themes.module.css';

interface GameOverScreenProps {
  finalScores: PlayerScoreProps[]; // Array of player data
  winnerName?: string; // Optional: if no winner (e.g., tie or manual exit)
  backgroundUrl: string; // URL for the background GIF/Image/Video
  themeClassName?: string; // Pass the current theme class
  navMenuItems: NavMenuProps['items']; // Items for the NavMenu
  // Callbacks
  onPlayAgain: () => void;
  onExit: () => void;
  // Pass NavMenu action handlers if needed
  onSettingsClick?: () => void;
  onMainMenuClick?: () => void;
  onBackClick?: () => void; // 'Back' might function as 'Exit' here
}

// Example Crown Image Path (replace with actual path)
// const CROWN_IMAGE_PATH = '/images/ui/crown.png'; // Make sure this exists in public/images/ui

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  finalScores,
  winnerName,
  backgroundUrl,
  themeClassName = styles.themeBasic, // Default theme if not provided
  navMenuItems,
  onPlayAgain,
  onExit,
  // onSettingsClick,
  // onMainMenuClick,
  // onBackClick,
}) => {
  // Prepare NavMenu items by potentially overriding the back handler
  const gameOverNavItems = navMenuItems.map(item =>
    item.id === 'back' ? { ...item, onClick: onExit, label: 'Exit Game' } : item // Make back button exit
    // You might want disable settings/main menu here too if desired
    // item.id === 'settings' ? {...item, onClick: onSettingsClick, disabled: true} : item
  );


  return (
    <div className={`${styles.gameOverScreen} ${styles.themeWrapper} ${themeClassName}`}>
      {/* Background */}
      <div className={styles.gameOverBackground}>
        {/* Use img, video, or a styled div based on backgroundUrl type */}
        <Image src={backgroundUrl} width={1600} height={900} alt="Game Over Background" />
      </div>

      {/* Player Scores Overlay */}
      <div className={styles.gameOverPlayerScoresOverlay}>
        {finalScores.map((player) => (
          <PlayerScore
            key={player.playerName} // Assuming playerName is unique for this view
            playerName={player.playerName}
            score={player.score}
            isActive={player.playerName === winnerName} // Highlight winner
            // Disable clicking on scores in game over screen?
            // onClick={undefined}
          />
        ))}
      </div>

      {/* NavMenu Overlay */}
      <div className={styles.gameOverNavMenuOverlay}>
         <NavMenu
            items={gameOverNavItems}
            orientation="horizontal"
            // You might need to manage the dropdown states separately for this screen
            // or pass handlers down if they should still function
            // For simplicity, we might just show the buttons without dropdowns here
          />
          {/* TODO: Add logic to render GameSettingsPanel/MainMenuDropdown if needed */}
      </div>

      {/* Central Results Panel */}
      <div className={styles.gameOverPanel}>
        <h2 className={styles.gameOverTitle}>
          {winnerName ? `${winnerName} Wins!` : 'Game Over!'}
        </h2>
        <div className={styles.gameOverButtons}>
          <button onClick={onPlayAgain} className={styles.gameOverButton}>
            Play Again
          </button>
          <button onClick={onExit} className={`${styles.gameOverButton} ${styles.gameOverButtonSecondary}`}>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen; 