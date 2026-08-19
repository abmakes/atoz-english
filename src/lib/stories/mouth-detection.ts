import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { DEFAULT_MOUTH, type MouthPlacement } from '@/lib/stories/schemas';

const detectionSchema = z.object({
  found: z.boolean(),
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  width: z.number().min(0.01).max(0.8).optional(),
});

/**
 * Ask Gemini vision for the main character's mouth position so the teacher
 * gets a sensible default. Best-effort: any failure falls back to a centered
 * default placement the teacher can drag into place.
 */
export async function detectMouthPlacement(image: {
  mimeType: string;
  base64: string;
}): Promise<MouthPlacement> {
  const apiKey = process.env.GEMINI_QUIZ_API_KEY;
  if (!apiKey) return DEFAULT_MOUTH;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent([
      {
        text: `Find the MAIN character's mouth in this illustration.
Return ONLY JSON: {"found": true|false, "x": 0-1, "y": 0-1, "width": 0-1}
- x, y: center of the mouth as fractions of image width/height
- width: mouth width as a fraction of image width
- If several characters, pick the most prominent one.
- If no character face is visible, return {"found": false}`,
      },
      { inlineData: { mimeType: image.mimeType, data: image.base64 } },
    ]);

    const raw = (await result.response)
      .text()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    const detection = detectionSchema.parse(JSON.parse(raw));

    if (!detection.found || detection.x == null || detection.y == null) {
      return DEFAULT_MOUTH;
    }

    return {
      ...DEFAULT_MOUTH,
      x: detection.x,
      y: detection.y,
      // Exaggerate a little: the fun mouths should be bigger than the drawn one.
      scale: Math.min(0.4, Math.max(0.08, (detection.width ?? 0.1) * 1.6)),
    };
  } catch (error) {
    console.warn('Mouth detection failed; using default placement', error);
    return DEFAULT_MOUTH;
  }
}
