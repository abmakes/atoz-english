import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    // Get top used images ordered by usage count
    const images = await prisma.storedImage.findMany({
      orderBy: [
        { usageCount: 'desc' }, // Most used first
        { lastUsedAt: 'desc' }, // Then most recently used
        { createdAt: 'desc' }   // Then newest first
      ],
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
        createdAt: true,
        pixabayId: true,
        pixabayUser: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        images,
        totalCount: images.length
      }
    });

  } catch (error) {
    console.error('Error fetching top used images:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch top used images' 
      },
      { status: 500 }
    );
  }
}
