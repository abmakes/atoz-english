import { NextRequest } from 'next/server';
import { requireAuth, isUnauthorized } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { createShareToken } from '@/lib/stories/tokens';
import { getOwnedStory } from '@/lib/stories/service';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

/** Rotate the student share token (revokes previously shared links). */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const { id } = await context.params;
    const story = await getOwnedStory(id, authResult.userId);
    if (!story) return errorResponse('Story not found', undefined, 404);

    const updated = await prisma.story.update({
      where: { id: story.id },
      data: { shareToken: createShareToken() },
    });

    return successResponse({ shareToken: updated.shareToken });
  } catch (error) {
    return handleApiError(error, 'POST /api/stories/[id]/share');
  }
}
