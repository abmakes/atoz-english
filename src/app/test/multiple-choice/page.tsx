'use client';

import dynamic from 'next/dynamic';

// Create a client-only component to avoid SSR issues
const MultipleChoiceGameTest = dynamic(() => import('./MultipleChoiceGameTest'), { 
  ssr: false,
  loading: () => <div>Loading Multiple Choice Game Test...</div>
});

/**
 * Test page to verify the MultipleChoiceGame integration with PhaserEngine.
 */
export default function MultipleChoiceTestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Multiple Choice Game Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>This test page loads the MultipleChoiceGame with PhaserEngine.</p>
      </div>
      
      <MultipleChoiceGameTest />
      
      <div style={{ marginTop: '20px' }}>
        <h3>What this test verifies:</h3>
        <ul>
          <li>✅ MultipleChoiceGame extends BaseGame correctly</li>
          <li>✅ PhaserEngine integration with MultipleChoiceGame</li>
          <li>✅ Game managers (DataManager, UIManager, BackgroundManager, LayoutManager)</li>
          <li>✅ Event handling between engine and game</li>
          <li>✅ Basic UI rendering and interaction</li>
          <li>✅ Question loading and display</li>
        </ul>
      </div>
    </div>
  );
}
