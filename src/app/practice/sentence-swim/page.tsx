import type { Metadata } from 'next'
import WordChompersScreen from '@/components/game_ui/word-chompers/WordChompersScreen'

export const metadata: Metadata = {
  title: 'Sentence Swim (Beta) — PlaytoZ',
  description:
    'Two to four players share one screen, swim with joysticks, and eat words in order to build grammar sentences.',
}

export default function SentenceSwimPage() {
  return <WordChompersScreen mode="swim" />
}
