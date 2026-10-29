'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { useCustomToast } from '@/components/ui/CustomToast'
import MoviePlayer from '@/components/story_creator/MoviePlayer'
import {
  deleteSubmission,
  fetchStory,
  fetchSubmissions,
  patchSubmission,
  type StoryDto,
  type SubmissionDto,
} from '@/components/story_creator/api'
import { Loader2, Trash2, Check, Link2, Film } from 'lucide-react'

export default function StorySubmissionsPage({
  params,
}: {
  params: Promise<{ storyId: string }>
}) {
  const { storyId } = use(params)
  const { addToast } = useCustomToast()
  const [story, setStory] = useState<StoryDto | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionDto[] | null>(null)
  const [watchingId, setWatchingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchStory(storyId), fetchSubmissions(storyId)])
      .then(([storyData, submissionData]) => {
        setStory(storyData)
        setSubmissions(submissionData)
      })
      .catch(() => setSubmissions([]))
  }, [storyId])

  const markReviewed = async (submission: SubmissionDto) => {
    const nextStatus = submission.status === 'REVIEWED' ? 'SUBMITTED' : 'REVIEWED'
    await patchSubmission(storyId, submission.id, nextStatus).catch(() => {})
    setSubmissions(
      (current) =>
        current?.map((candidate) =>
          candidate.id === submission.id
            ? { ...candidate, status: nextStatus }
            : candidate
        ) ?? null
    )
  }

  const remove = async (submission: SubmissionDto) => {
    if (!window.confirm(`Delete ${submission.studentName}'s recordings?`)) return
    await deleteSubmission(storyId, submission.id).catch(() => {})
    setSubmissions(
      (current) =>
        current?.filter((candidate) => candidate.id !== submission.id) ?? null
    )
  }

  const copyWatchLink = (submission: SubmissionDto) => {
    if (!story) return
    const url = `${window.location.origin}/story/${story.shareToken}/watch/${submission.id}`
    void navigator.clipboard.writeText(url).then(() => {
      addToast('Watch link copied — share it with parents!', {
        variant: 'success',
        position: 'top-center',
      })
    })
  }

  const watching = submissions?.find((candidate) => candidate.id === watchingId)

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-2 text-sm">
          <Link
            href={`/tools/story-creator/${storyId}`}
            className="text-violet-600 hover:underline"
          >
            ← Back to story
          </Link>
        </div>
        <h1 className="grandstander text-3xl font-bold text-[#114257]">
          {story ? `${story.title} — student movies` : 'Student movies'}
        </h1>

        {watching && story && (
          <div className="mt-6">
            <MoviePlayer
              title={story.title}
              byline={`A film by ${watching.studentName}`}
              panels={story.panels.map((panel) => ({
                imageUrl: panel.imageUrl ?? '',
                mouth: panel.mouth,
              }))}
              clips={watching.recordings.map((recording) => ({
                audioUrl: recording.audioUrl,
                durationMs: recording.durationMs,
                envelope: recording.envelope,
              }))}
            />
          </div>
        )}

        {submissions === null ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-violet-200 p-10 text-center text-slate-500">
            No student movies yet. Share the student link from the story editor —
            recordings appear here as soon as they are sent.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border-2 p-4 ${
                  submission.status === 'REVIEWED'
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-violet-100 bg-white'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="grandstander truncate text-lg font-bold text-[#114257]">
                    {submission.studentName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(submission.createdAt).toLocaleString()} ·{' '}
                    {submission.recordings.length} recordings
                    {submission.status === 'REVIEWED' ? ' · reviewed' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      setWatchingId(
                        watchingId === submission.id ? null : submission.id
                      )
                    }
                    className="bg-violet-600 text-white hover:bg-violet-700"
                  >
                    <Film className="mr-1 h-4 w-4" />
                    {watchingId === submission.id ? 'Close' : 'Watch'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyWatchLink(submission)}
                  >
                    <Link2 className="mr-1 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void markReviewed(submission)}
                    className={
                      submission.status === 'REVIEWED' ? 'text-green-600' : ''
                    }
                  >
                    <Check className="mr-1 h-4 w-4" />
                    {submission.status === 'REVIEWED' ? 'Reviewed' : 'Mark reviewed'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void remove(submission)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
