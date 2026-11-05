import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Practice — PlaytoZ',
  description:
    'English practice games with no class quiz. Build picture sentences alone, or play Word Bite and Sentence Swim with two to four players on one screen.',
}

const PRACTICE_GAMES = [
  {
    slug: 'sentence-builder',
    title: 'Sentence Builder',
    kicker: 'One player',
    blurb:
      'Pick one grammar structure, then build the sentence one word at a time. Score Run is 20 questions of that structure only. Survival stays on it until a mistake.',
    image: '/images/sentence-builder/maya-apple.jpg',
    imageAlt: 'A girl holding a red apple',
  },
  {
    slug: 'word-bite',
    title: 'Word Bite',
    beta: true,
    kicker: '2 to 4 players',
    blurb:
      'A sentence has one blank. Bite the verb form or the pronoun that fits. Sit around one screen — the far side reads upside down.',
    art: 'bite' as const,
  },
  {
    slug: 'sentence-swim',
    title: 'Sentence Swim',
    beta: true,
    kicker: '2 to 4 players',
    blurb:
      'Swim with a joystick and eat words in order. She eats an apple counts. They eats an apple does not. Most sentences in a minute wins.',
    art: 'swim' as const,
  },
]

export default function PracticePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="grandstander text-4xl font-bold text-[#114257]">Practice</h1>
      <p className="mt-2 max-w-2xl text-slate-600 inclusive-sans">
        Play alone, or gather around one screen. These games use the same grammar sentences, and they do not need a class quiz.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {PRACTICE_GAMES.map((game) => (
          <Link
            key={game.slug}
            href={`/practice/${game.slug}`}
            className="neo-card flex h-full flex-col overflow-hidden bg-white"
          >
            {'image' in game && game.image ? (
              <div className="relative h-40 w-full">
                <Image
                  src={game.image}
                  alt={game.imageAlt ?? ''}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
            ) : (
              <GameArt kind={game.art ?? 'bite'} />
            )}
            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#168CB9] grandstander">{game.kicker}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black grandstander">{game.title}</h2>
                {'beta' in game && game.beta ? (
                  <span className="shrink-0 rounded-full border-2 border-[#1E5167] bg-amber-200 px-2 py-0.5 text-[10px] font-black tracking-wide text-[#114257]">
                    BETA
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[--text-light] inclusive-sans">{game.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function GameArt({ kind }: { kind: 'bite' | 'swim' }) {
  const water = kind === 'swim'
  return (
    <div className={`relative h-40 overflow-hidden ${water ? 'bg-[#d7f0fb]' : 'bg-[#e7f5ff]'}`} aria-hidden="true">
      <svg viewBox="0 0 360 160" className="h-full w-full">
        {water ? (
          <>
            <circle cx="40" cy="36" r="10" fill="white" opacity="0.7" />
            <circle cx="300" cy="48" r="14" fill="white" opacity="0.55" />
            <circle cx="180" cy="28" r="7" fill="white" opacity="0.8" />
          </>
        ) : (
          <ellipse cx="180" cy="84" rx="120" ry="52" fill="#c5e4f7" />
        )}
        <ChomperSvg cx={78} cy={96} color="#ff6b6b" />
        <ChomperSvg cx={168} cy={78} color="#14919b" flip />
        <ChomperSvg cx={268} cy={96} color="#e09b12" />
        {water ? (
          <>
            <BubbleSvg x={124} y={108} word="eats" />
            <BubbleSvg x={214} y={52} word="She" />
          </>
        ) : (
          <>
            <WordSvg x={132} y={46} word="eats" />
            <WordSvg x={196} y={118} word="eat" />
          </>
        )}
      </svg>
    </div>
  )
}

function ChomperSvg({ cx, cy, color, flip = false }: { cx: number; cy: number; color: string; flip?: boolean }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${flip ? -1 : 1} 1)`}>
      <ellipse cx="0" cy="22" rx="16" ry="5" fill="#114257" opacity="0.12" />
      <polygon points="-14,-4 -32,-14 -24,0 -32,14 -14,4" fill="#114257" opacity="0.25" />
      <circle cx="-2" cy="-22" r="8" fill={color} />
      <circle cx="10" cy="-23" r="8" fill={color} />
      <circle cx="0" cy="0" r="22" fill={color} stroke="#114257" strokeWidth="2.5" />
      <ellipse cx="6" cy="7" rx="10" ry="8" fill="white" opacity="0.45" />
      <circle cx="8" cy="-4" r="5" fill="white" stroke="#114257" strokeWidth="1.5" />
      <circle cx="18" cy="-2" r="5" fill="white" stroke="#114257" strokeWidth="1.5" />
      <circle cx="10" cy="-3" r="2" fill="#114257" />
      <circle cx="20" cy="-1" r="2" fill="#114257" />
      <ellipse cx="22" cy="8" rx="7" ry="5" fill="#3a2418" />
    </g>
  )
}

function WordSvg({ x, y, word }: { x: number; y: number; word: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="3" y="3" width="72" height="32" rx="16" fill="#114257" />
      <rect width="72" height="32" rx="16" fill="white" stroke="#114257" strokeWidth="2.5" />
      <text x="36" y="21" textAnchor="middle" fontFamily="Grandstander, sans-serif" fontSize="14" fontWeight="700" fill="#114257">
        {word}
      </text>
    </g>
  )
}

function BubbleSvg({ x, y, word }: { x: number; y: number; word: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="4" cy="6" r="28" fill="#7eb6d4" opacity="0.25" />
      <circle cx="0" cy="0" r="28" fill="white" fillOpacity="0.94" stroke="#8ec4e4" strokeWidth="2.5" />
      <circle cx="-10" cy="-10" r="5" fill="white" />
      <text x="0" y="5" textAnchor="middle" fontFamily="Grandstander, sans-serif" fontSize="13" fontWeight="700" fill="#114257">
        {word}
      </text>
    </g>
  )
}
