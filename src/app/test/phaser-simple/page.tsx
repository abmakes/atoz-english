'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Simple test page to verify Phaser foundation without complex scene management.
 * This tests basic Phaser functionality and our core managers.
 */
export default function SimplePhaserTestPage() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Loading...');
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    const testPhaserFoundation = async () => {
      try {
        setStatus('Testing Phaser imports...');
        
        // Test basic Phaser import
        const { Game } = await import('phaser');
        console.log('✅ Phaser imports successful');
        
        if (!mounted) return;
        setStatus('Creating Phaser Game...');

        // Create a simple Phaser game
        const game = new Game({
          type: Phaser.AUTO,
          width: 400,
          height: 300,
          parent: gameContainerRef.current || undefined,
          backgroundColor: '#87CEEB',
          scene: {
            key: 'TestScene',
            create: function() {
              console.log('✅ Phaser scene created successfully');
              
              // Add some basic graphics
              const graphics = this.add.graphics();
              graphics.fillStyle(0x00ff00);
              graphics.fillRect(50, 50, 100, 100);
              
              // Add some text
              this.add.text(200, 150, 'Phaser Works!', {
                fontSize: '24px',
                color: '#000000'
              });
              
              // Add a clickable area
              const clickArea = this.add.rectangle(200, 200, 100, 50, 0xff0000);
              clickArea.setInteractive();
              clickArea.on('pointerdown', () => {
                console.log('✅ Phaser input handling works');
                setScore(prev => prev + 1);
              });
              
              if (mounted) {
                setStatus('✅ Phaser foundation test successful!');
              }
            }
          }
        });

        if (!mounted) return;

        // Test our core managers
        setStatus('Testing core managers...');
        
        // Test EventBus
        const { EventBus } = await import('@/lib/phaser-engine/core/EventBus');
        const eventBus = new EventBus();
        console.log('✅ EventBus created successfully');
        
        // Test StorageManager
        const { StorageManager } = await import('@/lib/phaser-engine/core/StorageManager');
        const storageManager = new StorageManager();
        console.log('✅ StorageManager created successfully');
        
        // Test GameStateManager
        const { GameStateManager } = await import('@/lib/phaser-engine/core/GameStateManager');
        new GameStateManager(eventBus);
        console.log('✅ GameStateManager created successfully');
        
        // Test AudioManager
        const { AudioManager } = await import('@/lib/phaser-engine/core/AudioManager');
        new AudioManager(eventBus, storageManager);
        console.log('✅ AudioManager created successfully');
        
        if (mounted) {
          setStatus('✅ All core managers working!');
        }

        // Cleanup function
        return () => {
          console.log('Cleaning up test...');
          game.destroy(true);
          eventBus.destroy();
          storageManager.clear();
        };

      } catch (error) {
        console.error('❌ Test failed:', error);
        if (mounted) {
          setStatus(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };

    testPhaserFoundation();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Phaser Foundation Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status: {status}</h2>
        <p>Score: {score}</p>
        <p>Click the red rectangle in the game area to test input handling.</p>
      </div>
      
      <div 
        ref={gameContainerRef}
        style={{
          border: '2px solid #333',
          borderRadius: '8px',
          backgroundColor: '#f0f0f0',
          minHeight: '300px',
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
          <li>✅ Phaser.js imports and basic functionality</li>
          <li>✅ Scene creation and rendering</li>
          <li>✅ Graphics and text rendering</li>
          <li>✅ Input handling (click events)</li>
          <li>✅ Our core managers (EventBus, StorageManager, GameStateManager, AudioManager)</li>
          <li>✅ React integration with Phaser</li>
        </ul>
      </div>
    </div>
  );
}
