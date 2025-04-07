// This is a temporary bridge file to support migration of the old codebase's functions
// It reuses the singleton pattern from lib/prisma.ts for consistency

// Import only what's needed
import { prisma, withDatabaseRetry } from './prisma';
import { QuestionType } from '@/types/question_types';

// Helper function to split array into chunks (for batched operations)
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Type for question data in updateQuiz
interface QuestionUpdateData {
  id?: string;
  question: string;
  imageUrl?: string;
  answers: string[];
  correctAnswer: string;
  tags?: string[];
  type?: QuestionType;
}

// Interface for existing question data from database
interface ExistingQuestion {
  id: string;
}

// Function to retrieve all questions with their tags
export async function getQuestions() {
  console.log('Getting all questions');
  return withDatabaseRetry(async () => {
    return prisma.question.findMany({
      include: {
        tags: true,
        quiz: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
  }, 'Fetching all questions');
}

// Function to create a new question
export async function createQuestion(data: {
  question: string;
  answers: string[];
  correctAnswer: string;
  imageUrl?: string;
  type?: QuestionType;
  tags?: string[];
  quizId?: string;
}) {
  console.log(`Creating new question: ${data.question.substring(0, 30)}...`);
  
  const { question, answers, correctAnswer, imageUrl, type: questionType, tags, quizId } = data;

  // Prepare tags for connectOrCreate
  const tagsToConnectOrCreate = (tags ?? [])
    .map((tagName: string) => tagName.trim())
    .filter((tagName: string) => tagName.length > 0)
    .map((tagName: string) => ({
      where: { name: tagName },
      create: { name: tagName },
    }));

  return withDatabaseRetry(async () => {
    return prisma.question.create({
      data: {
        question,
        answers,
        correctAnswer,
        imageUrl: imageUrl || '/images/placeholder.webp',
        type: questionType,
        // If quizId is provided, connect to that quiz
        ...(quizId ? {
          quiz: {
            connect: { id: quizId }
          }
        } : {}),
        // If tags are provided, connect or create them
        ...(tagsToConnectOrCreate.length > 0 ? {
          tags: {
            connectOrCreate: tagsToConnectOrCreate
          }
        } : {})
      },
      include: {
        tags: true
      }
    });
  }, 'Creating question');
}

// Legacy function signature adapted for the new codebase
export async function updateQuiz(id: string, data: {
  title: string;
  imageUrl?: string;
  questions: QuestionUpdateData[];
}) {
  console.log(`Starting quiz update for quiz ${id} with ${data.questions.length} questions`);
  
  return withDatabaseRetry(async () => {
    // 1. Update quiz basic info immediately
    const quizUpdatePromise = prisma.quiz.update({
      where: { id },
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
      },
    });
    
    // 2. Process questions in parallel
    const questionsPromise = (async () => {
      // Get existing questions
      const existingQuestions = await prisma.question.findMany({
        where: { quizId: id },
        select: { id: true }
      }) as ExistingQuestion[];
      
      // Separate questions by operation type
      const existingIds = new Set<string>(existingQuestions.map(q => q.id));
      const questionsToUpdate = data.questions.filter(q => q.id && existingIds.has(q.id));
      const questionsToCreate = data.questions.filter(q => !q.id);
      
      // Find questions to delete
      const updatedIds = new Set<string | undefined>(questionsToUpdate.map(q => q.id));
      const idsToDelete = Array.from(existingIds).filter(qid => !updatedIds.has(qid));
      
      // Execute all operations in parallel
      await Promise.all([
        // Delete questions in batch
        idsToDelete.length > 0 ? 
          prisma.question.deleteMany({ where: { id: { in: idsToDelete } } }) : 
          Promise.resolve(),
        
        // Update questions in parallel batches of 5
        ...chunkArray(questionsToUpdate, 5).map(batch => 
          Promise.all(batch.map((q: QuestionUpdateData) => {
            return prisma.question.update({
              where: { id: q.id as string },
              data: {
                question: q.question,
                imageUrl: q.imageUrl,
                answers: q.answers,
                correctAnswer: q.correctAnswer,
                type: q.type,
                tags: q.tags && q.tags.length > 0 ? {
                  // Clear existing tags then add new ones
                  set: [],
                  connectOrCreate: q.tags.map((tag: string) => ({
                    where: { name: tag },
                    create: { name: tag },
                  })),
                } : undefined,
              }
            });
          }))
        ),
        
        // Create questions in parallel batches of 5
        ...chunkArray(questionsToCreate, 5).map(batch => 
          Promise.all(batch.map((q: QuestionUpdateData) => {
            return prisma.question.create({
              data: {
                question: q.question,
                imageUrl: q.imageUrl,
                answers: q.answers,
                correctAnswer: q.correctAnswer,
                type: q.type,
                quiz: { connect: { id } },
                tags: q.tags && q.tags.length > 0 ? {
                  connectOrCreate: q.tags.map((tag: string) => ({
                    where: { name: tag },
                    create: { name: tag },
                  })),
                } : undefined,
              }
            });
          }))
        )
      ]);
    })();
    
    // 3. Wait for both operations to complete
    await Promise.all([quizUpdatePromise, questionsPromise]);
    
    // 4. Return the updated quiz
    return prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            tags: true
          }
        }
      },
    });
  }, `Updating quiz ${id}`);
}

// Other functions can be added as needed, but prefer using prisma.ts for new code 