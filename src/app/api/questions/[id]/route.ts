import { NextResponse } from 'next/server'
import { prisma, withDatabaseRetry } from '@/lib/prisma'
import { createQuestion } from '@/lib/db'
import { del } from '@vercel/blob'

const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const questionId = params.id;
  try {
    const question = await withDatabaseRetry(() =>
      prisma.question.findUnique({
        where: { id: questionId },
        include: { tags: true },
      }), `Fetching question ${questionId}`
    );

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json(question);
  } catch (error) {
    console.error(`Failed to fetch question ${questionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch question: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const question = await createQuestion(data)
    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error('Failed to create question:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to create question: ${errorMessage}` }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const questionId = params.id

  try {
    console.log(`Attempting to delete question with ID: ${questionId}`)

    const question = await withDatabaseRetry(() =>
      prisma.question.findUnique({
        where: { id: questionId },
        select: { imageUrl: true }
      }), `Fetching question image URL for deletion: ${questionId}`
    );

    if (!question) {
      console.log(`Question with ID ${questionId} not found for deletion`)
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    console.log(`Question found, imageUrl: ${question.imageUrl}`)

    let deleteImagePromise: Promise<void> = Promise.resolve();
    if (question.imageUrl && question.imageUrl !== PLACEHOLDER_IMAGE) {
      console.log(`Deleting image from blob storage: ${question.imageUrl}`)
      deleteImagePromise = del(question.imageUrl).catch(err => {
         console.error(`Failed to delete image ${question.imageUrl} from blob storage:`, err);
      });
    }

    await deleteImagePromise;

    console.log(`Deleting question record from database with ID: ${questionId}`)
    await withDatabaseRetry(() =>
      prisma.question.delete({
        where: { id: questionId },
      }), `Deleting question ${questionId}`
    );

    console.log(`Question with ID ${questionId} deleted successfully`)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to delete question ${questionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to delete question: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
   const questionId = params.id;
   try {
      const data = await request.json();
      console.log(`Attempting to update question with ID: ${questionId}`, data);

      const updatedQuestion = await withDatabaseRetry(() =>
         prisma.question.update({
            where: { id: questionId },
            data: {
            },
            include: { tags: true }
         }), `Updating question ${questionId}`
      );

       if (!updatedQuestion) {
         return NextResponse.json({ error: 'Question not found' }, { status: 404 });
       }

      console.log(`Question ${questionId} updated successfully.`);
      return NextResponse.json(updatedQuestion);

   } catch (error) {
      console.error(`Failed to update question ${questionId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ error: `Failed to update question: ${errorMessage}` }, { status: 500 });
   }
}