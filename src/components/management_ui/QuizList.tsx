'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Image from 'next/image'
import { Edit, Play, Trash, Heart, Bookmark } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Question, Quiz } from '@/types'
import { useCustomToast } from '@/components/ui/CustomToast'
import { getQuizStatistics } from '@/lib/quiz-statistics'

export type QuizListMode = 'owned' | 'favorited' | 'liked'

interface QuizListProps {
  initialQuizzes: Quiz[]
  mode?: QuizListMode
  onUnfavorite?: (quizId: string) => void
  onUnlike?: (quizId: string) => void
}

const getQuizTypeLabel = (questions: Question[]): string => {
  if (!questions || questions.length === 0) return 'Empty'
  const type = questions[0]?.type || 'MULTIPLE_CHOICE'
  switch (type) {
    case 'MULTIPLE_CHOICE': return 'Multiple Choice'
    case 'TRUE_FALSE': return 'True/False'
    case 'SHORT_ANSWER': return 'Short Answer'
    case 'MATCHING': return 'Matching'
    case 'SORTING': return 'Sorting'
    default: return String(type).replace('_', ' ')
  }
}

export default function QuizList({
  initialQuizzes,
  mode = 'owned',
  onUnfavorite,
  onUnlike,
}: QuizListProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes)
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null)
  const router = useRouter()
  const { addToast } = useCustomToast()

  useEffect(() => {
    setQuizzes(initialQuizzes)
  }, [initialQuizzes])

  const handleEdit = (id: string) => {
    router.push(`/quizzes/${id}/edit`)
  }

  const handlePlay = (id: string) => {
    router.push(`/games/${id}`)
  }

  const handleUnfavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/quizzes/${id}/favorite`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      setQuizzes((prev) => prev.filter((q) => q.id !== id))
      onUnfavorite?.(id)
      addToast('Removed from favorites.', { variant: 'success', position: 'top-center' })
    } catch {
      addToast('Could not update favorite.', { variant: 'error', position: 'top-center' })
    }
  }

  const handleUnlike = async (id: string) => {
    try {
      const res = await fetch(`/api/quizzes/${id}/like`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      setQuizzes((prev) => prev.filter((q) => q.id !== id))
      onUnlike?.(id)
      addToast('Removed like.', { variant: 'success', position: 'top-center' })
    } catch {
      addToast('Could not update like.', { variant: 'error', position: 'top-center' })
    }
  }

  const handleDelete = async () => {
    if (!deleteQuizId) return
    try {
      const response = await fetch(`/api/quizzes/${deleteQuizId}`, { method: 'DELETE' })
      if (response.ok) {
        setQuizzes(quizzes.filter((quiz) => quiz.id !== deleteQuizId))
        setDeleteQuizId(null)
        router.refresh()
        addToast('Quiz deleted successfully.', { variant: 'success', position: 'top-center' })
      } else {
        addToast('Failed to delete quiz. Please try again.', { variant: 'error', position: 'top-center' })
      }
    } catch {
      addToast('Failed to delete quiz. Please try again.', { variant: 'error', position: 'top-center' })
    }
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {quizzes.map((quiz) => {
          const stats = getQuizStatistics(quiz.statistics)
          return (
            <Card
              key={quiz.id}
              className="bg-white border-2 border-[#1E5167] shadow-[4px_4px_0px_0px_#1E5167] transition-shadow duration-300 flex flex-row overflow-hidden"
            >
              {quiz.imageUrl ? (
                <div className="w-1/3 relative flex-shrink-0 min-h-[140px]">
                  <Image
                    src={quiz.imageUrl}
                    alt={quiz.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-1/3 relative flex-shrink-0 bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No Image</span>
                </div>
              )}

              <div className={`flex flex-col justify-between p-4 ${quiz.imageUrl ? 'w-2/3' : 'w-full'}`}>
                <div>
                  <CardHeader className="p-0 mb-2">
                    <CardTitle className="line-clamp-2 text-lg font-semibold grandstander">
                      {quiz.title}
                    </CardTitle>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2 inclusive-sans">
                      {quiz.description}
                    </p>
                    {quiz.tags && quiz.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {quiz.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 border-gray-300"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-[#114257]">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 fill-red-500 stroke-red-500" />
                        {stats.likes}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Play className="h-3.5 w-3.5 fill-[#114257] stroke-[#114257]" />
                        {stats.playsCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bookmark className="h-3.5 w-3.5 fill-[--primary-accent] stroke-[--primary-accent]" />
                        {stats.favoritesCount}
                      </span>
                    </div>
                  </CardHeader>
                </div>

                <CardContent className="p-0 flex justify-between items-end gap-2">
                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 font-semibold bg-pink-100 text-pink-800">
                      {quiz.questions.length}{' '}
                      {quiz.questions.length === 1 ? 'question' : 'questions'}
                    </span>
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 font-semibold bg-blue-100 text-blue-800">
                      {getQuizTypeLabel(quiz.questions)}
                    </span>
                  </div>

                  <div className="flex justify-end space-x-3 shrink-0">
                    <button
                      type="button"
                      className="text-sm grandstander flex items-center gap-1 font-semibold text-green-700"
                      onClick={() => handlePlay(quiz.id)}
                    >
                      <Play className="h-5 w-5 stroke-green-700 fill-green-700" />
                      Play
                    </button>
                    {mode === 'owned' && (
                      <>
                        <button
                          type="button"
                          className="text-sm grandstander flex items-center gap-1 font-semibold text-blue-700"
                          onClick={() => handleEdit(quiz.id)}
                        >
                          <Edit className="h-5 w-5 stroke-blue-700" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm grandstander flex items-center gap-1 font-semibold text-red-700"
                          onClick={() => setDeleteQuizId(quiz.id)}
                        >
                          <Trash className="h-5 w-5 stroke-red-700" />
                          Delete
                        </button>
                      </>
                    )}
                    {mode === 'favorited' && (
                      <button
                        type="button"
                        className="text-sm grandstander flex items-center gap-1 font-semibold text-violet-700"
                        onClick={() => handleUnfavorite(quiz.id)}
                      >
                        <Bookmark className="h-5 w-5 fill-violet-700 stroke-violet-700" />
                        Unfavorite
                      </button>
                    )}
                    {mode === 'liked' && (
                      <button
                        type="button"
                        className="text-sm grandstander flex items-center gap-1 font-semibold text-red-700"
                        onClick={() => handleUnlike(quiz.id)}
                      >
                        <Heart className="h-5 w-5 fill-red-700 stroke-red-700" />
                        Unlike
                      </button>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          )
        })}
      </div>

      <AlertDialog open={!!deleteQuizId} onOpenChange={() => setDeleteQuizId(null)}>
        <AlertDialogContent className="bg-white border-2 border-[#1E5167] shadow-[4px_4px_0px_0px_#1E5167] text-[--text-color] grandstander">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz and all its
              questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-500 border-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
