import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isUnauthorized } from '@/lib/auth';
import { lessonImageAnalysisSchema } from '@/lib/ai/generation-brief';
import { validateLessonImageFile } from '@/lib/ai/lesson-image';
import {
  CEFR_LEVELS,
  GRAMMAR_TAGS,
  QUESTION_STYLE_OPTIONS,
  TOPIC_TAGS,
  levelLabelFromId,
} from '@/lib/taxonomy/quiz-taxonomy';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_QUIZ_API_KEY ?? '');

function analysisPrompt(): string {
  return `You are helping an English teacher prepare a classroom quiz from a lesson page screenshot.

Analyze the image and return ONLY JSON with this shape:
{
  "lessonSummary": "2-4 sentence summary of what students are practising",
  "suggestedLevel": "PRE_A1" | "A1" | "A2" | "B1",
  "topics": ["..."],
  "grammarFocus": ["..."],
  "keyVocabulary": ["..."],
  "sentencePatterns": ["..."],
  "questionStyles": ["..."],
  "teacherNotesDraft": "short teacher-facing notes the teacher can edit"
}

Rules:
- Summarize; do NOT transcribe long passages or copy textbook wording.
- Create original wording only.
- Prefer topics from: ${TOPIC_TAGS.join(', ')}
- Prefer grammarFocus from: ${GRAMMAR_TAGS.join(', ')}
- Prefer questionStyles from: ${QUESTION_STYLE_OPTIONS.join(', ')}
- suggestedLevel must be one of: ${CEFR_LEVELS.map((level) => level.id).join(', ')}
- keyVocabulary: up to 20 useful classroom words/phrases (original lemmas, not long quotes)
- Return at most 3 questionStyles
- Do not invent publisher or book promotion text
- If the image is unclear, still return best-effort classroom analysis`;
}

function parseAnalysis(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const parsed: unknown = JSON.parse(cleaned);
  return lessonImageAnalysisSchema.parse(parsed);
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    if (!process.env.GEMINI_QUIZ_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_QUIZ_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Please upload or paste a PNG, JPEG, or WebP image.' },
        { status: 400 }
      );
    }

    const validation = validateLessonImageFile({
      type: file.type,
      size: file.size,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent([
      { text: analysisPrompt() },
      {
        inlineData: {
          mimeType: file.type,
          data: base64,
        },
      },
    ]);

    // Discard buffer references after multimodal call; nothing is persisted.
    const analysis = parseAnalysis((await result.response).text());

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        suggestedLevelLabel: levelLabelFromId(analysis.suggestedLevel),
      },
      ephemeral: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      console.error('Failed to parse lesson image analysis:', error);
      return NextResponse.json(
        { error: 'Could not understand the lesson image analysis. Please try again.' },
        { status: 502 }
      );
    }

    console.error('Error analyzing lesson image:', error);
    return NextResponse.json(
      { error: 'Failed to analyze lesson image. Please try again.' },
      { status: 500 }
    );
  }
}
