import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Gamepad2 } from 'lucide-react'
import HomeCarousel from '@/components/home/HomeCarousel'

export const metadata: Metadata = {
  title: 'PlaytoZ — Classroom games for English teachers',
  description:
    'Designed for classroom fun. Create a quiz or browse English games for Pre-A1 to B1.',
}

export default function HomePage() {
  return (
    <div className="overflow-hidden text-[--text-color]">
      <section className="relative flex min-h-[calc(100dvh-3.5rem)] items-center bg-[--primary-bg]">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[--primary-accent]/25 blur-3xl" />

        <div className="container relative mx-auto px-6 pb-16 pt-14 md:pb-24 md:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-[#1E5167] bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#1E5167] grandstander">
                <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                English games for Pre-A1–B1
              </div>
              <h1 className="max-w-2xl text-balance text-5xl font-black leading-[1.05] grandstander sm:text-6xl lg:text-7xl">
                Designed for{' '}
                <span className="text-[#168CB9]">classroom fun.</span>
              </h1>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/create"
                  className="neo-button inline-flex items-center justify-center gap-2 bg-[--primary-accent] px-8 text-white hover:bg-[--primary-accent-hover]"
                >
                  Create a quiz
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  href="/games"
                  className="neo-button inline-flex items-center justify-center bg-white px-8 text-[--text-color] hover:bg-sky-50"
                >
                  Browse games
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[--text-light] inclusive-sans">
                {['Shared-screen play', 'Teacher-controlled', 'AI-assisted creation'].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#168CB9]" aria-hidden="true" />
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-3xl lg:mx-0">
              <div className="absolute -inset-3 rotate-2 rounded-[30px] bg-[--secondary-accent]" />
              <div className="neo-card relative -rotate-1 overflow-hidden bg-white p-2 hover:[transform:translateY(-2px)_rotate(-1deg)]">
                <HomeCarousel />
              </div>
              <div className="absolute -bottom-5 right-4 rotate-2 rounded-2xl border-2 border-[#1E5167] bg-white px-4 py-3 text-sm font-black shadow-[4px_4px_0px_0px_#1E5167] grandstander md:right-8 md:text-base">
                Everyone has a reason to keep playing.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
