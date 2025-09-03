import QuizList from "@/components/management_ui/QuizList";
import { prisma } from "@/lib/prisma"; // Assuming prisma client is at this path
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Quiz, Question } from "@/types"; // Assuming Quiz type is here
import { QuestionType as AppQuestionType } from "@/types/question_types"; // Assuming app's QuestionType is here

async function getQuizzes(): Promise<Quiz[]> { // Return type is now Quiz[]
  try { // Add a try block
    const quizzesFromDb = await prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        imageUrl: true,
        description: true,
        tags: true,
        quizType: true, // This is Prisma.$Enums.QuestionType
        authorId: true, // Keep if needed by Quiz type, otherwise remove from select
        statistics: true, // Added to match Quiz type
        defaultSettings: true, // Added to match Quiz type
        createdAt: true, // Added to match Quiz type
        updatedAt: true, // Added to match Quiz type
        questions: { // Keep if needed by Quiz type, otherwise remove from select
          select: {
            id: true,
            question: true, // Added
            imageUrl: true,  // Added
            answers: true,   // Added
            correctAnswer: true, // Added
            type: true, 
            quizId: true, // Added
          }
        },
      }
    });

    // Map Prisma quizzes to your application's Quiz type
    const quizzes: Quiz[] = quizzesFromDb.map(quiz => {
      const questions: Question[] = (quiz.questions || []).map(q => ({
        ...q,
        type: q.type as AppQuestionType,
      }));

      return {
        ...quiz,
        quizType: quiz.quizType as AppQuestionType,
        questions,
      } as unknown as Quiz;
    });
    
    return quizzes;

  } catch (error) { // Add a catch block
    console.error("Failed to fetch quizzes:", error);
    return []; // Return an empty array on error
  }
}

export default async function QuizzesPage() {
  const quizzes = await getQuizzes();

  console.log(quizzes)

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Quizzes</h1>
        <Link href="/create" passHref>
          <Button>Create New Quiz</Button>
        </Link>
      </div>
      {quizzes.length > 0 ? (
        <QuizList initialQuizzes={quizzes} />
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500 mb-4">You haven&apos;t created any quizzes yet.</p>
          <Link href="/create" passHref>
            <Button size="lg">Create Your First Quiz</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 