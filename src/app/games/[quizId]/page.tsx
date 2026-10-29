'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Bookmark, Box, Heart, Mountain, Play, Swords, Users, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  getNinjaClimbBlockReason,
  getQuizRoom3dBlockReason,
  getSplashDashBlockReason,
  getTugOfWar3dBlockReason,
  isNinjaClimbEligible,
  isQuizRoom3dEligible,
  isSplashDashEligible,
  isTugOfWar3dEligible,
} from '@/lib/game-mode-eligibility'
import {
  extractQuestionImageUrls,
  warmQuizQuestionMedia,
  warmSplashDashSceneAssets,
  getNinjaClimbSceneAssetUrls,
  ensurePixiAssetsInitialized,
} from '@/lib/game-asset-warmup'
import { normalizeQuizStatistics, type QuizStatistics } from '@/lib/schemas'
import type { Quiz } from '@/types'

type QuizApiPayload = Pick<
  Quiz,
  'id' | 'title' | 'description' | 'imageUrl' | 'quizType' | 'questions' | 'tags'
> & {
  statistics?: QuizStatistics | Record<string, unknown> | null
}

/** Landscape mode card (~3:2); left half is portrait art filling full height. */
const modeCardClass =
  'relative flex aspect-[3/2] overflow-hidden rounded-[24px] border-2 border-[#1E5167] bg-white shadow-[4px_4px_0px_0px_#1E5167] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1E5167]'

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
      className={`relative h-full w-1/2 shrink-0 overflow-hidden border-r-2 border-[#1E5167] ${
        muted ? 'grayscale opacity-70' : ''
      }`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, 25vw"
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
      className={`flex h-full w-1/2 flex-col p-4 sm:p-5 ${
        muted ? 'text-slate-500' : ''
      }`}
    >
      <div
        className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
          muted
            ? 'border-slate-300 bg-white text-slate-400'
            : 'border-[#1E5167] bg-[--primary-light]'
        }`}
      >
        {icon}
      </div>
      <h2
        className={`mb-1.5 flex flex-wrap items-center gap-2 text-xl sm:text-2xl font-bold grandstander leading-tight ${
          muted ? 'text-slate-500' : ''
        }`}
      >
        {title}
        {beta ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide ${
              muted
                ? 'border border-slate-300 bg-slate-100 text-slate-500'
                : 'border-2 border-[#1E5167] bg-amber-200 text-[#114257]'
            }`}
          >
            BETA
          </span>
        ) : null}
      </h2>
      <p
        className={`inclusive-sans text-xs sm:text-sm flex-grow leading-snug ${
          muted ? 'text-slate-500' : 'text-slate-600'
        }`}
      >
        {description}
      </p>
      <span
        className={`mt-2 font-semibold grandstander text-sm sm:text-base ${
          muted ? 'text-slate-400' : 'text-[--text-color]'
        }`}
      >
        {cta}
      </span>
    </div>
  )
}

export default function GameModePickerPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.quizId as string

  const [quiz, setQuiz] = useState<QuizApiPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!quizId) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/quizzes/${quizId}`)
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load quiz')
        }
        if (!cancelled) {
          setQuiz(json.data as QuizApiPayload)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load quiz')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [quizId])

  useEffect(() => {
    if (!quiz) return

    let cancelled = false
    const warm = async () => {
      const imageUrls = extractQuestionImageUrls(quiz.questions)
      await warmQuizQuestionMedia(imageUrls)
      if (cancelled) return
      if (isSplashDashEligible(quiz)) {
        await warmSplashDashSceneAssets()
      }
      if (cancelled) return
      if (isNinjaClimbEligible(quiz)) {
        await ensurePixiAssetsInitialized()
        const { Assets } = await import('pixi.js')
        await Promise.all(
          getNinjaClimbSceneAssetUrls().map(async (url) => {
            try {
              await Assets.load(url)
            } catch {
              /* soft fail on picker */
            }
          })
        )
      }
    }

    void warm().catch((err) => {
      console.warn('Mode picker asset warmup failed:', err)
    })

    return () => {
      cancelled = true
    }
  }, [quiz])

  if (error && !loading && !quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[--primary-bg] p-6 text-[--text-color]">
        <p className="grandstander text-xl font-bold">{error}</p>
        <Link href="/games" className="underline grandstander">
          Back to games
        </Link>
      </div>
    )
  }

  const splashEligible = quiz ? isSplashDashEligible(quiz) : false
  const splashReason = quiz ? getSplashDashBlockReason(quiz) : null
  const ninjaEligible = quiz ? isNinjaClimbEligible(quiz) : false
  const ninjaReason = quiz ? getNinjaClimbBlockReason(quiz) : null
  const room3dEligible = quiz ? isQuizRoom3dEligible(quiz) : false
  const room3dReason = quiz ? getQuizRoom3dBlockReason(quiz) : null
  const tugEligible = quiz ? isTugOfWar3dEligible(quiz) : false
  const tugReason = quiz ? getTugOfWar3dBlockReason(quiz) : null
  const title = quiz?.title ?? 'Loading quiz…'
  const description = quiz?.description?.trim() || null
  const coverSrc = quiz?.imageUrl || '/images/placeholder.webp'
  const quizPathId = quiz?.id ?? quizId
  const headerLoading = loading && !quiz
  const tags = quiz?.tags ?? []
  const stats = normalizeQuizStatistics(quiz?.statistics)

  return (
    <div className="min-h-screen bg-[--primary-bg] text-[--text-color] py-6 px-3 sm:py-10 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => router.push('/games')}
          className="mb-6 inline-flex items-center gap-2 grandstander font-semibold hover:underline"
        >
          <ArrowLeft size={20} /> Back to catalog
        </button>

        <div className={`mb-8 ${headerLoading ? 'animate-pulse' : ''}`}>
          <div className="flex items-start gap-3 sm:gap-5">
            <div className="relative h-16 w-16 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-[#1E5167] bg-white shadow-[3px_3px_0px_0px_#1E5167]">
              <Image
                src={coverSrc}
                alt={quiz ? `${title} cover` : 'Quiz cover'}
                fill
                sizes="112px"
                className="object-cover object-center"
                priority
              />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1
                className={`text-xl sm:text-3xl md:text-4xl font-black grandstander leading-tight break-words ${
                  headerLoading ? 'text-slate-400' : ''
                }`}
              >
                {title}
              </h1>
              {description ? (
                <p className="inclusive-sans text-[--text-light] mt-2 text-sm md:text-base leading-relaxed">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          <div
            className={`mt-4 grid grid-cols-3 gap-2 grandstander ${
              headerLoading ? 'text-slate-400' : 'text-[--text-color]'
            }`}
            aria-label="Quiz statistics"
          >
            <div className="flex items-center justify-center gap-1.5 sm:justify-start">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 stroke-red-500 fill-transparent shrink-0" aria-hidden />
              <span className="text-sm sm:text-base font-semibold">
                {stats.likes} likes
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 sm:justify-start">
              <Bookmark
                className="h-4 w-4 sm:h-5 sm:w-5 stroke-[#114257] fill-transparent shrink-0"
                aria-hidden
              />
              <span className="text-sm sm:text-base font-semibold">
                {stats.favoritesCount} saved
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 sm:justify-start">
              <Play
                className="h-4 w-4 sm:h-5 sm:w-5 stroke-[--primary-accent] fill-[--primary-accent] shrink-0"
                aria-hidden
              />
              <span className="text-sm sm:text-base font-semibold">
                {stats.playsCount} plays
              </span>
            </div>
          </div>

          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
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

        <h2 className="mb-5 text-center text-2xl md:text-3xl font-bold grandstander">
          Select game mode
        </h2>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/games/${quizPathId}/multiple-choice`}
            onClick={() => setNavigatingSlug('multiple-choice')}
            className={`${modeCardClass} ${
              navigatingSlug === 'multiple-choice' ? 'opacity-70 pointer-events-none' : ''
            } ${loading && !quiz ? 'pointer-events-none opacity-80' : ''}`}
            aria-disabled={loading && !quiz}
          >
            {navigatingSlug === 'multiple-choice' && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] bg-white/60">
                <span className="grandstander font-bold text-lg">Opening…</span>
              </div>
            )}
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

          {loading && !quiz ? (
            <div className={`${modeCardClass} opacity-70 animate-pulse`} aria-hidden>
              <ModeThumb
                src="/images/marketing/splashdash_thumb.png"
                alt=""
                muted
              />
              <ModeDetails
                icon={<Zap size={20} className="text-slate-400" />}
                title="Splash Dash"
                description="Checking eligibility…"
                cta="…"
                muted
              />
            </div>
          ) : splashEligible ? (
            <Link
              href={`/games/${quizPathId}/splash-dash`}
              onClick={() => setNavigatingSlug('splash-dash')}
              className={`${modeCardClass} ${
                navigatingSlug === 'splash-dash' ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {navigatingSlug === 'splash-dash' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] bg-white/60">
                  <span className="grandstander font-bold text-lg">Opening…</span>
                </div>
              )}
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
            <div
              className="relative flex aspect-[3/2] overflow-hidden rounded-[24px] border-2 border-slate-300 bg-slate-50 opacity-80"
              aria-disabled="true"
            >
              <ModeThumb
                src="/images/marketing/splashdash_thumb.png"
                alt="Splash Dash preview"
                muted
              />
              <ModeDetails
                icon={<Zap size={20} className="text-slate-400" />}
                title="Splash Dash"
                description={splashReason ?? 'Not available for this quiz.'}
                cta="Unavailable"
                muted
              />
            </div>
          )}

          {loading && !quiz ? (
            <div className={`${modeCardClass} opacity-70 animate-pulse`} aria-hidden>
              <ModeThumb
                src="/images/marketing/ninjaclimb_thumb.png"
                alt=""
                muted
              />
              <ModeDetails
                icon={<Mountain size={20} className="text-slate-400" />}
                title="Ninja Climb"
                description="Checking eligibility…"
                cta="…"
                muted
                beta
              />
            </div>
          ) : ninjaEligible ? (
            <Link
              href={`/games/${quizPathId}/ninja-climb`}
              onClick={() => setNavigatingSlug('ninja-climb')}
              className={`${modeCardClass} ${
                navigatingSlug === 'ninja-climb' ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {navigatingSlug === 'ninja-climb' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] bg-white/60">
                  <span className="grandstander font-bold text-lg">Opening…</span>
                </div>
              )}
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
            <div
              className="relative flex aspect-[3/2] overflow-hidden rounded-[24px] border-2 border-slate-300 bg-slate-50 opacity-80"
              aria-disabled="true"
            >
              <ModeThumb
                src="/images/marketing/ninjaclimb_thumb.png"
                alt="Ninja Climb preview"
                muted
              />
              <ModeDetails
                icon={<Mountain size={20} className="text-slate-400" />}
                title="Ninja Climb"
                description={ninjaReason ?? 'Not available for this quiz.'}
                cta="Unavailable"
                muted
                beta
              />
            </div>
          )}

          {loading && !quiz ? (
            <div className={`${modeCardClass} opacity-70 animate-pulse`} aria-hidden>
              <ModeThumb src="/images/marketing/teamquiz_thumb.png" alt="" muted />
              <ModeDetails
                icon={<Swords size={20} className="text-slate-400" />}
                title="Tug of War"
                description="Checking eligibility…"
                cta="…"
                muted
                beta
              />
            </div>
          ) : tugEligible ? (
            <Link
              href={`/games/${quizPathId}/tug-of-war-3d`}
              onClick={() => setNavigatingSlug('tug-of-war-3d')}
              className={`${modeCardClass} ${
                navigatingSlug === 'tug-of-war-3d' ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {navigatingSlug === 'tug-of-war-3d' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] bg-white/60">
                  <span className="grandstander font-bold text-lg">Opening…</span>
                </div>
              )}
              <ModeThumb
                src="/images/marketing/teamquiz_thumb.png"
                alt="Tug of War 3D preview"
              />
              <ModeDetails
                icon={<Swords size={20} />}
                title="Tug of War"
                description="Two teams take turns answering — pull the rope to win best of 3."
                cta="Play →"
                beta
              />
            </Link>
          ) : (
            <div
              className="relative flex aspect-[3/2] overflow-hidden rounded-[24px] border-2 border-slate-300 bg-slate-50 opacity-80"
              aria-disabled="true"
            >
              <ModeThumb
                src="/images/marketing/teamquiz_thumb.png"
                alt="Tug of War preview"
                muted
              />
              <ModeDetails
                icon={<Swords size={20} className="text-slate-400" />}
                title="Tug of War"
                description={tugReason ?? 'Not available for this quiz.'}
                cta="Unavailable"
                muted
                beta
              />
            </div>
          )}

          {loading && !quiz ? (
            <div className={`${modeCardClass} opacity-70 animate-pulse`} aria-hidden>
              <ModeThumb src="/images/marketing/teamquiz_thumb.png" alt="" muted />
              <ModeDetails
                icon={<Box size={20} className="text-slate-400" />}
                title="3D Quiz Room"
                description="Checking eligibility…"
                cta="…"
                muted
                beta
              />
            </div>
          ) : room3dEligible ? (
            <Link
              href={`/games/${quizPathId}/quiz-room-3d`}
              onClick={() => setNavigatingSlug('quiz-room-3d')}
              className={`${modeCardClass} ${
                navigatingSlug === 'quiz-room-3d' ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {navigatingSlug === 'quiz-room-3d' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] bg-white/60">
                  <span className="grandstander font-bold text-lg">Opening…</span>
                </div>
              )}
              <ModeThumb
                src="/images/marketing/teamquiz_thumb.png"
                alt="Experimental 3D quiz room"
              />
              <ModeDetails
                icon={<Box size={20} />}
                title="3D Quiz Room"
                description="Experimental 3D room — choose the correct answer pedestal."
                cta="Try 3D →"
                beta
              />
            </Link>
          ) : (
            <div
              className="relative flex aspect-[3/2] overflow-hidden rounded-[24px] border-2 border-slate-300 bg-slate-50 opacity-80"
              aria-disabled="true"
            >
              <ModeThumb
                src="/images/marketing/teamquiz_thumb.png"
                alt="3D Quiz Room preview"
                muted
              />
              <ModeDetails
                icon={<Box size={20} className="text-slate-400" />}
                title="3D Quiz Room"
                description={room3dReason ?? 'Not available for this quiz.'}
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
