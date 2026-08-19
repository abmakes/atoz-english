const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_OPENROUTER_IMAGE_MODEL = 'google/gemini-2.5-flash-image';

export interface GeneratedImage {
  bytes: Buffer;
  mimeType: string;
}

interface OpenRouterImagePart {
  type?: string;
  image_url?: { url?: string };
  imageUrl?: { url?: string };
}

interface OpenRouterMessage {
  images?: OpenRouterImagePart[];
  content?: unknown;
}

/**
 * Generate one story panel image via OpenRouter (Gemini Flash Image).
 * Uses OPENROUTER_API_KEY + OPENROUTER_MODEL from the environment.
 * Optionally passes a reference image so the character stays consistent
 * across panels (image-to-image).
 */
export async function generatePanelImage(input: {
  prompt: string;
  referenceImage?: { mimeType: string; base64: string };
}): Promise<GeneratedImage> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const model =
    process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_MODEL;

  const content: Array<Record<string, unknown>> = [
    { type: 'text', text: input.prompt },
  ];
  if (input.referenceImage) {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${input.referenceImage.mimeType};base64,${input.referenceImage.base64}`,
      },
    });
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER ?? 'https://playtoz.com',
      'X-Title': process.env.OPENROUTER_APP_TITLE ?? 'PlaytoZ Story Creator',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
      modalities: ['image', 'text'],
      image_config: {
        aspect_ratio: '4:3',
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Image generation failed (${response.status}): ${detail.slice(0, 500)}`
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: OpenRouterMessage }>;
    error?: { message?: string };
  };

  if (payload.error?.message) {
    throw new Error(`Image generation failed: ${payload.error.message}`);
  }

  const message = payload.choices?.[0]?.message;
  const dataUrl = extractImageDataUrl(message);
  if (!dataUrl) {
    throw new Error('Image generation returned no image data');
  }

  return parseDataUrl(dataUrl);
}

function extractImageDataUrl(message: OpenRouterMessage | undefined): string | null {
  if (!message) return null;

  for (const image of message.images ?? []) {
    const url = image.image_url?.url ?? image.imageUrl?.url;
    if (url?.startsWith('data:image/')) return url;
  }

  // Some providers embed a data URL in the text content.
  if (typeof message.content === 'string') {
    const match = message.content.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/);
    if (match) return match[0];
  }

  if (Array.isArray(message.content)) {
    for (const part of message.content as OpenRouterImagePart[]) {
      const url = part.image_url?.url ?? part.imageUrl?.url;
      if (url?.startsWith('data:image/')) return url;
    }
  }

  return null;
}

function parseDataUrl(dataUrl: string): GeneratedImage {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) {
    throw new Error('Image generation returned an unrecognized image payload');
  }
  return {
    mimeType: match[1],
    bytes: Buffer.from(match[2], 'base64'),
  };
}

/** Download an existing panel image so it can be reused as a reference. */
export async function fetchReferenceImage(
  url: string
): Promise<{ mimeType: string; base64: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const mimeType = response.headers.get('content-type') ?? 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());
    return { mimeType, base64: buffer.toString('base64') };
  } catch {
    return null;
  }
}
