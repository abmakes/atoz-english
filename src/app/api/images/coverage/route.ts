import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isUnauthorized } from '@/lib/auth';

const MAX_WORDS = 400;
const MAX_IMAGES_PER_WORD = 6;

interface CoverageRequest {
  words?: unknown;
}

/**
 * Returns StoredImage coverage for vocabulary words.
 * A word is covered when searchTerm equals it (case-insensitive) or tags contain it.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const body: CoverageRequest = await request.json();
    if (!Array.isArray(body.words)) {
      return NextResponse.json(
        { error: 'Missing required field: words (string[])' },
        { status: 400 }
      );
    }

    const words = body.words
      .filter((w): w is string => typeof w === 'string')
      .map((w) => w.trim())
      .filter(Boolean);

    if (words.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    if (words.length > MAX_WORDS) {
      return NextResponse.json(
        { error: `Too many words; max ${MAX_WORDS} per request` },
        { status: 400 }
      );
    }

    const data: Record<
      string,
      {
        count: number;
        images: {
          id: string;
          blobUrl: string;
          searchTerm: string | null;
          tags: string[];
        }[];
      }
    > = {};

    // Parallel per-word lookups (bounded by MAX_WORDS). Indexed on searchTerm/tags.
    await Promise.all(
      words.map(async (word) => {
        const tagVariants = Array.from(
          new Set([word, word.toLowerCase(), word.toUpperCase()])
        );

        const where = {
          OR: [
            { searchTerm: { equals: word, mode: 'insensitive' as const } },
            { tags: { hasSome: tagVariants } },
          ],
        };

        const [count, images] = await Promise.all([
          prisma.storedImage.count({ where }),
          prisma.storedImage.findMany({
            where,
            orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
            take: MAX_IMAGES_PER_WORD,
            select: {
              id: true,
              blobUrl: true,
              searchTerm: true,
              tags: true,
            },
          }),
        ]);

        data[word] = { count, images };
      })
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error loading image coverage:', error);
    return NextResponse.json(
      { error: 'Failed to load image coverage' },
      { status: 500 }
    );
  }
}
