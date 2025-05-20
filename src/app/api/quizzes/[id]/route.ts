import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { updateQuiz } from '@/lib/db'
import { QuestionType } from '@/types/question_types'
import { Question, Quiz } from "@prisma/client"

// Define Zod Schema for a Question (used in POST/PUT)
const QuestionSchema = z.object({
    id: z.string().optional(), // Optional ID for PUT requests
    question: z.string().min(1, "Question text cannot be empty"),
    answers: z.array(z.string().min(1, "Answer text cannot be empty")).min(2, "Must have at least two answers"),
    correctAnswer: z.string().min(1, "Correct answer cannot be empty"),
    imageUrl: z.string().optional(), // URL after potential upload
    imageFile: z.any().optional(),
    type: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
})

// Define Zod Schema for the POST request data (after parsing FormData)
// QuizCreateSchema is used as a base for QuizUpdateSchema
const QuizCreateSchema = z.object({
    title: z.string().min(1, "Quiz title cannot be empty"),
    quizImageUrl: z.string().optional(),
    quizImageFile: z.any().optional(),
    defaultQuestionType: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
    questions: z.array(QuestionSchema).min(1, "Quiz must have at least one question"),
})

// Define Zod Schema for the PUT request data (after parsing FormData)
const QuizUpdateSchema = QuizCreateSchema.extend({})

// Placeholder image URL
const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

// Helper type for parsed question data before validation
type ParsedQuestionData = z.infer<typeof QuestionSchema>

// Helper type for parsed quiz data before validation
type ParsedQuizData = z.infer<typeof QuizCreateSchema>

// Define a type for the payload expected by the updateQuiz function's questions array
type QuestionPayloadForUpdate = {
  id?: string;
  question: string;
  imageUrl?: string;
  answers: string[];
  correctAnswer: string;
  type: QuestionType;
};

// Add route segment config if needed
export const dynamic = 'force-dynamic';

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
  const { id } = params;
  try {
    // First, delete all questions associated with the quiz
    await prisma.question.deleteMany({
      where: { quizId: id },
    });

    // Then, delete the quiz itself
    const deletedQuiz = await prisma.quiz.delete({
      where: { id },
    }).catch((error: Error & { code?: string }) => {
      if (error.code === 'P2025') {
        return null;
      }
      throw error;
    });

    if (!deletedQuiz) {
      return NextResponse.json({ error: 'Quiz not found', details: { id } }, { status: 404 });
    }

    return NextResponse.json({ message: 'Quiz and associated questions deleted successfully' });
  } catch (error: unknown) {
    console.error(`API Error in DELETE /api/quizzes/${id}:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to delete quiz: ${message}` }, { status: 500 });
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
  const { id } = params;
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: id },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            answers: true,
            correctAnswer: true,
            imageUrl: true,
            type: true,
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found', details: { id } }, { status: 404 });
    }
    
    // Transform to ensure PLACEHOLDER_IMAGE is used
    const quizForApi = {
        ...quiz,
        imageUrl: quiz.imageUrl ?? PLACEHOLDER_IMAGE,
        questions: quiz.questions.map(q => ({
            ...q,
            imageUrl: q.imageUrl ?? PLACEHOLDER_IMAGE
        }))
    };

    return NextResponse.json({ data: quizForApi });
  } catch (error: unknown) {
    console.error(`API Error in GET /api/quizzes/${id}:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to fetch quiz: ${message}` }, { status: 500 });
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
    const { id } = params;
    console.log(`PUT /api/quizzes/${id} - Request received in [id]/route.ts`);

    try {
        if (!id) {
             console.error('PUT /api/quizzes/[id] - Error: Quiz ID is required');
             return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 })
        }
        // Optional: if (isDatabaseIdle()) await warmupDatabase();

        const formData = await request.formData();
        console.log('PUT /api/quizzes/[id] - FormData received');

        const parsedData: Partial<ParsedQuizData> & { questions: Array<Partial<ParsedQuestionData>> } = { 
          questions: [] 
        };
        
        console.log("--- FormData Entries ---");
        for (const [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }
        console.log("------------------------");

        parsedData.title = formData.get('title') as string;
        parsedData.quizImageFile = formData.get('quizImage') as File || undefined;
        parsedData.quizImageUrl = formData.get('quizImageUrl') as string || undefined;
        
        const questionTypeFromForm = formData.get('questionType') as string;
        parsedData.defaultQuestionType = (questionTypeFromForm as QuestionType) || QuestionType.MULTIPLE_CHOICE;

        let i = 0;
        while (formData.has(`questions[${i}][question]`)) {
            const questionData: Partial<ParsedQuestionData> & { id?: string, answers: string[] } = {
              answers: [] 
            };
            
            questionData.id = formData.get(`questions[${i}][id]`) as string || undefined;
            questionData.question = formData.get(`questions[${i}][question]`) as string;
            questionData.correctAnswer = formData.get(`questions[${i}][correctAnswer]`) as string;
            questionData.imageFile = formData.get(`questions[${i}][image]`) as File || undefined;
            questionData.imageUrl = formData.get(`questions[${i}][imageUrl]`) as string || undefined;
            
            const typeFromForm = formData.get(`questions[${i}][type]`) as string;
            questionData.type = typeFromForm in QuestionType 
                ? (typeFromForm as QuestionType) 
                : parsedData.defaultQuestionType;

            const answers: string[] = [];
            let j = 0;
            while (formData.has(`questions[${i}][answers][${j}]`)) {
                const answer = formData.get(`questions[${i}][answers][${j}]`) as string;
                if (answer) {
                    answers.push(answer);
                }
                j++;
            }
            questionData.answers = answers;
            
            parsedData.questions.push(questionData as ParsedQuestionData);
            i++;
        }
        console.log('PUT /api/quizzes/[id] - Parsed FormData for Zod:', JSON.stringify(parsedData, null, 2));

        const validationResult = QuizUpdateSchema.safeParse(parsedData);
        if (!validationResult.success) {
            console.error("PUT /api/quizzes/[id] - Zod Validation Errors:", validationResult.error.flatten());
            return NextResponse.json({ error: "Invalid input data", details: validationResult.error.flatten() }, { status: 400 });
        }
        console.log('PUT /api/quizzes/[id] - Zod validation successful. Validated data:', JSON.stringify(validationResult.data, null, 2));

        const { title: validatedTitle, quizImageFile: validatedQuizImageFile, questions: incomingQuestions } = validationResult.data;
        let finalQuizImageUrl = validationResult.data.quizImageUrl; // This could be existing URL or undefined

        if (validatedQuizImageFile && validatedQuizImageFile instanceof File && validatedQuizImageFile.size > 0) {
            console.log('PUT /api/quizzes/[id] - Uploading updated quiz image file:', validatedQuizImageFile.name);
            try {
                const blob = await put(`quiz-images/${Date.now()}-${validatedQuizImageFile.name}`, validatedQuizImageFile, { access: 'public' });
                finalQuizImageUrl = blob.url;
                console.log('PUT /api/quizzes/[id] - Uploaded updated quiz image URL:', finalQuizImageUrl);
            } catch (uploadError) {
                 console.error('PUT /api/quizzes/[id] - Updated quiz image upload failed:', uploadError);
                 return NextResponse.json({ error: "Quiz image upload failed" }, { status: 500 });
            }
        } else if (!finalQuizImageUrl) { // If no new file and no existing URL, use placeholder
            finalQuizImageUrl = PLACEHOLDER_IMAGE;
        } else {
             console.log('PUT /api/quizzes/[id] - No new quiz image file to upload. Current quizImageUrl:', finalQuizImageUrl);
        }


        console.log('PUT /api/quizzes/[id] - Processing question images. Incoming questions:', JSON.stringify(incomingQuestions, null, 2));
        if (!incomingQuestions || !Array.isArray(incomingQuestions)) {
          console.error('PUT /api/quizzes/[id] - Error: incomingQuestions is not an array or is null/undefined after Zod validation.');
          return NextResponse.json({ error: "Internal server error: question data processing failed after validation." }, { status: 500 });
        }

        const processedQuestions = await Promise.all(incomingQuestions.map(async (q) => {
             if (!q) {
               console.warn('PUT /api/quizzes/[id] - Encountered a null/undefined question object in incomingQuestions during mapping.');
               return null; 
             }
             let questionImageUrl = q.imageUrl; // Existing URL or undefined
             
             if (q.imageFile && q.imageFile instanceof File && q.imageFile.size > 0) {
                 console.log(`PUT /api/quizzes/[id] - Uploading image for question (ID: ${q.id || 'new'}): ${q.question?.substring(0, 20)}...`);
                 try {
                     const blob = await put(`question-images/${Date.now()}-${q.imageFile.name}`, q.imageFile, { access: 'public' });
                     questionImageUrl = blob.url;
                 } catch (uploadError) {
                      console.error(`PUT /api/quizzes/[id] - Error uploading image for question (ID: ${q.id || 'new'}) \"${q.question}\":`, uploadError);
                      questionImageUrl = PLACEHOLDER_IMAGE; 
                 }
             } else if (!questionImageUrl) { // If no new file and no existing URL, use placeholder
                questionImageUrl = PLACEHOLDER_IMAGE;
             } else {
                 console.log(`PUT /api/quizzes/[id] - No new image file for question (ID: ${q.id || 'new'}). Current imageUrl: ${questionImageUrl}`);
             }
             return { ...q, imageUrl: questionImageUrl, imageFile: undefined }; 
        }));
        
        const validProcessedQuestions = processedQuestions.filter(q => q !== null) as ParsedQuestionData[];
        console.log('PUT /api/quizzes/[id] - Processed questions (after image uploads):', JSON.stringify(validProcessedQuestions, null, 2));

        const questionDataForUpdate: QuestionPayloadForUpdate[] = validProcessedQuestions.map((q) => {
          if (!q) {
            console.error('PUT /api/quizzes/[id] - Error: null question object found when mapping to QuestionPayloadForUpdate');
            throw new Error('Encountered null question during final mapping.');
          }
          return {
            id: q.id, 
            question: q.question,
            answers: q.answers,
            correctAnswer: q.correctAnswer,
            imageUrl: q.imageUrl, 
            type: q.type,
          };
        });
        console.log('PUT /api/quizzes/[id] - Data prepared for updateQuiz function:', JSON.stringify(questionDataForUpdate, null, 2));

        const updatedQuizFromDbFunction = await updateQuiz(id, {
          title: validatedTitle,
          imageUrl: finalQuizImageUrl ?? undefined, // Ensure undefined if placeholder was intent
          questions: questionDataForUpdate
        });
        console.log('PUT /api/quizzes/[id] - updateQuiz function successfully returned.');

        if (!updatedQuizFromDbFunction) {
            console.error(`PUT /api/quizzes/[id] - Error: Quiz with ID ${id} not found or update failed (updateQuiz returned null).`);
            return NextResponse.json({ error: `Quiz with ID ${id} not found or update failed.` }, { status: 404 });
        }

        const finalUpdatedQuiz = updatedQuizFromDbFunction as (Quiz & { questions: Question[] });
        const updatedQuizForApi = {
            ...finalUpdatedQuiz,
            imageUrl: finalUpdatedQuiz.imageUrl ?? PLACEHOLDER_IMAGE,
            questions: (finalUpdatedQuiz.questions || []).map((q: Question) => ({
                id: q.id,
                question: q.question,
                answers: q.answers,
                correctAnswer: q.correctAnswer,
                imageUrl: q.imageUrl ?? PLACEHOLDER_IMAGE,
                type: q.type
            }))
        };
        console.log('PUT /api/quizzes/[id] - Successfully updated quiz. Sending response.');
        return NextResponse.json({ data: updatedQuizForApi });

    } catch (error: unknown) { 
        console.error(`PUT /api/quizzes/[id] - Critical error in PUT handler for quiz ${id}:`, error);
        
        if (error instanceof z.ZodError) { 
            return NextResponse.json({ error: "Invalid data structure after parsing.", details: error.flatten() }, { status: 400 });
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error during quiz update.';
        return NextResponse.json({ error: `Failed to update quiz: ${errorMessage}` }, { status: 500 });
    }
}