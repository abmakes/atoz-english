'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

interface Question {
  id: string
  type: string
}

interface Quiz {
  id: string
  title: string
  imageUrl: string | null
  questions: Question[]
}

interface QuizListProps {
  initialQuizzes: Quiz[]
}

// Helper function to get quiz type label
const getQuizTypeLabel = (questions: Question[]): string => {
  if (!questions || questions.length === 0) return 'Empty';
  
  // Get the type of the first question (we ensure all questions have the same type)
  const type = questions[0]?.type || 'MULTIPLE_CHOICE';
  
  // Convert to more readable format
  switch (type) {
    case 'MULTIPLE_CHOICE': return 'Multiple Choice';
    case 'TRUE_FALSE': return 'True/False';
    case 'SHORT_ANSWER': return 'Short Answer';
    case 'MATCHING': return 'Matching';
    case 'SORTING': return 'Sorting';
    default: return type.replace('_', ' ');
  }
};

export default function QuizList({ initialQuizzes }: QuizListProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes)
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null)
  const router = useRouter()

  const handleEdit = (id: string) => {
    router.push(`/quizzes/${id}/edit`)
  }

  const handlePlay = (id: string) => {
    router.push(`/quizzes/${id}`)
  }

  const handleDelete = async () => {
    if (deleteQuizId) {
      try {
        const response = await fetch(`/api/quizzes/${deleteQuizId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setQuizzes(quizzes.filter(quiz => quiz.id !== deleteQuizId))
          setDeleteQuizId(null)
          router.refresh()  // Refresh the page to update server-side data
        } else {
          console.error('Failed to delete quiz')
        }
      } catch (error) {
        console.error('Error deleting quiz:', error)
      }
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map(quiz => (
          <Card key={quiz.id} className="hover:shadow-pink-500 transition-shadow duration-300 flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="line-clamp-1">{quiz.title}</CardTitle>
                  <CardDescription className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-pink-100 text-pink-800">
                      {quiz.questions.length} {quiz.questions.length === 1 ? 'question' : 'questions'}
                    </span>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                      {getQuizTypeLabel(quiz.questions)}
                    </span>
                  </CardDescription>
                </div>
                {quiz.imageUrl && (
                  <div className="w-16 h-16 overflow-hidden rounded-md">
                    <Image 
                      src={quiz.imageUrl} 
                      alt={quiz.title} 
                      width={64} 
                      height={64} 
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handlePlay(quiz.id)}>Play</Button>
                <Button onClick={() => handleEdit(quiz.id)}>Edit</Button>
                <Button variant="destructive" onClick={() => setDeleteQuizId(quiz.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteQuizId} onOpenChange={() => setDeleteQuizId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz and all its questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}