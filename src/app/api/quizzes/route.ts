import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, withDatabaseRetry, warmupDatabase, isDatabaseIdle } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { updateQuiz } from '@/lib/db'
import { QuestionType } from '@/types/question_types'

// Define Zod Schema for a Question (used in POST/PUT)
const QuestionSchema = z.object({
    id: z.string().optional(), // Optional ID for PUT requests
    question: z.string().min(1, "Question text cannot be empty"),
    answers: z.array(z.string().min(1, "Answer text cannot be empty")).min(2, "Must have at least two answers"),
    correctAnswer: z.string().min(1, "Correct answer cannot be empty"),
    imageUrl: z.string().optional(), // URL after potential upload
    imageFile: z.any().optional(), // Changed from z.instanceof(File)
    type: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
})

// Define Zod Schema for the POST request data (after parsing FormData)
const QuizCreateSchema = z.object({
    title: z.string().min(1, "Quiz title cannot be empty"),
    quizImageUrl: z.string().optional(),
    quizImageFile: z.any().optional(), // Changed from z.instanceof(File)
    defaultQuestionType: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
    questions: z.array(QuestionSchema).min(1, "Quiz must have at least one question"),
})

// Define Zod Schema for the PUT request data (after parsing FormData)
const QuizUpdateSchema = QuizCreateSchema.extend({
    // PUT needs the quiz ID from the URL params, not in the body typically
    // Questions might have IDs to indicate updates vs creations
})

// Placeholder image URL
const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

// Helper type for parsed question data before validation
type ParsedQuestionData = z.infer<typeof QuestionSchema>

// Helper type for parsed quiz data before validation
type ParsedQuizData = z.infer<typeof QuizCreateSchema>

// Add route segment config if needed for dynamic operations like reading request body
export const dynamic = 'force-dynamic'

// Define a type for the payload expected by the legacy updateQuiz function's questions array
// Explicitly define fields, making id optional and excluding tags/quizId
type QuestionPayloadForUpdate = {
  id?: string; // Optional ID for updates
  question: string;
  imageUrl?: string;
  answers: string[];
  correctAnswer: string;
  type: QuestionType;
};

export async function GET() {
  console.log('GET /api/quizzes')
  try {
    const quizzes = await withDatabaseRetry(() =>
      prisma.quiz.findMany({
        select: {
          id: true,
          title: true,
          imageUrl: true,
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
      }), 'Fetching quizzes')

    // No transformation needed if GET output matches desired structure (no tags)
    // Add placeholder mapping if necessary
    const quizzesForApi = quizzes.map(quiz => ({
        ...quiz,
        imageUrl: quiz.imageUrl ?? PLACEHOLDER_IMAGE,
        questions: quiz.questions.map(q => ({
            ...q,
            imageUrl: q.imageUrl ?? PLACEHOLDER_IMAGE
        }))
    }))

    return NextResponse.json({ data: quizzesForApi })
  } catch (error) {
    console.error('Failed to fetch quizzes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to fetch quizzes: ${errorMessage}` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log('POST /api/quizzes')
  try {
    if (isDatabaseIdle()) await warmupDatabase() // Warmup if needed

    const formData = await request.formData()
    const parsedData: Partial<ParsedQuizData> & { questions: Array<Partial<ParsedQuestionData>> } = { 
      questions: [] 
    }

    // --- Parse FormData into structured object ---
    parsedData.title = formData.get('title') as string
    parsedData.quizImageFile = formData.get('quizImage') as File || undefined
    parsedData.quizImageUrl = formData.get('quizImageUrl') as string || undefined
    
    // Convert string to enum value
    const questionTypeFromForm = formData.get('questionType') as string;
    // Handle the case when questionTypeFromForm is either not provided or invalid
    parsedData.defaultQuestionType = questionTypeFromForm in QuestionType 
      ? (questionTypeFromForm as QuestionType) 
      : QuestionType.MULTIPLE_CHOICE;

    for (let i = 0; ; i++) {
        const questionKey = `questions[${i}][question]`
        if (!formData.has(questionKey)) break // Exit loop when no more questions

        const questionData: Partial<ParsedQuestionData> = {
          answers: [] // Initialize answers array
        }
        questionData.question = formData.get(questionKey) as string
        questionData.correctAnswer = formData.get(`questions[${i}][correctAnswer]`) as string
        questionData.imageFile = formData.get(`questions[${i}][image]`) as File || undefined
        questionData.imageUrl = formData.get(`questions[${i}][imageUrl]`) as string || undefined
        
        // Convert string to enum value safely
        const typeFromForm = formData.get(`questions[${i}][type]`) as string;
        questionData.type = typeFromForm in QuestionType 
            ? (typeFromForm as QuestionType) 
            : parsedData.defaultQuestionType;

        // Collect answers
        const answers: string[] = [];
        for (let j = 0; ; j++) {
            const answerKey = `questions[${i}][answers][${j}]`
            if (!formData.has(answerKey)) break
            const answer = formData.get(answerKey) as string
            if (answer) {
                answers.push(answer)
            }
        }
        questionData.answers = answers;
        
        parsedData.questions.push(questionData as ParsedQuestionData)
    }

    // --- Validate the parsed object with Zod ---
    const validationResult = QuizCreateSchema.safeParse(parsedData)
    if (!validationResult.success) {
      console.error("Validation Errors:", validationResult.error.errors)
      return NextResponse.json({ error: "Invalid input data", details: validationResult.error.flatten() }, { status: 400 })
    }

    const { title, quizImageFile, questions } = validationResult.data
    let finalQuizImageUrl = validationResult.data.quizImageUrl || PLACEHOLDER_IMAGE

    // --- Handle Quiz Image Upload ---
    if (quizImageFile && quizImageFile instanceof File && quizImageFile.size > 0) {
        console.log('Uploading quiz image file:', quizImageFile.name)
        try {
            const blob = await put(`quiz-images/${Date.now()}-${quizImageFile.name}`, quizImageFile, { access: 'public' })
            finalQuizImageUrl = blob.url
            console.log('Uploaded quiz image URL:', finalQuizImageUrl)
        } catch (uploadError) {
            console.error('Quiz image upload failed:', uploadError)
            return NextResponse.json({ error: "Quiz image upload failed" }, { status: 500 })
        }
    }

    // --- Handle Question Image Uploads and Prepare Prisma Data ---
    const questionsToCreate = await Promise.all(questions.map(async (q: ParsedQuestionData) => {
        let finalQuestionImageUrl = q.imageUrl || PLACEHOLDER_IMAGE
        
        if (q.imageFile && q.imageFile instanceof File && q.imageFile.size > 0) {
            console.log(`Uploading image for question: ${q.question.substring(0, 20)}...`)
            try {
                const blob = await put(`question-images/${Date.now()}-${q.imageFile.name}`, q.imageFile, { access: 'public' })
                finalQuestionImageUrl = blob.url
                console.log(`Uploaded image URL for question: ${finalQuestionImageUrl}`)
            } catch (uploadError) {
                console.error(`Error uploading image for question "${q.question}":`, uploadError)
                finalQuestionImageUrl = PLACEHOLDER_IMAGE
            }
        }

        // Ensure tags are NOT prepared for Prisma create
        return {
            question: q.question,
            answers: q.answers,
            correctAnswer: q.correctAnswer,
            imageUrl: finalQuestionImageUrl,
            type: q.type,
        }
    }))

    // --- Create Quiz in Database ---
    const createdQuiz = await withDatabaseRetry(async () =>
      prisma.quiz.create({
        data: {
          title,
          imageUrl: finalQuizImageUrl,
          questions: {
            create: questionsToCreate,
          },
        },
        include: {
            questions: {
                select: {
                    id: true,
                    question: true,
                    answers: true,
                    correctAnswer: true,
                    imageUrl: true,
                    type: true
                }
            }
        },
      }), 'Creating quiz')

    console.log('Created quiz:', createdQuiz.id)
     // Add placeholder mapping if necessary
    const createdQuizForApi = {
        ...createdQuiz,
        imageUrl: createdQuiz.imageUrl ?? PLACEHOLDER_IMAGE,
        questions: createdQuiz.questions.map(q => ({
            ...q,
            imageUrl: q.imageUrl ?? PLACEHOLDER_IMAGE
        }))
    }
    return NextResponse.json({ data: createdQuizForApi }, { status: 201 })

  } catch (error) {
    console.error('Failed to create quiz:', error)
    if (error instanceof z.ZodError) {
       return NextResponse.json({ error: "Invalid data structure after parsing." }, { status: 400 })
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error'
    return NextResponse.json({ error: `Failed to create quiz: ${errorMessage}` }, { status: 500 })
  }
}

// NOTE: This PUT handler needs significant work to implement the update logic correctly.
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const quizId = params.id
    console.log(`PUT /api/quizzes/${quizId}`)

    try {
        if (!quizId) {
             return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 })
        }
        if (isDatabaseIdle()) await warmupDatabase() // Warmup if needed

        const formData = await request.formData()

        // --- Parse FormData into structured object (similar to POST) ---
        const parsedData: Partial<ParsedQuizData> & { questions: Array<Partial<ParsedQuestionData>> } = { 
          questions: [] 
        }
        
        parsedData.title = formData.get('title') as string
        parsedData.quizImageFile = formData.get('quizImage') as File || undefined
        parsedData.quizImageUrl = formData.get('quizImageUrl') as string || undefined
        
        // Use our string literal type for QuestionType
        const questionTypeFromForm = formData.get('questionType') as string;
        parsedData.defaultQuestionType = (questionTypeFromForm as QuestionType) || 'MULTIPLE_CHOICE'

        for (let i = 0; ; i++) {
            const questionKey = `questions[${i}][question]`
            if (!formData.has(questionKey)) break // Exit loop

            const questionData: Partial<ParsedQuestionData> = {
              answers: [] // Initialize answers array
            }
            
            // *** Crucially, parse the ID for PUT requests ***
            questionData.id = formData.get(`questions[${i}][id]`) as string || undefined
            questionData.question = formData.get(questionKey) as string
            questionData.correctAnswer = formData.get(`questions[${i}][correctAnswer]`) as string
            questionData.imageFile = formData.get(`questions[${i}][image]`) as File || undefined
            questionData.imageUrl = formData.get(`questions[${i}][imageUrl]`) as string || undefined
            // Ensure tagsString is NOT parsed here

            // Convert string to enum value safely
            const typeFromForm = formData.get(`questions[${i}][type]`) as string;
            questionData.type = typeFromForm in QuestionType 
                ? (typeFromForm as QuestionType) 
                : parsedData.defaultQuestionType;

            // Collect answers
            const answers: string[] = [];
            for (let j = 0; ; j++) {
                const answerKey = `questions[${i}][answers][${j}]`
                if (!formData.has(answerKey)) break
                const answer = formData.get(answerKey) as string
                if (answer) {
                    answers.push(answer)
                }
            }
            questionData.answers = answers;
            
            parsedData.questions.push(questionData as ParsedQuestionData)
        }

        // --- Validate the parsed object with Zod ---
        const validationResult = QuizUpdateSchema.safeParse(parsedData)
        if (!validationResult.success) {
            console.error("Validation Errors:", validationResult.error.errors)
            return NextResponse.json({ error: "Invalid input data", details: validationResult.error.flatten() }, { status: 400 })
        }

        const { title, quizImageFile, questions: incomingQuestions } = validationResult.data
        let finalQuizImageUrl = validationResult.data.quizImageUrl

        // --- Handle Quiz Image Upload (if new file provided) ---
        if (quizImageFile && quizImageFile instanceof File && quizImageFile.size > 0) {
            console.log('Uploading updated quiz image file:', quizImageFile.name)
            try {
                const blob = await put(`quiz-images/${Date.now()}-${quizImageFile.name}`, quizImageFile, { access: 'public' })
                finalQuizImageUrl = blob.url
                console.log('Uploaded updated quiz image URL:', finalQuizImageUrl)
            } catch (uploadError) {
                 console.error('Updated quiz image upload failed:', uploadError)
                 return NextResponse.json({ error: "Quiz image upload failed" }, { status: 500 })
            }
        }

        // --- Handle Question Image Uploads (for new/updated questions) ---
        const processedQuestions = await Promise.all(incomingQuestions.map(async (q: ParsedQuestionData) => {
             let questionImageUrl = q.imageUrl || PLACEHOLDER_IMAGE
             
             if (q.imageFile && q.imageFile instanceof File && q.imageFile.size > 0) {
                 console.log(`Uploading image for question (update/create): ${q.question?.substring(0, 20)}...`)
                 try {
                     const blob = await put(`question-images/${Date.now()}-${q.imageFile.name}`, q.imageFile, { access: 'public' })
                     questionImageUrl = blob.url
                 } catch (uploadError) {
                      console.error(`Error uploading image for question "${q.question}":`, uploadError)
                      questionImageUrl = PLACEHOLDER_IMAGE
                 }
             }
             return { ...q, imageUrl: questionImageUrl }
        }))

        // --- Map to format for legacy updateQuiz --- 
        // Use the correctly defined QuestionPayloadForUpdate type
        const questionDataForUpdate: QuestionPayloadForUpdate[] = processedQuestions.map((q: ParsedQuestionData) => ({
          id: q.id, // This is now correctly typed as optional
          question: q.question,
          answers: q.answers,
          correctAnswer: q.correctAnswer,
          imageUrl: q.imageUrl, // Already handled placeholder above
          type: q.type,
        }));

        // --- Use the legacy updateQuiz function --- 
        const updatedQuiz = await updateQuiz(quizId, {
          title,
          imageUrl: finalQuizImageUrl ?? undefined,
          questions: questionDataForUpdate
        });

        // --- Handle potential null result from updateQuiz --- 
        if (!updatedQuiz) {
            return NextResponse.json({ error: `Quiz with ID ${quizId} not found or update failed.` }, { status: 404 });
        }

        // --- Transform result --- 
        // Now safe to access updatedQuiz properties
        const updatedQuizForApi = {
            ...updatedQuiz,
            imageUrl: updatedQuiz.imageUrl ?? PLACEHOLDER_IMAGE,
            // Assuming updatedQuiz.questions exists and might have different structure
            questions: (updatedQuiz.questions || []).map((q) => ({
                id: q.id,
                question: q.question,
                answers: q.answers,
                correctAnswer: q.correctAnswer,
                imageUrl: q.imageUrl ?? PLACEHOLDER_IMAGE,
                type: q.type
                // Ensure no tags included
            }))
        }

        return NextResponse.json({ data: updatedQuizForApi });

    } catch (error) {
        console.error(`Failed to update quiz ${quizId}:`, error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid data structure after parsing.", details: error.flatten() }, { status: 400 })
        }
        
        // Check for Prisma's "not found" error - using our interface
        if (error instanceof Error && error.name === 'PrismaClientKnownRequestError' && isPrismaError(error)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            if ((error as any).code === 'P2025') {
                return NextResponse.json({ error: `Quiz with ID ${quizId} not found.` }, { status: 404 })
            }
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error'
        return NextResponse.json({ error: `Failed to update quiz: ${errorMessage}` }, { status: 500 })
    }
}

// Simple Prisma error check
function isPrismaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  return typeof (error as any).code === 'string';
}

// --- Need DELETE handler? ---
// Will be implemented when needed, using Prisma client and proper error handling