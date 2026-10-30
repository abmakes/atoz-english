'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { drawCharacter, hitTestPart } from '@/lib/thoughts/draw'
import { getPart, getSheet } from '@/lib/thoughts/catalog'
import type { Character } from '@/lib/thoughts/character'
import { loadSheet } from '@/components/thoughts/sheets'

interface FaceStageProps {
  character: Character
  getLevel: () => number
  selectedId?: string | null
  interactive?: boolean
  /** Blink and bob. Static cards skip the frame loop until they are playing. */
  animate?: boolean
  onSelect?: (instanceId: string | null) => void
  onMove?: (instanceId: string, x: number, y: number) => void
  className?: string
}

export default function FaceStage({
  character,
  getLevel,
  selectedId = null,
  interactive = false,
  animate = true,
  onSelect,
  onMove,
  className,
}: FaceStageProps) {
  const [imageTick, setImageTick] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const reducedRef = useRef(false)
  const characterRef = useRef(character)
  const selectedRef = useRef(selectedId)
  const getLevelRef = useRef(getLevel)
  const dragRef = useRef<{ instanceId: string; offsetX: number; offsetY: number } | null>(null)
  const bobRef = useRef(0)
  characterRef.current = character
  selectedRef.current = selectedId
  getLevelRef.current = getLevel

  const sheetKey = character.parts
    .map((part) => getPart(part.partId)?.sheet ?? '')
    .join('|')

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      reducedRef.current = media.matches
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    let cancelled = false
    const sources = [
      ...new Set(
        characterRef.current.parts
          .map((part) => getSheet(getPart(part.partId)?.sheet ?? '')?.src)
          .filter((src): src is string => Boolean(src))
      ),
    ]
    void Promise.all(sources.map((src) => loadSheet(src))).then((images) => {
      if (cancelled) return
      images.forEach((image, index) => {
        imagesRef.current.set(sources[index], image)
      })
      setImageTick((tick) => tick + 1)
    })
    return () => {
      cancelled = true
    }
  }, [sheetKey])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const draw = (loop: boolean) => {
      const rect = canvas.getBoundingClientRect()
      const stage = Math.max(1, rect.width)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const pixels = Math.round(stage * dpr)
      if (canvas.width !== pixels || canvas.height !== pixels) {
        canvas.width = pixels
        canvas.height = pixels
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const now = performance.now()
      const reduced = reducedRef.current || !loop
      bobRef.current = reduced ? 0 : Math.sin(now / 900) * 3
      drawCharacter(ctx, characterRef.current, imagesRef.current, {
        stage,
        amplitude: loop ? getLevelRef.current() : 0,
        nowMs: now,
        reducedMotion: reduced,
        selectedId: interactive ? selectedRef.current : null,
      })
      if (loop) raf = requestAnimationFrame(() => draw(true))
    }
    if (!animate) {
      draw(false)
      const observer = new ResizeObserver(() => draw(false))
      observer.observe(canvas)
      return () => observer.disconnect()
    }
    raf = requestAnimationFrame(() => draw(true))
    return () => cancelAnimationFrame(raf)
  }, [animate, imageTick, interactive, sheetKey])

  const localPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      stage: rect.width,
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={`aspect-square w-full touch-none rounded-3xl bg-[#efe4ff] ${className ?? ''}`}
      aria-label="Talking face"
      onPointerDown={(event) => {
        if (!interactive) return
        const point = localPoint(event)
        const hit = hitTestPart(
          characterRef.current,
          point.x,
          point.y,
          point.stage,
          bobRef.current
        )
        onSelect?.(hit?.instanceId ?? null)
        const definition = hit ? getPart(hit.partId) : undefined
        if (!hit || definition?.category === 'head') {
          dragRef.current = null
          return
        }
        dragRef.current = {
          instanceId: hit.instanceId,
          offsetX: point.x - hit.x * point.stage,
          offsetY: point.y - bobRef.current - hit.y * point.stage,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current
        if (!drag) return
        const point = localPoint(event)
        const x = Math.min(1, Math.max(0, (point.x - drag.offsetX) / point.stage))
        const y = Math.min(
          1,
          Math.max(0, (point.y - bobRef.current - drag.offsetY) / point.stage)
        )
        onMove?.(drag.instanceId, x, y)
      }}
      onPointerUp={() => {
        dragRef.current = null
      }}
      onPointerCancel={() => {
        dragRef.current = null
      }}
    />
  )
}
