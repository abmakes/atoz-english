import type { StoryDto, StoryPanelDto } from '@/lib/stories/service'
import type { MouthPlacement, StoryBrief } from '@/lib/stories/schemas'

export type { StoryDto, StoryPanelDto }

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

export async function fetchStories(): Promise<StoryDto[]> {
  return unwrap(await fetch('/api/stories'))
}

export async function createStory(brief: StoryBrief): Promise<StoryDto> {
  return unwrap(
    await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brief),
    })
  )
}

export async function fetchStory(id: string): Promise<StoryDto> {
  return unwrap(await fetch(`/api/stories/${id}`))
}

export async function patchStory(
  id: string,
  patch: Partial<{
    title: string
    exampleStory: string
    showExampleToStudents: boolean
    status: 'DRAFT' | 'READY' | 'ARCHIVED'
  }>
): Promise<StoryDto> {
  return unwrap(
    await fetch(`/api/stories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  )
}

export async function deleteStory(id: string): Promise<void> {
  await unwrap(await fetch(`/api/stories/${id}`, { method: 'DELETE' }))
}

export async function generatePanelImageRequest(
  id: string,
  order: number,
  tweak?: string
): Promise<StoryPanelDto> {
  return unwrap(
    await fetch(`/api/stories/${id}/panels/${order}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tweak ? { tweak } : {}),
    })
  )
}

export async function patchPanel(
  id: string,
  order: number,
  patch: Partial<{
    exampleSentence: string
    sceneDescription: string
    mouth: MouthPlacement
  }>
): Promise<StoryPanelDto> {
  return unwrap(
    await fetch(`/api/stories/${id}/panels/${order}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  )
}

export async function rotateShareToken(id: string): Promise<string> {
  const result = await unwrap<{ shareToken: string }>(
    await fetch(`/api/stories/${id}/share`, { method: 'POST' })
  )
  return result.shareToken
}

export interface SubmissionRecordingDto {
  panelOrder: number
  audioUrl: string
  mimeType: string
  durationMs: number
  envelope: number[]
}

export interface SubmissionDto {
  id: string
  studentName: string
  status: 'SUBMITTED' | 'REVIEWED'
  createdAt: string
  recordings: SubmissionRecordingDto[]
}

export async function fetchSubmissions(id: string): Promise<SubmissionDto[]> {
  return unwrap(await fetch(`/api/stories/${id}/submissions`))
}

export async function patchSubmission(
  id: string,
  submissionId: string,
  status: 'SUBMITTED' | 'REVIEWED'
): Promise<void> {
  await unwrap(
    await fetch(`/api/stories/${id}/submissions/${submissionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  )
}

export async function deleteSubmission(
  id: string,
  submissionId: string
): Promise<void> {
  await unwrap(
    await fetch(`/api/stories/${id}/submissions/${submissionId}`, {
      method: 'DELETE',
    })
  )
}

export interface StorySessionPanelDto {
  order: number
  imageUrl: string | null
  mouth: MouthPlacement | null
  exampleSentence: string | null
}

export interface StorySessionDto {
  title: string
  showExample: boolean
  exampleStory: string | null
  panels: StorySessionPanelDto[]
}

export async function fetchStorySession(token: string): Promise<StorySessionDto> {
  return unwrap(await fetch(`/api/story-session/${token}`))
}

export interface WatchDataDto {
  title: string
  studentName: string
  panels: Array<{
    order: number
    imageUrl: string | null
    mouth: MouthPlacement | null
  }>
  recordings: SubmissionRecordingDto[]
}

export async function fetchWatchData(
  token: string,
  submissionId: string
): Promise<WatchDataDto> {
  return unwrap(
    await fetch(`/api/story-session/${token}/submissions/${submissionId}`)
  )
}
