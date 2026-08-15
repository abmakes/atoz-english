import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isUnauthorized } from '@/lib/auth';
import {
  buildBriefSummary,
  discoveryTagsFromBrief,
  generationBriefSchema,
  vocabularyFocusToPos,
  type GenerationBrief,
} from '@/lib/ai/generation-brief';
import {
  createSoftSimplifyPrompt,
  createTeacherFirstPrompt,
  parseGeneratedQuestions,
  type GeneratedQuestionText,
} from '@/lib/ai/quiz-generation';
import { resolveLexicon } from '@/lib/lexicon/resolver';
import { auditQuestion, auditQuestions } from '@/lib/lexicon/validator';
import type { CefrLevelId } from '@/lib/taxonomy/quiz-taxonomy';
import { QuestionType } from '@/types/question_types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_QUIZ_API_KEY ?? '');

const requestSchema = generationBriefSchema.extend({
  questionType: z.nativeEnum(QuestionType),
  language: z.literal('English').optional(),
  /** Legacy clients may still send flat tags; fold them into the brief. */
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

function formatQuestions(
  questions: GeneratedQuestionText[],
  level: CefrLevelId
) {
  return questions.map((question) => {
    const warnings = auditQuestion(question, level);
    return {
      question: question.question,
      answers: question.answers,
      correctAnswer: question.correctAnswer,
      type: QuestionType.MULTIPLE_CHOICE,
      imageUrl: '/images/placeholder.webp',
      imageFile: null,
      imageKeyword: question.imageKeyword ?? 'classroom',
      languageWarnings: warnings.issues,
    };
  });
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

    const brief: GenerationBrief = generationBriefSchema.parse({
      ...input,
      topics:
        input.topics.length > 0
          ? input.topics
          : (input.tags ?? []).filter(Boolean),
      grammarFocus:
        input.grammarFocus.length > 0
          ? input.grammarFocus
          : (input.tags ?? []).filter(Boolean),
    });

    const posTags = vocabularyFocusToPos(brief.vocabularyFocus).map((pos) => {
      switch (pos) {
        case 'noun':
          return 'Nouns';
        case 'verb':
          return 'Verbs';
        case 'adjective':
          return 'Adjectives';
        case 'adverb':
          return 'Adverbs';
      }
    });

    const selection = resolveLexicon({
      level: brief.level,
      tags: [...brief.topics, ...brief.grammarFocus, ...posTags],
      limit: 100,
    });

    const prompt = createTeacherFirstPrompt({ brief, selection });

    let questions = parseGeneratedQuestions(
      await generateText(prompt),
      brief.numberOfQuestions
    );
    let audit = auditQuestions(questions, brief.level);
    let polished = false;

    // Soft polish only — never reject the batch for lexicon mismatches.
    if (!audit.valid && audit.issues.length > 0) {
      try {
        polished = true;
        const polishPrompt = createSoftSimplifyPrompt({
          originalPrompt: prompt,
          previousQuestions: questions,
          flaggedWords: audit.issues.map((issue) => issue.word),
        });
        questions = parseGeneratedQuestions(
          await generateText(polishPrompt),
          brief.numberOfQuestions
        );
        audit = auditQuestions(questions, brief.level);
      } catch (error) {
        console.warn('Soft lexicon polish failed; returning original draft', error);
      }
    }

    const discoveryTags = discoveryTagsFromBrief(brief);

    return NextResponse.json({
      success: true,
      questions: formatQuestions(questions, brief.level),
      briefSummary: buildBriefSummary(brief),
      metadata: {
        level: brief.level,
        tags: discoveryTags,
        numberOfQuestions: questions.length,
        matchingWords: selection.words.length,
        lexiconVersion: selection.lexiconVersion,
        languageAudit: {
          valid: audit.valid,
          blocking: false,
          checkedWordCount: audit.checkedWords.length,
          issueCount: audit.issues.length,
          issues: audit.issues,
          polished,
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
