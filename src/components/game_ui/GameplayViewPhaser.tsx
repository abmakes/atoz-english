'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PhaserEngine } from '@/lib/phaser-engine/core/PhaserEngine';
import { MultipleChoiceGame } from '@/lib/phaser-games/multiple-choice/MultipleChoiceGame';
import { MULTIPLE_CHOICE_GAME_CONFIG } from '@/lib/phaser-games/multiple-choice/MultipleChoiceGameConfig';
import { GameOverPayload } from '@/types/gameTypes';

interface GameplayViewPhaserProps {
  gameSlug: string;
  quizId: string;
  onGameOver: (payload: GameOverPayload) => void;
  onBack: () => void;
}

export default function GameplayViewPhaser({
  gameSlug,
  quizId,
  onGameOver,
  onBack
}: GameplayViewPhaserProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const engineInstanceRef = useRef<PhaserEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to store the callback to avoid re-initialization
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const handleGameOver = useCallback((payload: GameOverPayload) => {
    console.log('GameplayViewPhaser: Game over received:', payload);
    onGameOverRef.current(payload);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeGame = async () => {
      try {
        if (!gameContainerRef.current) {
          console.log('GameplayViewPhaser: No container ref available');
          return;
        }

        // Check if there's already a Phaser canvas in the container
        const existingCanvas = gameContainerRef.current.querySelector('canvas');
        if (existingCanvas) {
          console.log('GameplayViewPhaser: Canvas already exists, skipping initialization');
          return;
        }

        if (engineInstanceRef.current) {
          console.log('GameplayViewPhaser: Engine already exists, skipping initialization');
          return;
        }

        console.log('GameplayViewPhaser: Initializing Phaser game...', { gameSlug });
        setError(null);

        // Create Phaser engine
        const phaserEngine = new PhaserEngine({
          width: 800,
          height: 600,
          backgroundColor: '#87CEEB',
          targetElement: gameContainerRef.current,
          debug: process.env.NODE_ENV === 'development'
        });

        if (!mounted) return;

        engineInstanceRef.current = phaserEngine;

        // Set up event listeners
        const eventBus = phaserEngine.getManager('eventBus');
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventBus.on('game:ended', (payload: any) => {
          console.log('GameplayViewPhaser: Game over event received:', payload);
          handleGameOver(payload);
        });

        // Initialize with the appropriate game
        const gameConfig = {
          ...MULTIPLE_CHOICE_GAME_CONFIG,
          quizId: quizId // Set the quizId from props
        };
        
        console.log('GameplayViewPhaser: Using game config with quizId:', quizId);
        
        if (gameSlug === 'multiple-choice') {
          await phaserEngine.init(gameConfig, (config, managers) => {
            console.log('GameplayViewPhaser: gameFactory called with config =', config);
            console.log('GameplayViewPhaser: gameFactory called with managers =', managers);
            return new MultipleChoiceGame(config, managers);
          });
        } else {
          throw new Error(`Unsupported game type: ${gameSlug}`);
        }

        if (!mounted) return;

        setIsInitialized(true);
        console.log('GameplayViewPhaser: Game initialized successfully');

      } catch (err) {
        console.error('GameplayViewPhaser: Failed to initialize game:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize game');
        }
      }
    };

    initializeGame();

    return () => {
      console.log('GameplayViewPhaser: useEffect cleanup triggered', { gameSlug });
      mounted = false;
      if (engineInstanceRef.current) {
        console.log('GameplayViewPhaser: Destroying engine...');
        engineInstanceRef.current.destroy();
        engineInstanceRef.current = null;
      }
      
      // Clean up any remaining canvas elements
      if (gameContainerRef.current) {
        const canvases = gameContainerRef.current.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          console.log('GameplayViewPhaser: Removing canvas element');
          canvas.remove();
        });
      }
    };
  }, [gameSlug, quizId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-600 text-lg font-semibold mb-4">Game Error</div>
        <div className="text-red-500 text-center mb-4">{error}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Back to Setup
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Phaser Game: {gameSlug}
        </h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Back to Setup
        </button>
      </div>
      
      <div 
        ref={gameContainerRef}
        className="w-full h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
        style={{ minHeight: '600px' }}
      >
        {!isInitialized && (
          <div className="text-gray-500 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div>Initializing Phaser game...</div>
          </div>
        )}
      </div>
    </div>
  );
}