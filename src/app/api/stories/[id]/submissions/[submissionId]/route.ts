import { NextRequest } from 'next/server';
import { del } from '@vercel/blob';
import { z } from 'zod';
import { requireAuth, isUnauthorized } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { getOwnedStory } from '@/lib/stories/service';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string; submissionId: string }> };

const patchSchema = z.object({
  status: z.enum(['SUBMITTED', 'REVIEWED']),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const { id, submissionId } = await context.params;
    const story = await getOwnedStory(id, authResult.userId);
    if (!story) return errorResponse('Story not found', undefined, 404);

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse('Invalid update', parsed.error.flatten(), 400);
    }

    const submission = await prisma.storySubmission.findFirst({
      where: { id: submissionId, storyId: story.id },
    });
    if (!submission) return errorResponse('Submission not found', undefined, 404);

    const updated = await prisma.storySubmission.update({
      where: { id: submission.id },
      data: { status: parsed.data.status },
    });

    return successResponse({ id: updated.id, status: updated.status });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/stories/[id]/submissions/[submissionId]');
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const { id, submissionId } = await context.params;
    const story = await getOwnedStory(id, authResult.userId);
    if (!story) return errorResponse('Story not found', undefined, 404);

    const submission = await prisma.storySubmission.findFirst({
      where: { id: submissionId, storyId: story.id },
      include: { recordings: true },
    });
    if (!submission) return errorResponse('Submission not found', undefined, 404);

    // Best effort: remove the audio blobs before removing the rows.
    await Promise.allSettled(
      submission.recordings.map((recording) => del(recording.audioUrl))
    );
    await prisma.storySubmission.delete({ where: { id: submission.id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/stories/[id]/submissions/[submissionId]');
  }
}
