'use client'

import { useEffect, useRef, useState } from 'react'
import type { MouthPlacement } from '@/lib/stories/schemas'
import { DEFAULT_MOUTH } from '@/lib/stories/schemas'
import { drawMouth } from '@/lib/stories/mouth-draw'

interface MouthedImageProps {
  imageUrl: string
  mouth: MouthPlacement | null
  /** Live mouth openness source (0-1), sampled every animation frame. */
  getOpen: () => number
  className?: string
}

/** A story panel with its animated mouth overlay (student screens). */
export default function MouthedImage({
  imageUrl,
  mouth,
  getOpen,
  className,
}: MouthedImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(0)
  const getOpenRef = useRef(getOpen)
  getOpenRef.current = getOpen

  const placement = mouth ?? DEFAULT_MOUTH

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0]?.contentRect.width ?? 0)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        drawMouth(ctx, placement.style, getOpenRef.current(), canvas.width / 1.4)
        ctx.restore()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [placement.style])

  const mouthWidthPx = placement.scale * width
  const widgetW = Math.max(16, mouthWidthPx * 1.4)
  const widgetH = Math.max(14, mouthWidthPx * 1.1)

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl bg-slate-100 ${className ?? ''}`}
      style={{ aspectRatio: '4 / 3' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Story picture"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <canvas
        ref={canvasRef}
        width={Math.round(widgetW)}
        height={Math.round(widgetH)}
        className="pointer-events-none absolute"
        style={{
          left: `calc(${placement.x * 100}% - ${widgetW / 2}px)`,
          top: `calc(${placement.y * 100}% - ${widgetH / 2}px)`,
          transform: `rotate(${placement.rotation}deg)`,
        }}
      />
    </div>
  )
}
