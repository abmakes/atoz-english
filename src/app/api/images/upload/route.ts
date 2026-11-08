import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { requireAuth, isUnauthorized } from '@/lib/auth'
import {
  QUESTION_IMAGE_MAX_BYTES,
  isWebpBytes,
} from '@/lib/images/question-webp'

function readDimension(value: FormDataEntryValue | null): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.min(8000, Math.round(parsed))
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (isUnauthorized(authResult)) return authResult

    const form = await request.formData()
    const file = form.get('image')
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Choose an image to upload.' },
        { status: 400 }
      )
    }
    if (file.type !== 'image/webp') {
      return NextResponse.json(
        { error: 'Question images are stored as WebP.' },
        { status: 400 }
      )
    }
    if (file.size <= 0 || file.size > QUESTION_IMAGE_MAX_BYTES) {
      return NextResponse.json(
        { error: 'Image must be 8 MB or smaller.' },
        { status: 400 }
      )
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    if (!isWebpBytes(bytes)) {
      return NextResponse.json(
        { error: 'That file is not a WebP image.' },
        { status: 400 }
      )
    }

    const filename = `pasted_${Date.now()}.webp`
    const blob = await put(`question-images/${filename}`, bytes, {
      access: 'public',
      contentType: 'image/webp',
    })

    const width = readDimension(form.get('width'))
    const height = readDimension(form.get('height'))
    const searchTerm = String(form.get('searchTerm') || '').trim().slice(0, 80)

    let storedId: string | null = null
    try {
      const saved = await prisma.storedImage.create({
        data: {
          filename,
          originalUrl: `pasted://${filename}`,
          blobUrl: blob.url,
          mimeType: 'image/webp',
          fileSize: bytes.byteLength,
          width,
          height,
          searchTerm: searchTerm || 'pasted question image',
          tags: ['pasted'],
          usageCount: 1,
          lastUsedAt: new Date(),
        },
      })
      storedId = saved.id
    } catch (error) {
      console.error('Pasted image was stored, but the library row was not:', error)
    }

    return NextResponse.json({
      success: true,
      image: {
        id: storedId,
        blobUrl: blob.url,
        filename,
        width,
        height,
        mimeType: 'image/webp',
      },
    })
  } catch (error) {
    console.error('Failed to store pasted question image:', error)
    return NextResponse.json(
      { error: 'Could not save the image.' },
      { status: 500 }
    )
  }
}
