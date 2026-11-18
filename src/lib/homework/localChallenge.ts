const PREFIX = 'playtoz-challenge-try:'

type StorableTry = {
  attemptId: string
  mode: string
  status: string
  studentName: string
  questions: { id: string }[]
  selections: { questionId: string; selectedAnswer: string }[]
  startedAt: string
  queue: string[]
  currentQuestionId: string | null
}

export type ChallengeEvent = {
  questionId: string
  selectedAnswer: string
  timedOut: boolean
  timeUsedMs: number
}

type StoredTry<T> = {
  clientKey: string
  play: T
  events: ChallengeEvent[]
}

function storageKey(token: string): string {
  return `${PREFIX}${token}`
}

export function readChallengeTry<T extends StorableTry>(token: string, clientKey: string): StoredTry<T> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(token))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredTry<T>
    if (parsed.clientKey !== clientKey) return null
    if (parsed.play?.mode !== 'CHALLENGE') return null
    if (!Array.isArray(parsed.play.questions) || parsed.play.questions.length === 0) return null
    if (!Array.isArray(parsed.play.queue) || !Array.isArray(parsed.events)) return null
    if (!parsed.play.startedAt) parsed.play.startedAt = new Date().toISOString()
    return parsed
  } catch {
    return null
  }
}

export function rememberChallengeTry<T extends StorableTry>(
  token: string,
  play: T,
  events: ChallengeEvent[],
  clientKey: string
): void {
  const next: StoredTry<T> = { clientKey, play, events }
  window.localStorage.setItem(storageKey(token), JSON.stringify(next))
}

export function clearChallengeTry(token: string): void {
  window.localStorage.removeItem(storageKey(token))
}

const inflight = new Map<string, Promise<unknown>>()

/** One database write for a finished challenge run. */
export async function submitChallengeTry<T extends StorableTry>(token: string, clientKey: string): Promise<T | null> {
  const pending = inflight.get(storageKey(token))
  if (pending) return pending as Promise<T | null>
  const promise = postChallengeTry<T>(token, clientKey)
  inflight.set(storageKey(token), promise)
  try {
    return await promise
  } finally {
    inflight.delete(storageKey(token))
  }
}

async function postChallengeTry<T extends StorableTry>(token: string, clientKey: string): Promise<T | null> {
  const stored = readChallengeTry<T>(token, clientKey)
  if (!stored || stored.play.status !== 'FINISHED' || stored.events.length === 0) return null
  const response = await fetch(`/api/homework-session/${token}/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: stored.play.studentName,
      clientKey,
      startedAt: stored.play.startedAt,
      events: stored.events,
    }),
    keepalive: true,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof payload?.error === 'string' ? payload.error : 'That challenge could not be saved.')
  }
  clearChallengeTry(token)
  return (payload.data ?? payload) as T
}
