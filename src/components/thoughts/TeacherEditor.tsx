'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import FaceStage from '@/components/thoughts/FaceStage'
import { useClipPlayer } from '@/components/thoughts/useClipPlayer'
import {
  deleteSubmission,
  deleteThought,
  fetchAudioBlob,
  fetchThought,
  patchThought,
  reviewSubmission,
  rotateThoughtLink,
  teacherAudioUrl,
  type ThoughtChallengeDetail,
} from '@/components/thoughts/api'
import { THOUGHT_PROMPTS } from '@/lib/thoughts/prompts'
import type { SubmissionStatus } from '@/lib/thoughts/access'
import { formatDuration, VOICE_LABELS } from '@/lib/thoughts/voices'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function TeacherEditor({ challengeId }: { challengeId: string }) {
  const router = useRouter()
  const player = useClipPlayer()
  const [challenge, setChallenge] = useState<ThoughtChallengeDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)

  useEffect(() => {
    fetchThought(challengeId)
      .then(setChallenge)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load this activity.'))
  }, [challengeId])

  if (error) return <p className="p-10 text-rose-600">{error}</p>
  if (!challenge) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
      </div>
    )
  }

  const link =
    typeof window === 'undefined' ? '' : `${window.location.origin}/thoughts/${challenge.shareToken}`

  const save = async (patch: Parameters<typeof patchThought>[1]) => {
    setSaving(true)
    try {
      setChallenge(await patchThought(challenge.id, patch))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const play = async (submissionId: string, envelope: number[], effect: ThoughtChallengeDetail['submissions'][number]['voiceEffect']) => {
    if (player.playing && playingId === submissionId) {
      player.stop()
      setPlayingId(null)
      return
    }
    const blob = await fetchAudioBlob(teacherAudioUrl(challenge.id, submissionId))
    setPlayingId(submissionId)
    await player.play({ blob, envelope, effect })
  }

  const review = async (submissionId: string, status: SubmissionStatus, playNext: boolean) => {
    const next = await reviewSubmission(challenge.id, submissionId, status)
    setChallenge(next)
    if (!playNext) return
    const index = next.submissions.findIndex((item) => item.id === submissionId)
    const following = next.submissions[index + 1]
    if (following) {
      await play(following.id, following.envelope, following.voiceEffect)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/tools/thoughts" className="text-sm text-violet-700 hover:underline">
        All Thoughts activities
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[320px_1fr]">
        <section className="space-y-4 rounded-3xl border border-violet-100 bg-white p-5">
          <h1 className="grandstander text-3xl font-bold text-[#114257]">Teacher settings</h1>
          <label className="block text-sm font-semibold">
            Prompt name
            <input
              value={challenge.title}
              onChange={(event) => setChallenge({ ...challenge, title: event.target.value })}
              className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"
            />
          </label>
          <label className="block text-sm font-semibold">
            What students say
            <textarea
              value={challenge.prompt}
              onChange={(event) => setChallenge({ ...challenge, prompt: event.target.value })}
              rows={4}
              className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {THOUGHT_PROMPTS.map((template) => (
              <button
                key={template.title}
                type="button"
                className="rounded-full border px-3 py-1 text-xs"
                onClick={() =>
                  setChallenge({ ...challenge, title: template.title, prompt: template.prompt })
                }
              >
                {template.title}
              </button>
            ))}
          </div>
          <label className="block text-sm font-semibold">
            Status
            <select
              value={challenge.status}
              onChange={(event) =>
                setChallenge({
                  ...challenge,
                  status: event.target.value as ThoughtChallengeDetail['status'],
                })
              }
              className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"
            >
              <option value="DRAFT">Draft — class link off</option>
              <option value="READY">Ready — class link on</option>
              <option value="ARCHIVED">Archived — class link off</option>
            </select>
          </label>
          <Toggle
            label="Accepting responses"
            checked={challenge.acceptingResponses}
            onCheckedChange={(acceptingResponses) => setChallenge({ ...challenge, acceptingResponses })}
          />
          <Toggle
            label="Show approved clips to the class"
            checked={challenge.showGallery}
            onCheckedChange={(showGallery) => setChallenge({ ...challenge, showGallery })}
          />
          <Toggle
            label="Allow funny voices"
            detail="Students can choose Original or a fun effect."
            checked={challenge.allowFunnyVoices}
            onCheckedChange={(allowFunnyVoices) => setChallenge({ ...challenge, allowFunnyVoices })}
          />
          <Button
            type="button"
            disabled={saving}
            onClick={() => {
              void save({
                title: challenge.title,
                prompt: challenge.prompt,
                status: challenge.status,
                acceptingResponses: challenge.acceptingResponses,
                showGallery: challenge.showGallery,
                allowFunnyVoices: challenge.allowFunnyVoices,
              })
            }}
            className="w-full bg-violet-600 text-white hover:bg-violet-700"
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {challenge.status === 'READY' ? (
            <div className="space-y-2 text-sm">
              <p className="break-all rounded-xl bg-violet-50 p-2">{link}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(link)
                  }}
                >
                  Copy link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void rotateThoughtLink(challenge.id).then((result) =>
                      setChallenge({ ...challenge, shareToken: result.shareToken })
                    )
                  }}
                >
                  New link
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Set the activity to Ready before sharing the class link.</p>
          )}
          <button
            type="button"
            className="text-sm text-rose-600"
            onClick={() => {
              if (!window.confirm('Delete this activity and every recording?')) return
              void deleteThought(challenge.id).then(() => router.push('/tools/thoughts'))
            }}
          >
            Delete activity
          </button>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </section>

        <section>
          <h2 className="grandstander text-2xl font-bold text-[#114257]">Review</h2>
          <p className="mt-1 text-sm text-slate-500">Newest first. Approve and play next walks down the list.</p>
          <div className="mt-4 space-y-4">
            {challenge.submissions.length === 0 ? (
              <p className="rounded-2xl border border-dashed p-8 text-center text-slate-500">No recordings yet.</p>
            ) : (
              challenge.submissions.map((submission) => (
                <article key={submission.id} className="grid gap-3 rounded-3xl border bg-white p-3 sm:grid-cols-[180px_1fr]">
                  <FaceStage
                    character={submission.character}
                    animate={playingId === submission.id}
                    getLevel={() => (playingId === submission.id ? player.levelRef.current : 0)}
                  />
                  <div>
                    <p className="font-semibold">{submission.studentName}</p>
                    <p className="text-sm text-slate-500">
                      {formatDuration(submission.durationMs)} · {VOICE_LABELS[submission.voiceEffect]} ·{' '}
                      {submission.status.toLowerCase()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => void play(submission.id, submission.envelope, submission.voiceEffect)}>
                        {player.playing && playingId === submission.id ? 'Pause' : 'Play'}
                      </Button>
                      <Button type="button" className="bg-violet-600 text-white" onClick={() => void review(submission.id, 'APPROVED', false)}>
                        Approve
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void review(submission.id, 'APPROVED', true)}>
                        Approve and play next
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void review(submission.id, 'HIDDEN', false)}>
                        Hide
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (!window.confirm('Delete this recording?')) return
                          void deleteSubmission(challenge.id, submission.id).then(setChallenge)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                    {challenge.status === 'READY' && challenge.showGallery && submission.status === 'APPROVED' ? (
                      <p className="mt-2 break-all text-xs text-slate-500">
                        {typeof window === 'undefined'
                          ? ''
                          : `${window.location.origin}/thoughts/${challenge.shareToken}/watch/${submission.id}`}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Toggle({
  label,
  detail,
  checked,
  onCheckedChange,
}: {
  label: string
  detail?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {detail ? <p className="text-xs text-slate-500">{detail}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  )
}
