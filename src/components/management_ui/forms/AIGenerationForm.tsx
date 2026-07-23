'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCustomToast } from '@/components/ui/CustomToast'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { TagDrawer } from '@/components/management_ui/TagDrawer'
import { ALL_TAG_CATEGORIES } from '@/lib/tags'
import {
  CEFR_LEVELS,
  levelFromTags,
  type CefrLevelId,
} from '@/lib/taxonomy/quiz-taxonomy'
import { QuestionType } from '@/types/question_types'
import { Loader2, ShieldCheck, Sparkles, Target, Users } from 'lucide-react'
import type { Question } from '@/components/management_ui/QuizEditor'

interface AIGenerationFormProps {
  onQuestionsGenerated: (questions: Question[]) => void
  quizType: QuestionType
  quizTitle: string
  quizDescription: string
  existingTags: string[]
}

interface GenerationResponse {
  success?: boolean
  questions?: Question[]
  error?: string
  metadata?: {
    lexiconVersion?: string
    matchingWords?: number
    languageAudit?: {
      repaired?: boolean
    }
  }
}

export default function AIGenerationForm({
  onQuestionsGenerated,
  quizType,
  quizTitle,
  quizDescription,
  existingTags,
}: AIGenerationFormProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(existingTags)
  const [selectedLevel, setSelectedLevel] = useState<CefrLevelId>(
    levelFromTags(existingTags) ?? 'PRE_A1'
  )
  const [numberOfQuestions, setNumberOfQuestions] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const { addToast } = useCustomToast()

  useEffect(() => {
    setSelectedTags(existingTags)
    const level = levelFromTags(existingTags)
    if (level) setSelectedLevel(level)
  }, [existingTags])

  const handleTagToggle = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((selected) => selected !== tag)
        : [...current, tag]
    )
  }

  const handleGenerateQuestions = async () => {
    if (selectedTags.length === 0) {
      addToast('Select at least one topic or language focus.', {
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
          tags: selectedTags,
          level: selectedLevel,
          questionType: quizType,
          numberOfQuestions,
          quizTitle,
          quizDescription,
          language: 'English',
        }),
      })
      const result = (await response.json()) as GenerationResponse

      if (!response.ok || !result.success || !result.questions) {
        throw new Error(result.error || 'Failed to generate questions')
      }

      onQuestionsGenerated(result.questions)
      const repairNote = result.metadata?.languageAudit?.repaired
        ? ' The language guard rewrote the first draft.'
        : ''
      addToast(
        `Generated ${result.questions.length} level-checked questions.${repairNote}`,
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

  const levelDetails = CEFR_LEVELS.find((level) => level.id === selectedLevel)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center">
        <h2 className="mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-[--text-color]">
          <Sparkles className="h-6 w-6 text-[--primary-accent]" />
          AI Question Generator
        </h2>
        <p className="text-gray-600">
          Build short questions from an open young-learner vocabulary boundary.
        </p>
      </div>

      <Card className="p-4">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex flex-shrink-0 items-center gap-2">
              <Target className="h-5 w-5 text-[--primary-accent]" />
              <Label className="whitespace-nowrap text-base font-semibold">
                CEFR level:
              </Label>
            </div>
            <Select
              value={selectedLevel}
              onValueChange={(value) => setSelectedLevel(value as CefrLevelId)}
            >
              <SelectTrigger className="w-full max-w-72 bg-white">
                <SelectValue placeholder="Select a level" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {CEFR_LEVELS.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    <div>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm text-gray-500">
                        {level.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-shrink-0 items-center gap-2">
              <Users className="h-5 w-5 text-[--primary-accent]" />
              <Label className="whitespace-nowrap text-base font-semibold">
                Questions:
              </Label>
            </div>
            <span className="text-sm text-gray-600">1</span>
            <Slider
              value={[numberOfQuestions]}
              onValueChange={(value) => setNumberOfQuestions(value[0])}
              min={1}
              max={20}
              step={1}
              className="w-full rounded-lg border border-[var(--border-dark)] bg-[var(--primary-light)] shadow-[2px_2px_0px_0px_var(--border-dark)]"
            />
            <span className="text-sm text-gray-600">20</span>
          </div>

          <div className="flex items-start gap-3">
            <Label className="pt-2 text-base font-semibold">Tags:</Label>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <TagDrawer
                allTags={ALL_TAG_CATEGORIES}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                triggerElement={
                  <Button variant="outline" className="min-w-36">
                    Select tags
                  </Button>
                }
                title="Select generation tags"
                description="Choose a topic, word class, or short grammar focus."
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
        </div>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50 p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-emerald-700" />
          <div className="text-sm text-emerald-950">
            <p className="font-semibold">
              Open lexicon language guard: {levelDetails?.label}
            </p>
            <p>
              Questions and answers are checked after generation. Out-of-scope
              words trigger an automatic rewrite; unresolved drafts are not
              added to your quiz.
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-gray-50 p-4 text-sm">
        <p>
          <span className="font-medium">Quiz:</span>{' '}
          {quizTitle || 'No title set'}
        </p>
        <p>
          <span className="font-medium">Focus:</span>{' '}
          {selectedTags.join(', ') || 'No tags selected'}
        </p>
        <p>
          <span className="font-medium">Batch:</span> {numberOfQuestions}{' '}
          questions at {levelDetails?.label}
        </p>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={handleGenerateQuestions}
          disabled={isGenerating || selectedTags.length === 0}
          className="bg-[--primary-accent] px-8 py-3 text-lg font-semibold text-white hover:bg-[--primary-accent-hover]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating and checking...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate {numberOfQuestions} question
              {numberOfQuestions === 1 ? '' : 's'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
