import { z } from 'zod';
import { QuestionType } from '@/types/question_types';

// Base schemas (without relations)
export const tagSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tag name cannot be empty"),
});

export const questionBaseSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, "Question text cannot be empty"),
  imageUrl: z.string().optional(),
  answers: z.array(z.string().min(1, "Answer text cannot be empty")).min(2, "Must have at least two answers"),
  correctAnswer: z.string().min(1, "Correct answer cannot be empty"),
  type: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
});

export const quizBaseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Quiz title cannot be empty"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  quizType: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
  tags: z.array(z.string()).optional(),
});

// Schema for API input validation (includes file uploads)
export const questionInputSchema = questionBaseSchema.extend({
  imageFile: z.any().optional(),
  tagsString: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const quizInputSchema = quizBaseSchema.extend({
  quizImageFile: z.any().optional(),
  questions: z.array(questionInputSchema).min(1, "Quiz must have at least one question"),
});

// Schema for database operations
export const questionDbSchema = questionBaseSchema.extend({
  quizId: z.string().optional(),
  tags: z.array(tagSchema).optional(),
});

export const quizDbSchema = quizBaseSchema.extend({
  questions: z.array(questionDbSchema).optional(),
});

// API response schemas
export const apiResponseSchema = z.object({
  data: z.unknown().optional(),
  error: z.string().optional(),
  details: z.unknown().optional(),
});

// CSV upload schema
export const csvUploadSchema = z.object({
  title: z.string().min(1, "Quiz title is required"),
  description: z.string().optional(),
  quizCoverImageUrl: z.string().optional(),
  quizType: z.nativeEnum(QuestionType).optional(),
  tags: z.array(z.string()).optional(),
  csv: z.any().refine(
    (file) => file && typeof file.name === 'string' && file.name.endsWith('.csv'),
    { message: "File must be a CSV" }
  )
});

// CSV row schema for validation
export const csvRowSchema = z.object({
  question: z.string().min(1, "Question text cannot be empty"),
  answer1: z.string().min(1, "Answer 1 cannot be empty"),
  answer2: z.string().min(1, "Answer 2 cannot be empty"),
  answer3: z.string().min(1, "Answer 3 cannot be empty"),
  answer4: z.string().min(1, "Answer 4 cannot be empty"),
  correctAnswer: z.string().min(1, "Correct answer cannot be empty"),
  type: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type CsvUploadInput = z.infer<typeof csvUploadSchema>;
export type CsvRowInput = z.infer<typeof csvRowSchema>;

// Helper types
export type QuestionInput = z.infer<typeof questionInputSchema>;
export type QuizInput = z.infer<typeof quizInputSchema>;
export type QuestionDb = z.infer<typeof questionDbSchema>;
export type QuizDb = z.infer<typeof quizDbSchema>;
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  details?: unknown;
}; 