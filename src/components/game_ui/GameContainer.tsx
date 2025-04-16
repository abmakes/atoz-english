'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import GameSetupPanel from './GameSetupPanel';
import GameOverScreen from './GameOverScreen';
import styles from '@/styles/themes/themes.module.css';
import { FullGameConfig, PlayerScoreData, GameOverPayload } from '@/types/gameTypes';
import {
    GameConfig,
    ScoreModeConfig,
    PowerupConfig,
    DEFAULT_GAME_CONFIG,
} from '@/lib/pixi-engine/config/GameConfig';
import { PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine';
import { MultipleChoiceGame } from '@/lib/pixi-games/multiple-choice/MultipleChoiceGame';
import type { NavMenuItemProps } from './NavMenu';

const GameplayView = dynamic(() => import('./GameplayView'), {
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center">Loading Game View...</div>
});

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;

type GameView = 'setup' | 'playing' | 'gameover';

interface GameContainerProps {
  quizId: string;
  gameSlug: string;
}

const gameFactory = (config: GameConfig, managers: PixiEngineManagers): MultipleChoiceGame => {
    return new MultipleChoiceGame(config, managers);
};

const GameContainer: React.FC<GameContainerProps> = ({ quizId, gameSlug }) => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<GameView>('setup');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [finalScores, setFinalScores] = useState<PlayerScoreData[]>([]);
  const [winnerName, setWinnerName] = useState<string | undefined>(undefined);
  const [themeClassName, setThemeClassName] = useState<string>(styles.themeBasic);

  const pixiMountPointRef = useRef<HTMLDivElement>(null);

  const handleStartGame = useCallback((setupConfig: Omit<FullGameConfig, 'quizId' | 'gameSlug'>) => {
      if (!quizId) {
          console.error("Cannot start game: No Quiz ID available! Navigating back.");
          router.push('/games');
          return;
      }

      const gameMode: ScoreModeConfig = {
          type: 'score',
          name: 'Score Attack',
      };
      const powerupConfig: PowerupConfig = {
          availablePowerups: [],
          spawnMechanic: {},
      };

      const fullEngineConfig: GameConfig = {
          ...DEFAULT_GAME_CONFIG,
          quizId: quizId,
          gameSlug: gameSlug,
          teams: setupConfig.teams,
          gameMode: gameMode,
          powerups: powerupConfig,
          intensityTimeLimit: setupConfig.intensityTimeLimit,
      };

      console.log('Prepared full engine config:', fullEngineConfig);
      setGameConfig(fullEngineConfig);

      switch (setupConfig.theme) {
          case 'dark': setThemeClassName(styles.themeDark); break;
          case 'forest': setThemeClassName(styles.themeForest); break;
          case 'basic': default: setThemeClassName(styles.themeBasic); break;
      }
      setCurrentView('playing');
  }, [quizId, gameSlug, router]);

  const handleGameOver = useCallback((payload: GameOverPayload) => {
    console.log("GameContainer: Received GAME_OVER event. Payload:", payload);
    setFinalScores(payload.scores);
    setWinnerName(payload.winner);
    setCurrentView('gameover');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setGameConfig(null);
    setFinalScores([]);
    setWinnerName(undefined);
    router.push('/games');
    setThemeClassName(styles.themeBasic);
  }, [router]);

  const handleExit = useCallback(() => {
    console.log("GameContainer: Exiting game.");
    handlePlayAgain();
  }, [handlePlayAgain]);

  const handleBackFromSetup = useCallback(() => {
      router.push('/games');
  }, [router]);

  const renderView = () => {
    switch (currentView) {
      case 'setup':
        return <GameSetupPanel
                    onStartGame={handleStartGame}
                    onGoBack={handleBackFromSetup}
                    initialGameSlug={gameSlug}
                />;
      case 'playing':
        if (!gameConfig) {
             return <div>Loading Game Config...</div>;
        }
        // When playing, render GameplayView and pass the ref for Pixi to mount into
        return (
            <>
                <GameplayView
                    config={gameConfig}
                    themeClassName={themeClassName}
                    onGameOver={handleGameOver}
                    onExit={handleExit}
                    pixiMountPointRef={pixiMountPointRef}
                    gameFactory={gameFactory}
                />
            </>
        );
      case 'gameover':
        const gameOverNavItems: NavMenuItemProps[] = [
            { id: 'back', label: 'Exit Game', icon: <BackIcon />, onClick: handleExit },
        ];
        return <GameOverScreen
                    finalScores={finalScores}
                    winnerName={winnerName}
                    backgroundUrl={'/images/piggy.webp'}
                    themeClassName={themeClassName}
                    onPlayAgain={handlePlayAgain}
                    onExit={handleExit}
                    navMenuItems={gameOverNavItems}
                />;
      default:
        console.error("Reached unknown game state:", currentView);
        return <div>Error: Unknown game state!</div>;
    }
  };

  return <>{renderView()}</>;
};

export default GameContainer; 