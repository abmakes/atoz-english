import { NextResponse, NextRequest } from 'next/server'
import { prisma, withDatabaseRetry } from '@/lib/prisma'
import { createQuestion } from '@/lib/db'
import { del } from '@vercel/blob'

const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const question = await withDatabaseRetry(() =>
      prisma.question.findUnique({
        where: { id: id },
        include: { tags: true },
      }), `Fetching question ${id}`
    );

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json(question);
  } catch (error) {
    console.error(`Failed to fetch question ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch question: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    console.log(`Attempting to delete question with ID: ${id}`)

    const question = await withDatabaseRetry(() =>
      prisma.question.findUnique({
        where: { id: id },
        select: { imageUrl: true }
      }), `Fetching question image URL for deletion: ${id}`
    );

    if (!question) {
      console.log(`Question with ID ${id} not found for deletion`)
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

    console.log(`Deleting question record from database with ID: ${id}`)
    await withDatabaseRetry(() =>
      prisma.question.delete({
        where: { id: id },
      }), `Deleting question ${id}`
    );

    console.log(`Question with ID ${id} deleted successfully`)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to delete question ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to delete question: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
   const { id } = await params; 
   try {
      const data = await request.json();
      console.log(`Attempting to update question with ID: ${id}`, data);

      const updatedQuestion = await withDatabaseRetry(() =>
         prisma.question.update({
            where: { id: id },
            data: {
            },
            include: { tags: true }
         }), `Updating question ${id}`
      );

       if (!updatedQuestion) {
         return NextResponse.json({ error: 'Question not found' }, { status: 404 });
       }

      console.log(`Question ${id} updated successfully.`);
      return NextResponse.json(updatedQuestion);

   } catch (error) {
      console.error(`Failed to update question ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ error: `Failed to update question: ${errorMessage}` }, { status: 500 });
   }
}