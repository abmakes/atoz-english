'use client'

import { use, useEffect, useState } from 'react'
import FaceStage from '@/components/thoughts/FaceStage'
import { useClipPlayer } from '@/components/thoughts/useClipPlayer'
import { classAudioUrl, fetchAudioBlob, fetchPublicClip } from '@/components/thoughts/api'
import type { ThoughtPublicClip } from '@/lib/thoughts/service'
import { formatDuration, VOICE_LABELS } from '@/lib/thoughts/voices'
import { Loader2 } from 'lucide-react'

export default function WatchThoughtPage({
  params,
}: {
  params: Promise<{ token: string; submissionId: string }>
}) {
  const { token, submissionId } = use(params)
  const player = useClipPlayer()
  const [clip, setClip] = useState<(ThoughtPublicClip & { title: string; prompt: string }) | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPublicClip(token, submissionId)
      .then(setClip)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'This recording is not available.')
      )
  }, [submissionId, token])

  if (error) return <p className="px-6 py-20 text-center text-slate-600">{error}</p>
  if (!clip) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 text-center">
      <p className="text-sm font-semibold text-violet-700">{clip.title}</p>
      <h1 className="grandstander mt-2 text-3xl font-bold text-[#114257]">{clip.prompt}</h1>
      <div className="mt-6">
        <FaceStage
          character={clip.character}
          getLevel={() => player.levelRef.current}
        />
      </div>
      <p className="mt-3 font-semibold">{clip.studentName}</p>
      <p className="text-sm text-slate-500">
        {formatDuration(player.playing ? player.elapsedMs : clip.durationMs)} · {VOICE_LABELS[clip.voiceEffect]}
      </p>
      <button
        type="button"
        className="mt-4 rounded-full bg-violet-600 px-6 py-3 font-semibold text-white"
        onClick={() => {
          if (player.playing) {
            player.stop()
            return
          }
          void fetchAudioBlob(classAudioUrl(token, submissionId)).then((blob) =>
            player.play({ blob, envelope: clip.envelope, effect: clip.voiceEffect })
          )
        }}
      >
        {player.playing ? 'Pause' : 'Play'}
      </button>
    </div>
  )
}
