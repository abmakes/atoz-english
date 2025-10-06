'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PhaserEngine } from '@/lib/phaser-engine/core/PhaserEngine';
import { TestGame } from '@/lib/phaser-games/test/TestGame';
import { TEST_GAME_CONFIG } from '@/lib/phaser-games/test/TestGameConfig';

/**
 * Test page for verifying the Phaser engine foundation.
 * This page demonstrates:
 * - PhaserEngine initialization
 * - Test game creation and lifecycle
 * - Manager integration
 * - Event handling
 */
export default function PhaserTestPage() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<PhaserEngine | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('Initializing...');
  const [score, setScore] = useState<number>(0);
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const initializeEngine = async () => {
      try {
        setGameStatus('Creating Phaser Engine...');
        
        // Create Phaser engine
        const phaserEngine = new PhaserEngine({
          width: 800,
          height: 600,
          backgroundColor: '#87CEEB',
          targetElement: gameContainerRef.current || undefined,
          debug: process.env.NODE_ENV === 'development'
        });

        if (!mounted) return;

        setEngine(phaserEngine);
        setGameStatus('Initializing game...');

        // Initialize with test game
        await phaserEngine.init(TEST_GAME_CONFIG, (config, managers) => {
          return new TestGame(config, managers);
        });

        if (!mounted) return;

        setGameStatus('Game initialized successfully!');
        setIsGameRunning(true);

        // Set up event listeners
        const eventBus = phaserEngine.getManager('eventBus');
        
        // Listen for score updates
        eventBus.on('test:incrementScore', () => {
          setScore(prev => prev + 5);
        });

        // Listen for game over
        eventBus.on('game:over', (payload: { finalScore: number; clickCount: number }) => {
          setGameStatus(`Game Over! Final Score: ${payload.finalScore}`);
          setIsGameRunning(false);
        });

        // Start the game
        const currentGame = phaserEngine.getCurrentGame();
        if (currentGame) {
          currentGame.start();
        }

      } catch (error) {
        console.error('Failed to initialize Phaser engine:', error);
        setGameStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initializeEngine();

    return () => {
      mounted = false;
      if (engine) {
        engine.destroy();
      }
    };
  }, [engine]);

  const handleStartGame = () => {
    if (engine) {
      const currentGame = engine.getCurrentGame();
      if (currentGame) {
        currentGame.start();
        setGameStatus('Game started!');
        setIsGameRunning(true);
      }
    }
  };

  const handlePauseGame = () => {
    if (engine) {
      engine.pause();
      setGameStatus('Game paused');
      setIsGameRunning(false);
    }
  };

  const handleResumeGame = () => {
    if (engine) {
      engine.resume();
      setGameStatus('Game resumed');
      setIsGameRunning(true);
    }
  };

  const handleEndGame = () => {
    if (engine) {
      const currentGame = engine.getCurrentGame();
      if (currentGame) {
        currentGame.end();
        setGameStatus('Game ended');
        setIsGameRunning(false);
      }
    }
  };

  const handleIncrementScore = () => {
    if (engine) {
      const eventBus = engine.getManager('eventBus');
      eventBus.emit('test:incrementScore');
    }
  };

  const handleChangeMessage = () => {
    if (engine) {
      const eventBus = engine.getManager('eventBus');
      const messages = [
        'Hello from React!',
        'Phaser Engine Working!',
        'Event System Active!',
        'Managers Connected!'
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      eventBus.emit('test:changeMessage', randomMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Phaser Engine Test Page
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Container */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Game Display</h2>
              <div 
                ref={gameContainerRef}
                className="w-full h-96 bg-gray-200 rounded border-2 border-dashed border-gray-400 flex items-center justify-center"
                style={{ minHeight: '400px' }}
              >
                {!engine && (
                  <div className="text-gray-500 text-center">
                    <div className="text-lg font-semibold mb-2">Loading Phaser Engine...</div>
                    <div className="text-sm">This may take a moment</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Status</h2>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Engine:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    engine ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {engine ? 'Ready' : 'Initializing'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Game:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    isGameRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isGameRunning ? 'Running' : 'Stopped'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Score:</span> 
                  <span className="ml-2 font-bold text-blue-600">{score}</span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {gameStatus}
                </div>
              </div>
            </div>

            {/* Game Controls */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Game Controls</h2>
              <div className="space-y-2">
                <button
                  onClick={handleStartGame}
                  disabled={!engine || isGameRunning}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Start Game
                </button>
                <button
                  onClick={handlePauseGame}
                  disabled={!engine || !isGameRunning}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Pause Game
                </button>
                <button
                  onClick={handleResumeGame}
                  disabled={!engine || isGameRunning}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Resume Game
                </button>
                <button
                  onClick={handleEndGame}
                  disabled={!engine}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  End Game
                </button>
              </div>
            </div>

            {/* Test Controls */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
              <div className="space-y-2">
                <button
                  onClick={handleIncrementScore}
                  disabled={!engine}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Increment Score (+5)
                </button>
                <button
                  onClick={handleChangeMessage}
                  disabled={!engine}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Change Message
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Click &quot;Start Game&quot; to begin the test game</p>
                <p>• Click the red button in the game to score points</p>
                <p>• Use the test controls to interact with the game</p>
                <p>• The game ends when you reach 100 points</p>
                <p>• Check the browser console for detailed logs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
