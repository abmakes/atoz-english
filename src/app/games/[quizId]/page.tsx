'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, Zap } from 'lucide-react'
import {
  getSplashDashBlockReason,
  isSplashDashEligible,
} from '@/lib/game-mode-eligibility'
import {
  extractQuestionImageUrls,
  warmQuizQuestionMedia,
  warmSplashDashSceneAssets,
} from '@/lib/game-asset-warmup'
import type { Quiz } from '@/types'

type QuizApiPayload = Pick<
  Quiz,
  'id' | 'title' | 'description' | 'imageUrl' | 'quizType' | 'questions'
>

const modeCardClass =
  'relative flex flex-col sm:flex-row overflow-hidden rounded-[24px] border-2 border-[#1E5167] bg-white shadow-[4px_4px_0px_0px_#1E5167] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1E5167]'

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
      className={`relative aspect-[4/3] w-full shrink-0 overflow-hidden border-[#1E5167] sm:aspect-auto sm:w-1/2 sm:border-r-2 ${
        muted ? 'grayscale opacity-70' : ''
      }`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, 40vw"
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
      className={`flex w-full flex-col p-5 sm:w-1/2 sm:p-6 ${
        muted ? 'text-slate-500' : ''
      }`}
    >
      <div
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 ${
          muted
            ? 'border-slate-300 bg-white text-slate-400'
            : 'border-[#1E5167] bg-[--primary-light]'
        }`}
      >
        {icon}
      </div>
      <h2
        className={`text-2xl font-bold grandstander mb-2 ${
          muted ? 'text-slate-500' : ''
        }`}
      >
        {title}
      </h2>
      <p
        className={`inclusive-sans text-sm flex-grow ${
          muted ? 'text-slate-500' : 'text-slate-600'
        }`}
      >
        {description}
      </p>
      <span
        className={`mt-4 font-semibold grandstander ${
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
  const title = quiz?.title ?? 'Loading quiz…'
  const description = quiz?.description?.trim() || null
  const coverSrc = quiz?.imageUrl || '/images/placeholder.webp'
  const quizPathId = quiz?.id ?? quizId
  const headerLoading = loading && !quiz

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

        <header
          className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-stretch overflow-hidden rounded-[24px] border-2 border-[#1E5167] bg-white shadow-[4px_4px_0px_0px_#1E5167] ${
            headerLoading ? 'animate-pulse' : ''
          }`}
        >
          <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden border-[#1E5167] sm:aspect-auto sm:w-44 sm:border-r-2 md:w-52">
            <Image
              src={coverSrc}
              alt={quiz ? `${title} cover` : 'Quiz cover'}
              fill
              sizes="(max-width: 640px) 100vw, 208px"
              className="object-cover object-center"
              priority
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-5 sm:px-6 sm:py-6">
            <p className="inclusive-sans text-xs font-semibold uppercase tracking-wide text-[--text-light] mb-1">
              Selected quiz
            </p>
            <h1
              className={`text-2xl md:text-3xl font-black grandstander leading-tight ${
                headerLoading ? 'text-slate-400' : ''
              }`}
            >
              {title}
            </h1>
            {description ? (
              <p className="inclusive-sans text-[--text-light] mt-2 text-sm md:text-base leading-relaxed">
                {description}
              </p>
            ) : headerLoading ? (
              <p className="inclusive-sans text-slate-300 mt-2 text-sm">Loading description…</p>
            ) : null}
            <p className="inclusive-sans text-[--text-light] mt-3 text-sm">
              Choose how you want to play this quiz.
            </p>
          </div>
        </header>

        <div className="grid gap-6">
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
              icon={<Users size={24} />}
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
                icon={<Zap size={24} className="text-slate-400" />}
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
                icon={<Zap size={24} />}
                title="Splash Dash"
                description="Two-player race — swim to the right crate first."
                cta="Play →"
              />
            </Link>
          ) : (
            <div
              className="relative flex flex-col sm:flex-row overflow-hidden rounded-[24px] border-2 border-slate-300 bg-slate-50 opacity-80"
              aria-disabled="true"
            >
              <ModeThumb
                src="/images/marketing/splashdash_thumb.png"
                alt="Splash Dash preview"
                muted
              />
              <ModeDetails
                icon={<Zap size={24} className="text-slate-400" />}
                title="Splash Dash"
                description={splashReason ?? 'Not available for this quiz.'}
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
