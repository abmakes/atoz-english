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

    return successResponse(quiz);
  } catch (error) {
    return handleApiError(error, `GET /api/quizzes/${params.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

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