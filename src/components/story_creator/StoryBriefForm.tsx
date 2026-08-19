'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCustomToast } from '@/components/ui/CustomToast'
import LessonPageCapture from '@/components/management_ui/LessonPageCapture'
import { CEFR_LEVELS, GRAMMAR_TAGS, type CefrLevelId } from '@/lib/taxonomy/quiz-taxonomy'
import { STORY_TYPES, type StoryType } from '@/lib/stories/schemas'
import { createStory, type StoryDto } from '@/components/story_creator/api'
import { Loader2, Sparkles } from 'lucide-react'

interface StoryBriefFormProps {
  onCreated: (story: StoryDto) => void
}

export default function StoryBriefForm({ onCreated }: StoryBriefFormProps) {
  const { addToast } = useCustomToast()
  const [topicPrompt, setTopicPrompt] = useState('')
  const [level, setLevel] = useState<CefrLevelId>('A1')
  const [storyType, setStoryType] = useState<StoryType>('Everyday mishap')
  const [grammarFocus, setGrammarFocus] = useState<string[]>(['Past Simple'])
  const [characters, setCharacters] = useState('')
  const [lessonSummary, setLessonSummary] = useState<string | undefined>()
  const [keyVocabulary, setKeyVocabulary] = useState<string[] | undefined>()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const toggleGrammar = (tag: string) => {
    setGrammarFocus((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : current.length < 4
          ? [...current, tag]
          : current
    )
  }

  const analyzeLessonImage = async (file: File) => {
    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const response = await fetch('/api/ai/analyze-lesson-image', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Analysis failed')
      }
      const analysis = payload.analysis
      setLessonSummary(analysis.lessonSummary)
      setKeyVocabulary(analysis.keyVocabulary)
      if (analysis.suggestedLevel) setLevel(analysis.suggestedLevel)
      if (Array.isArray(analysis.grammarFocus) && analysis.grammarFocus.length > 0) {
        setGrammarFocus(
          analysis.grammarFocus
            .filter((tag: string) => (GRAMMAR_TAGS as readonly string[]).includes(tag))
            .slice(0, 4)
        )
      }
      if (!topicPrompt.trim() && analysis.topics?.length > 0) {
        setTopicPrompt(
          `A story about ${analysis.topics.join(' and ').toLowerCase()}`
        )
      }
      addToast('Lesson analyzed — brief filled in below.', {
        variant: 'success',
        position: 'top-center',
      })
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Could not analyze the image.',
        { variant: 'error', position: 'top-center' }
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const submit = async () => {
    if (topicPrompt.trim().length < 3) {
      addToast('Describe the story idea first.', {
        variant: 'warning',
        position: 'top-center',
      })
      return
    }
    setIsGenerating(true)
    try {
      const story = await createStory({
        topicPrompt: topicPrompt.trim(),
        level,
        storyType,
        grammarFocus,
        characters: characters.trim(),
        lessonSummary,
        keyVocabulary,
      })
      onCreated(story)
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Story generation failed.',
        { variant: 'error', position: 'top-center' }
      )
      setIsGenerating(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-5 rounded-2xl border-2 border-violet-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block font-semibold text-[#114257]">
            Story idea
          </label>
          <Textarea
            value={topicPrompt}
            onChange={(event) => setTopicPrompt(event.target.value)}
            placeholder="e.g. A boy loses his kite in a tree and his dog helps him get it back"
            rows={3}
            maxLength={800}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold text-[#114257]">Level</label>
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value as CefrLevelId)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {CEFR_LEVELS.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label} — {candidate.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-semibold text-[#114257]">
              Story type
            </label>
            <select
              value={storyType}
              onChange={(event) => setStoryType(event.target.value as StoryType)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {STORY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block font-semibold text-[#114257]">
            Grammar to practise <span className="text-sm font-normal text-slate-500">(up to 4 — the example story models these)</span>
          </label>
          <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-lg border bg-slate-50 p-2">
            {GRAMMAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleGrammar(tag)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  grammarFocus.includes(tag)
                    ? 'border-violet-500 bg-violet-100 text-violet-800'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-violet-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block font-semibold text-[#114257]">
            Main character <span className="text-sm font-normal text-slate-500">(optional)</span>
          </label>
          <Input
            value={characters}
            onChange={(event) => setCharacters(event.target.value)}
            placeholder="e.g. a girl called Mia and her orange cat"
            maxLength={300}
          />
        </div>

        {lessonSummary && (
          <p className="rounded-lg bg-violet-50 p-3 text-sm text-violet-900">
            <span className="font-semibold">From your lesson page:</span>{' '}
            {lessonSummary}
          </p>
        )}

        <Button
          onClick={() => void submit()}
          disabled={isGenerating}
          className="grandstander h-12 w-full bg-violet-600 text-lg text-white hover:bg-violet-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Writing your story…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate story
            </>
          )}
        </Button>
        <p className="text-center text-xs text-slate-500">
          Next step: the four pictures are generated one by one, and you can
          regenerate any picture you don&apos;t like.
        </p>
      </div>

      <div className="min-h-[16rem]">
        <LessonPageCapture
          onAnalyze={analyzeLessonImage}
          isAnalyzing={isAnalyzing}
          disabled={isGenerating}
        />
        <p className="mt-2 text-xs text-slate-500">
          Optional: paste a page from your book and the level, grammar, and
          vocabulary are filled in automatically.
        </p>
      </div>
    </div>
  )
}
