/**
 * Deterministic movie timeline for the story player.
 * Given the four clip durations, every camera value at time t is a pure
 * function — which keeps playback dumb and makes offline export possible.
 */

export const TITLE_MS = 2800;
export const TRANSITION_MS = 900;
export const PANEL_LEAD_MS = 350;
export const PANEL_TAIL_MS = 500;
export const END_MS = 3500;

export interface TimelineSegment {
  kind: 'title' | 'panel' | 'transition' | 'end';
  startMs: number;
  endMs: number;
  /** For 'panel' segments. */
  panelIndex?: number;
  /** For 'transition' segments. */
  fromIndex?: number;
  toIndex?: number;
}

export interface StoryTimeline {
  segments: TimelineSegment[];
  totalMs: number;
  /** Absolute time each panel's audio clip should start, by panel index. */
  audioStarts: number[];
}

export function buildStoryTimeline(clipDurationsMs: number[]): StoryTimeline {
  const segments: TimelineSegment[] = [];
  const audioStarts: number[] = [];
  let cursor = 0;

  segments.push({ kind: 'title', startMs: 0, endMs: TITLE_MS });
  cursor = TITLE_MS;

  clipDurationsMs.forEach((duration, index) => {
    if (index > 0) {
      segments.push({
        kind: 'transition',
        startMs: cursor,
        endMs: cursor + TRANSITION_MS,
        fromIndex: index - 1,
        toIndex: index,
      });
      cursor += TRANSITION_MS;
    }

    const panelLength = PANEL_LEAD_MS + duration + PANEL_TAIL_MS;
    segments.push({
      kind: 'panel',
      startMs: cursor,
      endMs: cursor + panelLength,
      panelIndex: index,
    });
    audioStarts.push(cursor + PANEL_LEAD_MS);
    cursor += panelLength;
  });

  segments.push({ kind: 'end', startMs: cursor, endMs: cursor + END_MS });
  cursor += END_MS;

  return { segments, totalMs: cursor, audioStarts };
}

export interface CameraState {
  /** Continuous panel position the camera is centered on (0..panelCount-1). */
  focus: number;
  /** Zoom factor: 1 = one panel fills the frame height budget. */
  zoom: number;
  /** Opacity of the title card overlay (0-1). */
  titleAlpha: number;
  /** Opacity of the end card overlay (0-1). */
  endAlpha: number;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Ken Burns: alternate zoom-in / zoom-out per panel so it never feels static. */
function panelZoomRange(index: number): { from: number; to: number } {
  return index % 2 === 0
    ? { from: 1.04, to: 1.16 }
    : { from: 1.16, to: 1.04 };
}

export function cameraAt(
  timeline: StoryTimeline,
  tMs: number,
  panelCount: number
): CameraState {
  const t = Math.min(tMs, timeline.totalMs - 1);
  const segment =
    timeline.segments.find((s) => t >= s.startMs && t < s.endMs) ??
    timeline.segments[timeline.segments.length - 1];
  const progress = clamp01((t - segment.startMs) / (segment.endMs - segment.startMs));

  switch (segment.kind) {
    case 'title': {
      const { from } = panelZoomRange(0);
      return {
        focus: 0,
        zoom: 0.98 + 0.02 * easeInOut(progress) * (from / 1),
        titleAlpha: progress > 0.82 ? clamp01(1 - (progress - 0.82) / 0.18) : 1,
        endAlpha: 0,
      };
    }
    case 'panel': {
      const index = segment.panelIndex ?? 0;
      const { from, to } = panelZoomRange(index);
      return {
        focus: index,
        zoom: from + (to - from) * progress,
        titleAlpha: 0,
        endAlpha: 0,
      };
    }
    case 'transition': {
      const fromIndex = segment.fromIndex ?? 0;
      const toIndex = segment.toIndex ?? 1;
      const eased = easeInOut(progress);
      const zoomFrom = panelZoomRange(fromIndex).to;
      const zoomTo = panelZoomRange(toIndex).from;
      // Pull back slightly mid-pan for a more cinematic sweep.
      const pullBack = Math.sin(eased * Math.PI) * 0.1;
      return {
        focus: fromIndex + (toIndex - fromIndex) * eased,
        zoom: zoomFrom + (zoomTo - zoomFrom) * eased - pullBack,
        titleAlpha: 0,
        endAlpha: 0,
      };
    }
    case 'end': {
      const eased = easeInOut(clamp01(progress / 0.6));
      const lastIndex = panelCount - 1;
      const stripCenter = (panelCount - 1) / 2;
      const zoomFrom = panelZoomRange(lastIndex).to;
      return {
        // Zoom out to reveal the whole filmstrip for the credits.
        focus: lastIndex + (stripCenter - lastIndex) * eased,
        zoom: zoomFrom + (0.3 - zoomFrom) * eased,
        titleAlpha: 0,
        endAlpha: clamp01((progress - 0.25) / 0.3),
      };
    }
  }
}
