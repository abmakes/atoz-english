'use client';

import React, { useEffect, useMemo } from 'react';
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
  // --- Calculate Tie/Winner --- 
  const { titleMessage, winningPlayerNames } = useMemo(() => {
    if (!finalScores || finalScores.length === 0) {
      return { titleMessage: 'Game Over!', winningPlayerNames: new Set<string>() };
    }

    // Find max score
    const maxScore = Math.max(...finalScores.map(s => s.score));

    // Find all players who achieved the max score
    const winners = finalScores.filter(s => s.score === maxScore);
    const winnerNamesSet = new Set(winners.map(w => w.playerName));

    let message = 'Game Over!';
    if (winners.length > 1) {
      message = "It's a Tie!";
    } else if (winners.length === 1) {
      // Use the winnerName prop if provided and matches, otherwise use calculated name
      const calculatedWinnerName = winners[0].playerName;
      const finalWinnerName = (winnerName && winnerName === calculatedWinnerName) ? winnerName : calculatedWinnerName;
      message = `${finalWinnerName} Wins!`;
    }
    // If winners.length === 0 (e.g., all negative scores? Or empty scores array handled above), default 'Game Over!' is kept

    return { titleMessage: message, winningPlayerNames: winnerNamesSet };
  }, [finalScores, winnerName]);
  // --------------------------

  // --- Play Victory Sound on Mount ---
  useEffect(() => {
    const victorySoundPath = '/audio/default/crowd-cheering.mp3';
    const audio = new Audio(victorySoundPath);
    audio.play().catch(error => {
      console.error('Error playing victory sound:', error);
      // Handle error - e.g., user hasn't interacted with the page yet
    });

    // Optional: Cleanup function if needed, though unlikely for short sound
    // return () => {
    //   audio.pause();
    //   audio.src = ''; 
    // };
  }, []); // Empty dependency array ensures this runs only once on mount
  // ---------------------------------

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
            key={player.playerName} 
            playerName={player.playerName}
            score={player.score}
            // Highlight player if their name is in the set of winners
            isActive={winningPlayerNames.has(player.playerName)} 
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
          {titleMessage}
        </h2>
        <div className="w-full max-w-3xl mx-auto flex justify-center gap-6">
          <button onClick={onPlayAgain} className={`w-96 ${styles.buttonXLarge}`}>
            Play Again
          </button>
          <button onClick={onExit} className={`w-96 ${styles.buttonXLarge}`}>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen; 