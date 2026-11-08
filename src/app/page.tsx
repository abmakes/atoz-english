import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import HomeCarousel from '@/components/home/HomeCarousel'

export const metadata: Metadata = {
  title: 'PlaytoZ — New ways to learn',
  description: 'New ways to learn. An easy way to create English classroom games.',
}

export default function HomePage() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-[#f3faff] text-[#114257]">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:grid lg:h-full lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:grid-rows-1 lg:items-stretch lg:gap-10 lg:py-6">
        <div className="flex shrink-0 flex-col justify-center">
          <h1 className="text-balance text-[clamp(2.1rem,5.4vh,4.25rem)] font-black leading-[1.02] grandstander">
            New ways to learn.
            <span className="mt-1 block text-[#168CB9]">Easy way to create.</span>
          </h1>
          <Link
            href="/create"
            className="neo-button mt-4 inline-flex w-fit items-center gap-2 bg-[#114257] px-6 py-2.5 text-base text-white hover:bg-[#1E5167] sm:mt-6 sm:text-lg"
          >
            Create a quiz
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
        <div className="min-h-0 flex-1">
          <HomeCarousel />
        </div>
      </div>
    </div>
  )
}
