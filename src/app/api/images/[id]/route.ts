import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const image = await prisma.storedImage.findUnique({
      where: { id },
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
        originalUrl: true,
        pixabayId: true,
        pixabayUser: true
      }
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      image
    });

  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { tags, searchTerm } = body;

    const updatedImage = await prisma.storedImage.update({
      where: { id },
      data: {
        ...(tags && { tags }),
        ...(searchTerm && { searchTerm }),
        lastUsedAt: new Date()
      },
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
    });

    return NextResponse.json({
      success: true,
      image: updatedImage
    });

  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}
