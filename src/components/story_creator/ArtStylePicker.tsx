'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  STORY_ART_STYLES,
  type StoryArtStyleId,
} from '@/lib/stories/art-styles'

interface ArtStylePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: StoryArtStyleId
  note: string
  onSave: (styleId: StoryArtStyleId, note: string) => void
}

export default function ArtStylePicker({
  open,
  onOpenChange,
  value,
  note,
  onSave,
}: ArtStylePickerProps) {
  const [draftId, setDraftId] = useState<StoryArtStyleId>(value)
  const [draftNote, setDraftNote] = useState(note)

  // Sync drafts whenever the dialog opens so Cancel doesn't leak edits.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraftId(value)
      setDraftNote(note)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="grandstander text-2xl text-[#114257]">
            Choose an art style
          </DialogTitle>
          <DialogDescription>
            Pick the look that fits your class. Younger students often like
            Picture book or Chibi; older students may prefer Soft anime, Modern
            anime, or Action anime.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STORY_ART_STYLES.map((style) => {
            const selected = draftId === style.id
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setDraftId(style.id)}
                className={`overflow-hidden rounded-xl border-2 text-left transition-shadow ${
                  selected
                    ? 'border-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.25)]'
                    : 'border-slate-200 hover:border-violet-300'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={style.previewSrc}
                  alt={`${style.label} style example`}
                  className="aspect-[4/3] w-full object-cover bg-slate-100"
                />
                <div className="p-2.5">
                  <p className="grandstander text-sm font-bold text-[#114257]">
                    {style.label}
                  </p>
                  <p className="text-[11px] leading-snug text-slate-500">
                    {style.ageHint}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#114257]">
            Optional style note{' '}
            <span className="font-normal text-slate-500">
              (one line — only if the picture isn&apos;t enough)
            </span>
          </label>
          <Input
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
            placeholder='e.g. "softer pastel colors" or "more like a comic book"'
            maxLength={160}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-violet-600 text-white hover:bg-violet-700"
            onClick={() => {
              onSave(draftId, draftNote.trim())
              onOpenChange(false)
            }}
          >
            Use this style
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
