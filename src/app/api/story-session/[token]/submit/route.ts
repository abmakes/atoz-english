import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import {
  RECORDING_MAX_BYTES,
  STORY_PANEL_COUNT,
  studentNameSchema,
  submissionMetaSchema,
} from '@/lib/stories/schemas';
import { isStoryPlayable } from '@/lib/stories/service';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ token: string }> };

function audioExtension(mimeType: string): string {
  if (mimeType.includes('mp4') || mimeType.includes('aac')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

/**
 * Public: a student submits one voice recording per panel.
 * Multipart form: studentName, meta (JSON), audio-1 .. audio-4 files.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const story = await prisma.story.findUnique({
      where: { shareToken: token },
      include: { panels: true },
    });
    if (!story || !isStoryPlayable(story)) {
      return errorResponse('This story is not available.', undefined, 404);
    }

    const formData = await request.formData();

    const nameResult = studentNameSchema.safeParse(formData.get('studentName'));
    if (!nameResult.success) {
      return errorResponse('Please enter a name (max 40 characters).', undefined, 400);
    }

    let metaRaw: unknown;
    try {
      metaRaw = JSON.parse(String(formData.get('meta') ?? ''));
    } catch {
      return errorResponse('Invalid submission metadata.', undefined, 400);
    }
    const metaResult = submissionMetaSchema.safeParse(metaRaw);
    if (!metaResult.success) {
      return errorResponse('Invalid submission metadata.', metaResult.error.flatten(), 400);
    }
    const meta = metaResult.data;

    const files: Array<{ panelOrder: number; file: File }> = [];
    for (let order = 1; order <= STORY_PANEL_COUNT; order++) {
      const file = formData.get(`audio-${order}`);
      if (!(file instanceof File) || file.size === 0) {
        return errorResponse(`Recording for picture ${order} is missing.`, undefined, 400);
      }
      if (file.size > RECORDING_MAX_BYTES) {
        return errorResponse(`Recording for picture ${order} is too large.`, undefined, 400);
      }
      if (file.type && !file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        // iOS Safari can label MediaRecorder output as video/mp4 even for audio-only.
        return errorResponse(`Recording for picture ${order} is not audio.`, undefined, 400);
      }
      files.push({ panelOrder: order, file });
    }

    const submissionId = crypto.randomUUID();
    const uploads = await Promise.all(
      files.map(async ({ panelOrder, file }) => {
        const blob = await put(
          `story-audio/${story.id}/${submissionId}/panel-${panelOrder}.${audioExtension(file.type)}`,
          Buffer.from(await file.arrayBuffer()),
          { access: 'public', contentType: file.type || 'audio/webm' }
        );
        return { panelOrder, url: blob.url, mimeType: file.type || 'audio/webm' };
      })
    );

    const submission = await prisma.storySubmission.create({
      data: {
        storyId: story.id,
        studentName: nameResult.data,
        recordings: {
          create: uploads.map((upload) => {
            const panelMeta = meta.find(
              (item) => item.panelOrder === upload.panelOrder
            );
            return {
              panelOrder: upload.panelOrder,
              audioUrl: upload.url,
              mimeType: upload.mimeType,
              durationMs: panelMeta?.durationMs ?? 0,
              envelope: panelMeta?.envelope ?? [],
            };
          }),
        },
      },
    });

    return successResponse({ submissionId: submission.id }, 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/story-session/[token]/submit');
  }
}
