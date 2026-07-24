'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCustomToast } from '@/components/ui/CustomToast'
import ImageSelectModal from '@/components/management_ui/ImageSelectModal'
import type { Question } from '@/components/management_ui/QuizEditor'
import { applySuggestedSimplifications } from '@/lib/ai/quiz-generation'
import type { LanguageAuditIssue } from '@/lib/lexicon/types'
import {
  Check,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react'

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
  onRegenerateOne?: (index: number, question: ReviewableQuestion) => Promise<ReviewableQuestion | null>
}

function visibleWarnings(
  question: ReviewableQuestion
): LanguageAuditIssue[] {
  const kept = new Set((question.keptWords ?? []).map((word) => word.toLowerCase()))
  return (question.languageWarnings ?? []).filter(
    (issue) => !kept.has(issue.word.toLowerCase())
  )
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
        data?: { images?: Array<{ id: string; blobUrl: string; searchTerm?: string; tags?: string[]; width?: number; height?: number }> }
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
          tags: hit.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
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
      void loadSuggestions(index, item.imageKeyword || item.correctAnswer || 'classroom')
    })
  }, [items, loadSuggestions, suggestionsByIndex])

  const approvedCount = useMemo(
    () => items.filter((item) => item.status === 'approved').length,
    [items]
  )

  const updateItem = (index: number, patch: Partial<ReviewableQuestion>) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    )
  }

  const simplifyItem = (index: number) => {
    const item = items[index]
    const warnings = visibleWarnings(item)
    const nextQuestion = applySuggestedSimplifications(item.question, warnings)
    const nextAnswers = item.answers.map((answer) =>
      applySuggestedSimplifications(answer, warnings)
    )
    const nextCorrect = applySuggestedSimplifications(item.correctAnswer, warnings)
    updateItem(index, {
      question: nextQuestion,
      answers: nextAnswers,
      correctAnswer: nextAnswers.includes(nextCorrect)
        ? nextCorrect
        : nextAnswers[0] || item.correctAnswer,
      languageWarnings: warnings.filter((warning) => !warning.suggestion),
    })
    addToast('Applied available simplifications for this question.', {
      variant: 'success',
      position: 'top-center',
    })
  }

  const keepWord = (index: number, word: string) => {
    const item = items[index]
    updateItem(index, {
      keptWords: [...new Set([...(item.keptWords ?? []), word.toLowerCase()])],
    })
  }

  const handleCommit = () => {
    const approved = items
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

    if (approved.length === 0) {
      addToast('Approve at least one question before adding to the quiz.', {
        variant: 'warning',
        position: 'top-center',
      })
      return
    }

    onCommit(approved)
  }

  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 bg-emerald-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-emerald-950">
              Review generated questions
            </h3>
            <p className="text-sm text-emerald-900">
              Approve, edit, or reject each item. Level warnings are advice only.
              Approved questions enter the quiz.
            </p>
          </div>
          <Badge className="bg-emerald-700 text-white">
            {approvedCount} approved / {items.length}
          </Badge>
        </div>
      </Card>

      {items.map((item, index) => {
        if (item.status === 'rejected') {
          return (
            <Card key={`rejected-${index}`} className="bg-gray-50 p-4 opacity-70">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-600">Question {index + 1} rejected</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateItem(index, { status: 'pending' })}
                >
                  Restore
                </Button>
              </div>
            </Card>
          )
        }

        const warnings = visibleWarnings(item)
        const suggestions = suggestionsByIndex[index] ?? []

        return (
          <Card
            key={`review-${index}`}
            className={`space-y-4 p-4 ${
              item.status === 'approved' ? 'border-emerald-400 bg-emerald-50/40' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-semibold">Question {index + 1}</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={item.status === 'approved' ? 'default' : 'outline'}
                  onClick={() => updateItem(index, { status: 'approved' })}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => updateItem(index, { status: 'rejected' })}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                {onRegenerateOne && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
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
                  >
                    {regeneratingIndex === index ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1 h-4 w-4" />
                    )}
                    Regenerate
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                value={item.question}
                onChange={(event) =>
                  updateItem(index, { question: event.target.value })
                }
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {item.answers.map((answer, answerIndex) => (
                <div key={`answer-${index}-${answerIndex}`} className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={item.correctAnswer === answer}
                      onChange={() =>
                        updateItem(index, { correctAnswer: answer })
                      }
                    />
                    Answer {answerIndex + 1}
                  </Label>
                  <Input
                    value={answer}
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
                  />
                </div>
              ))}
            </div>

            {warnings.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
                <div className="mb-2 flex items-center gap-2 font-semibold text-amber-900">
                  <TriangleAlert className="h-4 w-4" />
                  Level warnings
                </div>
                <ul className="space-y-2">
                  {warnings.map((warning) => (
                    <li
                      key={`${warning.word}-${warning.reason}`}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <Badge variant="outline" className="bg-white">
                        {warning.word}
                      </Badge>
                      <span className="text-amber-900">
                        {warning.reason}
                        {warning.detectedLevel ? ` (${warning.detectedLevel})` : ''}
                        {warning.suggestion ? ` → try “${warning.suggestion}”` : ''}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => keepWord(index, warning.word)}
                      >
                        Keep this word
                      </Button>
                    </li>
                  ))}
                </ul>
                {warnings.some((warning) => warning.suggestion) && (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3"
                    variant="outline"
                    onClick={() => simplifyItem(index)}
                  >
                    <Sparkles className="mr-1 h-4 w-4" />
                    Simplify flagged language
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>
                  Image suggestions
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    keyword: {item.imageKeyword || 'classroom'}
                  </span>
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setImageModalIndex(index)}
                >
                  <Search className="mr-1 h-4 w-4" />
                  Search more
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {loadingImages[index] && suggestions.length === 0 ? (
                  <div className="col-span-3 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading image ideas…
                  </div>
                ) : suggestions.length === 0 ? (
                  <p className="col-span-3 text-sm text-gray-500">
                    No suggestions yet. Use Search more to pick an image.
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
                            : 'border-transparent hover:border-violet-300'
                        }`}
                        onClick={() =>
                          updateItem(index, {
                            imageUrl: suggestion.url,
                            imageFile: null,
                            imageMetadata: suggestion.metadata,
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
              {item.imageUrl && item.imageUrl !== '/images/placeholder.webp' && (
                <p className="text-xs text-gray-500">Selected image ready for this question.</p>
              )}
            </div>
          </Card>
        )
      })}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Back to brief
        </Button>
        <Button
          type="button"
          onClick={handleCommit}
          className="bg-[--primary-accent] text-white hover:bg-[--primary-accent-hover]"
        >
          Add {approvedCount} approved question{approvedCount === 1 ? '' : 's'} to quiz
        </Button>
      </div>

      <ImageSelectModal
        isOpen={imageModalIndex !== null}
        onClose={() => setImageModalIndex(null)}
        onImageSelect={(imageUrl, metadata, localFile) => {
          if (imageModalIndex === null) return
          updateItem(imageModalIndex, {
            imageUrl,
            imageMetadata: metadata,
            imageFile: localFile ?? null,
          })
          setImageModalIndex(null)
        }}
      />
    </div>
  )
}
