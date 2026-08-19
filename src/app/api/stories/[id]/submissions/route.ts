import { NextRequest } from 'next/server';
import { requireAuth, isUnauthorized } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { getOwnedStory } from '@/lib/stories/service';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const { id } = await context.params;
    const story = await getOwnedStory(id, authResult.userId);
    if (!story) return errorResponse('Story not found', undefined, 404);

    const submissions = await prisma.storySubmission.findMany({
      where: { storyId: story.id },
      include: { recordings: true },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(
      submissions.map((submission) => ({
        id: submission.id,
        studentName: submission.studentName,
        status: submission.status,
        createdAt: submission.createdAt.toISOString(),
        recordings: [...submission.recordings]
          .sort((a, b) => a.panelOrder - b.panelOrder)
          .map((recording) => ({
            panelOrder: recording.panelOrder,
            audioUrl: recording.audioUrl,
            mimeType: recording.mimeType,
            durationMs: recording.durationMs,
            envelope: recording.envelope,
          })),
      }))
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/stories/[id]/submissions');
  }
}
