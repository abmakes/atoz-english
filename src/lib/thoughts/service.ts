import { prisma } from '@/lib/prisma'
import { createShareToken } from '@/lib/stories/tokens'
import { classCanWatch, type ChallengeStatus, type SubmissionStatus } from '@/lib/thoughts/access'
import type { Character } from '@/lib/thoughts/character'
import { removePrivateAudio } from '@/lib/thoughts/audio-store'
import { characterSchema, envelopeSchema, voiceEffectSchema } from '@/lib/thoughts/schemas'
import type { VoiceEffect } from '@/lib/thoughts/voices'

export interface ThoughtChallengeDto {
  id: string
  title: string
  prompt: string
  status: ChallengeStatus
  acceptingResponses: boolean
  showGallery: boolean
  allowFunnyVoices: boolean
  shareToken: string
  createdAt: string
  submissionCount: number
  pendingCount: number
}

export interface ThoughtSubmissionDto {
  id: string
  studentName: string
  character: Character
  voiceEffect: VoiceEffect
  durationMs: number
  envelope: number[]
  status: SubmissionStatus
  createdAt: string
}

export interface ThoughtPublicClip {
  id: string
  studentName: string
  character: Character
  voiceEffect: VoiceEffect
  durationMs: number
  envelope: number[]
  createdAt: string
}

export interface ThoughtSessionDto {
  title: string
  prompt: string
  acceptingResponses: boolean
  showGallery: boolean
  allowFunnyVoices: boolean
  gallery: ThoughtPublicClip[]
}

type ChallengeRow = {
  id: string
  title: string
  prompt: string
  status: ChallengeStatus
  acceptingResponses: boolean
  showGallery: boolean
  allowFunnyVoices: boolean
  shareToken: string
  createdAt: Date
  _count?: { submissions: number }
}

function toChallengeDto(
  challenge: ChallengeRow,
  submissionCount: number,
  pendingCount: number
): ThoughtChallengeDto {
  return {
    id: challenge.id,
    title: challenge.title,
    prompt: challenge.prompt,
    status: challenge.status,
    acceptingResponses: challenge.acceptingResponses,
    showGallery: challenge.showGallery,
    allowFunnyVoices: challenge.allowFunnyVoices,
    shareToken: challenge.shareToken,
    createdAt: challenge.createdAt.toISOString(),
    submissionCount,
    pendingCount,
  }
}

function toSubmissionDto(row: {
  id: string
  studentName: string
  character: unknown
  voiceEffect: string
  durationMs: number
  envelope: unknown
  status: SubmissionStatus
  createdAt: Date
}): ThoughtSubmissionDto | null {
  const character = characterSchema.safeParse(row.character)
  const voice = voiceEffectSchema.safeParse(row.voiceEffect)
  const envelope = envelopeSchema.safeParse(row.envelope)
  if (!character.success || !voice.success || !envelope.success) return null
  return {
    id: row.id,
    studentName: row.studentName,
    character: character.data,
    voiceEffect: voice.data,
    durationMs: row.durationMs,
    envelope: envelope.data,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }
}

function toPublicClip(dto: ThoughtSubmissionDto): ThoughtPublicClip {
  return {
    id: dto.id,
    studentName: dto.studentName,
    character: dto.character,
    voiceEffect: dto.voiceEffect,
    durationMs: dto.durationMs,
    envelope: dto.envelope,
    createdAt: dto.createdAt,
  }
}

export async function listChallenges(authorId: string): Promise<ThoughtChallengeDto[]> {
  const challenges = await prisma.thoughtChallenge.findMany({
    where: { authorId, status: { not: 'ARCHIVED' } },
    include: {
      _count: { select: { submissions: true } },
      submissions: { where: { status: 'SUBMITTED' }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return challenges.map((challenge) =>
    toChallengeDto(challenge, challenge._count.submissions, challenge.submissions.length)
  )
}

export async function createChallenge(
  authorId: string,
  title: string,
  prompt: string
): Promise<ThoughtChallengeDto> {
  const challenge = await prisma.thoughtChallenge.create({
    data: {
      authorId,
      title,
      prompt,
      shareToken: createShareToken(),
    },
  })
  return toChallengeDto(challenge, 0, 0)
}

export async function getOwnedChallenge(id: string, authorId: string) {
  return prisma.thoughtChallenge.findFirst({
    where: { id, authorId },
  })
}

export async function getChallengeDetail(id: string, authorId: string): Promise<
  (ThoughtChallengeDto & { submissions: ThoughtSubmissionDto[] }) | null
> {
  const challenge = await prisma.thoughtChallenge.findFirst({
    where: { id, authorId },
    include: {
      submissions: { orderBy: { createdAt: 'desc' } },
      _count: { select: { submissions: true } },
    },
  })
  if (!challenge) return null
  const submissions = challenge.submissions
    .map((row) => toSubmissionDto(row))
    .filter((row): row is ThoughtSubmissionDto => row !== null)
  const pendingCount = challenge.submissions.filter((row) => row.status === 'SUBMITTED').length
  return {
    ...toChallengeDto(challenge, challenge._count.submissions, pendingCount),
    submissions,
  }
}

export async function deleteChallengeAudio(challengeId: string): Promise<void> {
  const rows = await prisma.thoughtSubmission.findMany({
    where: { challengeId },
    select: { audioPath: true },
  })
  await Promise.all(rows.map((row) => removePrivateAudio(row.audioPath).catch(() => undefined)))
}

export async function getSessionByToken(token: string): Promise<ThoughtSessionDto | null> {
  const challenge = await prisma.thoughtChallenge.findUnique({
    where: { shareToken: token },
    include: {
      submissions: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!challenge || challenge.status !== 'READY') return null
  const gallery = challenge.showGallery
    ? challenge.submissions
        .map((row) => toSubmissionDto(row))
        .filter((row): row is ThoughtSubmissionDto => row !== null)
        .filter((row) =>
          classCanWatch({
            challengeStatus: challenge.status,
            showGallery: challenge.showGallery,
            submissionStatus: row.status,
          })
        )
        .map(toPublicClip)
    : []
  return {
    title: challenge.title,
    prompt: challenge.prompt,
    acceptingResponses: challenge.acceptingResponses,
    showGallery: challenge.showGallery,
    allowFunnyVoices: challenge.allowFunnyVoices,
    gallery,
  }
}

export async function findClassClip(token: string, submissionId: string): Promise<
  (ThoughtPublicClip & { title: string; prompt: string }) | null
> {
  const challenge = await prisma.thoughtChallenge.findUnique({
    where: { shareToken: token },
  })
  if (!challenge) return null
  const submission = await prisma.thoughtSubmission.findFirst({
    where: { id: submissionId, challengeId: challenge.id },
  })
  if (!submission) return null
  if (
    !classCanWatch({
      challengeStatus: challenge.status,
      showGallery: challenge.showGallery,
      submissionStatus: submission.status,
    })
  ) {
    return null
  }
  const dto = toSubmissionDto(submission)
  if (!dto) return null
  return { ...toPublicClip(dto), title: challenge.title, prompt: challenge.prompt }
}

export async function findClassAudio(
  token: string,
  submissionId: string
): Promise<{ audioPath: string; mimeType: string } | null> {
  const challenge = await prisma.thoughtChallenge.findUnique({
    where: { shareToken: token },
  })
  if (!challenge) return null
  const submission = await prisma.thoughtSubmission.findFirst({
    where: { id: submissionId, challengeId: challenge.id },
  })
  if (!submission) return null
  if (
    !classCanWatch({
      challengeStatus: challenge.status,
      showGallery: challenge.showGallery,
      submissionStatus: submission.status,
    })
  ) {
    return null
  }
  return { audioPath: submission.audioPath, mimeType: submission.mimeType }
}

export async function findOwnedAudio(
  authorId: string,
  challengeId: string,
  submissionId: string
): Promise<{ audioPath: string; mimeType: string } | null> {
  const submission = await prisma.thoughtSubmission.findFirst({
    where: { id: submissionId, challengeId, challenge: { authorId } },
  })
  if (!submission) return null
  return { audioPath: submission.audioPath, mimeType: submission.mimeType }
}
