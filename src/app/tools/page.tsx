'use client'

import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Clapperboard, Timer, Shuffle } from 'lucide-react'

const TOOLS = [
  {
    slug: 'story-creator',
    title: 'Story Creator',
    description:
      'Generate a 4-picture story, print the worksheet, and let students record their own narrated movie.',
    icon: Clapperboard,
    available: true,
  },
  {
    slug: 'class-timer',
    title: 'Class Timer',
    description: 'Big friendly countdowns for classroom activities.',
    icon: Timer,
    available: false,
  },
  {
    slug: 'name-picker',
    title: 'Random Name Picker',
    description: 'Pick a lucky student for the next answer.',
    icon: Shuffle,
    available: false,
  },
] as const

export default function ToolsPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="grandstander text-4xl font-bold text-[#114257]">
          Teacher Tools
        </h1>
        <p className="mt-2 text-slate-600">
          Small classroom helpers that live alongside your quizzes.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            const card = (
              <div
                className={`flex h-full flex-col rounded-2xl border-2 p-6 transition-shadow ${
                  tool.available
                    ? 'border-violet-300 bg-white shadow-[4px_4px_0px_0px_#ddd6fe] hover:shadow-[6px_6px_0px_0px_#c4b5fd]'
                    : 'border-gray-200 bg-gray-50 opacity-70'
                }`}
              >
                <Icon
                  className={`h-10 w-10 ${
                    tool.available ? 'text-violet-600' : 'text-gray-400'
                  }`}
                />
                <h2 className="grandstander mt-4 text-2xl font-bold text-[#114257]">
                  {tool.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-slate-600">
                  {tool.description}
                </p>
                <span
                  className={`mt-4 inline-block text-sm font-semibold ${
                    tool.available ? 'text-violet-600' : 'text-gray-400'
                  }`}
                >
                  {tool.available ? 'Open →' : 'Coming soon'}
                </span>
              </div>
            )

            return tool.available ? (
              <Link key={tool.slug} href={`/tools/${tool.slug}`} className="block">
                {card}
              </Link>
            ) : (
              <div key={tool.slug}>{card}</div>
            )
          })}
        </div>
      </div>
    </ProtectedRoute>
  )
}
