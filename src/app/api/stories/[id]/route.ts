import { NextRequest } from 'next/server';
import { requireAuth, isUnauthorized } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { storyPatchSchema } from '@/lib/stories/schemas';
import { getOwnedStory, toStoryDto } from '@/lib/stories/service';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const { id } = await context.params;
    const story = await getOwnedStory(id, authResult.userId);
    if (!story) return errorResponse('Story not found', undefined, 404);

    return successResponse(toStoryDto(story));
  } catch (error) {
    return handleApiError(error, 'GET /api/stories/[id]');
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const { id } = await context.params;
    const story = await getOwnedStory(id, authResult.userId);
    if (!story) return errorResponse('Story not found', undefined, 404);

    const parsed = storyPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse('Invalid story update', parsed.error.flatten(), 400);
    }

    const updated = await prisma.story.update({
      where: { id: story.id },
      data: parsed.data,
      include: { panels: true },
    });

    return successResponse(toStoryDto(updated));
  } catch (error) {
    return handleApiError(error, 'PATCH /api/stories/[id]');
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const { id } = await context.params;
    const story = await getOwnedStory(id, authResult.userId);
    if (!story) return errorResponse('Story not found', undefined, 404);

    await prisma.story.delete({ where: { id: story.id } });
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/stories/[id]');
  }
}
