import { getQuestions, createQuestion } from '@/lib/db'
import { QuestionType } from '@/types/question_types'
import { z } from 'zod'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { questionBaseSchema } from '@/lib/schemas'

// Schema for question creation through API
const questionCreateSchema = questionBaseSchema.extend({
  tags: z.array(z.string()).optional(),
  quizId: z.string().optional(),
})

// Schema validation for specific question types
const matchingAnswerSchema = z.array(
  z.object({
    left: z.string(),
    right: z.string(),
  })
)

const sortingAnswerSchema = z.array(z.string())

export async function GET() {
  try {
    const questions = await getQuestions()
    return successResponse(questions)
  } catch (error) {
    return handleApiError(error, 'GET /api/questions')
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate with Zod schema
    const validationResult = questionCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return errorResponse('Invalid question data', validationResult.error.flatten(), 400)
    }
    
    const data = validationResult.data
    
    // Perform type-specific validation
    if (data.type === QuestionType.MATCHING) {
      // For MATCHING, answers should be an array of even length (pairs)
      if (data.answers.length % 2 !== 0) {
        return errorResponse(
          "Invalid matching question", 
          { message: "Matching questions require pairs of items" }, 
          400
        )
      }
      
      // correctAnswer should store the correct pairings as JSON
      try {
        const parsedAnswer = JSON.parse(data.correctAnswer)
        const matchingValidation = matchingAnswerSchema.safeParse(parsedAnswer)
        
        if (!matchingValidation.success) {
          return errorResponse(
            "Invalid matching answer format", 
            matchingValidation.error.flatten(), 
            400
          )
        }
      } catch {
        // Ignore the specific error - just return a readable message
        return errorResponse(
          "Invalid JSON in correctAnswer", 
          { message: "Correct answer must be a valid JSON array of pairs" }, 
          400
        )
      }
    } 
    else if (data.type === QuestionType.SORTING) {
      // For SORTING, correctAnswer should store the correct order
      try {
        const parsedAnswer = JSON.parse(data.correctAnswer)
        const sortingValidation = sortingAnswerSchema.safeParse(parsedAnswer)
        
        if (!sortingValidation.success) {
          return errorResponse(
            "Invalid sorting answer format", 
            sortingValidation.error.flatten(), 
            400
          )
        }
      } catch {
        // Ignore the specific error - just return a readable message
        return errorResponse(
          "Invalid JSON in correctAnswer", 
          { message: "Correct answer must be a valid JSON array" }, 
          400
        )
      }
    }
    
    // Create the question in the database
    const question = await createQuestion(data)
    
    // Return success response
    return successResponse({ question }, 201)
  } catch (error) {
    return handleApiError(error, 'POST /api/questions')
  }
}