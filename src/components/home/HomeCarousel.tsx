'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'

const SLIDES = [
  {
    id: 'ai',
    title: 'Create with AI',
    href: '/create',
    kind: 'photo',
    image: '/images/marketing/quiz2.png',
    alt: 'A classroom quiz asking if there is a sushi roll',
  },
  {
    id: 'ninja',
    title: 'Ninja Climb',
    href: '/games',
    kind: 'photo',
    image: '/images/marketing/ninjaclimb_thumb.png',
    alt: 'Two ninjas racing up a mountain',
  },
  {
    id: 'splash',
    title: 'Splash Dash',
    href: '/games',
    kind: 'photo',
    image: '/images/marketing/splash-dash-race.png',
    alt: 'Capybaras swimming a race to the right answer',
  },
  {
    id: 'swim',
    title: 'Sentence Swim',
    href: '/practice/sentence-swim',
    kind: 'swim',
    alt: 'Players swimming through words to build a sentence',
  },
  {
    id: 'bite',
    title: 'Word Bite',
    href: '/practice/word-bite',
    kind: 'bite',
    alt: 'Players racing to bite the word that fits the sentence',
  },
  {
    id: 'grammar',
    title: 'Grammar',
    href: '/practice/sentence-builder',
    kind: 'grammar',
    image: '/images/sentence-builder/maya-apple.jpg',
    alt: 'A girl holding an apple for a grammar sentence',
    words: ['She', 'eats', 'an apple.'],
  },
  {
    id: 'faces',
    title: 'Funny Faces',
    href: '/tools/thoughts',
    kind: 'faces',
    image: '/images/marketing/funny-faces.webp',
    alt: 'Potato, toast, moon, and robot faces for speaking practice',
  },
  {
    id: 'video',
    title: 'Story videos',
    href: '/tools/story-creator',
    kind: 'story',
    alt: 'Four story pictures ready to play as a video',
    images: [
      '/images/sentence-builder/kids-soccer.jpg',
      '/images/sentence-builder/lina-swim.jpg',
      '/images/sentence-builder/family-breakfast.jpg',
      '/images/sentence-builder/leo-bike.jpg',
    ],
  },
] as const

export default function HomeCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const count = SLIDES.length
  const slide = SLIDES[index]

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (paused || reducedMotion) return
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % count)
    }, 4200)
    return () => window.clearTimeout(timer)
  }, [count, index, paused, reducedMotion])

  const go = (next: number) => {
    setIndex((next + count) % count)
  }

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border-[3px] border-[#114257] bg-white shadow-[6px_6px_0_#114257]"
      aria-roledescription="carousel"
      aria-label="Ways to learn and create"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          go(index + 1)
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          go(index - 1)
        }
      }}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className={`flex h-full ${reducedMotion ? '' : 'transition-transform duration-500 ease-out'}`}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((item, itemIndex) => (
            <Link
              key={item.id}
              href={item.href}
              tabIndex={itemIndex === index ? 0 : -1}
              aria-hidden={itemIndex === index ? undefined : true}
              className="relative block h-full w-full shrink-0"
            >
              <SlideArt slide={item} />
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index - 1)}
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#114257] bg-white/90 text-[#114257] shadow-[2px_2px_0_#114257]"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#114257] bg-white/90 text-[#114257] shadow-[2px_2px_0_#114257]"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t-[3px] border-[#114257] px-4 py-2.5">
        <p className="truncate text-lg font-black text-[#114257] grandstander sm:text-xl">
          {slide.title}
        </p>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
          {SLIDES.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={itemIndex === index}
              aria-label={item.title}
              onClick={() => go(itemIndex)}
              className={`h-2.5 rounded-full transition-all ${
                itemIndex === index ? 'w-6 bg-[#168CB9]' : 'w-2.5 bg-sky-200'
              }`}
            />
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {slide.title}
      </p>
    </section>
  )
}

function SlideArt({ slide }: { slide: (typeof SLIDES)[number] }) {
  if (slide.kind === 'swim') {
    return <SwimArt label={slide.alt} />
  }

  if (slide.kind === 'bite') {
    return <BiteArt label={slide.alt} />
  }

  if (slide.kind === 'faces') {
    return (
      <div className="relative h-full bg-gradient-to-br from-sky-100 via-white to-amber-50">
        <Image
          src={slide.image}
          alt={slide.alt}
          fill
          className="object-contain p-4 sm:p-8"
          sizes="(max-width: 1024px) 100vw, 60vw"
        />
      </div>
    )
  }

  if (slide.kind === 'story') {
    return (
      <div className="relative grid h-full grid-cols-2 grid-rows-2 gap-1 bg-[#114257] p-1">
        {slide.images.map((src) => (
          <div key={src} className="relative min-h-0">
            <Image src={src} alt="" fill className="object-cover" sizes="30vw" />
          </div>
        ))}
        <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-[#114257] bg-white shadow-[4px_4px_0_#114257]">
          <Play className="ml-1 h-7 w-7 fill-[#114257] text-[#114257]" aria-hidden="true" />
        </span>
        <span className="sr-only">{slide.alt}</span>
      </div>
    )
  }

  if (slide.kind === 'grammar') {
    return (
      <div className="relative h-full">
        <Image
          src={slide.image}
          alt={slide.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 60vw"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 bg-gradient-to-t from-white/95 via-white/80 to-transparent px-4 pb-4 pt-12">
          {slide.words.map((word) => (
            <span
              key={word}
              className="rounded-full border-2 border-[#114257] bg-white px-3 py-1 text-base font-black text-[#114257] shadow-[2px_2px_0_#114257] grandstander"
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Image
      src={slide.image}
      alt={slide.alt}
      fill
      priority={slide.id === 'ai'}
      className="object-cover"
      sizes="(max-width: 1024px) 100vw, 60vw"
    />
  )
}

function SwimArt({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 800 980" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-label={label}>
      <rect width="800" height="980" fill="#d7f3ff" />
      <ellipse cx="140" cy="120" rx="50" ry="22" fill="white" opacity="0.9" />
      <ellipse cx="180" cy="112" rx="36" ry="16" fill="white" opacity="0.7" />
      <ellipse cx="640" cy="150" rx="58" ry="24" fill="white" opacity="0.85" />
      <path d="M0 430 C 140 390 220 470 360 430 C 500 390 560 360 800 410 L 800 980 L 0 980 Z" fill="#7ec8ea" />
      <path d="M0 520 C 160 490 240 570 400 530 C 560 490 640 540 800 510 L 800 980 L 0 980 Z" fill="#49b4e0" />
      <path d="M0 680 C 180 640 300 730 480 680 C 640 640 700 700 800 670 L 800 980 L 0 980 Z" fill="#168CB9" />
      <Chomper cx={190} cy={560} color="#ff6b6b" />
      <Chomper cx={400} cy={500} color="#14919b" flip />
      <Chomper cx={610} cy={580} color="#e09b12" />
      <Bubble x={120} y={300} word="She" />
      <Bubble x={330} y={240} word="eats" />
      <Bubble x={540} y={320} word="apple" />
    </svg>
  )
}

function BiteArt({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 800 980" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-label={label}>
      <rect width="800" height="980" fill="#e7f6ff" />
      <ellipse cx="400" cy="560" rx="320" ry="180" fill="#c5e4f7" />
      <ellipse cx="150" cy="140" rx="46" ry="20" fill="white" />
      <ellipse cx="640" cy="180" rx="58" ry="22" fill="white" opacity="0.85" />
      <Chomper cx={190} cy={560} color="#ff6b6b" />
      <Chomper cx={400} cy={500} color="#14919b" flip />
      <Chomper cx={610} cy={560} color="#e09b12" />
      <WordCard x={230} y={250} word="eats" />
      <WordCard x={470} y={700} word="eat" />
    </svg>
  )
}

function WordCard({ x, y, word }: { x: number; y: number; word: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="6" y="6" width="120" height="52" rx="26" fill="#114257" />
      <rect width="120" height="52" rx="26" fill="white" stroke="#114257" strokeWidth="4" />
      <text
        x="60"
        y="34"
        textAnchor="middle"
        fontFamily="Grandstander, sans-serif"
        fontSize="26"
        fontWeight="700"
        fill="#114257"
      >
        {word}
      </text>
    </g>
  )
}

function Chomper({
  cx,
  cy,
  color,
  flip = false,
}: {
  cx: number
  cy: number
  color: string
  flip?: boolean
}) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${flip ? -1 : 1} 1)`}>
      <ellipse cx="8" cy="48" rx="36" ry="10" fill="#114257" opacity="0.12" />
      <polygon points="-28,-6 -70,-28 -52,2 -70,30 -28,8" fill="#114257" opacity="0.22" />
      <circle cx="-4" cy="-46" r="16" fill={color} />
      <circle cx="20" cy="-48" r="16" fill={color} />
      <circle cx="0" cy="0" r="46" fill={color} stroke="#114257" strokeWidth="4" />
      <ellipse cx="12" cy="14" rx="20" ry="14" fill="white" opacity="0.4" />
      <circle cx="16" cy="-8" r="10" fill="white" stroke="#114257" strokeWidth="3" />
      <circle cx="36" cy="-4" r="10" fill="white" stroke="#114257" strokeWidth="3" />
      <circle cx="20" cy="-6" r="4" fill="#114257" />
      <circle cx="40" cy="-2" r="4" fill="#114257" />
      <ellipse cx="44" cy="16" rx="14" ry="10" fill="#3a2418" />
    </g>
  )
}

function Bubble({ x, y, word }: { x: number; y: number; word: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="8" cy="10" rx="62" ry="36" fill="#114257" opacity="0.08" />
      <rect x="0" y="0" width="120" height="58" rx="29" fill="white" stroke="#114257" strokeWidth="4" />
      <text
        x="60"
        y="37"
        textAnchor="middle"
        fontFamily="Grandstander, sans-serif"
        fontSize="26"
        fontWeight="700"
        fill="#114257"
      >
        {word}
      </text>
    </g>
  )
}
