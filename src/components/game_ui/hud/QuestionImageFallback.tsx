'use client'

import { useEffect, useState } from 'react'
import type { EventBus } from '@/lib/pixi-engine/core/EventBus'
import {
  GAME_STATE_EVENTS,
  HUD_EVENTS,
  type HudQuestionImageFallbackPayload,
} from '@/lib/pixi-engine/core/EventTypes'

interface QuestionImageFallbackProps {
  eventBus: EventBus
}

const DEFAULT_SLOT = { top: 0.04, left: 0.08, width: 0.84, height: 0.42 }

/**
 * HTML <img> over the Team Quiz image slot when Pixi GIF display is blank
 * (tablet / iOS fetch). Same URL generation already shows with <img>.
 */
export default function QuestionImageFallback({
  eventBus,
}: QuestionImageFallbackProps) {
  const [payload, setPayload] = useState<HudQuestionImageFallbackPayload | null>(
    null
  )

  useEffect(() => {
    const onFallback = (next: HudQuestionImageFallbackPayload) => {
      setPayload(next.imageUrl ? next : null)
    }
    const onEnded = () => setPayload(null)

    eventBus.on(HUD_EVENTS.QUESTION_IMAGE_FALLBACK, onFallback)
    eventBus.on(GAME_STATE_EVENTS.GAME_ENDED, onEnded)
    eventBus.emit(HUD_EVENTS.READY)
    return () => {
      eventBus.off(HUD_EVENTS.QUESTION_IMAGE_FALLBACK, onFallback)
      eventBus.off(GAME_STATE_EVENTS.GAME_ENDED, onEnded)
    }
  }, [eventBus])

  if (!payload?.imageUrl) return null

  const slot = payload.slot ?? DEFAULT_SLOT

  return (
    <div
      className="pointer-events-none absolute z-[5] flex items-center justify-center"
      style={{
        top: `${slot.top * 100}%`,
        left: `${slot.left * 100}%`,
        width: `${slot.width * 100}%`,
        height: `${slot.height * 100}%`,
      }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={payload.imageUrl}
        alt=""
        className="max-h-full max-w-full object-contain"
      />
    </div>
  )
}
