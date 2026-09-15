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
      className="pointer-events-none flex items-center gap-2 rounded-2xl border-2 border-[var(--border-dark,#1E5167)] bg-[var(--panel-bg,#ffffff)] px-3 py-1.5 shadow-[3px_3px_0_0_var(--border-dark,#1E5167)]"
      aria-live="polite"
      aria-label={`Time remaining ${seconds} seconds`}
    >
      <Timer className="h-6 w-6 text-[var(--heading-color,#114257)]" />
      <span className="grandstander text-2xl font-bold tabular-nums text-[var(--heading-color,#114257)]">
        {seconds}
      </span>
    </div>
  )
}

export default TimerBadge
