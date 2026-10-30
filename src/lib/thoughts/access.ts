export type ChallengeStatus = 'DRAFT' | 'READY' | 'ARCHIVED'

export type SubmissionStatus = 'SUBMITTED' | 'APPROVED' | 'HIDDEN'

export function classLinkOpen(status: ChallengeStatus): boolean {
  return status === 'READY'
}

export function submissionsAccepted(
  status: ChallengeStatus,
  acceptingResponses: boolean
): boolean {
  return status === 'READY' && acceptingResponses
}

export function classCanWatch(input: {
  challengeStatus: ChallengeStatus
  showGallery: boolean
  submissionStatus: SubmissionStatus
}): boolean {
  return (
    input.challengeStatus === 'READY' &&
    input.showGallery &&
    input.submissionStatus === 'APPROVED'
  )
}
