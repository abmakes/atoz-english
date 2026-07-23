import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isUnauthorized } from '@/lib/auth';
import {
  createQuizGenerationPrompt,
  createRepairPrompt,
  parseGeneratedQuestions,
  type GeneratedQuestionText,
} from '@/lib/lexicon/quiz-generation';
import { resolveLexicon } from '@/lib/lexicon/resolver';
import { auditQuestions } from '@/lib/lexicon/validator';
import { CEFR_LEVELS } from '@/lib/taxonomy/quiz-taxonomy';
import { QuestionType } from '@/types/question_types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_QUIZ_API_KEY ?? '');

const levelIds = CEFR_LEVELS.map((level) => level.id) as [
  'PRE_A1',
  'A1',
  'A2',
  'B1',
];

const requestSchema = z.object({
  tags: z.array(z.string().trim().min(1)).min(1).max(12),
  level: z.enum(levelIds),
  questionType: z.nativeEnum(QuestionType),
  numberOfQuestions: z.number().int().min(1).max(20),
  quizTitle: z.string().trim().max(160).default(''),
  quizDescription: z.string().trim().max(500).default(''),
  language: z.literal('English').optional(),
});

async function generateText(prompt: string): Promise<string> {
  if (!process.env.GEMINI_QUIZ_API_KEY) {
    throw new Error('GEMINI_QUIZ_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const result = await model.generateContent(prompt);
  return (await result.response).text();
}

function formatQuestions(questions: GeneratedQuestionText[]) {
  return questions.map((question) => ({
    ...question,
    type: QuestionType.MULTIPLE_CHOICE,
    imageUrl: '/images/placeholder.webp',
    imageFile: null,
  }));
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
        { error: 'Only multiple choice questions are currently supported' },
        { status: 400 }
      );
    }

    const selection = resolveLexicon({
      level: input.level,
      tags: input.tags,
      limit: 100,
    });

    if (selection.words.length < 8) {
      return NextResponse.json(
        {
          error:
            'The selected filters do not yet have enough reviewed vocabulary. Choose a broader topic or language focus.',
          metadata: {
            level: input.level,
            tags: input.tags,
            matchingWords: selection.words.length,
            lexiconVersion: selection.lexiconVersion,
          },
        },
        { status: 422 }
      );
    }

    const prompt = createQuizGenerationPrompt({
      selection,
      tags: input.tags,
      quizTitle: input.quizTitle,
      quizDescription: input.quizDescription,
      numberOfQuestions: input.numberOfQuestions,
    });

    let questions = parseGeneratedQuestions(
      await generateText(prompt),
      input.numberOfQuestions
    );
    let audit = auditQuestions(questions, input.level);
    let repaired = false;

    if (!audit.valid) {
      repaired = true;
      const repairPrompt = createRepairPrompt({
        originalPrompt: prompt,
        previousQuestions: questions,
        forbiddenWords: audit.issues.map((issue) => issue.word),
      });
      questions = parseGeneratedQuestions(
        await generateText(repairPrompt),
        input.numberOfQuestions
      );
      audit = auditQuestions(questions, input.level);
    }

    if (!audit.valid) {
      return NextResponse.json(
        {
          error:
            'Generated questions still contain language outside the selected level after an automatic rewrite.',
          languageAudit: audit,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      questions: formatQuestions(questions),
      metadata: {
        level: input.level,
        tags: input.tags,
        numberOfQuestions: questions.length,
        matchingWords: selection.words.length,
        lexiconVersion: selection.lexiconVersion,
        languageAudit: {
          valid: true,
          checkedWordCount: audit.checkedWords.length,
          repaired,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      console.error('Failed to parse AI response:', error);
      return NextResponse.json(
        { error: 'The AI returned an invalid question format. Please try again.' },
        { status: 502 }
      );
    }

    console.error('Error generating questions:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message.includes('not configured')
            ? error.message
            : 'Failed to generate questions. Please try again.',
      },
      { status: 500 }
    );
  }
}
