'use client';

import React, { useEffect, useMemo } from 'react';
import Image from 'next/image'; // For the background image
import PlayerScore, { PlayerScoreProps } from './PlayerScore';
import NavMenu, { NavMenuProps } from './NavMenu';
import styles from '@/styles/themes/themes.module.css';

interface GameOverScreenProps {
  finalScores: PlayerScoreProps[]; // Array of player data
  winnerName?: string; // Optional: if no winner (e.g., tie or manual exit)
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

// --- Define Background Images ---
const gameOverBackgroundImages = [
    '/images/gameover/bg1.webp', // Replace with your actual image paths
    '/images/gameover/bg2.webp',
    '/images/gameover/bg3.webp',
    '/images/gameover/bg4.webp',
    '/images/gameover/bg5.webp',
];
// --- End Background Images ---

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  finalScores,
  winnerName,
  themeClassName = styles.themeBasic, // Default theme if not provided
  navMenuItems,
  onPlayAgain,
  onExit,
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
    });

    // Optional: Cleanup function if needed, though unlikely for short sound
    return () => {
      audio.pause();
      audio.src = ''; 
    };
  }, []); // Empty dependency array ensures this runs only once on mount
  // ---------------------------------

  // --- Select Random Background Image ---
  const backgroundImage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * gameOverBackgroundImages.length);
    return gameOverBackgroundImages[randomIndex];
  }, []); // Empty dependency array ensures it's selected only once on mount
  // ---------------------------------

  // Prepare NavMenu items by potentially overriding the back handler
  const gameOverNavItems = navMenuItems.map(item =>
    item.id === 'back' ? { ...item, onClick: onExit, label: 'Exit Game' } : item // Make back button exit
    // You might want disable settings/main menu here too if desired
    // item.id === 'settings' ? {...item, onClick: onSettingsClick, disabled: true} : item
  );

  return (
    <div className={`${themeClassName} fixed inset-0 z-50 flex items-center justify-center flex-col overflow-hidden font-theme`}>
      {/* Background */}
      <div className={`absolute inset-0 w-full h-full object-cover z-0`}>
        {/* Use the randomly selected backgroundImage variable */}
        <Image
            src={backgroundImage}
            layout="fill" // Use fill to cover the container
            objectFit="cover" // Ensure image covers without distortion
            alt="Game Over Background"
            priority // Consider adding priority if this is the main visual element
            unoptimized
         />
      </div>

      {/* Player Scores Overlay */}
      <div className={`absolute flex flex-col gap-2 top-4 left-4 z-10`}>
        {finalScores.map((player) => (
          <PlayerScore
            key={player.playerName}
            playerName={player.playerName}
            score={player.score}
            isActive={winningPlayerNames.has(player.playerName)}
          />
        ))}
      </div>

      {/* NavMenu Overlay */}
      <div className={`absolute top-6 right-6 z-10`}>
         <NavMenu
            items={gameOverNavItems}
          />
          {/* TODO: Add logic to render GameSettingsPanel/MainMenuDropdown if needed */}
      </div>

      {/* Central Results Panel */}
      <div className="
          absolute
          -bottom-16
          z-10
          font-[var(--font-theme)]
          bg-[var(--panel-bg-theme)]
          backdrop-blur-sm
          rounded-[64px]
          px-20 pt-12 pb-28
          shadow-[var(--shadow-xl)]
          border
          border-[var(--panel-border)] 
          text-center
          max-w-[90%] 
        ">
        <h2 className={`titleXLarge grandstander font-bold`}>
          {titleMessage}
        </h2>
        <div className="w-full max-w-3xl mx-auto flex justify-center gap-6">
          <button onClick={onPlayAgain} className={`w-96 buttonXLarge`}>
            Play Again
          </button>
          <button onClick={onExit} className={`w-96 buttonXLarge`}>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen; 