'use client'

import { useMemo, useState } from 'react'
import { Check, ClipboardCopy, FileJson } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { QuestionType } from '@/types/question_types'
import {
  buildExternalAiPrompt,
  parseImportedQuestionsJson,
  type ImportedQuestion,
} from '@/lib/ai/prompt-import'

interface PromptImportFormProps {
  quizTitle: string
  quizDescription: string
  tags: string[]
  quizOverallType: QuestionType
  onAddQuestions: (questions: ImportedQuestion[]) => void
  className?: string
}

export default function PromptImportForm({
  quizTitle,
  quizDescription,
  tags,
  quizOverallType,
  onAddQuestions,
  className,
}: PromptImportFormProps) {
  const [numberOfQuestions, setNumberOfQuestions] = useState(10)
  const [exampleSentences, setExampleSentences] = useState('')
  const [themesVocabulary, setThemesVocabulary] = useState('')
  const [pastedJson, setPastedJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const prompt = useMemo(
    () =>
      buildExternalAiPrompt({
        quizTitle,
        quizDescription,
        tags,
        numberOfQuestions,
        exampleSentences,
        themesVocabulary,
        quizType: quizOverallType,
      }),
    [
      quizTitle,
      quizDescription,
      tags,
      numberOfQuestions,
      exampleSentences,
      themesVocabulary,
      quizOverallType,
    ]
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy. Select the prompt and copy manually.')
    }
  }

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      const questions = parseImportedQuestionsJson(pastedJson, quizOverallType)
      onAddQuestions(questions)
      setSuccess(true)
      setPastedJson('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import questions.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex w-full flex-col gap-3 ${className || ''}`}>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            Questions
            <Input
              type="number"
              min={1}
              max={40}
              value={numberOfQuestions}
              onChange={(e) => {
                const next = Number(e.target.value)
                setNumberOfQuestions(
                  Number.isFinite(next) ? Math.min(40, Math.max(1, next)) : 10
                )
              }}
              className="h-9 w-20 border border-slate-200 bg-white shadow-none"
            />
          </label>
          <Button
            type="button"
            variant="default"
            onClick={handleCopy}
            className="h-9 border border-[--border-dark] bg-white px-3 text-sm font-semibold text-[--text-color] shadow-[3px_3px_0px_0px_var(--border-dark)] hover:bg-[--primary-light]"
          >
            {copied ? (
              <>
                <Check className="mr-1.5 h-4 w-4 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <ClipboardCopy className="mr-1.5 h-4 w-4" />
                Copy prompt
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="prompt-example-sentences"
              className="text-xs font-semibold text-slate-700"
            >
              Example sentences
            </label>
            <Textarea
              id="prompt-example-sentences"
              value={exampleSentences}
              onChange={(e) => setExampleSentences(e.target.value)}
              placeholder="e.g. She goes to school every day. / What does he like?"
              rows={2}
              className="min-h-[2.75rem] resize-y border border-slate-200 bg-white py-1.5 text-sm shadow-none"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="prompt-themes-vocabulary"
              className="text-xs font-semibold text-slate-700"
            >
              Themes & vocabulary
            </label>
            <Textarea
              id="prompt-themes-vocabulary"
              value={themesVocabulary}
              onChange={(e) => setThemesVocabulary(e.target.value)}
              placeholder="e.g. zoo animals, classroom objects, food words"
              rows={2}
              className="min-h-[2.75rem] resize-y border border-slate-200 bg-white py-1.5 text-sm shadow-none"
            />
          </div>
        </div>

        <div className="mt-2 space-y-1">
          <label htmlFor="external-ai-prompt" className="text-xs font-semibold text-slate-700">
            Prompt preview
          </label>
          <Textarea
            id="external-ai-prompt"
            readOnly
            value={prompt}
            rows={3}
            className="min-h-[3.5rem] resize-y border border-slate-200 bg-white py-1.5 font-mono text-[11px] leading-snug text-slate-600 shadow-none"
          />
        </div>
      </div>

      <form onSubmit={handleImport} className="space-y-2">
        <div className="space-y-1">
          <label htmlFor="pasted-quiz-json" className="text-sm font-semibold text-slate-800">
            Paste AI JSON here
          </label>
          <Textarea
            id="pasted-quiz-json"
            value={pastedJson}
            onChange={(e) => {
              setPastedJson(e.target.value)
              setError(null)
              setSuccess(false)
            }}
            placeholder={`[{"question":"...","answers":["...","...","...","..."],"correctAnswer":"..."}]`}
            rows={4}
            className="min-h-[5rem] resize-y border border-slate-200 bg-white font-mono text-xs leading-relaxed shadow-none"
          />
        </div>

        {error ? <p className="text-sm text-red-600">Error: {error}</p> : null}
        {success ? (
          <p className="text-sm text-green-700" role="status">
            Questions imported successfully.
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={loading || !pastedJson.trim()}
          className="h-10 w-full border border-violet-700 bg-violet-600 text-sm font-semibold text-white shadow-[4px_4px_0px_0px_var(--border-dark)] hover:bg-violet-500 disabled:opacity-50"
        >
          <FileJson className="mr-2 h-4 w-4" />
          {loading ? 'Importing…' : 'Validate & add questions'}
        </Button>
      </form>
    </div>
  )
}
