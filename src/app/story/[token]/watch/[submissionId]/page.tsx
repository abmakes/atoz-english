'use client'

import { use, useEffect, useState } from 'react'
import MoviePlayer from '@/components/story_creator/MoviePlayer'
import {
  fetchWatchData,
  type WatchDataDto,
} from '@/components/story_creator/api'
import { Loader2 } from 'lucide-react'

export default function WatchMoviePage({
  params,
}: {
  params: Promise<{ token: string; submissionId: string }>
}) {
  const { token, submissionId } = use(params)
  const [data, setData] = useState<WatchDataDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWatchData(token, submissionId)
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Movie not found.')
      )
  }, [token, submissionId])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-950 px-4 py-8">
      {error ? (
        <p className="text-lg text-slate-300">{error}</p>
      ) : data ? (
        <div className="w-full max-w-4xl">
          <MoviePlayer
            title={data.title}
            byline={`A film by ${data.studentName}`}
            panels={data.panels.map((panel) => ({
              imageUrl: panel.imageUrl ?? '',
              mouth: panel.mouth,
            }))}
            clips={data.recordings.map((recording) => ({
              audioUrl: recording.audioUrl,
              durationMs: recording.durationMs,
              envelope: recording.envelope,
            }))}
          />
          <p className="grandstander mt-4 text-center text-xl text-white">
            {data.title}
          </p>
          <p className="text-center text-sm text-slate-400">
            A film by {data.studentName} · Made with PlaytoZ Story Creator
          </p>
        </div>
      ) : (
        <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
      )}
    </div>
  )
}
