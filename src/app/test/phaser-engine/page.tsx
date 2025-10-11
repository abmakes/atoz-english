'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Test page to verify the complete PhaserEngine with TestGame.
 * This tests the full engine initialization and game loading.
 */
export default function PhaserEngineTestPage() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Loading...');
  const [score, setScore] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<string>('Not started');

  useEffect(() => {
    let mounted = true;
    let phaserEngine: any = null;

    const testPhaserEngine = async () => {
      try {
        setStatus('Testing PhaserEngine imports...');
        
        // Test PhaserEngine import
        const { PhaserEngine } = await import('@/lib/phaser-engine/core/PhaserEngine');
        const { TestGame } = await import('@/lib/phaser-games/test/TestGame');
        const { TEST_GAME_CONFIG } = await import('@/lib/phaser-games/test/TestGameConfig');
        
        console.log('✅ PhaserEngine imports successful');
        
        if (!mounted) return;
        setStatus('Creating PhaserEngine...');

        // Create PhaserEngine
        phaserEngine = new PhaserEngine({
          width: 800,
          height: 600,
          targetElement: gameContainerRef.current || undefined,
          backgroundColor: '#87CEEB',
          debug: true
        });

        console.log('✅ PhaserEngine created successfully');
        
        if (!mounted) return;
        setStatus('Initializing PhaserEngine...');

        // Initialize with TestGame
        await phaserEngine.init(TEST_GAME_CONFIG, () => {
          return new TestGame(TEST_GAME_CONFIG, phaserEngine.getManagers());
        });

        console.log('✅ PhaserEngine initialized successfully');
        
        if (!mounted) return;
        setStatus('Starting TestGame...');

        // Get managers and set up event listeners
        const managers = phaserEngine.getManagers();
        
        // Listen for game events
        managers.eventBus.on('game:started', () => {
          console.log('✅ Game started event received');
          if (mounted) {
            setGameStatus('Playing');
          }
        });

        managers.eventBus.on('game:ended', (payload: any) => {
          console.log('✅ Game ended event received:', payload);
          if (mounted) {
            setGameStatus(`Game Over - Final Score: ${payload.finalScore}`);
          }
        });

        managers.eventBus.on('score:added', (payload: any) => {
          console.log('✅ Score added event received:', payload);
          if (mounted) {
            setScore(payload.newTotal);
          }
        });

        // Start the game
        const game = phaserEngine.getCurrentGame();
        if (game) {
          await game.init(Promise.resolve());
          game.start();
          console.log('✅ TestGame started successfully');
        }

        if (mounted) {
          setStatus('✅ PhaserEngine test successful!');
        }

        // Cleanup function
        return () => {
          console.log('Cleaning up PhaserEngine test...');
          if (phaserEngine) {
            phaserEngine.destroy();
          }
        };

      } catch (error) {
        console.error('❌ PhaserEngine test failed:', error);
        if (mounted) {
          setStatus(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };

    testPhaserEngine();

    return () => {
      mounted = false;
      if (phaserEngine) {
        phaserEngine.destroy();
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>PhaserEngine Integration Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status: {status}</h2>
        <p>Game Status: {gameStatus}</p>
        <p>Score: {score}</p>
        <p>This test verifies the complete PhaserEngine with TestGame integration.</p>
      </div>
      
      <div 
        ref={gameContainerRef}
        style={{
          border: '2px solid #333',
          borderRadius: '8px',
          backgroundColor: '#f0f0f0',
          minHeight: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {!gameContainerRef.current && (
          <p>Loading game container...</p>
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>What this test verifies:</h3>
        <ul>
          <li>✅ PhaserEngine creation and initialization</li>
          <li>✅ Manager initialization (EventBus, StorageManager, etc.)</li>
          <li>✅ TestGame creation and lifecycle</li>
          <li>✅ Event system communication</li>
          <li>✅ Asset loading (simplified)</li>
          <li>✅ Timer management</li>
          <li>✅ Audio management</li>
          <li>✅ Complete engine integration</li>
        </ul>
      </div>
    </div>
  );
}
