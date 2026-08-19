'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, RotateCcw, Loader2 } from 'lucide-react'
import type { MouthPlacement } from '@/lib/stories/schemas'
import { buildStoryTimeline, cameraAt, type StoryTimeline } from '@/lib/stories/timeline'
import { envelopeValueAt } from '@/lib/stories/envelope'
import { drawMouth } from '@/lib/stories/mouth-draw'
import { DEFAULT_MOUTH } from '@/lib/stories/schemas'

export interface MoviePanel {
  imageUrl: string
  mouth: MouthPlacement | null
}

export interface MovieClip {
  /** Remote URL or local object URL. */
  audioUrl: string
  durationMs: number
  envelope: number[]
}

interface MoviePlayerProps {
  title: string
  byline?: string
  panels: MoviePanel[]
  clips: MovieClip[]
  /** Called when the movie reaches the end. */
  onComplete?: () => void
  className?: string
}

const FRAME_W = 1280
const FRAME_H = 720
const PANEL_H = FRAME_H * 0.84
const PANEL_W = (PANEL_H * 4) / 3
const PANEL_GAP = 110
const STEP = PANEL_W + PANEL_GAP

/**
 * The "movie" is performed live: a virtual camera zooms and pans across a
 * 1x4 filmstrip of the panels while each clip plays and the mouth overlay
 * animates from the recording's amplitude envelope. No video file involved.
 */
export default function MoviePlayer({
  title,
  byline,
  panels,
  clips,
  onComplete,
  className,
}: MoviePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [images, setImages] = useState<HTMLImageElement[] | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'playing' | 'paused' | 'ended'>('loading')

  const timelineRef = useRef<StoryTimeline>(buildStoryTimeline(clips.map((c) => c.durationMs)))
  const audiosRef = useRef<HTMLAudioElement[]>([])
  const startedRef = useRef<boolean[]>([])
  const clockRef = useRef<{ startedAt: number; pausedAt: number | null }>({
    startedAt: 0,
    pausedAt: null,
  })
  const rafRef = useRef<number>(0)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    timelineRef.current = buildStoryTimeline(clips.map((c) => c.durationMs))
  }, [clips])

  // Preload panel images.
  useEffect(() => {
    let cancelled = false
    setState('loading')
    Promise.all(
      panels.map(
        (panel) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error(`Failed to load ${panel.imageUrl}`))
            img.src = panel.imageUrl
          })
      )
    )
      .then((loaded) => {
        if (cancelled) return
        setImages(loaded)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('ready')
      })
    return () => {
      cancelled = true
    }
  }, [panels])

  // Prepare audio elements.
  useEffect(() => {
    audiosRef.current = clips.map((clip) => {
      const audio = new Audio(clip.audioUrl)
      audio.preload = 'auto'
      return audio
    })
    startedRef.current = clips.map(() => false)
    return () => {
      audiosRef.current.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      audiosRef.current = []
    }
  }, [clips])

  const renderFrame = useCallback(
    (tMs: number) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx || !images) return

      const timeline = timelineRef.current
      const camera = cameraAt(timeline, tMs, panels.length)

      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, FRAME_W, FRAME_H)

      ctx.save()
      ctx.translate(FRAME_W / 2, FRAME_H / 2)
      ctx.scale(camera.zoom, camera.zoom)
      ctx.translate(-camera.focus * STEP, 0)

      panels.forEach((panel, index) => {
        const img = images[index]
        if (!img) return
        const x = index * STEP - PANEL_W / 2
        const y = -PANEL_H / 2

        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.55)'
        ctx.shadowBlur = 34
        ctx.fillStyle = '#111'
        ctx.fillRect(x - 6, y - 6, PANEL_W + 12, PANEL_H + 12)
        ctx.restore()
        ctx.drawImage(img, x, y, PANEL_W, PANEL_H)

        // Mouth overlay
        const mouth = panel.mouth ?? DEFAULT_MOUTH
        const clip = clips[index]
        let open = 0
        const audio = audiosRef.current[index]
        if (audio && !audio.paused && !audio.ended) {
          const offsetMs = audio.currentTime * 1000
          open =
            clip.envelope.length > 0
              ? envelopeValueAt(clip.envelope, offsetMs)
              : 0.5 + 0.5 * Math.sin(offsetMs * 0.025)
        }

        ctx.save()
        ctx.translate(x + mouth.x * PANEL_W, y + mouth.y * PANEL_H)
        ctx.rotate((mouth.rotation * Math.PI) / 180)
        drawMouth(ctx, mouth.style, open, mouth.scale * PANEL_W)
        ctx.restore()
      })

      ctx.restore()

      // Overlays
      if (camera.titleAlpha > 0) {
        ctx.fillStyle = `rgba(5, 8, 20, ${0.62 * camera.titleAlpha})`
        ctx.fillRect(0, 0, FRAME_W, FRAME_H)
        ctx.fillStyle = `rgba(255, 255, 255, ${camera.titleAlpha})`
        ctx.textAlign = 'center'
        ctx.font = 'bold 68px Grandstander, "Comic Sans MS", sans-serif'
        ctx.fillText(title, FRAME_W / 2, FRAME_H / 2 - 14, FRAME_W - 160)
        if (byline) {
          ctx.font = '36px Grandstander, "Comic Sans MS", sans-serif'
          ctx.fillStyle = `rgba(216, 220, 255, ${camera.titleAlpha})`
          ctx.fillText(byline, FRAME_W / 2, FRAME_H / 2 + 52, FRAME_W - 200)
        }
      }
      if (camera.endAlpha > 0) {
        ctx.fillStyle = `rgba(5, 8, 20, ${0.45 * camera.endAlpha})`
        ctx.fillRect(0, 0, FRAME_W, FRAME_H)
        ctx.fillStyle = `rgba(255, 255, 255, ${camera.endAlpha})`
        ctx.textAlign = 'center'
        ctx.font = 'bold 76px Grandstander, "Comic Sans MS", sans-serif'
        ctx.fillText('The End', FRAME_W / 2, FRAME_H / 2 - 10)
        if (byline) {
          ctx.font = '34px Grandstander, "Comic Sans MS", sans-serif'
          ctx.fillStyle = `rgba(216, 220, 255, ${camera.endAlpha})`
          ctx.fillText(byline, FRAME_W / 2, FRAME_H / 2 + 50)
        }
      }

      // Progress bar
      const progress = Math.min(1, tMs / timeline.totalMs)
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(0, FRAME_H - 6, FRAME_W, 6)
      ctx.fillStyle = 'rgba(167, 139, 250, 0.9)'
      ctx.fillRect(0, FRAME_H - 6, FRAME_W * progress, 6)
    },
    [images, panels, clips, title, byline]
  )

  const stopAllAudio = useCallback(() => {
    audiosRef.current.forEach((audio) => audio.pause())
  }, [])

  const tick = useCallback(() => {
    if (stateRef.current !== 'playing') return
    const timeline = timelineRef.current
    const t = performance.now() - clockRef.current.startedAt

    // Start clips whose time has come.
    timeline.audioStarts.forEach((startMs, index) => {
      if (t >= startMs && !startedRef.current[index]) {
        startedRef.current[index] = true
        void audiosRef.current[index]?.play().catch(() => {})
      }
    })

    renderFrame(t)

    if (t >= timeline.totalMs) {
      stopAllAudio()
      setState('ended')
      onComplete?.()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [renderFrame, stopAllAudio, onComplete])

  const play = useCallback(() => {
    if (stateRef.current === 'paused' && clockRef.current.pausedAt !== null) {
      // Shift the clock so elapsed time resumes where it stopped.
      clockRef.current.startedAt += performance.now() - clockRef.current.pausedAt
      clockRef.current.pausedAt = null
      // Resume the clip that was mid-playback.
      const t = performance.now() - clockRef.current.startedAt
      timelineRef.current.audioStarts.forEach((startMs, index) => {
        const endMs = startMs + clips[index].durationMs
        if (startedRef.current[index] && t >= startMs && t < endMs) {
          void audiosRef.current[index]?.play().catch(() => {})
        }
      })
    } else {
      clockRef.current.startedAt = performance.now()
      clockRef.current.pausedAt = null
      startedRef.current = clips.map(() => false)
      audiosRef.current.forEach((audio) => {
        audio.pause()
        audio.currentTime = 0
      })
    }
    setState('playing')
    cancelAnimationFrame(rafRef.current)
    // Wait one frame so stateRef reflects 'playing'.
    requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(tick)
    })
  }, [clips, tick])

  const pause = useCallback(() => {
    clockRef.current.pausedAt = performance.now()
    stopAllAudio()
    setState('paused')
    cancelAnimationFrame(rafRef.current)
  }, [stopAllAudio])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  // Draw a poster frame once assets are ready.
  useEffect(() => {
    if (state === 'ready') renderFrame(0)
  }, [state, renderFrame])

  const showBigButton = state === 'ready' || state === 'ended' || state === 'paused'

  return (
    <div className={`relative overflow-hidden rounded-xl bg-black ${className ?? ''}`}>
      <canvas
        ref={canvasRef}
        width={FRAME_W}
        height={FRAME_H}
        className="block h-auto w-full cursor-pointer"
        onClick={() => {
          if (stateRef.current === 'playing') pause()
          else if (showBigButton) play()
        }}
      />
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <Loader2 className="h-12 w-12 animate-spin text-violet-300" />
        </div>
      )}
      {showBigButton && (
        <button
          type="button"
          aria-label={state === 'ended' ? 'Replay movie' : 'Play movie'}
          onClick={() => play()}
          className="absolute inset-0 flex items-center justify-center bg-black/35 transition-colors hover:bg-black/25"
        >
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-violet-500 text-white shadow-xl">
            {state === 'ended' ? (
              <RotateCcw className="h-12 w-12" />
            ) : (
              <Play className="ml-2 h-12 w-12" />
            )}
          </span>
        </button>
      )}
    </div>
  )
}
