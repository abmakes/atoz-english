'use client'

import React, { useEffect, useState } from 'react'
import type { EventBus } from '@/lib/pixi-engine/core/EventBus'
import {
  TUG_EVENTS,
  type TugOffsetChangedPayload,
} from '@/lib/pixi-engine/core/EventTypes'

interface TugMeterProps {
  eventBus: EventBus
}

const TugMeter: React.FC<TugMeterProps> = ({ eventBus }) => {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onOffset = (payload: TugOffsetChangedPayload) => {
      setOffset(payload.displayedOffset)
    }
    eventBus.on(TUG_EVENTS.OFFSET_CHANGED, onOffset)
    return () => {
      eventBus.off(TUG_EVENTS.OFFSET_CHANGED, onOffset)
    }
  }, [eventBus])

  const markerPercent = ((offset + 1) / 2) * 100

  return (
    <div
      className="pointer-events-none mx-auto w-[min(420px,70vw)]"
      role="meter"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={Number(offset.toFixed(2))}
      aria-label="Tug of war marker"
    >
      <div className="relative h-5 overflow-hidden rounded-full border-2 border-[var(--border-dark,#1E5167)] bg-white shadow-[3px_3px_0_0_var(--border-dark,#1E5167)]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#2b6cb0] via-white to-[#c53030]" />
        <div
          className="absolute top-1/2 z-10 h-7 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white ring-2 ring-[#1E5167]"
          style={{ left: `${markerPercent}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between px-1 text-xs font-bold grandstander">
        <span className="text-[#2b6cb0]">◀ Blue</span>
        <span className="text-[#c53030]">Red ▶</span>
      </div>
    </div>
  )
}

export default TugMeter
