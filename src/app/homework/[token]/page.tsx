import type { Metadata } from 'next'
import HomeworkPlay from '@/components/game_ui/homework-quiz/HomeworkPlay'

export const metadata: Metadata = {
  title: 'Homework — PlaytoZ',
  description: 'Answer a class quiz at your own pace, then try the challenge.',
}

export default async function HomeworkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <HomeworkPlay token={token} />
}
