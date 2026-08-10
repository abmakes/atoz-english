'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCustomToast } from '@/components/ui/CustomToast'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TagDrawer } from '@/components/management_ui/TagDrawer'
import LessonPageCapture from '@/components/management_ui/LessonPageCapture'
import AIQuestionReviewPanel, {
  type ReviewableQuestion,
} from '@/components/management_ui/AIQuestionReviewPanel'
import type { Question } from '@/components/management_ui/QuizEditor'
import { ALL_TAG_CATEGORIES } from '@/lib/tags'
import {
  buildBriefSummary,
  defaultQuestionStylesForGrammar,
  defaultSentenceFormsForGrammar,
  discoveryTagsFromBrief,
  type GenerationBrief,
  type LessonImageAnalysis,
} from '@/lib/ai/generation-brief'
import {
  CEFR_LEVELS,
  QUESTION_STYLE_OPTIONS,
  SENTENCE_FORM_OPTIONS,
  VOCABULARY_FOCUS_OPTIONS,
  levelFromTags,
  levelLabelFromId,
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
import { Loader2, Minus, Plus, ShieldAlert, Sparkles } from 'lucide-react'

const NOTES_PLACEHOLDER =
  'Students are learning Present Simple for daily routines. Use Do/Does and short questions. Optional model sentence: She plays football every Saturday.'

const pillClass = (selected: boolean) =>
  `cursor-pointer px-2 pt-1 h-8 text-sm font-medium transition-all text-nowrap duration-150 border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)] ease-in-out hover:shadow-md ${
    selected
      ? 'bg-[--primary-accent] text-[--text-color]'
      : 'bg-white text-[--text-color]'
  }`

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

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
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
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialBrief?.selectedTags ?? existingTags
  )
  const [selectedLevel, setSelectedLevel] = useState<CefrLevelId | null>(
    initialBrief?.level ?? levelFromTags(existingTags)
  )
  const [teacherNotes, setTeacherNotes] = useState(initialBrief?.teacherNotes ?? '')
  const [sentenceForms, setSentenceForms] = useState<SentenceForm[]>(
    initialBrief?.sentenceForms ?? []
  )
  const [questionStyles, setQuestionStyles] = useState<QuestionStyle[]>(
    initialBrief?.questionStyles ?? []
  )
  const [vocabularyFocus, setVocabularyFocus] = useState<VocabularyFocus>(
    initialBrief?.vocabularyFocus ?? 'Mixed'
  )
  const [numberOfQuestions, setNumberOfQuestions] = useState(
    initialBrief?.numberOfQuestions ?? 10
  )
  const [lessonSummary, setLessonSummary] = useState(
    initialBrief?.lessonSummary ?? ''
  )
  const [keyVocabulary, setKeyVocabulary] = useState<string[]>(
    initialBrief?.keyVocabulary ?? []
  )
  const [sentencePatterns, setSentencePatterns] = useState<string[]>(
    initialBrief?.sentencePatterns ?? []
  )
  const [defaultsSeeded, setDefaultsSeeded] = useState(
    Boolean(initialBrief?.sentenceForms?.length || initialBrief?.questionStyles?.length)
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
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

  // Keep AI tags in sync when the teacher edits them back on Quiz Setup
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
    if (defaultsSeeded) return
    if (grammarFocus.length > 0) {
      setSentenceForms(defaultSentenceFormsForGrammar(grammarFocus))
      setQuestionStyles(defaultQuestionStylesForGrammar(grammarFocus))
    } else {
      setSentenceForms(['Affirmative', 'Negative'])
      setQuestionStyles(['Choose the correct form', 'Fill the gap'])
    }
    setDefaultsSeeded(true)
  }, [defaultsSeeded, grammarFocus])

  useEffect(() => {
    onBriefChange?.({
      teacherNotes,
      modelSentence: '',
      selectedTags,
      level: selectedLevel ?? 'A1',
      sentenceForms,
      questionStyles,
      vocabularyFocus,
      numberOfQuestions,
      lessonSummary: lessonSummary || undefined,
      keyVocabulary: keyVocabulary.length ? keyVocabulary : undefined,
      sentencePatterns: sentencePatterns.length ? sentencePatterns : undefined,
    })
  }, [
    teacherNotes,
    selectedTags,
    selectedLevel,
    sentenceForms,
    questionStyles,
    vocabularyFocus,
    numberOfQuestions,
    lessonSummary,
    keyVocabulary,
    sentencePatterns,
    onBriefChange,
  ])

  const brief: GenerationBrief = {
    level: selectedLevel ?? 'A1',
    topics,
    grammarFocus,
    teacherNotes,
    modelSentence: '',
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

  const briefSummary = buildBriefSummary(brief)
  const aiDisabled = quizType !== QuestionType.MULTIPLE_CHOICE

  const handleLevelSelect = (level: CefrLevelId) => {
    applyTags(syncLevelIntoTags(selectedTags, level))
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
    setQuestionStyles(
      analysis.questionStyles.length
        ? analysis.questionStyles
        : defaultQuestionStylesForGrammar(analysis.grammarFocus)
    )
    setSentenceForms(defaultSentenceFormsForGrammar(analysis.grammarFocus))
    if (analysis.teacherNotesDraft) {
      setTeacherNotes((current) =>
        current.trim() ? current : analysis.teacherNotesDraft || ''
      )
    }
    setDefaultsSeeded(true)
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
      addToast('Lesson analysis ready. Confirm your brief, then generate.', {
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

  const openConfirm = () => {
    if (aiDisabled) {
      addToast(
        'AI generation currently supports multiple-choice quizzes only.',
        { variant: 'error', position: 'top-center' }
      )
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
      !lessonSummary.trim() &&
      !quizDescription.trim() &&
      selectedTags.length === 0
    ) {
      addToast('Add quiz notes or a lesson page before generating.', {
        variant: 'error',
        position: 'top-center',
      })
      return
    }
    setConfirmOpen(true)
  }

  const handleGenerateQuestions = async () => {
    setConfirmOpen(false)
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...brief,
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
    <div className="grandstander flex flex-col gap-5 p-2 text-[--text-color] md:p-4">
      <div className="rounded-lg border border-[--border-dark] bg-white p-4 shadow-[4px_4px_0px_0px_var(--border-dark)] md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[--primary-accent]" />
          <h2 className="text-xl font-bold">AI Question Generator</h2>
        </div>

        {aiDisabled && (
          <Card className="mb-4 border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            AI generation is available for multiple-choice quizzes only. Change
            the quiz type in setup, or add questions manually / via CSV.
          </Card>
        )}

        {/* Prefill summary + textbook upload */}
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 rounded-lg bg-gray-50 p-4 lg:col-span-2">
            <div>
              <p className="mb-1 text-sm font-bold">Quiz</p>
              <p className="text-base">{quizTitle || 'Untitled quiz'}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-bold">Description</p>
              <p className="text-sm text-slate-700">
                {quizDescription || 'No description yet'}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold">Tags</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <TagDrawer
                  allTags={ALL_TAG_CATEGORIES}
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                  onSelectedTagsChange={applyTags}
                  triggerElement={
                    <div className="flex h-10 w-full cursor-pointer items-center rounded-full border border-violet-400 transition-colors hover:bg-violet-50 sm:w-72">
                      <span className="flex h-full w-32 items-center rounded-full bg-violet-100 px-4 pb-1 pt-2 text-base font-semibold text-violet-700 hover:bg-violet-200">
                        Quiz Tags
                      </span>
                      <Button
                        id="aiQuizTags"
                        type="button"
                        variant="outline"
                        className="h-full flex-1 border-none pb-1 pt-2 text-base text-[--text-color]"
                      >
                        Select Tags
                      </Button>
                    </div>
                  }
                  title="Edit quiz tags"
                  description="These tags publish with the quiz and guide AI generation."
                />
                <div className="flex flex-wrap items-center gap-2">
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="h-8 cursor-pointer border-[--primary-accent] px-2 pt-1 text-sm text-[--text-color] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                        <span className="ml-2 text-xs font-bold hover:text-red-500">
                          &times;
                        </span>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No tags selected yet.</p>
                  )}
                </div>
              </div>
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

        {/* Full-width quiz notes */}
        <div className="mb-2 space-y-2">
          <Label htmlFor="teacherNotes" className="text-base font-bold">
            Quiz notes
          </Label>
          <p className="text-sm text-slate-600">
            Expand on your description to help generate accurate questions.
          </p>
          <Textarea
            id="teacherNotes"
            rows={3}
            value={teacherNotes}
            onChange={(event) => setTeacherNotes(event.target.value)}
            placeholder={NOTES_PLACEHOLDER}
            disabled={aiDisabled}
            className="min-h-[5.5rem] border-2 border-slate-200 bg-white px-4 py-3 text-[--text-color] placeholder:text-slate-400"
          />
        </div>

        {(lessonSummary || keyVocabulary.length > 0 || sentencePatterns.length > 0) && (
          <div className="mb-5 mt-4 space-y-2 rounded-lg border bg-slate-50 p-3">
            <Label className="font-bold">Lesson analysis</Label>
            <Textarea
              rows={2}
              value={lessonSummary}
              onChange={(event) => setLessonSummary(event.target.value)}
              className="bg-white"
            />
            {keyVocabulary.length > 0 && (
              <p className="text-xs text-gray-600">
                Vocabulary: {keyVocabulary.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Quick question count — prominent for fast path */}
        <div className="my-8 flex flex-wrap items-center justify-center gap-4 rounded-xl border-2 border-slate-200 bg-gray-50 px-6 py-5">
          <p className="text-xl font-bold">Questions</p>
          <div className="flex items-center gap-3 rounded-full border-2 border-[--border-dark] bg-white px-3 py-2 shadow-[3px_3px_0px_0px_var(--border-dark)]">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-full"
              disabled={aiDisabled || numberOfQuestions <= 1}
              onClick={() =>
                setNumberOfQuestions((current) => Math.max(1, current - 1))
              }
            >
              <Minus className="h-5 w-5" />
            </Button>
            <span className="min-w-10 text-center text-3xl font-bold tabular-nums">
              {numberOfQuestions}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-full"
              disabled={aiDisabled || numberOfQuestions >= 20}
              onClick={() =>
                setNumberOfQuestions((current) => Math.min(20, current + 1))
              }
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Optional fine-tune controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Fine-tune questions</h3>

          {levelMissing && (
            <div className="space-y-2 rounded-xl border border-[--primary-accent] bg-white p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-bold">Level</p>
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
          )}

          {!levelMissing && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold">Level</p>
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[--primary-accent] bg-white p-4">
              <p className="mb-3 font-bold">Sentence form</p>
              <div className="flex flex-wrap gap-2">
                {SENTENCE_FORM_OPTIONS.map((form) => {
                  const selected = sentenceForms.includes(form)
                  return (
                    <Badge
                      key={form}
                      variant={selected ? 'default' : 'outline'}
                      className={pillClass(selected)}
                      onClick={() =>
                        !aiDisabled &&
                        setSentenceForms((current) => toggleValue(current, form))
                      }
                    >
                      {form}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[--primary-accent] bg-white p-4">
              <p className="mb-3 font-bold">Question style</p>
              <div className="flex flex-wrap gap-2">
                {QUESTION_STYLE_OPTIONS.map((style) => {
                  const selected = questionStyles.includes(style)
                  return (
                    <Badge
                      key={style}
                      variant={selected ? 'default' : 'outline'}
                      className={pillClass(selected)}
                      onClick={() =>
                        !aiDisabled &&
                        setQuestionStyles((current) => toggleValue(current, style))
                      }
                    >
                      {style}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[--primary-accent] bg-white p-4">
              <p className="mb-3 font-bold">Vocabulary focus</p>
              <div className="flex flex-wrap gap-2">
                {VOCABULARY_FOCUS_OPTIONS.map((option) => {
                  const selected = vocabularyFocus === option
                  return (
                    <Badge
                      key={option}
                      variant={selected ? 'default' : 'outline'}
                      className={pillClass(selected)}
                      onClick={() => !aiDisabled && setVocabularyFocus(option)}
                    >
                      {option}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            onClick={openConfirm}
            disabled={isGenerating || aiDisabled}
            className="flex h-12 items-center gap-2 border border-[#1F6E91] bg-[--text-color] px-8 text-lg font-semibold text-white shadow-[4px_4px_0px_0px_#1F6E91] hover:scale-105 hover:bg-white hover:text-[--text-color]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate {numberOfQuestions} question
                {numberOfQuestions === 1 ? '' : 's'}
              </>
            )}
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="grandstander max-w-lg bg-white text-[--text-color]">
          <DialogHeader>
            <DialogTitle>Review the generation brief</DialogTitle>
            <DialogDescription className="text-slate-600">
              Confirm this plan before we call Gemini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
              <p className="text-sky-950">{briefSummary}</p>
              <p className="mt-2 text-sm text-sky-900">
                Level {levelLabelFromId(brief.level)} ·{' '}
                {topics.join(', ') || 'No topic yet'} ·{' '}
                {grammarFocus.join(', ') || 'No grammar focus yet'}
              </p>
            </div>
            <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <ShieldAlert className="mt-0.5 h-5 w-5 flex-none text-emerald-700" />
              <div>
                <p className="font-semibold">Lexicon is a soft classroom assistant</p>
                <p>
                  You will see level warnings and simplification suggestions after
                  generation. Nothing is blocked for vocabulary alone.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => void handleGenerateQuestions()}
              className="bg-[--primary-accent] text-white hover:bg-[--primary-accent-hover]"
            >
              Confirm & generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
