"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QuizEditor from '@/components/management_ui/QuizEditor'
import LoadingSpinner from '@/components/loading_spinner'
import { QuestionType } from '@/types/question_types'
import type { Question, QuizSettingsData } from '@/components/management_ui/QuizEditor'

// Interface for the raw question structure from the API response
interface ApiQuestionData {
  id: string; // Assuming ID is always present for fetched questions
  question: string;
  answers: string[];
  correctAnswer: string;
  imageUrl?: string; // API might return it as optional or null
  type: QuestionType;
}

// Interface for the structure of Quiz data expected by QuizEditor
interface QuizDataForEditPage {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  quizType: QuestionType;
  tags?: string[];
  questions: Question[];
  defaultSettings?: QuizSettingsData;
}

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quizData, setQuizData] = useState<QuizDataForEditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        // USER NOTE: Ensure GET /api/quizzes/[id] returns description, quizType, tags, defaultSettings
        const response = await fetch(`/api/quizzes/${quizId}`);
        if (response.ok) {
          const apiResponse = await response.json(); // Expecting { data: { id, title, ... } }
          const rawQuizData = apiResponse.data;

          // Transform API data to the structure needed by QuizEditor
          const transformedData: QuizDataForEditPage = {
            id: rawQuizData.id,
            title: rawQuizData.title,
            description: rawQuizData.description,
            imageUrl: rawQuizData.imageUrl || '/images/placeholder.webp',
            quizType: rawQuizData.quizType || QuestionType.MULTIPLE_CHOICE,
            tags: rawQuizData.tags || [],
            questions: rawQuizData.questions.map((q: ApiQuestionData) => ({
              id: q.id,
              question: q.question,
              answers: q.answers,
              correctAnswer: q.correctAnswer,
              imageUrl: q.imageUrl || '/images/placeholder.webp',
              type: q.type,
              imageFile: null, // Initially null for editing
            })),
            defaultSettings: rawQuizData.defaultSettings || {
              theme: 'default',
              powerUps: [],
              gameMode: 'basic',
              guessOptions: 'zero',
              timeLimit: 'ten',
              music: true,
              soundEffects: true,
            },
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

  const handleSuccess = (updatedQuizId: string) => {
    // Redirect to the quiz view or list after successful update
    router.push(`/games/${updatedQuizId}`);
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

  // Transform the data to match QuizEditor's expected format
  const initialData = {
    quizSetup: {
      title: quizData.title,
      description: quizData.description || '',
      coverImageUrl: quizData.imageUrl,
      coverImageFile: null,
      quizType: quizData.quizType,
      tags: quizData.tags || [],
    },
    questions: quizData.questions,
    settings: quizData.defaultSettings || {
      theme: 'default',
      powerUps: [],
      gameMode: 'basic',
      guessOptions: 'zero',
      timeLimit: 'ten',
      music: true,
      soundEffects: true,
    },
  };

  return (
    <QuizEditor 
      mode="edit"
      quizId={quizData.id}
      initialData={initialData}
      onSuccess={handleSuccess}
    />
  );
}