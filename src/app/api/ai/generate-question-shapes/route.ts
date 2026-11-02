import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isUnauthorized } from '@/lib/auth';
import {
  briefFromRequest,
  generationBriefSchema,
  type GenerationBrief,
} from '@/lib/ai/generation-brief';
import {
  createQuestionShapePrompt,
  finalizeShapeSample,
  parseGeneratedShapes,
} from '@/lib/ai/question-shapes';
import { QuestionType } from '@/types/question_types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_QUIZ_API_KEY ?? '');

const requestSchema = generationBriefSchema.extend({
  questionType: z.nativeEnum(QuestionType),
  language: z.literal('English').optional(),
  tags: z.array(z.string().trim().min(1)).max(12).optional(),
});

async function generateText(prompt: string): Promise<string> {
  if (!process.env.GEMINI_QUIZ_API_KEY) {
    throw new Error('GEMINI_QUIZ_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const result = await model.generateContent(prompt);
  return (await result.response).text();
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const parsedRequest = requestSchema.safeParse(await request.json());
    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          error: 'Invalid generation request',
          details: parsedRequest.error.flatten(),
        },
        { status: 400 }
      );
    }

    const input = parsedRequest.data;
    if (input.questionType !== QuestionType.MULTIPLE_CHOICE) {
      return NextResponse.json(
        {
          error:
            'AI generation currently supports multiple-choice quizzes only. Switch the quiz type in setup, or add questions manually.',
        },
        { status: 400 }
      );
    }

    const brief: GenerationBrief = briefFromRequest(input);
    const shapes = finalizeShapeSample(
      parseGeneratedShapes(await generateText(createQuestionShapePrompt(brief))),
      brief.modelSentence
    );

    return NextResponse.json({
      success: true,
      shapes,
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      console.error('Failed to parse question shapes:', error);
      return NextResponse.json(
        { error: 'The AI returned an invalid example format. Please try again.' },
        { status: 502 }
      );
    }

    console.error('Error generating question shapes:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message.includes('not configured')
            ? error.message
            : 'Failed to generate example questions. Please try again.',
      },
      { status: 500 }
    );
  }
}
