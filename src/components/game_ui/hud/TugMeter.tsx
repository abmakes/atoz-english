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
      className="pointer-events-none mx-auto flex w-[min(520px,78vw)] items-center gap-1"
      role="meter"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={Number(offset.toFixed(2))}
      aria-label="Tug of war marker"
    >
      <span className="grandstander text-2xl font-bold leading-none text-[#2b6cb0]" aria-hidden>
        ◀
      </span>
      <div className="relative h-7 flex-1 overflow-hidden rounded-full border-[3px] border-[#163e66] bg-white shadow-[3px_3px_0_0_#163e66]">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[#2b6cb0]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[#c53030]" />
        <div
          className="absolute top-1/2 z-10 h-9 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white ring-2 ring-[#163e66]"
          style={{ left: `${markerPercent}%` }}
        />
      </div>
      <span className="grandstander text-2xl font-bold leading-none text-[#c53030]" aria-hidden>
        ▶
      </span>
    </div>
  )
}

export default TugMeter
