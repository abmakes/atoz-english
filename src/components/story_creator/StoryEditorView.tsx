'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useCustomToast } from '@/components/ui/CustomToast'
import MouthOverlayEditor from '@/components/story_creator/MouthOverlayEditor'
import {
  fetchStory,
  generatePanelImageRequest,
  patchPanel,
  patchStory,
  rotateShareToken,
  type StoryDto,
  type StoryPanelDto,
} from '@/components/story_creator/api'
import { DEFAULT_MOUTH, type MouthPlacement } from '@/lib/stories/schemas'
import {
  Loader2,
  Printer,
  Link2,
  Users,
  RefreshCw,
  Wand2,
  Smile,
  ImageIcon,
} from 'lucide-react'

interface StoryEditorViewProps {
  storyId: string
}

export default function StoryEditorView({ storyId }: StoryEditorViewProps) {
  const { addToast } = useCustomToast()
  const [story, setStory] = useState<StoryDto | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyPanels, setBusyPanels] = useState<Record<number, boolean>>({})
  const [tweaks, setTweaks] = useState<Record<number, string>>({})
  const [mouthEditorOrder, setMouthEditorOrder] = useState<number | null>(null)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const mouthTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    fetchStory(storyId)
      .then(setStory)
      .catch((error: unknown) =>
        setLoadError(error instanceof Error ? error.message : 'Failed to load story')
      )
  }, [storyId])

  const setPanel = useCallback((panel: StoryPanelDto) => {
    setStory((current) =>
      current
        ? {
            ...current,
            panels: current.panels.map((candidate) =>
              candidate.order === panel.order ? panel : candidate
            ),
          }
        : current
    )
  }, [])

  const generatePanel = useCallback(
    async (order: number) => {
      setBusyPanels((current) => ({ ...current, [order]: true }))
      try {
        const panel = await generatePanelImageRequest(
          storyId,
          order,
          tweaks[order]?.trim() || undefined
        )
        setPanel(panel)
        setTweaks((current) => ({ ...current, [order]: '' }))
        // Status may flip to READY when the last panel gets art.
        const fresh = await fetchStory(storyId)
        setStory(fresh)
        return true
      } catch (error) {
        addToast(
          error instanceof Error ? error.message : `Picture ${order} failed.`,
          { variant: 'error', position: 'top-center' }
        )
        return false
      } finally {
        setBusyPanels((current) => ({ ...current, [order]: false }))
      }
    },
    [storyId, tweaks, setPanel, addToast]
  )

  const generateAll = useCallback(async () => {
    if (!story) return
    setIsGeneratingAll(true)
    // Sequential on purpose: panel 1 becomes the character reference for 2-4.
    for (const panel of [...story.panels].sort((a, b) => a.order - b.order)) {
      if (panel.imageUrl) continue
      const ok = await generatePanel(panel.order)
      if (!ok) break
    }
    setIsGeneratingAll(false)
  }, [story, generatePanel])

  const saveMouth = useCallback(
    (order: number, mouth: MouthPlacement) => {
      setStory((current) =>
        current
          ? {
              ...current,
              panels: current.panels.map((panel) =>
                panel.order === order ? { ...panel, mouth } : panel
              ),
            }
          : current
      )
      clearTimeout(mouthTimers.current[order])
      mouthTimers.current[order] = setTimeout(() => {
        patchPanel(storyId, order, { mouth }).catch(() => {
          addToast('Could not save the mouth position.', {
            variant: 'error',
            position: 'top-center',
          })
        })
      }, 600)
    },
    [storyId, addToast]
  )

  const saveSentence = useCallback(
    (order: number, exampleSentence: string) => {
      patchPanel(storyId, order, { exampleSentence }).catch(() => {
        addToast('Could not save the sentence.', {
          variant: 'error',
          position: 'top-center',
        })
      })
    },
    [storyId, addToast]
  )

  const copyStudentLink = useCallback(() => {
    if (!story) return
    const url = `${window.location.origin}/story/${story.shareToken}`
    void navigator.clipboard.writeText(url).then(() => {
      addToast('Student link copied! Share it with your class.', {
        variant: 'success',
        position: 'top-center',
      })
    })
  }, [story, addToast])

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-slate-600">
        {loadError}
      </div>
    )
  }
  if (!story) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
      </div>
    )
  }

  const allGenerated = story.panels.every((panel) => panel.imageUrl)
  const anyMissing = story.panels.some((panel) => !panel.imageUrl)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-2 text-sm">
        <Link href="/tools/story-creator" className="text-violet-600 hover:underline">
          ← All stories
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          defaultValue={story.title}
          onBlur={(event) => {
            const title = event.target.value.trim()
            if (title && title !== story.title) {
              void patchStory(storyId, { title }).then(setStory)
            }
          }}
          className="grandstander h-auto max-w-xl border-none bg-transparent p-0 text-3xl font-bold text-[#114257] focus-visible:ring-0"
        />
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            allGenerated
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {allGenerated ? 'Ready for students' : 'Pictures needed'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {anyMissing && (
          <Button
            onClick={() => void generateAll()}
            disabled={isGeneratingAll}
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            {isGeneratingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate all pictures
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href={`/tools/story-creator/${storyId}/print`}>
            <Printer className="mr-2 h-4 w-4" />
            Print worksheet
          </Link>
        </Button>
        <Button variant="outline" onClick={copyStudentLink} disabled={!allGenerated}>
          <Link2 className="mr-2 h-4 w-4" />
          Copy student link
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/tools/story-creator/${storyId}/submissions`}>
            <Users className="mr-2 h-4 w-4" />
            Submissions{story.submissionCount ? ` (${story.submissionCount})` : ''}
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {[...story.panels]
          .sort((a, b) => a.order - b.order)
          .map((panel) => {
            const busy = !!busyPanels[panel.order]
            const mouthOpen = mouthEditorOrder === panel.order
            return (
              <div
                key={panel.id}
                className="rounded-2xl border-2 border-violet-100 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="grandstander text-lg font-bold text-[#114257]">
                    Picture {panel.order}
                  </h3>
                  {panel.imageUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setMouthEditorOrder(mouthOpen ? null : panel.order)
                      }
                      className="text-violet-600"
                    >
                      <Smile className="mr-1 h-4 w-4" />
                      {mouthOpen ? 'Done' : 'Place mouth'}
                    </Button>
                  )}
                </div>

                {mouthOpen && panel.imageUrl ? (
                  <MouthOverlayEditor
                    imageUrl={panel.imageUrl}
                    mouth={panel.mouth ?? DEFAULT_MOUTH}
                    onChange={(mouth) => saveMouth(panel.order, mouth)}
                  />
                ) : (
                  <div
                    className="relative w-full overflow-hidden rounded-lg border bg-slate-100"
                    style={{ aspectRatio: '4 / 3' }}
                  >
                    {panel.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={panel.imageUrl}
                        alt={panel.sceneDescription}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <ImageIcon className="h-10 w-10" />
                        <p className="px-6 text-center text-xs">
                          {panel.sceneDescription}
                        </p>
                      </div>
                    )}
                    {busy && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                      </div>
                    )}
                  </div>
                )}

                <Textarea
                  defaultValue={panel.exampleSentence ?? ''}
                  onBlur={(event) => {
                    const value = event.target.value.trim()
                    if (value !== (panel.exampleSentence ?? '')) {
                      setPanel({ ...panel, exampleSentence: value })
                      saveSentence(panel.order, value)
                    }
                  }}
                  rows={2}
                  placeholder="Example sentence for this picture"
                  className="mt-3 text-sm"
                />

                <div className="mt-2 flex gap-2">
                  <Input
                    value={tweaks[panel.order] ?? ''}
                    onChange={(event) =>
                      setTweaks((current) => ({
                        ...current,
                        [panel.order]: event.target.value,
                      }))
                    }
                    placeholder={
                      panel.imageUrl
                        ? 'Optional change, e.g. "make the dog bigger"'
                        : 'Optional note for the picture'
                    }
                    maxLength={300}
                    className="h-9 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 whitespace-nowrap"
                    disabled={busy || isGeneratingAll}
                    onClick={() => void generatePanel(panel.order)}
                  >
                    <RefreshCw className={`mr-1 h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
                    {panel.imageUrl ? 'Regenerate' : 'Generate'}
                  </Button>
                </div>
              </div>
            )
          })}
      </div>

      <div className="mt-8 rounded-2xl border-2 border-violet-100 bg-white p-6">
        <h3 className="grandstander text-lg font-bold text-[#114257]">
          Example story
        </h3>
        <p className="mb-2 text-sm text-slate-500">
          Printed on the worksheet so students have a model to follow. Edit it freely.
        </p>
        <Textarea
          defaultValue={story.exampleStory ?? ''}
          rows={4}
          onBlur={(event) => {
            const value = event.target.value.trim()
            if (value !== (story.exampleStory ?? '')) {
              void patchStory(storyId, { exampleStory: value }).then(setStory)
            }
          }}
        />
        <div className="mt-3 flex items-center gap-3">
          <Switch
            checked={story.showExampleToStudents}
            onCheckedChange={(checked) => {
              void patchStory(storyId, { showExampleToStudents: checked }).then(
                setStory
              )
            }}
          />
          <span className="text-sm text-slate-600">
            Also show the example sentences on the student recording page
          </span>
        </div>
      </div>

      <div className="mt-6 text-sm text-slate-500">
        <button
          type="button"
          className="underline hover:text-slate-700"
          onClick={() => {
            void rotateShareToken(storyId).then((shareToken) => {
              setStory((current) => (current ? { ...current, shareToken } : current))
              addToast('New student link created. Old links no longer work.', {
                variant: 'success',
                position: 'top-center',
              })
            })
          }}
        >
          Reset student link
        </button>
        <span className="ml-2">
          (use this if a link was shared with the wrong people)
        </span>
      </div>
    </div>
  )
}
