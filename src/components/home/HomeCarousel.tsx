'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

/** Same frame as the Score Attack poster: 1024 × 683. */
const SLIDES = [
  {
    src: '/images/marketing/score-attack-play.png',
    alt: 'Score Attack classroom game with two teams, a timer, and answer choices',
  },
  {
    src: '/images/marketing/splash-dash-race.png',
    alt: 'Splash Dash capybaras racing across the water toward answer crates',
  },
  {
    src: '/images/marketing/ninjaclimb_thumb.png',
    alt: 'Ninja Climb with two ninjas racing up a mountain',
  },
  {
    src: '/images/marketing/quiz2.png',
    alt: 'A classroom quiz question with a picture and four answers',
  },
] as const

export default function HomeCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

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
      setIndex((current) => (current + 1) % SLIDES.length)
    }, 4500)
    return () => window.clearTimeout(timer)
  }, [index, paused, reducedMotion])

  return (
    <div
      className="relative aspect-[1024/683] w-full overflow-hidden rounded-[18px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {SLIDES.map((slide, slideIndex) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slideIndex === index ? slide.alt : ''}
          fill
          priority={slideIndex === 0}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={`object-cover ${
            reducedMotion ? '' : 'transition-opacity duration-700'
          } ${slideIndex === index ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={slideIndex === index ? undefined : true}
        />
      ))}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            aria-label={slide.alt}
            aria-current={slideIndex === index ? 'true' : undefined}
            onClick={() => setIndex(slideIndex)}
            className={`h-2 rounded-full ${
              slideIndex === index ? 'w-5 bg-white' : 'w-2 bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
