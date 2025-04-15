import { QuestionType } from "./question_types";

export interface Question {
  question: string;
  imageUrl: string;
  answers: string[];
  correctAnswer: string;
  type?: QuestionType;
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
  id: string
  title: string
  imageUrl: string
  questions: Question[]
}