'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2, Printer, Smile, SpellCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCustomToast } from '@/components/ui/CustomToast'
import AIQuestionReviewPanel, {
  type ReviewableQuestion,
} from '@/components/management_ui/AIQuestionReviewPanel'
import {
  commitLessonSelection,
  type LessonAssessmentItem,
  type LessonSentence,
  type LessonTarget,
  type SourceQuestion,
  type WorksheetItem,
} from '@/lib/lesson/assess'
import { promptsFromLesson } from '@/lib/lesson/prompts'
import { levelFromTags } from '@/lib/taxonomy/quiz-taxonomy'
import { QuestionType } from '@/types/question_types'

const SOURCE_CARD =
  'flex min-h-[9rem] flex-col items-center justify-center gap-3 rounded-xl border-2 border-[--border-dark] bg-white px-4 py-5 text-center shadow-[4px_4px_0px_0px_var(--border-dark)] transition hover:bg-[--primary-light] disabled:cursor-not-allowed disabled:hover:bg-white'

interface LessonQuiz {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  tags: string[]
  questions: SourceQuestion[]
}

interface LessonRecord {
  id: string
  title: string
  worksheetItems: WorksheetItem[]
  sentences: LessonSentence[]
}

function toReviewQuestion(item: LessonAssessmentItem): ReviewableQuestion {
  const choices = item.choices.filter(Boolean)
  return {
    id: item.questionId,
    question: item.line,
    answers: choices.length > 0 ? choices : item.sourceAnswers.filter(Boolean),
    correctAnswer: item.correctAnswer,
    imageUrl: item.imageUrl || '/images/placeholder.webp',
    imageFile: null,
    type: (item.type as QuestionType) || QuestionType.MULTIPLE_CHOICE,
    status: 'pending',
    languageWarnings: item.languageWarnings,
    sourceQuestion: item.sourceQuestion,
    sourceAnswers: item.sourceAnswers,
    assessmentReason: item.reason,
  }
}

export default function LessonKitScreen({
  quizId,
  initialCheck,
}: {
  quizId: string
  initialCheck?: LessonTarget
}) {
  const router = useRouter()
  const { addToast } = useCustomToast()
  const [quiz, setQuiz] = useState<LessonQuiz | null>(null)
  const [lesson, setLesson] = useState<LessonRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<'pieces' | 'checking' | 'review'>('pieces')
  const [target, setTarget] = useState<LessonTarget>('worksheet')
  const [reviewQuestions, setReviewQuestions] = useState<ReviewableQuestion[]>([])
  const [notice, setNotice] = useState('')
  const [startedCheck, setStartedCheck] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/quizzes/${quizId}/lesson`, { cache: 'no-store' })
        const payload = (await response.json()) as {
          error?: string
          data?: { quiz: LessonQuiz; lesson: LessonRecord }
        }
        if (!response.ok || !payload.data) {
          throw new Error(payload.error || 'Could not open this lesson.')
        }
        if (!cancelled) {
          setQuiz(payload.data.quiz)
          setLesson(payload.data.lesson)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not open this lesson.')
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

  const playableCount = useMemo(() => {
    if (!quiz || !lesson) return 0
    return promptsFromLesson({
      sentences: lesson.sentences,
      questions: quiz.questions,
      coverUrl: quiz.imageUrl,
    }).length
  }, [lesson, quiz])

  const runCheck = useCallback(
    async (nextTarget: LessonTarget) => {
      if (!quiz) return
      if (quiz.questions.length === 0) {
        setNotice('This quiz has no questions yet.')
        return
      }
      setNotice('')
      setTarget(nextTarget)
      setView('checking')
      try {
        const response = await fetch('/api/ai/assess-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: nextTarget,
            level: levelFromTags(quiz.tags) ?? 'A1',
            questions: quiz.questions.map((question) => ({
              id: question.id,
              question: question.question,
              answers: question.answers,
              correctAnswer: question.correctAnswer,
              type: question.type,
              imageUrl: question.imageUrl ?? null,
            })),
          }),
        })
        const payload = (await response.json()) as {
          error?: string
          items?: LessonAssessmentItem[]
        }
        if (!response.ok || !payload.items) {
          throw new Error(payload.error || 'Failed to check these questions.')
        }
        setReviewQuestions(payload.items.map(toReviewQuestion))
        setView('review')
      } catch (checkError) {
        setView('pieces')
        addToast(checkError instanceof Error ? checkError.message : 'Failed to check these questions.', {
          variant: 'error',
          position: 'top-center',
        })
      }
    },
    [addToast, quiz]
  )

  useEffect(() => {
    if (!quiz || !initialCheck || startedCheck) return
    setStartedCheck(true)
    void runCheck(initialCheck)
  }, [initialCheck, quiz, runCheck, startedCheck])

  const regenerateOne = useCallback(
    async (_index: number, previous: ReviewableQuestion): Promise<ReviewableQuestion | null> => {
      if (!quiz) return null
      try {
        const response = await fetch('/api/ai/assess-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target,
            level: levelFromTags(quiz.tags) ?? 'A1',
            questions: [
              {
                id: previous.id,
                question: previous.sourceQuestion || previous.question,
                answers: previous.sourceAnswers?.length ? previous.sourceAnswers : previous.answers,
                correctAnswer: previous.correctAnswer,
                type: previous.type,
                imageUrl: previous.imageUrl,
              },
            ],
          }),
        })
        const payload = (await response.json()) as {
          error?: string
          items?: LessonAssessmentItem[]
        }
        if (!response.ok || !payload.items?.[0]) {
          throw new Error(payload.error || 'Failed to check this question again.')
        }
        addToast('That item is ready to review again.', { variant: 'success', position: 'top-center' })
        return toReviewQuestion(payload.items[0])
      } catch (regenError) {
        addToast(regenError instanceof Error ? regenError.message : 'Failed to check this question again.', {
          variant: 'error',
          position: 'top-center',
        })
        return null
      }
    },
    [addToast, quiz, target]
  )

  const commit = useCallback(
    async (reviewed: ReviewableQuestion[]) => {
      if (!quiz) return
      const selection = commitLessonSelection(
        target,
        reviewed.map((item) => ({
          status: item.status,
          questionId: item.id,
          line: item.question,
          choices: item.answers,
          imageUrl: item.imageUrl,
          correctAnswer: item.correctAnswer,
        }))
      )
      if (!selection.ok) {
        addToast(selection.message, { variant: 'warning', position: 'top-center' })
        return
      }

      try {
        const response = await fetch(`/api/quizzes/${quiz.id}/lesson`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            target === 'worksheet'
              ? { target, items: selection.worksheetItems }
              : { target, items: selection.sentences }
          ),
        })
        const payload = (await response.json()) as {
          error?: string
          data?: { lesson: LessonRecord }
        }
        if (!response.ok || !payload.data) {
          throw new Error(payload.error || 'Failed to save the approved items.')
        }
        setLesson(payload.data.lesson)
        setView('pieces')
        if (target === 'sentence-builder') {
          const playable = promptsFromLesson({
            sentences: payload.data.lesson.sentences,
            questions: quiz.questions,
            coverUrl: quiz.imageUrl,
          })
          if (playable.length === 0) {
            setNotice('None of the approved lines can be played as a sentence.')
            return
          }
        }
        router.push(
          target === 'worksheet' ? `/quizzes/${quiz.id}/print` : `/quizzes/${quiz.id}/sentence-builder`
        )
      } catch (saveError) {
        addToast(saveError instanceof Error ? saveError.message : 'Failed to save the approved items.', {
          variant: 'error',
          position: 'top-center',
        })
      }
    },
    [addToast, quiz, router, target]
  )

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[--primary-accent]" />
      </div>
    )
  }

  if (error || !quiz || !lesson) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center grandstander">
        <p className="text-lg font-bold text-[--text-color]">{error || 'Could not open this lesson.'}</p>
        <Link href="/quizzes" className="mt-4 inline-block underline">
          Back to profile
        </Link>
      </div>
    )
  }

  const worksheetReady = lesson.worksheetItems.length > 0
  const sentenceReady = playableCount > 0

  return (
    <div className="container mx-auto max-w-screen-xl px-4 py-6 grandstander text-[--text-color]">
      <Link href="/quizzes" className="mb-4 inline-block text-sm font-bold underline">
        Back to profile
      </Link>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-4">
        <div className="mb-2 flex h-auto min-h-0 w-full shrink-0 flex-col items-center gap-2 rounded-lg border border-[--border-dark] bg-white p-3 pb-4 text-[--text-color] shadow-[4px_4px_0px_0px_var(--border-dark)] grandstander lg:mb-0 lg:w-auto lg:basis-1/4 lg:gap-4 lg:p-5">
          <div className="flex w-full flex-col items-center gap-1 text-center">
            <h2 className="w-full text-xl font-bold leading-tight">{quiz.title || 'Quiz Title'}</h2>
            <p className="text-sm font-bold text-slate-700">
              Questions: {quiz.questions.length}
            </p>
          </div>
          {quiz.imageUrl ? (
            <Image
              src={quiz.imageUrl}
              alt={quiz.title || 'Quiz cover image'}
              width={300}
              height={200}
              unoptimized
              className="hidden h-auto w-full rounded-lg object-cover aspect-[16/9] lg:block"
            />
          ) : null}
          <p className="w-full text-center text-sm text-slate-700">
            {quiz.description || 'No description yet.'}
          </p>
          <div className="flex w-full flex-wrap justify-center gap-2">
            {quiz.tags.length > 0 ? (
              quiz.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-[--primary-accent] bg-white text-sm text-[--text-color] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]"
                >
                  {tag}
                </Badge>
              ))
            ) : (
              <Badge
                variant="outline"
                className="border-[--primary-accent] bg-white text-xs font-medium text-[--text-color] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]"
              >
                No tags yet
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-2 flex h-full basis-3/4 flex-col items-center gap-4 align-middle grandstander text-[--text-color] lg:mt-0">
          <div className="flex h-full w-full max-w-screen-2xl flex-col rounded-lg border border-[--border-dark] bg-white shadow-[4px_4px_0px_0px_var(--border-dark)]">
            {view === 'review' ? (
              <div className="px-4 py-4">
                <AIQuestionReviewPanel
                  purpose="lesson"
                  showChoices={target === 'worksheet'}
                  questions={reviewQuestions}
                  onCancel={() => {
                    setReviewQuestions([])
                    setView('pieces')
                  }}
                  onRegenerateOne={regenerateOne}
                  onCommit={(_approved, reviewed) => {
                    void commit(reviewed ?? [])
                  }}
                />
              </div>
            ) : view === 'checking' ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm text-slate-600">Checking these questions…</p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
                <div className="max-w-md text-center">
                  <h3 className="text-xl font-bold">Add a piece</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Check this quiz, then print a worksheet or play the sentences.
                  </p>
                  {notice ? (
                    <p role="status" className="mt-3 text-sm font-semibold text-amber-800">
                      {notice}
                    </p>
                  ) : null}
                </div>
                <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    className={SOURCE_CARD}
                    onClick={() => {
                      if (worksheetReady) {
                        router.push(`/quizzes/${quiz.id}/print`)
                        return
                      }
                      void runCheck('worksheet')
                    }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[--border-dark] bg-[--background]">
                      <Printer size={22} />
                    </div>
                    <span className="text-base font-semibold">Add worksheet</span>
                    <span className="text-xs text-slate-600">
                      {worksheetReady ? 'Open' : 'Print the pictures and questions'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={SOURCE_CARD}
                    onClick={() => {
                      if (sentenceReady) {
                        router.push(`/quizzes/${quiz.id}/sentence-builder`)
                        return
                      }
                      if (lesson.sentences.length > 0) {
                        setNotice('None of the approved lines can be played as a sentence.')
                        return
                      }
                      void runCheck('sentence-builder')
                    }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[--border-dark] bg-[--background]">
                      <SpellCheck size={22} />
                    </div>
                    <span className="text-base font-semibold">Add sentence builder</span>
                    <span className="text-xs text-slate-600">
                      {sentenceReady
                        ? 'Open'
                        : lesson.sentences.length > 0
                          ? 'None can be played'
                          : 'One word at a time'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`${SOURCE_CARD} cursor-not-allowed hover:bg-white`}
                    aria-disabled="true"
                    onClick={(event) => event.preventDefault()}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[--border-dark] bg-[--background]">
                      <Smile size={22} />
                    </div>
                    <span className="text-base font-semibold">Funny Faces</span>
                    <span className="text-xs text-slate-600">Later</span>
                  </button>
                  <button
                    type="button"
                    className={`${SOURCE_CARD} cursor-not-allowed hover:bg-white`}
                    aria-disabled="true"
                    onClick={(event) => event.preventDefault()}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[--border-dark] bg-[--background]">
                      <BookOpen size={22} />
                    </div>
                    <span className="text-base font-semibold">Storytelling</span>
                    <span className="text-xs text-slate-600">Later</span>
                  </button>
                </div>
                {worksheetReady || lesson.sentences.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    {worksheetReady ? (
                      <button
                        type="button"
                        className="font-semibold underline"
                        onClick={() => void runCheck('worksheet')}
                      >
                        Check the worksheet again
                      </button>
                    ) : null}
                    {lesson.sentences.length > 0 ? (
                      <button
                        type="button"
                        className="font-semibold underline"
                        onClick={() => void runCheck('sentence-builder')}
                      >
                        Check the sentences again
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
