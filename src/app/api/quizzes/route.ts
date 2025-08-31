import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, withDatabaseRetry, warmupDatabase, isDatabaseIdle } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { QuestionType } from '@/types/question_types'
import { Quiz as ITQuiz, Question as ITQuestion } from '@/types'
import { Prisma } from '../../../../prisma/app/generated/prisma/client'
// Define Zod Schema for a Question (used in POST)
const QuestionSchema = z.object({
    question: z.string().min(1, "Question text cannot be empty"),
    answers: z.array(z.string().min(1, "Answer text cannot be empty")).min(2, "Must have at least two answers"),
    correctAnswer: z.string().min(1, "Correct answer cannot be empty"),
    imageUrl: z.string().optional(),
    imageFile: z.any().optional(),
    type: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
})

// Updated Zod Schema for the POST request data (after parsing FormData)
const QuizCreateSchema = z.object({
    title: z.string().min(1, "Quiz title cannot be empty"),
    description: z.string().optional(),
    quizImageUrl: z.string().optional(),
    quizImageFile: z.any().optional(),
    quizType: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
    tags: z.array(z.string()).optional(),
    questions: z.array(QuestionSchema).min(1, "Quiz must have at least one question"),
    statistics: z.any().optional(),
    defaultSettings: z.any().optional(),
    authorId: z.string().default("admin"),
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
    const selectArgs: Prisma.QuizSelect = {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        quizType: true,
        tags: true,
        statistics: true,
        defaultSettings: true,
        authorId: true,
        questions: {
          select: {
            id: true,
            question: true,
            answers: true,
            correctAnswer: true,
            imageUrl: true,
            type: true,
            quizId: true,
          }
        },
        createdAt: true,
        updatedAt: true,
    };
    const quizzesFromDb = await withDatabaseRetry(() =>
      prisma.quiz.findMany({
        select: selectArgs
      }), 'Fetching quizzes')

    const quizzesForApi: ITQuiz[] = quizzesFromDb.map(quiz => {
        const currentQuiz = quiz as unknown as ITQuiz; 
        return {
          ...currentQuiz,
          imageUrl: currentQuiz.imageUrl ?? PLACEHOLDER_IMAGE,
          statistics: currentQuiz.statistics ?? { favoritesCount: 0, playsCount: 0, likes: 0 },
          tags: currentQuiz.tags ?? [],
          authorId: currentQuiz.authorId ?? "admin",
          createdAt: currentQuiz.createdAt ?? new Date(),
          questions: (currentQuiz.questions || []).map(q => ({
            ...q,
            imageUrl: q.imageUrl ?? PLACEHOLDER_IMAGE
        }))
    }})

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
    if (isDatabaseIdle()) await warmupDatabase() 

    const formData = await request.formData()
    const parsedData: Partial<ParsedQuizData> & { questions: Array<Partial<ParsedQuestionData>> } = { 
      questions: [] 
    }

    parsedData.title = formData.get('title') as string
    parsedData.description = formData.get('description') as string || undefined
    parsedData.quizImageFile = formData.get('quizImageFile') as File || undefined
    parsedData.quizImageUrl = formData.get('quizImageUrl') as string || undefined
    
    const quizTypeFromForm = formData.get('quizType') as string
    parsedData.quizType = quizTypeFromForm in QuestionType 
      ? (quizTypeFromForm as QuestionType) 
      : QuestionType.MULTIPLE_CHOICE

    parsedData.authorId = formData.get('authorId') as string || "admin";
    
    const statisticsString = formData.get('statistics') as string;
    if (statisticsString) {
      try {
        parsedData.statistics = JSON.parse(statisticsString);
      } catch (e) {
        console.warn('Failed to parse statistics JSON string from FormData', e);
        parsedData.statistics = undefined;
      }
    } else {
      parsedData.statistics = undefined;
    }

    const defaultSettingsString = formData.get('defaultSettings') as string;
    if (defaultSettingsString) {
      try {
        parsedData.defaultSettings = JSON.parse(defaultSettingsString);
      } catch (e) {
        console.warn('Failed to parse defaultSettings JSON string from FormData', e);
        parsedData.defaultSettings = undefined;
      }
    } else {
      parsedData.defaultSettings = undefined;
    }

    const tagsFromForm = formData.getAll('tags[]')
    if (tagsFromForm && tagsFromForm.length > 0 && (tagsFromForm[0] !== 'undefined')) {
        parsedData.tags = tagsFromForm.map(tag => String(tag))
    } else {
        parsedData.tags = [] 
    }

    for (let i = 0; ; i++) {
        const questionKey = `questions[${i}][question]`
        if (!formData.has(questionKey)) break 

        const questionData: Partial<ParsedQuestionData> = {
          answers: [] 
        }
        questionData.question = formData.get(questionKey) as string
        questionData.correctAnswer = formData.get(`questions[${i}][correctAnswer]`) as string
        questionData.imageFile = formData.get(`questions[${i}][imageFile]`) as File || undefined
        questionData.imageUrl = formData.get(`questions[${i}][imageUrl]`) as string || undefined
        
        const typeFromForm = formData.get(`questions[${i}][type]`) as string;
        questionData.type = typeFromForm in QuestionType 
            ? (typeFromForm as QuestionType) 
            : parsedData.quizType;

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

    const validationResult = QuizCreateSchema.safeParse(parsedData)
    if (!validationResult.success) {
      console.error("Validation Errors:", validationResult.error.errors)
      return NextResponse.json({ error: "Invalid input data", details: validationResult.error.flatten() }, { status: 400 })
    }

    const validatedData = validationResult.data as ParsedQuizData; 
    let finalQuizImageUrl = validatedData.quizImageUrl || PLACEHOLDER_IMAGE;

    if (validatedData.quizImageFile && validatedData.quizImageFile instanceof File && validatedData.quizImageFile.size > 0) {
        console.log('Uploading quiz image file:', validatedData.quizImageFile.name)
        try {
            const blob = await put(`quiz-images/${Date.now()}-${validatedData.quizImageFile.name}`, validatedData.quizImageFile, { access: 'public' })
            finalQuizImageUrl = blob.url
            console.log('Uploaded quiz image URL:', finalQuizImageUrl)
        } catch (uploadError) {
            console.error('Quiz image upload failed:', uploadError)
            return NextResponse.json({ error: "Quiz image upload failed" }, { status: 500 })
        }
    }

    const questionsToCreate = await Promise.all(validatedData.questions.map(async (q: ParsedQuestionData) => {
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
        return {
            question: q.question,
            answers: q.answers,
            correctAnswer: q.correctAnswer,
            imageUrl: finalQuestionImageUrl,
            type: q.type,
        }
    }))

    const createData: Prisma.QuizCreateInput = {
        title: validatedData.title,
        description: validatedData.description || null,
        imageUrl: finalQuizImageUrl,
        quizType: validatedData.quizType,
        tags: validatedData.tags || [],
        statistics: validatedData.statistics || Prisma.JsonNull,
        defaultSettings: validatedData.defaultSettings || Prisma.JsonNull,
        authorId: validatedData.authorId, // authorId has a default in Zod schema
        questions: {
          create: questionsToCreate,
        },
    };

    const createdQuiz = await withDatabaseRetry(async () =>
      prisma.quiz.create({
        data: createData,
        include: { 
            questions: {
                select: {
                    id: true,
                    question: true,
                    answers: true,
                    correctAnswer: true,
                    imageUrl: true,
                    type: true,
                    quizId: true,
                }
            }
        },
      }), 'Creating quiz')

    console.log('Created quiz:', createdQuiz.id)
    
    const createdQuizTyped = createdQuiz as unknown as ITQuiz; 
    const createdQuizForApi: ITQuiz = {
        ...createdQuizTyped,
        imageUrl: createdQuizTyped.imageUrl ?? PLACEHOLDER_IMAGE,
        questions: (createdQuizTyped.questions || []).map((q: ITQuestion) => ({ 
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