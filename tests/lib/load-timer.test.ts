import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  clearLoadTimer,
  formatLoadTimerMs,
  getLoadTimerSnapshot,
  markPlayable,
  startLoadTimer,
} from '@/lib/load-timer';

describe('load-timer', () => {
  beforeEach(() => {
    clearLoadTimer();
    vi.stubGlobal('performance', { now: () => 1000 });
  });

  it('starts a run for a quiz id', () => {
    const snap = startLoadTimer('quiz-1');
    expect(snap.quizId).toBe('quiz-1');
    expect(getLoadTimerSnapshot()?.quizId).toBe('quiz-1');
    expect(getLoadTimerSnapshot()?.elapsedMs).toBeUndefined();
  });

  it('freezes elapsed once on markPlayable', () => {
    startLoadTimer('quiz-1');
    vi.stubGlobal('performance', { now: () => 2500 });
    const frozen = markPlayable();
    expect(frozen?.elapsedMs).toBe(1500);
    expect(markPlayable()).toBeNull();
    expect(getLoadTimerSnapshot()?.elapsedMs).toBe(1500);
  });

  it('formats ms and seconds', () => {
    expect(formatLoadTimerMs(850)).toBe('850ms');
    expect(formatLoadTimerMs(1500)).toBe('1.5s');
  });
});
