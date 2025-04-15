'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import GameContainer from '@/components/game_ui/GameContainer';

// Will import actual game components later
// import { PixiGameWrapper } from '@/components/PixiGameWrapper';
// import multipleChoiceGame from '@/pixi-games/multiple-choice';


export default function GamePage() {
  const params = useParams();
  const [isValidParams, setIsValidParams] = useState(false);

  const quizId = params.quizId as string | undefined;
  const gameSlug = params.gameSlug as string | undefined;

  useEffect(() => {
    if (quizId && gameSlug) {
      setIsValidParams(true);
    } else {
      setIsValidParams(false);
      console.error("Invalid route params: ", params);
    }
  }, [quizId, gameSlug, params]);

  if (!isValidParams) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading or Invalid Link...</h1>
        </div>
      </div>
    );
  }

  return <GameContainer quizId={quizId!} gameSlug={gameSlug!} />;
} 