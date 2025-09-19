import { QuestionType } from "./question_types";

export interface Question {
  id: string;
  question: string;
  imageUrl?: string | null;
  answers: string[];
  correctAnswer: string;
  type: QuestionType;
  quizId?: string | null;
}

export interface Player {
  name: string;
  questions: Question[];
  currentQuestion: number;
  lives: number;
  score: number;
}

export interface QuestionData {
  id: string;
  question: string;
  imageUrl?: string;
  answers: string[];
  correctAnswer: string;
  type: QuestionType;
  quizId?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  quizType: QuestionType;
  tags: string[];
  statistics?: Record<string, unknown> | null;
  defaultSettings?: Record<string, unknown> | null;
  authorId: string;
  questions: Question[];
  createdAt?: Date;
  updatedAt?: Date;
}