'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import GameSetupPanel from './GameSetupPanel';
import GameOverScreen, { selectCelebrationImage, preloadCelebrationImage } from './GameOverScreen';
import { GameSetupData, GameOverPayload } from '@/types/gameTypes';
import { shouldUsePhaser } from '@/lib/engine-config';
import LoadingSpinner from '../loading_spinner';

// Dynamic imports for both engines
const PixiGameplayView = dynamic(() => import('./GameplayView'), {
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
});

const PhaserGameplayView = dynamic(() => import('./GameplayViewPhaser'), {
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
});

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;

type GameView = 'setup' | 'playing' | 'gameover';

/**
 * Props for the GameContainer component.
 */
interface GameContainerProps {
  /** The unique identifier for the quiz to be played. */
  quizId: string;
  /** The URL slug for the game type (e.g., 'multiple-choice'). */
  gameSlug: string;
}

/**
 * Hybrid GameContainer that can use either PixiJS or Phaser engine
 * based on configuration
 */
export default function GameContainerHybrid({ quizId, gameSlug }: GameContainerProps) {
  const [gameView, setGameView] = useState<GameView>('setup');
  const [gameSetupData, setGameSetupData] = useState<GameSetupData | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverPayload | null>(null);
  const [engineType, setEngineType] = useState<'pixi' | 'phaser'>('pixi');
  
  const router = useRouter();

  // Determine which engine to use
  useEffect(() => {
    const usePhaser = shouldUsePhaser(gameSlug);
    setEngineType(usePhaser ? 'phaser' : 'pixi');
    console.log(`GameContainerHybrid: Using ${usePhaser ? 'Phaser' : 'PixiJS'} engine for game: ${gameSlug}`);
  }, [gameSlug]);

  const handleStartGame = useCallback((config: Omit<GameSetupData, 'quizId' | 'gameSlug'>) => {
    const setupData: GameSetupData = {
      ...config,
      quizId,
      gameSlug
    };
    console.log('GameContainerHybrid: Starting game with setup data:', setupData);
    setGameSetupData(setupData);
    setGameView('playing');
  }, [quizId, gameSlug]);

  const handleBackFromSetup = useCallback(() => {
    console.log('GameContainerHybrid: Back from setup');
    setGameView('setup');
    setGameSetupData(null);
  }, []);

  const handleGameOver = useCallback((payload: GameOverPayload) => {
    console.log('GameContainerHybrid: Game over with payload:', payload);
    setGameOverData(payload);
    setGameView('gameover');
  }, []);

  const handleBackFromGameOver = useCallback(() => {
    console.log('GameContainerHybrid: Back from game over');
    setGameView('setup');
    setGameOverData(null);
    setGameSetupData(null);
  }, []);

  const handleBackToMenu = useCallback(() => {
    console.log('GameContainerHybrid: Back to menu');
    router.push('/');
  }, [router]);

  const handleBackFromPlaying = useCallback(() => {
    console.log('GameContainerHybrid: Back from playing');
    setGameView('setup');
    setGameSetupData(null);
  }, []);

  // Preload celebration image when game over data is available
  useEffect(() => {
    if (gameOverData) {
      const celebrationImage = selectCelebrationImage();
      if (celebrationImage) {
        preloadCelebrationImage(celebrationImage);
      }
    }
  }, [gameOverData]);

  const renderGameplayView = () => {
    if (!gameSetupData) {
      return <div>No game setup data available</div>;
    }

    if (engineType === 'phaser') {
      return (
        <PhaserGameplayView
          gameSlug={gameSlug}
          onGameOver={handleGameOver}
          onBack={handleBackFromPlaying}
        />
      );
    } else {
      return (
        <PixiGameplayView
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          config={{} as any} // TODO: Convert GameSetupData to GameConfig
          themeClassName={gameSetupData.theme}
          onGameOver={handleGameOver}
          onExit={handleBackFromPlaying}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pixiMountPointRef={null as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          gameFactory={null as any}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={handleBackToMenu}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <BackIcon />
              <span>Back to Menu</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Engine: <span className="font-medium">{engineType === 'phaser' ? 'Phaser' : 'PixiJS'}</span>
              </div>
              <div className="text-sm text-gray-500">
                Game: <span className="font-medium">{gameSlug}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {gameView === 'setup' && (
          <GameSetupPanel
            onStartGame={handleStartGame}
            onGoBack={handleBackFromSetup}
            initialGameSlug={gameSlug}
            quizId={quizId}
          />
        )}

        {gameView === 'playing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Playing {gameSlug} with {engineType === 'phaser' ? 'Phaser' : 'PixiJS'} Engine
              </h2>
              {renderGameplayView()}
            </div>
          </div>
        )}

        {gameView === 'gameover' && gameOverData && (
          <GameOverScreen
            finalScores={gameOverData.scores || []}
            winnerName={gameOverData.winner}
            themeClassName={gameSetupData?.theme || 'basic'}
            navMenuItems={[]}
            onPlayAgain={handleBackFromGameOver}
            onExit={handleBackToMenu}
            onMainMenuClick={handleBackToMenu}
          />
        )}
      </div>

      {/* Loading Overlay - Removed since isLoading is not used */}
    </div>
  );
}
