const PREFIX = 'playtoz-homework-try:'

type StorableTry = {
  attemptId: string
  mode: string
  status: string
  studentName: string
  questions: { id: string }[]
  selections: { questionId: string; selectedAnswer: string }[]
  startedAt: string
}

type StoredTry<T> = {
  dirty: boolean
  clientKey: string
  play: T
}

function storageKey(token: string): string {
  return `${PREFIX}${token}`
}

export function readHomeworkTry<T extends StorableTry>(token: string, clientKey: string): StoredTry<T> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(token))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredTry<T>
    if (parsed.clientKey !== clientKey) return null
    if (parsed.play?.mode !== 'HOMEWORK' || parsed.play.status !== 'IN_PROGRESS') return null
    if (!Array.isArray(parsed.play.questions) || parsed.play.questions.length === 0) return null
    if (!parsed.play.startedAt) parsed.play.startedAt = new Date().toISOString()
    return parsed
  } catch {
    return null
  }
}

export function rememberHomeworkTry<T extends StorableTry>(token: string, play: T, clientKey: string, dirty: boolean): void {
  const next: StoredTry<T> = { dirty, clientKey, play }
  window.localStorage.setItem(storageKey(token), JSON.stringify(next))
}

export function clearHomeworkTry(token: string): void {
  window.localStorage.removeItem(storageKey(token))
}

/** One database write for the answers stored on this device. */
export async function flushHomeworkTry<T extends StorableTry>(token: string, clientKey: string, submit: boolean): Promise<T | null> {
  const stored = readHomeworkTry<T>(token, clientKey)
  if (!stored) return null
  if (!submit && !stored.dirty) return stored.play
  if (!submit && stored.play.selections.length === 0) return stored.play
  const play = stored.play
  const body = {
    studentName: play.studentName,
    clientKey,
    questionIds: play.questions.map((question) => question.id),
    selections: play.selections,
    startedAt: play.startedAt,
    submit,
  }
  stored.dirty = false
  window.localStorage.setItem(storageKey(token), JSON.stringify(stored))
  const response = await fetch(`/api/homework-session/${token}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    stored.dirty = true
    window.localStorage.setItem(storageKey(token), JSON.stringify(stored))
    throw new Error(typeof payload?.error === 'string' ? payload.error : 'That homework could not be saved.')
  }
  const saved = (payload.data ?? payload) as T
  if (submit || saved.status === 'FINISHED') clearHomeworkTry(token)
  else rememberHomeworkTry(token, { ...play, attemptId: saved.attemptId, startedAt: saved.startedAt || play.startedAt }, clientKey, false)
  return saved
}
