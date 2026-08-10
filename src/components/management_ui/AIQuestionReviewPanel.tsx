'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCustomToast } from '@/components/ui/CustomToast'
import ImageSelectModal from '@/components/management_ui/ImageSelectModal'
import type { Question } from '@/components/management_ui/QuizEditor'
import type { LanguageAuditIssue } from '@/lib/lexicon/types'
import { Check, Loader2, RefreshCw, Search, Trash2 } from 'lucide-react'

export interface ReviewableQuestion extends Question {
  imageKeyword?: string
  languageWarnings?: LanguageAuditIssue[]
  keptWords?: string[]
  status?: 'pending' | 'approved' | 'rejected'
}

interface ImageSuggestion {
  id: string
  url: string
  label: string
  source: 'stored' | 'pixabay'
  metadata?: Question['imageMetadata']
}

interface AIQuestionReviewPanelProps {
  questions: ReviewableQuestion[]
  onCommit: (approved: Question[]) => void
  onCancel: () => void
  onRegenerateOne?: (
    index: number,
    question: ReviewableQuestion
  ) => Promise<ReviewableQuestion | null>
}

const TOKEN_PATTERN = /[A-Za-z]+(?:['’][A-Za-z]+)?/g

function tokenize(text: string): string[] {
  return (text.match(TOKEN_PATTERN) ?? []).map((token) =>
    token.replace('’', "'").toLowerCase()
  )
}

/** Warnings that still apply to the current stem + correct answer. */
function relevantWarnings(question: ReviewableQuestion): LanguageAuditIssue[] {
  const kept = new Set(
    (question.keptWords ?? []).map((word) => word.toLowerCase())
  )
  const present = new Set(
    tokenize(`${question.question} ${question.correctAnswer}`)
  )
  return (question.languageWarnings ?? []).filter((issue) => {
    const word = issue.word.toLowerCase()
    return !kept.has(word) && present.has(word)
  })
}

function keywordPills(keyword: string | undefined): string[] {
  if (!keyword?.trim()) return []
  return keyword
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

async function fetchImageSuggestions(keyword: string): Promise<ImageSuggestion[]> {
  const suggestions: ImageSuggestion[] = []
  const query = keyword.trim() || 'classroom'

  try {
    const stored = await fetch(
      `/api/images/search?q=${encodeURIComponent(query)}&limit=3`
    )
    if (stored.ok) {
      const payload = (await stored.json()) as {
        data?: {
          images?: Array<{
            id: string
            blobUrl: string
            searchTerm?: string
            tags?: string[]
            width?: number
            height?: number
          }>
        }
      }
      for (const image of payload.data?.images ?? []) {
        suggestions.push({
          id: `stored-${image.id}`,
          url: image.blobUrl,
          label: image.searchTerm || query,
          source: 'stored',
          metadata: {
            pixabayId: 0,
            pixabayUser: 'library',
            tags: image.tags ?? [],
            searchTerm: image.searchTerm || query,
            width: image.width || 640,
            height: image.height || 360,
          },
        })
      }
    }
  } catch {
    // continue to Pixabay fallback
  }

  if (suggestions.length >= 3) return suggestions.slice(0, 3)

  const pixabayKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY
  if (!pixabayKey) return suggestions.slice(0, 3)

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${pixabayKey}` +
        `&q=${encodeURIComponent(query)}` +
        `&image_type=photo&safesearch=true&per_page=6`
    )
    if (!response.ok) return suggestions.slice(0, 3)
    const payload = (await response.json()) as {
      hits?: Array<{
        id: number
        webformatURL: string
        user: string
        tags: string
        webformatWidth: number
        webformatHeight: number
      }>
    }
    for (const hit of payload.hits ?? []) {
      if (suggestions.length >= 3) break
      suggestions.push({
        id: `pixabay-${hit.id}`,
        url: hit.webformatURL,
        label: hit.tags.split(',')[0]?.trim() || query,
        source: 'pixabay',
        metadata: {
          pixabayId: hit.id,
          pixabayUser: hit.user,
          tags: hit.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          searchTerm: query,
          width: hit.webformatWidth,
          height: hit.webformatHeight,
        },
      })
    }
  } catch {
    // ignore
  }

  return suggestions.slice(0, 3)
}

function toPlainQuestions(items: ReviewableQuestion[]): Question[] {
  return items
    .filter((item) => item.status === 'approved')
    .map((item) => ({
      id: item.id,
      question: item.question,
      answers: item.answers,
      correctAnswer: item.correctAnswer,
      imageUrl: item.imageUrl,
      imageFile: item.imageFile,
      imageMetadata: item.imageMetadata,
      type: item.type,
    }))
}

export default function AIQuestionReviewPanel({
  questions: initialQuestions,
  onCommit,
  onCancel,
  onRegenerateOne,
}: AIQuestionReviewPanelProps) {
  const [items, setItems] = useState<ReviewableQuestion[]>(
    initialQuestions.map((question) => ({
      ...question,
      status: question.status ?? 'pending',
      keptWords: question.keptWords ?? [],
    }))
  )
  const [suggestionsByIndex, setSuggestionsByIndex] = useState<
    Record<number, ImageSuggestion[]>
  >({})
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({})
  const [imageModalIndex, setImageModalIndex] = useState<number | null>(null)
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null)
  const [warningsOpen, setWarningsOpen] = useState(false)
  const { addToast } = useCustomToast()

  useEffect(() => {
    setItems(
      initialQuestions.map((question) => ({
        ...question,
        status: question.status ?? 'pending',
        keptWords: question.keptWords ?? [],
      }))
    )
  }, [initialQuestions])

  const loadSuggestions = useCallback(async (index: number, keyword: string) => {
    setLoadingImages((current) => ({ ...current, [index]: true }))
    try {
      const suggestions = await fetchImageSuggestions(keyword)
      setSuggestionsByIndex((current) => ({ ...current, [index]: suggestions }))
    } finally {
      setLoadingImages((current) => ({ ...current, [index]: false }))
    }
  }, [])

  useEffect(() => {
    items.forEach((item, index) => {
      if (item.status === 'rejected') return
      if (suggestionsByIndex[index]) return
      void loadSuggestions(
        index,
        item.imageKeyword || item.correctAnswer || 'classroom'
      )
    })
  }, [items, loadSuggestions, suggestionsByIndex])

  const approvedCount = useMemo(
    () => items.filter((item) => item.status === 'approved').length,
    [items]
  )

  const commitWarnings = useMemo(() => {
    const byWord = new Map<string, LanguageAuditIssue>()
    for (const item of items) {
      if (item.status !== 'approved') continue
      for (const issue of relevantWarnings(item)) {
        const key = issue.word.toLowerCase()
        if (!byWord.has(key)) byWord.set(key, issue)
      }
    }
    return [...byWord.values()].sort((a, b) => a.word.localeCompare(b.word))
  }, [items])

  const updateItem = (index: number, patch: Partial<ReviewableQuestion>) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    )
  }

  const commitApproved = () => {
    onCommit(toPlainQuestions(items))
    setWarningsOpen(false)
  }

  const handleCommit = () => {
    const approved = toPlainQuestions(items)

    if (approved.length === 0) {
      addToast('Approve at least one question before adding to the quiz.', {
        variant: 'warning',
        position: 'top-center',
      })
      return
    }

    if (commitWarnings.length > 0) {
      setWarningsOpen(true)
      return
    }

    onCommit(approved)
  }

  return (
    <div className="grandstander space-y-3 pt-2 text-[--text-color] md:pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-1">
        <div>
          <h3 className="text-lg font-semibold">Review generated questions</h3>
          <p className="text-sm text-slate-600">
            Pick an image to approve, or use the buttons below each question.
          </p>
        </div>
        <Badge className="bg-emerald-700 text-white">
          {approvedCount} approved / {items.length}
        </Badge>
      </div>

      {items.map((item, index) => {
        if (item.status === 'rejected') {
          return (
            <div
              key={`rejected-${index}`}
              className="rounded-lg bg-slate-100 px-4 py-3 opacity-70"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  Question {index + 1} rejected
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateItem(index, { status: 'pending' })}
                >
                  Restore
                </Button>
              </div>
            </div>
          )
        }

        const suggestions = suggestionsByIndex[index] ?? []
        const pills = keywordPills(item.imageKeyword)

        return (
          <div
            key={`review-${index}`}
            className={`space-y-3 rounded-lg px-4 py-3 ${
              item.status === 'approved'
                ? 'bg-emerald-50'
                : 'bg-slate-100'
            }`}
          >
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm font-bold text-slate-700">
                Question {index + 1}
              </p>
              <input
                value={item.question}
                onChange={(event) =>
                  updateItem(index, { question: event.target.value })
                }
                className="w-full rounded-md border-2 border-slate-200 bg-white px-4 py-3 text-base font-semibold text-[--text-color] outline-none focus:border-slate-300"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {item.answers.map((answer, answerIndex) => {
                const isCorrect = item.correctAnswer === answer
                return (
                  <button
                    key={`answer-${index}-${answerIndex}`}
                    type="button"
                    onClick={() =>
                      updateItem(index, { correctAnswer: answer })
                    }
                    className={`flex min-w-[10rem] flex-1 items-center gap-2 rounded-md border-2 px-3 py-2 text-left transition-colors ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="font-semibold text-slate-500">
                      {answerIndex + 1} -
                    </span>
                    <input
                      value={answer}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        const answers = [...item.answers]
                        const previous = answers[answerIndex]
                        answers[answerIndex] = event.target.value
                        updateItem(index, {
                          answers,
                          correctAnswer:
                            item.correctAnswer === previous
                              ? event.target.value
                              : item.correctAnswer,
                        })
                      }}
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base outline-none ring-0 focus:ring-0"
                    />
                  </button>
                )
              })}
            </div>

            <div className="space-y-2 rounded-lg border-2 border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">Keywords:</span>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {pills.length > 0 ? (
                    pills.map((pill) => (
                      <Badge
                        key={`${index}-${pill}`}
                        variant="secondary"
                        className="h-8 border-[--primary-accent] px-2 pt-1 text-sm text-[--text-color] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]"
                      >
                        {pill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">No keyword yet</span>
                  )}
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() =>
                      void loadSuggestions(
                        index,
                        item.imageKeyword || item.correctAnswer || 'classroom'
                      )
                    }
                  >
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    New images
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => setImageModalIndex(index)}
                  >
                    <Search className="mr-1 h-3.5 w-3.5" />
                    Search images
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {loadingImages[index] && suggestions.length === 0 ? (
                  <div className="col-span-3 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading image ideas…
                  </div>
                ) : suggestions.length === 0 ? (
                  <p className="col-span-3 text-sm text-gray-500">
                    No suggestions yet. Use Search images to pick an image.
                  </p>
                ) : (
                  suggestions.map((suggestion) => {
                    const selected = item.imageUrl === suggestion.url
                    return (
                      <button
                        key={suggestion.id}
                        type="button"
                        className={`overflow-hidden rounded-lg border-2 ${
                          selected
                            ? 'border-emerald-500'
                            : 'border-transparent hover:border-slate-300'
                        }`}
                        onClick={() =>
                          updateItem(index, {
                            imageUrl: suggestion.url,
                            imageFile: null,
                            imageMetadata: suggestion.metadata,
                            status: 'approved',
                          })
                        }
                      >
                        <Image
                          src={suggestion.url}
                          alt={suggestion.label}
                          width={200}
                          height={120}
                          unoptimized
                          className="h-24 w-full object-cover"
                        />
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                title="Approve"
                onClick={() => updateItem(index, { status: 'approved' })}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-colors ${
                  item.status === 'approved'
                    ? 'border-emerald-600 bg-emerald-500 text-white'
                    : 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                type="button"
                title="Reject"
                onClick={() => updateItem(index, { status: 'rejected' })}
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-slate-400 bg-slate-200 text-slate-600 hover:bg-slate-300"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              {onRegenerateOne && (
                <button
                  type="button"
                  title="Regenerate"
                  disabled={regeneratingIndex === index}
                  onClick={async () => {
                    setRegeneratingIndex(index)
                    try {
                      const next = await onRegenerateOne(index, item)
                      if (next) {
                        updateItem(index, {
                          ...next,
                          status: 'pending',
                        })
                        setSuggestionsByIndex((current) => {
                          const copy = { ...current }
                          delete copy[index]
                          return copy
                        })
                      }
                    } finally {
                      setRegeneratingIndex(null)
                    }
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-slate-400 bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:opacity-60"
                >
                  {regeneratingIndex === index ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        )
      })}

      <div className="flex flex-wrap justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>
          Back to brief
        </Button>
        <Button
          type="button"
          onClick={handleCommit}
          className="bg-[--primary-accent] text-white hover:bg-[--primary-accent-hover]"
        >
          Add {approvedCount} approved question
          {approvedCount === 1 ? '' : 's'} to quiz
        </Button>
      </div>

      <Dialog open={warningsOpen} onOpenChange={setWarningsOpen}>
        <DialogContent className="grandstander max-w-lg bg-white text-[--text-color]">
          <DialogHeader>
            <DialogTitle>Level warnings</DialogTitle>
            <DialogDescription className="text-slate-600">
              These words in your approved questions are above level or not in
              the word list. Add anyway, or go back to edit them.
            </DialogDescription>
          </DialogHeader>

          <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border-2 border-slate-200 bg-slate-50 p-3 text-sm">
            {commitWarnings.map((warning) => (
              <li
                key={`${warning.word}-${warning.reason}`}
                className="flex flex-wrap items-center gap-2"
              >
                <Badge variant="outline" className="bg-white">
                  {warning.word}
                </Badge>
                <span className="text-slate-700">
                  {warning.reason}
                  {warning.detectedLevel ? ` (${warning.detectedLevel})` : ''}
                </span>
              </li>
            ))}
          </ul>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setWarningsOpen(false)}
            >
              Go back
            </Button>
            <Button
              type="button"
              onClick={commitApproved}
              className="bg-[--primary-accent] text-white hover:bg-[--primary-accent-hover]"
            >
              Add anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageSelectModal
        isOpen={imageModalIndex !== null}
        onClose={() => setImageModalIndex(null)}
        onImageSelect={(imageUrl, metadata, localFile) => {
          if (imageModalIndex === null) return
          updateItem(imageModalIndex, {
            imageUrl,
            imageMetadata: metadata,
            imageFile: localFile ?? null,
            status: 'approved',
          })
          setImageModalIndex(null)
        }}
      />
    </div>
  )
}
