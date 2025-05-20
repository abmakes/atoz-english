import { NextRequest } from 'next/server';
import { parse } from 'csv-parse/sync';
import { prisma, withDatabaseRetry, updateLastAccessTime } from '@/lib/prisma';
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils';
import { parseFormData } from '@/lib/formDataUtils';
import { csvRowSchema, csvUploadSchema, CsvRowInput } from '@/lib/schemas';
import { QuestionType } from '@/types/question_types';

// Define the placeholder image path
const PLACEHOLDER_IMAGE = '/images/placeholder.webp';

// Expected shape of data after csvUploadSchema is updated by the user
interface ExpectedCsvUploadData {
  title: string;
  csv: File;
  description?: string;
  quizCoverImageUrl?: string;
  quizType?: QuestionType | string; // From FormData, could be string before enum conversion
  tags?: string[];
  // Include other fields from original csvUploadSchema if any (e.g., from Zod effects)
}

// Define an extended CsvRowInput for use within this route, assuming user updates csvRowSchema
interface ExtendedCsvRowInput extends CsvRowInput {
  type?: string; // Optional: type for individual question from CSV
  imageUrl?: string; // Optional: imageUrl for individual question from CSV
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // USER NOTE: Update csvUploadSchema in @/lib/schemas.ts for: description, quizCoverImageUrl, quizType, tags.
    const formDataResult = await parseFormData(formData, csvUploadSchema);
    
    if (!formDataResult.success) {
      return errorResponse('Invalid form data', formDataResult.error.flatten(), 400);
    }
    
    const { 
      title, 
      csv: file, 
      description, 
      quizCoverImageUrl, 
      quizType,     
      tags              
    } = formDataResult.data as ExpectedCsvUploadData;

    // Convert file to CSV string
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const csvString = buffer.toString('utf-8');
    
    // USER NOTE: Update csvRowSchema in @/lib/schemas.ts to optionally include 'type' and 'imageUrl' columns.
    const content = parse(csvString, { columns: true, skip_empty_lines: true }) as ExtendedCsvRowInput[];

    // Validate each row in the CSV
    const validationErrors = [];
    for (let i = 0; i < content.length; i++) {
      const row = content[i];
      // Validate against the original csvRowSchema. User needs to add new fields there for full validation.
      const rowResult = csvRowSchema.safeParse(row);
      if (!rowResult.success) {
        validationErrors.push({
          row: i + 1,
          errors: rowResult.error.flatten()
        });
      }
    }

    if (validationErrors.length > 0) {
      return errorResponse(
        'Invalid CSV format', 
        { rows: validationErrors },
        400
      );
    }

    // Determine the actual quiz type to use. Should be QuestionType enum.
    let actualQuizType: QuestionType = QuestionType.MULTIPLE_CHOICE; // Default
    if (quizType && typeof quizType === 'string' && quizType in QuestionType) {
      actualQuizType = quizType as QuestionType;
    } else if (quizType && Object.values(QuestionType).includes(quizType as QuestionType)) {
      actualQuizType = quizType as QuestionType; // If it already is QuestionType enum
    } 
    // Else, it defaults to MULTIPLE_CHOICE if quizType is invalid or not provided

    // Process the questions
    const questions = content.map((row: ExtendedCsvRowInput) => {
      const question = row.question || '';
      const answer1 = row.answer1 || '';
      const answer2 = row.answer2 || '';
      const answer3 = row.answer3 || '';
      const answer4 = row.answer4 || '';
      const correctAnswer = row.correctAnswer || '';
      
      let questionSpecificType = actualQuizType;
      if (row.type && typeof row.type === 'string' && row.type in QuestionType) {
        questionSpecificType = row.type as QuestionType;
      }

      return {
        question,
        answers: [answer1, answer2, answer3, answer4].filter(ans => ans !== ''),
        correctAnswer,
        imageUrl: row.imageUrl || PLACEHOLDER_IMAGE,
        type: questionSpecificType,
      };
    });

    // Log what's happening
    console.log(`Creating quiz "${title}" with ${questions.length} questions. Description: ${description}, Type: ${actualQuizType}, Tags: ${tags?.join(', ')}`);
    
    // Update the database access time marker
    updateLastAccessTime();

    // Create the quiz in the database with enhanced retry mechanism
    const quiz = await withDatabaseRetry(async () => {
      return prisma.quiz.create({
        data: {
          title,
          description,
          imageUrl: quizCoverImageUrl || PLACEHOLDER_IMAGE,
          quizType: actualQuizType,
          tags,
          questions: {
            create: questions,
          },
        },
        include: {
          questions: true,
        },
      });
    });

    console.log(`Quiz created successfully with ID: ${quiz.id}`);
    return successResponse(quiz);
  } catch (error) {
    return handleApiError(error, 'Quiz upload');
  }
}