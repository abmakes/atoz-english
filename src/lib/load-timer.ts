const STORAGE_KEY = 'atoz-load-timer';
export const FIRST_QUESTION_READY_EVENT = 'atoz:first-question-ready';

export type LoadTimerSnapshot = {
  quizId: string;
  /** performance.now() at catalog click */
  t0: number;
  /** Date.now() at catalog click (survives soft nav / refresh within session) */
  wallT0: number;
  /** Frozen elapsed ms once playable; unset while running */
  elapsedMs?: number;
  /** True when first question had no media */
  noMedia?: boolean;
};

/** In-memory fallback when sessionStorage is unavailable (e.g. Vitest node). */
let memorySnapshot: LoadTimerSnapshot | null = null;

function read(): LoadTimerSnapshot | null {
  if (typeof window === 'undefined') return memorySnapshot;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return memorySnapshot;
    return JSON.parse(raw) as LoadTimerSnapshot;
  } catch {
    return memorySnapshot;
  }
}

function write(snapshot: LoadTimerSnapshot | null): void {
  memorySnapshot = snapshot;
  if (typeof window === 'undefined') return;
  try {
    if (!snapshot) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota / private mode — memorySnapshot still holds state
  }
}

export function isLoadTimerEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_LOAD_TIMER === 'true';
}

/** Start (or restart) the click→playable timer for a catalog quiz selection. */
export function startLoadTimer(quizId: string): LoadTimerSnapshot {
  const snapshot: LoadTimerSnapshot = {
    quizId,
    t0: typeof performance !== 'undefined' ? performance.now() : 0,
    wallT0: Date.now(),
  };
  write(snapshot);
  return snapshot;
}

export function getLoadTimerSnapshot(): LoadTimerSnapshot | null {
  return read();
}

export function clearLoadTimer(): void {
  write(null);
}

/**
 * Freeze elapsed once when the first question is playable.
 * Returns the snapshot if this call froze it; null if already frozen or no run.
 */
export function markPlayable(options?: { noMedia?: boolean }): LoadTimerSnapshot | null {
  const current = read();
  if (!current) return null;
  if (typeof current.elapsedMs === 'number') return null;

  const now =
    typeof performance !== 'undefined' && current.t0 > 0
      ? performance.now()
      : Date.now();
  const elapsedMs =
    typeof performance !== 'undefined' && current.t0 > 0
      ? Math.max(0, Math.round(now - current.t0))
      : Math.max(0, Math.round(Date.now() - current.wallT0));

  const next: LoadTimerSnapshot = {
    ...current,
    elapsedMs,
    noMedia: options?.noMedia ?? false,
  };
  write(next);
  return next;
}

/** Pixi → React bridge; safe to call repeatedly (markPlayable is once-only). */
export function signalFirstQuestionReady(options?: { noMedia?: boolean }): void {
  if (typeof window === 'undefined') return;
  if (!isLoadTimerEnabled()) return;
  const frozen = markPlayable(options);
  if (!frozen) return;
  window.dispatchEvent(
    new CustomEvent(FIRST_QUESTION_READY_EVENT, {
      detail: frozen,
    })
  );
}

export function formatLoadTimerMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
