'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PhaserEngine, GameFactory } from '@/lib/phaser-engine/core/PhaserEngine';
import { GameConfig } from '@/lib/phaser-engine/config/GameConfig';
import { MultipleChoiceGame } from '@/lib/phaser-games/multiple-choice/MultipleChoiceGame';

/**
 * Client-side component to test the MultipleChoiceGame integration with PhaserEngine.
 */
export default function MultipleChoiceGameTest() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserEngineRef = useRef<PhaserEngine | null>(null);
  const [status, setStatus] = useState<string>('Initializing Multiple Choice Game...');
  const [gameScore, setGameScore] = useState<number>(0);
  const [gamePhase, setGamePhase] = useState<string>('loading');

  useEffect(() => {
    let mounted = true;

    const initializeEngine = async () => {
      if (!gameContainerRef.current) {
        setStatus('Error: Game container not found.');
        return;
      }

      try {
        setStatus('Creating PhaserEngine instance...');
        const engine = new PhaserEngine({
          width: 800,
          height: 600,
          backgroundColor: '#1a1a1a',
          targetElement: gameContainerRef.current,
          debug: true,
        });
        phaserEngineRef.current = engine;
        console.log('PhaserEngine instance created.');

        setStatus('Initializing PhaserEngine with MultipleChoiceGame...');
        
        // Create a simple test config for multiple choice game
        const testConfig: GameConfig = {
          id: 'test-multiple-choice',
          name: 'Test Multiple Choice Game',
          description: 'A test multiple choice game',
          version: '1.0.0',
          gameType: 'multiple-choice',
          gameMode: {
            type: 'score',
            turnBased: false,
            targetScore: 100
          },
          teams: [
            { id: 'team1', name: 'Team 1', color: '#ff0000', lives: 3 }
          ],
          powerups: {
            powerupsEnabled: false,
            powerupDefinitions: []
          },
          theme: 'default',
          quizId: 'cmg13e01l000cubigygjaoo04', // Using a real quiz ID from the database
          questionHandling: {
            distributionMode: 'sharedPool',
            randomizeOrder: false,
            maxQuestions: 5,
            timePerQuestion: 30
          },
          intensityTimeLimit: 30,
          scoring: {
            correctAnswer: 10,
            incorrectAnswer: 0,
            timeBonus: true
          },
          rules: [],
          controls: {},
          assets: {}
        };

        const gameFactory: GameFactory = (config: GameConfig, managers) => {
          return new MultipleChoiceGame(config, managers);
        };
        
        await engine.init(testConfig, gameFactory);
        
        // Set up event listeners after init
        engine.getManagers().eventBus.on('game:started', () => {
          if (mounted) setGamePhase('playing');
          console.log('Event: game:started');
        });
        engine.getManagers().eventBus.on('game:ended', (payload) => {
          if (mounted) {
            setGamePhase('ended');
            setGameScore(payload.scores[0]?.score || 0);
          }
          console.log('Event: game:ended', payload);
        });
        engine.getManagers().eventBus.on('game:over', (payload) => {
          if (mounted) {
            setGamePhase('gameover');
            setGameScore(payload.finalScore);
          }
          console.log('Event: game:over', payload);
        });
        engine.getManagers().eventBus.on('score:added', (payload) => {
          if (mounted) setGameScore(payload.newTotal);
          console.log('Event: score:added', payload);
        });
        engine.getManagers().eventBus.on('score:updated', (payload) => {
          if (mounted) setGameScore(payload.newTotal);
          console.log('Event: score:updated', payload);
        });
        engine.getManagers().eventBus.on('engine:readyForGame', () => {
          if (mounted) setStatus('Engine ready, starting game...');
          console.log('Event: engine:readyForGame');
          engine.startGame();
        });
        
        if (mounted) {
          setStatus('MultipleChoiceGame initialized successfully!');
        }

      } catch (error) {
        console.error('MultipleChoiceGame initialization failed:', error);
        if (mounted) {
          setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };

    initializeEngine();

    return () => {
      mounted = false;
      if (phaserEngineRef.current) {
        console.log('Destroying PhaserEngine...');
        phaserEngineRef.current.destroy();
        phaserEngineRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Status: {status}</h2>
        <p>Game Phase: {gamePhase}</p>
        <p>Current Score: {gameScore}</p>
      </div>
      
      <div 
        ref={gameContainerRef}
        style={{
          border: '2px solid #333',
          borderRadius: '8px',
          backgroundColor: '#f0f0f0',
          minHeight: '600px',
          width: '800px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {!gameContainerRef.current && (
          <p>Loading game container...</p>
        )}
      </div>
    </div>
  );
}
