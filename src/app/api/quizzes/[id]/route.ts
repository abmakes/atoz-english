import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { QuestionType } from '@/types/question_types'

interface QuestionData {
  id?: string
  question: string
  answers: string[]
  correctAnswer: string
  imageUrl?: string
  imageFile?: File
  type?: QuestionType
}

/**
 * Handles DELETE requests to remove a specific quiz and its associated questions.
 * @param request - The NextRequest object (unused).
 * @param params - Object containing the dynamic route parameter `id` (quiz ID).
 * @returns A success or error response.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // First, delete all questions associated with the quiz
    await prisma.question.deleteMany({
      where: { quizId: id },
    });

    // Then, delete the quiz itself
    const deletedQuiz = await prisma.quiz.delete({
      where: { id },
    }).catch((error: Error & { code?: string }) => {
      // Handle "not found" errors with a specific message
      if (error.code === 'P2025') {
        return null;
      }
      throw error;
    });

    if (!deletedQuiz) {
      return errorResponse('Quiz not found', { id }, 404);
    }

    return successResponse({ message: 'Quiz and associated questions deleted successfully' });
  } catch (error) {
    return handleApiError(error, `DELETE /api/quizzes/${params.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Handles GET requests to fetch a specific quiz by its ID, including its questions and tags.
 * @param request - The Request object (unused).
 * @param params - Object containing the dynamic route parameter `id` (quiz ID).
 * @returns A success response with the quiz data or an error response if not found.
 */
export async function GET(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: {
            tags: true
          }
        }
      }
    });

    if (!quiz) {
      return errorResponse('Quiz not found', { id: params.id }, 404);
    }

    // console.log("Raw Quiz Data from Prisma:", JSON.stringify(quiz, null, 2));

    return successResponse(quiz);
  } catch (error) {
    return handleApiError(error, `GET /api/quizzes/${params.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Handles PUT requests to update a specific quiz and its questions.
 * Expects multipart/form-data with quiz title, questions JSON,
 * and optional image files for the quiz and individual questions.
 * @param request - The Request object containing form data.
 * @param params - Object containing the dynamic route parameter `id` (quiz ID).
 * @returns A success response with the updated quiz data or an error response.
 */
export async function PUT(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const questions: QuestionData[] = JSON.parse(formData.get('questions') as string);

    // Handle image uploads first
    const quizImageUrl = await handleQuizImageUpload(formData, params.id);
    const updatedQuestions = await handleQuestionImageUploads(questions, formData);

    // Optimized update flow
    const startTime = Date.now();
    console.log('Starting quiz update process');

    // Update quiz metadata first
    const updatedQuiz = await prisma.quiz.update({
      where: { id: params.id },
      data: {
        title,
        imageUrl: quizImageUrl,
      },
    });

    // Batch process questions
    const existingQuestions = await prisma.question.findMany({
      where: { quizId: params.id },
      select: { id: true }
    });

    // Delete removed questions
    const questionsToDelete = existingQuestions.filter((eq: { id: string }) => 
      !updatedQuestions.some(uq => uq.id === eq.id)
    );
    await prisma.question.deleteMany({
      where: { id: { in: questionsToDelete.map((q: { id: string }) => q.id) } }
    });

    // Batch upsert questions
    const questionUpdates = updatedQuestions.map(q => ({
      where: { id: q.id || '' },
      update: {
        question: q.question,
        answers: q.answers,
        correctAnswer: q.correctAnswer,
        imageUrl: q.imageUrl,
        type: q.type
      },
      create: {
        question: q.question,
        answers: q.answers,
        correctAnswer: q.correctAnswer,
        imageUrl: q.imageUrl,
        type: q.type || QuestionType.MULTIPLE_CHOICE,
        quizId: params.id
      }
    }));

    const updatedQuestionData = await prisma.$transaction(
      questionUpdates.map(update => 
        prisma.question.upsert({
          where: { id: update.where.id },
          update: update.update,
          create: update.create
        })
      )
    );

    console.log(`Update completed in ${Date.now() - startTime}ms`);
    return successResponse({
      ...updatedQuiz,
      questions: updatedQuestionData
    });
  } catch (error) {
    return handleApiError(error, `PUT /api/quizzes/${params.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Handles the upload of the main quiz image file if provided in the form data.
 * @param formData - The FormData object from the request.
 * @param quizId - The ID of the quiz being updated.
 * @returns The URL of the uploaded image or the existing URL if no new file was provided.
 */
async function handleQuizImageUpload(formData: FormData, quizId: string): Promise<string> {
  const quizImageFile = formData.get('quizImage') as File | null;
  const currentImageUrl = formData.get('quizImageUrl') as string;

  if (quizImageFile instanceof File && quizImageFile.size > 0) {
    const blob = await put(`quiz-images/${quizId}/${quizImageFile.name}`, quizImageFile, {
      access: 'public',
    });
    return blob.url;
  }

  return currentImageUrl;
}

/**
 * Handles the upload of image files for individual questions if provided in the form data.
 * Matches files like `questions[0][image]`, `questions[1][image]`, etc.
 * @param questions - The array of question data parsed from the form data.
 * @param formData - The FormData object from the request.
 * @returns The updated array of question data with uploaded image URLs.
 */
async function handleQuestionImageUploads(questions: QuestionData[], formData: FormData): Promise<QuestionData[]> {
  return await Promise.all(questions.map(async (q, index) => {
    const imageFile = formData.get(`questions[${index}][image]`) as File | null;
    if (imageFile instanceof File && imageFile.size > 0) {
      const blob = await put(`question-images/${imageFile.name}`, imageFile, {
        access: 'public',
      });
      return { ...q, imageUrl: blob.url };
    }
    return q;
  }));
}