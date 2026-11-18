'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Bookmark, Heart, Mountain, Play, Swords, Users, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { QuizPickerSummary } from '@/lib/quiz-playability'

const modeCardBase =
  'relative flex min-h-[11.5rem] items-stretch overflow-hidden rounded-[24px] sm:min-h-[12.75rem]'

const modeCardClass = `${modeCardBase} border-2 border-[#1E5167] bg-white shadow-[4px_4px_0px_0px_#1E5167] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1E5167]`

const modeCardMutedClass = `${modeCardBase} border-2 border-slate-300 bg-slate-50 opacity-80`

const pageBackground = {
  backgroundColor: '#ffffff',
  backgroundImage: [
    'radial-gradient(ellipse 72% 58% at -4% -8%, rgba(186, 230, 253, 0.95) 0%, rgba(186, 230, 253, 0) 68%)',
    'radial-gradient(ellipse 58% 48% at 108% -6%, rgba(221, 204, 255, 0.9) 0%, rgba(221, 204, 255, 0) 64%)',
    'radial-gradient(ellipse 46% 42% at 92% 108%, rgba(191, 219, 254, 0.72) 0%, rgba(191, 219, 254, 0) 70%)',
    'radial-gradient(ellipse 38% 36% at 4% 96%, rgba(237, 224, 255, 0.78) 0%, rgba(237, 224, 255, 0) 72%)',
  ].join(', '),
} as const

function ModeThumb({
  src,
  alt,
  muted = false,
}: {
  src: string
  alt: string
  muted?: boolean
}) {
  return (
    <div
      className={`relative h-auto min-h-full w-1/2 shrink-0 self-stretch overflow-hidden border-r-2 border-[#1E5167] ${
        muted ? 'grayscale opacity-70' : ''
      }`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
        className="object-cover object-center"
      />
    </div>
  )
}

function ModeDetails({
  icon,
  title,
  description,
  cta,
  muted = false,
  beta = false,
}: {
  icon: ReactNode
  title: string
  description: string
  cta: string
  muted?: boolean
  beta?: boolean
}) {
  return (
    <div
      className={`flex h-full min-w-0 w-1/2 flex-col px-3 py-3 text-left sm:px-4 sm:py-4 ${
          muted ? 'text-slate-500' : ''
        }`}
    >
      <div
        className={`mb-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 sm:mb-2 sm:h-10 sm:w-10 ${
          muted
            ? 'border-slate-300 bg-white text-slate-400'
            : 'border-[#1E5167] bg-[--primary-light]'
        }`}
      >
        {icon}
      </div>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2
          className={`text-lg font-bold leading-none grandstander sm:text-xl lg:whitespace-nowrap ${
            muted ? 'text-slate-500' : ''
          }`}
        >
          {title}
        </h2>
        {beta ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide ${
              muted
                ? 'border border-slate-300 bg-slate-100 text-slate-500'
                : 'border-2 border-[#1E5167] bg-amber-200 text-[#114257]'
            }`}
          >
            BETA
          </span>
        ) : null}
      </div>
      <p
        className={`inclusive-sans text-sm leading-relaxed ${
          muted ? 'text-slate-500' : 'text-slate-600'
        }`}
      >
        {description}
      </p>
      <span
        className={`mt-auto pt-2 font-semibold grandstander text-sm sm:text-base ${
          muted ? 'text-slate-400' : 'text-[--text-color]'
        }`}
      >
        {cta}
      </span>
    </div>
  )
}

function OpeningOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] bg-white/60">
      <span className="grandstander font-bold text-lg">Opening…</span>
    </div>
  )
}

export default function GameModePicker({ quiz }: { quiz: QuizPickerSummary }) {
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null)
  const description = quiz.description.trim() || null
  const { splashDash, ninjaClimb, tugOfWar } = quiz.playability

  return (
    <div
      className="min-h-screen text-[--text-color] py-6 sm:py-10"
      style={pageBackground}
    >
      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <Link
          href="/games"
          className="mb-6 inline-flex items-center gap-2 grandstander font-semibold hover:underline"
        >
          <ArrowLeft size={20} /> Back to catalog
        </Link>

        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
            <div className="relative h-[77px] w-[77px] shrink-0 overflow-hidden rounded-2xl border-2 border-[#1E5167] bg-white shadow-[3px_3px_0px_0px_#1E5167] sm:h-[134px] sm:w-[134px]">
              <Image
                src={quiz.imageUrl}
                alt={`${quiz.title} cover`}
                fill
                sizes="(max-width: 640px) 77px, 134px"
                className="object-cover object-center"
                priority
              />
            </div>
            <div className="min-w-0 flex-1 sm:pt-0.5">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-black grandstander leading-tight break-words">
                {quiz.title}
              </h1>
              {description ? (
                <p className="inclusive-sans text-[--text-light] mt-1.5 text-sm md:text-base leading-relaxed">
                  {description}
                </p>
              ) : null}
              <div
                className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 grandstander text-[--text-color]"
                aria-label="Quiz statistics"
              >
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 stroke-red-500 fill-transparent shrink-0" aria-hidden />
                  <span className="text-sm sm:text-base font-semibold">
                    {quiz.statistics.likes} likes
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bookmark
                    className="h-4 w-4 sm:h-5 sm:w-5 stroke-[#114257] fill-transparent shrink-0"
                    aria-hidden
                  />
                  <span className="text-sm sm:text-base font-semibold">
                    {quiz.statistics.favoritesCount} saved
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Play
                    className="h-4 w-4 sm:h-5 sm:w-5 stroke-[--primary-accent] fill-[--primary-accent] shrink-0"
                    aria-hidden
                  />
                  <span className="text-sm sm:text-base font-semibold">
                    {quiz.statistics.playsCount} plays
                  </span>
                </div>
              </div>
              {quiz.tags.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {quiz.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs pt-1 bg-white text-[--text-color] border-[--primary-accent] shadow-[3px_3px_0px_0px_var(--primary-accent-hover)]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <h2 className="mb-5 text-center text-2xl md:text-3xl font-bold grandstander">
          Select game mode
        </h2>

        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2">
          <Link
            href={`/games/${quiz.id}/multiple-choice`}
            onClick={() => setNavigatingSlug('multiple-choice')}
            className={`${modeCardClass} ${
              navigatingSlug === 'multiple-choice' ? 'opacity-70 pointer-events-none' : ''
            }`}
          >
            {navigatingSlug === 'multiple-choice' ? <OpeningOverlay /> : null}
            <ModeThumb
              src="/images/marketing/teamquiz_thumb.png"
              alt="Team Quiz gameplay with timer, teams, and answer choices"
            />
            <ModeDetails
              icon={<Users size={20} />}
              title="Team Quiz"
              description="Turn-based classroom play with timers, teams, and power-ups."
              cta="Play →"
            />
          </Link>

          {splashDash.eligible ? (
            <Link
              href={`/games/${quiz.id}/splash-dash`}
              onClick={() => setNavigatingSlug('splash-dash')}
              className={`${modeCardClass} ${
                navigatingSlug === 'splash-dash' ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {navigatingSlug === 'splash-dash' ? <OpeningOverlay /> : null}
              <ModeThumb
                src="/images/marketing/splashdash_thumb.png"
                alt="Splash Dash race with capybara swimming to answer crates"
              />
              <ModeDetails
                icon={<Zap size={20} />}
                title="Splash Dash"
                description="Two-player race — swim to the right crate first."
                cta="Play →"
              />
            </Link>
          ) : (
            <div className={modeCardMutedClass} aria-disabled="true">
              <ModeThumb
                src="/images/marketing/splashdash_thumb.png"
                alt="Splash Dash preview"
                muted
              />
              <ModeDetails
                icon={<Zap size={20} className="text-slate-400" />}
                title="Splash Dash"
                description={splashDash.reason ?? 'Not available for this quiz.'}
                cta="Unavailable"
                muted
              />
            </div>
          )}

          {ninjaClimb.eligible ? (
            <Link
              href={`/games/${quiz.id}/ninja-climb`}
              onClick={() => setNavigatingSlug('ninja-climb')}
              className={`${modeCardClass} ${
                navigatingSlug === 'ninja-climb' ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {navigatingSlug === 'ninja-climb' ? <OpeningOverlay /> : null}
              <ModeThumb
                src="/images/marketing/ninjaclimb_thumb.png"
                alt="Ninja Climb mountain race with two ninjas racing uphill"
              />
              <ModeDetails
                icon={<Mountain size={20} />}
                title="Ninja Climb"
                description="Two-team mountain race — answer to climb, use ninja powers."
                cta="Play →"
                beta
              />
            </Link>
          ) : (
            <div className={modeCardMutedClass} aria-disabled="true">
              <ModeThumb
                src="/images/marketing/ninjaclimb_thumb.png"
                alt="Ninja Climb preview"
                muted
              />
              <ModeDetails
                icon={<Mountain size={20} className="text-slate-400" />}
                title="Ninja Climb"
                description={ninjaClimb.reason ?? 'Not available for this quiz.'}
                cta="Unavailable"
                muted
                beta
              />
            </div>
          )}

          {tugOfWar.eligible ? (
            <Link
              href={`/games/${quiz.id}/tug-of-war-3d`}
              onClick={() => setNavigatingSlug('tug-of-war-3d')}
              className={`${modeCardClass} ${
                navigatingSlug === 'tug-of-war-3d' ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {navigatingSlug === 'tug-of-war-3d' ? <OpeningOverlay /> : null}
              <ModeThumb
                src="/images/marketing/tugofwar_thumb.png"
                alt="Tug of War with blue and red ninjas pulling a rope"
              />
              <ModeDetails
                icon={<Swords size={20} />}
                title="Tug of War"
                description="Two teams take turns answering — first to 3 round points wins."
                cta="Play →"
                beta
              />
            </Link>
          ) : (
            <div className={modeCardMutedClass} aria-disabled="true">
              <ModeThumb
                src="/images/marketing/tugofwar_thumb.png"
                alt="Tug of War preview"
                muted
              />
              <ModeDetails
                icon={<Swords size={20} className="text-slate-400" />}
                title="Tug of War"
                description={tugOfWar.reason ?? 'Not available for this quiz.'}
                cta="Unavailable"
                muted
                beta
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
