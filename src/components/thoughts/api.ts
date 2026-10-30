import type {
  ThoughtChallengeDto,
  ThoughtPublicClip,
  ThoughtSessionDto,
  ThoughtSubmissionDto,
} from '@/lib/thoughts/service'
import type { SubmissionMeta } from '@/lib/thoughts/schemas'
import type { SubmissionStatus } from '@/lib/thoughts/access'

async function unwrap<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      typeof payload?.error === 'string'
        ? payload.error
        : `Request failed (${response.status})`
    )
  }
  return (payload.data ?? payload) as T
}

export type ThoughtChallengeDetail = ThoughtChallengeDto & {
  submissions: ThoughtSubmissionDto[]
}

export async function fetchThoughts(): Promise<ThoughtChallengeDto[]> {
  return unwrap(await fetch('/api/thoughts'))
}

export async function createThought(input: {
  title: string
  prompt: string
}): Promise<ThoughtChallengeDto> {
  return unwrap(
    await fetch('/api/thoughts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  )
}

export async function fetchThought(id: string): Promise<ThoughtChallengeDetail> {
  return unwrap(await fetch(`/api/thoughts/${id}`))
}

export async function patchThought(
  id: string,
  patch: Partial<{
    title: string
    prompt: string
    status: ThoughtChallengeDto['status']
    acceptingResponses: boolean
    showGallery: boolean
    allowFunnyVoices: boolean
  }>
): Promise<ThoughtChallengeDetail> {
  return unwrap(
    await fetch(`/api/thoughts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  )
}

export async function deleteThought(id: string): Promise<void> {
  await unwrap(await fetch(`/api/thoughts/${id}`, { method: 'DELETE' }))
}

export async function rotateThoughtLink(id: string): Promise<{ shareToken: string }> {
  return unwrap(await fetch(`/api/thoughts/${id}/share`, { method: 'POST' }))
}

export async function reviewSubmission(
  challengeId: string,
  submissionId: string,
  status: SubmissionStatus
): Promise<ThoughtChallengeDetail> {
  return unwrap(
    await fetch(`/api/thoughts/${challengeId}/submissions/${submissionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  )
}

export async function deleteSubmission(
  challengeId: string,
  submissionId: string
): Promise<ThoughtChallengeDetail> {
  return unwrap(
    await fetch(`/api/thoughts/${challengeId}/submissions/${submissionId}`, {
      method: 'DELETE',
    })
  )
}

export function teacherAudioUrl(challengeId: string, submissionId: string): string {
  return `/api/thoughts/${challengeId}/submissions/${submissionId}/audio`
}

export async function fetchThoughtSession(token: string): Promise<ThoughtSessionDto> {
  return unwrap(await fetch(`/api/thought-session/${token}`))
}

export async function fetchPublicClip(
  token: string,
  submissionId: string
): Promise<ThoughtPublicClip & { title: string; prompt: string }> {
  return unwrap(
    await fetch(`/api/thought-session/${token}/submissions/${submissionId}`)
  )
}

export function classAudioUrl(token: string, submissionId: string): string {
  return `/api/thought-session/${token}/submissions/${submissionId}/audio`
}

export async function fetchAudioBlob(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('This recording is not available.')
  return response.blob()
}

export async function submitThought(
  token: string,
  studentName: string,
  meta: SubmissionMeta,
  audio: Blob
): Promise<{ submissionId: string; duplicate: boolean }> {
  const form = new FormData()
  form.set('studentName', studentName)
  form.set('meta', JSON.stringify(meta))
  form.set('audio', new File([audio], 'recording.webm', { type: audio.type || 'audio/webm' }))
  return unwrap(
    await fetch(`/api/thought-session/${token}/submit`, {
      method: 'POST',
      body: form,
    })
  )
}
