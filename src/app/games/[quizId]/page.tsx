'use client'

import { useEffect, useState } from 'react'
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

type QuizApiPayload = Pick<Quiz, 'id' | 'title' | 'description' | 'quizType' | 'questions'>

const modeCardClass =
  'relative flex flex-col rounded-[24px] border-2 border-[#1E5167] bg-white p-6 shadow-[4px_4px_0px_0px_#1E5167] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1E5167]'

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
  const quizPathId = quiz?.id ?? quizId

  return (
    <div className="min-h-screen bg-[--primary-bg] text-[--text-color] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => router.push('/games')}
          className="mb-6 inline-flex items-center gap-2 grandstander font-semibold hover:underline"
        >
          <ArrowLeft size={20} /> Back to catalog
        </button>

        <h1
          className={`text-3xl md:text-4xl font-black grandstander mb-2 ${
            loading && !quiz ? 'animate-pulse text-slate-400' : ''
          }`}
        >
          {title}
        </h1>
        <p className="inclusive-sans text-[--text-light] mb-8">
          Choose how you want to play this quiz.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
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
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1E5167] bg-[--primary-light]">
              <Users size={24} />
            </div>
            <h2 className="text-2xl font-bold grandstander mb-2">Team Quiz</h2>
            <p className="inclusive-sans text-sm text-slate-600 flex-grow">
              Turn-based classroom play with timers, teams, and power-ups.
            </p>
            <span className="mt-4 font-semibold grandstander text-[--text-color]">Play →</span>
          </Link>

          {loading && !quiz ? (
            <div className={`${modeCardClass} opacity-70 animate-pulse`} aria-hidden>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-100" />
              <h2 className="text-2xl font-bold grandstander mb-2 text-slate-400">Splash Dash</h2>
              <p className="inclusive-sans text-sm text-slate-400 flex-grow">Checking eligibility…</p>
              <span className="mt-4 font-semibold grandstander text-slate-400">…</span>
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
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1E5167] bg-[--primary-light]">
                <Zap size={24} />
              </div>
              <h2 className="text-2xl font-bold grandstander mb-2">Splash Dash</h2>
              <p className="inclusive-sans text-sm text-slate-600 flex-grow">
                Two-player race — swim to the right crate first.
              </p>
              <span className="mt-4 font-semibold grandstander text-[--text-color]">Play →</span>
            </Link>
          ) : (
            <div
              className="flex flex-col rounded-[24px] border-2 border-slate-300 bg-slate-50 p-6 opacity-80"
              aria-disabled="true"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-300 bg-white">
                <Zap size={24} className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold grandstander mb-2 text-slate-500">Splash Dash</h2>
              <p className="inclusive-sans text-sm text-slate-500 flex-grow">
                {splashReason ?? 'Not available for this quiz.'}
              </p>
              <span className="mt-4 font-semibold grandstander text-slate-400">Unavailable</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
