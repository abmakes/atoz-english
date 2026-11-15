import Link from 'next/link'
import GameModePicker from '@/components/games/GameModePicker'
import { getQuizPickerSummary } from '@/lib/quiz-summary'

export const revalidate = 60

export default async function GameModePickerPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params
  let quiz = null
  try {
    quiz = await getQuizPickerSummary(quizId)
  } catch (error) {
    console.error('Mode picker summary failed:', error)
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[--primary-bg] p-6 text-[--text-color]">
        <p className="grandstander text-xl font-bold">Failed to load quiz</p>
        <Link href="/games" className="underline grandstander">
          Back to games
        </Link>
      </div>
    )
  }

  return <GameModePicker quiz={quiz} />
}
