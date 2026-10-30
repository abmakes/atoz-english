'use client'

import { PartThumb } from '@/components/thoughts/PartThumb'
import {
  THOUGHT_CATEGORIES,
  partsIn,
  type ThoughtCategory,
} from '@/lib/thoughts/catalog'

const LABELS: Record<ThoughtCategory, string> = {
  head: 'Head',
  hair: 'Hair',
  eyes: 'Eyes',
  ears: 'Ears',
  nose: 'Nose',
  mouth: 'Mouth',
  extras: 'Extras',
}

const STYLES = [
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'photo', label: 'Photo' },
  { id: 'sketch', label: 'Sketch' },
] as const

interface PartsTrayProps {
  style: 'cartoon' | 'photo' | 'sketch'
  onStyle: (style: 'cartoon' | 'photo' | 'sketch') => void
  onPick: (partId: string) => void
}

export default function PartsTray({ style, onStyle, onPick }: PartsTrayProps) {
  return (
    <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
      <div className="flex gap-1 rounded-full bg-white p-1">
        {STYLES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onStyle(option.id)}
            className={`flex-1 rounded-full px-2 py-1 text-xs font-semibold ${
              style === option.id ? 'bg-violet-600 text-white' : 'text-slate-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {THOUGHT_CATEGORIES.map((category) => {
        const parts = partsIn(category, category === 'head' ? undefined : style)
        return (
          <div key={category}>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              {LABELS[category]}
            </p>
            <div className="grid grid-cols-4 gap-1">
              {parts.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  title={part.label}
                  onClick={() => onPick(part.id)}
                  className="rounded-xl border border-violet-100 bg-white p-1 hover:border-violet-400"
                >
                  <PartThumb part={part} />
                  <span className="sr-only">{part.label}</span>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
