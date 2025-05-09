'use client';

import React, { useState, useEffect } from 'react';
import { MultipleChoiceReactApp } from '@/lib/pixi-games/multi-react/MultipleChoiceReact';
import { PixiEngine, GameFactory, PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine';
import { GameConfig, DEFAULT_GAME_CONFIG } from '@/lib/pixi-engine/config/GameConfig';
import { QuizListItem } from '@/types/gameTypes';
import LoadingSpinner from '@/components/loading_spinner';
import { BaseGame, BaseGameState } from '@/lib/pixi-engine/game/BaseGame';
import { Container } from 'pixi.js';

// Create a minimal BaseGame implementation that will serve as a placeholder
// since our React component will handle the actual rendering
class DummyGame extends BaseGame<BaseGameState> {
  constructor(config: GameConfig, managers: PixiEngineManagers) {
    super(config, managers);
    // view is readonly and initialized in BaseGame constructor
  }

  protected createInitialState(): BaseGameState {
    return { scores: {} };
  }

  protected async initImplementation(assetsPromise: Promise<unknown>): Promise<void> {
    // Wait for assets to load, but don't do anything else
    await assetsPromise;
    console.log("DummyGame initialized - React component will handle rendering");
  }

  public start(): void {
    // Required implementation - nothing to do here
    console.log("DummyGame started");
  }

  public render(): void {
    // Required implementation - no rendering needed
    // React will handle rendering
  }

  public update(delta: number): void {
    // No update needed, React handles component updates
  }

  protected endImplementation(): void {
    // No special cleanup needed
  }

  protected destroyImplementation(): void {
    // Cleanup if needed
  }
}

// Our GameFactory function that returns the DummyGame
const createDummyGame: GameFactory = (config, managers) => {
  return new DummyGame(config, managers);
};

export default function ReactTestPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [gameStarted, setGameStarted] = useState(false);
  const [pixiEngine, setPixiEngine] = useState<PixiEngine | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  // Fetch available quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch('/api/quizzes');
        const data = await response.json();
        if (data.quizzes && data.quizzes.length > 0) {
          setQuizzes(data.quizzes);
        } else {
          // Fallback to mock data if API returns empty
          console.log("No quizzes found from API, using mock data");
          setQuizzes([
            {
              id: "mock-quiz-1",
              title: "Mock Quiz - General Knowledge",
              description: "A general knowledge quiz with various topics",
              imageUrl: "/images/quiz-default.png",
              questionCount: 5,
              likes: 42,
              level: "beginner"
            },
            {
              id: "mock-quiz-2",
              title: "Mock Quiz - Science Facts",
              description: "Test your science knowledge with this quiz",
              imageUrl: "/images/science-quiz.png",
              questionCount: 5,
              likes: 24,
              level: "intermediate"
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch quizzes:", error);
        // Fallback to mock data on error
        console.log("Error fetching quizzes, using mock data");
        setQuizzes([
          {
            id: "mock-quiz-1",
            title: "Mock Quiz - General Knowledge",
            description: "A general knowledge quiz with various topics",
            imageUrl: "/images/quiz-default.png", 
            questionCount: 5,
            likes: 42,
            level: "beginner"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  // Initialize PixiEngine and config when a quiz is selected
  const handleStartGame = async () => {
    if (!selectedQuizId) return;

    // Create basic game config with minimal settings for testing
    const testConfig: GameConfig = {
      ...DEFAULT_GAME_CONFIG,
      quizId: selectedQuizId,
      gameSlug: 'multiple-choice-react',
      teams: [
        { id: 'player1', name: 'Player 1', color: '#3498db' }
      ],
      intensityTimeLimit: 30, // 30 seconds per question
      questionHandling: {
        randomizeOrder: true,
        distributionMode: 'sharedPool',
        truncateForFairness: false
      },
      gameMode: {
        type: 'score',
        name: 'Score Mode'
      },
      theme: 'dark'
    };

    try {
      // Initialize PixiEngine
      const engine = new PixiEngine();
      
      // Initialize the engine with the config and our dummy game factory
      await engine.init(testConfig, createDummyGame);

      setPixiEngine(engine);
      setGameConfig(testConfig);
      setGameStarted(true);
    } catch (error) {
      console.error("Error initializing engine:", error);
    }
  };

  const handleGameOver = (scores: Record<string | number, number>, winner: string | number) => {
    console.log("Game Over!", { scores, winner });
    // Reset to quiz selection
    setGameStarted(false);
    setPixiEngine(null);
    setGameConfig(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (gameStarted && pixiEngine && gameConfig) {
    return (
      <div className="w-screen h-screen">
        <MultipleChoiceReactApp 
          config={gameConfig}
          pixiEngine={pixiEngine}
          onGameOver={handleGameOver}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">React Multiple Choice Test</h1>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Select a Quiz:
          </label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
          >
            <option value="">-- Select a Quiz --</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
        </div>
        
        <button
          className={`w-full py-2 px-4 rounded-md font-semibold ${
            selectedQuizId 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleStartGame}
          disabled={!selectedQuizId}
        >
          Start Test Game
        </button>
      </div>
    </div>
  );
} 