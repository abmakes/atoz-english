'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Use App Router hook for navigation
import dynamic from 'next/dynamic'; // Import dynamic
import GameSetupPanel from './GameSetupPanel';
// import GameplayView from './GameplayView'; // Remove static import
import GameOverScreen from './GameOverScreen';
import styles from '@/styles/themes/themes.module.css';
// Import types from the central location
import { FullGameConfig, PlayerScoreData, GameOverPayload } from '@/types/gameTypes';
// Import necessary icons if not already imported
// Only import the type, as the NavMenu component itself isn't used here
import type { NavMenuItemProps } from './NavMenu';

// Dynamically import GameplayView with SSR disabled
const GameplayView = dynamic(() => import('./GameplayView'), {
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center">Loading Game View...</div> // Optional loading indicator
});

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;
// ... other icon imports if needed ...

// Updated GameView type
type GameView = 'setup' | 'playing' | 'gameover';

interface GameContainerProps {
  quizId: string; // Made required
  gameSlug: string; // Made required
}

// Prop interfaces for children (kept for clarity)
interface GameSetupPanelPropsForContainer {
    onStartGame: (config: Omit<FullGameConfig, 'quizId' | 'gameSlug'>) => void;
    onGoBack: () => void;
    initialGameSlug: string; // Pass slug down
    initialQuizId: string; // Pass Quiz ID down
}
interface GameplayViewPropsForContainer {
    config: FullGameConfig;
    themeClassName: string;
    onGameOver: (payload: GameOverPayload) => void;
    onExit: () => void;
}
interface GameOverScreenPropsForContainer {
     finalScores: PlayerScoreData[];
     winnerName?: string;
     backgroundUrl: string;
     themeClassName: string;
     navMenuItems: NavMenuItemProps[];
     onPlayAgain: () => void;
     onExit: () => void;
}


const GameContainer: React.FC<GameContainerProps> = ({ quizId, gameSlug }) => { // Use required props
  const router = useRouter(); // Hook for navigation
  const [currentView, setCurrentView] = useState<GameView>('setup'); // Default directly to 'setup'
  const [gameConfig, setGameConfig] = useState<FullGameConfig | null>(null);
  const [finalScores, setFinalScores] = useState<PlayerScoreData[]>([]);
  const [winnerName, setWinnerName] = useState<string | undefined>(undefined);
  const [themeClassName, setThemeClassName] = useState<string>(styles.themeBasic);

  // --- Handlers ---
  const handleStartGame = useCallback((setupConfig: Omit<FullGameConfig, 'quizId' | 'gameSlug'>) => {
      // Use quizId prop directly
      if (!quizId) {
          console.error("Cannot start game: No Quiz ID available! Navigating back.");
          router.push('/games'); // Navigate back to selection
          return;
      }

      const fullConfig: FullGameConfig = {
          ...setupConfig,
          quizId: quizId, // Use quizId prop
          // Correct: Use the gameSlug prop directly. If GameSetupPanel modifies it,
          // it should pass the modified slug back within the setupConfig object
          // under a DIFFERENT key, or handleStartGame needs adjustment.
          // For now, assume setupConfig DOES NOT contain gameSlug.
          gameSlug: gameSlug,
      };

      console.log('Starting game with full config:', fullConfig);
      setGameConfig(fullConfig);

      switch (fullConfig.theme) {
          case 'dark': setThemeClassName(styles.themeDark); break;
          case 'forest': setThemeClassName(styles.themeForest); break;
          case 'basic': default: setThemeClassName(styles.themeBasic); break;
      }
      setCurrentView('playing');
  }, [quizId, gameSlug, router]); // Updated dependencies

  const handleGameOver = useCallback((payload: GameOverPayload) => {
    console.log("GameContainer: Received GAME_OVER event. Payload:", payload);
    setFinalScores(payload.scores);
    setWinnerName(payload.winner);
    setCurrentView('gameover');
    // TODO: Submit results
  }, []);

  const handlePlayAgain = useCallback(() => {
    setGameConfig(null);
    setFinalScores([]);
    setWinnerName(undefined);
    // Removed clearSelectedQuiz()
    router.push('/games'); // Navigate back to quiz selection page
    setThemeClassName(styles.themeBasic);
  }, [router]); // Removed Zustand dependency

  const handleExit = useCallback(() => {
    console.log("GameContainer: Exiting game.");
    handlePlayAgain(); // Exit also goes back to quiz selection for now
  }, [handlePlayAgain]);

  const handleBackFromSetup = useCallback(() => {
      // Removed clearSelectedQuiz()
      router.push('/games'); // Navigate back to selection page
  }, [router]); // Removed Zustand dependency

  // --- Render ---
  const renderView = () => {
    switch (currentView) {
      // Removed 'selecting' case
      case 'setup':
        // Pass quizId prop down to GameSetupPanel
        const setupProps: GameSetupPanelPropsForContainer = {
            onStartGame: handleStartGame,
            onGoBack: handleBackFromSetup,
            initialGameSlug: gameSlug, // Pass slug down
            initialQuizId: quizId // Pass Quiz ID down
        };
        return <GameSetupPanel {...setupProps} />;
      case 'playing':
        if (!gameConfig) return <div>Loading Config...</div>; // Or error
        // Type assertion is okay here because we defined the interface
        const gameplayProps = {
            config: gameConfig,
            themeClassName: themeClassName,
            onGameOver: handleGameOver,
            onExit: handleExit
        } as GameplayViewPropsForContainer;
        // Render the dynamically imported component
        return <GameplayView {...gameplayProps} />;
      case 'gameover':
        if (!gameConfig) return <div>Loading...</div>; // Or error

        const gameOverNavItems: NavMenuItemProps[] = [
            { id: 'back', label: 'Exit Game', icon: <BackIcon />, onClick: handleExit },
        ];

        const gameOverProps: GameOverScreenPropsForContainer = {
            finalScores: finalScores,
            winnerName: winnerName,
            backgroundUrl: '/images/piggy.webp',
            themeClassName: themeClassName,
            onPlayAgain: handlePlayAgain,
            onExit: handleExit,
            navMenuItems: gameOverNavItems,
        };
        return <GameOverScreen {...gameOverProps} />;
      default:
        // This case should theoretically not be reachable anymore
        console.error("Reached unknown game state:", currentView);
        return <div>Error: Unknown game state!</div>;
    }
  };

  return <>{renderView()}</>; // Render the current view directly
};

export default GameContainer; 