'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCustomToast } from '@/components/ui/CustomToast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TagDrawer } from '@/components/management_ui/TagDrawer'
import LessonPageCapture from '@/components/management_ui/LessonPageCapture'
import AIQuestionReviewPanel, {
  type ReviewableQuestion,
} from '@/components/management_ui/AIQuestionReviewPanel'
import type { Question } from '@/components/management_ui/QuizEditor'
import { ALL_TAG_CATEGORIES } from '@/lib/tags'
import {
  discoveryTagsFromBrief,
  type GenerationBrief,
  type LessonImageAnalysis,
} from '@/lib/ai/generation-brief'
import {
  inferQuestionShape,
  QUESTION_SHAPE_LABELS,
  type QuestionShape,
  type QuestionShapeLabel,
} from '@/lib/ai/question-shapes'
import {
  CEFR_LEVELS,
  levelFromTags,
  normalizeCefrLevel,
  resolveGrammarTags,
  resolveTopicTags,
  syncLevelIntoTags,
  type CefrLevelId,
  type QuestionStyle,
  type SentenceForm,
  type VocabularyFocus,
} from '@/lib/taxonomy/quiz-taxonomy'
import { QuestionType } from '@/types/question_types'
import { ArrowLeft, Loader2, Minus, Plus, Sparkles } from 'lucide-react'

const NOTES_PLACEHOLDER =
  'Numbers from 100 to 1000. Ask what the number is, and have the answer written in full, with some mistakes.'

const EXAMPLE_PLACEHOLDER = 'What is he doing?'

const COUNT_PRESETS = [10, 15, 20] as const

const SHAPE_HINTS: Array<{
  label: string
  form?: SentenceForm
  style?: QuestionStyle
}> = [
  { label: 'Affirmative', form: 'Affirmative' },
  { label: 'Negative', form: 'Negative' },
  { label: 'Yes/No question', form: 'Yes/No question' },
  { label: 'Wh-question', form: 'Wh-question' },
  { label: 'Fill the gap', style: 'Fill the gap' },
  { label: 'Find the mistake', style: 'Find the mistake' },
]

const pillClass = (selected: boolean) =>
  `cursor-pointer px-2 pt-1 h-8 text-sm font-medium transition-all text-nowrap duration-150 border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)] ease-in-out hover:shadow-md ${
    selected
      ? 'bg-[--primary-accent] text-[--text-color]'
      : 'bg-white text-[--text-color]'
  }`

export interface ShapeSampleDraft {
  shape: QuestionShapeLabel
  question: string
  answerStyle: string
  selected: boolean
}

export interface AIGenerationDraftBrief {
  teacherNotes: string
  modelSentence: string
  selectedTags: string[]
  level: CefrLevelId
  sentenceForms: SentenceForm[]
  questionStyles: QuestionStyle[]
  vocabularyFocus: VocabularyFocus
  numberOfQuestions: number
  lessonSummary?: string
  keyVocabulary?: string[]
  sentencePatterns?: string[]
  shapeSamples?: ShapeSampleDraft[]
}

interface AIGenerationFormProps {
  onQuestionsGenerated: (questions: Question[]) => void
  onTagsSync?: (tags: string[]) => void
  quizType: QuestionType
  quizTitle: string
  quizDescription: string
  existingTags: string[]
  initialBrief?: Partial<AIGenerationDraftBrief> | null
  onBriefChange?: (brief: AIGenerationDraftBrief) => void
}

interface GenerationResponse {
  success?: boolean
  questions?: ReviewableQuestion[]
  error?: string
  metadata?: {
    tags?: string[]
    languageAudit?: {
      issueCount?: number
      polished?: boolean
    }
  }
}

interface ShapeResponse {
  success?: boolean
  shapes?: QuestionShape[]
  error?: string
}

type ShapeRow = ShapeSampleDraft

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function isShapeLabel(value: string): value is QuestionShapeLabel {
  return (QUESTION_SHAPE_LABELS as readonly string[]).includes(value)
}

function rowsFromSamples(samples: ShapeSampleDraft[] | undefined): ShapeRow[] {
  return (samples ?? []).flatMap((sample) => {
    if (!isShapeLabel(sample.shape) || !sample.question?.trim()) return []
    return [
      {
        shape: sample.shape,
        question: sample.question,
        answerStyle: sample.answerStyle || 'A short classroom answer',
        selected: Boolean(sample.selected),
      },
    ]
  })
}

export default function AIGenerationForm({
  onQuestionsGenerated,
  onTagsSync,
  quizType,
  quizTitle,
  quizDescription,
  existingTags,
  initialBrief,
  onBriefChange,
}: AIGenerationFormProps) {
  const initialRows = rowsFromSamples(initialBrief?.shapeSamples)
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialBrief?.selectedTags ?? existingTags
  )
  const [selectedLevel, setSelectedLevel] = useState<CefrLevelId | null>(
    initialBrief?.level ?? levelFromTags(existingTags)
  )
  const [teacherNotes, setTeacherNotes] = useState(initialBrief?.teacherNotes ?? '')
  const [modelSentence, setModelSentence] = useState(initialBrief?.modelSentence ?? '')
  const [sentenceForms, setSentenceForms] = useState<SentenceForm[]>(
    initialBrief?.sentenceForms ?? []
  )
  const [questionStyles, setQuestionStyles] = useState<QuestionStyle[]>(
    initialBrief?.questionStyles ?? []
  )
  const [vocabularyFocus] = useState<VocabularyFocus>(
    initialBrief?.vocabularyFocus ?? 'Mixed'
  )
  const [numberOfQuestions, setNumberOfQuestions] = useState(
    initialBrief?.numberOfQuestions ?? 10
  )
  const [lessonSummary, setLessonSummary] = useState(initialBrief?.lessonSummary ?? '')
  const [keyVocabulary, setKeyVocabulary] = useState<string[]>(
    initialBrief?.keyVocabulary ?? []
  )
  const [sentencePatterns, setSentencePatterns] = useState<string[]>(
    initialBrief?.sentencePatterns ?? []
  )
  const [shapeRows, setShapeRows] = useState<ShapeRow[]>(initialRows)
  const [phase, setPhase] = useState<'brief' | 'pick'>(
    initialRows.length > 0 ? 'pick' : 'brief'
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSampling, setIsSampling] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [reviewQuestions, setReviewQuestions] = useState<ReviewableQuestion[] | null>(
    null
  )
  const { addToast } = useCustomToast()
  const lastSyncedSetupTags = useRef(JSON.stringify(existingTags))

  const grammarFocus = useMemo(
    () => resolveGrammarTags(selectedTags),
    [selectedTags]
  )
  const topics = useMemo(() => resolveTopicTags(selectedTags), [selectedTags])
  const levelMissing = !selectedLevel
  const aiDisabled = quizType !== QuestionType.MULTIPLE_CHOICE
  const selectedShapeCount = shapeRows.filter((row) => row.selected).length

  useEffect(() => {
    const key = JSON.stringify(existingTags)
    if (key === lastSyncedSetupTags.current) return
    lastSyncedSetupTags.current = key
    setSelectedTags(existingTags)
    setSelectedLevel(levelFromTags(existingTags))
  }, [existingTags])

  const applyTags = (tags: string[]) => {
    lastSyncedSetupTags.current = JSON.stringify(tags)
    setSelectedTags(tags)
    setSelectedLevel(levelFromTags(tags))
    onTagsSync?.(tags)
  }

  const handleTagToggle = (tag: string) => {
    applyTags(
      selectedTags.includes(tag)
        ? selectedTags.filter((selected) => selected !== tag)
        : [...selectedTags, tag]
    )
  }

  useEffect(() => {
    onBriefChange?.({
      teacherNotes,
      modelSentence,
      selectedTags,
      level: selectedLevel ?? 'A1',
      sentenceForms,
      questionStyles,
      vocabularyFocus,
      numberOfQuestions,
      lessonSummary: lessonSummary || undefined,
      keyVocabulary: keyVocabulary.length ? keyVocabulary : undefined,
      sentencePatterns: sentencePatterns.length ? sentencePatterns : undefined,
      shapeSamples: shapeRows.length ? shapeRows : undefined,
    })
  }, [
    teacherNotes,
    modelSentence,
    selectedTags,
    selectedLevel,
    sentenceForms,
    questionStyles,
    vocabularyFocus,
    numberOfQuestions,
    lessonSummary,
    keyVocabulary,
    sentencePatterns,
    shapeRows,
    onBriefChange,
  ])

  const brief: GenerationBrief = {
    level: selectedLevel ?? 'A1',
    topics,
    grammarFocus,
    teacherNotes,
    modelSentence,
    sentenceForms,
    questionStyles,
    vocabularyFocus,
    numberOfQuestions,
    quizTitle,
    quizDescription,
    lessonSummary: lessonSummary || undefined,
    keyVocabulary: keyVocabulary.length ? keyVocabulary : undefined,
    sentencePatterns: sentencePatterns.length ? sentencePatterns : undefined,
  }

  const selectedShapes = shapeRows
    .filter((row) => row.selected && row.question.trim() && row.answerStyle.trim())
    .map((row) => ({
      shape: row.shape,
      question: row.question.trim(),
      answerStyle: row.answerStyle.trim(),
    }))

  const handleLevelSelect = (level: CefrLevelId) => {
    applyTags(syncLevelIntoTags(selectedTags, level))
  }

  const hintSelected = (hint: (typeof SHAPE_HINTS)[number]) => {
    if (hint.form) return sentenceForms.includes(hint.form)
    if (hint.style) return questionStyles.includes(hint.style)
    return false
  }

  const toggleHint = (hint: (typeof SHAPE_HINTS)[number]) => {
    if (hint.form) {
      const form = hint.form
      setSentenceForms((current) => toggleValue(current, form))
    }
    if (hint.style) {
      const style = hint.style
      setQuestionStyles((current) => toggleValue(current, style))
    }
  }

  const applyAnalysis = (analysis: LessonImageAnalysis) => {
    setLessonSummary(analysis.lessonSummary)
    const nextTags = [
      ...new Set(
        syncLevelIntoTags(
          [
            ...selectedTags.filter((tag) => !normalizeCefrLevel(tag)),
            ...analysis.topics,
            ...analysis.grammarFocus,
          ],
          analysis.suggestedLevel
        )
      ),
    ]
    applyTags(nextTags)
    setKeyVocabulary(analysis.keyVocabulary)
    setSentencePatterns(analysis.sentencePatterns)
    if (analysis.teacherNotesDraft) {
      setTeacherNotes((current) =>
        current.trim() ? current : analysis.teacherNotesDraft || ''
      )
    }
  }

  const analyzeLessonImage = async (file: File) => {
    setIsAnalyzing(true)
    try {
      const body = new FormData()
      body.append('image', file)
      const response = await fetch('/api/ai/analyze-lesson-image', {
        method: 'POST',
        body,
      })
      const result = (await response.json()) as {
        success?: boolean
        analysis?: LessonImageAnalysis
        error?: string
      }
      if (!response.ok || !result.success || !result.analysis) {
        throw new Error(result.error || 'Failed to analyze lesson image')
      }
      applyAnalysis(result.analysis)
      addToast('Lesson analysis ready. Add an example if you want, then show examples.', {
        variant: 'success',
        position: 'top-center',
      })
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to analyze lesson image',
        { variant: 'error', position: 'top-center' }
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const requestShapes = async (avoidStems: string[]) => {
    if (aiDisabled) {
      addToast('AI generation currently supports multiple-choice quizzes only.', {
        variant: 'error',
        position: 'top-center',
      })
      return
    }
    if (!selectedLevel) {
      addToast('Choose a CEFR level before generating.', {
        variant: 'error',
        position: 'top-center',
      })
      return
    }
    if (
      !teacherNotes.trim() &&
      !modelSentence.trim() &&
      !lessonSummary.trim() &&
      !quizDescription.trim() &&
      !quizTitle.trim() &&
      selectedTags.length === 0
    ) {
      addToast('Add a title, notes, or an example question first.', {
        variant: 'error',
        position: 'top-center',
      })
      return
    }

    setIsSampling(true)
    try {
      const notes = [
        teacherNotes.trim(),
        avoidStems.length
          ? `Offer a new set of six shapes. Avoid repeating these stems: ${avoidStems.join(' | ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
      const response = await fetch('/api/ai/generate-question-shapes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...brief,
          teacherNotes: notes,
          questionType: quizType,
          language: 'English',
        }),
      })
      const result = (await response.json()) as ShapeResponse
      if (!response.ok || !result.success || !result.shapes?.length) {
        throw new Error(result.error || 'Failed to generate example questions')
      }
      const exampleShape = modelSentence.trim()
        ? inferQuestionShape(modelSentence)
        : null
      setShapeRows(
        result.shapes.map((shape) => ({
          ...shape,
          selected: exampleShape ? shape.shape === exampleShape : false,
        }))
      )
      setPhase('pick')
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to generate example questions',
        { variant: 'error', position: 'top-center' }
      )
    } finally {
      setIsSampling(false)
    }
  }

  const handleGenerateQuestions = async () => {
    if (selectedShapes.length === 0) {
      addToast('Select at least one example question.', {
        variant: 'error',
        position: 'top-center',
      })
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...brief,
          selectedShapes,
          questionType: quizType,
          language: 'English',
        }),
      })
      const result = (await response.json()) as GenerationResponse
      if (!response.ok || !result.success || !result.questions) {
        throw new Error(result.error || 'Failed to generate questions')
      }

      setReviewQuestions(
        result.questions.map((question) => ({
          ...question,
          imageFile: null,
          status: 'pending',
        }))
      )

      const warningNote =
        (result.metadata?.languageAudit?.issueCount ?? 0) > 0
          ? ' Some level warnings are ready for your review.'
          : ''
      addToast(
        `Drafted ${result.questions.length} questions.${warningNote} Approve the ones you want.`,
        { variant: 'success', position: 'top-center' }
      )
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to generate questions',
        { variant: 'error', position: 'top-center' }
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateOneQuestion = async (
    _index: number,
    previous: ReviewableQuestion
  ): Promise<ReviewableQuestion | null> => {
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...brief,
          selectedShapes: selectedShapes.length ? selectedShapes : undefined,
          numberOfQuestions: 1,
          teacherNotes: [
            brief.teacherNotes,
            'Regenerate one replacement question.',
            `Avoid repeating this exact question: ${previous.question}`,
          ]
            .filter(Boolean)
            .join('\n'),
          questionType: quizType,
          language: 'English',
        }),
      })
      const result = (await response.json()) as GenerationResponse
      if (!response.ok || !result.success || !result.questions?.[0]) {
        throw new Error(result.error || 'Failed to regenerate question')
      }
      const next = result.questions[0]
      addToast('Replacement question ready for review.', {
        variant: 'success',
        position: 'top-center',
      })
      return {
        ...next,
        imageFile: null,
        status: 'pending',
        keptWords: [],
      }
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to regenerate question',
        { variant: 'error', position: 'top-center' }
      )
      return null
    }
  }

  const updateRow = (index: number, patch: Partial<ShapeRow>) => {
    setShapeRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    )
  }

  if (reviewQuestions) {
    return (
      <div className="flex flex-col gap-6 px-2 pb-4 pt-6 md:px-4 md:pt-8">
        <AIQuestionReviewPanel
          questions={reviewQuestions}
          onCancel={() => setReviewQuestions(null)}
          onRegenerateOne={regenerateOneQuestion}
          onCommit={(approved) => {
            onTagsSync?.(discoveryTagsFromBrief(brief))
            onQuestionsGenerated(approved)
            setReviewQuestions(null)
            addToast(
              `Added ${approved.length} approved question${approved.length === 1 ? '' : 's'} to the quiz.`,
              { variant: 'success', position: 'top-center' }
            )
          }}
        />
      </div>
    )
  }

  return (
    <div className="grandstander flex flex-col gap-5 p-4 text-[--text-color] md:p-6">
      {aiDisabled && (
        <Card className="border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          AI generation is available for multiple-choice quizzes only. Change
          the quiz type in setup, or add questions manually / via CSV.
        </Card>
      )}

      {phase === 'pick' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold leading-tight">
                Select the question types you want
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Tick the shapes to use. The quiz follows only those rows.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => setPhase('brief')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Notes
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setShapeRows((current) => current.map((row) => ({ ...row, selected: true })))
              }
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setShapeRows((current) => current.map((row) => ({ ...row, selected: false })))
              }
            >
              Clear
            </Button>
          </div>

          <ul className="flex flex-col gap-3">
            {shapeRows.map((row, index) => (
              <li
                key={`${row.shape}-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-violet-600"
                    checked={row.selected}
                    aria-label={`Use example ${index + 1}`}
                    onChange={(event) => updateRow(index, { selected: event.target.checked })}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Badge variant="secondary" className="h-7 px-2 text-xs">
                      {row.shape}
                    </Badge>
                    <Textarea
                      rows={2}
                      value={row.question}
                      aria-label={`Example question ${index + 1}`}
                      onChange={(event) => updateRow(index, { question: event.target.value })}
                      className="min-h-[4rem] rounded-md border-slate-200 bg-white"
                    />
                    <Input
                      value={row.answerStyle}
                      aria-label={`Answer style ${index + 1}`}
                      placeholder="How the answers should look"
                      onChange={(event) => updateRow(index, { answerStyle: event.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-gray-50 px-4 py-3">
            <p className="text-sm font-semibold">How many questions?</p>
            <div className="flex flex-wrap items-center gap-2">
              {COUNT_PRESETS.map((count) => (
                <Badge
                  key={count}
                  variant={numberOfQuestions === count ? 'default' : 'outline'}
                  className={pillClass(numberOfQuestions === count)}
                  onClick={() => setNumberOfQuestions(count)}
                >
                  {count}
                </Badge>
              ))}
              <div className="flex items-center gap-1 rounded-full border-2 border-[--border-dark] bg-white px-1 py-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  disabled={numberOfQuestions <= 1}
                  onClick={() => setNumberOfQuestions((current) => Math.max(1, current - 1))}
                  aria-label="Fewer questions"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-6 text-center text-base font-bold tabular-nums">
                  {numberOfQuestions}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  disabled={numberOfQuestions >= 20}
                  onClick={() => setNumberOfQuestions((current) => Math.min(20, current + 1))}
                  aria-label="More questions"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSampling || aiDisabled}
              onClick={() =>
                void requestShapes(shapeRows.map((row) => row.question).filter(Boolean))
              }
            >
              {isSampling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Thinking…
                </>
              ) : (
                'Show a different set'
              )}
            </Button>
            <Button
              type="button"
              onClick={() => void handleGenerateQuestions()}
              disabled={isGenerating || aiDisabled || selectedShapeCount === 0}
              className="flex h-10 items-center gap-2 border border-[#1F6E91] bg-[--text-color] px-5 text-sm font-semibold text-white shadow-[3px_3px_0px_0px_#1F6E91] hover:bg-white hover:text-[--text-color]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate {numberOfQuestions} question
                  {numberOfQuestions === 1 ? '' : 's'}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div>
                <h3 className="text-lg font-bold leading-tight">
                  {quizTitle || 'Untitled quiz'}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {quizDescription || 'No description yet'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <TagDrawer
                  allTags={ALL_TAG_CATEGORIES}
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                  onSelectedTagsChange={applyTags}
                  triggerElement={
                    <Button
                      id="aiQuizTags"
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 border border-violet-400 bg-violet-50 px-3 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      Edit tags
                    </Button>
                  }
                  title="Edit quiz tags"
                  description="Tags guide the examples. Your notes and the shapes you tick decide the quiz."
                />
                {selectedTags.length > 0 ? (
                  selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="h-8 cursor-pointer border-[--primary-accent] px-2 pt-1 text-sm text-[--text-color] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                      <span className="ml-2 text-xs font-bold hover:text-red-500">&times;</span>
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No tags yet</span>
                )}
              </div>
            </div>
            <div className="lg:col-span-1">
              <LessonPageCapture
                compact
                disabled={aiDisabled}
                isAnalyzing={isAnalyzing}
                onAnalyze={analyzeLessonImage}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherNotes" className="text-sm font-semibold">
              What should the questions practise?
            </Label>
            <Textarea
              id="teacherNotes"
              rows={3}
              value={teacherNotes}
              onChange={(event) => setTeacherNotes(event.target.value)}
              placeholder={NOTES_PLACEHOLDER}
              disabled={aiDisabled}
              className="min-h-[5.5rem] rounded-md border-2 border-slate-200 bg-white px-4 py-3 text-[--text-color] placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exampleQuestion" className="text-sm font-semibold">
              Example question
            </Label>
            <Input
              id="exampleQuestion"
              value={modelSentence}
              onChange={(event) => setModelSentence(event.target.value)}
              placeholder={EXAMPLE_PLACEHOLDER}
              disabled={aiDisabled}
              className="h-11 rounded-md border-2 border-slate-200 bg-white"
            />
            <p className="text-xs text-slate-500">
              Optional. The first examples stay close to this sentence. The rest
              try other forms of the same language point.
            </p>
          </div>

          {(lessonSummary || keyVocabulary.length > 0) && (
            <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
              <Label className="text-sm font-semibold">Lesson analysis</Label>
              <Textarea
                rows={2}
                value={lessonSummary}
                onChange={(event) => setLessonSummary(event.target.value)}
                className="rounded-md bg-white"
              />
              {keyVocabulary.length > 0 && (
                <p className="text-xs text-gray-600">
                  Vocabulary: {keyVocabulary.join(', ')}
                </p>
              )}
            </div>
          )}

          {levelMissing ? (
            <div className="space-y-2 rounded-xl border border-[--primary-accent] bg-white p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">Level</p>
                <p className="text-xs text-gray-500">Required — choose one</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CEFR_LEVELS.map((level) => (
                  <Badge
                    key={level.id}
                    variant="outline"
                    className={pillClass(false)}
                    onClick={() => !aiDisabled && handleLevelSelect(level.id)}
                  >
                    {level.label}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">Level</p>
              {CEFR_LEVELS.map((level) => (
                <Badge
                  key={level.id}
                  variant={selectedLevel === level.id ? 'default' : 'outline'}
                  className={pillClass(selectedLevel === level.id)}
                  onClick={() => !aiDisabled && handleLevelSelect(level.id)}
                >
                  {level.label}
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold">Also try these forms</p>
            <p className="text-xs text-slate-500">
              Optional hints for the sample. You still choose which shapes to keep.
            </p>
            <div className="flex flex-wrap gap-2">
              {SHAPE_HINTS.map((hint) => {
                const selected = hintSelected(hint)
                return (
                  <Badge
                    key={hint.label}
                    variant={selected ? 'default' : 'outline'}
                    className={pillClass(selected)}
                    onClick={() => !aiDisabled && toggleHint(hint)}
                  >
                    {hint.label}
                  </Badge>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void requestShapes([])}
              disabled={isSampling || aiDisabled}
              className="flex h-10 items-center gap-2 border border-[#1F6E91] bg-[--text-color] px-5 text-sm font-semibold text-white shadow-[3px_3px_0px_0px_#1F6E91] hover:bg-white hover:text-[--text-color]"
            >
              {isSampling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Writing examples…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Show 6 examples
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
