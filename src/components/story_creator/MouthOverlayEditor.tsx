'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouthPlacement, MouthStyle } from '@/lib/stories/schemas'
import { MOUTH_STYLES } from '@/lib/stories/schemas'
import { drawMouth } from '@/lib/stories/mouth-draw'

interface MouthOverlayEditorProps {
  imageUrl: string
  mouth: MouthPlacement
  onChange: (mouth: MouthPlacement) => void
}

const STYLE_LABELS: Record<MouthStyle, string> = {
  cartoon: 'Big lips',
  duck: 'Duck bill',
  monster: 'Monster',
}

/**
 * Drag the animated mouth onto the character; resize and rotate with sliders.
 * Coordinates are stored normalized (0-1) so they render identically in the
 * movie player at any resolution.
 */
export default function MouthOverlayEditor({
  imageUrl,
  mouth,
  onChange,
}: MouthOverlayEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const draggingRef = useRef(false)
  const mouthRef = useRef(mouth)
  mouthRef.current = mouth

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Animated "talk test" so the teacher sees the mouth move while placing it.
  useEffect(() => {
    let raf = 0
    const loop = (time: number) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const open = 0.5 + 0.5 * Math.sin(time * 0.006)
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        drawMouth(ctx, mouthRef.current.style, open, canvas.width / 1.4)
        ctx.restore()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const updateFromPointer = useCallback(
    (event: React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
      const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
      onChange({ ...mouthRef.current, x, y })
    },
    [onChange]
  )

  const mouthWidthPx = mouth.scale * containerWidth
  const widgetW = Math.max(24, mouthWidthPx * 1.4)
  const widgetH = Math.max(20, mouthWidthPx * 1.1)

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative w-full touch-none select-none overflow-hidden rounded-lg border bg-slate-100"
        style={{ aspectRatio: '4 / 3' }}
        onPointerDown={(event) => {
          draggingRef.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          updateFromPointer(event)
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) updateFromPointer(event)
        }}
        onPointerUp={() => {
          draggingRef.current = false
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Story panel"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          width={Math.round(widgetW)}
          height={Math.round(widgetH)}
          className="pointer-events-none absolute cursor-move drop-shadow-lg"
          style={{
            left: `calc(${mouth.x * 100}% - ${widgetW / 2}px)`,
            top: `calc(${mouth.y * 100}% - ${widgetH / 2}px)`,
            transform: `rotate(${mouth.rotation}deg)`,
          }}
        />
        <p className="pointer-events-none absolute bottom-1 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
          Tap or drag to place the mouth
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {MOUTH_STYLES.map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => onChange({ ...mouth, style })}
            className={`rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors ${
              mouth.style === style
                ? 'border-violet-500 bg-violet-100 text-violet-800'
                : 'border-gray-300 bg-white text-gray-600 hover:border-violet-300'
            }`}
          >
            {STYLE_LABELS[style]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm text-slate-600">
          Size
          <input
            type="range"
            min={0.04}
            max={0.5}
            step={0.01}
            value={mouth.scale}
            onChange={(event) =>
              onChange({ ...mouth, scale: Number(event.target.value) })
            }
            className="w-full accent-violet-600"
          />
        </label>
        <label className="text-sm text-slate-600">
          Tilt
          <input
            type="range"
            min={-45}
            max={45}
            step={1}
            value={mouth.rotation}
            onChange={(event) =>
              onChange({ ...mouth, rotation: Number(event.target.value) })
            }
            className="w-full accent-violet-600"
          />
        </label>
      </div>
    </div>
  )
}
