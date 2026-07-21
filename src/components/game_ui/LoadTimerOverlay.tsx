'use client';

import { useEffect, useState } from 'react';
import {
  FIRST_QUESTION_READY_EVENT,
  clearLoadTimer,
  formatLoadTimerMs,
  getLoadTimerSnapshot,
  isLoadTimerEnabled,
  type LoadTimerSnapshot,
} from '@/lib/load-timer';

/**
 * Temporary top-left probe: catalog quiz click → first playable question.
 * Gated by NEXT_PUBLIC_SHOW_LOAD_TIMER=true.
 */
export default function LoadTimerOverlay() {
  const enabled = isLoadTimerEnabled();
  const [snapshot, setSnapshot] = useState<LoadTimerSnapshot | null>(null);
  const [now, setNow] = useState(() =>
    typeof performance !== 'undefined' ? performance.now() : Date.now()
  );

  useEffect(() => {
    if (!enabled) return;

    const refresh = () => setSnapshot(getLoadTimerSnapshot());
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'atoz-load-timer') refresh();
    };
    const onReady = () => refresh();

    window.addEventListener('storage', onStorage);
    window.addEventListener(FIRST_QUESTION_READY_EVENT, onReady);
    // Same-tab start writes sessionStorage without a storage event — poll lightly while on games
    const poll = window.setInterval(refresh, 250);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(FIRST_QUESTION_READY_EVENT, onReady);
      window.clearInterval(poll);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !snapshot || typeof snapshot.elapsedMs === 'number') return;
    const id = window.setInterval(() => {
      setNow(typeof performance !== 'undefined' ? performance.now() : Date.now());
    }, 100);
    return () => window.clearInterval(id);
  }, [enabled, snapshot]);

  if (!enabled || !snapshot) return null;

  const running = typeof snapshot.elapsedMs !== 'number';
  const elapsed = running
    ? Math.max(0, Math.round(now - snapshot.t0))
    : snapshot.elapsedMs!;

  return (
    <div
      className="fixed top-2 left-2 z-[9999] max-w-[14rem] rounded-lg border-2 border-[#1E5167] bg-white/95 px-3 py-2 shadow-[3px_3px_0px_0px_#1E5167] grandstander text-[#114257]"
      role="status"
      aria-live="polite"
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
        Load probe
      </div>
      <div className="text-lg font-black leading-tight">
        {running ? formatLoadTimerMs(elapsed) : `Playable in ${formatLoadTimerMs(elapsed)}`}
      </div>
      <div className="text-[11px] opacity-80 mt-0.5">
        {running
          ? 'Click → first question…'
          : snapshot.noMedia
            ? 'Stopped (no media)'
            : 'Stopped at question + media'}
      </div>
      <button
        type="button"
        className="mt-1 text-[11px] font-semibold underline"
        onClick={() => {
          clearLoadTimer();
          setSnapshot(null);
        }}
      >
        Reset
      </button>
    </div>
  );
}
