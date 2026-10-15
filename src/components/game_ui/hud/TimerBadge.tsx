'use client'

import React, { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import type { EventBus } from '@/lib/pixi-engine/core/EventBus'
import {
  TIMER_EVENTS,
  type TimerEventPayload,
} from '@/lib/pixi-engine/core/EventTypes'

interface TimerBadgeProps {
  eventBus: EventBus
  timerId: string
}

const TimerBadge: React.FC<TimerBadgeProps> = ({ eventBus, timerId }) => {
  const [seconds, setSeconds] = useState<number | null>(null)

  useEffect(() => {
    const readSeconds = (payload: TimerEventPayload) => {
      if (payload.timerId !== timerId) return
      if (typeof payload.remaining === 'number') {
        setSeconds(Math.max(0, Math.ceil(payload.remaining / 1000)))
      }
    }
    const onStop = (payload: TimerEventPayload) => {
      if (payload.timerId === timerId) setSeconds(null)
    }

    eventBus.on(TIMER_EVENTS.TIMER_STARTED, readSeconds)
    eventBus.on(TIMER_EVENTS.TIMER_TICK, readSeconds)
    eventBus.on(TIMER_EVENTS.TIMER_COMPLETED, onStop)
    eventBus.on(TIMER_EVENTS.TIMER_STOPPED, onStop)
    return () => {
      eventBus.off(TIMER_EVENTS.TIMER_STARTED, readSeconds)
      eventBus.off(TIMER_EVENTS.TIMER_TICK, readSeconds)
      eventBus.off(TIMER_EVENTS.TIMER_COMPLETED, onStop)
      eventBus.off(TIMER_EVENTS.TIMER_STOPPED, onStop)
    }
  }, [eventBus, timerId])

  if (seconds === null) return null

  return (
    <div
      className="pointer-events-none flex shrink-0 items-center gap-1 rounded-full border-2 border-[#163e66] bg-[#1e4d73] px-2 py-0.5 shadow-[2px_2px_0_0_#163e66] lg:gap-2 lg:border-[3px] lg:px-4 lg:py-1.5 lg:shadow-[3px_3px_0_0_#163e66]"
      aria-live="polite"
      aria-label={`Time remaining ${seconds} seconds`}
    >
      <Timer className="h-4 w-4 text-white lg:h-6 lg:w-6" />
      <span className="grandstander text-lg font-bold tabular-nums text-white lg:text-3xl">
        {seconds}
      </span>
    </div>
  )
}

export default TimerBadge
