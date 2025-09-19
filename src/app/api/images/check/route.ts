import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CheckImageRequest {
  originalUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckImageRequest = await request.json();
    const { originalUrl } = body;

    if (!originalUrl) {
      return NextResponse.json(
        { error: 'Missing required field: originalUrl' },
        { status: 400 }
      );
    }

    // Check if image already exists in database by originalUrl
    const existingImage = await prisma.storedImage.findFirst({
      where: {
        originalUrl: originalUrl
      },
      select: {
        id: true,
        blobUrl: true,
        filename: true,
        width: true,
        height: true,
        mimeType: true,
        fileSize: true,
        usageCount: true
      }
    });

    if (existingImage) {
      // Update usage count and last used timestamp
      await prisma.storedImage.update({
        where: { id: existingImage.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      });

      return NextResponse.json({
        exists: true,
        image: existingImage
      });
    }

    return NextResponse.json({
      exists: false
    });

  } catch (error) {
    console.error('Error checking image existence:', error);
    return NextResponse.json(
      { error: 'Failed to check image existence' },
      { status: 500 }
    );
  }
}
