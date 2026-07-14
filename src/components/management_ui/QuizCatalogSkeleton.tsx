'use client'

const PLACEHOLDER_TITLES = [
  'Quiz loading title',
  'Another quiz name',
  'English practice set',
  'Classroom challenge',
  'Vocabulary round',
  'Grammar warm-up',
  'Listening check',
  'Speaking prompts',
]

type QuizCatalogSkeletonProps = {
  count?: number
}

/**
 * Card-grid placeholders only — search chrome stays on the parent page (white, interactive).
 */
export default function QuizCatalogSkeleton({ count = 8 }: QuizCatalogSkeletonProps) {
  return (
    <div
      className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full"
      role="status"
      aria-busy="true"
      aria-label="Loading quiz catalog"
    >
      {Array.from({ length: count }).map((_, index) => (
        <QuizCardSkeleton
          key={index}
          index={index}
          title={PLACEHOLDER_TITLES[index % PLACEHOLDER_TITLES.length]}
        />
      ))}
    </div>
  )
}

function QuizCardSkeleton({ index, title }: { index: number; title: string }) {
  const delayMs = 80 + index * 90

  return (
    <div
      className="block quiz-skel-cascade"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="relative overflow-hidden rounded-[32px] border-2 border-[#1E5167] bg-white shadow-[3px_6px_0px_0px_#1E5167] mb-3">
        <div className="relative h-48 w-full min-w-72 quiz-skel-thumb overflow-hidden">
          <div className="absolute inset-0 quiz-skel-shimmer" />
        </div>
      </div>

      <div className="px-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-xl font-semibold grandstander px-2 leading-tight quiz-skel-blur-text">
            {title}
          </h3>
          <div className="flex items-center gap-1 shrink-0 pr-2 pt-1">
            <div className="h-4 w-4 rounded-sm bg-[#bfdbfe]" />
            <div className="h-4 w-6 rounded bg-[#bfdbfe]" />
          </div>
        </div>
        <p className="text-sm inclusive-sans px-2 quiz-skel-blur-text line-clamp-2">
          Short description placeholder text that stays blurred until real quizzes arrive.
        </p>
      </div>
    </div>
  )
}
