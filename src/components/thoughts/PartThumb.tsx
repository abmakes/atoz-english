'use client'

import { useEffect, useRef } from 'react'
import { getSheet, previewFrame, type CatalogPart } from '@/lib/thoughts/catalog'
import { loadSheet } from '@/components/thoughts/sheets'

export function PartThumb({ part }: { part: CatalogPart }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const sheet = getSheet(part.sheet)
    const canvas = canvasRef.current
    if (!sheet || !canvas) return
    let cancelled = false
    void loadSheet(sheet.src).then((image) => {
      if (cancelled) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const frame = previewFrame(part)
      const size = canvas.width
      ctx.clearRect(0, 0, size, size)
      const width = size * 0.86
      const height = width * (frame.height / Math.max(1, frame.width))
      ctx.drawImage(
        image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        (size - width) / 2,
        (size - height) / 2,
        width,
        height
      )
    })
    return () => {
      cancelled = true
    }
  }, [part])

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      className="h-12 w-12"
      aria-hidden
    />
  )
}
