const IMAGE_MODEL = 'gemini-2.5-flash-image';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeneratedImage {
  bytes: Buffer;
  mimeType: string;
}

interface InlineDataPart {
  inlineData?: { mimeType?: string; data?: string };
}

/**
 * Generate one story panel image with Gemini image generation.
 * Optionally passes a reference image so the character stays consistent
 * across panels (reference-image chaining).
 */
export async function generatePanelImage(input: {
  prompt: string;
  referenceImage?: { mimeType: string; base64: string };
}): Promise<GeneratedImage> {
  const apiKey = process.env.GEMINI_QUIZ_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_QUIZ_API_KEY is not configured');
  }

  const parts: Array<Record<string, unknown>> = [{ text: input.prompt }];
  if (input.referenceImage) {
    parts.push({
      inlineData: {
        mimeType: input.referenceImage.mimeType,
        data: input.referenceImage.base64,
      },
    });
  }

  const response = await fetch(`${API_BASE}/${IMAGE_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '4:3' },
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
    candidates?: Array<{ content?: { parts?: InlineDataPart[] } }>;
  };
  const imagePart = payload.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error('Image generation returned no image data');
  }

  return {
    bytes: Buffer.from(imagePart.inlineData.data, 'base64'),
    mimeType: imagePart.inlineData.mimeType ?? 'image/png',
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
