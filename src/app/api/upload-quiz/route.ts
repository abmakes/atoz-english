import { NextRequest } from 'next/server';
import { parse } from 'csv-parse/sync';
import { prisma, withDatabaseRetry, updateLastAccessTime } from '@/lib/prisma';
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils';
import { parseFormData } from '@/lib/formDataUtils';
import { csvRowSchema, csvUploadSchema, CsvRowInput } from '@/lib/schemas';

// Define the placeholder image path
const PLACEHOLDER_IMAGE = '/images/placeholder.webp';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate form data
    const formData = await request.formData();
    const formDataResult = await parseFormData(formData, csvUploadSchema);
    
    if (!formDataResult.success) {
      return errorResponse('Invalid form data', formDataResult.error.flatten(), 400);
    }
    
    const { title, csv: file } = formDataResult.data;

    // Convert file to CSV string
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const csvString = buffer.toString('utf-8');
    
    // Parse the CSV
    const content = parse(csvString, { 
      columns: true, 
      skip_empty_lines: true 
    });

    // Validate each row in the CSV
    const validationErrors = [];
    for (let i = 0; i < content.length; i++) {
      const row = content[i];
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

    // Process the questions
    const questions = content.map((row: CsvRowInput) => {
      // Ensure no undefined values by providing empty string defaults
      const question = row.question || '';
      const answer1 = row.answer1 || '';
      const answer2 = row.answer2 || '';
      const answer3 = row.answer3 || '';
      const answer4 = row.answer4 || '';
      const correctAnswer = row.correctAnswer || '';
      
      return {
        question,
        answers: [answer1, answer2, answer3, answer4],
        correctAnswer,
        imageUrl: PLACEHOLDER_IMAGE, // Add placeholder image for each question
      };
    });

    // Log what's happening
    console.log(`Creating quiz "${title}" with ${questions.length} questions`);
    
    // Update the database access time marker
    updateLastAccessTime();

    // Create the quiz in the database with enhanced retry mechanism
    const quiz = await withDatabaseRetry(async () => {
      return prisma.quiz.create({
        data: {
          title,
          imageUrl: PLACEHOLDER_IMAGE, // Add placeholder image for the quiz
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