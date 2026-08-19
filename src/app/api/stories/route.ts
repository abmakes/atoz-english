import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';
import { requireAuth, isUnauthorized } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { levelLabelFromId } from '@/lib/taxonomy/quiz-taxonomy';
import { storyBriefSchema } from '@/lib/stories/schemas';
import {
  buildExampleStory,
  createStoryPlanPrompt,
  parseStoryPlan,
} from '@/lib/stories/story-generation';
import { createShareToken } from '@/lib/stories/tokens';
import { toStoryDto } from '@/lib/stories/service';

export const runtime = 'nodejs';
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_QUIZ_API_KEY ?? '');

/** List the teacher's stories (newest first). */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const stories = await prisma.story.findMany({
      where: { authorId: authResult.userId, status: { not: 'ARCHIVED' } },
      include: {
        panels: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(
      stories.map((story) => toStoryDto(story, story._count.submissions))
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/stories');
  }
}

/**
 * Create a story from a teacher brief: one Gemini text call produces the
 * story plan (title, character sheet, art style, 4 scenes + example
 * sentences). Panel images are generated afterwards, one request per panel.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    if (!process.env.GEMINI_QUIZ_API_KEY) {
      return errorResponse('GEMINI_QUIZ_API_KEY is not configured', undefined, 500);
    }

    const parsed = storyBriefSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse('Invalid story brief', parsed.error.flatten(), 400);
    }
    const brief = parsed.data;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(createStoryPlanPrompt(brief));
    const plan = parseStoryPlan((await result.response).text());

    const tags = [
      levelLabelFromId(brief.level),
      ...brief.grammarFocus,
    ];

    const story = await prisma.story.create({
      data: {
        authorId: authResult.userId,
        title: plan.title,
        topicPrompt: brief.topicPrompt,
        tags,
        storyType: brief.storyType,
        characterSheet: plan.characterSheet,
        artStyle: plan.artStyle,
        exampleStory: buildExampleStory(
          plan.panels.map((panel) => panel.exampleSentence)
        ),
        shareToken: createShareToken(),
        panels: {
          create: plan.panels.map((panel, index) => ({
            order: index + 1,
            sceneDescription: panel.sceneDescription,
            exampleSentence: panel.exampleSentence,
          })),
        },
      },
      include: { panels: true },
    });

    return successResponse(toStoryDto(story), 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse(
        'Could not understand the generated story plan. Please try again.',
        undefined,
        502
      );
    }
    return handleApiError(error, 'POST /api/stories');
  }
}
