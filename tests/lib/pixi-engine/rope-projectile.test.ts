import { describe, it, expect } from 'vitest'
import {
  angleToward,
  distance,
  easeInQuad,
  easeOutQuad,
  lerpVec,
  sampleRope,
  timingToPhase,
  totalRopeDurationMs,
} from '@/lib/pixi-engine/fx/ropeProjectileMath'

const A = { x: 0, y: 0 }
const B = { x: 100, y: 0 }

describe('ropeProjectileMath basics', () => {
  it('lerps and distances', () => {
    expect(lerpVec(A, B, 0)).toEqual(A)
    expect(lerpVec(A, B, 1)).toEqual(B)
    expect(lerpVec(A, B, 0.5)).toEqual({ x: 50, y: 0 })
    expect(distance(A, B)).toBe(100)
    expect(angleToward(A, B)).toBeCloseTo(0)
  })

  it('eases stay in 0–1', () => {
    expect(easeOutQuad(0)).toBe(0)
    expect(easeOutQuad(1)).toBe(1)
    expect(easeInQuad(0)).toBe(0)
    expect(easeInQuad(1)).toBe(1)
    expect(easeOutQuad(0.5)).toBeGreaterThan(0.5)
    expect(easeInQuad(0.5)).toBeLessThan(0.5)
  })
})

describe('timingToPhase', () => {
  const timing = {
    extendDurationMs: 200,
    holdDurationMs: 100,
    retractDurationMs: 300,
  }

  it('walks extend → hold → retract → done', () => {
    expect(timingToPhase(0, timing).phase).toBe('extending')
    expect(timingToPhase(100, timing).phase).toBe('extending')
    expect(timingToPhase(100, timing).phaseT).toBeCloseTo(0.5)

    expect(timingToPhase(200, timing).phase).toBe('holding')
    expect(timingToPhase(250, timing).phase).toBe('holding')

    expect(timingToPhase(300, timing).phase).toBe('retracting')
    expect(timingToPhase(450, timing).phaseT).toBeCloseTo(0.5)

    const done = timingToPhase(600, timing)
    expect(done.phase).toBe('done')
    expect(done.totalDone).toBe(true)
  })

  it('total duration matches sum', () => {
    expect(totalRopeDurationMs(timing)).toBe(600)
  })
})

describe('sampleRope', () => {
  it('keeps tip at front while extending (length grows with u)', () => {
    const mid = sampleRope({
      phase: 'extending',
      phaseT: 0.5,
      pointA: A,
      pointB: B,
      easeExtend: (t) => t,
    })
    expect(mid.tip.x).toBeCloseTo(50)
    expect(mid.length).toBeCloseTo(50)
    expect(mid.u).toBeCloseTo(0.5)
    // Tip is between A and B — body is A→tip, so tip is the front
    expect(mid.tip.x).toBeGreaterThan(A.x)
    expect(mid.tip.x).toBeLessThan(B.x)
  })

  it('holds tip at B', () => {
    const hold = sampleRope({
      phase: 'holding',
      phaseT: 0.5,
      pointA: A,
      pointB: B,
    })
    expect(hold.tip).toEqual(B)
    expect(hold.length).toBeCloseTo(100)
    expect(hold.u).toBe(1)
  })

  it('retracts tip toward A when not attached', () => {
    const mid = sampleRope({
      phase: 'retracting',
      phaseT: 0.5,
      pointA: A,
      pointB: B,
      tipFollowsB: false,
      easeRetract: (t) => t,
    })
    expect(mid.tip.x).toBeCloseTo(50)
    expect(mid.length).toBeCloseTo(50)
    expect(mid.u).toBeCloseTo(0.5)
  })

  it('keeps tip on B when pullTargetDuringRetract (attached)', () => {
    const pulledB = { x: 40, y: 0 }
    const sample = sampleRope({
      phase: 'retracting',
      phaseT: 0.5,
      pointA: A,
      pointB: pulledB,
      tipFollowsB: true,
    })
    expect(sample.tip).toEqual(pulledB)
    expect(sample.length).toBeCloseTo(40)
  })

  it('faces along travel while extending', () => {
    const sample = sampleRope({
      phase: 'extending',
      phaseT: 0.3,
      pointA: A,
      pointB: { x: 0, y: 100 },
      easeExtend: (t) => t,
    })
    expect(sample.rotation).toBeCloseTo(Math.PI / 2)
  })
})
