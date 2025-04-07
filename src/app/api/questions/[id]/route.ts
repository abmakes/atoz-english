import { NextResponse } from 'next/server'
import { getQuestions, createQuestion } from '@/lib/db'
import { PrismaClient } from '@prisma/client'
import { del } from '@vercel/blob'

const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const questions = await getQuestions()
    return NextResponse.json(questions)
  } catch (error) {
    return NextResponse.json({ error: `Failed to fetch questions, ${error}` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const question = await createQuestion(data)
    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: `Failed to create question, ${error}` }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const questionId = params.id

  try {
    console.log(`Attempting to delete question with ID: ${questionId}`)

    // Fetch the question to get the image URL
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    })

    if (!question) {
      console.log(`Question with ID ${questionId} not found`)
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    console.log(`Question found: ${JSON.stringify(question)}`)

    // Delete the question's image if it exists and is not the placeholder
    if (question.imageUrl && question.imageUrl !== PLACEHOLDER_IMAGE) {
      console.log(`Deleting image: ${question.imageUrl}`)
      await del(question.imageUrl)
    }

    // Delete the question
    console.log(`Deleting question with ID: ${questionId}`)
    await prisma.question.delete({
      where: { id: questionId },
    })

    console.log(`Question with ID ${questionId} deleted successfully`)
    return NextResponse.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Failed to delete question:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: `Failed to delete question: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}