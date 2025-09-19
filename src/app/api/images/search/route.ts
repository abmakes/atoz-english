import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build search conditions
    const where: Record<string, unknown> = {};

    // Search by query (searchTerm or tags)
    if (query.trim()) {
      where.OR = [
        { searchTerm: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } }
      ];
    }

    // Filter by specific tags
    if (tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Remove source filtering since we only store Pixabay images

    // Get images with pagination
    const [images, totalCount] = await Promise.all([
      prisma.storedImage.findMany({
        where,
        orderBy: [
          { usageCount: 'desc' }, // Most used first
          { createdAt: 'desc' }   // Then newest first
        ],
        skip,
        take: limit,
        select: {
          id: true,
          filename: true,
          blobUrl: true,
          width: true,
          height: true,
          mimeType: true,
          searchTerm: true,
          tags: true,
          usageCount: true,
          lastUsedAt: true,
          createdAt: true
        }
      }),
      prisma.storedImage.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        images,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error searching images:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}
