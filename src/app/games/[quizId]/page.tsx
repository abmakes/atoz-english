'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Bookmark, Box, Heart, Play, Users, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  getQuizRoom3dBlockReason,
  getSplashDashBlockReason,
  isQuizRoom3dEligible,
  isSplashDashEligible,
} from '@/lib/game-mode-eligibility'
import {
  extractQuestionImageUrls,
  warmQuizQuestionMedia,
  warmSplashDashSceneAssets,
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
}: {
  icon: ReactNode
  title: string
  description: string
  cta: string
  muted?: boolean
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
        className={`text-xl sm:text-2xl font-bold grandstander mb-1.5 leading-tight ${
          muted ? 'text-slate-500' : ''
        }`}
      >
        {title}
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
  const room3dEligible = quiz ? isQuizRoom3dEligible(quiz) : false
  const room3dReason = quiz ? getQuizRoom3dBlockReason(quiz) : null
  const title = quiz?.title ?? 'Loading quiz…'
  const description = quiz?.description?.trim() || null
  const coverSrc = quiz?.imageUrl || '/images/placeholder.webp'
  const quizPathId = quiz?.id ?? quizId
  const headerLoading = loading && !quiz
  const tags = quiz?.tags ?? []
  const stats = normalizeQuizStatistics(quiz?.statistics)

  return (
    <div className="min-h-screen bg-[--primary-bg] text-[--text-color] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => router.push('/games')}
          className="mb-6 inline-flex items-center gap-2 grandstander font-semibold hover:underline"
        >
          <ArrowLeft size={20} /> Back to catalog
        </button>

        <div
          className={`mb-8 flex items-start justify-between gap-4 sm:gap-6 ${
            headerLoading ? 'animate-pulse' : ''
          }`}
        >
          <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-[#1E5167] bg-white shadow-[3px_3px_0px_0px_#1E5167]">
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
                className={`text-3xl md:text-4xl font-black grandstander mb-2 ${
                  headerLoading ? 'text-slate-400' : ''
                }`}
              >
                {title}
              </h1>
              {description ? (
                <p className="inclusive-sans text-[--text-light] mb-2 text-sm md:text-base leading-relaxed">
                  {description}
                </p>
              ) : null}
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
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
          </div>

          <div
            className={`flex shrink-0 flex-col items-end justify-between gap-2 self-stretch py-1 grandstander ${
              headerLoading ? 'text-slate-400' : 'text-[--text-color]'
            }`}
            aria-label="Quiz statistics"
          >
            <div className="flex items-center gap-1.5">
              <Heart className="h-5 w-5 stroke-red-500 fill-transparent" aria-hidden />
              <span className="text-base font-semibold pt-0.5">
                {stats.likes} likes
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bookmark
                className="h-5 w-5 stroke-[#114257] fill-transparent"
                aria-hidden
              />
              <span className="text-base font-semibold pt-0.5">
                {stats.favoritesCount} saved
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Play
                className="h-5 w-5 stroke-[--primary-accent] fill-[--primary-accent]"
                aria-hidden
              />
              <span className="text-base font-semibold pt-0.5">
                {stats.playsCount} plays
              </span>
            </div>
          </div>
        </div>

        <h2 className="mb-5 text-center text-2xl md:text-3xl font-bold grandstander">
          Select game mode
        </h2>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
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
              <ModeThumb src="/images/marketing/teamquiz_thumb.png" alt="" muted />
              <ModeDetails
                icon={<Box size={20} className="text-slate-400" />}
                title="3D Quiz Room"
                description="Checking eligibility…"
                cta="Experimental"
                muted
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
