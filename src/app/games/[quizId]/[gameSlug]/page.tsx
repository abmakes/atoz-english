import Link from 'next/link'
import GameContainer from '@/components/game_ui/GameContainer'
import { gameModeRegistry } from '@/lib/game-engine/modes/builtinGameModes'
import { getQuizPickerSummary } from '@/lib/quiz-summary'

export const revalidate = 60

export default async function GamePage({
  params,
}: {
  params: Promise<{ quizId: string; gameSlug: string }>
}) {
  const { quizId, gameSlug } = await params

  if (!quizId || !gameSlug || !gameModeRegistry.get(gameSlug)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[--primary-bg] p-6">
        <p className="grandstander text-xl font-bold text-[--text-color]">Invalid game link</p>
        <Link href="/games" className="underline grandstander">
          Back to games
        </Link>
      </div>
    )
  }

  let quizSummary = null
  try {
    quizSummary = await getQuizPickerSummary(quizId)
  } catch (error) {
    console.error('Setup quiz summary failed:', error)
  }

  return <GameContainer quizId={quizId} gameSlug={gameSlug} quizSummary={quizSummary} />
}
