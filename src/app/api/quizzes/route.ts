import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, withDatabaseRetry, warmupDatabase, isDatabaseIdle } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { QuestionType } from '@/types/question_types'

// Define Zod Schema for a Question (used in POST)
const QuestionSchema = z.object({
    question: z.string().min(1, "Question text cannot be empty"),
    answers: z.array(z.string().min(1, "Answer text cannot be empty")).min(2, "Must have at least two answers"),
    correctAnswer: z.string().min(1, "Correct answer cannot be empty"),
    imageUrl: z.string().optional(),
    imageFile: z.any().optional(),
    type: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
})

// Define Zod Schema for the POST request data (after parsing FormData)
const QuizCreateSchema = z.object({
    title: z.string().min(1, "Quiz title cannot be empty"),
    quizImageUrl: z.string().optional(),
    quizImageFile: z.any().optional(),
    defaultQuestionType: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
    questions: z.array(QuestionSchema).min(1, "Quiz must have at least one question"),
})

// Placeholder image URL
const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

// Helper type for parsed question data before validation
type ParsedQuestionData = z.infer<typeof QuestionSchema>

// Helper type for parsed quiz data before validation
type ParsedQuizData = z.infer<typeof QuizCreateSchema>

// Add route segment config if needed for dynamic operations like reading request body
export const dynamic = 'force-dynamic'

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

// PUT handler has been moved to [id]/route.ts
// Removed isPrismaError function as it's no longer used here

// --- Need DELETE handler? ---
// Will be implemented when needed, using Prisma client and proper error handling