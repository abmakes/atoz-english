import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { parseMouth } from '@/lib/stories/service';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ token: string; submissionId: string }>;
};

/**
 * Public: everything the watch page needs to perform one student's movie.
 * Requires both the story share token and the submission id (cuid), so
 * movies are only reachable via links the teacher or student shared.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token, submissionId } = await context.params;

    const submission = await prisma.storySubmission.findFirst({
      where: { id: submissionId, story: { shareToken: token } },
      include: {
        recordings: true,
        story: { include: { panels: true } },
      },
    });

    if (!submission) {
      return errorResponse('Movie not found', undefined, 404);
    }

    return successResponse({
      title: submission.story.title,
      studentName: submission.studentName,
      panels: [...submission.story.panels]
        .sort((a, b) => a.order - b.order)
        .map((panel) => ({
          order: panel.order,
          imageUrl: panel.imageUrl,
          mouth: parseMouth(panel.mouth),
        })),
      recordings: [...submission.recordings]
        .sort((a, b) => a.panelOrder - b.panelOrder)
        .map((recording) => ({
          panelOrder: recording.panelOrder,
          audioUrl: recording.audioUrl,
          mimeType: recording.mimeType,
          durationMs: recording.durationMs,
          envelope: Array.isArray(recording.envelope)
            ? (recording.envelope as number[])
            : [],
        })),
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/story-session/[token]/submissions/[submissionId]');
  }
}
