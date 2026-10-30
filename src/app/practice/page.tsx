import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Practice — PlaytoZ',
  description:
    'Single-player English practice games. Build sentences, pick a grammar focus, and play on your own.',
}

const PRACTICE_GAMES = [
  {
    slug: 'sentence-builder',
    title: 'Sentence Builder',
    blurb:
      'Pick one grammar structure, then build the sentence one word at a time. Score Run is 20 questions of that structure only. Survival stays on it until a mistake.',
    image: '/images/sentence-builder/maya-apple.jpg',
    imageAlt: 'A girl holding a red apple',
  },
] as const

export default function PracticePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="grandstander text-4xl font-bold text-[#114257]">Practice</h1>
      <p className="mt-2 text-slate-600 inclusive-sans">
        Single-player games you can play on your own — no class quiz required.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {PRACTICE_GAMES.map((game) => (
          <Link
            key={game.slug}
            href={`/practice/${game.slug}`}
            className="neo-card flex h-full flex-col overflow-hidden bg-white"
          >
            <div className="relative h-40 w-full">
              <Image
                src={game.image}
                alt={game.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#168CB9] grandstander">
                Practice game
              </p>
              <h2 className="mt-1 text-2xl font-black grandstander">{game.title}</h2>
              <p className="mt-2 text-sm text-[--text-light] inclusive-sans">{game.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
