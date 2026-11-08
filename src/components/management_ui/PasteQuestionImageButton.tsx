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
  onSaved: (image: SavedQuestionImage) => void
}

export default function PasteQuestionImageButton({
  searchTerm,
  className,
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
