'use client'

const PLACEHOLDER_TITLES = [
  'Published quiz title',
  'Another classroom set',
  'Vocabulary practice',
  'Grammar warm-up',
]

type ProfileQuizListSkeletonProps = {
  count?: number
}

/**
 * Horizontal profile quiz-card placeholders (matches QuizList layout).
 */
export default function ProfileQuizListSkeleton({ count = 4 }: ProfileQuizListSkeletonProps) {
  return (
    <div
      className="grid gap-6 md:grid-cols-2"
      role="status"
      aria-busy="true"
      aria-label="Loading quizzes"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProfileQuizCardSkeleton
          key={index}
          index={index}
          title={PLACEHOLDER_TITLES[index % PLACEHOLDER_TITLES.length]}
        />
      ))}
    </div>
  )
}

function ProfileQuizCardSkeleton({ index, title }: { index: number; title: string }) {
  const delayMs = 80 + index * 90

  return (
    <div
      className="bg-white border-2 border-[#1E5167] shadow-[4px_4px_0px_0px_#1E5167] flex flex-row overflow-hidden rounded-lg quiz-skel-cascade"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="w-1/3 relative flex-shrink-0 min-h-[140px] quiz-skel-thumb overflow-hidden">
        <div className="absolute inset-0 quiz-skel-shimmer" />
      </div>
      <div className="w-2/3 p-4 flex flex-col justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold grandstander quiz-skel-blur-text line-clamp-2">
            {title}
          </h3>
          <p className="mt-1 text-xs inclusive-sans quiz-skel-blur-text line-clamp-2">
            Description placeholder while we fetch your quizzes from the server.
          </p>
          <div className="mt-2 flex gap-2">
            <div className="h-5 w-14 rounded-full bg-[#bfdbfe]" />
            <div className="h-5 w-16 rounded-full bg-[#bfdbfe]" />
            <div className="h-5 w-12 rounded-full bg-[#bfdbfe]" />
          </div>
        </div>
        <div className="flex justify-between items-center gap-2">
          <div className="h-6 w-24 rounded-full bg-[#e0f2fe]" />
          <div className="flex gap-2">
            <div className="h-5 w-12 rounded bg-[#e0f2fe]" />
            <div className="h-5 w-12 rounded bg-[#e0f2fe]" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Blurred / shimmer stats line while remote counts load */
export function ProfileStatsSkeleton({ draftCount }: { draftCount: number }) {
  return (
    <p className="text-sm text-muted-foreground mt-1 inclusive-sans flex flex-wrap items-center gap-x-1 gap-y-1">
      <span className="inline-block h-4 w-16 rounded quiz-skel-shimmer align-middle" />
      <span>published ·</span>
      <span className="text-[#114257] font-medium">
        {draftCount} draft{draftCount === 1 ? '' : 's'}
      </span>
      <span>·</span>
      <span className="inline-block h-4 w-12 rounded quiz-skel-shimmer align-middle" />
      <span>liked ·</span>
      <span className="inline-block h-4 w-14 rounded quiz-skel-shimmer align-middle" />
      <span>favorites</span>
    </p>
  )
}
