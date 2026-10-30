import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    thoughtChallenge: { findUnique: vi.fn() },
    thoughtSubmission: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('@/lib/thoughts/audio-store', () => ({
  savePrivateAudio: vi.fn(async () => 'private://audio'),
  removePrivateAudio: vi.fn(async () => undefined),
  openPrivateAudio: vi.fn(async () => ({
    stream: new ReadableStream(),
    contentType: 'audio/webm',
  })),
}))

import { prisma } from '@/lib/prisma'
import { savePrivateAudio } from '@/lib/thoughts/audio-store'
import { assembleRandomFace } from '@/lib/thoughts/character'
import { GET as getClassAudio } from '@/app/api/thought-session/[token]/submissions/[submissionId]/audio/route'
import { POST as submit } from '@/app/api/thought-session/[token]/submit/route'

const challenge = {
  id: 'challenge-1',
  status: 'READY' as const,
  acceptingResponses: true,
  showGallery: true,
  allowFunnyVoices: true,
}

function audioGet(token = 'tok', submissionId = 'sub-1') {
  return getClassAudio(new NextRequest('http://localhost/audio'), {
    params: Promise.resolve({ token, submissionId }),
  })
}

describe('class audio access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not stream a pending recording', async () => {
    vi.mocked(prisma.thoughtChallenge.findUnique).mockResolvedValue(challenge as never)
    vi.mocked(prisma.thoughtSubmission.findFirst).mockResolvedValue({
      id: 'sub-1',
      status: 'SUBMITTED',
      audioPath: 'private://audio',
      mimeType: 'audio/webm',
    } as never)
    const response = await audioGet()
    expect(response.status).toBe(404)
  })

  it('does not stream an approved recording when the gallery is off', async () => {
    vi.mocked(prisma.thoughtChallenge.findUnique).mockResolvedValue({
      ...challenge,
      showGallery: false,
    } as never)
    vi.mocked(prisma.thoughtSubmission.findFirst).mockResolvedValue({
      id: 'sub-1',
      status: 'APPROVED',
      audioPath: 'private://audio',
      mimeType: 'audio/webm',
    } as never)
    const response = await audioGet()
    expect(response.status).toBe(404)
  })

  it('streams an approved recording for the current class link', async () => {
    vi.mocked(prisma.thoughtChallenge.findUnique).mockResolvedValue(challenge as never)
    vi.mocked(prisma.thoughtSubmission.findFirst).mockResolvedValue({
      id: 'sub-1',
      status: 'APPROVED',
      audioPath: 'private://audio',
      mimeType: 'audio/webm',
    } as never)
    const response = await audioGet()
    expect(response.status).toBe(200)
  })

  it('hides audio after the link is rotated', async () => {
    vi.mocked(prisma.thoughtChallenge.findUnique).mockResolvedValue(null as never)
    const response = await audioGet('old-token')
    expect(response.status).toBe(404)
  })
})

describe('thought submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects a second copy of the same send without storing another file', async () => {
    vi.mocked(prisma.thoughtChallenge.findUnique).mockResolvedValue(challenge as never)
    vi.mocked(prisma.thoughtSubmission.findUnique).mockResolvedValue({ id: 'already' } as never)
    let n = 0
    const face = assembleRandomFace(() => 0.1, () => `instance-${String(++n).padStart(8, '0')}`)
    const form = new FormData()
    form.set('studentName', 'Sam')
    form.set(
      'meta',
      JSON.stringify({
        clientKey: '11111111-1111-4111-8111-111111111111',
        durationMs: 1000,
        envelope: [0.2, 0.8],
        character: face,
        voiceEffect: 'original',
      })
    )
    form.set('audio', new File([new Uint8Array([1, 2, 3])], 'clip.webm', { type: 'audio/webm' }))
    const response = await submit(
      new NextRequest('http://localhost/submit', { method: 'POST', body: form }),
      { params: Promise.resolve({ token: 'tok' }) }
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.data).toEqual({ submissionId: 'already', duplicate: true })
    expect(savePrivateAudio).not.toHaveBeenCalled()
  })

  it('rejects submissions when recording is closed', async () => {
    vi.mocked(prisma.thoughtChallenge.findUnique).mockResolvedValue({
      ...challenge,
      acceptingResponses: false,
    } as never)
    const response = await submit(
      new NextRequest('http://localhost/submit', { method: 'POST', body: new FormData() }),
      { params: Promise.resolve({ token: 'tok' }) }
    )
    expect(response.status).toBe(403)
  })
})
