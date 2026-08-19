import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { requireAuth, isUnauthorized } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import {
  panelGenerateSchema,
  panelPatchSchema,
  STORY_PANEL_COUNT,
} from '@/lib/stories/schemas';
import { createPanelImagePrompt } from '@/lib/stories/story-generation';
import {
  fetchReferenceImage,
  generatePanelImage,
} from '@/lib/stories/image-generation';
import { detectMouthPlacement } from '@/lib/stories/mouth-detection';
import { getOwnedStory, parseMouth, toPanelDto } from '@/lib/stories/service';

export const runtime = 'nodejs';
export const maxDuration = 120;

type RouteContext = { params: Promise<{ id: string; order: string }> };

function parseOrder(raw: string): number | null {
  const order = Number.parseInt(raw, 10);
  if (!Number.isInteger(order) || order < 1 || order > STORY_PANEL_COUNT) {
    return null;
  }
  return order;
}

/** Edit a panel's example sentence, scene description, or mouth placement. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const { id, order: rawOrder } = await context.params;
    const order = parseOrder(rawOrder);
    if (!order) return errorResponse('Invalid panel number', undefined, 400);

    const story = await getOwnedStory(id, authResult.userId);
    if (!story) return errorResponse('Story not found', undefined, 404);

    const panel = story.panels.find((candidate) => candidate.order === order);
    if (!panel) return errorResponse('Panel not found', undefined, 404);

    const parsed = panelPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse('Invalid panel update', parsed.error.flatten(), 400);
    }

    const updated = await prisma.storyPanel.update({
      where: { id: panel.id },
      data: parsed.data,
    });

    return successResponse(toPanelDto(updated));
  } catch (error) {
    return handleApiError(error, 'PATCH /api/stories/[id]/panels/[order]');
  }
}

/**
 * Generate (or regenerate) this panel's image with Gemini image generation.
 * Another already-generated panel is passed as a reference image so the
 * character stays consistent across the story.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const { id, order: rawOrder } = await context.params;
    const order = parseOrder(rawOrder);
    if (!order) return errorResponse('Invalid panel number', undefined, 400);

    const story = await getOwnedStory(id, authResult.userId);
    if (!story) return errorResponse('Story not found', undefined, 404);

    const panel = story.panels.find((candidate) => candidate.order === order);
    if (!panel) return errorResponse('Panel not found', undefined, 404);

    const parsed = panelGenerateSchema.safeParse(
      await request.json().catch(() => ({}))
    );
    if (!parsed.success) {
      return errorResponse('Invalid generate request', parsed.error.flatten(), 400);
    }

    // Character consistency: reference the earliest other panel that has an image.
    const referencePanel = story.panels
      .filter((candidate) => candidate.order !== order && candidate.imageUrl)
      .sort((a, b) => a.order - b.order)[0];
    const referenceImage = referencePanel?.imageUrl
      ? await fetchReferenceImage(referencePanel.imageUrl)
      : null;

    const prompt = createPanelImagePrompt({
      characterSheet: story.characterSheet ?? 'A friendly cartoon child',
      artStyle:
        story.artStyle ??
        'bright flat cartoon, thick outlines, warm colors, children\'s book style',
      sceneDescription: panel.sceneDescription,
      panelOrder: order,
      hasReferenceImage: !!referenceImage,
      tweak: parsed.data.tweak,
    });

    const image = await generatePanelImage({
      prompt,
      referenceImage: referenceImage ?? undefined,
    });

    const extension = image.mimeType.includes('jpeg') ? 'jpg' : 'png';
    const blob = await put(
      `story-images/${story.id}/panel-${order}-${Date.now()}.${extension}`,
      image.bytes,
      { access: 'public', contentType: image.mimeType }
    );

    // Auto-suggest the mouth position; keep the teacher's chosen style.
    const detected = await detectMouthPlacement({
      mimeType: image.mimeType,
      base64: image.bytes.toString('base64'),
    });
    const existingStyle = parseMouth(panel.mouth)?.style;
    const mouth = existingStyle ? { ...detected, style: existingStyle } : detected;

    const updated = await prisma.storyPanel.update({
      where: { id: panel.id },
      data: { imageUrl: blob.url, imagePrompt: prompt, mouth },
    });

    // First time all four panels have art, the story becomes shareable.
    const allGenerated = story.panels.every(
      (candidate) => candidate.order === order || candidate.imageUrl
    );
    if (allGenerated && story.status === 'DRAFT') {
      await prisma.story.update({
        where: { id: story.id },
        data: { status: 'READY' },
      });
    }

    return successResponse(toPanelDto(updated));
  } catch (error) {
    return handleApiError(error, 'POST /api/stories/[id]/panels/[order]');
  }
}
