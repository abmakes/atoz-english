'use client'

import { useState } from 'react'
import { PartThumb } from '@/components/thoughts/PartThumb'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer'
import { BACKDROPS, getBackdrop, type FaceMask } from '@/lib/thoughts/backdrop'
import {
  THOUGHT_CATEGORIES,
  partsIn,
  type CatalogPart,
  type ThoughtCategory,
} from '@/lib/thoughts/catalog'

type TraySection = ThoughtCategory | 'background'

const LABELS: Record<TraySection, string> = {
  head: 'Face',
  hair: 'Hair',
  eyes: 'Eyes',
  ears: 'Ears',
  nose: 'Nose',
  mouth: 'Mouth',
  extras: 'Extras',
  background: 'Back',
}

const FACE_MASK_CHOICES: Array<{ id: FaceMask; label: string }> = [
  { id: 'circle', label: 'Circle' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'square', label: 'Full square' },
]

const STYLES = [
  { id: 'sketch', label: 'Sketch' },
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'photo', label: 'Photo' },
] as const

function samplePart(category: ThoughtCategory): CatalogPart | undefined {
  return partsIn(category, 'cartoon')[0] ?? partsIn(category)[0]
}

function CategoryIcons({
  active,
  backdrop,
  onSelect,
}: {
  active: TraySection | null
  backdrop: string
  onSelect: (category: TraySection) => void
}) {
  const fill = getBackdrop(backdrop)
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {THOUGHT_CATEGORIES.map((category) => {
        const part = samplePart(category)
        if (!part) return null
        const selected = active === category
        return (
          <button
            key={category}
            type="button"
            aria-label={LABELS[category]}
            aria-pressed={selected}
            onClick={() => onSelect(category)}
            className={`flex w-14 flex-col items-center gap-0.5 rounded-2xl p-1 ${
              selected ? 'bg-violet-100 ring-2 ring-violet-500' : ''
            }`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
              <PartThumb part={part} />
            </span>
            <span className="text-[10px] font-semibold leading-none text-slate-600">
              {LABELS[category]}
            </span>
          </button>
        )
      })}
      <button
        type="button"
        aria-label="Background"
        aria-pressed={active === 'background'}
        onClick={() => onSelect('background')}
        className={`flex w-14 flex-col items-center gap-0.5 rounded-2xl p-1 ${
          active === 'background' ? 'bg-violet-100 ring-2 ring-violet-500' : ''
        }`}
      >
        <span
          className="h-12 w-12 rounded-xl border border-violet-100"
          style={{ background: fill.preview }}
        />
        <span className="text-[10px] font-semibold leading-none text-slate-600">Back</span>
      </button>
    </div>
  )
}

function PartChoices({
  parts,
  onPick,
}: {
  parts: CatalogPart[]
  onPick: (partId: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {parts.map((part) => (
        <button
          key={part.id}
          type="button"
          title={part.label}
          onClick={() => onPick(part.id)}
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-100 bg-white hover:border-violet-400"
        >
          <PartThumb part={part} />
          <span className="sr-only">{part.label}</span>
        </button>
      ))}
    </div>
  )
}

interface PartsTrayProps {
  onPick: (partId: string) => void
  backdrop: string
  onBackdrop: (id: string) => void
  photoIsFace: boolean
  faceMask: FaceMask
  onFaceMask: (mask: FaceMask) => void
}

export default function PartsTray({
  onPick,
  backdrop,
  onBackdrop,
  photoIsFace,
  faceMask,
  onFaceMask,
}: PartsTrayProps) {
  const [category, setCategory] = useState<TraySection | null>(null)

  return (
    <>
      <CategoryIcons active={category} backdrop={backdrop} onSelect={setCategory} />
      <Drawer
        open={category !== null}
        onOpenChange={(open) => {
          if (!open) setCategory(null)
        }}
        shouldScaleBackground={false}
      >
        <DrawerContent
          overlayClassName="bg-black/20"
          className="h-[min(52vh,32rem)] bg-[#fffaf3] text-[#1e1b4b]"
        >
          <DrawerTitle className="sr-only">
            {category ? LABELS[category] : 'Stickers'}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Pick a sticker. Tap outside to close.
          </DrawerDescription>
          <div className="px-3 pb-2">
            <CategoryIcons active={category} backdrop={backdrop} onSelect={setCategory} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            {category === 'background' ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:items-start">
                  {(['plain', 'gradient', 'pattern'] as const).map((group) => (
                    <section key={group}>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        {group === 'plain' ? 'Plain' : group === 'gradient' ? 'Gradient' : 'Pattern'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {BACKDROPS.filter((item) => item.group === group).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            aria-label={item.label}
                            aria-pressed={getBackdrop(backdrop).id === item.id}
                            title={item.label}
                            onClick={() => onBackdrop(item.id)}
                            className={`h-16 w-16 rounded-2xl border ${
                              getBackdrop(backdrop).id === item.id
                                ? 'border-violet-500 ring-2 ring-violet-500'
                                : 'border-violet-100'
                            }`}
                            style={{ background: item.preview }}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
                {photoIsFace ? (
                  <section>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Photo shape
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {FACE_MASK_CHOICES.map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          aria-pressed={faceMask === choice.id}
                          onClick={() => onFaceMask(choice.id)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            faceMask === choice.id
                              ? 'bg-violet-600 text-white'
                              : 'border border-violet-200 bg-white'
                          }`}
                        >
                          {choice.label}
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : category === 'head' ? (
              <PartChoices parts={partsIn('head')} onPick={onPick} />
            ) : category ? (
              <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:items-start">
                {STYLES.map((style) => {
                  const parts = partsIn(category, style.id)
                  if (parts.length === 0) return null
                  return (
                    <section key={style.id}>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        {style.label}
                      </h3>
                      <PartChoices parts={parts} onPick={onPick} />
                    </section>
                  )
                })}
              </div>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
