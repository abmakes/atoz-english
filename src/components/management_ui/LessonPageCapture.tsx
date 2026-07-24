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
}

export default function LessonPageCapture({
  disabled,
  onAnalyze,
  isAnalyzing,
}: LessonPageCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useCustomToast()

  const clearImage = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setFileName(null)
    setPendingFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

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
    },
    [addToast]
  )

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (disabled || isAnalyzing) return
      const items = event.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          event.preventDefault()
          acceptFile(item.getAsFile())
          return
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [acceptFile, disabled, isAnalyzing])

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (disabled || isAnalyzing) return
    acceptFile(event.dataTransfer.files?.[0])
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/60 p-4"
      >
        <div className="mb-3 flex items-start gap-3">
          <ImagePlus className="mt-0.5 h-5 w-5 text-violet-700" />
          <div>
            <p className="font-semibold text-[--text-color]">
              Paste or upload a textbook / worksheet page
            </p>
            <p className="text-sm text-gray-600">
              Images are analyzed in memory and never stored. Confirm the
              suggested brief before generating questions.
            </p>
          </div>
        </div>

        {previewUrl ? (
          <div className="relative overflow-hidden rounded-lg border bg-white">
            <Image
              src={previewUrl}
              alt="Lesson page preview"
              width={640}
              height={360}
              unoptimized
              className="h-48 w-full object-contain bg-slate-50"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-sm">
              <span className="truncate text-gray-600">{fileName}</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearImage}
                  disabled={disabled || isAnalyzing}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remove
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => pendingFile && void onAnalyze(pendingFile)}
                  disabled={!pendingFile || disabled || isAnalyzing}
                  className="bg-violet-700 text-white hover:bg-violet-800"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    'Analyze page'
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <ClipboardPaste className="h-8 w-8 text-violet-500" />
            <p className="text-sm text-gray-600">
              Paste a screenshot here, drag and drop, or choose a file.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
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
    </div>
  )
}
