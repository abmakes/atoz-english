import QuizList from "@/components/management_ui/QuizList";
import { prisma } from "@/lib/prisma"; // Assuming prisma client is at this path
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getQuizzes() {
  // Adjust the Prisma query as needed to match the Quiz interface in QuizList
  const quizzes = await prisma.quiz.findMany({
    select: {
      id: true,
      title: true,
      imageUrl: true,
      questions: {
        select: {
          id: true,
          type: true, // Ensure QuestionType enum matches string values if needed by getQuizTypeLabel
        }
      }
    }
  });
  return quizzes;
}

export default async function QuizzesPage() {
  const quizzes = await getQuizzes();

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