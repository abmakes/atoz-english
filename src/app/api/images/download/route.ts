import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { requireAuth, isUnauthorized } from '@/lib/auth';

interface DownloadPixabayImageRequest {
  imageUrl: string;
  pixabayId: number;
  pixabayUser: string;
  searchTerm: string;
  tags: string[];
  width: number;
  height: number;
  mimeType: string;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const body: DownloadPixabayImageRequest = await request.json();
    const { imageUrl, pixabayId, pixabayUser, searchTerm, tags, width, height, mimeType } = body;

    // Validate required fields
    if (!imageUrl || !pixabayId) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl and pixabayId' },
        { status: 400 }
      );
    }

    // Check if image already exists in database
    const existingImage = await prisma.storedImage.findUnique({
      where: {
        pixabayId: pixabayId
      }
    });

    if (existingImage) {
      // Update usage count and return existing image
      const updatedImage = await prisma.storedImage.update({
        where: { id: existingImage.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        image: {
          id: updatedImage.id,
          blobUrl: updatedImage.blobUrl,
          filename: updatedImage.filename,
          width: updatedImage.width,
          height: updatedImage.height,
          mimeType: updatedImage.mimeType
        }
      });
    }

    // Download image from Pixabay
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const fileSize = imageBuffer.byteLength;

    // Generate unique filename
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const filename = `pixabay_${pixabayId}_${Date.now()}.${fileExtension}`;
    
    // Upload to Vercel Blob storage
    const blob = await put(`pixabay-images/${filename}`, imageBuffer, { 
      access: 'public',
      contentType: mimeType
    });

    // Save image metadata to database
    const savedImage = await prisma.storedImage.create({
      data: {
        filename,
        originalUrl: imageUrl,
        blobUrl: blob.url, // Store the blob URL
        mimeType,
        fileSize,
        width,
        height,
        searchTerm,
        tags,
        pixabayId,
        pixabayUser,
        usageCount: 1,
        lastUsedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        blobUrl: savedImage.blobUrl,
        filename: savedImage.filename,
        width: savedImage.width,
        height: savedImage.height,
        mimeType: savedImage.mimeType
      }
    });

  } catch (error) {
    console.error('Error downloading and storing image:', error);
    return NextResponse.json(
      { error: 'Failed to download and store image' },
      { status: 500 }
    );
  }
}
