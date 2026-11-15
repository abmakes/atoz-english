import GamesCatalog from '@/components/games/GamesCatalog'
import { getPublicQuizCatalog } from '@/lib/quiz-catalog'
import type { QuizListItem } from '@/types/gameTypes'

export const revalidate = 60

export default async function GamesPage() {
  let initialQuizzes: QuizListItem[] = []
  try {
    initialQuizzes = await getPublicQuizCatalog('newest')
  } catch (error) {
    console.error('Games page catalog failed:', error)
  }

  return <GamesCatalog initialQuizzes={initialQuizzes} />
}
