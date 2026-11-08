'use client'

import { useCallback, useEffect, useState } from 'react'
import { ClipboardPaste, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCustomToast } from '@/components/ui/CustomToast'
import {
  readClipboardImage,
  savePastedQuestionImage,
  type SavedQuestionImage,
} from '@/lib/images/pasted-question-image'

interface PasteQuestionImageButtonProps {
  searchTerm?: string
  className?: string
  /** `zone` is the large paste target inside the image picker. */
  appearance?: 'button' | 'zone'
  onSaved: (image: SavedQuestionImage) => void
}

export default function PasteQuestionImageButton({
  searchTerm,
  className,
  appearance = 'button',
  onSaved,
}: PasteQuestionImageButtonProps) {
  const { addToast } = useCustomToast()
  const [listening, setListening] = useState(false)
  const [saving, setSaving] = useState(false)

  const store = useCallback(
    async (file: File) => {
      setSaving(true)
      setListening(false)
      try {
        const saved = await savePastedQuestionImage(file, searchTerm)
        onSaved(saved)
        addToast(
          saved.imageFile
            ? 'Image converted to WebP. It will be stored with this question when you publish.'
            : 'Image saved as WebP for this question.',
          { variant: 'success', position: 'top-center' }
        )
      } catch (error) {
        addToast(
          error instanceof Error ? error.message : 'Could not use that image.',
          { variant: 'error', position: 'top-center' }
        )
      } finally {
        setSaving(false)
      }
    },
    [addToast, onSaved, searchTerm]
  )

  useEffect(() => {
    if (!listening || saving) return

    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (!item.type.startsWith('image/')) continue
        event.preventDefault()
        const file = item.getAsFile()
        if (file) void store(file)
        return
      }
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [listening, saving, store])

  const arm = async () => {
    if (saving) return
    const fromClipboard = await readClipboardImage()
    if (fromClipboard) {
      await store(fromClipboard)
      return
    }
    setListening(true)
    addToast('Press Ctrl + V to paste an image.', {
      variant: 'info',
      position: 'top-center',
    })
  }

  if (appearance === 'zone') {
    return (
      <button
        type="button"
        disabled={saving}
        onClick={() => void arm()}
        className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors ${
          listening
            ? 'border-violet-500 bg-violet-100 ring-2 ring-violet-300'
            : 'border-violet-300 bg-violet-50 hover:border-violet-500 hover:bg-violet-100'
        } ${className ?? ''}`}
      >
        {saving ? (
          <Loader2 className="h-7 w-7 animate-spin text-violet-700" />
        ) : (
          <ClipboardPaste className="h-7 w-7 text-violet-700" />
        )}
        <span className="text-base font-semibold text-[--text-color]">
          {listening ? 'Press Ctrl + V to paste' : 'Paste an image'}
        </span>
        <span className="text-sm text-slate-600">
          Click here, then paste. It is saved as WebP for this question.
        </span>
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      title="Paste an image from the clipboard"
      disabled={saving}
      onClick={() => void arm()}
      className={className}
    >
      {saving ? (
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
      ) : (
        <ClipboardPaste className="mr-1 h-3.5 w-3.5" />
      )}
      {listening ? 'Press Ctrl+V' : 'Paste image'}
    </Button>
  )
}
