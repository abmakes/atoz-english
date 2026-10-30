import type { Metadata } from 'next'
import SentenceBuilderScreen from '@/components/game_ui/sentence-builder/SentenceBuilderScreen'

export const metadata: Metadata = {
  title: 'Sentence Builder — PlaytoZ',
  description:
    'Build English sentences one word at a time from a picture. Practice present simple, present continuous, WH questions, be, has/have, and past simple.',
}

export default function SentenceBuilderPage() {
  return <SentenceBuilderScreen />
}
