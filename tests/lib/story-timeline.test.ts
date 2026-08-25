import { describe, expect, it } from 'vitest'
import {
  buildStoryTimeline,
  cameraAt,
  END_MS,
  PANEL_LEAD_MS,
  PANEL_TAIL_MS,
  TITLE_MS,
  TRANSITION_MS,
} from '@/lib/stories/timeline'

const CLIPS = [3000, 5000, 2000, 4000]

describe('buildStoryTimeline', () => {
  it('produces title, 4 panels, 3 transitions, and an end card in order', () => {
    const timeline = buildStoryTimeline(CLIPS)
    const kinds = timeline.segments.map((segment) => segment.kind)
    expect(kinds).toEqual([
      'title',
      'panel',
      'transition',
      'panel',
      'transition',
      'panel',
      'transition',
      'panel',
      'end',
    ])
  })

  it('segments are contiguous and total duration adds up', () => {
    const timeline = buildStoryTimeline(CLIPS)
    for (let i = 1; i < timeline.segments.length; i++) {
      expect(timeline.segments[i].startMs).toBe(timeline.segments[i - 1].endMs)
    }
    const expectedTotal =
      TITLE_MS +
      CLIPS.reduce((sum, clip) => sum + clip + PANEL_LEAD_MS + PANEL_TAIL_MS, 0) +
      3 * TRANSITION_MS +
      END_MS
    expect(timeline.totalMs).toBe(expectedTotal)
  })

  it('audio starts after the camera settles on each panel', () => {
    const timeline = buildStoryTimeline(CLIPS)
    expect(timeline.audioStarts).toHaveLength(4)
    const panelSegments = timeline.segments.filter((s) => s.kind === 'panel')
    panelSegments.forEach((segment, index) => {
      expect(timeline.audioStarts[index]).toBe(segment.startMs + PANEL_LEAD_MS)
      expect(timeline.audioStarts[index] + CLIPS[index]).toBeLessThanOrEqual(
        segment.endMs
      )
    })
  })
})

describe('cameraAt', () => {
  const timeline = buildStoryTimeline(CLIPS)

  it('shows the title card at t=0, focused on the first panel', () => {
    const camera = cameraAt(timeline, 0, 4)
    expect(camera.focus).toBe(0)
    expect(camera.titleAlpha).toBe(1)
    expect(camera.endAlpha).toBe(0)
  })

  it('centers each panel during its segment', () => {
    const panelSegments = timeline.segments.filter((s) => s.kind === 'panel')
    panelSegments.forEach((segment, index) => {
      const mid = (segment.startMs + segment.endMs) / 2
      const camera = cameraAt(timeline, mid, 4)
      expect(camera.focus).toBe(index)
      expect(camera.zoom).toBeGreaterThan(1)
      expect(camera.titleAlpha).toBe(0)
    })
  })

  it('pans between panels during transitions', () => {
    const transition = timeline.segments.find((s) => s.kind === 'transition')!
    const mid = (transition.startMs + transition.endMs) / 2
    const camera = cameraAt(timeline, mid, 4)
    expect(camera.focus).toBeGreaterThan(0)
    expect(camera.focus).toBeLessThan(1)
  })

  it('zooms out and shows the end card at the finale', () => {
    const camera = cameraAt(timeline, timeline.totalMs - 1, 4)
    expect(camera.endAlpha).toBeGreaterThan(0.9)
    expect(camera.zoom).toBeLessThan(0.5)
    expect(camera.focus).toBeCloseTo(1.5, 1)
  })

  it('never returns NaN across the whole timeline', () => {
    for (let t = 0; t <= timeline.totalMs; t += 97) {
      const camera = cameraAt(timeline, t, 4)
      expect(Number.isFinite(camera.focus)).toBe(true)
      expect(Number.isFinite(camera.zoom)).toBe(true)
    }
  })
})
