"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import QuizForm from '@/components/management_ui/forms/QuizForm'
import LoadingSpinner from '@/components/loading_spinner'
import { QuestionType } from '@/types/question_types'

// Interface for the raw question structure from the API response
interface ApiQuestionData {
  id: string; // Assuming ID is always present for fetched questions
  question: string;
  answers: string[];
  correctAnswer: string;
  imageUrl?: string; // API might return it as optional or null
  type: QuestionType;
}

// Interface for the structure of Quiz data expected by QuizForm's initialQuestions prop
interface QuestionDataForForm {
  id?: string; // id is part of QuestionDataForForm, used by QuizForm
  question: string;
  answers: string[];
  correctAnswer: string;
  imageUrl: string; // QuizForm expects a string, handles placeholder
  type: QuestionType;
}

// Expanded interface for the Quiz data fetched and managed on this page
interface QuizDataForEditPage {
  id: string;
  title: string;
  description?: string; // Added
  imageUrl: string;
  quizType: QuestionType; // Added - overall quiz type
  tags?: string[];      // Added
  questions: QuestionDataForForm[];
  // coverImageFile?: File | null; // To track if user picks a new file in this form context (QuizForm handles its own submission file)
}

export default function EditQuizPage() {
  const params = useParams(); // Get route params
  const quizId = params.id as string; // Assuming id is always a string

  const [quizData, setQuizData] = useState<QuizDataForEditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        // USER NOTE: Ensure GET /api/quizzes/[id] returns description, quizType, tags
        const response = await fetch(`/api/quizzes/${quizId}`);
        if (response.ok) {
          const apiResponse = await response.json(); // Expecting { data: { id, title, ... } }
          const rawQuizData = apiResponse.data;

          // Transform API data to the structure needed by the page and QuizForm
          const transformedData: QuizDataForEditPage = {
            id: rawQuizData.id,
            title: rawQuizData.title,
            description: rawQuizData.description, // Added
            imageUrl: rawQuizData.imageUrl || '/images/placeholder.webp',
            quizType: rawQuizData.quizType || QuestionType.MULTIPLE_CHOICE, // Added, provide default
            tags: rawQuizData.tags || [], // Added, provide default
            questions: rawQuizData.questions.map((q: ApiQuestionData) => ({ // Use ApiQuestionData here
              id: q.id,
              question: q.question,
              answers: q.answers,
              correctAnswer: q.correctAnswer,
              imageUrl: q.imageUrl || '/images/placeholder.webp',
              type: q.type, // Assuming question type from API is already QuestionType enum
            })),
          };
          setQuizData(transformedData);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch quiz');
          console.error('Failed to fetch quiz:', errorData);
        }
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('An unexpected error occurred while fetching the quiz.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // Callback for QuizForm if it changes the quiz cover image
  // This updates the local state for consistency if other UI elements on this page were to use it.
  // QuizForm itself handles the image file for submission using its internal state.
  const handleQuizCoverImageChange = (newImageUrl: string /*, newImageFile?: File | null */) => {
    setQuizData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        imageUrl: newImageUrl,
        // coverImageFile: newImageFile || null, // Not strictly needed here if QuizForm manages its own file for submission
      };
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Quiz data could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center grandstander">
        Edit Quiz: {quizData.title}
      </h1>
      <QuizForm
        quizId={quizData.id}
        // Pass all required props from the fetched and transformed quizData
        quizTitle={quizData.title}
        quizDescription={quizData.description}
        quizCoverImageUrl={quizData.imageUrl}
        quizOverallType={quizData.quizType}
        quizTags={quizData.tags}
        initialQuestions={quizData.questions}
        onQuizCoverImageChange={handleQuizCoverImageChange}
      />
    </div>
  );
}