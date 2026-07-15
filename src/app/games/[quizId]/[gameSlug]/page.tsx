'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import GameContainer from '@/components/game_ui/GameContainer';

export default function GamePage() {
  const params = useParams();
  const quizId = params.quizId as string | undefined;
  const gameSlug = params.gameSlug as string | undefined;

  if (!quizId || !gameSlug) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[--primary-bg] p-6">
        <p className="grandstander text-xl font-bold text-[--text-color]">Invalid game link</p>
        <Link href="/games" className="underline grandstander">
          Back to games
        </Link>
      </div>
    );
  }

  return <GameContainer quizId={quizId} gameSlug={gameSlug} />;
}
