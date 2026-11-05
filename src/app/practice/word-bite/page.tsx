import type { Metadata } from 'next'
import WordChompersScreen from '@/components/game_ui/word-chompers/WordChompersScreen'

export const metadata: Metadata = {
  title: 'Word Bite (Beta) — PlaytoZ',
  description:
    'Two to four players share one screen and bite the missing verb form or pronoun. Uses the same grammar as Sentence Builder.',
}

export default function WordBitePage() {
  return <WordChompersScreen mode="bite" />
}
