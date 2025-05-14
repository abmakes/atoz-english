"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import LoadingSpinner from '@/components/loading_spinner'
import ImageSelectModal from '@/components/management_ui/ImageSelectModal'
import { QuestionFormMatching } from '@/components/management_ui/forms/QuestionFormMatching'
import { QuestionFormSorting } from '@/components/management_ui/forms/QuestionFormSorting'
import { QuestionType } from '@/types/question_types'

interface Question {
  id?: string
  question: string
  answers: string[]
  correctAnswer: string
  imageUrl: string
  imageFile: File | null
  type: QuestionType
}

interface Quiz {
  id: string
  title: string
  imageUrl?: string
  questions: Question[]
}

const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

export default function EditQuizPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [quizCoverImage, setQuizCoverImage] = useState<File | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quizzes/${params.id}`)
        if (response.ok) {
          const data: Quiz = await response.json()
          data.questions = data.questions.map((q: Omit<Question, 'imageFile'>) => ({ ...q, imageFile: null }))
          setQuiz(data)
        } else {
          throw new Error('Failed to fetch quiz')
        }
      } catch (error) {
        console.error('Error fetching quiz:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [params.id])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (quiz) {
      setQuiz({ ...quiz, title: e.target.value })
    }
  }

  const handleQuestionChange = (index: number, field: keyof Question, value: string) => {
    if (quiz) {
      const newQuestions = [...quiz.questions]
      newQuestions[index] = { ...newQuestions[index], [field]: value }
      setQuiz({ ...quiz, questions: newQuestions })
    }
  }

  const handleAnswerChange = (questionIndex: number, answerIndex: number, value: string) => {
    if (quiz) {
      const newQuestions = [...quiz.questions]
      newQuestions[questionIndex].answers[answerIndex] = value
      setQuiz({ ...quiz, questions: newQuestions })
    }
  }

  const addQuestion = () => {
    if (quiz) {
      const existingType = quiz.questions[0]?.type;
      if (!existingType) return;

      let newQuestion: Question;
      switch (existingType) {
        case QuestionType.MATCHING:
          newQuestion = {
            question: '',
            answers: ['', '', '', ''],
            correctAnswer: JSON.stringify([{ left: '', right: '' }]),
            imageUrl: PLACEHOLDER_IMAGE,
            imageFile: null,
            type: QuestionType.MATCHING
          };
          break;
        case QuestionType.SORTING:
          newQuestion = {
            question: '',
            answers: ['', '', ''],
            correctAnswer: JSON.stringify(['', '', '']),
            imageUrl: PLACEHOLDER_IMAGE,
            imageFile: null,
            type: QuestionType.SORTING
          };
          break;
        case QuestionType.TRUE_FALSE:
          newQuestion = {
            question: '',
            answers: ['True', 'False'],
            correctAnswer: 'True',
            imageUrl: PLACEHOLDER_IMAGE,
            imageFile: null,
            type: QuestionType.TRUE_FALSE
          };
          break;
        case QuestionType.SHORT_ANSWER:
          newQuestion = {
            question: '',
            answers: [''],
            correctAnswer: '',
            imageUrl: PLACEHOLDER_IMAGE,
            imageFile: null,
            type: QuestionType.SHORT_ANSWER
          };
          break;
        default:
          newQuestion = {
            question: '',
            answers: ['', '', '', ''],
            correctAnswer: '',
            imageUrl: PLACEHOLDER_IMAGE,
            imageFile: null,
            type: QuestionType.MULTIPLE_CHOICE
          };
      }
      setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
    }
  };

  const deleteQuestion = async (index: number) => {
    if (quiz) {
      const questionToDelete = quiz.questions[index]
      if (questionToDelete.id) {
        try {
          const response = await fetch(`/api/questions/${questionToDelete.id}`, {
            method: 'DELETE',
          })
          if (!response.ok) {
            throw new Error('Failed to delete question')
          }
        } catch (error) {
          console.error('Error deleting question:', error)
          return
        }
      }
      const newQuestions = quiz.questions.filter((_, i) => i !== index)
      setQuiz({ ...quiz, questions: newQuestions })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quiz) return

    try {
      const formData = new FormData()
      formData.append('title', quiz.title)
      
      // Always include an image URL, fallback to placeholder if none selected
      if (quizCoverImage) {
        formData.append('quizImage', quizCoverImage)
        formData.append('quizImageUrl', quiz.imageUrl || PLACEHOLDER_IMAGE)
      } else {
        formData.append('quizImageUrl', quiz.imageUrl || PLACEHOLDER_IMAGE)
      }

      // Ensure each question has an image URL
      const questionsWithImages = quiz.questions.map(question => ({
        ...question,
        imageUrl: question.imageUrl || PLACEHOLDER_IMAGE
      }));
      
      formData.append('questions', JSON.stringify(questionsWithImages))

      quiz.questions.forEach((question, index) => {
        if (question.imageFile instanceof File) {
          formData.append(`questions[${index}][image]`, question.imageFile)
        }
      })

      const response = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'PUT',
        body: formData,
      })

      if (response.ok) {
        router.push('/')
      } else {
        throw new Error('Failed to update quiz')
      }
    } catch (error) {
      console.error('Failed to update quiz:', error)
    }
  }

  const openImageModal = (questionIndex?: number) => {
    setActiveImageIndex(questionIndex ?? null)
    setIsImageModalOpen(true)
  }

  const handleImageSelect = (imageUrl: string, file?: File | null) => {
    if (activeImageIndex !== null) {
      if (quiz) {
        const newQuestions = [...quiz.questions]
        newQuestions[activeImageIndex].imageUrl = imageUrl
        newQuestions[activeImageIndex].imageFile = file || null
        setQuiz({ ...quiz, questions: newQuestions })
      }
    } else {
      setQuizCoverImage(file || null)
      if (quiz) {
        setQuiz({ ...quiz, imageUrl })
      }
    }
    setIsImageModalOpen(false)
  }

  const renderQuestionForm = (questionIndex: number) => {
    const question = quiz?.questions[questionIndex];
    if (!question) return null;

    switch (question.type) {
      case QuestionType.MATCHING:
        return (
          <QuestionFormMatching
            initialPairs={JSON.parse(question.correctAnswer)}
            onSave={(pairs) => {
              const flatAnswers = pairs.flatMap(pair => [pair.left, pair.right]);
              handleQuestionChange(questionIndex, 'answers', flatAnswers.join(','));
              handleQuestionChange(questionIndex, 'correctAnswer', JSON.stringify(pairs));
            }}
          />
        );
      case QuestionType.SORTING:
        return (
          <QuestionFormSorting
            initialItems={JSON.parse(question.correctAnswer)}
            onSave={(items) => {
              handleQuestionChange(questionIndex, 'answers', items.join(','));
              handleQuestionChange(questionIndex, 'correctAnswer', JSON.stringify(items));
            }}
          />
        );
      // Add other question type forms...
      default:
        return (
          <>
            <h3 className='font-bold ml-2 -my-2'>Answers</h3>
            <div className='grid gap-2 grid-cols-2'>            
              {question.answers.map((answer, aIndex) => (
                <Input
                  key={aIndex}
                  type="text"
                  value={answer}
                  onChange={(e) => handleAnswerChange(questionIndex, aIndex, e.target.value)}
                  placeholder={`Answer ${aIndex + 1}`}
                  required
                />
              ))}
            </div>
            <h3 className='font-bold ml-2 -my-2'>Correct Answer</h3>
            <Input
              type="text"
              value={question.correctAnswer}
              onChange={(e) => handleQuestionChange(questionIndex, 'correctAnswer', e.target.value)}
              placeholder="Correct Answer"
              required
            />
          </>
        );
    }
  };

  if (loading) {
    return <div className=''><LoadingSpinner/></div>
  }

  if (!quiz) {
    return <div>Quiz not found</div>
  }

  return (
    <div className="container max-w-[1100px] w-full p-4">
      <h1 className="relative bg-pink-500 text-3xl shadow-solid rounded-lg font-bold w-72 p-4 m-6 mt-0 text-center">Edit Quiz</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-none rounded-lg">
        <div className="flex flex-col bg-white p-6 rounded-lg shadow-solid border-2 border-black">
          <h3 className='font-bold ml-2 -mt-2 mb-2'>Quiz Title</h3>
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <Input
              type="text"
              value={quiz.title}
              onChange={handleTitleChange}
              placeholder="Quiz Title"
              required
              className="flex max-w-screen-sm"
            />
            <div className="flex flex-col min-w-64 space-y-2">
              <div className="flex items-center space-x-2">
                <Button 
                  type="button" 
                  onClick={() => openImageModal()}
                  className={quiz.imageUrl === PLACEHOLDER_IMAGE ? "border-2 border-yellow-500" : ""}
                >
                  {quiz.imageUrl === PLACEHOLDER_IMAGE ? "Select Image (Required)" : "Change Image"}
                </Button>
                <Image
                  src={quiz.imageUrl || PLACEHOLDER_IMAGE}
                  alt="Quiz cover image preview"
                  width={50}
                  height={50}
                  className="object-cover rounded h-12"
                />
              </div>
              {quiz.imageUrl === PLACEHOLDER_IMAGE && (
                <p className="text-yellow-600 text-sm">
                  Please select an image for your quiz
                </p>
              )}
            </div>
          </div>
        </div>
        {quiz.questions.map((q, qIndex) => (
          <div key={q.id || qIndex} className="space-y-2 bg-white p-6 rounded-lg relative shadow-solid border-2 border-black">
            <h3 className='font-bold ml-2 -my-2'>Question</h3>
            <div className="grid md:grid-cols-2 gap-2">
              <div className="flex justify-between items-center">
                <Input
                  type='text'
                  value={q.question}
                  onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                  placeholder="Question"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  type="button" 
                  onClick={() => openImageModal(qIndex)}
                >
                  Select Image
                </Button>
                <Image
                  src={q.imageUrl}
                  alt="Question image preview"
                  width={100}
                  height={100}
                  className="object-cover rounded h-12"
                />
                <Button type="button" 
                  variant="destructive" 
                  onClick={() => deleteQuestion(qIndex)} 
                  size="icon" 
                  className="m-2 w-24 gap-2 p-2"
                >
                  Delete
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {renderQuestionForm(qIndex)}
          </div>
        ))}
        <Button className="mx-6" type="button" onClick={addQuestion}>Add Question</Button>
        <Button type="submit">Update Quiz</Button>
      </form>
      <ImageSelectModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageSelect={handleImageSelect}
      />
    </div>
  )
}