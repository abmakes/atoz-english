'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCustomToast } from '@/components/ui/CustomToast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
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
import {
  BookOpen,
  Loader2,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react'

const NOTE_CHIPS = [
  'Students are learning…',
  'Practise this pattern…',
  'Use vocabulary about…',
  'Make the questions similar to…',
]

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
  const [selectedLevel, setSelectedLevel] = useState<CefrLevelId>(
    initialBrief?.level ?? levelFromTags(existingTags) ?? 'A1'
  )
  const [teacherNotes, setTeacherNotes] = useState(initialBrief?.teacherNotes ?? '')
  const [modelSentence, setModelSentence] = useState(
    initialBrief?.modelSentence ?? ''
  )
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
    initialBrief?.numberOfQuestions ?? 8
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
  const [reviewQuestions, setReviewQuestions] = useState<ReviewableQuestion[] | null>(
    null
  )
  const { addToast } = useCustomToast()

  const grammarFocus = useMemo(
    () => resolveGrammarTags(selectedTags),
    [selectedTags]
  )
  const topics = useMemo(() => resolveTopicTags(selectedTags), [selectedTags])

  useEffect(() => {
    if (initialBrief) return
    setSelectedTags(existingTags)
    const level = levelFromTags(existingTags)
    if (level) setSelectedLevel(level)
  }, [existingTags, initialBrief])

  useEffect(() => {
    if (defaultsSeeded) return
    if (grammarFocus.length === 0) return
    setSentenceForms(defaultSentenceFormsForGrammar(grammarFocus))
    setQuestionStyles(defaultQuestionStylesForGrammar(grammarFocus))
    setDefaultsSeeded(true)
  }, [defaultsSeeded, grammarFocus])

  useEffect(() => {
    onBriefChange?.({
      teacherNotes,
      modelSentence,
      selectedTags,
      level: selectedLevel,
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
    onBriefChange,
  ])

  const brief: GenerationBrief = {
    level: selectedLevel,
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

  const briefSummary = buildBriefSummary(brief)
  const levelDetails = CEFR_LEVELS.find((level) => level.id === selectedLevel)
  const aiDisabled = quizType !== QuestionType.MULTIPLE_CHOICE

  const handleTagToggle = (tag: string) => {
    setSelectedTags((current) => {
      const next = current.includes(tag)
        ? current.filter((selected) => selected !== tag)
        : [...current, tag]
      const level = levelFromTags(next)
      if (level) setSelectedLevel(level)
      return next
    })
  }

  const handleSelectedTagsChange = (tags: string[]) => {
    setSelectedTags(tags)
    const level = levelFromTags(tags)
    if (level) setSelectedLevel(level)
  }

  const handleLevelChange = (level: CefrLevelId) => {
    setSelectedLevel(level)
    setSelectedTags((current) => syncLevelIntoTags(current, level))
  }

  const insertChip = (chip: string) => {
    setTeacherNotes((current) =>
      current.trim() ? `${current.trim()} ${chip} ` : `${chip} `
    )
  }

  const applyAnalysis = (analysis: LessonImageAnalysis) => {
    setLessonSummary(analysis.lessonSummary)
    setSelectedLevel(analysis.suggestedLevel)
    setSelectedTags((current) => {
      const next = syncLevelIntoTags(
        [
          ...current.filter((tag) => !normalizeCefrLevel(tag)),
          ...analysis.topics,
          ...analysis.grammarFocus,
        ],
        analysis.suggestedLevel
      )
      return [...new Set(next)]
    })
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
        current.trim()
          ? current
          : analysis.teacherNotesDraft || ''
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
      addToast(
        'Lesson analysis ready — review the brief, then generate when you are happy.',
        { variant: 'success', position: 'top-center' }
      )
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to analyze lesson image',
        { variant: 'error', position: 'top-center' }
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerateQuestions = async () => {
    if (aiDisabled) {
      addToast(
        'AI generation currently supports multiple-choice quizzes only.',
        { variant: 'error', position: 'top-center' }
      )
      return
    }
    if (!teacherNotes.trim() && !lessonSummary.trim() && selectedTags.length === 0) {
      addToast('Add teacher notes, a lesson analysis, or discovery tags first.', {
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

  if (reviewQuestions) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <AIQuestionReviewPanel
          questions={reviewQuestions}
          onCancel={() => setReviewQuestions(null)}
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
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="text-center">
        <h2 className="mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-[--text-color]">
          <Sparkles className="h-6 w-6 text-[--primary-accent]" />
          AI Question Generator
        </h2>
        <p className="text-gray-600">
          Start from your lesson notes or a textbook page. Review every question
          before it enters the quiz.
        </p>
      </div>

      {aiDisabled && (
        <Card className="border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          AI generation is available for multiple-choice quizzes only. Change the
          quiz type in setup, or add questions manually / via CSV.
        </Card>
      )}

      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[--primary-accent]" />
          <h3 className="text-lg font-semibold">Tell us what students are studying</h3>
        </div>

        <LessonPageCapture
          disabled={aiDisabled}
          isAnalyzing={isAnalyzing}
          onAnalyze={analyzeLessonImage}
        />

        {lessonSummary && (
          <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
            <Label>Editable lesson analysis</Label>
            <Textarea
              rows={3}
              value={lessonSummary}
              onChange={(event) => setLessonSummary(event.target.value)}
            />
            {keyVocabulary.length > 0 && (
              <p className="text-xs text-gray-600">
                Key vocabulary: {keyVocabulary.join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="teacherNotes">Teacher notes</Label>
          <Textarea
            id="teacherNotes"
            rows={4}
            value={teacherNotes}
            onChange={(event) => setTeacherNotes(event.target.value)}
            placeholder="Students are learning Present Simple for daily routines. Use Do/Does and short questions."
            disabled={aiDisabled}
          />
          <div className="flex flex-wrap gap-2">
            {NOTE_CHIPS.map((chip) => (
              <Button
                key={chip}
                type="button"
                size="sm"
                variant="outline"
                disabled={aiDisabled}
                onClick={() => insertChip(chip)}
              >
                {chip}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelSentence">Optional model sentence</Label>
          <Input
            id="modelSentence"
            value={modelSentence}
            onChange={(event) => setModelSentence(event.target.value)}
            placeholder="She plays football every Saturday."
            disabled={aiDisabled}
          />
          <p className="text-xs text-gray-500">
            The AI should model the structure, not copy the wording. Book or unit
            names can stay as private context.
          </p>
        </div>
      </Card>

      <Card className="space-y-5 p-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[--primary-accent]" />
          <h3 className="text-lg font-semibold">Choose how to test it</h3>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Label className="whitespace-nowrap font-semibold">CEFR level</Label>
          <Select
            value={selectedLevel}
            onValueChange={(value) => handleLevelChange(value as CefrLevelId)}
            disabled={aiDisabled}
          >
            <SelectTrigger className="w-full max-w-72 bg-white">
              <SelectValue placeholder="Select a level" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {CEFR_LEVELS.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  <div>
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-gray-500">{level.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Discovery tags (Level / Topic / Grammar)</Label>
          <div className="flex flex-wrap items-center gap-2">
            <TagDrawer
              allTags={ALL_TAG_CATEGORIES}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              onSelectedTagsChange={handleSelectedTagsChange}
              triggerElement={
                <Button variant="outline" className="min-w-36" disabled={aiDisabled}>
                  Select tags
                </Button>
              }
              title="Select classroom tags"
              description="These tags publish with the quiz for discovery."
            />
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              >
                {tag} <span className="ml-1">&times;</span>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Sentence form</Label>
          <div className="flex flex-wrap gap-2">
            {SENTENCE_FORM_OPTIONS.map((form) => {
              const selected = sentenceForms.includes(form)
              return (
                <Badge
                  key={form}
                  variant={selected ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    !aiDisabled && setSentenceForms((current) => toggleValue(current, form))
                  }
                >
                  {form}
                </Badge>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Question style</Label>
          <div className="flex flex-wrap gap-2">
            {QUESTION_STYLE_OPTIONS.map((style) => {
              const selected = questionStyles.includes(style)
              return (
                <Badge
                  key={style}
                  variant={selected ? 'default' : 'outline'}
                  className="cursor-pointer"
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

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Label className="whitespace-nowrap font-semibold">Vocabulary focus</Label>
          <Select
            value={vocabularyFocus}
            onValueChange={(value) =>
              setVocabularyFocus(value as VocabularyFocus)
            }
            disabled={aiDisabled}
          >
            <SelectTrigger className="w-full max-w-56 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {VOCABULARY_FOCUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Label className="whitespace-nowrap font-semibold">Questions</Label>
          <span className="text-sm text-gray-600">1</span>
          <Slider
            value={[numberOfQuestions]}
            onValueChange={(value) => setNumberOfQuestions(value[0])}
            min={1}
            max={20}
            step={1}
            disabled={aiDisabled}
            className="w-full rounded-lg border border-[var(--border-dark)] bg-[var(--primary-light)] shadow-[2px_2px_0px_0px_var(--border-dark)]"
          />
          <span className="text-sm text-gray-600">20</span>
          <Badge variant="secondary">{numberOfQuestions}</Badge>
        </div>
      </Card>

      <Card className="space-y-3 border-sky-200 bg-sky-50 p-4">
        <h3 className="text-lg font-semibold text-sky-950">Review the generation brief</h3>
        <p className="text-sky-950">{briefSummary}</p>
        <p className="text-sm text-sky-900">
          Level {levelDetails?.label ?? levelLabelFromId(selectedLevel)} ·{' '}
          {topics.join(', ') || 'No topic yet'} ·{' '}
          {grammarFocus.join(', ') || 'No grammar focus yet'}
        </p>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50 p-4">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-none text-emerald-700" />
          <div className="text-sm text-emerald-950">
            <p className="font-semibold">Lexicon is a soft classroom assistant</p>
            <p>
              After generation you will see level warnings and simplification
              suggestions. Nothing is blocked for vocabulary alone — you decide
              what stays in the quiz.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={handleGenerateQuestions}
          disabled={isGenerating || aiDisabled}
          className="bg-[--primary-accent] px-8 py-3 text-lg font-semibold text-white hover:bg-[--primary-accent-hover]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating draft…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate {numberOfQuestions} question
              {numberOfQuestions === 1 ? '' : 's'} for review
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
