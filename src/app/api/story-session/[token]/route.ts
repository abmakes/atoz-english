import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { isStoryPlayable, parseMouth } from '@/lib/stories/service';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ token: string }> };

/**
 * Public: story data for the student recording page.
 * Authenticated only by the unguessable share token. Never exposes the
 * teacher id or anything beyond what students need.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!token || token.length < 8) {
      return errorResponse('Story not found', undefined, 404);
    }

    const story = await prisma.story.findUnique({
      where: { shareToken: token },
      include: { panels: true },
    });

    if (!story || !isStoryPlayable(story)) {
      return errorResponse('This story is not ready yet. Ask your teacher!', undefined, 404);
    }

    return successResponse({
      title: story.title,
      showExample: story.showExampleToStudents,
      exampleStory: story.showExampleToStudents ? story.exampleStory : null,
      panels: [...story.panels]
        .sort((a, b) => a.order - b.order)
        .map((panel) => ({
          order: panel.order,
          imageUrl: panel.imageUrl,
          mouth: parseMouth(panel.mouth),
          exampleSentence: story.showExampleToStudents
            ? panel.exampleSentence
            : null,
        })),
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/story-session/[token]');
  }
}
