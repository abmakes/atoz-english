'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useCustomToast } from '@/components/ui/CustomToast'
import { ClipboardPaste, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'

const ACCEPT = 'image/png,image/jpeg,image/webp'
const MAX_BYTES = 8 * 1024 * 1024

export interface LessonPageCaptureProps {
  disabled?: boolean
  onAnalyze: (file: File) => Promise<void>
  isAnalyzing?: boolean
  /** Compact companion panel beside quiz info */
  compact?: boolean
}

export default function LessonPageCapture({
  disabled,
  onAnalyze,
  isAnalyzing,
  compact = false,
}: LessonPageCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pasteArmed, setPasteArmed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)
  const { addToast } = useCustomToast()

  const clearImage = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setFileName(null)
    setPendingFile(null)
    setPasteArmed(false)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl]
  )

  const acceptFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return
      if (!ACCEPT.split(',').includes(file.type)) {
        addToast('Please use a PNG, JPEG, or WebP image.', {
          variant: 'error',
          position: 'top-center',
        })
        return
      }
      if (file.size > MAX_BYTES) {
        addToast('Image must be 8 MB or smaller.', {
          variant: 'error',
          position: 'top-center',
        })
        return
      }

      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return URL.createObjectURL(file)
      })
      setFileName(file.name || 'pasted-lesson.png')
      setPendingFile(file)
      setPasteArmed(false)
    },
    [addToast]
  )

  useEffect(() => {
    if (!pasteArmed || disabled || isAnalyzing) return

    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          event.preventDefault()
          acceptFile(item.getAsFile())
          return
        }
      }
      addToast('No image found on the clipboard. Copy an image, then press Ctrl + V.', {
        variant: 'warning',
        position: 'top-center',
      })
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [acceptFile, addToast, disabled, isAnalyzing, pasteArmed])

  const armPaste = () => {
    if (disabled || isAnalyzing || previewUrl) return
    setPasteArmed(true)
    // Focus so the zone feels active and keyboard paste is expected here.
    requestAnimationFrame(() => zoneRef.current?.focus())
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (disabled || isAnalyzing) return
    acceptFile(event.dataTransfer.files?.[0])
  }

  return (
    <div
      ref={zoneRef}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label="Paste or upload a textbook page"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      onClick={armPaste}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          armPaste()
        }
      }}
      onBlur={(event) => {
        if (!zoneRef.current?.contains(event.relatedTarget as Node | null)) {
          setPasteArmed(false)
        }
      }}
      className={`rounded-xl border-2 border-dashed outline-none transition-colors ${
        pasteArmed
          ? 'border-violet-500 bg-violet-100/80 ring-2 ring-violet-300'
          : 'border-violet-300 bg-violet-50/60 hover:border-violet-400'
      } ${compact ? 'flex h-full min-h-[10rem] flex-col p-3' : 'p-4'} ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      <div className={`flex items-start gap-2 ${compact ? 'mb-2' : 'mb-3'}`}>
        <ImagePlus
          className={`mt-0.5 flex-none text-violet-700 ${
            compact ? 'h-4 w-4' : 'h-5 w-5'
          }`}
        />
        <p
          className={`font-semibold leading-snug text-[--text-color] ${
            compact ? 'text-sm' : 'text-base'
          }`}
        >
          Paste or upload a textbook / worksheet page
        </p>
      </div>

      {previewUrl ? (
        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-white"
          onClick={(event) => event.stopPropagation()}
        >
          <Image
            src={previewUrl}
            alt="Lesson page preview"
            width={640}
            height={360}
            unoptimized
            className={`w-full object-contain bg-slate-50 ${
              compact ? 'h-24' : 'h-48'
            }`}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-2 py-2 text-xs">
            <span className="truncate text-gray-600">{fileName}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearImage}
                disabled={disabled || isAnalyzing}
                className="h-8 px-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => pendingFile && void onAnalyze(pendingFile)}
                disabled={!pendingFile || disabled || isAnalyzing}
                className="h-8 bg-violet-700 px-2 text-white hover:bg-violet-800"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Analyze'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : pasteArmed ? (
        <div
          className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-slate-200 bg-white text-center shadow-sm ${
            compact ? 'min-h-[6.5rem] px-3 py-4' : 'min-h-[8rem] px-4 py-6'
          }`}
        >
          <ClipboardPaste
            className={`text-violet-600 ${compact ? 'h-7 w-7' : 'h-9 w-9'}`}
          />
          <p className="text-sm font-semibold text-[--text-color]">
            Press Ctrl + V to paste an image
          </p>
          <p className="text-xs text-slate-500">
            Or choose a file below
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={(event) => {
              event.stopPropagation()
              inputRef.current?.click()
            }}
            disabled={disabled || isAnalyzing}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Choose image
          </Button>
        </div>
      ) : (
        <div
          className={`flex flex-1 flex-col items-center justify-center gap-2 text-center ${
            compact ? 'py-3' : 'py-6'
          }`}
        >
          <ClipboardPaste
            className={`text-violet-500 ${compact ? 'h-6 w-6' : 'h-8 w-8'}`}
          />
          <p className="text-sm font-medium text-violet-800">
            Click here to paste
          </p>
          <p className="text-xs text-slate-500">or choose a file</p>
          <Button
            type="button"
            variant="outline"
            size={compact ? 'sm' : 'default'}
            onClick={(event) => {
              event.stopPropagation()
              inputRef.current?.click()
            }}
            disabled={disabled || isAnalyzing}
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose image
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />
    </div>
  )
}
